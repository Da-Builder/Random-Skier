locals { ResourceTokenerName = "${var.Project}-Tokener" }

resource "aws_lambda_function" "Tokener" {
  function_name = local.ResourceTokenerName
  role          = aws_iam_role.Tokener.arn
  s3_bucket     = aws_s3_bucket.Main.id
  s3_key        = terraform_data.Tokener.input
  handler       = "bootstrap"
  runtime       = "provided.al2023"
  architectures = ["arm64"]

  environment { variables = {
    Bucket     = aws_s3_bucket.Data.id
    InPrefix   = local.VarInPrefix
    OutPrefix  = local.VarOutPrefix
    Expiration = local.VarSessionDurationHour
    MaxFileMB  = 5
  } }
}

resource "aws_lambda_function_url" "Tokener" {
  function_name      = aws_lambda_function.Tokener.id
  authorization_type = "AWS_IAM"
}

resource "aws_lambda_permission" "Tokener" {
  for_each = toset(["InvokeFunction", "InvokeFunctionUrl"])

  function_name = aws_lambda_function.Tokener.id
  principal     = "cloudfront.amazonaws.com"
  action        = "lambda:${each.key}"
  source_arn    = aws_cloudfront_distribution.Main.arn
}

resource "aws_iam_role" "Tokener" {
  name                 = local.ResourceTokenerName
  assume_role_policy   = data.aws_iam_policy_document.TokenerRole.json
  max_session_duration = local.VarSessionDurationHour * 3600
}

resource "aws_iam_role_policy" "Tokener" {
  name   = local.ResourceTokenerName
  role   = aws_iam_role.Tokener.id
  policy = data.aws_iam_policy_document.Tokener.json
}

data "aws_iam_policy_document" "TokenerRole" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    condition {
      test     = "ArnLike"
      variable = "AWS:SourceArn"
      values   = ["arn:aws:lambda:${var.Region}:${local.Account}:function:${local.ResourceTokenerName}"]
    }
  }
}

data "aws_iam_policy_document" "Tokener" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.Data.arn}/${local.VarOutPrefix}*"]
  }

  statement {
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.Data.arn}/${local.VarInPrefix}*"]
  }
}
