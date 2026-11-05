from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Protocol

import mlflow
import pandas as pd

from .config import Config
from .metrics import video_info


class Model(Protocol):
    def load(self) -> None: ...
    def reconstruct(self, video_path: Path, out_dir: Path) -> Path: ...


def _init_experiment(config: Config) -> None:
    config.mlflow_dir.mkdir(parents=True, exist_ok=True)
    mlflow.set_tracking_uri(f"sqlite:///{config.mlflow_dir / 'mlflow.db'}")
    if mlflow.get_experiment_by_name(config.model_name) is None:
        artifacts = (config.mlflow_dir / "artifacts" / config.model_name).as_uri()
        mlflow.create_experiment(config.model_name, artifact_location=artifacts)
    mlflow.set_experiment(config.model_name)
    mlflow.enable_system_metrics_logging()
    mlflow.set_system_metrics_sampling_interval(1)


def evaluate(model: Model, config: Config) -> pd.DataFrame:
    """Run the model on every clip and log each clip as an MLflow run."""
    _init_experiment(config)
    model.load()

    rows = []
    for clip in sorted(config.clips_dir.glob("*.mp4")):
        info = video_info(clip)
        with mlflow.start_run(run_name=clip.stem), TemporaryDirectory() as out_dir:
            mlflow.log_params({"clip": clip.name, **info})
            model.reconstruct(clip, Path(out_dir))
        rows.append({"clip": clip.name})
    return pd.DataFrame(rows)
