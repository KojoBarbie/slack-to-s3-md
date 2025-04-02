import * as AWS from 'aws-sdk';

// DynamoDBクライアントの初期化
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'SlackToObsidianProcessedEvents';

/**
 * イベントが既に処理済みかをチェックし、未処理の場合は処理済みとしてマークする
 * @param {string} eventId - イベントID
 * @param {number} ttlHours - レコードの有効期間（時間）
 * @returns {Promise<boolean>} 新規イベントの場合はtrue、重複イベントの場合はfalse
 */
export const checkAndMarkProcessed = async (eventId: string, ttlHours: number = 24): Promise<boolean> => {
  if (!eventId) {
    console.error('イベントIDが指定されていません');
    return true; // IDがない場合は重複チェックできないので処理を継続
  }

  // TTL（有効期限）を計算 - 現在時刻からttlHours後（Unix時間）
  const expiryTime = Math.floor(Date.now() / 1000) + (ttlHours * 60 * 60);
  
  try {
    // 条件付き書き込み - event_idが存在しない場合のみ書き込みを行う
    await dynamoDB.put({
      TableName: TABLE_NAME,
      Item: {
        event_id: eventId,
        expiry_time: expiryTime,
        processed_at: new Date().toISOString()
      },
      ConditionExpression: 'attribute_not_exists(event_id)'
    }).promise();
    
    return true; // 新規イベント（処理済みとしてマーク成功）
  } catch (error) {
    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      console.error(`重複イベント検出: ${eventId} - 処理をスキップします`);
      return false; // 既に処理済みのイベント
    }
    
    // その他のエラーの場合はログを出力して処理を継続
    console.error('DynamoDB操作エラー:', error);
    return true; // エラー時は安全側に倒して処理を続行
  }
};
