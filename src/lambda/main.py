from os import environ as env
from uuid import uuid4 as uuid

from boto3 import client as aws

s3 = aws("s3")
bucket = env["BUCKET"]
model_prefix = env["MODEL_PREFIX"].strip("/")
video_prefix = env["VIDEO_PREFIX"].strip("/")
token_ttl = int(env["TOKEN_TTL"]) * 3600  # 3600 Seconds = 1 Hour


def main(*_):
    token = str(uuid())
    return {
        "GetModelUrl": s3.generate_presigned_url(
            "get_object",
            ExpiresIn=token_ttl,
            Params={
                "Bucket": bucket,
                "Key": f"{model_prefix}/{token}.gltf",
                "ResponseContentType": "model/gltf+json",
            },
        ),
        "PutVideoUrl": s3.generate_presigned_url(
            "put_object",
            ExpiresIn=token_ttl,
            Params={
                "Bucket": bucket,
                "Key": f"{video_prefix}/{token}.mp4",
                "ContentType": "video/mp4",
            },
        ),
    }
