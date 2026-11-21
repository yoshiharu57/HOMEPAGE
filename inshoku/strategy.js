/* =========================================================
   飲食店マーケティング戦略アプリ：メニュー分析・4P・施策の費用対効果
   - app.js / comp.js の共通関数（$, esc, num, store, field など）を使います
   ========================================================= */

const MENU_CATEGORIES = ["料理", "ドリンク", "ランチ", "デザート", "コース", "テイクアウト", "その他"];

/* 原価率の一般的な目安（業態や品目で差があります） */
const COST_RATE_GUIDE = 0.3;

/* メニューの4分類（人気×利益） */
const MENU_TYPES = {
  star: { label: "看板メニュー", sub: "人気も利益も高い", action: "メニュー表の一番目立つ位置と写真で前面に出し、味と量を守る。", cls: "star" },
  plow: { label: "人気だが利益が薄い", sub: "よく売れるが1品の儲けが少ない", action: "原価を見直すか少し値上げする。利益の高い品とのセットにする。", cls: "plow" },
  puzzle: { label: "利益は高いが売れていない", sub: "儲かるのに知られていない", action: "名前、写真、置き場所を変え、スタッフが「おすすめ」と声をかける。", cls: "puzzle" },
  dog: { label: "見直し候補", sub: "人気も利益も低い", action: "入れ替えや終了を検討する。手間や食材ロスも減らせる。", cls: "dog" }
};

/* ---------------- メニュー分析 ---------------- */

function menuAnalysis(s) {
  const rows = (s.menu || [])
    .map((m) => {
      const price = num(m.price);
      const cost = num(m.cost);
      const qty = num(m.qty);
      const ok = price !== null && price > 0 && qty !== null;
      return {
        ...m,
        price,
        cost,
        qty,
        ok,
        sales: ok ? price * qty : null,
        unitGp: ok && cost !== null ? price - cost : null,
        gp: ok && cost !== null ? (price - cost) * qty : null,
        costRate: price && cost !== null ? cost / price : null
      };
    });
  const valid = rows.filter((r) => r.ok);
  const totalSales = valid.reduce((a, r) => a + r.sales, 0);
  const totalQty = valid.reduce((a, r) => a + r.qty, 0);
  const withCost = valid.filter((r) => r.gp !== null);
  const totalGp = withCost.reduce((a, r) => a + r.gp, 0);
  const costSales = withCost.reduce((a, r) => a + r.sales, 0);
  const costRate = costSales ? 1 - totalGp / costSales : null;

  /* ABC分析：売上の大きい順に、累計70%までがA、90%までがB、残りがC */
  let cum = 0;
  [...valid]
    .sort((a, b) => b.sales - a.sales)
    .forEach((r) => {
      const before = totalSales ? cum / totalSales : 0;
      r.abc = before < 0.7 ? "A" : before < 0.9 ? "B" : "C";
      cum += r.sales;
      r.share = totalSales ? r.sales / totalSales : 0;
    });

  /* 4分類：人気は「平均販売数の70%」、利益は「1品あたり粗利の加重平均」を基準にする。
     料理とドリンクでは販売数も粗利も桁が違うので、3品以上ある種類はその種類の中で比べ、
     品数の少ない種類はまとめて比べる */
  const lines = (items) => {
    const qty = items.reduce((a, r) => a + r.qty, 0);
    const gp = items.reduce((a, r) => a + r.gp, 0);
    return { popLine: items.length ? (qty / items.length) * 0.7 : null, gpLine: qty ? gp / qty : null };
  };
  const overall = lines(withCost);
  const counts = {};
  withCost.forEach((r) => (counts[r.category] = (counts[r.category] || 0) + 1));
  const groupMap = {};
  withCost.forEach((r) => {
    const key = counts[r.category] >= 3 ? r.category : "その他の種類（まとめて比較）";
    (groupMap[key] = groupMap[key] || []).push(r);
  });
  const groups = Object.entries(groupMap)
    .map(([key, items]) => ({ key, items, ...(items.length >= 2 ? lines(items) : overall) }))
    .sort((a, b) => b.items.length - a.items.length);
  groups.forEach((g) =>
    g.items.forEach((r) => {
      const popular = r.qty >= g.popLine;
      const profitable = r.unitGp >= g.gpLine;
      r.type = popular && profitable ? "star" : popular ? "plow" : profitable ? "puzzle" : "dog";
      r.group = g.key;
    })
  );

  const byType = (t) => withCost.filter((r) => r.type === t);
  return { rows, valid, withCost, totalSales, totalQty, totalGp, costRate, groups, byType };
}

