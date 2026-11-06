import threading
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

import cv2
import pynvml
import torch


def video_info(path: Path) -> dict:
    """Return the frame count, fps, duration and resolution of a video."""
    cap = cv2.VideoCapture(str(path))
    info = {
        "frames": int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
        "fps": cap.get(cv2.CAP_PROP_FPS),
        "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
        "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
    }
    cap.release()
    if not info["fps"]:
        raise ValueError(f"Cannot read video: {path}")
    info["video_s"] = info["frames"] / info["fps"]
    return info


@contextmanager
def measure_latency() -> Iterator[dict]:
    """Measure the wall-clock time of the wrapped block."""
    result = {}
    start = time.perf_counter()
    yield result
    result["latency_s"] = time.perf_counter() - start


@contextmanager
def measure_usage() -> Iterator[dict]:
    """Measure peak VRAM (GB) and GPU utilisation (%) of the wrapped block."""
    result = {"peak_vram_torch_gb": 0.0, "peak_vram_nvml_gb": 0.0, "gpu_util_mean": 0.0, "gpu_util_max": 0.0}
    if not torch.cuda.is_available():
        yield result
        return

    pynvml.nvmlInit()
    handle = pynvml.nvmlDeviceGetHandleByIndex(torch.cuda.current_device())
    samples = []
    peak_nvml = 0
    stop = threading.Event()

    def sample() -> None:
        nonlocal peak_nvml
        while not stop.wait(0.1):
            samples.append(pynvml.nvmlDeviceGetUtilizationRates(handle).gpu)
            peak_nvml = max(peak_nvml, pynvml.nvmlDeviceGetMemoryInfo(handle).used)

    torch.cuda.empty_cache()
    torch.cuda.reset_peak_memory_stats()
    thread = threading.Thread(target=sample, daemon=True)
    thread.start()
    try:
        yield result
    finally:
        # Stop sampling even if the wrapped block raises
        stop.set()
        thread.join()
        pynvml.nvmlShutdown()

    result["peak_vram_torch_gb"] = torch.cuda.max_memory_reserved() / 1e9
    result["peak_vram_nvml_gb"] = peak_nvml / 1e9
    if samples:
        result["gpu_util_mean"] = sum(samples) / len(samples)
        result["gpu_util_max"] = max(samples)
