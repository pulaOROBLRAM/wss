import os
import tensorflow as tf
from tensorflow.keras.preprocessing import image_dataset_from_directory
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras import layers, models
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
import numpy as np
from datetime import datetime
import json
import warnings

# Import configuration
from training_config import (
    DATASET_DIR, get_train_dir, get_val_dir,
    IMG_SIZE, BATCH_SIZE, EPOCHS, LEARNING_RATE,
    DENSE_UNITS, DROPOUT_RATE, BASE_TRAINABLE, OPTIMIZER,
    SAVED_MODEL_DIR, CHECKPOINT_DIR
)

# Suppress TensorFlow warnings about untraced functions
tf.get_logger().setLevel('ERROR')
warnings.filterwarnings('ignore', category=UserWarning, module='tensorflow')

class TensorFlowJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle TensorFlow tensors and NumPy arrays"""
    def default(self, obj):
        if tf.is_tensor(obj):
            if obj.shape == ():  # scalar tensor
                return float(obj.numpy())
            else:  # array tensor
                return [float(x) for x in obj.numpy().flatten()]
        elif isinstance(obj, np.ndarray):
            if obj.shape == ():  # scalar array
                return float(obj)
            else:  # array
                return [float(x) for x in obj.flatten()]
        elif isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        return super().default(obj)

# Configuration from training_config.py
DATA_DIR = DATASET_DIR
TRAIN_DIR = get_train_dir()
VAL_DIR = get_val_dir()

class FixedRotations(layers.Layer):
    def call(self, images):
        rotations = []
        for k in range(1):
            rotated = tf.image.rot90(images, k=k)
            rotations.append(rotated)
        return tf.concat(rotations, axis=0)

def expand_labels(y):
    # Duplicate labels 4 times to match augmented images
    return tf.concat([y], axis=0)

def get_data_augmentation():
    """Simple data augmentation pipeline"""
    return tf.keras.Sequential([
        layers.RandomFlip("horizontal"),
        FixedRotations()
    ])

def create_model(num_classes):
    """Create EfficientNetB0 model with custom head"""
    # Base model
    base_model = EfficientNetB0(
        weights='imagenet',
        include_top=False,
        input_shape=IMG_SIZE + (3,)
    )
    
    # Set base model trainable based on hyperparameter
    base_model.trainable = BASE_TRAINABLE
    
    # Create full model
    model = models.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dropout(DROPOUT_RATE),
        layers.Dense(DENSE_UNITS, activation='relu'),
        layers.Dropout(DROPOUT_RATE),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    return model

def get_datasets():
    """Load and preprocess datasets"""
    print("Loading datasets...")
    
    # Load training dataset
    train_ds = image_dataset_from_directory(
        TRAIN_DIR,
        labels='inferred',
        label_mode='categorical',
        batch_size=BATCH_SIZE,
        image_size=IMG_SIZE,
        shuffle=True,
        seed=42
    )
    
    # Load validation dataset
    val_ds = image_dataset_from_directory(
        VAL_DIR,
        labels='inferred',
        label_mode='categorical',
        batch_size=BATCH_SIZE,
        image_size=IMG_SIZE,
        shuffle=False
    )
    
    # Get class names
    class_names = train_ds.class_names
    num_classes = len(class_names)
    
    print(f"Found {num_classes} classes: {class_names}")
    print(f"Training samples: {len(train_ds) * BATCH_SIZE}")
    print(f"Validation samples: {len(val_ds) * BATCH_SIZE}")
    
    # Apply data augmentation to training set
    augmentation = get_data_augmentation()
    train_ds = train_ds.map(
        lambda x, y: (augmentation(x, training=True), y),
        num_parallel_calls=tf.data.AUTOTUNE
    )
    
    # Apply EfficientNet preprocessing
    def preprocess_efficientnet(x, y):
        x = tf.keras.applications.efficientnet.preprocess_input(x)
        return x, y
    
    train_ds = train_ds.map(preprocess_efficientnet, num_parallel_calls=tf.data.AUTOTUNE)
    val_ds = val_ds.map(preprocess_efficientnet, num_parallel_calls=tf.data.AUTOTUNE)
    
    # Optimize data pipeline
    train_ds = train_ds.cache().prefetch(buffer_size=tf.data.AUTOTUNE)
    val_ds = val_ds.cache().prefetch(buffer_size=tf.data.AUTOTUNE)
    
    return train_ds, val_ds, class_names

def get_callbacks():
    """Setup training callbacks"""
    # Create directories
    os.makedirs(CHECKPOINT_DIR, exist_ok=True)
    os.makedirs(SAVED_MODEL_DIR, exist_ok=True)
    
    # Model checkpoint - save weights only in SavedModel format
    checkpoint = ModelCheckpoint(
        filepath=os.path.join(CHECKPOINT_DIR, 'best_model'),
        monitor='val_accuracy',
        save_best_only=True,
        save_weights_only=True,
        verbose=1
    )
    
    # Early stopping
    early_stop = EarlyStopping(
        monitor='val_accuracy',
        patience=10,
        restore_best_weights=True,
        verbose=1
    )
    
    # Learning rate reduction
    reduce_lr = ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=5,
        min_lr=1e-7,
        verbose=1
    )
    
    return [checkpoint, early_stop, reduce_lr]

def save_model_and_metadata(model, class_names, history):
    """Save model in format compatible with services.py"""
    print(f"Saving model to {SAVED_MODEL_DIR}...")
    
    # Save weights and architecture separately (most reliable approach)
    print("Saving model weights and architecture separately...")
    
    try:
        # Save weights only (this should work without serialization issues)
        weights_path = os.path.join(SAVED_MODEL_DIR, 'model_weights.h5')
        model.save_weights(weights_path)
        print(f"Model weights saved successfully: {weights_path}")
        
        # Save model architecture manually (avoid tensor serialization issues)
        architecture_info = {
            "model_type": "EfficientNetB0",
            "input_shape": IMG_SIZE + (3,),
            "dense_units": DENSE_UNITS,
            "dropout_rate": DROPOUT_RATE,
            "base_trainable": BASE_TRAINABLE,
            "num_classes": len(class_names),
            "layers": [
                "EfficientNetB0_base",
                "GlobalAveragePooling2D",
                "Dropout",
                "Dense_relu",
                "Dropout", 
                "Dense_softmax"
            ]
        }
        
        with open(os.path.join(SAVED_MODEL_DIR, 'model_architecture.json'), 'w') as f:
            json.dump(architecture_info, f, indent=2)
        print("Model architecture saved as JSON")
        
        # Create a simple SavedModel directory structure for compatibility
        # Create the directory structure manually
        variables_dir = os.path.join(SAVED_MODEL_DIR, 'variables')
        os.makedirs(variables_dir, exist_ok=True)
        
        # Copy weights to SavedModel format
        savedmodel_weights_path = os.path.join(variables_dir, 'variables.h5')
        model.save_weights(savedmodel_weights_path)
        
        # Create assets directory
        assets_dir = os.path.join(SAVED_MODEL_DIR, 'assets')
        os.makedirs(assets_dir, exist_ok=True)
        
        print("SavedModel directory structure created successfully")
        
    except Exception as e:
        print(f"Error saving model components: {e}")
        # Continue to save metadata even if model saving fails
    
    # Create class indices JSON for services.py (always save this)
    print("Saving class indices and labels...")
    class_indices = {str(i): name for i, name in enumerate(class_names)}
    with open(os.path.join(SAVED_MODEL_DIR, 'class_indices.json'), 'w') as f:
        json.dump(class_indices, f, indent=2)
    print(f"Class indices saved: {class_indices}")
    
    # Create labels.txt for services.py
    with open(os.path.join(SAVED_MODEL_DIR, 'labels.txt'), 'w') as f:
        for i, name in enumerate(class_names):
            f.write(f"{i} {name}\n")
    print("Labels.txt saved successfully")
    
    print("Processing training history for serialization...")
    history_dict = {}
    for key, values in history.history.items():
        print(f"Processing key: {key}, values type: {type(values)}, length: {len(values)}")
        cleaned_values = []
        for i, v in enumerate(values):
            if i < 3:  # Only debug first few values
                print(f"  Value {i}: type={type(v)}, shape={getattr(v, 'shape', 'N/A')}")
            try:
                # Convert tensors to floats
                if tf.is_tensor(v):
                    # Handle both scalar and array tensors
                    if v.shape == ():  # scalar tensor
                        cleaned_values.append(float(v.numpy()))
                    else:  # array tensor
                        cleaned_values.append([float(x) for x in v.numpy().flatten()])
                # Convert NumPy scalars/arrays to Python floats
                elif isinstance(v, np.ndarray):
                    if v.shape == ():  # scalar array
                        cleaned_values.append(float(v))
                    else:  # array
                        cleaned_values.append([float(x) for x in v.flatten()])
                # Handle lists of tensors (sometimes history contains lists)
                elif isinstance(v, list):
                    list_values = []
                    for item in v:
                        if tf.is_tensor(item):
                            if item.shape == ():
                                list_values.append(float(item.numpy()))
                            else:
                                list_values.extend([float(x) for x in item.numpy().flatten()])
                        else:
                            list_values.append(float(item))
                    cleaned_values.append(list_values)
                # Already a float or int
                else:
                    cleaned_values.append(float(v))
            except Exception as e:
                print(f"Warning: Could not serialize value for key '{key}': {v} (type: {type(v)}). Error: {e}")
                # Fallback: convert to string
                cleaned_values.append(str(v))
        history_dict[key] = cleaned_values

    
    np.save(os.path.join(SAVED_MODEL_DIR, 'training_history.npy'), history_dict)
    
    # Also save as JSON for easier reading
    try:
        with open(os.path.join(SAVED_MODEL_DIR, 'training_history.json'), 'w') as f:
            json.dump(history_dict, f, indent=2, cls=TensorFlowJSONEncoder)
        print("Training history saved as JSON successfully")
    except Exception as e:
        print(f"Warning: Failed to save training history as JSON: {e}")
        # Try saving with the original history object using custom encoder
        try:
            with open(os.path.join(SAVED_MODEL_DIR, 'training_history.json'), 'w') as f:
                json.dump(history.history, f, indent=2, cls=TensorFlowJSONEncoder)
            print("Training history saved as JSON using custom encoder")
        except Exception as e2:
            print(f"Error: Could not save training history as JSON: {e2}")
    
    # Create a loading script for the model
    loading_script = f"""# Model loading script for {SAVED_MODEL_DIR}
