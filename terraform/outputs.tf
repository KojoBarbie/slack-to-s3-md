# 出力
output "api_endpoint" {
  value       = "${aws_apigatewayv2_api.slack_api.api_endpoint}/slack-event"
  description = "SlackのEvent SubscriptionsのRequest URLに設定するエンドポイント"
}

output "lambda_function_name" {
  value       = aws_lambda_function.slack_to_obsidian.function_name
  description = "Lambda関数の名前"
}

output "s3_bucket_name" {
  value       = var.s3_bucket_name
  description = "使用しているS3バケットの名前"
} 