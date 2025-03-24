# Slackイベントの重複排除用DynamoDBテーブル
resource "aws_dynamodb_table" "processed_events" {
  name           = "slack-to-obsidian-processed-events"
  billing_mode   = "PAY_PER_REQUEST"  # 使用量に応じた課金モード
  hash_key       = "event_id"
  
  attribute {
    name = "event_id"
    type = "S"  # 文字列型
  }
  
  ttl {
    attribute_name = "expiry_time"
    enabled        = true
  }
  
  tags = {
    Name        = "slack-to-obsidian-processed-events"
    Environment = "production"
  }
}
