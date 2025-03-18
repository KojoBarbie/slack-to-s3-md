# Slack to Obsidian

このプロジェクトは、Slackのメッセージを自動的にObsidian用のMarkdownファイルとしてS3バケットに保存するシステムを構築します。

## アーキテクチャ

1. Slackでメッセージが投稿される
2. Slack Botがメッセージを検知して、API Gateway経由でLambda関数を呼び出す
3. Lambda関数がS3バケットの特定のパス（`s3://<bucket-name>/slack/<channel-name>/<date>.md`）にメッセージ内容を書き込む

## 技術スタック

- **インフラストラクチャ**: Terraform
- **バックエンド**: AWS Lambda (Node.js), API Gateway, S3
- **イベントソース**: Slack API

## プロジェクト構造

```
slack-to-obsidian/
├── terraform/                   # Terraformの設定ファイル
│   ├── main.tf                  # プロバイダー設定
│   ├── variables.tf             # 変数定義
│   ├── iam.tf                   # IAMリソース定義
│   ├── lambda.tf                # Lambda関数定義
│   ├── api_gateway.tf           # API Gateway定義
│   ├── outputs.tf               # 出力値定義
│   └── terraform.tfvars.example # 変数設定例
├── src/                         # Lambda関数のソースコード
│   ├── index.js                 # メインのLambda関数
│   └── package.json             # Node.jsの依存関係
├── SETUP.md                     # 詳細なセットアップガイド
└── README.md                    # プロジェクト概要
```

## セットアップ方法

### 前提条件

- AWS CLIがインストールされ、適切な認証情報が設定されていること
- Terraformがインストールされていること
- Node.jsとnpmがインストールされていること
- Slackワークスペースの管理者権限（Botを作成するため）

### デプロイ手順

1. リポジトリをクローン
2. terraformディレクトリでTerraformを初期化、適用
3. Slack AppをSlack APIで設定
4. 環境変数を設定

詳細な手順は[SETUP.md](./SETUP.md)を参照してください。 