import tensorflow as tf
from tensorflow.keras.models import model_from_json
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras import layers, models
import json

# Model configuration
IMG_SIZE = {IMG_SIZE}
DENSE_UNITS = {DENSE_UNITS}
DROPOUT_RATE = {DROPOUT_RATE}
BASE_TRAINABLE = {BASE_TRAINABLE}
NUM_CLASSES = {len(class_names)}

def load_model():
    \"\"\"Load the saved model from weights and architecture\"\"\"
    # Load model architecture info
    with open('model_architecture.json', 'r') as f:
        arch_info = json.load(f)
    
    # Recreate the model architecture
    base_model = EfficientNetB0(
        weights='imagenet',
        include_top=False,
        input_shape=tuple(arch_info['input_shape'])
    )
    base_model.trainable = arch_info['base_trainable']
    
    # Create the full model
    model = models.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dropout(arch_info['dropout_rate']),
        layers.Dense(arch_info['dense_units'], activation='relu'),
        layers.Dropout(arch_info['dropout_rate']),
        layers.Dense(arch_info['num_classes'], activation='softmax')
    ])
    
    # Load weights
    model.load_weights('model_weights.h5')
    
    # Compile model
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def load_class_indices():
    \"\"\"Load class indices\"\"\"
    with open('class_indices.json', 'r') as f:
        return json.load(f)

