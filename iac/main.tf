provider "aws" {
  region = var.region
  default_tags { tags = { Project = title(var.project) } }
}


variable "region" {
  type        = string
  description = "The AWS region to deploy infrastructure"
  default     = "ap-southeast-2" # Sydney Australia
}

variable "project" {
  type        = string
  description = "The project name used for tags & prefixes"
  default     = "ski"

  validation {
    condition     = var.project == lower(var.project)
    error_message = "Invalid Project Name: Must be lowercase"
  }
}


resource "aws_s3_bucket" "website" {
  bucket        = "${var.project}-website"
  force_destroy = true
}

resource "aws_s3_object" "website" {
  bucket = aws_s3_bucket.website.id

  key    = "index.html"
  source = "../src/frontend/index.html"
}


resource "aws_s3_bucket" "data" {
  bucket        = "${var.project}-data"
  force_destroy = true
}

resource "aws_s3_bucket_lifecycle_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    id     = "Auto Delete"
    status = "Enabled"
    expiration { days = 1 }
  }
}


resource "aws_lambda_function" "lambda" {
  function_name = "${var.project}-lambda"
  role          = aws_iam_role.lambda.arn
}

resource "aws_lambda_function_url" "lambda" {
  function_name      = aws_lambda_function.lambda.function_name
  authorization_type = "AWS_IAM"
}

resource "aws_iam_role" "lambda" {
  name = "${var.project}-lambda"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = {
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
  } })
}
