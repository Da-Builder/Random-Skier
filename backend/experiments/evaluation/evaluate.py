from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Protocol

import mlflow
import pandas as pd
import torch

from .config import Config
from .metrics import measure_latency, measure_usage, video_info


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

    with measure_latency() as load:
        model.load()

    clips = sorted(config.clips_dir.glob("*.mp4"))
    # Warm up on the first clip so CUDA init doesn't skew its timing
    with TemporaryDirectory() as warmup_dir:
        model.reconstruct(clips[0], Path(warmup_dir))

    rows = []
    for clip in clips:
        info = video_info(clip)
        gpu = torch.cuda.get_device_name(torch.cuda.current_device()) if torch.cuda.is_available() else "cpu"
        with mlflow.start_run(run_name=clip.stem), TemporaryDirectory() as out_dir:
            mlflow.log_params({"clip": clip.name, "gpu": gpu, "torch": torch.__version__, "cuda": torch.version.cuda, "repo": config.repo, **info})
            with measure_latency() as latency, measure_usage() as usage:
                model.reconstruct(clip, Path(out_dir))
            metrics = {
                "load_s": load["latency_s"],
                "run_s": latency["latency_s"],
                **usage,
            }
            mlflow.log_metrics(metrics)
        rows.append({"clip": clip.name, **metrics})
    return pd.DataFrame(rows)
