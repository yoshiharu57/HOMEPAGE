/* =========================================================
   飲食店マーケティング戦略アプリ：競合との比較（3C分析）
   - 自店（Company）、お客様（Customer）、競合（Competitor）を並べて比べます
   - app.js の共通関数（$, esc, num, store など）を使います
   ========================================================= */

/* 価格差をどこから「高い／安い」とみなすか */
const PRICE_GAP = 0.15;

/* ⑥の記録から、空欄でない一番新しい値を取る */
function selfMetrics(s) {
  const rows = [...s.records].sort((a, b) => (a.month < b.month ? 1 : -1));
  const pick = (id) => {
    const r = rows.find((x) => num(x[id]) !== null);
    return r ? num(r[id]) : null;
  };
  return { rating: pick("rating"), reviews: pick("reviews"), igFollowers: pick("igFollowers") };
}

/* 自店を競合と同じ形にそろえる */
function selfAsRow(s) {
  const p = s.profile;
  const m = selfMetrics(s);
  const lunchOn = p.timeband === "ランチ中心" || p.timeband === "ランチとディナー" || p.timeband === "カフェタイム中心";
  const dinnerOn = p.timeband !== "ランチ中心" && p.timeband !== "カフェタイム中心";
  return {
    self: true,
    name: `${(p.name || "").replace(/^サンプル：/, "")}（自店）`,
    genre: p.genre,
    distance: "—",
    lunchPrice: lunchOn ? num(p.lunchPrice) : null,
    dinnerPrice: dinnerOn ? num(p.dinnerPrice) : null,
    rating: m.rating,
    reviews: m.reviews,
    igFollowers: m.igFollowers,
    features: p.features || [],
    strengths: p.strengths,
    weaknesses: (p.issues || []).join("、")
  };
}

