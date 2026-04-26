from pathlib import Path
from sys import argv

import bpy as blender


def main() -> None:
    directory = Path(argv[-1])
    if not directory.is_dir():
        return print(f"Error: '{directory}' is not a directory")
    files = sorted(file for file in directory.iterdir() if file.suffix == ".ply")

    blender.data.collections.remove(blender.data.collections[0])

    blender.context.scene.frame_start = 1
    blender.context.scene.frame_end = len(files)

    for idx, file in enumerate(files[1:], start=1):
        blender.ops.wm.ply_import(
            filepath=str(file), up_axis="Y", forward_axis="NEGATIVE_Z"
        )
        blender.context.active_object.name = f"Frame {idx}"
    blender.ops.wm.ply_import(
        filepath=str(files[0]), up_axis="Y", forward_axis="NEGATIVE_Z"
    )

    object = blender.context.active_object
    object.name = "Base"

    blender.ops.object.select_all(action="SELECT")
    blender.ops.object.join_shapes()

    object.select_set(False)
    blender.ops.object.delete()

    if object.data.shape_keys is not None:
        for idx, key in enumerate(object.data.shape_keys.key_blocks, start=1):
            key.value = 1
            key.keyframe_insert(data_path="value", frame=idx)

            key.value = 0
            key.keyframe_insert(data_path="value", frame=idx - 1)
            key.keyframe_insert(data_path="value", frame=idx + 1)

    blender.ops.export_scene.gltf(filepath=str(directory), export_format="GLB")


if __name__ == "__main__":
    main()
