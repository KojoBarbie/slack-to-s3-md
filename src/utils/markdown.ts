/**
 * メッセージをMarkdownフォーマットに変換する関数
 * @param {string} message - メッセージ本文
 * @param {string} user - ユーザー名
 * @param {string} timestamp - タイムスタンプ
 * @returns {string} Markdown形式のテキスト
 */
export const formatMessageToMarkdown = (message: string, user: string, timestamp: string): string => {
  // 日付をフォーマット
  const date = new Date(parseFloat(timestamp) * 1000);
  const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const formattedTime = date.toISOString().split('T')[1].substring(0, 8); // HH:MM:SS

  // Markdownフォーマットでメッセージを整形
  return `${user} (${formattedDate} ${formattedTime})\n${message}\n\n----------\n\n`;
}; 