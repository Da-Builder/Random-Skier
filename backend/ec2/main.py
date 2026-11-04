from pathlib import Path
from shutil import rmtree
from subprocess import run
import boto3
import json


sqs = boto3.client("sqs", region_name="ap-southeast-2")
s3  = boto3.client("s3")

QUEUE_URL        = "https://sqs.ap-southeast-2.amazonaws.com/965848654183/ski-queue"
S3_BUCKET        = "ski-data"
LOCAL_VIDEO_PATH = "./input_video.mp4"


def poll_sqs() -> tuple[str, str] | tuple[None, None]:
    """
    Polls the SQS queue for one video processing job.

    Returns:
        (video_s3_key, receipt_handle) if a message was found, where:
            - video_s3_key:   S3 key of the input video
            - receipt_handle: Token for deleting the message later
        (None, None) if the queue was empty.

    Notes:
        - Uses long polling (WaitTimeSeconds=20) to reduce API calls and cost.
        - Expects the body to contain a S3 key (I think).
        - Does NOT delete the message - the caller is responsible for this after the job is done.
    """
    
    response = sqs.receive_message(
        QueueUrl=QUEUE_URL,
        MaxNumberOfMessages=1,
        WaitTimeSeconds=20,
    )

    messages = response.get("Messages", []) # `response` is a dict that may or may not have the key "Messages"
    if not messages:
        return None, None

    message = messages[0] # `messages` is a list guaranteed to only have 1 element because of `MaxNumberOfMessages=1`
    receipt_handle = message["ReceiptHandle"]
    video_s3_key = json.loads(message["Body"])["Records"][0]["s3"]["object"]["key"] # Complicated ahh
    
    return video_s3_key, receipt_handle


def download_from_s3(s3_key: str) -> str:
    """
    Downloads a file from the S3 input bucket (video of the skier) to a local path.

    Args:
        s3_key: S3 key of the file to download

    Returns:
        Path to the file that is downloaded locally (specified by LOCAL_VIDEO_PATH).
    """
    
    s3.download_file(S3_BUCKET, s3_key, LOCAL_VIDEO_PATH)
    return LOCAL_VIDEO_PATH


def upload_to_s3(local_path: str, s3_key: str) -> str:
    """
    Uploads a local file (gltf animation of the skeir) to the S3 output bucket.

    Args:
        local_path: Path to the local file that is being uploaded.
        s3_key: S3 key of the file to upload

    Returns:
        The S3 URI of the uploaded file
    """
    
    s3.upload_file(local_path, S3_BUCKET, s3_key)
    return f"s3://{S3_BUCKET}/{s3_key}"


def delete_sqs_message(receipt_handle: str) -> None:
    """
    Deletes a message from the SQS queue after successful processing.

    Args:
        receipt_handle: The receipt handle returned when the message was received.

    Notes:
        - Should only be called after the job is fully completed.
    """
    
    sqs.delete_message(
        QueueUrl=QUEUE_URL,
        ReceiptHandle=receipt_handle,
    )


def main() -> None:
    # Poll SQS
    video_s3_key, receipt_handle = poll_sqs()
    if not video_s3_key:
        print("No messages in queue.")
        return

    # Download the video from S3
    video_path = download_from_s3(video_s3_key)

    # Run SAM-Body4D
    run(
        ["python", "scripts/offline_app.py", "--input_video", Path(video_path)], 
        check=True
    )

    output_path = Path("./output/")
    ply_path = list(output_path.iterdir())[0] / "mesh_4d_individual/1/"

    # Convert a sequence of .ply files to a .glb file using Blender
    # Important: Blender should save the file somewhere inside output/
    run(
        ["blender", "--background", "--python", "blender.py", "--", ply_path],
        check=True
    )

    # Get Path
    glb_path = list(output_path.glob("**/*.glb"))[0]

    # Store to S3
    output_s3_key = f"model/{Path(video_s3_key).stem}.glb"
    upload_to_s3(str(glb_path), output_s3_key)

    # Cleanup Stuff
    rmtree(output_path)
    Path(video_path).unlink(missing_ok=True)

    # Delete SQS Message
    delete_sqs_message(receipt_handle)
    print(f"Done :)")


if __name__ == "__main__":
    main()
