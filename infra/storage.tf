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




resource "aws_s3_bucket" "Data" {
  bucket        = lower("${var.Project}-data")
  force_destroy = true
}

resource "aws_s3_bucket_lifecycle_configuration" "Data" {
  bucket = aws_s3_bucket.Data.id

  rule {
    id     = "Auto Delete"
    status = "Enabled"
    expiration { days = 1 }
  }
}

resource "aws_s3_bucket_notification" "Data" {
  depends_on = [aws_lambda_permission.Notifier]
  bucket     = aws_s3_bucket.Data.id

  lambda_function {
    events              = ["s3:ObjectCreated:Put"]
    filter_prefix       = local.VarInPrefix
    lambda_function_arn = aws_lambda_function.Notifier.arn
  }
}

resource "aws_sqs_queue" "Data" {
  name = "${var.Project}-Data"
}




resource "terraform_data" "Website" {
  input = "Website"

  provisioner "local-exec" {
    working_dir = "${local.Source}/frontend/"
    command     = "vite build && aws s3 sync --quiet build/ s3://${aws_s3_bucket.Main.id}/${self.input}/ && rm -r build/"
  }
}

resource "terraform_data" "Lambda" {
  for_each = toset(["Tokener", "Notifier"])

  input            = "${each.key}.zip"
  triggers_replace = filesha256("${local.Source}/backend/lambda/${lower(each.key)}/main.go")

  provisioner "local-exec" {
    working_dir = "${local.Source}/backend/lambda/${lower(each.key)}/"
    command     = <<-SCRIPT
      GOOS=linux GOARCH=arm64 go build -tags=lambda.norpc -o=bootstrap main.go &&
      zip --quiet bootstrap.zip bootstrap && rm bootstrap &&
      aws s3 mv --quiet bootstrap.zip s3://${aws_s3_bucket.Main.id}/${self.input}
    SCRIPT
  }
}
