provider "aws" {
  region = var.Region
  default_tags { tags = { Project = var.Project } }
}


variable "Region" {
  type        = string
  nullable    = false
  description = "The AWS region to deploy infrastructure"
  default     = "ap-southeast-2" # Sydney Australia
}

variable "Project" {
  type        = string
  nullable    = false
  description = "The project name used for tags & prefixes"
  default     = "Ski"

  validation {
    condition     = var.Project == title(var.Project)
    error_message = "Invalid Project Name: Must be Titlecase"
  }
}


output "Endpoint" { value = aws_cloudfront_distribution.Main.domain_name }


locals {
  Account = data.aws_caller_identity.Account.id
  Source  = "${path.root}/../src/"

  VarInPrefix            = "Upload/"
  VarOutPrefix           = "Output/"
  VarSessionDurationHour = 2
}


data "aws_caller_identity" "Account" {}
