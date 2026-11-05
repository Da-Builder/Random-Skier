from pathlib import Path

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
