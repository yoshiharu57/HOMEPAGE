# 建設DXコンサルタントTK ホームページ

栃木県の建設コンサルタント業・測量業向けに、ホームページ制作と業務効率化アプリ制作を訴求する静的サイトです。

## 構成

- `index.html`: ページ本体
- `styles.css`: レイアウトとデザイン
- `script.js`: お問い合わせ文面の作成・コピー
- `assets/tk-black-cat-mascot.webp`: 黒ネコキャラクター画像

## 公開前に設定すること

`script.js` の `CONTACT_EMAIL` に問い合わせ先メールアドレスを設定してください。

```js
const CONTACT_EMAIL = "info@example.com";
```

GitHub Pages では、リポジトリの Pages 設定で公開ブランチとルートディレクトリを選ぶと公開できます。
