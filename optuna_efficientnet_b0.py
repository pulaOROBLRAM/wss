import os
import json
from datetime import datetime
from typing import Tuple

import optuna
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

DATA_DIR = '../../dataset'
TRAIN_DIR = os.path.join(DATA_DIR, 'train')
TEST_DIR = os.path.join(DATA_DIR, 'test')
IMG_SIZE: Tuple[int, int] = (224, 224)
SEED = 42

def get_datasets(
    train_dir: str,
    val_dir: str,
    image_size: Tuple[int, int],
    batch_size: int,
    seed: int = 42,
):

    class_names = sorted([d for d in os.listdir(train_dir) if os.path.isdir(os.path.join(train_dir, d))])

    train_ds = tf.keras.utils.image_dataset_from_directory(
        train_dir,
        labels='inferred',
        label_mode='categorical',
        class_names=class_names,
        seed=seed,
        image_size=image_size,
        batch_size=batch_size,
        shuffle=True,
    )

    val_ds = tf.keras.utils.image_dataset_from_directory(
        val_dir,
        labels='inferred',
        label_mode='categorical',
        class_names=class_names,
        seed=seed,
        image_size=image_size,
        batch_size=batch_size,
        shuffle=False,
    )

    def preprocess(images, labels):
        images = tf.keras.applications.efficientnet.preprocess_input(images)
        return images, labels

    autotune = tf.data.AUTOTUNE
    train_ds = train_ds.map(preprocess, num_parallel_calls=autotune).prefetch(autotune)
    val_ds = val_ds.map(preprocess, num_parallel_calls=autotune).prefetch(autotune)
    return train_ds, val_ds, class_names

def build_model(
    num_classes: int,
    image_size: Tuple[int, int] = IMG_SIZE,
    dense_units: int = 256,
    dropout_rate: float = 0.2,
    base_trainable: bool = False,
):
    base = tf.keras.applications.EfficientNetB0(
        include_top=False,
        weights='imagenet',
        input_shape=(image_size[0], image_size[1], 3),
        pooling=None,
    )
    base.trainable = base_trainable

    inputs = tf.keras.Input(shape=(image_size[0], image_size[1], 3))
    x = base(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    if dropout_rate and dropout_rate > 0:
        x = layers.Dropout(dropout_rate)(x)
    if dense_units and dense_units > 0:
        x = layers.Dense(dense_units, activation='relu')(x)
    outputs = layers.Dense(num_classes, activation='softmax')(x)
    model = tf.keras.Model(inputs=inputs, outputs=outputs)
    return model


def get_optimizer(name: str, learning_rate: float) -> tf.keras.optimizers.Optimizer:
    name = (name or '').lower()
    if name == 'adam':
        return tf.keras.optimizers.Adam(learning_rate)
    if name == 'sgd':
        return tf.keras.optimizers.SGD(learning_rate, momentum=0.9)
    if name == 'adagrad':
        return tf.keras.optimizers.Adagrad(learning_rate)
    if name == 'adadelta':
        return tf.keras.optimizers.Adadelta(learning_rate)
    return tf.keras.optimizers.RMSprop(learning_rate)


def objective(trial: optuna.trial.Trial) -> float:
    batch_size = trial.suggest_categorical('batch_size', [16, 32, 64])
    learning_rate = trial.suggest_float('learning_rate', 1e-5, 3e-3, log=True)
    optimizer_name = trial.suggest_categorical('optimizer', ['adam', 'rmsprop'])
    dense_units = trial.suggest_categorical('dense_units', [128, 256, 512])
    dropout_rate = trial.suggest_float('dropout_rate', 0.0, 0.5)
    base_trainable = trial.suggest_categorical('base_trainable', [False, True])
    epochs = trial.suggest_int('epochs', 6, 15)

    train_ds, val_ds, class_names = get_datasets(TRAIN_DIR, TEST_DIR, IMG_SIZE, batch_size, seed=SEED)
    if not class_names:
        raise RuntimeError("Could not infer class names from dataset. Ensure '../../dataset' has subfolders per class.")
    num_classes = len(class_names)

    model = build_model(
        num_classes=num_classes,
        image_size=IMG_SIZE,
        dense_units=dense_units,
        dropout_rate=dropout_rate,
        base_trainable=base_trainable,
    )

    optimizer = get_optimizer(optimizer_name, learning_rate)
    model.compile(
        optimizer=optimizer,
        loss='categorical_crossentropy',
        metrics=['accuracy'],
    )

    early_stop = EarlyStopping(monitor='val_accuracy', patience=max(2, epochs // 4), mode='max', restore_best_weights=True)
    reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-7)

    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs,
        callbacks=[early_stop, reduce_lr],
        verbose=1,
    )

    val_acc = max(history.history.get('val_accuracy', [0.0]))
    return float(val_acc)


def main():
    gpus = tf.config.experimental.list_physical_devices('GPU')
    for gpu in gpus:
        try:
            tf.config.experimental.set_memory_growth(gpu, True)
        except Exception:
            pass

    study_name = 'optuna_efficientnet_b0_dataset'
    storage = f"sqlite:///optuna_{study_name}.db"
    if os.path.exists(f"optuna_{study_name}.db"):
        print('Resuming existing Optuna study...')
        study = optuna.load_study(study_name=study_name, storage=storage)
    else:
        print('Creating new Optuna study...')
        study = optuna.create_study(direction='maximize', study_name=study_name, storage=storage)

    study.optimize(objective, n_trials=30)

    print('Best trial:')
    best = study.best_trial
    print(f"  Value: {best.value}")
    print('  Params:')
    for k, v in best.params.items():
        print(f"    {k}: {v}")

    timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    with open(f'best_params_{study_name}_{timestamp}.json', 'w', encoding='utf-8') as f:
        json.dump(best.params, f, indent=2)


if __name__ == '__main__':
    main()


