from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class Config:
    model_name: str
    repo: str
    root: Path = field(default_factory=lambda: Path("/content/drive/MyDrive/random-skier"))

    @property
    def clips_dir(self) -> Path:
        return self.root / "clips"

    @property
    def mlflow_dir(self) -> Path:
        return self.root / "mlflow"
