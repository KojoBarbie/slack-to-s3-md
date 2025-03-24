# API Gateway
resource "aws_apigatewayv2_api" "slack_api" {
  name          = "slack-to-obsidian-api"
  protocol_type = "HTTP"
  
  tags = {
    Name    = "slack-to-obsidian-api"
    Project = "slack-to-obsidian"
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.slack_api.id
  name        = "$default"
  auto_deploy = true
  
  tags = {
    Name    = "slack-to-obsidian-default-stage"
    Project = "slack-to-obsidian"
  }
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id             = aws_apigatewayv2_api.slack_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.slack_to_obsidian.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "slack_route" {
  api_id    = aws_apigatewayv2_api.slack_api.id
  route_key = "POST /slack-event"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# Lambda関数のAPI Gateway呼び出し許可
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.slack_to_obsidian.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.slack_api.execution_arn}/*/*/slack-event"
} 