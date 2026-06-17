export type Category = "warmup" | "handling" | "shooting" | "dribbling";

export interface Drill {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: "初級" | "中級" | "上級";
  points: string[];
  youtubeId: string;
}

export interface CategoryData {
  id: Category;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  drills: Drill[];
}

export const categories: CategoryData[] = [
  {
    id: "warmup",
    label: "ウォーミングアップ",
    emoji: "🏃",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    drills: [
      {
        id: "w1",
        title: "ボールを使ったストレッチ",
        description: "ボールを持ちながら全身をほぐす基本ストレッチ。練習前に必ず行い、怪我を予防しましょう。",
        duration: "5分",
        level: "初級",
        points: [
          "ボールを頭上に持ち上げ体側を伸ばす",
          "ボールを股の間でくぐらせながら前屈",
          "各ポーズで10秒キープ",
        ],
        youtubeId: "atuFSCcBjZc",
      },
      {
        id: "w2",
        title: "ラインドリル（ライン上の運動）",
        description: "コートのラインを使ったステップ練習。フットワークの基礎を身につける。",
        duration: "5〜10分",
        level: "初級",
        points: [
          "サイドステップ・カリオカ・バックランを組み合わせる",
          "腰を低く保ちながら動く",
          "着地はつま先から静かに",
        ],
        youtubeId: "dJpBGTFNYwc",
      },
      {
        id: "w3",
        title: "ボールハンドリングウォームアップ",
        description: "両手でボールを素早く扱い、手首・指先を温める定番ルーティン。",
        duration: "5分",
        level: "初級",
        points: [
          "フィンガーチップスで指先を鍛える",
          "ボールを素早く左右に移動",
          "リズムよく継続する",
        ],
        youtubeId: "OIXQW_ZIqDE",
      },
    ],
  },
  {
    id: "handling",
    label: "ハンドリング",
    emoji: "🤲",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    drills: [
      {
        id: "h1",
        title: "マッシャー（ボールを押しつぶす感覚）",
        description: "ボールをしっかり指先で捉える感覚を養う基礎ハンドリング。ミニバスの基本中の基本。",
        duration: "3〜5分",
        level: "初級",
        points: [
          "指全体でボールを包み込む",
          "素早く交互に押す",
          "視線はボールを見ず正面を向く",
        ],
        youtubeId: "gCNJBi_ILYE",
      },
      {
        id: "h2",
        title: "エイトボールハンドリング",
        description: "ボールを8の字に通す練習。足の間を素早くさばく動作でハンドリング力を高める。",
        duration: "3〜5分",
        level: "初級",
        points: [
          "両足を肩幅より広めに開く",
          "前後交互に手を入れ替える",
          "なるべく速くリズムよく行う",
        ],
        youtubeId: "9DnmCLvNDdM",
      },
      {
        id: "h3",
        title: "ワンハンドキャッチ",
        description: "片手でのキャッチングを鍛えるドリル。試合でのルーズボール対応力が上がる。",
        duration: "5分",
        level: "中級",
        points: [
          "トスを高く上げてから片手でキャッチ",
          "左右交互に行う",
          "指を広げてしっかり受け止める",
        ],
        youtubeId: "qZYbchcHx0o",
      },
      {
        id: "h4",
        title: "ウォールパス（壁パス）",
        description: "壁に向かって素早くパスを繰り返し、正確なパスと素早いキャッチを身につける。",
        duration: "5〜10分",
        level: "中級",
        points: [
          "チェストパスとバウンズパスを交互に",
          "壁から1〜2m離れて行う",
          "パスの後すぐに構える",
        ],
        youtubeId: "NhE6BPCVD_M",
      },
    ],
  },
  {
    id: "shooting",
    label: "シュート",
    emoji: "🏀",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
    drills: [
      {
        id: "s1",
        title: "フォームシューティング（ワンハンド）",
        description: "シュートフォームの基礎。片手でボールをコントロールし、正しいリリースポイントを習得する。",
        duration: "10分",
        level: "初級",
        points: [
          "ひじをゴールに向けて真っすぐ",
          "リリース時に手首をスナップ",
          "フォロースルーを最後まで",
        ],
        youtubeId: "FISbQVcJTXE",
      },
      {
        id: "s2",
        title: "ミドルシュート練習",
        description: "ゴール近くからミドルレンジで正確にシュートを決める練習。ミニバスで最も使うシュートゾーン。",
        duration: "10〜15分",
        level: "初級",
        points: [
          "ゴール正面・45度・サイドの3か所から打つ",
          "バックボードをうまく使う",
          "毎回同じフォームを意識",
        ],
        youtubeId: "Q1fBSKcEOOQ",
      },
      {
        id: "s3",
        title: "レイアップシュート",
        description: "ゴールへのドライブからフィニッシュするレイアップ。右・左どちらからも決められるよう練習する。",
        duration: "10〜15分",
        level: "初級",
        points: [
          "右から：右足→左足→右手で打つ",
          "左から：左足→右足→左手で打つ",
          "バックボードの高い位置を狙う",
        ],
        youtubeId: "ZT4PvSGG2Vc",
      },
      {
        id: "s4",
        title: "キャッチ＆シュート",
        description: "パスを受け取ってすぐにシュートする練習。試合で多い「もらってすぐ打つ」場面を想定。",
        duration: "10〜15分",
        level: "中級",
        points: [
          "両足でしっかり止まってから打つ",
          "パスを受けながらジャンプの準備をする",
          "受け取りからリリースまでをスムーズに",
        ],
        youtubeId: "StuvqQBpSqw",
      },
    ],
  },
  {
    id: "dribbling",
    label: "ドリブル",
    emoji: "⛹️",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-300",
    drills: [
      {
        id: "d1",
        title: "定位置ドリブル（低・高）",
        description: "その場でドリブルを続け、低いドリブルと高いドリブルを交互に切り替える基本練習。",
        duration: "3〜5分",
        level: "初級",
        points: [
          "低いドリブルは膝より下",
          "高いドリブルは腰の高さ",
          "指先でコントロールし手のひらは使わない",
        ],
        youtubeId: "JGwRGkAojMg",
      },
      {
        id: "d2",
        title: "クロスオーバードリブル",
        description: "左右に素早くボールを移動させる技術。ディフェンスをかわすための基本テクニック。",
        duration: "5〜10分",
        level: "初級",
        points: [
          "低い姿勢を維持する",
          "ボールを横に押し出すイメージ",
          "顔は上げて前を見る",
        ],
        youtubeId: "Lf3uMmVjO5E",
      },
      {
        id: "d3",
        title: "ドリブルからのストップ",
        description: "ドリブルを突きながら走り、正確にジャンプストップする練習。オフェンスの基礎動作。",
        duration: "10分",
        level: "初級",
        points: [
          "両足同時のジャンプストップを覚える",
          "止まった後に軸足を決める",
          "バランスを崩さず止まる",
        ],
        youtubeId: "6NRNRZ3d7eg",
      },
      {
        id: "d4",
        title: "コーンドリブル（スラロームドリル）",
        description: "コーンを置いてジグザグにドリブルする練習。ボール操作とフットワークを同時に鍛える。",
        duration: "10〜15分",
        level: "中級",
        points: [
          "コーンとコーンの間隔は約1.5m",
          "体の向きを変えながらドリブルする",
          "スピードより正確さを優先",
        ],
        youtubeId: "Qm0mkMBrX3U",
      },
    ],
  },
];
