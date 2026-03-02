# 1-4 Try&Act（共有感想版）

このプロジェクトは、感想をブラウザの `localStorage` ではなくサーバー側に保存するように変更しています。
そのため、同じサーバーにアクセスしている複数端末から、同じ感想一覧を確認できます。

## 変更点

- `POST /api/comments` で感想を保存
- `GET /api/comments` で感想一覧を取得
- 保存先: `data/comments.json`

## 起動方法

1. Node.js をインストール（推奨: LTS）
2. プロジェクトフォルダで依存関係をインストール

```powershell
npm install
```

3. サーバー起動

```powershell
npm start
```

4. ブラウザで開く

- 視聴者ページ: `http://localhost:3000/index.html`
- 管理者ページ: `http://localhost:3000/admin.html`

## 複数端末から使う方法

同じネットワーク内の別端末から使う場合、サーバーPCのIPアドレスでアクセスします。

例（サーバーPCのIPが `192.168.1.20` の場合）:

- `http://192.168.1.20:3000/index.html`
- `http://192.168.1.20:3000/admin.html`

Windowsファイアウォールで `3000` ポートの受信を許可してください。

## スマホで表示されない・送信できない場合

`index.html` と `admin.html` の次のタグに、共有サーバーのURLを設定してください。

```html
<meta name="comments-api-base" content="http://192.168.1.20:3000" />
```

- 末尾に `/` は不要です
- 例はサーバーPCが `192.168.1.20` の場合
- GitHub Pages 等の静的ホスティングからでも、この設定で共有APIへ投稿/取得できます

共有APIに接続できない場合は、送信内容は端末内（`localStorage`）へ退避保存されます。
