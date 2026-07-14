resource "aws_cloudfront_distribution" "Main" {
  tags                = { Name = "${var.Project} Cloudfront" }
  enabled             = true
  http_version        = "http2and3"
  default_root_object = "index.html"

  origin {
    origin_id                = "Main"
    origin_path              = "/${local.S3WebsitePath}"
    domain_name              = aws_s3_bucket.Main.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.Website.id
  }

  default_cache_behavior {
    target_origin_id       = "Main"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6" # Cache Enable
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
