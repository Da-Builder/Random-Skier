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
    resources = ["${aws_s3_bucket.Main.arn}/${terraform_data.Website.input}/*"]

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
  input = "Website"

  provisioner "local-exec" {
    working_dir = "${local.Source}/frontend/"
    command     = "vite --config=vite.ts build && aws s3 sync --quiet build/ s3://${aws_s3_bucket.Main.id}/${self.input}/ && rm -r build/"
  }
}

resource "terraform_data" "Tokener" {
  input            = "Tokener.zip"
  triggers_replace = filesha256("${local.Source}/backend/tokener/main.go")

  provisioner "local-exec" {
    working_dir = "${local.Source}/backend/tokener/"
    command     = <<-SCRIPT
      GOOS=linux GOARCH=arm64 go build -tags=lambda.norpc -o=bootstrap main.go &&
      zip --quiet bootstrap.zip bootstrap && rm bootstrap &&
      aws s3 mv --quiet bootstrap.zip s3://${aws_s3_bucket.Main.id}/${self.input}
    SCRIPT
  }
}
