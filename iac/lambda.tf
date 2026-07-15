locals {
  ResourceTokener  = "${var.Project}-Tokener"
  ResourceNotifier = "${var.Project}-Notifier"
}




resource "aws_lambda_function" "Tokener" {
  function_name = local.ResourceTokener
  role          = aws_iam_role.Tokener.arn
  s3_bucket     = aws_s3_bucket.Main.id
  s3_key        = terraform_data.Lambda["Tokener"].input
  handler       = "bootstrap"
  runtime       = "provided.al2023"
  architectures = ["arm64"]

  source_code_hash = terraform_data.Lambda["Tokener"].triggers_replace

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
  name                 = local.ResourceTokener
  assume_role_policy   = data.aws_iam_policy_document.TokenerRole.json
  max_session_duration = local.VarSessionDurationHour * 3600
}

resource "aws_iam_role_policy" "Tokener" {
  name   = local.ResourceTokener
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
      values   = ["arn:aws:lambda:${var.Region}:${local.Account}:function:${local.ResourceTokener}"]
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




resource "aws_lambda_function" "Notifier" {
  function_name = local.ResourceNotifier
  role          = aws_iam_role.Notifier.arn
  s3_bucket     = aws_s3_bucket.Main.id
  s3_key        = terraform_data.Lambda["Notifier"].input
  handler       = "bootstrap"
  runtime       = "provided.al2023"
  architectures = ["arm64"]

  source_code_hash = terraform_data.Lambda["Notifier"].triggers_replace

  environment { variables = {
    Queue         = aws_sqs_queue.Data.id
    AutoScaleName = aws_autoscaling_group.Main.id
    AutoScaleRule = aws_autoscaling_policy.Main["Up"].id
  } }
}

resource "aws_lambda_permission" "Notifier" {
  function_name = aws_lambda_function.Notifier.id
  principal     = "s3.amazonaws.com"
  action        = "lambda:InvokeFunction"
  source_arn    = aws_s3_bucket.Data.arn
}

resource "aws_iam_role" "Notifier" {
  name               = local.ResourceNotifier
  assume_role_policy = data.aws_iam_policy_document.NotifierRole.json
}

resource "aws_iam_role_policy" "Notifier" {
  name   = local.ResourceNotifier
  role   = aws_iam_role.Notifier.id
  policy = data.aws_iam_policy_document.Notifier.json
}

data "aws_iam_policy_document" "NotifierRole" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    condition {
      test     = "ArnLike"
      variable = "AWS:SourceArn"
      values   = ["arn:aws:lambda:${var.Region}:${local.Account}:function:${local.ResourceNotifier}"]
    }
  }
}

data "aws_iam_policy_document" "Notifier" {
  statement {
    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.Data.arn]
  }

  statement {
    actions   = ["autoscaling:ExecutePolicy"]
    resources = [aws_autoscaling_group.Main.arn]
  }
}
