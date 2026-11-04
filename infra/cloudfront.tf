resource "aws_cloudfront_distribution" "Main" {
  tags                = { Name = "${var.Project} Cloudfront" }
  enabled             = true
  http_version        = "http2and3"
  default_root_object = "index.html"

  origin {
    origin_id                = "Main"
    origin_path              = "/${terraform_data.Website.input}"
    domain_name              = aws_s3_bucket.Main.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.Website.id
  }

  origin {
    origin_id                = "Tokener"
    domain_name              = trim(trimprefix(aws_lambda_function_url.Tokener.function_url, "https://"), "/")
    origin_access_control_id = aws_cloudfront_origin_access_control.Tokener.id

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_ssl_protocols   = ["TLSv1.2"]
      origin_protocol_policy = "https-only"
    }
  }

  default_cache_behavior {
    target_origin_id       = "Main"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6" # Cache Enable
  }

  ordered_cache_behavior {
    path_pattern             = "/token"
    target_origin_id         = "Tokener"
    allowed_methods          = ["GET", "HEAD"]
    cached_methods           = ["GET", "HEAD"]
    viewer_protocol_policy   = "redirect-to-https"
    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # Cache Disable
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac" # Allow Query Parameter
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/"
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate { cloudfront_default_certificate = true }
}


resource "aws_cloudfront_origin_access_control" "Website" {
  name                              = "${var.Project} Website"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
  origin_access_control_origin_type = "s3"
}

resource "aws_cloudfront_origin_access_control" "Tokener" {
  name                              = "${var.Project} Tokener"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
  origin_access_control_origin_type = "lambda"
}
