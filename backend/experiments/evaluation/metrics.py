import time
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

import cv2


def video_info(path: Path) -> dict:
    """Return the frame count, fps, duration and resolution of a video."""
    cap = cv2.VideoCapture(str(path))
    info = {
        "frames": int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
        "fps": cap.get(cv2.CAP_PROP_FPS),
        "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
        "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
    }
    info["video_s"] = info["frames"] / info["fps"]
    cap.release()
    return info


@contextmanager
def measure_latency() -> Iterator[dict]:
    """Measure the wall-clock time of the wrapped block."""
    result = {}
    start = time.perf_counter()
    yield result
    result["latency_s"] = time.perf_counter() - start
