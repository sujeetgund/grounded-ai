import boto3
from config import settings
import uuid

s3_client = boto3.client(
    's3',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION_NAME
)

def upload_file_to_s3(file_obj, filename: str) -> str:
    s3_key = f"{uuid.uuid4()}-{filename}"
    s3_client.upload_fileobj(file_obj, settings.AWS_S3_BUCKET_NAME, s3_key)
    return s3_key

def download_file_from_s3(s3_key: str, local_path: str):
    s3_client.download_file(settings.AWS_S3_BUCKET_NAME, s3_key, local_path)

def delete_file_from_s3(s3_key: str):
    s3_client.delete_object(Bucket=settings.AWS_S3_BUCKET_NAME, Key=s3_key)
