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


output "endpoint" {
  value = aws_cloudfront_distribution.cloudfront.domain_name
}





resource "aws_s3_bucket" "website" {
  bucket        = "${var.project}-website"
  force_destroy = true

  provisioner "local-exec" {
    command     = "vite --config=vite.ts build"
    working_dir = "../src/frontend/"
  }
}

resource "aws_s3_object" "website" {
  bucket = aws_s3_bucket.website.id

  for_each = {
    "index.html" = "text/html",
    "index.css"  = "text/css",
    "index.js"   = "text/javascript"
  }

  key          = each.key
  source       = "../build/${each.key}"
  content_type = each.value
}

resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = {
      Effect    = "Allow"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.website.arn}/*"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Condition = { StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.cloudfront.arn } }
  } })
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

resource "aws_s3_bucket_notification" "data" {
  bucket = aws_s3_bucket.data.id

  queue {
    queue_arn     = aws_sqs_queue.queue.arn
    events        = ["s3:ObjectCreated:Put"]
    filter_prefix = "video/"
  }
}

resource "aws_sqs_queue" "queue" {
  name = "${var.project}-queue"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = {
      Effect    = "Allow"
      Action    = "sqs:SendMessage"
      Resource  = "arn:aws:sqs:${var.region}:*:${var.project}-queue"
      Principal = { Service = "s3.amazonaws.com" }
      Condition = { ArnEquals = { "AWS:SourceArn" = aws_s3_bucket.data.arn } }
  } })
}





data "archive_file" "lambda" {
  type        = "zip"
  source_file = "../src/lambda/main.py"
  output_path = "../build/lambda.zip"
}

resource "aws_lambda_function" "lambda" {
  function_name = "${var.project}-lambda"
  role          = aws_iam_role.role.arn
  package_type  = "Zip"

  filename = data.archive_file.lambda.output_path
  runtime  = "python3.14"
  handler  = "main.main"

  environment { variables = {
    BUCKET       = aws_s3_bucket.data.bucket
    MODEL_PREFIX = "model/"
    VIDEO_PREFIX = "video/"
    TOKEN_TTL    = 2
  } }
}

resource "aws_lambda_permission" "lambda" {
  for_each = toset(["InvokeFunctionUrl", "InvokeFunction"])

  function_name = aws_lambda_function.lambda.function_name
  source_arn    = aws_cloudfront_distribution.cloudfront.arn

  action    = "lambda:${each.value}"
  principal = "cloudfront.amazonaws.com"
}

resource "aws_lambda_function_url" "lambda" {
  function_name      = aws_lambda_function.lambda.function_name
  authorization_type = "AWS_IAM"
}

resource "aws_iam_role" "role" {
  name = "${var.project}-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = {
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
  } })

  max_session_duration = 2 * 3600
}

resource "aws_iam_role_policy" "policy" {
  name = "${var.project}-policy"
  role = aws_iam_role.role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = {
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:PutObject"]
      Resource = "${aws_s3_bucket.data.arn}/*"
  } })
}





locals {
  default_origin     = "default"
  lambda_origin      = "lambda"
  lambda_domain_name = trimprefix(trimsuffix(aws_lambda_function_url.lambda.function_url, "/"), "https://")
}

resource "aws_cloudfront_distribution" "cloudfront" {
  tags = { Name = "${var.project}-cloudfront" }

  enabled             = true
  default_root_object = "index.html"

  origin {
    origin_id   = local.default_origin
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name

    origin_access_control_id = aws_cloudfront_origin_access_control.website.id
  }

  origin {
    origin_id   = local.lambda_origin
    domain_name = local.lambda_domain_name

    origin_access_control_id = aws_cloudfront_origin_access_control.lambda.id

    custom_origin_config {
      http_port  = 80
      https_port = 443

      origin_ssl_protocols   = ["TLSv1"]
      origin_protocol_policy = "https-only"
    }
  }

  default_cache_behavior {
    allowed_methods = ["GET", "HEAD"]
    cached_methods  = ["GET", "HEAD"]

    target_origin_id       = local.default_origin
    viewer_protocol_policy = "redirect-to-https"

    cache_policy_id = "b2884449-e4de-46a7-ac36-70bc7f1ddd6d" # Cache Enabled
  }

  ordered_cache_behavior {
    path_pattern = "/token"

    allowed_methods = ["GET", "HEAD"]
    cached_methods  = ["GET", "HEAD"]

    target_origin_id       = local.lambda_origin
    viewer_protocol_policy = "https-only"

    cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # Cache Disabled
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1"
  }
}

resource "aws_cloudfront_origin_access_control" "website" {
  name = "${var.project}-website-access"

  signing_behavior = "always"
  signing_protocol = "sigv4"

  origin_access_control_origin_type = "s3"
}

resource "aws_cloudfront_origin_access_control" "lambda" {
  name = "${var.project}-lambda-access"

  signing_behavior = "always"
  signing_protocol = "sigv4"

  origin_access_control_origin_type = "lambda"
}
