resource "aws_s3_bucket" "Main" {
  bucket        = lower("${var.Project}-main")
  force_destroy = true
}
