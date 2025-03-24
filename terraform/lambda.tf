# Lambda関数のソースコードをzipにパッケージ化
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src"
  output_path = "${path.module}/lambda_function.zip"
}

# Lambda関数
resource "aws_lambda_function" "slack_to_obsidian" {
  function_name    = "slack-to-obsidian"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  timeout          = 30

  environment {
    variables = {
      S3_BUCKET_NAME = var.s3_bucket_name
      SLACK_SECRET   = var.slack_signing_secret
      SLACK_TOKEN    = var.slack_token
    }
  }
  
  tags = {
    Name    = "slack-to-obsidian"
    Project = "slack-to-obsidian"
  }
} 