function menuBonus(s) {
  const a = menuAnalysis(s);
  const bonus = {};
  const add = (id, pt, reason) => (bonus[id] = (bonus[id] || []).concat([[pt, reason]]));
  if (a.byType("plow").length >= 2) add("upsell", 8, "人気だが利益の薄いメニューが多い");
  if (a.byType("puzzle").length >= 2) add("upsell", 6, "利益の高いメニューがあまり売れていない");
  if (a.costRate !== null && a.costRate > 0.38) add("upsell", 6, `原価率が${fmt(a.costRate * 100)}%と高め`);
  return bonus;
}

/* 競合比較とメニュー分析の加点をまとめる */
function allBonus(s) {
  const out = {};
  [compBonus(s), menuBonus(s)].forEach((b) => Object.entries(b).forEach(([k, v]) => (out[k] = (out[k] || []).concat(v))));
  return out;
}

let editingMenuId = null;

function renderMenuForm(id = null) {
  editingMenuId = id;
  const m = (id && store().menu.find((x) => x.id === id)) || { category: "料理" };
  $("[data-menu-form]").innerHTML = [
    `<h2 class="wide">${id ? "メニューを編集" : "メニューを追加"}</h2>`,
    field("メニュー名", input("name", m.name || "", 'maxlength="40" required placeholder="例：自家製餃子"')),
    field("種類", select("category", MENU_CATEGORIES, m.category)),
    field("売値（円）", input("price", m.price ?? "", 'type="number" min="0" step="10" inputmode="numeric" required')),
    field("原価（円）", input("cost", m.cost ?? "", 'type="number" min="0" step="10" inputmode="numeric"'), { hint: "1品あたりの材料費" }),
    field("月の販売数", input("qty", m.qty ?? "", 'type="number" min="0" inputmode="numeric" required'), { hint: "レジの集計から" }),
    `<div class="wide form-actions">${id ? '<button type="button" class="button ghost" data-menu-cancel>やめる</button>' : ""}<button type="submit" class="button primary">${id ? "変更を保存" : "追加"}</button></div>`
  ].join("");
}

