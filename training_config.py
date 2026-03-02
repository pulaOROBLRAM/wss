"""
Training Configuration File

Change the DATASET_DIR to point to your dataset directory for each model training.
The dataset directory should contain class folders (or a1train/a1test if already split).

Example structure:
    ../dataset3/m2_surface/
        ├── class1/
        ├── class2/
        └── class3/

Or if already split:
    ../dataset3/m2_surface/
        ├── a1train/
        │   ├── class1/
        │   └── class2/
        └── a1test/
            ├── class1/
            └── class2/
"""

import os


# DATASET CONFIGURATION

# Change this to your dataset directory path
DATASET_DIR = '../dataset3/m4_color'

# Training and validation subdirectories (relative to DATASET_DIR)
TRAIN_SUBDIR = 'a1train'
VAL_SUBDIR = 'a1test'


# MODEL OUTPUT CONFIGURATION

# Model output directory name (derived from dataset name by default)
# You can override this if you want a different name
MODEL_NAME = os.path.basename(os.path.normpath(DATASET_DIR))  # e.g., 'm2_surface'

# Directory where saved models will be stored
SAVED_MODEL_DIR = f'models/{MODEL_NAME}'
CHECKPOINT_DIR = f'models/{MODEL_NAME}_checkpoint'

# TRAINING HYPERPARAMETERS
IMG_SIZE = (224, 224)
BATCH_SIZE = 16
EPOCHS = 12
LEARNING_RATE = 0.00022502168324666375
DENSE_UNITS = 256
DROPOUT_RATE = 0.20493691154411037
BASE_TRAINABLE = True
OPTIMIZER = 'rmsprop'

# DATASET SPLITTING CONFIGURATION (for split_dataset.py)
TEST_SIZE = 0.2  # Proportion for test split
SPLIT_SEED = 42  # Random seed for reproducible splits

# HELPER FUNCTIONS
def get_train_dir():
    """Get the full path to training directory"""
    return os.path.join(DATASET_DIR, TRAIN_SUBDIR)

def get_val_dir():
    """Get the full path to validation directory"""
    return os.path.join(DATASET_DIR, VAL_SUBDIR)

def get_dataset_root():
    """Get the dataset root directory (for split_dataset.py)"""
    return os.path.abspath(DATASET_DIR)
