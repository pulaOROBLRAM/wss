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
from sklearn.metrics import f1_score
import itertools

DATA_DIR = 'app/datasets/first'
TRAIN_DIR = os.path.join(DATA_DIR, 'train')
VAL_DIR = os.path.join(DATA_DIR, 'test')
CHECKPOINT_DIR = os.path.join('checkpoints_en')
SAVEDMODELS_ROOT = os.path.join('saved_models_en')
TIMESTAMP = datetime.now().strftime("%Y%m%d-%H%M%S")
SAVEDMODEL_DIR = os.path.join(SAVEDMODELS_ROOT, TIMESTAMP)
LOG_DIR = 'logs/fit/' + TIMESTAMP

IMG_SIZE = (224, 224)
PATIENCE = 5
# Optuna
USER_CONFIG = {
    'learning_rate': 2.9269101592789818e-05,
    'batch_size': 32,
    'dropout_rate': 0.13396500844662193,
    'dense_units': 256,
    'optimizer': 'rmsprop',
    'base_trainable': False,
    'epochs': 23
}

# Detect class names automatically
class_names = sorted(os.listdir(TRAIN_DIR))
NUM_CLASSES = len(class_names)
print(f"Detected classes: {class_names}")
print(f"Total number of classes: {NUM_CLASSES}")

def plot_training_history(history):
    """Plot and save training/validation accuracy and loss curves."""
    try:
        acc = history.history.get('accuracy', [])
        val_acc = history.history.get('val_accuracy', [])
        loss = history.history.get('loss', [])
        val_loss = history.history.get('val_loss', [])

        plt.figure(figsize=(12, 5))
        plt.subplot(1, 2, 1)
        plt.plot(acc, label='train_acc')
        plt.plot(val_acc, label='val_acc')
        plt.title('Accuracy')
        plt.legend()
        plt.subplot(1, 2, 2)
        plt.plot(loss, label='train_loss')
        plt.plot(val_loss, label='val_loss')
        plt.title('Loss')
        plt.legend()
        plt.tight_layout()
        plt.savefig(f'training_history_{TIMESTAMP}.png')
        plt.close()
    except Exception as e:
        print(f"Could not plot training history: {e}")

def plot_class_distribution(directory, title):
    class_counts = Counter()
    for class_name in class_names:
        class_dir = os.path.join(directory, class_name)
        if os.path.exists(class_dir):
            class_counts[class_name] = len(os.listdir(class_dir))
    
    plt.figure(figsize=(15, 6))
    sns.barplot(x=list(class_counts.keys()), y=list(class_counts.values()))
    plt.xticks(rotation=45, ha='right')
    plt.title(title)
    plt.tight_layout()
    plt.savefig(f'class_distribution_{title.lower().replace(" ", "_")}.png')
    plt.close()
    
    return class_counts

def calculate_class_weights(directory):
    class_counts = plot_class_distribution(directory, "Training Set Class Distribution")
    
    total_samples = sum(class_counts.values())
    max_samples = max(class_counts.values())
    
    class_weights = {}
    for class_name, count in class_counts.items():
        weight = np.sqrt(max_samples / count)
        class_weights[class_names.index(class_name)] = weight
    
    print("\nClass weights:")
    for class_idx, weight in class_weights.items():
        print(f"{class_names[class_idx]}: {weight:.2f}")
    
    return class_weights

class_weights = calculate_class_weights(TRAIN_DIR)

def get_advanced_augmentation():
    """Advanced data augmentation for better generalization."""
    return tf.keras.Sequential([
        layers.RandomFlip("horizontal_and_vertical"),
        layers.RandomRotation(0.2),
        layers.RandomZoom(0.2),
        layers.RandomTranslation(0.2, 0.2),
        layers.RandomContrast(0.3),
        layers.RandomBrightness(0.3),
        layers.Lambda(lambda x: x + tf.random.normal(tf.shape(x), mean=0.0, stddev=0.05)),
        layers.Lambda(lambda x: tf.image.random_saturation(x, 0.8, 1.2)),
        layers.Lambda(lambda x: tf.image.random_hue(x, 0.05)),
        layers.Lambda(lambda x: tf.image.stateless_random_crop(x, size=[tf.shape(x)[0], 180, 180, 3], seed=(42, 42))),
        layers.Resizing(224, 224),
    ])

def build_model(dropout_rate, dense_units, base_trainable):
    base_model = EfficientNetB0(
        weights='imagenet',
        include_top=False,
        input_shape=IMG_SIZE + (3,)
    )
    base_model.trainable = base_trainable
    elastic_net = tf.keras.regularizers.l1_l2(l1=1e-5, l2=5e-4)
    model = models.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dropout(dropout_rate),
        layers.Dense(dense_units, activation='relu', kernel_regularizer=elastic_net),
        layers.Dropout(dropout_rate),
        layers.Dense(NUM_CLASSES, activation='softmax', kernel_regularizer=elastic_net)
    ])
    return model

def get_datasets(batch_size):
    train_ds = image_dataset_from_directory(
        TRAIN_DIR,
        labels='inferred',
        label_mode='categorical',
        batch_size=batch_size,
        image_size=IMG_SIZE,
        shuffle=True,
        seed=42
    )
    val_ds = image_dataset_from_directory(
        VAL_DIR,
        labels='inferred',
        label_mode='categorical',
        batch_size=batch_size,
        image_size=IMG_SIZE,
        shuffle=False
    )
    
    augmentation = get_advanced_augmentation()
    train_ds = train_ds.map(
        lambda x, y: (augmentation(x, training=True), y),
        num_parallel_calls=tf.data.AUTOTUNE
    )
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
    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.cache().prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.cache().prefetch(buffer_size=AUTOTUNE)
    return train_ds, val_ds
