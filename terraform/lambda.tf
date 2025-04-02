# TypeScriptビルドを実行するnull_resource
resource "null_resource" "typescript_build" {
  # ソースコードを監視するためのトリガー
  # ファイルの変更時にビルドを実行する
  triggers = {
    # TypeScriptファイルを監視
    ts_files = "${path.module}/../src/index.ts},${path.module}/../src/utils/slack.ts},${path.module}/../src/utils/s3.ts},${path.module}/../src/utils/markdown.ts},${path.module}/../src/utils/deduplication.ts},${path.module}/../src/types/index.ts}"
    # package.jsonの変更も監視
    package_json = "${path.module}/../src/package.json"
  }

  provisioner "local-exec" {
    command = "cd ${path.module}/../src && npm install && npm run build"
  }
}

# Lambda関数のソースコードをzipにパッケージ化
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src"
  output_path = "${path.module}/lambda_function.zip"
  
  # TypeScriptビルド成果物とnode_modulesのみを含める
  excludes = [
    "*.ts",
    "*.js.map",
    "tsconfig.json",
    ".git",
    ".gitignore",
    "*.log"
  ]
  
  depends_on = [null_resource.typescript_build]
}

# Lambda関数
resource "aws_lambda_function" "slack_to_obsidian" {
  function_name    = "slack-to-obsidian"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  role             = aws_iam_role.lambda_role.arn
  handler          = "dist/index.handler"  # TypeScriptビルド後のパス
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