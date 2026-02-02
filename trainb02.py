import os
import tensorflow as tf
from tensorflow.keras.preprocessing import image_dataset_from_directory
from tensorflow.keras import layers, models
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau, TensorBoard, Callback
import numpy as np
from collections import Counter
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import f1_score, classification_report, confusion_matrix
import itertools
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

DATA_DIR = '../../dataset'
TRAIN_DIR = os.path.join(DATA_DIR, 'train')
VAL_DIR = os.path.join(DATA_DIR, 'test')
CHECKPOINT_DIR = os.path.join('checkpoints_enb0')
SAVEDMODELS_ROOT = os.path.join('saved_models_enb0')
TIMESTAMP = datetime.now().strftime("%Y%m%d-%H%M%S")
SAVEDMODEL_DIR = os.path.join(SAVEDMODELS_ROOT, TIMESTAMP)
LOG_DIR = 'logs/fit/diagnostics_' + TIMESTAMP

IMG_SIZE = (224, 224)
PATIENCE = 5

# Enhanced configuration with better learning rate and diagnostics
USER_CONFIG = {
    'learning_rate': 1e-4,
    'batch_size': 32,
    'dense_units': 256,
    'optimizer': 'adam',
    'base_trainable': False,
    'epochs': 1
}

# Detect class names automatically
class_names = sorted(os.listdir(TRAIN_DIR))
NUM_CLASSES = len(class_names)
print(f"Detected classes: {class_names}")
print(f"Total number of classes: {NUM_CLASSES}")

def plot_class_distribution(directory, title):
    """Enhanced class distribution plotting with imbalance analysis."""
    class_counts = Counter()
    for class_name in class_names:
        class_dir = os.path.join(directory, class_name)
        if os.path.exists(class_dir):
            class_counts[class_name] = len(os.listdir(class_dir))
    
    plt.figure(figsize=(15, 8))
    
    # Main distribution plot
    plt.subplot(2, 1, 1)
    bars = plt.bar(range(len(class_counts)), list(class_counts.values()))
    plt.xticks(range(len(class_counts)), list(class_counts.keys()), rotation=45, ha='right')
    plt.title(f'{title} - Sample Counts')
    plt.ylabel('Number of Samples')
    
    # Add value labels on bars
    for i, bar in enumerate(bars):
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                f'{int(height)}', ha='center', va='bottom')
    
    # Imbalance analysis
    plt.subplot(2, 1, 2)
    total_samples = sum(class_counts.values())
    percentages = [(count / total_samples) * 100 for count in class_counts.values()]
    
    bars = plt.bar(range(len(class_counts)), percentages, color='orange', alpha=0.7)
    plt.xticks(range(len(class_counts)), list(class_counts.keys()), rotation=45, ha='right')
    plt.title(f'{title} - Class Distribution (%)')
    plt.ylabel('Percentage of Total')
    
    # Add percentage labels
    for i, bar in enumerate(bars):
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height + 0.5,
                f'{height:.1f}%', ha='center', va='bottom')
    
    plt.tight_layout()
    plt.savefig(f'class_distribution_{title.lower().replace(" ", "_")}_{TIMESTAMP}.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    return class_counts

def calculate_class_weights(directory):
    """Enhanced class weight calculation with better balancing."""
    class_counts = plot_class_distribution(directory, "Training Set Class Distribution")
    
    total_samples = sum(class_counts.values())
    max_samples = max(class_counts.values())
    
    # Use sqrt balancing for better weight distribution
    class_weights = {}
    for class_name, count in class_counts.items():
        # More aggressive balancing for severe imbalance
        if max_samples / count > 10:
            weight = np.sqrt(max_samples / count) * 1.5
        else:
            weight = np.sqrt(max_samples / count)
        class_weights[class_names.index(class_name)] = weight
    
    print("\n=== CLASS WEIGHTS ===")
    for class_idx, weight in class_weights.items():
        print(f"{class_names[class_idx]}: {weight:.2f}")
    
    return class_weights

def get_balanced_augmentation():
    """Balanced data augmentation to prevent training set from being too hard."""
    return tf.keras.Sequential([
        layers.RandomFlip("horizontal"),  # Removed vertical flip for more realistic augmentation
        layers.RandomRotation(0.1),      # Reduced rotation for less distortion
        layers.RandomZoom(0.1),          # Reduced zoom for less distortion
        layers.RandomTranslation(0.1, 0.1),  # Reduced translation
        layers.RandomContrast(0.2),      # Reduced contrast variation
        layers.RandomBrightness(0.2),    # Reduced brightness variation
        # Removed noise addition to prevent training set from being too hard
        layers.Lambda(lambda x: tf.image.random_saturation(x, 0.9, 1.1)),  # Reduced saturation variation
        layers.Lambda(lambda x: tf.image.random_hue(x, 0.02)),             # Reduced hue variation
        # Removed random crop to maintain consistent image quality
        layers.Resizing(224, 224),
    ])

def build_model(dense_units, base_trainable):
    """Optimized model for frozen feature extractor training."""
    base_model = EfficientNetB0(
        weights='imagenet',
        include_top=False,
        input_shape=IMG_SIZE + (3,)
    )
    base_model.trainable = base_trainable

    model = models.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dense(dense_units, activation='relu', kernel_initializer='he_normal'),
        layers.BatchNormalization(),
        layers.Dense(NUM_CLASSES, activation='softmax')
    ])
    
    # Freeze BatchNorm layers if base is frozen
    if not base_trainable:
        for layer in model.layers:
            if isinstance(layer, layers.BatchNormalization):
                layer.trainable = False
                
    return model

