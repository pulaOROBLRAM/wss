import tensorflow as tf
import numpy as np
from PIL import Image, UnidentifiedImageError
from io import BytesIO
import logging
import json
import os

class PredictionService:
    def __init__(self, model_path='saved_model/third', 
                 class_indices_path='saved_model/third/class_indices.json',
                 labels_txt_path='saved_model/third/labels.txt',
                 preprocess_mode: str = 'auto'):
        self.logger = logging.getLogger(__name__)
        self.model = self._load_model(model_path)
        self.class_names = self._load_class_names(class_indices_path, labels_txt_path)
        self.preprocess_mode = 'efficientnet'
        self.signature_input_key = self._resolve_signature_input_key(self.model)
        try:
            self.logger.info(f"PredictionService initialized: preprocess={self.preprocess_mode}, signature_key={self.signature_input_key}")
        except Exception:
            pass

    def _resolve_preprocess_mode(self, mode: str, model_path: str) -> str:
        mode = (mode or 'auto').lower()
        if mode != 'auto':
            return mode

        try:
            if os.path.isdir(model_path) and any(
                os.path.exists(os.path.join(model_path, fname)) for fname in ('keras_metadata.pb', 'fingerprint.pb')
            ):
                return 'resnet_v2'
        except Exception:
            pass
        return 'scale01'
    
    def _load_model(self, model_path):
        # First try to load as a complete Keras model
        try:
            return tf.keras.models.load_model(model_path)
        except (ValueError, IOError) as e:
            self.logger.warning(f"Keras load failed: {e}")
        
        # Try to load from custom format (architecture + weights)
        try:
            # Check for model_architecture.json and model_weights.h5
            arch_path = os.path.join(model_path, 'model_architecture.json')
            weights_path = os.path.join(model_path, 'model_weights.h5')
            
            if os.path.exists(arch_path) and os.path.exists(weights_path):
                return self._load_custom_model(arch_path, weights_path)
        except Exception as e:
            self.logger.warning(f"Custom model load failed: {e}")
        
        # Try to load from config.json format
        if os.path.exists(os.path.join(model_path, 'config.json')):
            try:
                with open(os.path.join(model_path, 'config.json')) as f:
                    config = json.load(f)
                model = tf.keras.models.model_from_config(config)
                model.load_weights(os.path.join(model_path, 'weights.h5'))
                return model
            except Exception as e:
                self.logger.warning(f"Config load failed: {e}")
        
        # Try SavedModel format
        try:
            loaded = tf.saved_model.load(model_path)
            if 'serving_default' in loaded.signatures:
                return loaded.signatures['serving_default']
            raise ValueError("No serving signature found")
        except Exception as e:
            self.logger.error(f"All load attempts failed: {e}")
            raise RuntimeError("Could not load model with any method")
    
    def _load_custom_model(self, arch_path, weights_path):
        """Load model from custom architecture and weights files"""
        from tensorflow.keras.applications import EfficientNetB0
        from tensorflow.keras import layers, models
        
        with open(arch_path, 'r') as f:
            arch_info = json.load(f)
        
        base_model = EfficientNetB0(
            weights='imagenet',
            include_top=False,
            input_shape=tuple(arch_info['input_shape'])
        )
        base_model.trainable = arch_info['base_trainable']
        
        model = models.Sequential([
            base_model,
            layers.GlobalAveragePooling2D(),
            layers.Dropout(arch_info['dropout_rate']),
            layers.Dense(arch_info['dense_units'], activation='relu'),
            layers.Dropout(arch_info['dropout_rate']),
            layers.Dense(arch_info['num_classes'], activation='softmax')
        ])
        
        model.load_weights(weights_path)
        
        model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model

    def _extract_probs(self, raw_output):
        if isinstance(raw_output, np.ndarray):
            probs = raw_output
        elif isinstance(raw_output, dict):
            tensor = None
            for key in ('probabilities', 'predictions', 'outputs', 'output_0', 'Identity'):  # common TF names
                if key in raw_output:
                    tensor = raw_output[key]
                    break
            if tensor is None:
                tensor = next(iter(raw_output.values()))
            probs = tensor.numpy()
        elif tf.is_tensor(raw_output):
            probs = raw_output.numpy()
        else:
            raise ValueError("Unsupported model output type")

        if probs.ndim == 2 and probs.shape[0] == 1:
            probs = probs[0]
        return probs

    def _resolve_signature_input_key(self, model_obj):
        if isinstance(model_obj, tf.keras.Model):
            return None
        try:
            sig = getattr(model_obj, 'structured_input_signature', None)
            if sig and isinstance(sig, tuple) and len(sig) == 2:
                arg_dict = sig[1]
                if isinstance(arg_dict, dict) and arg_dict:
                    return sorted(arg_dict.keys())[0]
        except Exception:
            pass
        return 'inputs'

    def _predict_raw(self, processed_img):
        if isinstance(self.model, tf.keras.Model):
            return self.model.predict(processed_img, verbose=0)
        key = self.signature_input_key or 'inputs'
        try:
            return self.model(**{key: processed_img})
        except TypeError:
            for alt in ('input_1', 'input', 'image', 'images', 'x'):
                try:
                    return self.model(**{alt: processed_img})
                except TypeError:
                    continue
        return self.model(processed_img)

    def _load_class_names(self, json_path, labels_txt_path):
        # Try json
        try:
            if os.path.exists(json_path):
                with open(json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                if isinstance(data, dict):
                    keys = list(data.keys())
                    if all(str(k).isdigit() for k in keys):
                        pairs = sorted(((int(k), v) for k, v in data.items()), key=lambda x: x[0])
                        return [name for _, name in pairs]
                    else:
                        indices = [int(v) for v in data.values()]
                        size = max(indices) + 1 if indices else 0
                        names = [None] * size
                        for name, idx in data.items():
                            names[int(idx)] = name
                        return [n for n in names if n is not None]
        except Exception as e:
            self.logger.warning(f"Failed to parse class indices JSON: {e}")

        try:
            if os.path.exists(labels_txt_path):
                index_to_name = {}
                with open(labels_txt_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        raw = line.strip()
                        if not raw:
                            continue
                        parts = raw.split(maxsplit=1)
                        if parts and parts[0].isdigit():
                            idx = int(parts[0])
                            name = parts[1].strip() if len(parts) > 1 else str(idx)
                            index_to_name[idx] = name
                        else:
                            index_to_name[len(index_to_name)] = raw

                if index_to_name:
                    return [name for _, name in sorted(index_to_name.items(), key=lambda x: x[0])]
        except Exception as e:
            self.logger.error(f"Failed to load class names from labels.txt: {e}")

        raise RuntimeError("No valid class label source found. Provide class_indices.json or labels.txt.")

    def _validate_image(self, image_data):
        try:
            img = Image.open(BytesIO(image_data))
            img.verify()
            return True
        except (UnidentifiedImageError, IOError) as e:
            self.logger.error(f"Invalid image: {e}")
            return False

    def preprocess_image(self, image_data):
        try:
            if not self._validate_image(image_data):
                raise ValueError("Invalid image data")

            img = Image.open(BytesIO(image_data)).convert('RGB').resize((224, 224))
            img_array = tf.keras.preprocessing.image.img_to_array(img)
            img_array = tf.expand_dims(img_array, 0)
            mode = self.preprocess_mode
            if mode == 'efficientnet':
                return tf.keras.applications.efficientnet.preprocess_input(tf.cast(img_array, tf.float32))
            if mode == 'resnet_v2':
                return tf.keras.applications.resnet_v2.preprocess_input(tf.cast(img_array, tf.float32))
            if mode == 'scale01':
                return tf.cast(img_array, tf.float32) / 255.0
            # 'none'
            return tf.cast(img_array, tf.float32)
        except Exception as e:
            self.logger.error(f"Preprocessing failed: {e}")
            raise

    def predict(self, image_data):
        try:
            if not image_data:
                raise ValueError("Empty image data provided")

            processed_img = self.preprocess_image(image_data)

            raw = self._predict_raw(processed_img)

            preds = self._extract_probs(raw)

            result = {
                "success": True,
                "predictions": {self.class_names[i]: float(p) for i, p in enumerate(preds)},
                "top_prediction": self.class_names[np.argmax(preds)],
                "confidence": float(np.max(preds))
            }
            return result
        except Exception as e:
            self.logger.error(f"Prediction error: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "message": "Error analyzing image. Please try again."
            }