class PerClassAccuracy(Callback):
    def __init__(self, val_data, class_names):
        super().__init__()
        self.val_data = val_data
        self.class_names = class_names
    def on_epoch_end(self, epoch, logs=None):
        y_true = []
        y_pred = []
        for x, y in self.val_data:
            y_true.extend(np.argmax(y, axis=1))
            preds = self.model.predict(x, verbose=0)
            y_pred.extend(np.argmax(preds, axis=1))
        y_true = np.array(y_true)
        y_pred = np.array(y_pred)

        for i, name in enumerate(self.class_names):
            mask = (y_true == i)
            if np.sum(mask) == 0:
                acc = 0.0
            else:
                acc = np.mean(y_pred[mask] == i)
            print(f"Per-class accuracy [{name}]: {acc:.3f}")

        f1_macro = f1_score(y_true, y_pred, average='macro', zero_division=0)
        f1_weighted = f1_score(y_true, y_pred, average='weighted', zero_division=0)
        print(f"F1-score (macro): {f1_macro:.3f} | F1-score (weighted): {f1_weighted:.3f}")

class BatchSizeSwitchCallback(Callback):
    def __init__(self, monitor='val_accuracy', patience=2):
        super().__init__()
        self.monitor = monitor
        self.patience = patience
        self.best = -float('inf')
        self.wait = 0
        self.stopped_epoch = 0
        self.should_switch = False
    def on_epoch_end(self, epoch, logs=None):
        current = logs.get(self.monitor)
        if current is None:
            return
        if current > self.best:
            self.best = current
            self.wait = 0
        else:
            self.wait += 1
            if self.wait >= self.patience:
                self.stopped_epoch = epoch
                self.should_switch = True
                print(f"\nNo improvement in {self.monitor} for {self.patience} epochs. Will switch batch size after this epoch.")
                self.model.stop_training = True

def main():
    learning_rate = USER_CONFIG['learning_rate']
    dropout_rate = USER_CONFIG['dropout_rate']
    dense_units = USER_CONFIG['dense_units']
    optimizer_name = USER_CONFIG['optimizer']
    base_trainable = USER_CONFIG['base_trainable']
    epochs = USER_CONFIG['epochs']
    batch_size = USER_CONFIG['batch_size']
    train_ds, val_ds = get_datasets(batch_size)

    os.makedirs(CHECKPOINT_DIR, exist_ok=True)
    latest_ckpt = tf.train.latest_checkpoint(CHECKPOINT_DIR)
    if latest_ckpt:
        print(f"Resuming from checkpoint: {latest_ckpt}")
        model = build_model(dropout_rate, dense_units, base_trainable)
        model.load_weights(latest_ckpt)
    else:
        print("No checkpoint found. Building a new model.")
        model = build_model(dropout_rate, dense_units, base_trainable)
        
    if optimizer_name == 'adam':
        optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)
    elif optimizer_name == 'rmsprop':
        optimizer = tf.keras.optimizers.RMSprop(learning_rate=learning_rate)
    else:
        print("No checkpoint found. Building a new model.")
        raise ValueError(f"Unsupported optimizer: {optimizer_name}")
    model.compile(
        optimizer=optimizer,
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
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
    tensorboard = TensorBoard(
        log_dir=LOG_DIR,
        histogram_freq=1
    )
    
    reduce_lr2 = ReduceLROnPlateau(
    monitor='val_loss',
    factor=0.3,
    patience=4,
    min_lr=1e-7,
    verbose=1
    )
    
    per_class_acc = PerClassAccuracy(val_ds, class_names)
    batch_switch = BatchSizeSwitchCallback(monitor='val_accuracy', patience=2)
    model.summary()

    history1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs,
        callbacks=[checkpoint, early_stop, reduce_lr2, per_class_acc, batch_switch],
        class_weight=class_weights
    )
    
    if batch_switch.should_switch:
        print("\nSwitching to batch size 64 and resuming training from best weights...")
        batch_size = 64
        train_ds, val_ds = get_datasets(batch_size)
        latest_ckpt = tf.train.latest_checkpoint(CHECKPOINT_DIR)
        model = build_model(dropout_rate, dense_units, base_trainable)
        if latest_ckpt:
            model.load_weights(latest_ckpt)

        if optimizer_name == 'adam':
            optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)
        elif optimizer_name == 'rmsprop':
            optimizer = tf.keras.optimizers.RMSprop(learning_rate=learning_rate)
        else:
            raise ValueError(f"Unsupported optimizer: {optimizer_name}")
        model.compile(
            optimizer=optimizer,
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
    os.makedirs(SAVEDMODEL_DIR, exist_ok=True)
    print(f"Saving full model to {SAVEDMODEL_DIR} (SavedModel format)...")
    model.save(SAVEDMODEL_DIR, save_format='tf')
    np.save(os.path.join(SAVEDMODEL_DIR, 'last_epoch.npy'), history1.epoch[-1] + 1)
    np.save('first_prototype_efficientnetb0_history.npy', history1.history)
    final_val_accuracy = max(history1.history['val_accuracy'])
    final_val_loss = min(history1.history['val_loss'])
    print(f"\nFinal validation accuracy: {final_val_accuracy:.4f}")
    print(f"Final validation loss: {final_val_loss:.4f}")
    plot_training_history(history1)
    return history1

if __name__ == "__main__":
    main()