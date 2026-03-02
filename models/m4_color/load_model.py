# Model loading script for models/m4_color
import tensorflow as tf
from tensorflow.keras.models import model_from_json
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras import layers, models
import json

# Model configuration
IMG_SIZE = (224, 224)
DENSE_UNITS = 256
DROPOUT_RATE = 0.20493691154411037
BASE_TRAINABLE = True
NUM_CLASSES = 4

def load_model():
    """Load the saved model from weights and architecture"""
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
    """Load class indices"""
    with open('class_indices.json', 'r') as f:
        return json.load(f)

# Usage example:
# model = load_model()
# class_indices = load_class_indices()
