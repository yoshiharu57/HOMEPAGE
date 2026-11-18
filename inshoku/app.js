/* =========================================================
   飲食店マーケティング戦略アプリ
   - データはブラウザの localStorage に保存されます
   - 選択肢・施策・季節イベントの定義は data.js にあります
   ========================================================= */

const STORAGE_KEY = "tk-inshoku-marketing-v1";

/* ---------------- 小さな道具 ---------------- */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function num(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function yen(n) {
  if (n === null || !Number.isFinite(n)) return "—";
  return `${Math.round(n).toLocaleString("ja-JP")}円`;
}

function fmt(n, digits = 0) {
  if (n === null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("ja-JP", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(key, n) {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m - 1 + n, 1));
}

function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return `${y}年${m}月`;
}

function uid() {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

let toastTimer = null;
function toast(message) {
  const el = $("[data-toast]");
  el.textContent = message;
  el.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-show"), 2200);
}

/* ---------------- データ ---------------- */

function blankStore(name = "新しい店舗") {
  return {
    id: uid(),
    profile: {
      name,
      pref: "栃木",
      area: "",
      genre: "居酒屋",
      location: "住宅街",
      timeband: "ランチとディナー",
      seats: 30,
      lunchPrice: 1000,
      dinnerPrice: 3500,
      openDays: 25,
      targets: [],
      channels: [],
      features: [],
      issues: [],
      budget: 0,
      hours: 2,
      strengths: "",
      memo: ""
    },
    goal: { targetSales: "", currentSales: "", avgSpend: "", lunchShare: 40, repeatRate: 40, lineRate: 20 },
    checks: {},
    records: [],
    post: { channel: "Instagram", purpose: "新メニュー", topic: "", price: "", point: "", period: "" },
    competitors: [],
    c3: { customerNotes: "" }
  };
}

function sampleStore() {
  const s = blankStore("サンプル：とちぎ酒場（宇都宮）");
  Object.assign(s.profile, {
    area: "宇都宮",
    genre: "居酒屋",
    location: "住宅街",
    timeband: "ランチとディナー",
    seats: 40,
    lunchPrice: 950,
    dinnerPrice: 3800,
    openDays: 25,
    targets: ["会社員", "家族連れ", "地元の常連"],
    channels: ["insta"],
    features: ["駐車場あり", "個室・宴会可", "予約可", "地元食材", "テイクアウト"],
    issues: ["新規客が少ない", "平日が弱い", "発信する時間がない"],
    budget: 1,
    hours: 1,
    strengths: "栃木の地酒が20種類、とちぎ和牛の炭火焼き",
    memo: "サンプルデータです。自由に書き換えたり、削除したりしてください。"
  });
  Object.assign(s.goal, { targetSales: 4500000, currentSales: 3800000, lunchShare: 30 });
  const base = monthKey();
  const rows = [
    [-3, 3650000, 1420, 380, 1800, 52, 4.1, 410, 0],
    [-2, 3720000, 1450, 395, 2100, 58, 4.1, 432, 0],
    [-1, 3810000, 1480, 410, 2600, 66, 4.2, 455, 35]
  ];
  s.records = rows.map(([offset, sales, customers, newCustomers, gbpViews, reviews, rating, igFollowers, lineFriends]) => ({
    month: addMonths(base, offset),
    sales,
    customers,
    newCustomers,
    gbpViews,
    reviews,
    rating,
    igFollowers,
    lineFriends,
    memo: ""
  }));
  s.competitors = [
    { id: uid(), name: "A：駅前のチェーン居酒屋", genre: "居酒屋", distance: "車で5分", lunchPrice: "", dinnerPrice: 2800, rating: 3.6, reviews: 240, igFollowers: 3200, features: ["予約可", "個室・宴会可", "深夜営業"], strengths: "安さ、飲み放題、ネット予約", weaknesses: "料理が画一的、地元感がない" },
    { id: uid(), name: "B：近所の老舗の和食店", genre: "和食・割烹", distance: "徒歩8分", lunchPrice: 1300, dinnerPrice: 5000, rating: 4.3, reviews: 120, igFollowers: 300, features: ["駐車場あり", "個室・宴会可", "予約可", "地元食材"], strengths: "料理の質、法事や接待", weaknesses: "価格が高い、若い人に知られていない" },
    { id: uid(), name: "C：新しくできた焼鳥店", genre: "居酒屋", distance: "徒歩5分", lunchPrice: "", dinnerPrice: 3500, rating: 4.0, reviews: 95, igFollowers: 1800, features: ["写真映えするメニュー", "一人客歓迎"], strengths: "Instagramでの発信、カウンター席", weaknesses: "駐車場なし、席が少ない" }
  ];
  s.c3.customerNotes = "仕事帰りの会社員は「車で来られる」「個室」で選んでいる。家族連れは土日の昼が多い。";
  s.post = { channel: "Instagram", purpose: "季節限定", topic: "とちあいかの生いちごサワー", price: "680", point: "栃木県産のいちご「とちあいか」をたっぷり使った季節限定のサワーです", period: "1月〜3月" };
  return s;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.stores) && data.stores.length) return normalize(data);
    }
  } catch (err) {
    console.warn("保存データを読み込めませんでした", err);
  }
  const first = sampleStore();
  return { stores: [first], currentId: first.id };
}

/* 古いデータや読み込んだデータの欠けている項目を補う */
function normalize(data) {
  const stores = data.stores.map((raw) => {
    const base = blankStore();
    return {
      ...base,
      ...raw,
      id: raw.id || base.id,
      profile: { ...base.profile, ...(raw.profile || {}) },
      goal: { ...base.goal, ...(raw.goal || {}) },
      checks: raw.checks || {},
      records: Array.isArray(raw.records) ? raw.records : [],
      competitors: Array.isArray(raw.competitors) ? raw.competitors : [],
      c3: { ...base.c3, ...(raw.c3 || {}) },
      post: { ...base.post, ...(raw.post || {}) }
    };
  });
  const currentId = stores.some((s) => s.id === data.currentId) ? data.currentId : stores[0].id;
  return { stores, currentId };
}

let state = load();

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    toast("保存できませんでした。ブラウザの設定を確認してください。");
  }
}

function store() {
  return state.stores.find((s) => s.id === state.currentId) || state.stores[0];
}

/* ---------------- 分析ロジック ---------------- */

/* has() は data.js で定義 */

/* 平均客単価：ランチとディナーの両方なら、ランチの客数割合で重み付け */
function avgSpend(s) {
  const p = s.profile;
  const manual = num(s.goal.avgSpend);
  if (manual) return manual;
  const lunch = num(p.lunchPrice) || 0;
  const dinner = num(p.dinnerPrice) || 0;
  if (p.timeband === "ランチ中心" || p.timeband === "カフェタイム中心") return lunch || dinner;
  if (p.timeband === "ディナー中心" || p.timeband === "夜のみ（深夜まで）") return dinner || lunch;
  const share = Math.min(Math.max(num(s.goal.lunchShare) ?? 40, 0), 100) / 100;
  if (!lunch) return dinner;
  if (!dinner) return lunch;
  return lunch * share + dinner * (1 - share);
}

