from pathlib import Path
from shutil import rmtree
from subprocess import run


# Important: This is currently incomplete.
# Important: This is a layout of what EC2 will be mainly running.
def main() -> None:
    # Pull SQS
    video_path = "..."

    # Run AI
    run(["python", "scripts/offline_app.py", "--input_video", video_path])

    output_path = Path("./output/")
    mesh_path = list(output_path.iterdir())[0] / "mesh_4d_individual/1/"
    run(["blender", "--background", "--python", "blender.py", "--", mesh_path])

    # Get Path
    # ...

    # Store to S3
    # ...

    # Cleanup Stuff
    rmtree(output_path)

    # Delete SQS Message


if __name__ == "__main__":
    main()
