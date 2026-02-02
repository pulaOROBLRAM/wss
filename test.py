import argparse
import json
import os
import sys

import numpy as np
import tensorflow as tf
from PIL import Image
from tensorflow.keras.applications import efficientnet
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing import image_dataset_from_directory

try:
    from training_config import get_val_dir, DATASET_DIR, SAVED_MODEL_DIR, IMG_SIZE, BATCH_SIZE
    DEFAULT_VAL_DIR = get_val_dir()
except ImportError:
    DEFAULT_VAL_DIR = None
    IMG_SIZE = (224, 224)
    BATCH_SIZE = 16

MODELS_DIR = "models"

def _load_custom_model(model_dir: str):
    """Load model from model_architecture.json + model_weights.h5 (same as services.py)."""
    arch_path = os.path.join(model_dir, "model_architecture.json")
    weights_path = os.path.join(model_dir, "model_weights.h5")
    if not os.path.exists(arch_path) or not os.path.exists(weights_path):
        raise FileNotFoundError(
            f"Model files not found in {model_dir}. Need model_architecture.json and model_weights.h5."
        )
    with open(arch_path, "r") as f:
        arch_info = json.load(f)
    base_model = EfficientNetB0(
        weights="imagenet",
        include_top=False,
        input_shape=tuple(arch_info["input_shape"]),
    )
    base_model.trainable = arch_info["base_trainable"]
    model = models.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dropout(arch_info["dropout_rate"]),
        layers.Dense(arch_info["dense_units"], activation="relu"),
        layers.Dropout(arch_info["dropout_rate"]),
        layers.Dense(arch_info["num_classes"], activation="softmax"),
    ])
    model.load_weights(weights_path)
    model.compile(
        optimizer="adam",
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def _load_class_indices(model_dir: str):
    path = os.path.join(model_dir, "class_indices.json")
    if not os.path.exists(path):
        return None
    with open(path, "r") as f:
        return json.load(f)


def _get_class_names_list(class_indices: dict):
    """Return class names in index order (0, 1, ...)."""
    if not class_indices:
        return []
    return [class_indices[str(i)] for i in range(len(class_indices))]


def evaluate_model(model_dir: str, test_dir: str, batch_size: int = BATCH_SIZE, img_size: tuple = IMG_SIZE):
    """Load model from model_dir and run evaluation on test_dir (a1test-style structure)."""
    model = _load_custom_model(model_dir)
    class_indices = _load_class_indices(model_dir)
    class_names = _get_class_names_list(class_indices)

    val_ds = image_dataset_from_directory(
        test_dir,
        labels="inferred",
        label_mode="categorical",
        batch_size=batch_size,
        image_size=img_size,
        shuffle=False,
    )
    # Align class names with dataset; dataset uses its own order
    ds_class_names = val_ds.class_names
    if class_names and set(class_names) != set(ds_class_names):
        print(
            f"Warning: Model classes {class_names} differ from dataset classes {ds_class_names}. "
            "Using dataset class order for evaluation."
        )

    def preprocess(x, y):
        x = efficientnet.preprocess_input(x)
        return x, y

    val_ds = val_ds.map(preprocess, num_parallel_calls=tf.data.AUTOTUNE)
    val_ds = val_ds.cache().prefetch(buffer_size=tf.data.AUTOTUNE)

    print(f"Evaluating model from {model_dir} on {test_dir} ...")
    results = model.evaluate(val_ds)
    if isinstance(results, list):
        loss, acc = results[0], results[1]
    else:
        loss, acc = results, None
    print(f"Loss: {loss:.4f}")
    if acc is not None:
        print(f"Accuracy: {acc:.4f}")
    return results


def _preprocess_image_center_crop(image_path: str, img_size: tuple = IMG_SIZE):
    """Load image and apply same preprocessing as API: center crop to img_size (resize up if smaller)."""
    target_w, target_h = img_size
    img = Image.open(image_path).convert("RGB")
    w, h = img.size
    if w < target_w or h < target_h:
        scale = target_w / min(w, h)
        new_w, new_h = int(round(w * scale)), int(round(h * scale))
        img = img.resize((new_w, new_h), getattr(Image, "Resampling", Image).LANCZOS)
        w, h = img.size
    left = (w - target_w) // 2
    top = (h - target_h) // 2
    img = img.crop((left, top, left + target_w, top + target_h))
    arr = tf.keras.preprocessing.image.img_to_array(img)
    arr = np.expand_dims(arr, axis=0)
    return efficientnet.preprocess_input(arr.astype(np.float32))


def predict_image(model_dir: str, image_path: str, img_size: tuple = IMG_SIZE):
    """Run prediction on a single image and print top class and probabilities.
    Uses same preprocessing as API: center crop to img_size (no resize/stretch)."""
    model = _load_custom_model(model_dir)
    class_indices = _load_class_indices(model_dir)
    class_names = _get_class_names_list(class_indices)

    arr = _preprocess_image_center_crop(image_path, img_size)

    probs = model.predict(arr, verbose=0)[0]
    top_i = int(np.argmax(probs))
    top_name = class_names[top_i] if top_i < len(class_names) else f"Class_{top_i}"
    print(f"Prediction: {top_name} (confidence: {probs[top_i]:.4f})")
    print("All classes:")
    for i, p in enumerate(probs):
        name = class_names[i] if i < len(class_names) else f"Class_{i}"
        print(f"  {name}: {p:.4f}")
    return probs, class_names


def list_models():
    """Print subdirectories of models/ that look like saved models (have model_weights.h5)."""
    if not os.path.isdir(MODELS_DIR):
        print(f"No '{MODELS_DIR}/' directory found.")
        return
    names = []
    for name in sorted(os.listdir(MODELS_DIR)):
        path = os.path.join(MODELS_DIR, name)
        if os.path.isdir(path) and os.path.exists(os.path.join(path, "model_weights.h5")):
            names.append(name)
    if not names:
        print(f"No model directories with model_weights.h5 found under '{MODELS_DIR}/'.")
        return
    print("Available models:")
    for name in names:
        print(f"  {MODELS_DIR}/{name}")


def main():
    parser = argparse.ArgumentParser(
        description="Test/evaluate models in models/.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "model_dir",
        nargs="?",
        default=None,
        help="Path to model directory (e.g. models/m1_lesion_form)",
    )
    parser.add_argument(
        "--test-dir",
        type=str,
        default=None,
        help="Path to test data (a1test-style). Default: use validation dir from training_config if it matches.",
    )
    parser.add_argument(
        "--image",
        type=str,
        default=None,
        help="Path to a single image for prediction (skips evaluation).",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=BATCH_SIZE,
        help="Batch size for evaluation.",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List available model directories and exit.",
    )
    args = parser.parse_args()

    if args.list:
        list_models()
        return

    if not args.model_dir:
        list_models()
        print("\nProvide a model directory to evaluate or use --image for single-image prediction.")
        sys.exit(1)

    model_dir = os.path.normpath(args.model_dir)
    if not os.path.isdir(model_dir):
        print(f"Error: Not a directory: {model_dir}")
        sys.exit(1)

    if args.image:
        if not os.path.isfile(args.image):
            print(f"Error: File not found: {args.image}")
            sys.exit(1)
        predict_image(model_dir, args.image, IMG_SIZE)
        return

    test_dir = args.test_dir
    if test_dir is None and DEFAULT_VAL_DIR and os.path.isdir(DEFAULT_VAL_DIR):
        # Use config's validation dir if it exists (same dataset as current config)
        model_name = os.path.basename(model_dir)
        try:
            from training_config import MODEL_NAME
            if model_name == MODEL_NAME:
                test_dir = DEFAULT_VAL_DIR
                print(f"Using test dir from training_config: {test_dir}")
        except ImportError:
            pass
    if test_dir is None:
        print(
            "Error: No test directory specified. Use --test-dir <path> or set DATASET_DIR in training_config "
            "so the matching a1test path exists."
        )
        sys.exit(1)
    if not os.path.isdir(test_dir):
        print(f"Error: Test directory not found: {test_dir}")
        sys.exit(1)

    evaluate_model(model_dir, test_dir, batch_size=args.batch_size, img_size=IMG_SIZE)


if __name__ == "__main__":
    main()