function scoreMeasures(p, extra = {}) {
  return MEASURES.map((m) => {
    const rules = m.rules(p).concat(extra[m.id] || []);
    let score = rules.reduce((sum, [pt]) => sum + pt, 0);
    const reasons = rules.filter(([pt]) => pt > 0).map(([, r]) => r);
    const cautions = rules.filter(([pt]) => pt < 0).map(([, r]) => r);

    const budget = Number(p.budget) || 0;
    const hours = Number(p.hours) || 2;
    if (m.cost === 2 && budget < 2) {
      score -= budget === 0 ? 30 : 15;
      cautions.push("費用がかかるため、予算に合わせて検討");
    } else if (m.cost === 1 && budget === 0) {
      score -= 8;
      cautions.push("少し費用がかかる");
    }
    if (m.time === 3 && hours === 1) {
      score -= 15;
      cautions.push("続けるには週2〜3時間ほど必要");
    } else if (m.time === 2 && hours === 1) {
      score -= 5;
    }
    return { ...m, score: Math.max(0, Math.min(100, Math.round(score))), reasons, cautions };
  }).sort((a, b) => b.score - a.score);
}

const LOCATION_TARGETS = {
  駅前: ["会社員", "学生"],
  繁華街: ["会社員", "女性グループ", "カップル"],
  オフィス街: ["会社員"],
  住宅街: ["家族連れ", "シニア", "地元の常連"],
  ロードサイド: ["家族連れ", "会社員"],
  観光地: ["観光客", "カップル"],
  商業施設内: ["家族連れ", "女性グループ"]
};

const TARGET_INFO = {
  会社員: { need: "提供の早さ、ランチセット、仕事帰りの一杯、宴会", where: "Googleマップ、グルメサイト、会社への案内" },
  家族連れ: { need: "子ども向けメニュー、座敷、駐車場、気兼ねなさ", where: "Googleマップ、Instagram、チラシ" },
  学生: { need: "量と安さ、学割、写真に撮りたくなる見た目", where: "Instagram、TikTok" },
  シニア: { need: "落ち着いた席、やさしい味、わかりやすいメニュー", where: "チラシ、口コミ（紹介）、LINE" },
  カップル: { need: "雰囲気、記念日の特典、予約のしやすさ", where: "Instagram、ホームページ、予約サイト" },
  女性グループ: { need: "写真映え、ヘルシー、ゆっくり話せる席", where: "Instagram、Googleマップの写真" },
  観光客: { need: "その土地らしさ、営業時間、待ち時間、駐車場", where: "Googleマップ、Instagram、観光サイト" },
  地元の常連: { need: "いつもの安心感、季節の変化、名前を覚えてもらえる", where: "LINE、店内POP、声かけ" }
};

function targetsFor(p) {
  const chosen = p.targets || [];
  const suggested = (LOCATION_TARGETS[p.location] || []).filter((t) => !chosen.includes(t));
  return { chosen, suggested };
}

const FUNNEL = [
  { stage: "知ってもらう", channels: ["insta", "tiktok", "x", "flyer", "gourmet"], tip: "Instagramやチラシで、お店の存在を知ってもらう" },
  { stage: "調べて選ぶ", channels: ["gbp", "hp", "gourmet"], tip: "Googleマップの写真、口コミ、メニュー、価格で選ばれる" },
  { stage: "予約・来店", channels: ["gbp", "hp", "gourmet", "line"], tip: "電話、ネット予約、道順がすぐわかる状態にする" },
  { stage: "また来る", channels: ["line"], tip: "LINEやショップカードで、2回目の来店につなげる" }
];

function swot(s) {
  const p = s.profile;
  const S = [];
  const W = [];
  const O = [];
  const T = [];

  if (p.strengths) S.push(p.strengths);
  const featureText = {
    駐車場あり: "駐車場があり、車で来やすい",
    "個室・宴会可": "個室や宴会に対応できる",
    予約可: "予約を受けられる",
    テイクアウト: "テイクアウトで席数以上に売れる",
    子連れ歓迎: "子連れで来やすい",
    一人客歓迎: "一人でも入りやすい",
    地元食材: "地元食材という語れる特徴がある",
    写真映えするメニュー: "写真に撮りたくなるメニューがある",
    深夜営業: "遅い時間も営業している",
    "ペット可・テラス": "ペット連れやテラスで選ばれる"
  };
  (p.features || []).forEach((f) => featureText[f] && S.push(featureText[f]));
  const used = CHANNELS.filter((c) => has(p.channels, c.id)).map((c) => c.label.replace(/（.*）/, ""));
  if (used.length) S.push(`すでに使っている発信手段：${used.join("、")}`);

  (p.issues || []).forEach((i) => W.push(i));
  if (!has(p.channels, "gbp")) W.push("Googleマップの対策ができていない");
  if (!has(p.channels, "line")) W.push("来店したお客様とつながる手段がない");

  const locOpp = {
    駅前: "通勤・通学の人の目に毎日入る",
    繁華街: "夜の人通りと二次会の需要がある",
    オフィス街: "ランチと宴会の需要が大きい",
    住宅街: "近所の常連客を育てやすい",
    ロードサイド: "車で通る人にGoogleマップで見つけてもらえる",
    観光地: "観光客が地図とInstagramで店を探している",
    商業施設内: "買い物客の流れを取り込める"
  };
  if (locOpp[p.location]) O.push(locOpp[p.location]);
  const m = new Date().getMonth() + 1;
  const next = ((m % 12) + 1);
  eventsFor(next, p.genre).slice(0, 2).forEach((e) => O.push(`来月（${next}月）の「${e.name}」`));
  if (has(p.features, "地元食材") && p.pref) O.push(`${p.pref}らしさを打ち出せる（地元の人にも観光客にも響く）`);

  if (has(p.issues, "近くに競合が増えた")) T.push("近くの競合と比べられる。Googleマップの写真と口コミで差がつく");
  if (has(p.issues, "人手が足りない")) T.push("人手不足。手間の少ない施策から始める");
  if (has(p.issues, "発信する時間がない")) T.push("発信が止まると効果も止まる。まとめて準備する仕組みが必要");
  compInsights(s).items.forEach((i) => {
    if (i.type === "good") O.push(`競合比較：${i.text}`);
    if (i.type === "bad") T.push(`競合比較：${i.text}`);
  });
  T.push("食材費や光熱費の値上がり。客数だけでなく客単価も見る");

  return { S, W, O, T };
}

function eventsFor(month, genre) {
  return (SEASON_EVENTS[month] || []).filter((e) => !e.genres || e.genres.includes(genre));
}

function goalCalc(s) {
  const p = s.profile;
  const g = s.goal;
  const avg = avgSpend(s);
  const target = num(g.targetSales);
  const current = num(g.currentSales);
  const days = num(p.openDays) || 25;
  const seats = num(p.seats) || 0;
  const repeat = Math.min(Math.max(num(g.repeatRate) ?? 40, 0), 100) / 100;
  const lineRate = Math.min(Math.max(num(g.lineRate) ?? 20, 0), 100) / 100;
  if (!target || !avg) return { ok: false, avg };

  const monthCustomers = target / avg;
  const dayCustomers = monthCustomers / days;
  const turnover = seats ? dayCustomers / seats : null;
  const newMonth = monthCustomers * (1 - repeat);
  const res = { ok: true, avg, target, days, seats, repeat, monthCustomers, dayCustomers, turnover, newMonth, newDay: newMonth / days };

  if (current) {
    const curMonth = current / avg;
    res.current = current;
    res.gapSales = target - current;
    res.gapMonth = monthCustomers - curMonth;
    res.gapDay = res.gapMonth / days;
    res.priceOnly = target / curMonth - avg; /* 客数そのままで単価だけ上げる場合 */
    /* 客単価を5%上げたうえで、残りを客数で埋める場合 */
    const avg5 = avg * 1.05;
    res.mixDay = (target / avg5 - curMonth) / days;
    res.avg5 = avg5;
  }
  /* リピート率を10ポイント上げると、必要な新規客は何人減るか */
  const repeatUp = Math.min(repeat + 0.1, 1);
  res.newMonthRepeatUp = monthCustomers * (1 - repeatUp);
  res.lineMonth = newMonth * lineRate;
  res.lineRate = lineRate;
  return res;
}