# Usage example:
# model = load_model()
# class_indices = load_class_indices()
"""
    
    with open(os.path.join(SAVED_MODEL_DIR, 'load_model.py'), 'w') as f:
        f.write(loading_script)
    
    print(f"Model saved successfully!")
    print(f"Class indices saved to: {os.path.join(SAVED_MODEL_DIR, 'class_indices.json')}")
    print(f"Labels saved to: {os.path.join(SAVED_MODEL_DIR, 'labels.txt')}")
    print(f"Loading script saved to: {os.path.join(SAVED_MODEL_DIR, 'load_model.py')}")

def main():
    """Main training function"""
    print("=== Simple EfficientNetB0 Training ===")
    print(f"Data directory: {DATA_DIR}")
    print(f"Image size: {IMG_SIZE}")
    print(f"Batch size: {BATCH_SIZE}")
    print(f"Epochs: {EPOCHS}")
    print(f"Learning rate: {LEARNING_RATE}")
    print(f"Optimizer: {OPTIMIZER}")
    print(f"Dense units: {DENSE_UNITS}")
    print(f"Dropout rate: {DROPOUT_RATE}")
    print(f"Base model trainable: {BASE_TRAINABLE}")
    
    # Load datasets
    train_ds, val_ds, class_names = get_datasets()
    num_classes = len(class_names)
    
    # Create model
    print("\nCreating model...")
    model = create_model(num_classes)
    
    # Compile model
    if OPTIMIZER == 'rmsprop':
        optimizer = tf.keras.optimizers.RMSprop(learning_rate=LEARNING_RATE)
    elif OPTIMIZER == 'adam':
        optimizer = tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE)
    else:
        optimizer = tf.keras.optimizers.SGD(learning_rate=LEARNING_RATE)
    
    model.compile(
        optimizer=optimizer,
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    print("\nModel summary:")
    model.summary()
    
    # Get callbacks
    callbacks = get_callbacks()
    
    # Train model
    print(f"\nStarting training for {EPOCHS} epochs...")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS,
        callbacks=callbacks,
        verbose=1
    )
    
    # Save model and metadata
    save_model_and_metadata(model, class_names, history)
    
    # Print final results
    print("\n=== Training Results ===")
    best_val_acc = max(history.history['val_accuracy'])
    best_val_loss = min(history.history['val_loss'])
    print(f"Best validation accuracy: {best_val_acc:.4f}")
    print(f"Best validation loss: {best_val_loss:.4f}")
    
    print(f"\nModel saved to: {SAVED_MODEL_DIR}")
    print("Training completed!")

if __name__ == "__main__":
    main()
