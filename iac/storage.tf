locals { S3WebsitePath = "Website" }


resource "aws_s3_bucket" "Main" {
  bucket        = lower("${var.Project}-main")
  force_destroy = true
}

resource "aws_s3_bucket_policy" "Main" {
  bucket = aws_s3_bucket.Main.id
  policy = data.aws_iam_policy_document.Main.json
}

data "aws_iam_policy_document" "Main" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.Main.arn}/${local.S3WebsitePath}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "ArnLike"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.Main.arn]
    }
  }
}


resource "terraform_data" "Website" {
  provisioner "local-exec" {
    working_dir = "${local.Source}/frontend/"
    command     = "vite --config=vite.ts build && aws s3 sync --quiet build/ s3://${aws_s3_bucket.Main.id}/${local.S3WebsitePath}/ && rm -r build/"
  }
}