function latestRecord(s) {
  return [...s.records].sort((a, b) => (a.month < b.month ? 1 : -1))[0] || null;
}

/* 月ごとのチェックリスト */
function monthTasks(s, key) {
  const p = s.profile;
  const month = Number(key.split("-")[1]);
  const tasks = [];
  eventsFor(month, p.genre).forEach((e) => {
    tasks.push({ id: `e:${e.name}`, group: "季節の企画", text: `「${e.name}」の企画を決めて告知する`, hint: e.idea });
  });
  /* 翌月のイベントは前の月に準備する */
  eventsFor((month % 12) + 1, p.genre).slice(0, 2).forEach((e) => {
    tasks.push({ id: `n:${e.name}`, group: "季節の企画", text: `来月の「${e.name}」の写真と告知文を準備`, hint: e.idea });
  });
  scoreMeasures(p, compBonus(s))
    .filter((m) => m.score > 0)
    .slice(0, 5)
    .forEach((m) => {
      m.tasks.forEach((t, i) => tasks.push({ id: `m:${m.id}:${i}`, group: "毎月の作業（おすすめ施策から）", text: t, hint: m.name }));
    });
  tasks.push({ id: "r:record", group: "振り返り", text: "⑥ 効果測定に今月の数字を記録する", hint: "売上、客数、フォロワー数など" });
  return tasks;
}

function checkProgress(s, key) {
  const tasks = monthTasks(s, key);
  const done = tasks.filter((t) => s.checks[key] && s.checks[key][t.id]).length;
  return { tasks, done, total: tasks.length };
}

/* ---------------- 投稿文 ---------------- */

const GENRE_EMOJI = {
  居酒屋: "🍺",
  カフェ: "☕",
  ラーメン: "🍜",
  焼肉: "🥩",
  "和食・割烹": "🍶",
  寿司: "🍣",
  "洋食・イタリアン": "🍝",
  中華: "🥟",
  餃子: "🥟",
  "定食・食堂": "🍚",
  "そば・うどん": "🍜",
  "ベーカリー・スイーツ": "🍰",
  バー: "🍸",
  その他: "🍽"
};

