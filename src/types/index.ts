import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Slackイベントのペイロード型定義
export interface SlackEventPayload {
  type: string;
  challenge?: string;
  event_id?: string;
  event?: {
    type: string;
    channel?: string;
    user?: string;
    text?: string;
    ts?: string;
    bot_id?: string;
    subtype?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// レスポンス型定義
export interface LambdaResponse {
  statusCode: number;
  body: string;
}

// 環境変数型定義
export interface EnvVars {
  SLACK_TOKEN: string;
  SLACK_SECRET: string;
  S3_BUCKET_NAME: string;
}

// 型ガード関数
export function isSlackEventPayload(obj: any): obj is SlackEventPayload {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.type === 'string'
  );
} 