function average(list) {
  const vals = list.filter((v) => v !== null && Number.isFinite(v));
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

/* 競合と比べた気づき。bonus は施策の優先度への加点 */
function compInsights(s) {
  const comps = (s.competitors || []).map((c) => ({
    ...c,
    lunchPrice: num(c.lunchPrice),
    dinnerPrice: num(c.dinnerPrice),
    rating: num(c.rating),
    reviews: num(c.reviews),
    igFollowers: num(c.igFollowers)
  }));
  const me = selfAsRow(s);
  const items = [];
  const bonus = {};
  const addBonus = (id, pt, reason) => (bonus[id] = (bonus[id] || []).concat([[pt, reason]]));
  if (!comps.length) return { items, bonus, unique: [], missing: [], comps, me, avg: {} };

  const avg = {
    lunchPrice: average(comps.map((c) => c.lunchPrice)),
    dinnerPrice: average(comps.map((c) => c.dinnerPrice)),
    rating: average(comps.map((c) => c.rating)),
    reviews: average(comps.map((c) => c.reviews)),
    igFollowers: average(comps.map((c) => c.igFollowers))
  };

  /* 口コミ件数 */
  if (me.reviews !== null && avg.reviews) {
    const ratio = me.reviews / avg.reviews;
    if (ratio < 0.8) {
      items.push({ type: "bad", text: `Googleの口コミ件数が競合平均の${fmt(ratio * 100)}%（自店${fmt(me.reviews)}件／平均${fmt(avg.reviews)}件）。比べられたときに不利です。` });
      addBonus("review", 18, "口コミ件数が競合より少ない");
      addBonus("meo", 8, "Googleマップで競合と比べられている");
    } else if (ratio > 1.2) {
      items.push({ type: "good", text: `口コミ件数は競合平均より多い（自店${fmt(me.reviews)}件／平均${fmt(avg.reviews)}件）。` });
    }
  }

  /* 評価 */
  if (me.rating !== null && avg.rating) {
    const d = me.rating - avg.rating;
    if (d <= -0.2) {
      items.push({ type: "bad", text: `Googleの評価が競合平均より${fmt(-d, 1)}低い（自店★${fmt(me.rating, 1)}／平均★${fmt(avg.rating, 1)}）。低評価の口コミの内容を確認し、返信と改善を。` });
      addBonus("review", 8, "評価が競合より低い");
    } else if (d >= 0.2) {
      items.push({ type: "good", text: `Googleの評価は競合平均より高い（自店★${fmt(me.rating, 1)}／平均★${fmt(avg.rating, 1)}）。写真と口コミで目立たせましょう。` });
    }
  }

  /* Instagram */
  if (me.igFollowers !== null && avg.igFollowers) {
    const ratio = me.igFollowers / avg.igFollowers;
    if (ratio < 0.5) {
      items.push({ type: "bad", text: `Instagramのフォロワーが競合平均の${fmt(ratio * 100)}%（自店${fmt(me.igFollowers)}人／平均${fmt(avg.igFollowers)}人）。` });
      addBonus("insta", 8, "Instagramで競合に差をつけられている");
    } else if (ratio > 1.5) {
      items.push({ type: "good", text: `Instagramのフォロワーは競合平均より多い（自店${fmt(me.igFollowers)}人）。` });
    }
  }

  /* 価格 */
  [
    ["dinnerPrice", "ディナー"],
    ["lunchPrice", "ランチ"]
  ].forEach(([key, label]) => {
    /* 1店だけの価格は平均として当てにならないので、2店以上そろったときだけ比べる */
    if (me[key] === null || !avg[key] || comps.filter((c) => c[key] !== null).length < 2) return;
    const r = me[key] / avg[key] - 1;
    if (r > PRICE_GAP) {
      items.push({ type: "info", text: `${label}の客単価は競合平均より${fmt(r * 100)}%高め（自店${yen(me[key])}／平均${yen(avg[key])}）。素材やこだわりなど「高い理由」をメニューや投稿で伝える必要があります。` });
      addBonus("upsell", 4, `${label}の価格帯が高めなので価値の伝え方が大事`);
    } else if (r < -PRICE_GAP) {
      items.push({ type: "info", text: `${label}の客単価は競合平均より${fmt(-r * 100)}%安め（自店${yen(me[key])}／平均${yen(avg[key])}）。値上げやセット化の余地があります。` });
      addBonus("upsell", 10, `${label}の価格が競合より安く、単価を上げる余地がある`);
    }
  });

  /* 特徴：自店だけのもの／競合の多くにあって自店にないもの */
  const unique = (me.features || []).filter((f) => !comps.some((c) => has(c.features, f)));
  const missing = FEATURES.filter((f) => !has(me.features, f) && comps.filter((c) => has(c.features, f)).length >= Math.max(2, Math.ceil(comps.length / 2)));
  if (unique.length) items.push({ type: "good", text: `「${unique.join("」「")}」は近くの競合にない自店だけの強み。看板やGoogleマップ、投稿で必ず伝えましょう。` });
  if (missing.length) items.push({ type: "bad", text: `競合の多くが「${missing.join("」「")}」に対応しています。対応するか、ほかの強みで選ばれる理由をつくりましょう。` });
  if (unique.includes("個室・宴会可")) addBonus("banquet", 8, "個室・宴会に対応しているのは自店だけ");
  if (missing.includes("予約可")) addBonus("hp", 6, "競合の多くが予約を受けている");

  return { items, bonus, unique, missing, comps, me, avg };
}

function compBonus(s) {
  return compInsights(s).bonus;
}

/* 差別化の方向（ポジショニングの一文） */
function positioning(s) {
  const p = s.profile;
  const ins = compInsights(s);
  const who = (p.targets || []).slice(0, 2).join("や") || "地元のお客様";
  const why = [p.strengths, ...ins.unique].filter(Boolean).slice(0, 3).join("、") || "（①の自慢・こだわりを入れてください）";
  const area = p.area || p.pref || "この地域";
  return `${area}で、${who}に「${why}」で選ばれる${p.genre}。`;
}

/* ---------------- 描画 ---------------- */

const COMP_FIELDS = [
  { id: "name", label: "店名", attrs: 'maxlength="60" required placeholder="例：駅前のチェーン居酒屋"' },
  { id: "distance", label: "自店からの距離", attrs: 'maxlength="20" placeholder="例：徒歩5分、車で10分"' },
  { id: "lunchPrice", label: "ランチの客単価（円）", attrs: 'type="number" min="0" step="50" inputmode="numeric"' },
  { id: "dinnerPrice", label: "ディナーの客単価（円）", attrs: 'type="number" min="0" step="100" inputmode="numeric"' },
  { id: "rating", label: "Googleの評価（★）", attrs: 'type="number" min="0" max="5" step="0.1" inputmode="decimal"' },
  { id: "reviews", label: "Googleの口コミ件数", attrs: 'type="number" min="0" inputmode="numeric"' },
  { id: "igFollowers", label: "Instagramフォロワー数", attrs: 'type="number" min="0" inputmode="numeric"' }
];

let editingCompId = null;

function renderCompForm(id = null) {
  editingCompId = id;
  const c = (id && store().competitors.find((x) => x.id === id)) || { genre: store().profile.genre, features: [] };
  $("[data-comp-form]").innerHTML = [
    `<h2 class="wide">${id ? "競合店を編集" : "競合店を追加"}</h2>`,
    field("店名", input("name", c.name || "", COMP_FIELDS[0].attrs)),
    field("業態", select("genre", GENRES, c.genre)),
    ...COMP_FIELDS.slice(1).map((f) => field(f.label, input(f.id, c[f.id] ?? "", f.attrs))),
    chips("features", FEATURES, c.features, "その店の特徴"),
    field("その店の強み", `<textarea name="strengths" rows="2" maxlength="200" placeholder="例：安さ、飲み放題、ネット予約">${esc(c.strengths || "")}</textarea>`),
    field("その店の弱み", `<textarea name="weaknesses" rows="2" maxlength="200" placeholder="例：駐車場がない、料理が画一的">${esc(c.weaknesses || "")}</textarea>`),
    `<div class="wide form-actions">${id ? '<button type="button" class="button ghost" data-comp-cancel>やめる</button>' : ""}<button type="submit" class="button primary">${id ? "変更を保存" : "競合店を追加"}</button></div>`
  ].join("");
  $("[data-comp-notes]").value = store().c3.customerNotes || "";
}

function renderCompetitors() {
  const s = store();
  const p = s.profile;
  const ins = compInsights(s);
  const me = ins.me;

  /* 3C の要約 */
  const t = targetsFor(p);
  const customers = [...t.chosen, ...t.suggested];
  $("[data-c3-customer]").innerHTML = customers.length
    ? `<ul>${customers.map((n) => `<li><b>${esc(n)}</b>：${esc(TARGET_INFO[n].need)}</li>`).join("")}</ul>`
    : `<p class="empty">①で「来てほしいお客様」を選んでください。</p>`;
  const sw = swot(s);
  $("[data-c3-company]").innerHTML = `<ul>${[
    `${p.genre}／${p.location}／${p.seats || "—"}席`,
    `客単価：ランチ ${yen(me.lunchPrice)}、ディナー ${yen(me.dinnerPrice)}`,
    `Google：★${me.rating === null ? "—" : fmt(me.rating, 1)}・口コミ${me.reviews === null ? "—" : fmt(me.reviews)}件／Instagram：${me.igFollowers === null ? "—" : fmt(me.igFollowers)}人`,
    ...sw.S.slice(0, 3)
  ]
    .map((x) => `<li>${esc(x)}</li>`)
    .join("")}</ul>${me.rating === null && me.reviews === null ? `<p class="note">評価や口コミ件数は⑥効果測定の最新の記録から取ります。</p>` : ""}`;
  $("[data-c3-competitor]").innerHTML = ins.comps.length
    ? `<ul>${ins.comps.map((c) => `<li><b>${esc(c.name)}</b>：${esc(c.strengths || "—")}</li>`).join("")}</ul>`
    : `<p class="empty">下の「競合店を追加」から、近くのお店を2〜3店入れてください。</p>`;

  /* 気づきと差別化 */
  $("[data-c3-insights]").innerHTML = ins.items.length
    ? `<ul class="insights">${ins.items.map((i) => `<li class="${i.type}">${esc(i.text)}</li>`).join("")}</ul>`
    : `<p class="empty">${ins.comps.length ? "競合の数字（評価、口コミ件数、客単価など）を入れると、気づきが表示されます。" : "競合店を追加すると、ここに気づきが表示されます。"}</p>`;
  $("[data-c3-position]").innerHTML = `<p class="position">${esc(positioning(s))}</p>
    ${ins.unique.length ? `<p><b>自店だけの強み：</b>${esc(ins.unique.join("、"))}</p>` : ""}
    ${ins.missing.length ? `<p><b>競合にあって自店にないもの：</b>${esc(ins.missing.join("、"))}</p>` : ""}
    <p class="note">この一文を、看板、Googleマップの説明文、Instagramのプロフィールでそろえて使うと、選ばれる理由が伝わりやすくなります。</p>`;

  /* 比較表 */
  const rows = [me, ...ins.comps];
  const best = (key, higher = true) => {
    const vals = rows.map((r) => num(r[key])).filter((v) => v !== null);
    return vals.length > 1 ? (higher ? Math.max(...vals) : Math.min(...vals)) : null;
  };
  const cols = [
    { key: "distance", label: "距離", f: (v) => esc(v || "—") },
    { key: "lunchPrice", label: "ランチ", f: (v) => yen(num(v)) },
    { key: "dinnerPrice", label: "ディナー", f: (v) => yen(num(v)) },
    { key: "rating", label: "★評価", f: (v) => (num(v) === null ? "—" : fmt(num(v), 1)), best: best("rating") },
    { key: "reviews", label: "口コミ", f: (v) => (num(v) === null ? "—" : `${fmt(num(v))}件`), best: best("reviews") },
    { key: "igFollowers", label: "Instagram", f: (v) => (num(v) === null ? "—" : `${fmt(num(v))}人`), best: best("igFollowers") }
  ];
  $("[data-c3-table]").innerHTML = ins.comps.length
    ? `<table class="records compare"><thead><tr><th>店名</th>${cols.map((c) => `<th>${c.label}</th>`).join("")}<th>特徴</th><th>強み／弱み</th><th></th></tr></thead><tbody>${rows
        .map(
          (r) => `<tr class="${r.self ? "self" : ""}"><th>${esc(r.name)}<small>${esc(r.genre || "")}</small></th>${cols
            .map((c) => `<td class="${c.best !== undefined && c.best !== null && num(r[c.key]) === c.best ? "best" : ""}">${c.f(r[c.key])}</td>`)
            .join("")}<td class="memo">${(r.features || []).map((f) => `<span class="mini ${r.self && ins.unique.includes(f) ? "only" : ""}">${esc(f)}</span>`).join("")}</td><td class="memo">${
            r.strengths ? `<span class="plus">＋ ${esc(r.strengths)}</span>` : ""
          }${r.weaknesses ? `<span class="minus">− ${esc(r.weaknesses)}</span>` : ""}</td><td class="row-actions">${
            r.self ? "" : `<button type="button" class="button ghost small" data-comp-edit="${esc(r.id)}">編集</button><button type="button" class="button ghost small" data-comp-del="${esc(r.id)}">削除</button>`
          }</td></tr>`
        )
        .join("")}</tbody></table><p class="note">緑の数字は、比べた中で一番良い値です。</p>`
    : `<p class="empty">まだ競合店が登録されていません。</p>`;

  renderPositionMap(s, ins);
}

/* 価格（横）と評価（縦）のポジションマップ */
function renderPositionMap(s, ins) {
  const el = $("[data-c3-map]");
  const p = s.profile;
  const dinnerSide = p.timeband !== "ランチ中心" && p.timeband !== "カフェタイム中心";
  const key = dinnerSide ? "dinnerPrice" : "lunchPrice";
  const pts = [ins.me, ...ins.comps]
    .map((r) => ({ name: r.name.replace(/（自店）$/, ""), self: !!r.self, x: num(r[key]), y: num(r.rating) }))
    .filter((d) => d.x !== null && d.y !== null);
  if (pts.length < 2) {
    el.innerHTML = `<p class="empty">自店と競合の「${dinnerSide ? "ディナー" : "ランチ"}の客単価」と「Googleの評価」がそろうと、マップを表示します。自店の評価は⑥効果測定に記録してください。</p>`;
    return;
  }
  const W = 560;
  const H = 340;
  const pad = { l: 52, r: 20, t: 20, b: 44 };
  const xs = pts.map((d) => d.x);
  const ys = pts.map((d) => d.y);
  let x0 = Math.min(...xs);
  let x1 = Math.max(...xs);
  const xm = (x1 - x0) * 0.15 || x0 * 0.2 || 500;
  x0 = Math.max(0, x0 - xm);
  x1 += xm;
  let y0 = Math.min(...ys, 3.5) - 0.1;
  let y1 = Math.min(5, Math.max(...ys, 4.5) + 0.1);
  const X = (v) => pad.l + ((v - x0) / (x1 - x0)) * (W - pad.l - pad.r);
  const Y = (v) => pad.t + (1 - (v - y0) / (y1 - y0)) * (H - pad.t - pad.b);
  const ax = average(xs);
  const ay = average(ys);
  const yTicks = [];
  for (let v = Math.ceil(y0 * 2) / 2; v <= y1 + 1e-9; v += 0.5) yTicks.push(v);
  const xTicks = [0, 0.5, 1].map((t) => x0 + (x1 - x0) * t);
  const short = (v) => (v >= 10000 ? `${fmt(v / 10000, 1)}万` : fmt(v));

  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="価格と評価のポジションマップ">
    ${yTicks.map((v) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="${pad.l - 8}" y="${Y(v) + 4}" text-anchor="end" class="axis">★${v.toFixed(1)}</text>`).join("")}
    ${xTicks.map((v) => `<text x="${X(v)}" y="${H - 22}" text-anchor="middle" class="axis">${short(v)}円</text>`).join("")}
    <line x1="${X(ax)}" x2="${X(ax)}" y1="${pad.t}" y2="${H - pad.b}" class="avg"/>
    <line x1="${pad.l}" x2="${W - pad.r}" y1="${Y(ay)}" y2="${Y(ay)}" class="avg"/>
    <text x="${W - pad.r - 4}" y="${pad.t + 14}" text-anchor="end" class="quad">高い・評価高</text>
    <text x="${pad.l + 4}" y="${pad.t + 14}" class="quad">安い・評価高（お得）</text>
    <text x="${W - pad.r - 4}" y="${H - pad.b - 8}" text-anchor="end" class="quad">高い・評価低（要注意）</text>
    <text x="${pad.l + 4}" y="${H - pad.b - 8}" class="quad">安い・評価低</text>
    <text x="${(pad.l + W - pad.r) / 2}" y="${H - 4}" text-anchor="middle" class="axis">${dinnerSide ? "ディナー" : "ランチ"}の客単価 →</text>
    ${pts
      .map(
        (d) => `<g class="${d.self ? "pt self" : "pt"}"><circle cx="${X(d.x)}" cy="${Y(d.y)}" r="${d.self ? 9 : 7}"><title>${esc(d.name)}：${yen(d.x)}・★${fmt(d.y, 1)}</title></circle>
        <text x="${X(d.x)}" y="${Y(d.y) - 13}" text-anchor="middle">${esc(d.name.length > 12 ? `${d.name.slice(0, 12)}…` : d.name)}</text></g>`
      )
      .join("")}
  </svg><p class="note">点線は比べた店の平均です。自店がどこにいて、どこを目指すかを確認します。</p>`;
}

/* 提案書に入れる部分 */
function proposal3C(s) {
  const ins = compInsights(s);
  if (!ins.comps.length) return "";
  return `<section>
      <h2>3-2. 競合との比較</h2>
      <table class="kv">${ins.comps
        .map(
          (c) => `<tr><th>${esc(c.name)}</th><td>${esc(c.distance || "")} ／ ディナー${yen(c.dinnerPrice)} ／ ★${c.rating === null ? "—" : fmt(c.rating, 1)}・口コミ${
            c.reviews === null ? "—" : fmt(c.reviews)
          }件<br /><small>強み：${esc(c.strengths || "—")}／弱み：${esc(c.weaknesses || "—")}</small></td></tr>`
        )
        .join("")}</table>
      ${ins.items.length ? `<ul>${ins.items.map((i) => `<li>${esc(i.text)}</li>`).join("")}</ul>` : ""}
      <p><b>目指す姿：</b>${esc(positioning(s))}</p>
    </section>`;
}

/* ---------------- 操作 ---------------- */

function bindCompetitors() {
  const form = $("[data-comp-form]");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    if (!name) {
      toast("店名を入れてください");
      return;
    }
    const row = {
      id: editingCompId || uid(),
      name,
      genre: String(fd.get("genre") || ""),
      features: fd.getAll("features").map(String),
      strengths: String(fd.get("strengths") || "").trim(),
      weaknesses: String(fd.get("weaknesses") || "").trim()
    };
    COMP_FIELDS.slice(1).forEach((f) => {
      const v = String(fd.get(f.id) ?? "").trim();
      row[f.id] = f.id === "distance" ? v : num(v) ?? "";
    });
    const s = store();
    const i = s.competitors.findIndex((c) => c.id === row.id);
    if (i >= 0) s.competitors[i] = row;
    else s.competitors.push(row);
    save();
    renderCompForm();
    renderAll({ forms: false });
    toast(i >= 0 ? "変更を保存しました" : "競合店を追加しました");
  });

  document.addEventListener("click", (e) => {
    const edit = e.target.closest("[data-comp-edit]");
    if (edit) {
      renderCompForm(edit.dataset.compEdit);
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (e.target.closest("[data-comp-cancel]")) renderCompForm();
    const del = e.target.closest("[data-comp-del]");
    if (del) {
      const s = store();
      const c = s.competitors.find((x) => x.id === del.dataset.compDel);
      if (!c || !confirm(`「${c.name}」を削除しますか？`)) return;
      s.competitors = s.competitors.filter((x) => x.id !== c.id);
      if (editingCompId === c.id) renderCompForm();
      save();
      renderAll({ forms: false });
      toast("削除しました");
    }
  });

  $("[data-comp-notes]").addEventListener("input", (e) => {
    store().c3.customerNotes = e.target.value;
    save();
  });
}