def create_model(dense_units=256, base_trainable=False):
    print(f"Creating model with dense_units={dense_units}, base_trainable={base_trainable}")
    
    # Create base EfficientNetB0 model
    base_model = EfficientNetB0(
        weights='imagenet',
        include_top=False,
        input_shape=IMG_SIZE + (3,),
        pooling='avg'
    )
    
    # Freeze or unfreeze base model layers
    base_model.trainable = base_trainable
    
    # Create the full model
    inputs = tf.keras.Input(shape=IMG_SIZE + (3,))
    x = base_model(inputs, training=base_trainable)
    
    # Add custom head
    x = layers.Dense(dense_units, activation='relu', kernel_initializer='he_normal')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.5)(x)  # Added dropout for regularization
    outputs = layers.Dense(NUM_CLASSES, activation='softmax')(x)
    
    model = tf.keras.Model(inputs, outputs)
    
    # Freeze BatchNorm layers if base is frozen
    if not base_trainable:
        for layer in model.layers:
            if isinstance(layer, layers.BatchNormalization):
                layer.trainable = False
    
    # Compile the model
    optimizer = tf.keras.optimizers.Adam(
        learning_rate=USER_CONFIG['learning_rate'],
        clipnorm=1.0
    )
    
    model.compile(
        optimizer=optimizer,
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    print("Model created and compiled successfully!")
    return model

def save_model_properly(model, save_dir):
    """Correct way to save Keras models with all required metadata"""
    try:
        # Method 1: Official Keras save (creates keras_metadata.pb)
        tf.keras.models.save_model(
            model,
            save_dir,
            save_format='tf',
            include_optimizer=True,
            save_traces=False,  # Skip tracing custom gradients
            signatures=None,
            options=tf.saved_model.SaveOptions(
                experimental_custom_gradients=False
            )
        )
        
        # Verify required files exist
        required_files = ['saved_model.pb', 'keras_metadata.pb', 'variables/variables.index']
        for file in required_files:
            if not os.path.exists(os.path.join(save_dir, file)):
                raise RuntimeError(f"Missing required file: {file}")
                
        print(f"Model successfully saved to {save_dir} with Keras metadata")
        
    except Exception as e:
        print(f"Standard save failed: {e}")
        print("Attempting alternative save method...")
        
        try:
            # Method 2: Save weights and architecture separately
            model.save_weights(os.path.join(save_dir, 'weights.h5'))
            
            # Save model config
            config = model.get_config()
            with open(os.path.join(save_dir, 'config.json'), 'w') as f:
                json.dump(config, f)
                
            print(f"Weights and config saved to {save_dir}")
            
        except Exception as e:
            print(f"All save attempts failed: {e}")
            raise RuntimeError("Could not save model with any method")

def get_datasets(batch_size):
    """Enhanced dataset loading with better preprocessing and validation."""
    print("\n=== DATASET LOADING ===")
    
    # Load training dataset
    train_ds = image_dataset_from_directory(
        TRAIN_DIR,
        labels='inferred',
        label_mode='categorical',  # Ensure categorical for softmax + categorical_crossentropy
        batch_size=batch_size,
        image_size=IMG_SIZE,
        shuffle=True,
        seed=42
    )
    
    # Load validation dataset
    val_ds = image_dataset_from_directory(
        VAL_DIR,
        labels='inferred',
        label_mode='categorical',  # Ensure categorical for softmax + categorical_crossentropy
        batch_size=batch_size,
        image_size=IMG_SIZE,
        shuffle=False
    )
    
    print(f"Training samples: {len(train_ds) * batch_size}")
    print(f"Validation samples: {len(val_ds) * batch_size}")
    
    # Apply balanced augmentation only to training set
    augmentation = get_balanced_augmentation()
    train_ds = train_ds.map(
        lambda x, y: (augmentation(x, training=True), y),
        num_parallel_calls=tf.data.AUTOTUNE
    )
    
    # Consistent preprocessing for both datasets
    def preprocess_efficientnetb0(x, y):
        x = tf.keras.applications.efficientnet.preprocess_input(x)
        return x, y
    
    train_ds = train_ds.map(
        preprocess_efficientnetb0,
        num_parallel_calls=tf.data.AUTOTUNE
    )
    val_ds = val_ds.map(
        preprocess_efficientnetb0,
        num_parallel_calls=tf.data.AUTOTUNE
    )
    
    # Optimize data pipeline
    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.cache().prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.cache().prefetch(buffer_size=AUTOTUNE)
    
    return train_ds, val_ds

class EnhancedPerClassAccuracy(Callback):
    """Enhanced per-class accuracy callback with detailed diagnostics."""
    def __init__(self, val_data, class_names):
        super().__init__()
        self.val_data = val_data
        self.class_names = class_names
        self.epoch_metrics = []
    
    def on_epoch_end(self, epoch, logs=None):
        y_true = []
        y_pred = []
        
        for x, y in self.val_data:
            y_true.extend(np.argmax(y, axis=1))
            preds = self.model.predict(x, verbose=0)
            y_pred.extend(np.argmax(preds, axis=1))
        
        y_true = np.array(y_true)
        y_pred = np.array(y_pred)
        
        print(f"\n=== EPOCH {epoch + 1} PER-CLASS ANALYSIS ===")
        
        # Per-class accuracy
        class_accuracies = {}
        for i, name in enumerate(self.class_names):
            mask = (y_true == i)
            if np.sum(mask) == 0:
                acc = 0.0
                print(f"WARNING: No samples found for class {name} in validation set!")
            else:
                acc = np.mean(y_pred[mask] == i)
                class_accuracies[name] = acc
                print(f"Class [{name}]: {acc:.3f} ({np.sum(mask)} samples)")
        
        # Overall metrics
        f1_macro = f1_score(y_true, y_pred, average='macro', zero_division=0)
        f1_weighted = f1_score(y_true, y_pred, average='weighted', zero_division=0)
        overall_acc = np.mean(y_true == y_pred)
        
        print(f"Overall Accuracy: {overall_acc:.3f}")
        print(f"F1-score (macro): {f1_macro:.3f}")
        print(f"F1-score (weighted): {f1_weighted:.3f}")
        
        # Store metrics for analysis
        self.epoch_metrics.append({
            'epoch': epoch + 1,
            'overall_acc': overall_acc,
            'f1_macro': f1_macro,
            'f1_weighted': f1_weighted,
            'class_accuracies': class_accuracies
        })
        
        # Identify problematic classes
        problematic_classes = [name for name, acc in class_accuracies.items() if acc < 0.5]
        if problematic_classes:
            print(f"WARNING: Low accuracy classes: {problematic_classes}")
            print("Consider: data quality, class imbalance, or model capacity")

class LearningRateDiagnosticCallback(Callback):
    """Callback to diagnose learning rate issues."""
    def __init__(self):
        super().__init__()
        self.lr_history = []
    
    def on_epoch_begin(self, epoch, logs=None):
        current_lr = tf.keras.backend.get_value(self.model.optimizer.learning_rate)
        self.lr_history.append(current_lr)
        
        if epoch > 0:
            lr_change = (current_lr - self.lr_history[-2]) / self.lr_history[-2] * 100
            print(f"Epoch {epoch + 1}: Learning rate = {current_lr:.2e} (change: {lr_change:+.1f}%)")
            
            # Warn about learning rate issues
            if current_lr < 1e-7:
                print("WARNING: Learning rate very low - may cause underfitting!")
            elif current_lr > 1e-2:
                print("WARNING: Learning rate very high - may cause instability!")

def main():
    # Extract all config parameters first
    config = USER_CONFIG
    learning_rate = config['learning_rate']
    batch_size = config['batch_size']
    dense_units = config['dense_units']
    optimizer_name = config['optimizer']
    base_trainable = config['base_trainable']
    epochs = config['epochs']
    
    print(f"\n=== TRAINING CONFIGURATION ===")
    print(f"Learning rate: {learning_rate:.2e}")
    print(f"Batch size: {batch_size}")
    print(f"Optimizer: {optimizer_name}")
    print(f"Base model trainable: {base_trainable}")
    print(f"Epochs: {epochs}")
    
    # Get datasets
    train_ds, val_ds = get_datasets(batch_size)
    class_weights = calculate_class_weights(TRAIN_DIR)
    
    # Handle checkpoints with architecture compatibility check
    os.makedirs(CHECKPOINT_DIR, exist_ok=True)
    latest_ckpt = tf.train.latest_checkpoint(CHECKPOINT_DIR)
    
    model = build_model(dense_units, base_trainable)
    
    if latest_ckpt:
        try:
            print(f"Attempting to load weights from: {latest_ckpt}")
            model.load_weights(latest_ckpt)
            print("Weights loaded successfully!")
        except (ValueError, tf.errors.NotFoundError) as e:
            print(f"Could not load weights: {e}")
            print("Starting with fresh weights instead")
    
    # Configure optimizer with gradient clipping
    if optimizer_name == 'adam':
        optimizer = tf.keras.optimizers.Adam(
            learning_rate=learning_rate,
            clipnorm=1.0,  # Gradient clipping
            beta_1=0.9,
            beta_2=0.999,
            epsilon=1e-7
        )
    elif optimizer_name == 'rmsprop':
        optimizer = tf.keras.optimizers.RMSprop(
            learning_rate=learning_rate,
            rho=0.9,
            epsilon=1e-7
        )
    
    model.compile(
        optimizer=optimizer,
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    print(f"\n=== MODEL SUMMARY ===")
    model.summary()
    
    # Enhanced callbacks
    checkpoint = ModelCheckpoint(
        filepath=os.path.join(CHECKPOINT_DIR, 'ckpt-{epoch:02d}'),
        monitor='val_accuracy',
        save_best_only=True,
        save_weights_only=True,
        save_format='tf',
        verbose=1
    )
    
    early_stop = EarlyStopping(
        monitor='val_accuracy',
        patience=PATIENCE,
        restore_best_weights=True,
        verbose=1
    )
    
    # Better learning rate reduction
    reduce_lr = ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=3,
        min_lr=1e-7,
        verbose=1
    )
    
    tensorboard = TensorBoard(
        log_dir=LOG_DIR,
        histogram_freq=0,  # Disabled to prevent serialization errors
        write_graph=False,
        write_images=False
    )
    
    # Enhanced diagnostic callbacks
    per_class_acc = EnhancedPerClassAccuracy(val_ds, class_names)
    lr_diagnostic = LearningRateDiagnosticCallback()
    
    print(f"\n=== STARTING TRAINING ===")
    
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs,
        callbacks=[checkpoint, early_stop, reduce_lr, tensorboard, per_class_acc, lr_diagnostic],
        class_weight=class_weights,
        verbose=1
    )
    
    # Save model and results
    os.makedirs(SAVEDMODEL_DIR, exist_ok=True)
    print(f"\nSaving model to {SAVEDMODEL_DIR}...")
    
    save_model_properly(model, SAVEDMODEL_DIR)
    
    # Save training history
    np.save(os.path.join(SAVEDMODEL_DIR, 'training_history.npy'), history.history)
    np.save('diagnostics_training_history.npy', history.history)
    
    # Final evaluation
    print(f"\n=== FINAL EVALUATION ===")
    final_val_accuracy = max(history.history['val_accuracy'])
    final_val_loss = min(history.history['val_loss'])
    final_train_accuracy = max(history.history['accuracy'])
    final_train_loss = min(history.history['loss'])
    
    print(f"Best validation accuracy: {final_val_accuracy:.4f}")
    print(f"Best validation loss: {final_val_loss:.4f}")
    print(f"Best training accuracy: {final_train_accuracy:.4f}")
    print(f"Best training loss: {final_train_loss:.4f}")
    
    # Training diagnostics summary
    accuracy_gap = final_train_accuracy - final_val_accuracy
    print(f"Final accuracy gap (train - val): {accuracy_gap:.4f}")
    
    # Save per-class accuracy progression
    if hasattr(per_class_acc, 'epoch_metrics'):
        np.save(os.path.join(SAVEDMODEL_DIR, 'per_class_metrics.npy'), per_class_acc.epoch_metrics)
    
    print(f"\nTraining completed! Model saved to: {SAVEDMODEL_DIR}")
    print(f"Checkpoint directory: {CHECKPOINT_DIR}")
    print(f"Logs directory: {LOG_DIR}")
    
    return history

if __name__ == "__main__":
    main()
