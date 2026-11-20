# ASTER TIDE

[![make.fun 案件バッジ](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![ASTER TIDE の順位](https://make.fun/badge/gta6-01/tokimeki-marinosuke/makefun-gta6/rank.svg)](https://make.fun/bounty/gta6-01)
[![ASTER TIDE の報酬](https://make.fun/badge/gta6-01/tokimeki-marinosuke/makefun-gta6/reward.svg)](https://make.fun/bounty/gta6-01)

[make.fun「Make GTA 6」案件ページ](https://make.fun/bounty/gta6-01)

**ASTER TIDE** は、かわいい二次元の女の子たちが天体観測をめぐって海辺の街で活躍する、見下ろし型の 2D オープンワールド犯罪ゲームです。天文部のミナは、部長のナギや仲間たちと今夜の流星群を観測するため、回収車に積まれた望遠鏡を取り戻し、パトカーの追跡を振り切って海岸を目指します。

## ゲームの特徴

- **5 つの地区**を徒歩や車で探索できます。ネオンが光る繁華街 Aster Downtown、住宅街 Old Town、倉庫が並ぶ Harbor District、海沿いの Palm Coast、天文台のある Meridian Observatory がひとつの街につながっています。
- **手配度と警察の追跡**。車を盗むと手配度が上がり、パトカーに追われます。建物の陰などで警察の視界を切り、手配度が消えるまで逃げ切りましょう。
- **天文部のミッションは全 3 話**。目標は画面とミニマップで確認でき、エンディング後も街を自由に走れます。
- **Web Audio API による合成サウンド**。車のエンジン音、パトカーのサイレン、ミッションの開始・達成音などをブラウザで生成します。
- **オートセーブ**。ミッション達成時にクリア状況と所持金をブラウザに保存します。タイトル画面の「続きから」で再開できます。

## 遊び方

タイトル画面で「はじめから」を選び、ミニマップの目印を頼りにミッションを進めます。

1. **天文台へ急げ** — メリディアン天文台へ向かい、ナギに会う。
2. **望遠鏡を取り戻せ** — 目印のついた回収車に乗り、手配度を消してから車を天文台へ届ける。
3. **星降る夜の逃走劇** — 再び追跡を振り切り、日時計海岸の観測地点へ向かう。

| キー | 操作 |
| --- | --- |
| W / A / S / D または矢印キー | 徒歩で移動。運転中は W / ↑ で加速、S / ↓ でブレーキ・後退、A / D または ← / → でハンドル操作 |
| E | 近くの車に乗る。乗車中は降りる |
| F | 徒歩で近接攻撃 |
| Space | 会話やミッションメッセージを進める。エンディングから自由走行に戻る |
| M | ミュートの切り替え |

## 実行方法

Node.js 24 で、リポジトリのルートからローカルサーバーを起動します。

```sh
node serve.ts
```

ブラウザで [http://localhost:8080](http://localhost:8080) を開くと遊べます。ゲームはオフラインで動作します。

提出環境では `node main.ts` を実行すると、`/output` に `game/`、`screenshots/`、`dossier.json` が生成されます。ローカルで出力先を変える場合は次のように実行します。

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## ライセンス

[MIT ライセンス](LICENSE)
