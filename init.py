import tensorflow as tf
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.models import Model
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, TensorBoard, ReduceLROnPlateau
import numpy as np
import os
import matplotlib.pyplot as plt
import datetime

# User config
USER_CONFIG = {
    'learning_rate': 2.9269101592789818e-05,
    'batch_size': 32,
    'dropout_rate': 0.13396500844662193,
    'dense_units': 256,
    'optimizer': 'rmsprop',
    'base_trainable': False,
    'epochs': 23
}

# Paths
train_dir = 'app/datasets/first/train'
val_dir = 'app/datasets/first/test'
MODEL_SAVE_PATH = 'saved_resnet50_model'
LOG_DIR = os.path.join("logs", datetime.datetime.now().strftime("%Y%m%d-%H%M%S"))
PATIENCE = 5
img_size = (224, 224)

# Function to plot training history
def plot_training_history(history):
    plt.figure(figsize=(12, 5))

    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='Train Acc')
    plt.plot(history.history['val_accuracy'], label='Val Acc')
    plt.title('Accuracy over Epochs')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()

    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Train Loss')
    plt.plot(history.history['val_loss'], label='Val Loss')
    plt.title('Loss over Epochs')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()

    plt.tight_layout()
    plt.savefig('training_history_plot.png')
    plt.show()

# Data Generators
train_datagen = ImageDataGenerator(rescale=1./255, horizontal_flip=True, zoom_range=0.2)
val_datagen = ImageDataGenerator(rescale=1./255)

def get_advanced_augmentation():
    """Advanced data augmentation
    for better generalization."""
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
        # Cutout augmentation
        layers.Lambda(lambda x: tf.image.stateless_random_crop(x, size=[tf.shape(x)[0], 180, 180, 3], seed=(42, 42))),
        layers.Resizing(224, 224),
    ])
    
    augmentation = get_advanced_augmentation()

# Convert generator to tf.data.Dataset
train_ds = tf.data.Dataset.from_generator(
    lambda: train_gen,
    output_signature=(
        tf.TensorSpec(shape=(None, 224, 224, 3), dtype=tf.float32),
        tf.TensorSpec(shape=(None, train_gen.num_classes), dtype=tf.float32)
    )
)



# Apply augmentation
train_ds = train_ds.map(
    lambda x, y: (augmentation(x, training=True), y),
    num_parallel_calls=tf.data.AUTOTUNE
).prefetch(tf.data.AUTOTUNE)


train_gen = train_datagen.flow_from_directory(
    train_dir,
    target_size=img_size,
    batch_size=USER_CONFIG['batch_size'],
    class_mode='categorical'
)

val_gen = val_datagen.flow_from_directory(
    val_dir,
    target_size=img_size,
    batch_size=USER_CONFIG['batch_size'],
    class_mode='categorical'
)

# Load ResNet50
base_model = ResNet50(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
base_model.trainable = USER_CONFIG['base_trainable']

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dropout(USER_CONFIG['dropout_rate'])(x)
x = Dense(USER_CONFIG['dense_units'], activation='relu')(x)
outputs = Dense(train_gen.num_classes, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=outputs)

# Optimizer
optimizer = tf.keras.optimizers.RMSprop(learning_rate=USER_CONFIG['learning_rate']) if USER_CONFIG['optimizer'] == 'rmsprop' else tf.keras.optimizers.Adam(learning_rate=USER_CONFIG['learning_rate'])

model.compile(optimizer=optimizer, loss='categorical_crossentropy', metrics=['accuracy'])

# Callbacks
checkpoint = ModelCheckpoint(
    MODEL_SAVE_PATH,
    monitor='val_accuracy',
    save_best_only=True,
    save_weights_only=False,
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

history = model.fit(
    train_ds,
    validation_data=val_gen,
    epochs=USER_CONFIG['epochs'],
    callbacks=[checkpoint, early_stop, tensorboard, reduce_lr2]
)

# Save extra outputs
os.makedirs(MODEL_SAVE_PATH, exist_ok=True)
print(f"Saving full model to {MODEL_SAVE_PATH} (SavedModel format)...")
model.save(MODEL_SAVE_PATH, save_format='tf')
np.save(os.path.join(MODEL_SAVE_PATH, 'last_epoch.npy'), history.epoch[-1] + 1)
np.save('first_prototype_resnet50_history.npy', history.history)

final_val_accuracy = max(history.history['val_accuracy'])
final_val_loss = min(history.history['val_loss'])
print(f"\nFinal validation accuracy: {final_val_accuracy:.4f}")
print(f"Final validation loss: {final_val_loss:.4f}")

# Plot
plot_training_history(history)
