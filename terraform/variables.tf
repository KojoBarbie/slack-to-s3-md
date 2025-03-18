variable "aws_region" {
  description = "The AWS region to deploy resources"
  type        = string
  default     = "ap-northeast-1"  # 東京リージョン
}

variable "s3_bucket_name" {
  description = "The name of the existing S3 bucket where Markdown files will be stored"
  type        = string
}

variable "slack_signing_secret" {
  description = "Slack signing secret for verifying requests"
  type        = string
  sensitive   = true
}

variable "slack_token" {
  description = "Slack Bot User OAuth Token for API calls"
  type        = string
  sensitive   = true
} 