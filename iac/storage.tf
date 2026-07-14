locals { S3WebsitePath = "Website" }


resource "aws_s3_bucket" "Main" {
  bucket        = lower("${var.Project}-main")
  force_destroy = true
}


resource "terraform_data" "Website" {
  provisioner "local-exec" {
    working_dir = "${local.Source}/frontend/"
    command     = "vite --config=vite.ts build && aws s3 sync --quiet build/ s3://${aws_s3_bucket.Main.id}/${local.S3WebsitePath}/ && rm -r build/"
  }
}
