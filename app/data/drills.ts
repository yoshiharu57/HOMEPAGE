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
      {
        id: "w4",
        title: "ジャンピングジャック＆スクワット",
        description: "全身の血流を上げ、脚の筋肉を温める。試合中の急な動き出しに備える準備運動。",
        duration: "3〜5分",
        level: "初級",
        points: [
          "ジャンピングジャック20回→スクワット10回を2セット",
          "スクワットは膝がつま先より前に出ないように",
          "呼吸を止めず一定のリズムで行う",
        ],
        youtubeId: "UpH7rm0cYpE",
      },
      {
        id: "w5",
        title: "バックペダル＆スプリント",
        description: "後ろ向き走りからの切り返しダッシュ。コートでのディフェンス動作に直結する動き。",
        duration: "5分",
        level: "初級",
        points: [
          "5mバックペダル→振り返って5mダッシュ",
          "振り返りは素早くしっかり体全体を回す",
          "3〜5往復を目安に",
        ],
        youtubeId: "dJpBGTFNYwc",
      },
      {
        id: "w6",
        title: "コアアクティベーション（体幹起動）",
        description: "プランクやヒップブリッジで体幹を目覚めさせる。ジャンプや体のぶつかり合いに強い体を作る。",
        duration: "5分",
        level: "初級",
        points: [
          "プランク30秒・サイドプランク各15秒",
          "お腹を軽く引き込み腰を反らせない",
          "呼吸を止めず行う",
        ],
        youtubeId: "pSHjTRCQxIw",
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
      {
        id: "h5",
        title: "ネックロール＆ウエストロール",
        description: "ボールを首・腰周りに高速で回すドリル。手首の柔軟性と指の感覚を磨く。",
        duration: "3〜5分",
        level: "初級",
        points: [
          "首→腰→膝の順に回す場所を変える",
          "ボールを落とさないよう集中する",
          "左回り・右回りを交互に行う",
        ],
        youtubeId: "gCNJBi_ILYE",
      },
      {
        id: "h6",
        title: "ツーボールハンドリング",
        description: "2つのボールを同時に扱う上級ドリル。両手の独立したコントロール力を飛躍的に高める。",
        duration: "5〜10分",
        level: "上級",
        points: [
          "まず両手同時バウンドから始める",
          "慣れたら交互バウンドに挑戦",
          "顔は上げてボールを見ない",
        ],
        youtubeId: "gCNJBi_ILYE",
      },
      {
        id: "h7",
        title: "スパイダードリル",
        description: "ボールを床に置いた状態で4点タッチを繰り返す。素早い手の動きと集中力を養う。",
        duration: "3〜5分",
        level: "中級",
        points: [
          "前→前→後→後の順で素早くタッチ",
          "指先でリズムよく叩く",
          "慣れたら逆順でも行う",
        ],
        youtubeId: "9DnmCLvNDdM",
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
      {
        id: "s5",
        title: "ガラスシュート（バンクショット）",
        description: "バックボードを意図的に使うシュート。角度のあるポジションから高確率で得点するテクニック。",
        duration: "10分",
        level: "初級",
        points: [
          "45度の位置からボードの四角を狙う",
          "高めのアーチをかける",
          "力を抜いて柔らかく打つ",
        ],
        youtubeId: "Q1fBSKcEOOQ",
      },
      {
        id: "s6",
        title: "フリースロー練習",
        description: "試合の勝敗を左右するフリースロー。ルーティンを決めて毎回同じ動作で打てるようにする。",
        duration: "10分",
        level: "初級",
        points: [
          "打つ前のルーティン（バウンド回数など）を固定する",
          "膝を曲げてエネルギーを足から伝える",
          "目を閉じてイメージしてから打つ練習も有効",
        ],
        youtubeId: "FISbQVcJTXE",
      },
      {
        id: "s7",
        title: "動きながらのシュート（ムービングシュート）",
        description: "カットやフォワードの動きからボールをもらってそのままシュートする実戦的な練習。",
        duration: "15分",
        level: "中級",
        points: [
          "動きの最後に足をそろえてから打つ",
          "パスの方向に体を向ける",
          "ゴールから目を離さない",
        ],
        youtubeId: "StuvqQBpSqw",
      },
      {
        id: "s8",
        title: "ミートシュート（V字カット）",
        description: "V字カットでフリーになりパスを受けてシュートするコンビネーション。試合の得点パターンに直結する。",
        duration: "15分",
        level: "上級",
        points: [
          "ディフェンスを引きつけてから鋭く切り返す",
          "カットの方向にパスが出てくることを予測する",
          "もらった瞬間にシュート体勢を作る",
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
      {
        id: "d5",
        title: "レッグスルードリブル",
        description: "足の間にボールを通しながら前進するドリブル。ディフェンスをかわす実戦的なテクニック。",
        duration: "5〜10分",
        level: "中級",
        points: [
          "歩くリズムに合わせて足と手を連動させる",
          "最初はゆっくり動作を確認してから",
          "慣れたらスピードを上げる",
        ],
        youtubeId: "Lf3uMmVjO5E",
      },
      {
        id: "d6",
        title: "ビハインドザバックドリブル",
        description: "背中の後ろでボールを回すドリブルチェンジ。方向転換とフェイクを組み合わせた上級テクニック。",
        duration: "10分",
        level: "上級",
        points: [
          "腰を落として安定した姿勢で行う",
          "背中でボールを通す弧を大きくイメージする",
          "左右どちらからも行えるように練習する",
        ],
        youtubeId: "Qm0mkMBrX3U",
      },
      {
        id: "d7",
        title: "フルコートドリブル突破",
        description: "コートの端から端まで全力でドリブルして戻る練習。スピードと体力・ボールコントロールを同時に鍛える。",
        duration: "10〜15分",
        level: "中級",
        points: [
          "右手・左手交互にコースを変えて行う",
          "スピードを落とさずにボールを前に押し出す",
          "3〜5往復を目安に",
        ],
        youtubeId: "6NRNRZ3d7eg",
      },
      {
        id: "d8",
        title: "ヘジテーションドリブル（緩急）",
        description: "スピードを急に落として相手のバランスを崩す緩急ドリブル。試合でのドライブに欠かせない技術。",
        duration: "10分",
        level: "上級",
        points: [
          "全力→急停止→再加速の動作を繰り返す",
          "止まる瞬間に重心を低くする",
          "相手の反応を見てからアクセルを踏む",
        ],
        youtubeId: "Lf3uMmVjO5E",
      },
    ],
  },
];
