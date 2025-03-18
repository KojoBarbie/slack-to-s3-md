const crypto = require('crypto');
const { WebClient } = require('@slack/web-api');

// Slack Web APIクライアントの初期化（必要に応じて）
let slackClient;

/**
 * Slackリクエストの署名を検証する関数
 * @param {Object} event - Lambda イベントオブジェクト
 * @returns {boolean} 署名が有効な場合はtrue
 */
const verifySlackRequest = (event) => {
  // Slackの署名シークレット
  const slackSigningSecret = process.env.SLACK_SECRET;
  
  // リクエストヘッダーからSlackの署名とタイムスタンプを取得
  const slackSignature = event.headers && (
    event.headers['X-Slack-Signature'] || 
    event.headers['x-slack-signature']
  );
  const slackRequestTimestamp = event.headers && (
    event.headers['X-Slack-Request-Timestamp'] || 
    event.headers['x-slack-request-timestamp']
  );
  
  // 必要な値がない場合は検証失敗
  if (!slackSigningSecret || !slackSignature || !slackRequestTimestamp || !event.body) {
    console.error('署名検証に必要な値が不足しています');
    return false;
  }
  
  // リクエストが古すぎる場合は拒否（5分以上前のリクエスト）
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - slackRequestTimestamp) > 300) {
    console.error('リクエストが古すぎます');
    return false;
  }
  
  // 署名ベースの文字列を作成
  const body = event.body;
  const sigBaseString = `v0:${slackRequestTimestamp}:${body}`;
  
  // HMACを使用して署名を計算
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', slackSigningSecret)
    .update(sigBaseString, 'utf8')
    .digest('hex');
  
  try {
    // 署名が一致するか検証
    return crypto.timingSafeEqual(
      Buffer.from(mySignature, 'utf8'),
      Buffer.from(slackSignature, 'utf8')
    );
  } catch (error) {
    console.error('署名検証エラー:', error);
    return false;
  }
};

/**
 * Slackチャンネル情報を取得する
 * @param {string} channelId - チャンネルID
 * @returns {Promise<string>} チャンネル名、取得できない場合はチャンネルID
 */
const getChannelName = async (channelId) => {
  try {
    // Slackトークンがない場合は早期リターン
    if (!process.env.SLACK_TOKEN) {
      return channelId;
    }
    
    // Slackクライアントの初期化（遅延初期化）
    if (!slackClient) {
      slackClient = new WebClient(process.env.SLACK_TOKEN);
    }
    
    // チャンネル情報の取得
    const channelInfo = await slackClient.conversations.info({ channel: channelId });
    if (channelInfo && channelInfo.ok) {
      return channelInfo.channel.name;
    }
    
    return channelId;
  } catch (error) {
    console.error('チャンネル情報の取得エラー');
    return channelId; // エラーの場合はチャンネルIDをそのまま返す
  }
};

/**
 * Slackユーザー情報を取得する
 * @param {string} userId - ユーザーID
 * @returns {Promise<string>} ユーザー名、取得できない場合はユーザーID
 */
const getUserName = async (userId) => {
  try {
    // ユーザーIDがない、またはSlackトークンがない場合は早期リターン
    if (!userId || userId === 'unknown_user' || !process.env.SLACK_TOKEN) {
      return userId;
    }
    
    // Slackクライアントの初期化（遅延初期化）
    if (!slackClient) {
      slackClient = new WebClient(process.env.SLACK_TOKEN);
    }
    
    // ユーザー情報の取得
    const userInfo = await slackClient.users.info({ user: userId });
    if (userInfo && userInfo.ok) {
      return userInfo.user.real_name || userInfo.user.name || userId;
    }
    
    return userId;
  } catch (error) {
    console.error('ユーザー情報の取得エラー');
    return userId; // エラーの場合はユーザーIDをそのまま返す
  }
};

module.exports = {
  verifySlackRequest,
  getChannelName,
  getUserName
}; 