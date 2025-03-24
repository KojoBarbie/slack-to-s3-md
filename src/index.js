// 各モジュールをインポート
const slackUtils = require('./utils/slack');
const markdownUtils = require('./utils/markdown');
const s3Utils = require('./utils/s3');
const deduplicationUtils = require('./utils/deduplication');

/**
 * Lambdaハンドラー関数
 * @param {Object} event - Lambda イベントオブジェクト
 * @returns {Object} レスポンスオブジェクト
 */
exports.handler = async (event) => {
  try {
    // イベントの基本検証
    if (!event || !event.headers) {
      console.error('無効なイベント形式');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid event format' })
      };
    }
    
    // リクエストの署名検証
    if (!slackUtils.verifySlackRequest(event)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid request signature' })
      };
    }
    
    // リクエストボディをパース
    if (!event.body) {
      console.error('リクエストボディがありません');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Empty request body' })
      };
    }
    
    let payload;
    try {
      payload = JSON.parse(event.body);
    } catch (parseError) {
      console.error('JSONパースエラー');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }
    
    // ペイロードの基本検証
    if (!payload || typeof payload !== 'object') {
      console.error('無効なペイロード形式');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid payload format' })
      };
    }
    
    // イベントタイプの確認
    if (payload.type === 'url_verification') {
      // Slack APIからのチャレンジリクエストに応答
      return {
        statusCode: 200,
        body: JSON.stringify({ challenge: payload.challenge })
      };
    }
    
    // イベントオブジェクトの検証
    if (!payload.event || typeof payload.event !== 'object') {
      console.error('イベントオブジェクトがありません');
      return {
        statusCode: 200,  // Slackには成功を返して再試行を防止
        body: JSON.stringify({ success: false, message: 'No event object found' })
      };
    }

    if (!payload.event_id) {
      console.error('イベントIDがありません。重複検出ができません。');
      return {
        statusCode: 200,
        body: JSON.stringify({ success: false, message: 'No event ID found' })
      };
    }

    // イベントが既に処理済みかチェック（未処理の場合のみtrue）
    const isNewEvent = await deduplicationUtils.checkAndMarkProcessed(payload.event_id);
    if (!isNewEvent) {
      // 重複イベントの場合は早期リターン
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Duplicate event skipped' })
      };
    }
    
    // メッセージイベントのみを処理
    if (payload.event.type === 'message') {
      const messageEvent = payload.event;
      
      // ボットメッセージをスキップ（無限ループ防止）
      if (messageEvent.bot_id || messageEvent.subtype === 'bot_message') {
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true, message: 'Bot message ignored' })
        };
      }
      
      // 必須フィールドの検証
      if (!messageEvent.channel || !messageEvent.text || !messageEvent.ts) {
        console.error('メッセージに必須フィールドがありません');
        return {
          statusCode: 200,  // Slackには成功を返して再試行を防止
          body: JSON.stringify({ success: false, message: 'Missing required message fields' })
        };
      }
      
      // メッセージ情報を取得
      const channelId = messageEvent.channel;
      const userId = messageEvent.user || 'unknown_user';
      const messageText = messageEvent.text;
      const timestamp = messageEvent.ts;
      
      try {
        // チャンネル名とユーザー名を取得
        const [channelName, userName] = await Promise.all([
          slackUtils.getChannelName(channelId),
          slackUtils.getUserName(userId)
        ]);
        
        // メッセージをMarkdownに変換
        const messageDate = new Date(parseFloat(timestamp) * 1000);
        const markdownContent = markdownUtils.formatMessageToMarkdown(
          messageText, 
          userName, 
          channelName,
          timestamp
        );
        
        // S3に保存
        await s3Utils.saveToS3(channelName, markdownContent, messageDate);
        
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true, message: 'Message saved to S3' })
        };
      } catch (processingError) {
        console.error('メッセージ処理エラー:', processingError);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Message processing error' })
        };
      }
    } else {
      // サポートされていないイベントタイプ
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Event type not supported' })
      };
    }
  } catch (error) {
    console.error('予期しないエラー:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}; 