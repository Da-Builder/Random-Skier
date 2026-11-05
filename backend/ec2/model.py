from pathlib import Path


class Model:
    def load(self) -> None:
        """Load the model weights onto the GPU."""
        raise NotImplementedError

    def reconstruct(self, video_path: Path, out_dir: Path) -> Path:
        """Reconstruct the skier from a video and return the output file path."""
        raise NotImplementedError