function renderMenu() {
  const s = store();
  const a = menuAnalysis(s);
  const kpi = $("[data-menu-kpi]");
  const pct = (v) => (v === null ? "—" : `${fmt(v * 100, 1)}%`);
  kpi.innerHTML = [
    { label: "登録メニューの売上（月）", value: yen(a.totalSales || null), note: `${a.valid.length}品` },
    { label: "粗利（月）", value: a.withCost.length ? yen(a.totalGp) : "—", note: "売上−原価" },
    {
      label: "原価率",
      value: pct(a.costRate),
      note: a.costRate === null ? "原価を入れると計算します" : a.costRate > 0.4 ? "高め。看板以外の原価を見直す" : a.costRate > 0.35 ? "やや高め。目安は30%前後" : a.costRate < 0.25 ? "低め。お得感が足りないかも" : "目安の範囲（30%前後）"
    },
    { label: "看板メニュー", value: `${a.byType("star").length}品`, note: a.byType("star").map((r) => r.name).slice(0, 3).join("、") || "—" }
  ]
    .map((k) => `<div class="kpi"><span>${k.label}</span><strong>${esc(k.value)}</strong><small>${esc(k.note)}</small></div>`)
    .join("");

  /* 4分類 */
  $("[data-menu-types]").innerHTML = a.withCost.length
    ? Object.entries(MENU_TYPES)
        .map(([key, t]) => {
          const items = a.byType(key);
          return `<div class="mtype ${t.cls}"><h3>${t.label}<small>${t.sub}</small></h3><p class="items">${
            items.length ? items.map((r) => esc(r.name)).join("、") : "なし"
          }</p><p class="act">${esc(t.action)}</p></div>`;
        })
        .join("")
    : `<p class="empty">メニューの売値・原価・販売数を入れると、4つに分類します。</p>`;

  renderMenuMatrix(a);

  /* 一覧表 */
  const rows = [...a.rows].sort((x, y) => (y.sales || 0) - (x.sales || 0));
  $("[data-menu-table]").innerHTML = rows.length
    ? `<table class="records menu-table"><thead><tr><th>メニュー</th><th>売値</th><th>原価</th><th>原価率</th><th>販売数</th><th>売上</th><th>売上構成</th><th>ABC</th><th>粗利</th><th>分類</th><th></th></tr></thead><tbody>${rows
        .map(
          (r) => `<tr><th>${esc(r.name)}<small>${esc(r.category || "")}</small></th><td>${yen(r.price)}</td><td>${yen(r.cost)}</td><td class="${
            r.costRate !== null && r.costRate > 0.4 ? "warn" : ""
          }">${pct(r.costRate)}</td><td>${fmt(r.qty)}</td><td>${yen(r.sales)}</td><td>${r.share !== undefined ? pct(r.share) : "—"}</td><td><span class="abc ${r.abc || ""}">${
            r.abc || "—"
          }</span></td><td>${yen(r.gp)}</td><td>${r.type ? `<span class="mtag ${r.type}">${MENU_TYPES[r.type].label}</span>` : "—"}</td><td class="row-actions"><button type="button" class="button ghost small" data-menu-edit="${esc(
            r.id
          )}">編集</button><button type="button" class="button ghost small" data-menu-del="${esc(r.id)}">削除</button></td></tr>`
        )
        .join("")}</tbody></table><p class="note">ABC：売上の大きい順に累計70%までがA（主力）、90%までがB、残りがC。分類は料理・ドリンクなど種類ごとに比べ、販売数がその種類の平均の70%以上で「人気」、1品の粗利がその種類の平均以上で「利益が高い」としています（2品以下の種類はまとめて比べます）。</p>`
    : `<p class="empty">まだメニューが登録されていません。売上の大きいメニューから10品ほど入れてください。</p>`;
}

let menuGroupKey = null;

function renderMenuMatrix(a) {
  const el = $("[data-menu-matrix]");
  if (a.withCost.length < 2) {
    el.innerHTML = `<p class="empty">原価と販売数のあるメニューが2品以上になると、マップを表示します。</p>`;
    return;
  }
  /* 種類ごとに基準が違うので、マップは種類を選んで表示する */
  const g = a.groups.find((x) => x.key === menuGroupKey) || a.groups[0];
  menuGroupKey = g.key;
  const pts = g.items;
  const picker = a.groups.length > 1
    ? `<div class="group-pick">${a.groups.map((x) => `<button type="button" class="chip-btn ${x.key === g.key ? "is-active" : ""}" data-menu-group="${esc(x.key)}">${esc(x.key)}（${x.items.length}品）</button>`).join("")}</div>`
    : "";
  const popLine = g.popLine;
  const gpLine = g.gpLine;
  const W = 600;
  const H = 360;
  const pad = { l: 60, r: 20, t: 24, b: 44 };
  const xs = pts.map((r) => r.qty);
  const ys = pts.map((r) => r.unitGp);
  const x1 = Math.max(...xs, popLine) * 1.1 || 1;
  const yMin = Math.min(0, ...ys);
  const y1 = Math.max(...ys, gpLine) * 1.12 || 1;
  const X = (v) => pad.l + (v / x1) * (W - pad.l - pad.r);
  const Y = (v) => pad.t + (1 - (v - yMin) / (y1 - yMin)) * (H - pad.t - pad.b);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => yMin + (y1 - yMin) * t);
  el.innerHTML = `${picker}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="メニューの人気と利益のマップ">
    <rect x="${X(popLine)}" y="${pad.t}" width="${W - pad.r - X(popLine)}" height="${Y(gpLine) - pad.t}" class="q star"/>
    <rect x="${pad.l}" y="${Y(gpLine)}" width="${X(popLine) - pad.l}" height="${H - pad.b - Y(gpLine)}" class="q dog"/>
    ${yTicks.map((v) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="${pad.l - 8}" y="${Y(v) + 4}" text-anchor="end" class="axis">${fmt(v)}円</text>`).join("")}
    <line x1="${X(popLine)}" x2="${X(popLine)}" y1="${pad.t}" y2="${H - pad.b}" class="avg"/>
    <line x1="${pad.l}" x2="${W - pad.r}" y1="${Y(gpLine)}" y2="${Y(gpLine)}" class="avg"/>
    <text x="${W - pad.r - 4}" y="${pad.t + 14}" text-anchor="end" class="quad">看板メニュー</text>
    <text x="${pad.l + 4}" y="${pad.t + 14}" class="quad">利益は高いが売れていない</text>
    <text x="${W - pad.r - 4}" y="${H - pad.b - 8}" text-anchor="end" class="quad">人気だが利益が薄い</text>
    <text x="${pad.l + 4}" y="${H - pad.b - 8}" class="quad">見直し候補</text>
    <text x="${(pad.l + W - pad.r) / 2}" y="${H - 6}" text-anchor="middle" class="axis">月の販売数（人気） →</text>
    <text x="14" y="${(pad.t + H - pad.b) / 2}" text-anchor="middle" class="axis" transform="rotate(-90 14 ${(pad.t + H - pad.b) / 2})">1品の粗利 →</text>
    ${pts
      .map(
        (r) => `<g class="pt ${r.type}"><circle cx="${X(r.qty)}" cy="${Y(r.unitGp)}" r="7"><title>${esc(r.name)}：${fmt(r.qty)}個・粗利${yen(r.unitGp)}</title></circle><text x="${X(r.qty)}" y="${
          Y(r.unitGp) - 11
        }" text-anchor="middle">${esc(r.name.length > 10 ? `${r.name.slice(0, 10)}…` : r.name)}</text></g>`
      )
      .join("")}
  </svg><p class="note">点線は「${esc(g.key)}」の基準です（販売数：平均の70%＝${fmt(popLine)}個、1品の粗利：平均${yen(gpLine)}）。</p>`;
}

/* ---------------- 4P ---------------- */

const P4 = [
  { id: "product", label: "商品（Product）", q: "何を売りにするか" },
  { id: "price", label: "価格（Price）", q: "いくらで、どう売るか" },
  { id: "place", label: "場所・提供方法（Place）", q: "どこで、どう届けるか" },
  { id: "promotion", label: "販促（Promotion）", q: "どう知らせるか" }
];

function p4Auto(s) {
  const p = s.profile;
  const a = menuAnalysis(s);
  const ins = compInsights(s);
  const names = (t) => a.byType(t).map((r) => r.name).slice(0, 3);
  const out = {};

  /* 商品 */
  const pNow = [];
  const pPlan = [];
  if (p.strengths) pNow.push(`こだわり：${p.strengths}`);
  if (names("star").length) pNow.push(`看板メニュー：${names("star").join("、")}`);
  if (a.costRate !== null) pNow.push(`原価率：${fmt(a.costRate * 100, 1)}%`);
  if (!a.withCost.length) pNow.push("④メニュー分析が未入力");
  if (names("star").length) pPlan.push(`看板の「${names("star").join("」「")}」を前面に出し、味と量を守る`);
  if (names("puzzle").length) pPlan.push(`利益の高い「${names("puzzle").join("」「")}」をおすすめとして目立たせる`);
  if (names("dog").length) pPlan.push(`「${names("dog").join("」「")}」は入れ替えを検討する`);
  if (has(p.features, "地元食材")) pPlan.push("地元食材を使ったメニューを看板として打ち出す");
  if (!pPlan.length) pPlan.push("看板メニューを1つ決め、写真とメニュー表で前面に出す");
  out.product = { now: pNow, plan: pPlan };

  /* 価格 */
  const prNow = [];
  const prPlan = [];
  const lunchOn = p.timeband === "ランチ中心" || p.timeband === "ランチとディナー" || p.timeband === "カフェタイム中心";
  const dinnerOn = p.timeband !== "ランチ中心" && p.timeband !== "カフェタイム中心";
  if (lunchOn && num(p.lunchPrice)) prNow.push(`ランチ客単価：${yen(num(p.lunchPrice))}`);
  if (dinnerOn && num(p.dinnerPrice)) prNow.push(`ディナー客単価：${yen(num(p.dinnerPrice))}`);
  ins.items.filter((i) => i.type === "info").forEach((i) => prNow.push(i.text.replace(/。.*$/, "")));
  ins.items.filter((i) => i.type === "info").forEach((i) => {
    if (i.text.includes("高め")) prPlan.push("価格が高めな理由（素材・手間・量）をメニューと投稿で伝える");
    if (i.text.includes("安め")) prPlan.push("競合より安いので、セット化や少しの値上げで客単価を上げる");
  });
  if (names("plow").length) prPlan.push(`よく売れる「${names("plow").join("」「")}」は原価か価格を見直す`);
  if (has(p.issues, "客単価が低い")) prPlan.push("おすすめのセットやコースを用意し、追加の一品を提案する");
  if (has(p.features, "個室・宴会可")) prPlan.push("宴会コースを価格帯別に3種類そろえる");
  if (!prPlan.length) prPlan.push("競合の価格と比べ、看板メニューの価格に見合う価値を伝える");
  out.price = { now: prNow, plan: [...new Set(prPlan)] };

  /* 場所・提供方法 */
  const plNow = [`${p.location}／${p.timeband}／${p.seats || "—"}席`];
  const plPlan = [];
  ["駐車場あり", "個室・宴会可", "予約可", "テイクアウト"].forEach((f) => has(p.features, f) && plNow.push(f));
  if (!has(p.features, "予約可")) plPlan.push("電話やネットで予約を受けられるようにする");
  if (!has(p.channels, "gbp")) plPlan.push("Googleマップに道順、駐車場、営業時間を正しく載せる");
  if (has(p.features, "駐車場あり")) plPlan.push("駐車場があることを看板とGoogleマップで目立たせる");
  if (has(p.features, "テイクアウト")) plPlan.push("テイクアウトの事前注文（電話・LINE）を受ける");
  if (has(p.issues, "平日が弱い") || has(p.issues, "ランチが弱い")) plPlan.push("空いている時間帯の提供方法（ランチ・テイクアウト・一人席）を見直す");
  out.place = { now: plNow, plan: plPlan.length ? plPlan : ["お店までの行き方と予約方法をわかりやすくする"] };

  /* 販促 */
  const top = scoreMeasures(p, allBonus(s)).slice(0, 3);
  const month = new Date().getMonth() + 1;
  const used = CHANNELS.filter((c) => has(p.channels, c.id)).map((c) => c.label.replace(/（.*）/, ""));
  out.promotion = {
    now: [used.length ? `使っている手段：${used.join("、")}` : "発信手段はまだない"],
    plan: [...top.map((m) => m.name), ...eventsFor(month, p.genre).slice(0, 1).map((e) => `今月は「${e.name}」を企画する`)]
  };
  return out;
}

function renderP4() {
  const s = store();
  const auto = p4Auto(s);
  $("[data-p4-position]").textContent = positioning(s);
  $("[data-p4-grid]").innerHTML = P4.map(
    (x) => `<section class="panel p4 ${x.id}">
      <h2>${x.label}<small>${x.q}</small></h2>
      <h3>今の状態</h3>
      <ul>${auto[x.id].now.map((t) => `<li>${esc(t)}</li>`).join("") || "<li>—</li>"}</ul>
      <h3>おすすめの方針</h3>
      <ul class="plan">${auto[x.id].plan.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      <label class="field"><span>このお店の方針（提案書に載ります）<small>空欄ならおすすめの方針を使います</small></span>
      <textarea rows="3" data-p4="${x.id}" placeholder="${esc(auto[x.id].plan.join("。"))}">${esc(s.p4[x.id] || "")}</textarea></label>
    </section>`
  ).join("");
}

/* ---------------- 施策の費用対効果 ---------------- */

function roiCostRate(s) {
  const manual = num(s.roiCostRate);
  if (manual !== null) return Math.min(Math.max(manual, 0), 100) / 100;
  const a = menuAnalysis(s);
  return a.costRate !== null ? a.costRate : COST_RATE_GUIDE;
}

function roiSummary(s) {
  const avg = avgSpend(s) || 0;
  const rate = roiCostRate(s);
  const groups = {};
  (s.roi || []).forEach((r) => {
    const g = (groups[r.measure] = groups[r.measure] || { measure: r.measure, cost: 0, customers: 0, n: 0 });
    g.cost += num(r.cost) || 0;
    g.customers += num(r.customers) || 0;
    g.n += 1;
  });
  return Object.values(groups)
    .map((g) => {
      const gp = g.customers * avg * (1 - rate);
      const cpa = g.customers ? g.cost / g.customers : null;
      const ratio = g.cost ? gp / g.cost : null;
      let verdict;
      if (!g.cost) verdict = g.customers ? { cls: "good", text: "続ける（費用0円で効果あり）" } : { cls: "info", text: "効果を数える工夫を" };
      else if (!g.customers) verdict = { cls: "bad", text: "見直す（来店につながっていない）" };
      else if (ratio >= 1.5) verdict = { cls: "good", text: "続ける（しっかり黒字）" };
      else if (ratio >= 1) verdict = { cls: "info", text: "続けながら改善（ほぼ元が取れている）" };
      else verdict = { cls: "bad", text: "見直す・やめる候補（赤字）" };
      return { ...g, gp, cpa, ratio, verdict };
    })
    .sort((a, b) => (b.ratio ?? Infinity) - (a.ratio ?? Infinity));
}

function renderRoiForm() {
  const s = store();
  const names = scoreMeasures(s.profile, allBonus(s)).map((m) => m.name);
  $("[data-roi-form]").innerHTML = [
    field("対象の月", `<input type="month" name="month" value="${monthKey()}" required />`),
    field("施策", `<select name="measure">${[...names, "その他"].map((n) => `<option>${esc(n)}</option>`).join("")}</select>`),
    field("かけた費用（円）", input("cost", "", 'type="number" min="0" step="100" inputmode="numeric" placeholder="0"')),
    field("この施策で来たお客様（人）", input("customers", "", 'type="number" min="0" inputmode="numeric" placeholder="クーポン回収数など"')),
    field("メモ", input("memo", "", 'maxlength="80" placeholder="例：チラシ2000枚、クーポン回収で計測"'), { wide: true }),
    `<div class="wide form-actions"><button type="submit" class="button primary">記録する</button></div>`
  ].join("");
  $("[data-roi-rate]").value = s.roiCostRate ?? "";
  $("[data-roi-rate]").placeholder = `自動：${fmt(roiCostRate({ ...s, roiCostRate: "" }) * 100, 1)}`;
}

function renderRoi() {
  const s = store();
  const sum = roiSummary(s);
  const avg = avgSpend(s);
  $("[data-roi-summary]").innerHTML = sum.length
    ? `<table class="records roi-table"><thead><tr><th>施策</th><th>費用</th><th>来たお客様</th><th>1人あたり費用</th><th>見込み粗利</th><th>費用対効果</th><th>判定</th></tr></thead><tbody>${sum
        .map(
          (g) => `<tr><th>${esc(g.measure)}<small>${g.n}件の記録</small></th><td>${yen(g.cost)}</td><td>${fmt(g.customers)}人</td><td>${yen(g.cpa)}</td><td>${yen(g.gp)}</td><td>${
            g.ratio === null ? "—" : `${fmt(g.ratio, 1)}倍`
          }</td><td><span class="verdict ${g.verdict.cls}">${esc(g.verdict.text)}</span></td></tr>`
        )
        .join("")}</tbody></table><p class="note">見込み粗利＝来たお客様 × 客単価${yen(avg)} ×（1−原価率${fmt(roiCostRate(s) * 100, 1)}%）。1回目の来店だけで計算しているので、リピーターになれば効果はさらに大きくなります。</p>`
    : `<p class="empty">施策ごとに「かけた費用」と「来たお客様の数」を記録すると、続けるかどうかを判定します。</p>`;

  const list = [...(s.roi || [])].sort((a, b) => (a.month < b.month ? 1 : -1));
  $("[data-roi-list]").innerHTML = list.length
    ? `<table class="records"><thead><tr><th>月</th><th>施策</th><th>費用</th><th>お客様</th><th>メモ</th><th></th></tr></thead><tbody>${list
        .map(
          (r) => `<tr><th>${monthLabel(r.month)}</th><td class="memo">${esc(r.measure)}</td><td>${yen(num(r.cost))}</td><td>${fmt(num(r.customers))}人</td><td class="memo">${esc(
            r.memo || ""
          )}</td><td><button type="button" class="button ghost small" data-roi-del="${esc(r.id)}">削除</button></td></tr>`
        )
        .join("")}</tbody></table>`
    : "";
}

/* ---------------- 提案書の部品 ---------------- */

function proposal4P(s) {
  const auto = p4Auto(s);
  const a = menuAnalysis(s);
  return `<section>
      <h2>#. 4Pの方針（商品・価格・場所・販促）</h2>
      <table class="kv">${P4.map((x) => {
        const plan = (s.p4[x.id] || "").trim();
        return `<tr><th>${x.label}</th><td>${plan ? esc(plan).replace(/\n/g, "<br />") : `<ul>${auto[x.id].plan.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`}</td></tr>`;
      }).join("")}</table>
      ${
        a.withCost.length
          ? `<p class="pr-sub"><b>メニュー分析：</b>原価率${a.costRate === null ? "—" : `${fmt(a.costRate * 100, 1)}%`}。${Object.entries(MENU_TYPES)
              .map(([k, t]) => `${t.label}：${a.byType(k).map((r) => esc(r.name)).join("、") || "なし"}`)
              .join("／")}</p>`
          : ""
      }
    </section>`;
}

function proposalRoi(s) {
  const sum = roiSummary(s);
  if (!sum.length) return "";
  return `<p class="pr-sub"><b>これまでの施策の費用対効果：</b></p><ul>${sum
    .map((g) => `<li>${esc(g.measure)}：費用${yen(g.cost)}、来店${fmt(g.customers)}人${g.ratio === null ? "" : `、${fmt(g.ratio, 1)}倍`} → ${esc(g.verdict.text)}</li>`)
    .join("")}</ul>`;
}

/* ---------------- 操作 ---------------- */

function bindStrategy() {
  const menuForm = $("[data-menu-form]");
  menuForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(menuForm);
    const row = {
      id: editingMenuId || uid(),
      name: String(fd.get("name") || "").trim(),
      category: String(fd.get("category") || ""),
      price: num(fd.get("price")) ?? "",
      cost: num(fd.get("cost")) ?? "",
      qty: num(fd.get("qty")) ?? ""
    };
    if (!row.name) return toast("メニュー名を入れてください");
    const s = store();
    const i = s.menu.findIndex((m) => m.id === row.id);
    if (i >= 0) s.menu[i] = row;
    else s.menu.push(row);
    save();
    renderMenuForm();
    renderAll({ forms: false });
    menuForm.querySelector("[name=name]").focus();
    toast(i >= 0 ? "変更を保存しました" : `「${row.name}」を追加しました`);
  });

  const roiForm = $("[data-roi-form]");
  roiForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(roiForm);
    const month = String(fd.get("month") || "");
    if (!/^\d{4}-\d{2}$/.test(month)) return toast("対象の月を選んでください");
    store().roi.push({
      id: uid(),
      month,
      measure: String(fd.get("measure") || "その他"),
      cost: num(fd.get("cost")) ?? 0,
      customers: num(fd.get("customers")) ?? 0,
      memo: String(fd.get("memo") || "").trim()
    });
    save();
    renderRoiForm();
    renderAll({ forms: false });
    toast("記録しました");
  });

  $("[data-roi-rate]").addEventListener("input", (e) => {
    store().roiCostRate = e.target.value;
    save();
    renderRoi();
    renderProposal();
  });

  document.addEventListener("input", (e) => {
    const t = e.target.closest("[data-p4]");
    if (!t) return;
    store().p4[t.dataset.p4] = t.value;
    save();
    renderProposal();
  });

  document.addEventListener("click", (e) => {
    const edit = e.target.closest("[data-menu-edit]");
    if (edit) {
      renderMenuForm(edit.dataset.menuEdit);
      menuForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (e.target.closest("[data-menu-cancel]")) renderMenuForm();
    const grp = e.target.closest("[data-menu-group]");
    if (grp) {
      menuGroupKey = grp.dataset.menuGroup;
      renderMenuMatrix(menuAnalysis(store()));
    }
    const del = e.target.closest("[data-menu-del]");
    if (del) {
      const s = store();
      const m = s.menu.find((x) => x.id === del.dataset.menuDel);
      if (!m || !confirm(`「${m.name}」を削除しますか？`)) return;
      s.menu = s.menu.filter((x) => x.id !== m.id);
      if (editingMenuId === m.id) renderMenuForm();
      save();
      renderAll({ forms: false });
    }
    const rdel = e.target.closest("[data-roi-del]");
    if (rdel && confirm("この記録を削除しますか？")) {
      const s = store();
      s.roi = s.roi.filter((x) => x.id !== rdel.dataset.roiDel);
      save();
      renderAll({ forms: false });
    }
  });
}
