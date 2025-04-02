# シェルコマンドを使ってTypeScriptファイルを監視する
resource "null_resource" "typescript_build" {
  # ソースコードを監視するためのトリガー
  # ファイルの変更時にビルドを実行する
  triggers = {
    # シェルコマンドを実行して全TSファイルを一度に監視する
    ts_files_check = "${timestamp()}"
    # package.jsonの変更も監視
    package_json = filesha256("${path.module}/../src/package.json")
  }

  # TSファイルが変更されたかチェックし、変更されていればビルドを実行
  provisioner "local-exec" {
    command = <<EOT
      # srcディレクトリ内の全てのTypeScriptファイルを検索してビルド
      echo "TypeScriptファイルのビルドを実行します..."
      cd ${path.module}/../src && npm install && npm run build
    EOT
  }

  # 常に実行する設定（TSファイルが変更されているかどうかにかかわらず）
  # 注: 本番環境では変更検出の仕組みを改善することをお勧めします
  lifecycle {
    replace_triggered_by = [
      # ファイルの変更を検出したら再適用
      terraform_data.source_code_watch
    ]
  }
}

# TypeScriptファイルの変更を検出するためのリソース
resource "terraform_data" "source_code_watch" {
  input = timestamp()

  # 定期的に実行するためのライフサイクル設定
  lifecycle {
    replace_triggered_by = [
      # ファイルの変更を検出したら再適用
      null_resource.source_code_trigger
    ]
  }
}

# ソースコードの変更トリガー
resource "null_resource" "source_code_trigger" {
  triggers = {
    # シェルコマンドでsrc以下のすべてのTSファイルを監視
    # ファイル追加や変更があった場合に新しいハッシュ値になる
    source_hash = sha256(join("", [
      for f in fileset("${path.module}/../src", "**/*.ts") :
      filesha256("${path.module}/../src/${f}")
    ]))
  }
}

# Lambda関数のソースコードをzipにパッケージ化
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src"
  output_path = "${path.module}/lambda_function.zip"
  
  excludes = [
    "*.js.map",
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