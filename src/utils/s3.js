const AWS = require('aws-sdk');

// S3クライアントの初期化
const s3 = new AWS.S3();

/**
 * S3バケットに保存する関数
 * @param {string} channelName - チャンネル名
 * @param {string} messageMarkdown - Markdown形式のメッセージ
 * @param {Date} messageDate - メッセージの日付
 * @returns {Promise<string>} 保存したS3のキー
 */
const saveToS3 = async (channelName, messageMarkdown, messageDate) => {
  // 引数の検証と初期値設定
  const safeChannelName = channelName || 'unknown-channel';
  const safeMessageMarkdown = messageMarkdown || '(no content)';
  const safeMessageDate = messageDate instanceof Date ? messageDate : new Date();
  
  // JSTに変換
  const jstDate = new Date(safeMessageDate.getTime() + (9 * 60 * 60 * 1000));
  
  // S3バケット名の検証
  const bucketName = process.env.S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('S3_BUCKET_NAME 環境変数が設定されていません');
  }
  
  // 日付フォーマット YYYY-MM-DD (JST)
  const dateString = jstDate.toISOString().split('T')[0];
  
  // S3のキー（ファイルパス）
  const s3Key = `40_slack_memo/${safeChannelName}/${dateString}.md`;
  
  try {
    // ファイルが既に存在するか確認
    let existingContent = '';
    try {
      const existingObject = await s3.getObject({
        Bucket: bucketName,
        Key: s3Key
      }).promise();
      
      existingContent = existingObject.Body.toString('utf-8');
    } catch (error) {
      // ファイルが存在しない場合は空文字列のまま
      if (error.code !== 'NoSuchKey') {
        console.error('S3 getObject エラー');
        throw error;
      }
    }
    
    // 新しいコンテンツを追加
    const updatedContent = existingContent + safeMessageMarkdown;
    
    // S3にファイルを保存
    await s3.putObject({
      Bucket: bucketName,
      Key: s3Key,
      Body: updatedContent,
      ContentType: 'text/markdown'
    }).promise();
    
    return s3Key;
  } catch (error) {
    console.error('S3保存エラー:', error);
    throw error;
  }
};

module.exports = {
  saveToS3
}; 