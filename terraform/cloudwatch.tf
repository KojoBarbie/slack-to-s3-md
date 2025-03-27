# CloudWatchダッシュボード - Lambda関数のモニタリング用
resource "aws_cloudwatch_dashboard" "lambda_monitoring" {
  dashboard_name = "slack-to-obsidian-monitoring"
  
  # ダッシュボードの内容はJSONで定義
  dashboard_body = jsonencode({
    widgets = [
      # エラー率を表示するウィジェット
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 8
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.slack_to_obsidian.function_name, { 
              stat = "Sum", 
              period = 86400,
              label = "エラー数（日次）",
              id = "errors"
            }],
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.slack_to_obsidian.function_name, { 
              stat = "Sum", 
              period = 86400,
              label = "呼び出し総数（日次）",
              id = "invocations"
            }],
            [{
              expression = "(errors/invocations)*100",
              label = "エラー率（%）",
              id = "errorRate",
              period = 86400
            }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda関数の呼び出し回数とエラー率（日次）"
          period  = 86400
          stat    = "Sum"
          timezone = "Local"
          liveData = false
          yAxis = {
            left = {
              min = 0
            },
            right = {
              min = 0,
              max = 100,
              label = "エラー率（%）"
            }
          }
        }
      },
      
      # レスポンスタイム（Duration）を表示するウィジェット
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 8
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.slack_to_obsidian.function_name, { 
              stat = "Average", 
              period = 86400,
              label = "平均レスポンスタイム（ms）" 
            }],
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.slack_to_obsidian.function_name, { 
              stat = "Maximum", 
              period = 86400,
              label = "最大レスポンスタイム（ms）" 
            }],
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.slack_to_obsidian.function_name, { 
              stat = "Minimum", 
              period = 86400,
              label = "最小レスポンスタイム（ms）" 
            }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda関数のレスポンスタイム（日次）"
          period  = 86400
          timezone = "Local"
          liveData = false
        }
      }
    ],
    # ダッシュボード全体に適用される時間範囲の設定
    periodOverride = "inherit",
    start = "-P30D",  # 過去30日間
    end = "P0D"       # 現在まで
  })
}

# オプション: メトリクスアラーム - エラー率が一定以上になったら通知
resource "aws_cloudwatch_metric_alarm" "lambda_error_alarm" {
  alarm_name          = "slack-to-obsidian-error-rate-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 86400   # 1日単位
  statistic           = "Sum"
  threshold           = 5       # 1日に5回以上のエラーでアラーム発動
  alarm_description   = "Lambda関数のエラー数が1日に5回を超えた場合に通知"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.slack_to_obsidian.function_name
  }
  
  # アラームアクションを設定する場合はここにSNSトピックなどを指定
  # alarm_actions = [aws_sns_topic.alarm_topic.arn]
  
  tags = {
    Name    = "slack-to-obsidian-error-alarm"
    Project = "slack-to-obsidian"
  }
}
