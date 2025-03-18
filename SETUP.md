# セットアップガイド

このドキュメントでは、Slack to Obsidianシステムの設定方法について詳しく説明します。

## 前提条件

- AWS アカウント
- AWS CLI がインストールされ、適切に設定されていること
- Terraform がインストールされていること
- Node.js と npm がインストールされていること
- Slack ワークスペースの管理者権限

## Slack Bot の設定

1. [Slack API](https://api.slack.com/apps) にアクセスし、「Create New App」をクリックします。
2. 「From scratch」を選択し、アプリ名と使用するワークスペースを設定します。
3. 左側のメニューから「OAuth & Permissions」を選択します。
4. 「Bot Token Scopes」セクションで以下の権限を追加します:
   - `channels:history`: チャンネルのメッセージを読む
   - `channels:read`: チャンネル情報を取得
   - `users:read`: ユーザー情報を取得
5. ページの上部にある「Install to Workspace」ボタンをクリックし、アプリをワークスペースにインストールします。
6. インストール後、「Bot User OAuth Token」が表示されます。このトークンを保存しておきます（`terraform.tfvars` の `slack_token` に使用します）。
7. 左側のメニューから「Basic Information」を選択します。
8. 「App Credentials」セクションから「Signing Secret」を確認し、保存しておきます（`terraform.tfvars` の `slack_signing_secret` に使用します）。
9. 左側のメニューから「Event Subscriptions」を選択します。
10. 「Enable Events」をオンにします。
11. 「Request URL」欄には、Terraform のデプロイ後に得られる API Gateway のエンドポイント URL を入力します（一時的に空のままでも構いません）。
12. 「Subscribe to bot events」セクションで「Add Bot User Event」をクリックし、`message.channels` を追加します。
13. 「Save Changes」をクリックして保存します。

## AWS の設定

1. このリポジトリをクローンします。
2. `terraform` ディレクトリ内に `terraform.tfvars` ファイルを作成し、以下の内容を入力します（`terraform.tfvars.example` を参考にしてください）:

```
aws_region = "ap-northeast-1"  # 使用するリージョン
s3_bucket_name = "your-bucket-name"  # 既存のS3バケット名
slack_signing_secret = "your-slack-signing-secret"  # Slackの署名シークレット
slack_token = "xoxb-your-slack-bot-token"  # SlackのBotトークン
```

3. `terraform` ディレクトリに移動し、以下のコマンドを実行して Terraform を初期化します:

```bash
cd terraform
terraform init
```

4. 設定を適用します:

```bash
terraform apply
```

5. デプロイが完了すると、API Gateway のエンドポイント URL が出力されます。この URL を Slack の Event Subscriptions の Request URL 欄に入力します。

## 動作確認

1. Slack ボットをテスト用のチャンネルに招待します（`/invite @your-bot-name`）。
2. チャンネルにメッセージを投稿します。
3. 数秒後、S3 バケット内に `slack/channel-name/YYYY-MM-DD.md` という形式のファイルが作成され、メッセージが追記されていることを確認します。

## トラブルシューティング

問題が発生した場合は、以下を確認してください:

1. AWS Lambda の CloudWatch ログで詳細なエラーを確認できます。
2. Slack の Event Subscriptions ページで Request URL の検証が成功していることを確認します。
3. IAM ロールが適切に設定され、S3 バケットへのアクセス権があることを確認します。

## カスタマイズ

必要に応じて、`src/index.js` の `formatMessageToMarkdown` 関数を編集することで、Markdown 形式をカスタマイズできます。 