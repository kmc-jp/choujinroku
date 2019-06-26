# ディレクトリ構成
- wiki/ : wiki
- game/ : 超人録の電子ゲーム版リポジトリ

以下、 game/ について記述

# 開発環境
- nodejs + typescript + vuejs

# 環境構築
```sh
npm install
npm run watch &
cd dist && php -S localhost:8008 &
# access http://localhost:8008
```

# 遊び方
- 一つの入力(input)と一つの出力(textarea) を使う
- ガワは後で作る.コアの部分がだいじなので。

# 構想
- Vue - GameProxy - Game - {Player,Land,etc...}
- Game にコア部分を実装するが,外からは触れない
- ブラウザ実装では　GameProxy に　コマンド(Choice) を送ることで操作する
- このように実装することで Game がサーバーで動くようになっても、
  Choiceの操作しかしない実装なので容易に移植できるはず
