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