function hashtags(p, f) {
  const area = (p.area || "").trim();
  const pref = (p.pref || "").trim();
  const words = GENRE_TAGS[p.genre] || GENRE_TAGS.その他;
  const tags = [];
  if (area) {
    tags.push(`${area}グルメ`, `${area}${words[0]}`);
    if (p.timeband !== "ディナー中心" && p.timeband !== "夜のみ（深夜まで）") tags.push(`${area}ランチ`);
  }
  if (pref) tags.push(`${pref}グルメ`, `${pref}${words[0]}`);
  words.forEach((w) => tags.push(w));
  if (f.purpose === "季節限定") tags.push("期間限定");
  if (f.purpose === "新メニュー") tags.push("新メニュー");
  if (f.purpose === "宴会予約の受付") tags.push("宴会", "忘年会", "飲み会");
  if (f.topic && f.topic.length <= 15 && !/\s/.test(f.topic)) tags.push(f.topic);
  if (has(p.features, "子連れ歓迎")) tags.push("子連れランチ");
  return [...new Set(tags.map((t) => t.replace(/[\s#・（）()]/g, "")).filter(Boolean))].slice(0, 15).map((t) => `#${t}`).join(" ");
}

function storeFooter(p, short = false) {
  const lines = [];
  const name = (p.name || "").replace(/^サンプル：/, "");
  lines.push(`📍 ${name}${p.area && !name.includes(p.area) ? `（${p.area}）` : ""}`);
  if (!short) {
    if (has(p.features, "駐車場あり")) lines.push("🚗 駐車場あります");
    if (has(p.features, "予約可")) lines.push("📞 ご予約はお電話・プロフィールのリンクから");
  }
  return lines.join("\n");
}

function headline(f) {
  const t = f.topic || "";
  switch (f.purpose) {
    case "新メニュー":
      return `【新メニュー】${t || "新しいメニュー"}が登場しました`;
    case "季節限定":
      return `【${f.period || "季節"}限定】${t || "季節のメニュー"}`;
    case "本日のおすすめ":
      return `本日のおすすめは「${t || "おすすめ"}」です`;
    case "空席・当日の案内":
      return `${f.period || "本日"}、お席に空きがございます`;
    case "イベント・キャンペーン":
      return `【${t || "キャンペーン"}】のお知らせ`;
    case "宴会予約の受付":
      return `【宴会のご予約受付中】${t || "宴会コース"}`;
    case "営業日・営業時間のお知らせ":
      return `【営業のお知らせ】${t || "営業日・営業時間について"}`;
    default:
      return t;
  }
}

function detailLines(f) {
  const lines = [];
  if (f.point) lines.push(f.point);
  if (f.price) lines.push(`価格：${/^\d+$/.test(f.price) ? `${Number(f.price).toLocaleString("ja-JP")}円` : f.price}`);
  if (f.period && !["季節限定", "空席・当日の案内"].includes(f.purpose)) lines.push(`期間・日時：${f.period}`);
  if (f.period && f.purpose === "季節限定") lines.push(`提供期間：${f.period}`);
  return lines;
}

function reviewReplies(p, f) {
  const name = (p.name || "").replace(/^サンプル：/, "");
  const point = f.topic ? `「${f.topic}」` : "";
  if (f.purpose === "口コミへの返信（高評価）") {
    return [
      {
        title: "ていねい",
        text: `このたびは${name}にお越しいただき、ありがとうございました。\n${point ? `${point}とのお言葉、スタッフ一同とても励みになります。` : "うれしいお言葉、スタッフ一同とても励みになります。"}\n${f.point ? `次回はぜひ${f.point}もお試しください。\n` : ""}またのご来店を心よりお待ちしております。`
      },
      {
        title: "親しみやすく",
        text: `ご来店と口コミ、ありがとうございます！${point ? `\n${point}、本当にうれしいです。` : ""}\n${f.point ? `次は${f.point}もおすすめなので、ぜひ食べに来てくださいね。` : "季節ごとにメニューも変わるので、また遊びに来てくださいね。"}\nお待ちしています！`
      },
      {
        title: "短く",
        text: `ご来店ありがとうございました。うれしいお言葉に感謝いたします。またのお越しをお待ちしております。`
      }
    ];
  }
  return [
    {
      title: "ていねい",
      text: `このたびはご来店いただき、ありがとうございました。\n${point ? `${point}の件、ご不快な思いをおかけし誠に申し訳ございません。` : "ご期待に添えず、誠に申し訳ございません。"}\nいただいたご意見はスタッフ全員で共有し、${f.point || "改善に努めてまいります"}。\nもしよろしければ、またお越しいただけましたら幸いです。`
    },
    {
      title: "改善を具体的に",
      text: `貴重なご意見をありがとうございます。\n${point ? `${point}について、` : ""}ご迷惑をおかけしました。\n${f.point ? `今後は${f.point}ことで改善いたします。` : "原因を確認し、同じことがないよう改善いたします。"}\n次にお越しの際は、気持ちよくお過ごしいただけるよう努めます。`
    },
    {
      title: "短く",
      text: `ご意見ありがとうございます。ご不快な思いをおかけし申し訳ございません。改善に努めてまいります。`
    }
  ];
}

function generatePosts(p, f) {
  if (f.purpose.startsWith("口コミへの返信")) return reviewReplies(p, f);

  const emoji = GENRE_EMOJI[p.genre] || "🍽";
  const head = headline(f);
  const details = detailLines(f);
  const tags = f.channel === "Instagram" ? `\n\n${hashtags(p, f)}` : "";

  const closing = {
    新メニュー: "ぜひ一度お試しください。",
    季節限定: "なくなり次第終了です。お早めにどうぞ。",
    本日のおすすめ: "数に限りがございます。",
    "空席・当日の案内": "お電話いただければお席をご用意しておきます。",
    "イベント・キャンペーン": "皆さまのご来店をお待ちしております。",
    宴会予約の受付: "人数や予算のご相談もお気軽にどうぞ。",
    "営業日・営業時間のお知らせ": "ご不便をおかけしますが、よろしくお願いいたします。"
  }[f.purpose] || "ご来店をお待ちしております。";

  const action = {
    Instagram: "保存しておくと、来店のときに見返せます📌",
    Googleビジネスプロフィール: "ご予約・お問い合わせは「電話」ボタンからどうぞ。",
    LINE公式アカウント: "このメッセージを会計時に見せていただくと、ささやかな特典をご用意しています。"
  }[f.channel];

  const friendly = [
    `${emoji} ${head}`,
    "",
    ...details,
    details.length ? "" : null,
    closing,
    action,
    "",
    storeFooter(p)
  ]
    .filter((l) => l !== null)
    .join("\n");

  const polite = [
    head,
    "",
    `いつも${(p.name || "").replace(/^サンプル：/, "")}をご利用いただき、ありがとうございます。`,
    ...details,
    closing,
    f.channel === "Googleビジネスプロフィール" ? action : "",
    "",
    storeFooter(p)
  ]
    .filter((l, i, arr) => !(l === "" && arr[i - 1] === ""))
    .join("\n");

  const shortText = [`${emoji} ${head}`, details[0] || "", closing].filter(Boolean).join("\n");

  return [
    { title: "親しみやすく", text: friendly + tags },
    { title: "ていねい", text: polite + tags },
    { title: "短く", text: shortText + (f.channel === "Instagram" ? tags : "") }
  ];
}

/* ---------------- フォーム部品 ---------------- */

function field(label, inner, opts = {}) {
  return `<label class="field ${opts.wide ? "wide" : ""}"><span>${label}${opts.hint ? `<small>${opts.hint}</small>` : ""}</span>${inner}</label>`;
}

function input(name, value, attrs = "") {
  return `<input name="${name}" value="${esc(value)}" ${attrs} />`;
}

function select(name, options, value) {
  return `<select name="${name}">${options
    .map((o) => {
      const v = typeof o === "object" ? o.id : o;
      const l = typeof o === "object" ? o.label : o;
      return `<option value="${esc(v)}" ${String(v) === String(value) ? "selected" : ""}>${esc(l)}</option>`;
    })
    .join("")}</select>`;
}

function chips(name, options, values, label, hint) {
  const items = options
    .map((o) => {
      const v = typeof o === "object" ? o.id : o;
      const l = typeof o === "object" ? o.label : o;
      return `<label class="chip"><input type="checkbox" name="${name}" value="${esc(v)}" ${has(values, v) ? "checked" : ""} /><span>${esc(l)}</span></label>`;
    })
    .join("");
  return `<fieldset class="field wide"><legend>${label}${hint ? `<small>${hint}</small>` : ""}</legend><div class="chips">${items}</div></fieldset>`;
}

/* ---------------- 描画：店舗切り替え ---------------- */

function renderStoreSelect() {
  const sel = $("[data-store-select]");
  sel.innerHTML = state.stores.map((s) => `<option value="${s.id}" ${s.id === state.currentId ? "selected" : ""}>${esc(s.profile.name || "（名前なし）")}</option>`).join("");
}

/* ---------------- 描画：店舗情報 ---------------- */

function renderProfileForm() {
  const p = store().profile;
  $("[data-profile-form]").innerHTML = [
    `<h2 class="wide">基本情報</h2>`,
    field("店舗名", input("name", p.name, 'required maxlength="60"')),
    field("業態", select("genre", GENRES, p.genre)),
    field("都道府県", input("pref", p.pref, 'placeholder="栃木"'), { hint: "ハッシュタグに使います" }),
    field("市町村・エリア", input("area", p.area, 'placeholder="宇都宮"'), { hint: "ハッシュタグに使います" }),
    field("立地", select("location", LOCATIONS, p.location)),
    field("営業の中心", select("timeband", TIMEBANDS, p.timeband)),
    field("席数", input("seats", p.seats, 'type="number" min="0" inputmode="numeric"')),
    field("月の営業日数", input("openDays", p.openDays, 'type="number" min="1" max="31" inputmode="numeric"')),
    field("ランチの客単価（円）", input("lunchPrice", p.lunchPrice, 'type="number" min="0" step="50" inputmode="numeric"')),
    field("ディナーの客単価（円）", input("dinnerPrice", p.dinnerPrice, 'type="number" min="0" step="100" inputmode="numeric"')),
    `<h2 class="wide">お客様と発信</h2>`,
    chips("targets", TARGETS, p.targets, "来てほしいお客様", "複数選べます"),
    chips("channels", CHANNELS, p.channels, "今使っている集客手段", "使っていなければ空欄のまま"),
    chips("features", FEATURES, p.features, "お店の特徴"),
    `<h2 class="wide">困っていることと、使える予算・時間</h2>`,
    chips("issues", ISSUES, p.issues, "困っていること", "ここが施策の優先順位に一番効きます"),
    field("集客に使える予算", select("budget", BUDGETS, p.budget)),
    field("発信に使える時間", select("hours", HOURS, p.hours)),
    field("お店の自慢・こだわり", `<textarea name="strengths" rows="2" placeholder="例：栃木の地酒が20種類、手づくりの餃子">${esc(p.strengths)}</textarea>`, { wide: true }),
    field("メモ", `<textarea name="memo" rows="2">${esc(p.memo)}</textarea>`, { wide: true })
  ].join("");
}

function readProfileForm(form) {
  const p = store().profile;
  const fd = new FormData(form);
  ["name", "genre", "pref", "area", "location", "timeband", "strengths", "memo"].forEach((k) => (p[k] = String(fd.get(k) ?? "").trim()));
  ["seats", "openDays", "lunchPrice", "dinnerPrice", "budget", "hours"].forEach((k) => (p[k] = num(fd.get(k)) ?? ""));
  ["targets", "channels", "features", "issues"].forEach((k) => (p[k] = fd.getAll(k).map(String)));
  if (!p.name) p.name = "（名前なし）";
}

/* ---------------- 描画：ホーム ---------------- */

function renderHome() {
  const s = store();
  const p = s.profile;
  const g = goalCalc(s);
  const measures = scoreMeasures(p, compBonus(s));
  const key = monthKey();
  const prog = checkProgress(s, key);
  const rec = latestRecord(s);

  $("[data-home-title]").textContent = `${p.name.replace(/^サンプル：/, "")}の集客を、やることリストまで落とし込む。`;

  const kpis = [
    { label: "目標達成に必要な客数", value: g.ok ? `1日 ${fmt(g.dayCustomers)}人` : "—", note: g.ok ? `月 ${fmt(g.monthCustomers)}人／客単価 ${yen(g.avg)}` : "③で目標売上を入れてください" },
    { label: "今月のチェックリスト", value: `${prog.done} / ${prog.total}`, note: `${monthLabel(key)}の実行状況`, pct: prog.total ? prog.done / prog.total : 0 },
    {
      label: "直近の売上",
      value: rec && rec.sales ? yen(num(rec.sales)) : "—",
      note: rec ? `${monthLabel(rec.month)}${g.ok && rec.sales ? `／目標の${fmt((num(rec.sales) / g.target) * 100)}%` : ""}` : "⑥で記録してください"
    },
    { label: "最優先の施策", value: measures[0] ? measures[0].name : "—", note: measures[0] ? `優先度 ${measures[0].score}点` : "", small: true }
  ];
  $("[data-home-kpi]").innerHTML = kpis
    .map(
      (k) => `<div class="kpi"><span>${k.label}</span><strong class="${k.small ? "small" : ""}">${esc(k.value)}</strong>${
        k.pct !== undefined ? `<div class="bar"><i style="width:${Math.round(k.pct * 100)}%"></i></div>` : ""
      }<small>${esc(k.note)}</small></div>`
    )
    .join("");

  $("[data-home-top]").innerHTML = `<ol class="top-list">${measures
    .slice(0, 3)
    .map((m) => `<li><b>${esc(m.name)}</b><span>${esc(m.reasons.slice(0, 2).join("／") || m.desc)}</span></li>`)
    .join("")}</ol><button type="button" class="button ghost" data-goto="strategy">施策をくわしく見る</button>`;

  const todo = prog.tasks.filter((t) => !(s.checks[key] && s.checks[key][t.id]));
  $("[data-home-todo]").innerHTML = todo.length
    ? `<ul class="todo-list">${todo
        .slice(0, 6)
        .map((t) => `<li><label><input type="checkbox" data-check="${esc(t.id)}" data-month="${key}" /> ${esc(t.text)}</label></li>`)
        .join("")}</ul>${todo.length > 6 ? `<p class="note">ほか${todo.length - 6}件</p>` : ""}<button type="button" class="button ghost" data-goto="calendar">カレンダーを開く</button>`
    : `<p class="empty">今月のやることはすべて完了しました。</p>`;
}

/* ---------------- 描画：戦略 ---------------- */

function list(items, empty = "特になし") {
  return items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : `<p class="empty">${empty}</p>`;
}

function renderStrategy() {
  const s = store();
  const p = s.profile;
  const w = swot(s);
  $("[data-swot]").innerHTML = `
    <div class="swot-box s"><h3>強み</h3>${list(w.S, "①でお店の特徴や自慢を入れてください")}</div>
    <div class="swot-box w"><h3>弱み・課題</h3>${list(w.W)}</div>
    <div class="swot-box o"><h3>チャンス</h3>${list(w.O)}</div>
    <div class="swot-box t"><h3>注意点</h3>${list(w.T)}</div>`;

  const t = targetsFor(p);
  const card = (name, tag) => {
    const info = TARGET_INFO[name];
    return `<div class="target"><b>${esc(name)}</b>${tag ? `<em>${tag}</em>` : ""}<span>響くこと：${esc(info.need)}</span><span>届け方：${esc(info.where)}</span></div>`;
  };
  $("[data-targets]").innerHTML =
    (t.chosen.length ? t.chosen.map((n) => card(n, "")).join("") : `<p class="empty">①で「来てほしいお客様」を選んでください。</p>`) +
    t.suggested.map((n) => card(n, `${p.location}なので狙い目`)).join("");

  $("[data-funnel]").innerHTML = FUNNEL.map((f) => {
    const ok = f.channels.some((c) => has(p.channels, c)) || (f.stage === "予約・来店" && has(p.features, "予約可"));
    return `<div class="funnel-step ${ok ? "ok" : "ng"}"><b>${f.stage}</b><span>${ok ? "対策あり" : "手薄"}</span><small>${esc(f.tip)}</small></div>`;
  }).join("");

  const measures = scoreMeasures(p, compBonus(s));
  $("[data-measures]").innerHTML = measures
    .map(
      (m, i) => `
      <details class="measure" ${i < 3 ? "open" : ""}>
        <summary>
          <span class="rank">${i + 1}</span>
          <span class="m-title">${esc(m.name)}</span>
          <span class="score" style="--w:${m.score}%"><i></i><b>${m.score}</b></span>
        </summary>
        <div class="m-body">
          <p>${esc(m.desc)}</p>
          <div class="tags">
            <span>目的：${m.goal}</span>
            <span>費用：${["無料", "少しかかる", "有料"][m.cost]}</span>
            <span>手間：${["", "少ない", "ふつう", "多い"][m.time]}</span>
            <span>効果まで：${m.lead}</span>
          </div>
          ${m.reasons.length ? `<p class="why"><b>このお店に合う理由：</b>${esc(m.reasons.join("／"))}</p>` : ""}
          ${m.cautions.length ? `<p class="caution"><b>注意：</b>${esc(m.cautions.join("／"))}</p>` : ""}
          <h4>やること</h4>
          <ol>${m.steps.map((st) => `<li>${esc(st)}</li>`).join("")}</ol>
        </div>
      </details>`
    )
    .join("");
}

/* ---------------- 描画：目標 ---------------- */

function renderGoalForm() {
  const s = store();
  const g = s.goal;
  const p = s.profile;
  const both = p.timeband === "ランチとディナー";
  $("[data-goal-form]").innerHTML = [
    field("目標の月商（円）", input("targetSales", g.targetSales, 'type="number" min="0" step="10000" inputmode="numeric" placeholder="4500000"')),
    field("今の月商（円）", input("currentSales", g.currentSales, 'type="number" min="0" step="10000" inputmode="numeric" placeholder="わかれば"'), { hint: "目標との差を計算します" }),
    field(
      "平均客単価（円）",
      input("avgSpend", g.avgSpend, `type="number" min="0" step="50" inputmode="numeric" placeholder="自動：${Math.round(avgSpend({ ...s, goal: { ...g, avgSpend: "" } }) || 0)}"`),
      { hint: "空欄なら①の客単価から自動で計算" }
    ),
    both ? field("ランチ客の割合（%）", input("lunchShare", g.lunchShare, 'type="number" min="0" max="100" inputmode="numeric"'), { hint: "客数のうちランチが何割か" }) : "",
    field("仮定：リピーターの割合（%）", input("repeatRate", g.repeatRate, 'type="number" min="0" max="100" inputmode="numeric"'), { hint: "来店のうち2回目以降の人" }),
    field("仮定：新規客のLINE登録率（%）", input("lineRate", g.lineRate, 'type="number" min="0" max="100" inputmode="numeric"'))
  ].join("");
}

function renderGoalResult() {
  const s = store();
  const r = goalCalc(s);
  const el = $("[data-goal-result]");
  if (!r.ok) {
    el.innerHTML = `<p class="empty">目標の月商を入れると計算します。</p>`;
    return;
  }
  const rows = [
    ["平均客単価", yen(r.avg)],
    ["必要な客数（月）", `${fmt(r.monthCustomers)}人`],
    ["必要な客数（1日）", `${fmt(r.dayCustomers)}人`, `営業日 ${r.days}日で計算`],
    r.turnover !== null ? ["席の回転数（1日）", `${fmt(r.turnover, 1)}回転`, `${r.seats}席で計算`] : null,
    ["うち新規客（月）", `${fmt(r.newMonth)}人`, `1日 ${fmt(r.newDay, 1)}人`]
  ].filter(Boolean);

  let html = `<table class="kv">${rows.map(([k, v, n]) => `<tr><th>${k}</th><td><b>${v}</b>${n ? `<small>${n}</small>` : ""}</td></tr>`).join("")}</table>`;

  if (r.turnover !== null && r.turnover > 3) {
    html += `<p class="caution">1日${fmt(r.turnover, 1)}回転は席数に対して多めです。客単価アップやテイクアウトを組み合わせるのが現実的です。</p>`;
  }

  if (r.current) {
    html += `<h3 class="mt">今との差：${yen(r.gapSales)}／月</h3>`;
    if (r.gapSales <= 0) {
      html += `<p class="good">今の月商で目標に届いています。</p>`;
    } else {
      html += `<div class="ways">
        <div><b>A. 客数だけで埋める</b><span>1日あと <em>${fmt(r.gapDay, 1)}人</em></span></div>
        <div><b>B. 客単価だけで埋める</b><span>1人あと <em>${yen(r.priceOnly)}</em></span></div>
        <div><b>C. 両方で埋める（おすすめ）</b><span>客単価を5%上げて <em>${yen(r.avg5)}</em> にし、1日あと <em>${fmt(Math.max(r.mixDay, 0), 1)}人</em></span></div>
      </div>`;
    }
  }

  html += `<h3 class="mt">リピーターとLINEの目安</h3>
    <ul class="plain">
      <li>リピーターの割合を10ポイント上げると、必要な新規客は月 <b>${fmt(r.newMonth)}人 → ${fmt(r.newMonthRepeatUp)}人</b> に減ります。</li>
      <li>新規客の${fmt(r.lineRate * 100)}%がLINE登録すると、友だちは月に約 <b>${fmt(r.lineMonth)}人</b> 増えます。</li>
    </ul>
    <p class="note">「仮定」の数字は目安です。⑥で記録した実績に合わせて見直してください。</p>`;
  el.innerHTML = html;
}

/* ---------------- 描画：カレンダー ---------------- */

function renderCalendar() {
  const s = store();
  const input = $("[data-cal-month]");
  if (!input.value) input.value = monthKey();
  const key = input.value;
  const month = Number(key.split("-")[1]);
  const events = eventsFor(month, s.profile.genre);
  $("[data-cal-events]").innerHTML = events.length
    ? events.map((e) => `<div class="event"><b>${esc(e.name)}</b><span>${esc(e.idea)}</span></div>`).join("")
    : `<p class="empty">この月の季節テーマは登録されていません。</p>`;

  const tasks = monthTasks(s, key);
  const checked = s.checks[key] || {};
  const groups = [...new Set(tasks.map((t) => t.group))];
  $("[data-cal-tasks]").innerHTML = groups
    .map(
      (g) => `<h3 class="task-group">${esc(g)}</h3><ul class="task-list">${tasks
        .filter((t) => t.group === g)
        .map(
          (t) => `<li class="${checked[t.id] ? "done" : ""}"><label><input type="checkbox" data-check="${esc(t.id)}" data-month="${key}" ${
            checked[t.id] ? "checked" : ""
          } /><span>${esc(t.text)}<small>${esc(t.hint)}</small></span></label></li>`
        )
        .join("")}</ul>`
    )
    .join("");
}

/* ---------------- 描画：投稿文 ---------------- */

function renderPostForm() {
  const f = store().post;
  const review = f.purpose.startsWith("口コミへの返信");
  const low = f.purpose === "口コミへの返信（低評価）";
  $("[data-post-form]").innerHTML = [
    review ? "" : field("投稿先", select("channel", POST_CHANNELS, f.channel)),
    field("目的", select("purpose", POST_PURPOSES, f.purpose)),
    field(
      review ? "口コミの要点" : "メニュー名・テーマ",
      input("topic", f.topic, `maxlength="60" placeholder="${review ? (low ? "例：料理が出るのが遅かった" : "例：餃子がおいしかった") : "例：とちあいかのパフェ"}"`)
    ),
    review
      ? field(low ? "改善すること" : "次におすすめしたいもの", input("point", f.point, `maxlength="80" placeholder="${low ? "例：ピーク時の人員を増やす" : "例：季節の地酒"}"`))
      : field("おすすめポイント", `<textarea name="point" rows="2" maxlength="200" placeholder="例：栃木県産のいちごを丸ごと8粒">${esc(f.point)}</textarea>`),
    review ? "" : field("価格", input("price", f.price, 'maxlength="30" placeholder="例：780"')),
    review ? "" : field("期間・日時", input("period", f.period, 'maxlength="40" placeholder="例：1月〜3月、本日18時〜"'))
  ].join("");
}

function renderPostResult() {
  const s = store();
  const posts = generatePosts(s.profile, s.post);
  $("[data-post-result]").innerHTML = posts
    .map(
      (p, i) => `<div class="post"><div class="post-head"><b>${esc(p.title)}</b><span>${p.text.length}文字</span><button type="button" class="button ghost small" data-copy="${i}">コピー</button></div><pre>${esc(p.text)}</pre></div>`
    )
    .join("");
  $("[data-post-result]").dataset.texts = JSON.stringify(posts.map((p) => p.text));
}

/* ---------------- 描画：効果測定 ---------------- */

const METRICS = [...RECORD_FIELDS, { id: "avg", label: "客単価（円）", unit: "円" }, { id: "newRate", label: "新規客の割合（%）", unit: "%" }];

function metricValue(r, id) {
  if (id === "avg") return num(r.sales) && num(r.customers) ? num(r.sales) / num(r.customers) : null;
  if (id === "newRate") return num(r.newCustomers) !== null && num(r.customers) ? (num(r.newCustomers) / num(r.customers)) * 100 : null;
  return num(r[id]);
}

function renderRecordForm(editMonth) {
  const s = store();
  const month = editMonth || monthKey();
  const r = s.records.find((x) => x.month === month) || {};
  $("[data-record-form]").innerHTML = [
    field("対象の月", `<input type="month" name="month" value="${month}" required />`),
    ...RECORD_FIELDS.map((f) => field(f.label, input(f.id, r[f.id] ?? "", `type="number" min="0" step="${f.step || "1"}" inputmode="decimal"`))),
    field("メモ（やった施策など）", input("memo", r.memo || "", 'maxlength="120"'), { wide: true }),
    `<div class="wide form-actions"><button type="submit" class="button primary">この月の数字を保存</button></div>`
  ].join("");
}

function renderRecords() {
  const s = store();
  const sel = $("[data-chart-metric]");
  if (!sel.options.length) {
    sel.innerHTML = METRICS.map((m) => `<option value="${m.id}">${m.label}</option>`).join("");
  }
  const rows = [...s.records].sort((a, b) => (a.month < b.month ? -1 : 1));

  /* 表 */
  const cols = [...RECORD_FIELDS.map((f) => f.id), "avg"];
  const label = (id) => METRICS.find((m) => m.id === id).label.replace(/（.*）/, "");
  $("[data-record-table]").innerHTML = rows.length
    ? `<table class="records"><thead><tr><th>月</th>${cols.map((c) => `<th>${label(c)}</th>`).join("")}<th>メモ</th><th></th></tr></thead><tbody>${[...rows]
        .reverse()
        .map((r) => {
          const i = rows.indexOf(r);
          const prev = rows[i - 1];
          return `<tr><th>${monthLabel(r.month)}</th>${cols
            .map((c) => {
              const v = metricValue(r, c);
              const pv = prev ? metricValue(prev, c) : null;
              let diff = "";
              if (v !== null && pv) {
                const d = ((v - pv) / pv) * 100;
                diff = `<small class="${d >= 0 ? "up" : "down"}">${d >= 0 ? "+" : ""}${fmt(d, 1)}%</small>`;
              }
              return `<td>${v === null ? "—" : fmt(v, c === "rating" ? 1 : 0)}${diff}</td>`;
            })
            .join("")}<td class="memo">${esc(r.memo || "")}</td><td class="row-actions"><button type="button" class="button ghost small" data-edit-record="${r.month}">編集</button><button type="button" class="button ghost small" data-del-record="${r.month}">削除</button></td></tr>`;
        })
        .join("")}</tbody></table>`
    : `<p class="empty">まだ記録がありません。</p>`;

  renderChart(rows, sel.value || "sales");
}

function renderChart(rows, metric) {
  const el = $("[data-chart]");
  const m = METRICS.find((x) => x.id === metric);
  const pts = rows.map((r) => ({ label: r.month, v: metricValue(r, metric) })).filter((p) => p.v !== null);
  if (pts.length === 0) {
    el.innerHTML = `<p class="empty">グラフにする記録がありません。</p>`;
    return;
  }
  const goal = metric === "sales" ? num(store().goal.targetSales) : null;
  const W = 720;
  const H = 260;
  const pad = { l: 64, r: 16, t: 20, b: 36 };
  const vals = pts.map((p) => p.v).concat(goal ? [goal] : []);
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  if (min === max) {
    min = min * 0.9;
    max = max * 1.1 || 1;
  }
  const span = max - min;
  min = Math.max(0, min - span * 0.15);
  max = max + span * 0.1;
  const x = (i) => pad.l + (pts.length === 1 ? (W - pad.l - pad.r) / 2 : (i * (W - pad.l - pad.r)) / (pts.length - 1));
  const y = (v) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
  const short = (v) => (v >= 10000 ? `${fmt(v / 10000, 1)}万` : fmt(v, metric === "rating" ? 1 : 0));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => min + (max - min) * t);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");

  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(m.label)}の推移">
    ${ticks.map((t) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}" class="grid"/><text x="${pad.l - 8}" y="${y(t) + 4}" text-anchor="end" class="axis">${short(t)}</text>`).join("")}
    ${goal ? `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(goal)}" y2="${y(goal)}" class="goal"/><text x="${W - pad.r}" y="${y(goal) - 6}" text-anchor="end" class="goal-label">目標 ${short(goal)}</text>` : ""}
    <path d="${path}" class="line"/>
    ${pts
      .map(
        (p, i) => `<circle cx="${x(i)}" cy="${y(p.v)}" r="4.5" class="dot"><title>${monthLabel(p.label)}：${fmt(p.v, metric === "rating" ? 1 : 0)}${m.unit}</title></circle>
      <text x="${x(i)}" y="${H - 12}" text-anchor="middle" class="axis">${Number(p.label.split("-")[1])}月</text>
      <text x="${x(i)}" y="${y(p.v) - 10}" text-anchor="middle" class="val">${short(p.v)}</text>`
      )
      .join("")}
  </svg>`;
}

/* ---------------- 描画：提案書 ---------------- */

function renderProposal() {
  const s = store();
  const p = s.profile;
  const w = swot(s);
  const g = goalCalc(s);
  const measures = scoreMeasures(p, compBonus(s)).slice(0, 5);
  const t = targetsFor(p);
  const now = new Date();
  const months = [0, 1, 2].map((n) => addMonths(monthKey(), n));
  const name = p.name.replace(/^サンプル：/, "");

  $("[data-proposal]").innerHTML = `
    <header class="pr-head">
      <p>${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日</p>
      <h1>${esc(name)} 様<br />集客・マーケティング戦略のご提案</h1>
    </header>

    <section>
      <h2>1. お店の概要</h2>
      <table class="kv">
        <tr><th>業態・立地</th><td>${esc(p.genre)}／${esc(p.pref)}${esc(p.area)}・${esc(p.location)}</td></tr>
        <tr><th>営業</th><td>${esc(p.timeband)}／${esc(p.seats)}席／月${esc(p.openDays)}日営業</td></tr>
        <tr><th>客単価</th><td>ランチ ${yen(num(p.lunchPrice))}／ディナー ${yen(num(p.dinnerPrice))}</td></tr>
        <tr><th>困っていること</th><td>${esc((p.issues || []).join("、") || "—")}</td></tr>
      </table>
    </section>

    <section>
      <h2>2. 現状の整理</h2>
      <div class="swot print-swot">
        <div class="swot-box s"><h3>強み</h3>${list(w.S)}</div>
        <div class="swot-box w"><h3>弱み・課題</h3>${list(w.W)}</div>
        <div class="swot-box o"><h3>チャンス</h3>${list(w.O)}</div>
        <div class="swot-box t"><h3>注意点</h3>${list(w.T)}</div>
      </div>
    </section>

    <section>
      <h2>3. 狙うお客様</h2>
      <ul>${[...t.chosen, ...t.suggested]
        .map((n) => `<li><b>${esc(n)}</b>：${esc(TARGET_INFO[n].need)}（届け方：${esc(TARGET_INFO[n].where)}）</li>`)
        .join("") || "<li>—</li>"}</ul>
    </section>

    ${proposal3C(s)}

    <section>
      <h2>4. 取り組む施策（優先順）</h2>
      ${measures
        .map(
          (m, i) => `<div class="pr-measure"><h3>${i + 1}. ${esc(m.name)}</h3>
          <p>${esc(m.desc)}${m.reasons.length ? `<br /><b>理由：</b>${esc(m.reasons.join("／"))}` : ""}</p>
          <ul>${m.steps.map((st) => `<li>${esc(st)}</li>`).join("")}</ul></div>`
        )
        .join("")}
    </section>

    <section>
      <h2>5. 数値目標</h2>
      ${
        g.ok
          ? `<table class="kv">
          <tr><th>目標の月商</th><td>${yen(g.target)}</td></tr>
          <tr><th>必要な客数</th><td>月 ${fmt(g.monthCustomers)}人（1日 ${fmt(g.dayCustomers)}人）／客単価 ${yen(g.avg)}</td></tr>
          <tr><th>うち新規客</th><td>月 ${fmt(g.newMonth)}人</td></tr>
          ${g.current && g.gapSales > 0 ? `<tr><th>今との差</th><td>${yen(g.gapSales)}／月 → 客単価を${yen(g.avg5)}にし、1日あと${fmt(Math.max(g.mixDay, 0), 1)}人</td></tr>` : ""}
        </table>`
          : "<p>③で目標の月商を入れると表示されます。</p>"
      }
    </section>

    <section>
      <h2>6. これから3か月の販促テーマ</h2>
      <table class="kv">${months
        .map((k) => {
          const ev = eventsFor(Number(k.split("-")[1]), p.genre);
          return `<tr><th>${monthLabel(k)}</th><td>${esc(ev.map((e) => e.name).join("、") || "—")}</td></tr>`;
        })
        .join("")}</table>
    </section>

    <section>
      <h2>7. 毎月確認する数字</h2>
      <p>売上、客数、新規客の数、Googleプロフィールの表示回数、口コミ件数と評価、Instagramのフォロワー数、LINEの友だち数を毎月記録し、施策の効果を確認します。</p>
    </section>
  `;
}

/* ---------------- 全体の再描画 ---------------- */

function renderAll({ forms = true } = {}) {
  renderStoreSelect();
  if (forms) {
    renderProfileForm();
    renderGoalForm();
    renderPostForm();
    renderRecordForm();
    renderCompForm();
  }
  renderHome();
  renderStrategy();
  renderGoalResult();
  renderCalendar();
  renderPostResult();
  renderRecords();
  renderCompetitors();
  renderProposal();
}

/* ---------------- イベント ---------------- */

function showView(name) {
  $$(".tab").forEach((t) => t.classList.toggle("is-active", t.dataset.view === name));
  $$(".view").forEach((v) => v.classList.toggle("is-active", v.dataset.viewPanel === name));
  try {
    sessionStorage.setItem(`${STORAGE_KEY}-view`, name);
  } catch (err) {
    /* 保存できなくても動作には影響しない */
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bind() {
  $$(".tab").forEach((t) => t.addEventListener("click", () => showView(t.dataset.view)));

  document.addEventListener("click", (e) => {
    const go = e.target.closest("[data-goto]");
    if (go) showView(go.dataset.goto);

    const copy = e.target.closest("[data-copy]");
    if (copy) {
      const texts = JSON.parse($("[data-post-result]").dataset.texts || "[]");
      const text = texts[Number(copy.dataset.copy)] || "";
      const done = () => toast("コピーしました");
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
      } else {
        fallbackCopy(text, done);
      }
    }

    const edit = e.target.closest("[data-edit-record]");
    if (edit) {
      renderRecordForm(edit.dataset.editRecord);
      $("[data-record-form]").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const del = e.target.closest("[data-del-record]");
    if (del && confirm(`${monthLabel(del.dataset.delRecord)}の記録を削除しますか？`)) {
      const s = store();
      s.records = s.records.filter((r) => r.month !== del.dataset.delRecord);
      save();
      renderAll({ forms: false });
      toast("削除しました");
    }
  });

  document.addEventListener("change", (e) => {
    const box = e.target.closest("[data-check]");
    if (!box) return;
    const s = store();
    const key = box.dataset.month;
    s.checks[key] = s.checks[key] || {};
    if (box.checked) s.checks[key][box.dataset.check] = true;
    else delete s.checks[key][box.dataset.check];
    save();
    renderHome();
    renderCalendar();
  });

  /* 店舗情報：入力するたびに保存 */
  const profileForm = $("[data-profile-form]");
  profileForm.addEventListener("input", () => {
    readProfileForm(profileForm);
    save();
    renderStoreSelect();
    renderAll({ forms: false });
    renderGoalForm();
  });
  profileForm.addEventListener("submit", (e) => e.preventDefault());

  const goalForm = $("[data-goal-form]");
  goalForm.addEventListener("input", () => {
    const fd = new FormData(goalForm);
    const g = store().goal;
    ["targetSales", "currentSales", "avgSpend", "lunchShare", "repeatRate", "lineRate"].forEach((k) => {
      if (fd.has(k)) g[k] = String(fd.get(k) ?? "");
    });
    save();
    renderAll({ forms: false });
  });
  goalForm.addEventListener("submit", (e) => e.preventDefault());

  const postForm = $("[data-post-form]");
  postForm.addEventListener("input", (e) => {
    const fd = new FormData(postForm);
    const f = store().post;
    const before = f.purpose;
    ["channel", "purpose", "topic", "price", "point", "period"].forEach((k) => {
      if (fd.has(k)) f[k] = String(fd.get(k) ?? "");
    });
    /* 口コミ返信と通常投稿では入力欄の意味が違うので、切り替えたら中身を空にする */
    if (e.target.name === "purpose" && before !== f.purpose && (before.startsWith("口コミ") || f.purpose.startsWith("口コミ"))) {
      f.topic = "";
      f.point = "";
    }
    save();
    if (e.target.name === "purpose") renderPostForm();
    renderPostResult();
  });
  postForm.addEventListener("submit", (e) => e.preventDefault());

  const recordForm = $("[data-record-form]");
  recordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(recordForm);
    const month = String(fd.get("month") || "");
    if (!/^\d{4}-\d{2}$/.test(month)) {
      toast("対象の月を選んでください");
      return;
    }
    const row = { month, memo: String(fd.get("memo") || "").trim() };
    RECORD_FIELDS.forEach((f) => (row[f.id] = num(fd.get(f.id)) ?? ""));
    const s = store();
    s.records = s.records.filter((r) => r.month !== month).concat(row);
    save();
    renderAll({ forms: false });
    toast(`${monthLabel(month)}の数字を保存しました`);
  });
  recordForm.addEventListener("change", (e) => {
    /* 月を変えたら、その月の記録を読み込む */
    if (e.target.name === "month" && e.target.value) renderRecordForm(e.target.value);
  });

  $("[data-chart-metric]").addEventListener("change", renderRecords);
  $("[data-cal-month]").addEventListener("change", renderCalendar);

  $("[data-store-select]").addEventListener("change", (e) => {
    state.currentId = e.target.value;
    save();
    renderAll();
  });

  $("[data-action='new-store']").addEventListener("click", () => {
    const name = prompt("店舗名を入力してください", "");
    if (name === null) return;
    const s = blankStore(name.trim() || "新しい店舗");
    state.stores.push(s);
    state.currentId = s.id;
    save();
    renderAll();
    showView("profile");
    toast("店舗を追加しました");
  });

  $("[data-action='delete-store']").addEventListener("click", () => {
    const s = store();
    if (!confirm(`「${s.profile.name}」を削除しますか？記録もすべて消えます。`)) return;
    state.stores = state.stores.filter((x) => x.id !== s.id);
    if (!state.stores.length) state.stores.push(blankStore());
    state.currentId = state.stores[0].id;
    save();
    renderAll();
    showView("home");
    toast("削除しました");
  });

  $("[data-action='export']").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `inshoku-marketing-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  const fileInput = $("[data-import-file]");
  $("[data-action='import']").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    fileInput.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || !Array.isArray(data.stores) || !data.stores.length) throw new Error("形式が違います");
      if (!confirm("今のデータを、読み込んだデータで置き換えますか？")) return;
      state = normalize(data);
      save();
      renderAll();
      toast("読み込みました");
    } catch (err) {
      toast("読み込めませんでした。バックアップしたファイルを選んでください。");
    }
  });

  $("[data-action='print']").addEventListener("click", () => window.print());
  bindCompetitors();
}

function fallbackCopy(text, done) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
    done();
  } catch (err) {
    toast("コピーできませんでした。文面を選択してコピーしてください。");
  }
  ta.remove();
}

/* ---------------- 起動 ---------------- */

bind();
renderAll();
try {
  const last = sessionStorage.getItem(`${STORAGE_KEY}-view`);
  if (last && $(`[data-view-panel="${last}"]`)) showView(last);
} catch (err) {
  /* 何もしない */
}
