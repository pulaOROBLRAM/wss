import os
import tensorflow as tf
from tensorflow.keras.applications import ResNet50V2
from tensorflow.keras import layers, models, regularizers, optimizers
from tensorflow.keras.preprocessing import image_dataset_from_directory
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
import matplotlib.pyplot as plt
import numpy as np
from collections import Counter
from datetime import datetime
import seaborn as sns
from sklearn.metrics import f1_score, confusion_matrix
import itertools
from tensorflow.keras.callbacks import TensorBoard, Callback

# Configuration
USER_CONFIG = {
    'learning_rate': 2.9269101592789818e-05,
    'batch_size': 32,
    'dropout_rate': 0.13396500844662193,
    'dense_units': 256,
    'optimizer': 'rmsprop',
    'base_trainable': False,
    'epochs': 23
}

IMG_SIZE = (224, 224)
DATA_DIR = '../dataset/first'
TRAIN_DIR = os.path.join(DATA_DIR, 'train')
VAL_DIR = os.path.join(DATA_DIR, 'test')

class_names = sorted(os.listdir(TRAIN_DIR))
NUM_CLASSES = len(class_names)
print(f"Detected classes: {class_names}")
print(f"Total number of classes: {NUM_CLASSES}")

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
    
    max_samples = max(class_counts.values())
    
    # Calculate weights to balance classes
    class_weights = {}
    for class_name, count in class_counts.items():
        weight = np.sqrt(max_samples / count)
        class_weights[class_names.index(class_name)] = weight
    
    print("\nClass weights:")
    for class_idx, weight in class_weights.items():
        print(f"{class_names[class_idx]}: {weight:.2f}")
    
    return class_weights

class_weights = calculate_class_weights(TRAIN_DIR)

def augmentation():
    return tf.keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.1),
        layers.RandomZoom(0.1),
        layers.RandomTranslation(0.1, 0.1),
        layers.RandomContrast(0.2),
        layers.RandomBrightness(0.2),
        layers.Lambda(lambda x: tf.image.random_saturation(x, 0.9, 1.1)),
        layers.Lambda(lambda x: tf.image.random_hue(x, 0.02)),
        layers.Resizing(224, 224),
    ])

# Model Building
def build_resnet_model(config):
    # Base model
    base_model = ResNet50V2(
        include_top=False,
        weights='imagenet',
        input_shape=IMG_SIZE + (3,),
        pooling='avg'
    )
    base_model.trainable = config['base_trainable']

    # Custom head
    inputs = tf.keras.Input(shape=IMG_SIZE + (3,))
    x = base_model(inputs, training=config['base_trainable'])
    x = layers.Dense(
        config['dense_units'],
        activation='relu',
        kernel_regularizer=regularizers.L2(0.01)
    )(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(config['dropout_rate'])(x)
    outputs = layers.Dense(NUM_CLASSES, activation='softmax')(x)

    model = models.Model(inputs, outputs, name='SkinResNet50V2')
    return model

# Data Pipeline with augmentation and ResNetV2 preprocessing
def get_datasets(batch_size):
    train_ds = image_dataset_from_directory(
        TRAIN_DIR,
        label_mode='categorical',
        image_size=IMG_SIZE,
        batch_size=batch_size,
        shuffle=True
    )
    
    val_ds = image_dataset_from_directory(
        VAL_DIR,
        label_mode='categorical',
        image_size=IMG_SIZE,
        batch_size=batch_size,
        shuffle=False
    )

    # Preprocessing (ResNet50V2 specific)
    def preprocess(x, y):
        x = tf.keras.applications.resnet_v2.preprocess_input(x)
        return x, y
    # Advanced augmentation similar to trainRN50.py
    augmentation = tf.keras.Sequential([
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
    train_ds = train_ds.map(lambda x, y: (augmentation(x, training=True), y), num_parallel_calls=tf.data.AUTOTUNE)
    train_ds = train_ds.map(preprocess, num_parallel_calls=tf.data.AUTOTUNE)
    val_ds = val_ds.map(preprocess, num_parallel_calls=tf.data.AUTOTUNE)
    autotune = tf.data.AUTOTUNE
    train_ds = train_ds.cache().prefetch(buffer_size=autotune)
    val_ds = val_ds.cache().prefetch(buffer_size=autotune)
    return train_ds, val_ds

# Training Setup (callbacks & optional batch size switch)
def main():
    # Create model
    model = build_resnet_model(USER_CONFIG)
    
    # Optimizer
    optimizer = optimizers.RMSprop(
        learning_rate=USER_CONFIG['learning_rate'],
        rho=0.9,
        momentum=0.0,
        epsilon=1e-07
    )
    
    # Compile
    model.compile(
        optimizer=optimizer,
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    # Data
    train_ds, val_ds = get_datasets(USER_CONFIG['batch_size'])

    # Callbacks
    callbacks = [
        ModelCheckpoint(
            'model_checkpoint',
            monitor='val_accuracy',
            save_best_only=True,
            save_weights_only=False,
            save_format='tf',
            verbose=1
        ),
        EarlyStopping(
            monitor='val_accuracy',
            patience=5,
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.3,
            patience=4,
            min_lr=1e-7,
            verbose=1
        ),
        TensorBoard(log_dir='logs/fit')
    ]

    # Training
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=USER_CONFIG['epochs'],
        callbacks=callbacks,
        class_weight=class_weights
    )

    # Save full SavedModel to directory (consistent with trainRN50.py style)
    model.save('model_checkpoint', save_format='tf')

if __name__ == '__main__':
    main()