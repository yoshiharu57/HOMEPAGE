/* =========================================================
   建設コンサル 技術職向け 工程管理アプリ
   - データはブラウザの localStorage に保存されます
   ========================================================= */

const STORAGE_KEY = "tk-koutei-kanri-v1";

const CATEGORIES = [
  "橋梁設計",
  "道路設計",
  "河川・砂防",
  "橋梁点検",
  "測量",
  "地質・土質",
  "施工管理・積算",
  "その他"
];

/* 判定しきい値（予定進捗との差分・ポイント） */
const WARN_GAP = 5; /* 5pt 以上遅れ → 注意 */
const LATE_GAP = 15; /* 15pt 以上遅れ → 遅延 */

/* ---------------- 日付ユーティリティ ---------------- */

function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function today() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function addDays(date, n) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + n);
  return copy;
}

function diffDays(from, to) {
  return Math.round((to - from) / 86400000);
}

function isWeekend(date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

/* 稼働日（月〜金）を数える。両端を含む */
function bizDays(from, to) {
  if (!from || !to || to < from) return 0;
  let count = 0;
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (cursor <= to) {
    if (!isWeekend(cursor)) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

function formatDate(str) {
  const d = parseDate(str);
  if (!d) return "-";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatFull(str) {
  const d = parseDate(str);
  if (!d) return "-";
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthRange(ym) {
  const [y, m] = ym.split("-").map(Number);
  return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0) };
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ---------------- 状態 ---------------- */

const state = {
  data: { version: 1, members: [], projects: [] },
  view: "dashboard",
  ganttProjectId: "",
  scale: "week",
  baseMonth: monthKey(today())
};

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.projects) && Array.isArray(parsed.members)) {
        state.data = parsed;
        return;
      }
    }
  } catch (error) {
    console.warn("保存データを読み込めませんでした", error);
  }
  state.data = sampleData();
  save();
}

/* ---------------- サンプルデータ ---------------- */

function sampleData() {
  const base = today();
  const day = (n) => toKey(addDays(base, n));

  const members = [
    { id: "m1", name: "田中 太郎", role: "管理技術者", capacityRate: 100, skills: ["橋梁設計", "橋梁点検"], note: "技術士（鋼構造）" },
    { id: "m2", name: "佐藤 花子", role: "主任技術者", capacityRate: 100, skills: ["道路設計", "測量"], note: "RCCM" },
    { id: "m3", name: "鈴木 一郎", role: "担当技術者", capacityRate: 100, skills: ["河川・砂防", "道路設計"], note: "" },
    { id: "m4", name: "高橋 実", role: "担当技術者", capacityRate: 80, skills: ["橋梁設計", "施工管理・積算"], note: "週4日勤務" },
    { id: "m5", name: "渡辺 桜", role: "技術補助", capacityRate: 100, skills: ["測量", "地質・土質"], note: "CAD・図面作成" },
    { id: "m6", name: "伊藤 健", role: "照査技術者", capacityRate: 60, skills: ["橋梁設計", "河川・砂防"], note: "照査中心" }
  ];

  const projects = [
    {
      id: "p1",
      name: "令和8年度 ○○橋 橋梁詳細設計業務",
      client: "栃木県 ○○土木事務所",
      category: "橋梁設計",
      start: day(-60),
      end: day(70),
      manager: "m1",
      priority: "high",
      status: "active",
      memberIds: ["m1", "m4", "m5", "m6"],
      note: "第2回打合せ後に上部工形式を確定",
      tasks: [
        { id: "t1", name: "現地踏査・資料収集", start: day(-60), end: day(-45), planDays: 8, progress: 100, assigneeIds: ["m4"], note: "" },
        { id: "t2", name: "予備設計・比較検討", start: day(-44), end: day(-20), planDays: 16, progress: 100, assigneeIds: ["m1", "m4"], note: "" },
        { id: "t3", name: "上部工詳細設計", start: day(-19), end: day(10), planDays: 26, progress: 45, assigneeIds: ["m4"], note: "断面計算が遅れ気味" },
        { id: "t4", name: "下部工・基礎工設計", start: day(-5), end: day(30), planDays: 24, progress: 10, assigneeIds: ["m1"], note: "" },
        { id: "t5", name: "図面作成（CAD）", start: day(15), end: day(50), planDays: 20, progress: 0, assigneeIds: ["m5"], note: "" },
        { id: "t6", name: "数量計算・報告書作成", start: day(45), end: day(65), planDays: 14, progress: 0, assigneeIds: ["m4", "m5"], note: "" },
        { id: "t7", name: "照査・成果品納品", start: day(60), end: day(70), planDays: 6, progress: 0, assigneeIds: ["m6"], note: "" }
      ]
    },
    {
      id: "p2",
      name: "市道○○線 道路改良詳細設計業務",
      client: "○○市 建設課",
      category: "道路設計",
      start: day(-35),
      end: day(45),
      manager: "m2",
      priority: "normal",
      status: "active",
      memberIds: ["m2", "m3", "m5"],
      note: "",
      tasks: [
        { id: "t8", name: "現況測量・条件整理", start: day(-35), end: day(-18), planDays: 10, progress: 100, assigneeIds: ["m5"], note: "" },
        { id: "t9", name: "線形・横断計画", start: day(-17), end: day(5), planDays: 14, progress: 70, assigneeIds: ["m2"], note: "" },
        { id: "t10", name: "排水・付帯構造物設計", start: day(0), end: day(25), planDays: 16, progress: 20, assigneeIds: ["m3"], note: "" },
        { id: "t11", name: "図面・数量・報告書", start: day(20), end: day(42), planDays: 18, progress: 0, assigneeIds: ["m3", "m5"], note: "" }
      ]
    },
    {
      id: "p3",
      name: "令和8年度 橋梁定期点検業務（12橋）",
      client: "○○町 建設水道課",
      category: "橋梁点検",
      start: day(-20),
      end: day(25),
      manager: "m1",
      priority: "normal",
      status: "active",
      memberIds: ["m1", "m3", "m4"],
      note: "近接目視は9月末までに完了予定",
      tasks: [
        { id: "t12", name: "点検計画・協議", start: day(-20), end: day(-12), planDays: 4, progress: 100, assigneeIds: ["m1"], note: "" },
        { id: "t13", name: "現地点検（12橋）", start: day(-11), end: day(8), planDays: 20, progress: 15, assigneeIds: ["m3"], note: "雨天中止が続き遅れ" },
        { id: "t14", name: "点検調書作成", start: day(-4), end: day(20), planDays: 14, progress: 0, assigneeIds: ["m3", "m4"], note: "現地点検の遅れで着手できず" },
        { id: "t15", name: "健全性診断・報告", start: day(15), end: day(25), planDays: 8, progress: 0, assigneeIds: ["m1"], note: "" }
      ]
    },
    {
      id: "p4",
      name: "○○川 河川測量業務",
      client: "国土交通省 ○○事務所",
      category: "測量",
      start: day(-15),
      end: day(60),
      manager: "m2",
      priority: "normal",
      status: "active",
      memberIds: ["m2", "m5"],
      note: "",
      tasks: [
        { id: "t16", name: "基準点測量", start: day(-15), end: day(2), planDays: 10, progress: 85, assigneeIds: ["m5"], note: "" },
        { id: "t17", name: "縦横断測量", start: day(3), end: day(35), planDays: 20, progress: 0, assigneeIds: ["m5"], note: "" },
        { id: "t18", name: "成果品作成・照査", start: day(30), end: day(55), planDays: 12, progress: 0, assigneeIds: ["m2"], note: "" }
      ]
    }
  ];

  return { version: 1, members, projects };
}

/* ---------------- 進捗・遅延の計算 ---------------- */

/* 予定どおりなら今日時点で何%進んでいるべきか */
function plannedProgress(task, ref) {
  const start = parseDate(task.start);
  const end = parseDate(task.end);
  if (!start || !end) return 0;
  if (ref < start) return 0;
  if (ref >= end) return 100;
  const total = bizDays(start, end);
  if (total <= 0) return 100;
  const done = bizDays(start, ref);
  return Math.min(100, (done / total) * 100);
}

/* タスクの状態: done / ok / warn / late */
function taskStatus(task, ref) {
  const progress = Number(task.progress) || 0;
  if (progress >= 100) return "done";
  const plan = plannedProgress(task, ref);
  const gap = plan - progress;
  const end = parseDate(task.end);
  if (end && ref > end) return "late";
  if (gap >= LATE_GAP) return "late";
  if (gap >= WARN_GAP) return "warn";
  return "ok";
}

function taskWeight(task) {
  const days = Number(task.planDays);
  return days > 0 ? days : 1;
}

/* プロジェクト全体の集計 */
function projectSummary(project, ref) {
  const tasks = project.tasks || [];
  let weight = 0;
  let actual = 0;
  let plan = 0;
  let doneCount = 0;
  let remainDays = 0;

  tasks.forEach((task) => {
    const w = taskWeight(task);
    const progress = Math.min(100, Math.max(0, Number(task.progress) || 0));
    weight += w;
    actual += w * progress;
    plan += w * plannedProgress(task, ref);
    remainDays += w * (1 - progress / 100);
    if (progress >= 100) doneCount += 1;
  });

  const actualPct = weight ? actual / weight : 0;
  const planPct = weight ? plan / weight : 0;
  const gap = planPct - actualPct;

  const end = parseDate(project.end);
  const overdue = end ? ref > end && actualPct < 100 : false;

  const lateTasks = tasks.filter((task) => taskStatus(task, ref) === "late").length;
  const warnTasks = tasks.filter((task) => taskStatus(task, ref) === "warn").length;

  /* 全体の進み具合に加えて、遅延タスクを抱えていないかも見る */
  let status = "ok";
  if (overdue || gap >= LATE_GAP || lateTasks >= 2) status = "late";
  else if (gap >= WARN_GAP || lateTasks >= 1) status = "warn";
  if (actualPct >= 100) status = "done";

  return {
    weight,
    actualPct,
    planPct,
    gap,
    status,
    overdue,
    doneCount,
    taskCount: tasks.length,
    lateTasks,
    warnTasks,
    remainDays,
    daysLeft: end ? diffDays(ref, end) : null
  };
}

const STATUS_LABEL = { ok: "順調", warn: "注意", late: "遅延", done: "完了" };

/* ---------------- 稼働率の計算 ----------------
   残工数 = 予定工数 ×（1 − 進捗率）
   残工数を「今日以降の残り期間」に均等配分し、基準月に重なる分を負荷とみなします。
   期限を過ぎたタスクの残工数は、すべて当月の負荷として計上します。
------------------------------------------------ */

function loadWindow(task, ref) {
  const start = parseDate(task.start);
  const end = parseDate(task.end);
  if (!start || !end) return null;
  const from = start > ref ? start : ref;
  const to = end < from ? from : end;
  return { from, to };
}

function overlapBizDays(aFrom, aTo, bFrom, bTo) {
  const from = aFrom > bFrom ? aFrom : bFrom;
  const to = aTo < bTo ? aTo : bTo;
  if (to < from) return 0;
  return bizDays(from, to);
}

function computeLoads(ym) {
  const ref = today();
  const { start: mStart, end: mEnd } = monthRange(ym);
  const capFrom = mStart > ref ? mStart : ref; /* 当月は今日以降の稼働日で評価 */
  const capBiz = bizDays(capFrom > mEnd ? mEnd : capFrom, mEnd);

  const result = new Map();
  state.data.members.forEach((member) => {
    const capacity = capBiz * ((Number(member.capacityRate) || 100) / 100);
    result.set(member.id, { member, capacity, load: 0, items: [] });
  });

  activeProjects().forEach((project) => {
    (project.tasks || []).forEach((task) => {
      const progress = Math.min(100, Math.max(0, Number(task.progress) || 0));
      if (progress >= 100) return;
      const remain = taskWeight(task) * (1 - progress / 100);
      if (remain <= 0) return;
      const win = loadWindow(task, ref);
      if (!win) return;

      const winBiz = Math.max(1, bizDays(win.from, win.to));
      const inMonth = overlapBizDays(win.from, win.to, mStart, mEnd);
      let share = (remain * inMonth) / winBiz;

      /* 期限超過タスクは残工数を丸ごと当月へ */
      const end = parseDate(task.end);
      if (end && end < ref) {
        const currentMonth = monthKey(ref);
        share = ym === currentMonth ? remain : 0;
      }
      if (share <= 0) return;

      const assignees = (task.assigneeIds || []).filter((id) => result.has(id));
      if (!assignees.length) return;
      const per = share / assignees.length;

      assignees.forEach((id) => {
        const entry = result.get(id);
        entry.load += per;
        entry.items.push({ project, task, days: per });
      });
    });
  });

  result.forEach((entry) => {
    entry.load = round1(entry.load);
    entry.capacity = round1(entry.capacity);
    entry.rate = entry.capacity > 0 ? (entry.load / entry.capacity) * 100 : entry.load > 0 ? 999 : 0;
    entry.free = round1(entry.capacity - entry.load);
    entry.items.sort((a, b) => b.days - a.days);
  });

  return result;
}

function rateClass(rate) {
  if (rate >= 100) return "over";
  if (rate >= 85) return "high";
  return "free";
}

/* ---------------- 応援候補 ---------------- */

/* 遅れを取り戻すのに必要な工数（人日） */
function shortfallDays(task, ref) {
  const progress = Math.min(100, Math.max(0, Number(task.progress) || 0));
  const plan = plannedProgress(task, ref);
  const gap = Math.max(0, plan - progress);
  return round1((taskWeight(task) * gap) / 100);
}

function supportCandidates(project, task) {
  const loads = computeLoads(state.baseMonth);
  const assigned = new Set(task ? task.assigneeIds || [] : project.memberIds || []);
  const ref = today();
  const need = task ? shortfallDays(task, ref) : projectSummary(project, ref).remainDays;

  const candidates = [];
  loads.forEach((entry) => {
    if (assigned.has(entry.member.id)) return;
    const skillMatch = (entry.member.skills || []).includes(project.category);
    const inProject = (project.memberIds || []).includes(entry.member.id);
    const free = entry.free;

    let score = 0;
    score += Math.max(-30, Math.min(45, free * 4)); /* 空き工数 */
    score += skillMatch ? 30 : 0; /* 分野が一致 */
    score += inProject ? 14 : 0; /* すでに業務内容を把握 */
    score += entry.rate < 70 ? 10 : 0; /* 余力あり */
    score -= entry.rate >= 100 ? 25 : 0; /* すでに過負荷 */

    const reasons = [];
    if (free > 0) reasons.push(`基準月に約${free}人日の空きあり`);
    else reasons.push("空き工数なし（他業務の調整が必要）");
    if (skillMatch) reasons.push(`${project.category}の経験あり`);
    if (inProject) reasons.push("同じ業務に参加中で引継ぎが早い");
    if (entry.rate >= 100) reasons.push("稼働率100%超のため要調整");

    candidates.push({ entry, score, reasons, skillMatch, free });
  });

  candidates.sort((a, b) => b.score - a.score);
  return { need, candidates: candidates.slice(0, 5) };
}

/* ---------------- データ操作 ---------------- */

function activeProjects() {
  return state.data.projects.filter((p) => p.status !== "done");
}

function doneProjects() {
  return state.data.projects.filter((p) => p.status === "done");
}

function findProject(id) {
  return state.data.projects.find((p) => p.id === id) || null;
}

function findMember(id) {
  return state.data.members.find((m) => m.id === id) || null;
}

function memberName(id) {
  const member = findMember(id);
  return member ? member.name : "未割当";
}

function allTasks() {
  const list = [];
  activeProjects().forEach((project) => {
    (project.tasks || []).forEach((task) => list.push({ project, task }));
  });
  return list;
}

/* ---------------- 描画: 共通 ---------------- */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function icons() {
  if (window.lucide) window.lucide.createIcons();
}

let toastTimer = null;
function toast(message) {
  const el = $("[data-toast]");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.hidden = true;
  }, 2600);
}

function esc(text) {
  return String(text ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

function render() {
  renderDashboard();
  renderProjects();
  renderGantt();
  renderMembers();
  renderArchive();
  icons();
}

function setView(view) {
  state.view = view;
  $$(".tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.view === view));
  $$(".view").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.viewPanel === view));
  if (view === "gantt") renderGantt();
  icons();
}

/* ---------------- 描画: ダッシュボード ---------------- */

function renderDashboard() {
  const ref = today();
  const projects = activeProjects();
  const summaries = projects.map((project) => ({ project, summary: projectSummary(project, ref) }));
  const loads = computeLoads(state.baseMonth);

  /* KPI */
  const late = summaries.filter((s) => s.summary.status === "late").length;
  const warn = summaries.filter((s) => s.summary.status === "warn").length;
  const ok = summaries.filter((s) => s.summary.status === "ok" || s.summary.status === "done").length;

  let rateSum = 0;
  let rateCount = 0;
  loads.forEach((entry) => {
    rateSum += Math.min(entry.rate, 200);
    rateCount += 1;
  });
  const avgRate = rateCount ? Math.round(rateSum / rateCount) : 0;

  const dueSoon = allTasks().filter(({ task }) => {
    const end = parseDate(task.end);
    if (!end) return false;
    const left = diffDays(ref, end);
    return (Number(task.progress) || 0) < 100 && left >= 0 && left <= 14;
  }).length;

  $("[data-kpi]").innerHTML = [
    `<div class="kpi"><span>進行中プロジェクト</span><strong>${projects.length}</strong><small>完了業務は一覧から除外</small></div>`,
    `<div class="kpi late"><span>遅延</span><strong>${late}</strong><small>${LATE_GAP}pt以上の遅れ・期限超過・遅延タスク2件以上</small></div>`,
    `<div class="kpi warn"><span>注意</span><strong>${warn}</strong><small>${WARN_GAP}pt以上の遅れ、または遅延タスクあり</small></div>`,
    `<div class="kpi ok"><span>順調</span><strong>${ok}</strong><small>予定どおり進行中</small></div>`,
    `<div class="kpi"><span>平均稼働率</span><strong>${avgRate}<small style="font-size:15px">%</small></strong><small>期限14日以内のタスク ${dueSoon}件</small></div>`
  ].join("");

  /* プロジェクト状況 */
  const order = { late: 0, warn: 1, ok: 2, done: 3 };
  const sorted = [...summaries].sort((a, b) => {
    const diff = order[a.summary.status] - order[b.summary.status];
    if (diff !== 0) return diff;
    return b.summary.gap - a.summary.gap;
  });

  const statusHost = $("[data-project-status]");
  if (!sorted.length) {
    statusHost.innerHTML = `<p class="empty">進行中のプロジェクトがありません。「プロジェクト」タブから追加してください。</p>`;
  } else {
    statusHost.innerHTML = sorted
      .map(({ project, summary }) => {
        const cls = summary.status === "done" ? "ok" : summary.status;
        const left =
          summary.daysLeft === null
            ? ""
            : summary.daysLeft < 0
              ? `<span style="color:var(--red);font-weight:800">期限超過 ${Math.abs(summary.daysLeft)}日</span>`
              : `残り ${summary.daysLeft}日`;
        return `
        <article class="status-row ${cls}" data-open-gantt="${project.id}">
          <div class="status-row-head">
            <span class="status-row-title">${esc(project.name)}</span>
            <span class="chip ${summary.status}">${STATUS_LABEL[summary.status]}${
              summary.gap > 0 ? ` −${Math.round(summary.gap)}pt` : ""
            }</span>
          </div>
          <div class="bar">
            <div class="bar-fill ${cls}" style="width:${Math.min(100, summary.actualPct).toFixed(1)}%"></div>
            <div class="bar-plan" style="left:${Math.min(100, summary.planPct).toFixed(1)}%"></div>
          </div>
          <div class="status-row-meta">
            <span>進捗 ${Math.round(summary.actualPct)}%（予定 ${Math.round(summary.planPct)}%）</span>
            <span>${esc(project.client || "発注者未設定")}</span>
            <span>管理: ${esc(memberName(project.manager))}</span>
            <span>履行期限 ${formatFull(project.end)}</span>
            <span>${left}</span>
            ${summary.lateTasks ? `<span style="color:var(--red)">遅延タスク ${summary.lateTasks}件</span>` : ""}
          </div>
        </article>`;
      })
      .join("");
  }

  /* 応援が必要なタスク */
  const alerts = allTasks()
    .map(({ project, task }) => ({ project, task, status: taskStatus(task, ref), short: shortfallDays(task, ref) }))
    .filter((row) => row.status === "late" || row.status === "warn")
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "late" ? -1 : 1;
      return b.short - a.short;
    });

  const alertHost = $("[data-alert-list]");
  alertHost.innerHTML = alerts.length
    ? alerts
        .map(({ project, task, status, short }) => {
          const end = parseDate(task.end);
          const left = end ? diffDays(ref, end) : null;
          const names = (task.assigneeIds || []).map(memberName).join("、") || "未割当";
          return `
        <div class="alert-item">
          <div class="alert-top">
            <strong>${esc(task.name)}</strong>
            <span class="chip ${status}">${STATUS_LABEL[status]}</span>
          </div>
          <div class="sub">${esc(project.name)}</div>
          <div class="sub">担当: ${esc(names)} ／ 期限 ${formatFull(task.end)}${
            left !== null ? (left < 0 ? `（${Math.abs(left)}日超過）` : `（残り${left}日）`) : ""
          }</div>
          <div class="sub">進捗 ${Math.round(Number(task.progress) || 0)}%（予定 ${Math.round(
            plannedProgress(task, ref)
          )}%） ／ 挽回に必要な工数 約${short}人日</div>
          <div class="alert-actions">
            <button type="button" class="button primary small" data-support-task="${task.id}" data-project="${project.id}"><i data-lucide="life-buoy"></i>応援候補を見る</button>
            <button type="button" class="button secondary small" data-edit-task="${task.id}" data-project="${project.id}"><i data-lucide="pencil"></i>編集</button>
          </div>
        </div>`;
        })
        .join("")
    : `<p class="empty">遅れているタスクはありません。</p>`;

  /* 稼働率 */
  const loadHost = $("[data-load-list]");
  const loadRows = Array.from(loads.values()).sort((a, b) => b.rate - a.rate);
  loadHost.innerHTML = loadRows.length
    ? loadRows
        .map((entry) => {
          const cls = rateClass(entry.rate);
          const width = Math.min(100, entry.rate);
          const top = entry.items
            .slice(0, 2)
            .map((item) => `${esc(item.project.name.slice(0, 18))} ${round1(item.days)}人日`)
            .join(" / ");
          return `
        <div class="load-item">
          <div class="load-top">
            <strong>${esc(entry.member.name)}<span class="load-sub"> ${esc(entry.member.role || "")}</span></strong>
            <span class="rate ${cls}">${Math.round(entry.rate)}%</span>
          </div>
          <div class="load-bar"><i class="${cls}" style="width:${width}%"></i></div>
          <div class="load-sub">割当 ${entry.load}人日 / 可能 ${entry.capacity}人日 ／ 空き ${entry.free}人日</div>
          ${top ? `<div class="load-sub">${top}</div>` : ""}
        </div>`;
        })
        .join("")
    : `<p class="empty">メンバーが登録されていません。</p>`;

  /* 期限が近いタスク */
  const due = allTasks()
    .map(({ project, task }) => ({ project, task, end: parseDate(task.end) }))
    .filter((row) => row.end && (Number(row.task.progress) || 0) < 100 && diffDays(ref, row.end) <= 14)
    .sort((a, b) => a.end - b.end);

  $("[data-due-list]").innerHTML = due.length
    ? due
        .map(({ project, task, end }) => {
          const left = diffDays(ref, end);
          const status = taskStatus(task, ref);
          return `
        <div class="alert-item">
          <div class="alert-top">
            <strong>${esc(task.name)}</strong>
            <span class="chip ${left < 0 ? "late" : status}">${
              left < 0 ? `${Math.abs(left)}日超過` : left === 0 ? "本日期限" : `残り${left}日`
            }</span>
          </div>
          <div class="sub">${esc(project.name)}</div>
          <div class="sub">担当: ${esc((task.assigneeIds || []).map(memberName).join("、") || "未割当")} ／ 進捗 ${Math.round(
            Number(task.progress) || 0
          )}%</div>
        </div>`;
        })
        .join("")
    : `<p class="empty">14日以内に期限を迎えるタスクはありません。</p>`;
}

/* ---------------- 描画: プロジェクト一覧 ---------------- */

function renderProjects() {
  const ref = today();
  const host = $("[data-project-list]");
  const projects = activeProjects();

  if (!projects.length) {
    host.innerHTML = `<p class="empty">進行中のプロジェクトはありません。右上の「プロジェクトを追加」から登録してください。</p>`;
    return;
  }

  host.innerHTML = projects
    .map((project) => {
      const summary = projectSummary(project, ref);
      const cls = summary.status === "done" ? "ok" : summary.status;
      const members = (project.memberIds || []).map(memberName).join("、") || "未設定";
      const tasks = [...(project.tasks || [])].sort((a, b) => (a.start < b.start ? -1 : 1));

      const rows = tasks.length
        ? tasks
            .map((task) => {
              const status = taskStatus(task, ref);
              const progress = Math.round(Number(task.progress) || 0);
              const plan = Math.round(plannedProgress(task, ref));
              return `
            <tr data-edit-task="${task.id}" data-project="${project.id}">
              <td>${esc(task.name)}</td>
              <td class="num">${formatDate(task.start)}〜${formatDate(task.end)}</td>
              <td>${esc((task.assigneeIds || []).map(memberName).join("、") || "未割当")}</td>
              <td class="num">${round1(taskWeight(task))}人日</td>
              <td class="num">
                <span class="mini-bar"><i class="${status}" style="width:${Math.min(100, progress)}%"></i><b style="left:${Math.min(
                  100,
                  plan
                )}%"></b></span>
                <span style="margin-left:6px">${progress}%</span>
              </td>
              <td><span class="chip ${status}">${STATUS_LABEL[status]}</span></td>
            </tr>`;
            })
            .join("")
        : `<tr><td colspan="6" style="color:var(--muted)">タスクが登録されていません。</td></tr>`;

      return `
      <article class="project-card ${cls}">
        <div class="project-card-head">
          <div>
            <h3>${esc(project.name)}
              <span class="chip ${summary.status}">${STATUS_LABEL[summary.status]}</span>
              ${project.priority === "high" ? `<span class="chip plain">重点</span>` : ""}
            </h3>
            <div class="project-meta">
              <span>${esc(project.client || "発注者未設定")}</span>
              <span>${esc(project.category || "分野未設定")}</span>
              <span>工期 ${formatFull(project.start)} 〜 ${formatFull(project.end)}</span>
              <span>管理技術者 ${esc(memberName(project.manager))}</span>
            </div>
            <div class="project-meta"><span>参加メンバー: ${esc(members)}</span></div>
          </div>
          <div class="card-actions">
            <button type="button" class="button secondary small" data-open-gantt="${project.id}"><i data-lucide="gantt-chart"></i>ガント</button>
            <button type="button" class="button secondary small" data-add-task="${project.id}"><i data-lucide="plus"></i>タスク</button>
            <button type="button" class="button secondary small" data-edit-project="${project.id}"><i data-lucide="pencil"></i>編集</button>
            <button type="button" class="button primary small" data-complete-project="${project.id}"><i data-lucide="check"></i>完了にする</button>
            <button type="button" class="button danger-ghost small" data-delete-project="${project.id}"><i data-lucide="trash-2"></i></button>
          </div>
        </div>

        <div class="bar">
          <div class="bar-fill ${cls}" style="width:${Math.min(100, summary.actualPct).toFixed(1)}%"></div>
          <div class="bar-plan" style="left:${Math.min(100, summary.planPct).toFixed(1)}%"></div>
        </div>
        <div class="project-meta">
          <span>進捗 ${Math.round(summary.actualPct)}%（予定 ${Math.round(summary.planPct)}%）</span>
          <span>タスク ${summary.doneCount}/${summary.taskCount} 完了</span>
          <span>残工数 ${round1(summary.remainDays)}人日</span>
          ${summary.daysLeft !== null ? `<span>${summary.daysLeft < 0 ? `期限超過 ${Math.abs(summary.daysLeft)}日` : `残り ${summary.daysLeft}日`}</span>` : ""}
        </div>

        <div style="overflow-x:auto">
          <table class="task-table">
            <thead>
              <tr><th>タスク</th><th>期間</th><th>担当</th><th>予定工数</th><th>進捗</th><th>状態</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${project.note ? `<p class="panel-note">メモ: ${esc(project.note)}</p>` : ""}
      </article>`;
    })
    .join("");
}

/* ---------------- 描画: ガントチャート ---------------- */

const SCALE_PX = { day: 30, week: 11, month: 4.2 };

function renderGantt() {
  const select = $("[data-gantt-project]");
  const projects = activeProjects();

  if (!projects.length) {
    select.innerHTML = `<option value="">プロジェクトなし</option>`;
    $("[data-gantt]").innerHTML = `<p class="empty">表示できるプロジェクトがありません。</p>`;
    return;
  }

  if (!projects.some((p) => p.id === state.ganttProjectId)) {
    state.ganttProjectId = projects[0].id;
  }

  select.innerHTML = projects
    .map((p) => `<option value="${p.id}"${p.id === state.ganttProjectId ? " selected" : ""}>${esc(p.name)}</option>`)
    .join("");

  const project = findProject(state.ganttProjectId);
  const host = $("[data-gantt]");
  const tasks = [...(project.tasks || [])].sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));

  if (!tasks.length) {
    host.innerHTML = `<p class="empty">タスクが登録されていません。「タスク追加」から登録してください。</p>`;
    return;
  }

  const ref = today();
  const dates = [];
  tasks.forEach((task) => {
    const s = parseDate(task.start);
    const e = parseDate(task.end);
    if (s) dates.push(s);
    if (e) dates.push(e);
  });
  const ps = parseDate(project.start);
  const pe = parseDate(project.end);
  if (ps) dates.push(ps);
  if (pe) dates.push(pe);
  dates.push(ref);

  let min = new Date(Math.min(...dates));
  let max = new Date(Math.max(...dates));
  min = addDays(min, -3);
  max = addDays(max, 4);

  const dayW = SCALE_PX[state.scale];
  const totalDays = diffDays(min, max) + 1;
  const width = Math.max(320, totalDays * dayW);
  const offset = (date) => diffDays(min, date) * dayW;

  /* 月ヘッダー */
  const monthCells = [];
  let cursor = new Date(min.getFullYear(), min.getMonth(), 1);
  while (cursor <= max) {
    const mStart = cursor < min ? min : cursor;
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const mEnd = monthEnd > max ? max : monthEnd;
    const left = offset(mStart);
    const w = (diffDays(mStart, mEnd) + 1) * dayW;
    monthCells.push(
      `<div class="tl-month" style="left:${left}px;width:${w}px">${cursor.getFullYear()}年${cursor.getMonth() + 1}月</div>`
    );
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  /* 目盛り */
  const ticks = [];
  const bands = [];
  if (state.scale === "day") {
    for (let i = 0; i < totalDays; i += 1) {
      const date = addDays(min, i);
      const weekend = isWeekend(date);
      ticks.push(
        `<div class="tl-tick${weekend ? " weekend" : ""}" style="left:${i * dayW}px;width:${dayW}px">${date.getDate()}</div>`
      );
      if (weekend) bands.push(`<div class="grid-band" style="left:${i * dayW}px;width:${dayW}px"></div>`);
    }
  } else {
    /* 週区切り（月曜始まり） */
    let weekStart = new Date(min);
    const shift = (weekStart.getDay() + 6) % 7;
    weekStart = addDays(weekStart, -shift);
    while (weekStart <= max) {
      const left = offset(weekStart);
      const w = 7 * dayW;
      if (left + w > 0) {
        const label =
          state.scale === "week" ? `${weekStart.getMonth() + 1}/${weekStart.getDate()}` : "";
        ticks.push(`<div class="tl-tick" style="left:${left}px;width:${w}px">${label}</div>`);
        bands.push(`<div class="grid-line" style="left:${left}px"></div>`);
      }
      weekStart = addDays(weekStart, 7);
    }
  }

  const todayLeft = offset(ref);
  const todayHead = `<div class="today-line" style="left:${todayLeft}px"><span>本日</span></div>`;
  const todayMark = `<div class="today-line" style="left:${todayLeft}px"></div>`;
  const bandLayer = bands.join("");

  const rows = tasks
    .map((task) => {
      const s = parseDate(task.start);
      const e = parseDate(task.end);
      if (!s || !e) return "";
      const status = taskStatus(task, ref);
      const progress = Math.min(100, Math.max(0, Number(task.progress) || 0));
      const plan = plannedProgress(task, ref);
      const left = offset(s);
      const barW = Math.max(6, (diffDays(s, e) + 1) * dayW);
      const names = (task.assigneeIds || []).map(memberName).join("、") || "未割当";
      const label = barW > 78 ? `<span>${Math.round(progress)}%</span>` : "";
      const title = `${task.name}\n期間: ${formatFull(task.start)} 〜 ${formatFull(task.end)}\n担当: ${names}\n予定工数: ${round1(
        taskWeight(task)
      )}人日\n進捗: ${Math.round(progress)}%（予定 ${Math.round(plan)}%）\n状態: ${STATUS_LABEL[status]}`;

      return `
      <div class="gantt-row">
        <div class="gantt-label">
          <span class="t-name"><span class="chip ${status}">${STATUS_LABEL[status]}</span>${esc(task.name)}</span>
          <span class="t-sub">${esc(names)} ／ ${round1(taskWeight(task))}人日</span>
        </div>
        <div class="gantt-timeline" style="width:${width}px">
          ${bandLayer}
          <div class="gantt-bar ${status}${progress >= 45 ? " filled" : ""}" style="left:${left}px;width:${barW}px"
               data-edit-task="${task.id}" data-project="${project.id}" title="${esc(title)}">
            <i style="width:${progress}%"></i>
            <b style="left:${Math.min(99.6, plan)}%"></b>
            ${label}
          </div>
          ${todayMark}
        </div>
      </div>`;
    })
    .join("");

  const summary = projectSummary(project, ref);
  host.innerHTML = `
    <div class="gantt" style="--label-w:clamp(190px, 24vw, 300px)">
      <div class="gantt-row gantt-head">
        <div class="gantt-label">
          <span class="t-name">${esc(project.name)}</span>
          <span class="t-sub">進捗 ${Math.round(summary.actualPct)}% / 予定 ${Math.round(summary.planPct)}% ・ <span class="chip ${summary.status}">${
            STATUS_LABEL[summary.status]
          }</span></span>
        </div>
        <div class="gantt-timeline" style="width:${width}px">
          ${bandLayer}${monthCells.join("")}${ticks.join("")}${todayHead}
        </div>
      </div>
      ${rows}
    </div>`;

  /* 本日の線が見える位置までスクロール */
  const wrap = $(".gantt-wrap");
  requestAnimationFrame(() => {
    const labelW = 240;
    wrap.scrollLeft = Math.max(0, todayLeft - wrap.clientWidth / 2 + labelW / 2);
  });
}

/* ---------------- 描画: メンバー ---------------- */

function renderMembers() {
  const host = $("[data-member-list]");
  const loads = computeLoads(state.baseMonth);

  if (!state.data.members.length) {
    host.innerHTML = `<p class="empty">メンバーが登録されていません。「メンバーを追加」から登録してください。</p>`;
    return;
  }

  host.innerHTML = state.data.members
    .map((member) => {
      const entry = loads.get(member.id);
      const rate = entry ? entry.rate : 0;
      const cls = rateClass(rate);
      const items = entry
        ? entry.items
            .slice(0, 5)
            .map(
              (item) =>
                `<div><span>${esc(item.project.name.slice(0, 20))} / ${esc(item.task.name)}</span><span>${round1(
                  item.days
                )}人日</span></div>`
            )
            .join("")
        : "";

      return `
      <article class="member-card">
        <div class="member-card-head">
          <div>
            <h3>${esc(member.name)}</h3>
            <p class="role">${esc(member.role || "")} ／ 稼働可能率 ${member.capacityRate || 100}%</p>
          </div>
          <button type="button" class="icon-button" data-edit-member="${member.id}" aria-label="編集"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
        </div>
        <div class="load-top">
          <span class="load-sub">基準月 ${state.baseMonth} の稼働率</span>
          <span class="rate ${cls}">${Math.round(rate)}%</span>
        </div>
        <div class="load-bar"><i class="${cls}" style="width:${Math.min(100, rate)}%"></i></div>
        <div class="load-sub">割当 ${entry ? entry.load : 0}人日 / 可能 ${entry ? entry.capacity : 0}人日 ／ 空き ${
          entry ? entry.free : 0
        }人日</div>
        ${(member.skills || []).length ? `<div class="tag-row">${member.skills.map((s) => `<span class="tag">${esc(s)}</span>`).join("")}</div>` : ""}
        ${items ? `<div class="assign-list">${items}</div>` : `<div class="load-sub">現在の割当はありません。</div>`}
        ${member.note ? `<p class="load-sub">${esc(member.note)}</p>` : ""}
      </article>`;
    })
    .join("");
}

/* ---------------- 描画: 完了業務 ---------------- */

function renderArchive() {
  const host = $("[data-archive-list]");
  const projects = doneProjects();

  if (!projects.length) {
    host.innerHTML = `<p class="empty">完了した業務はまだありません。プロジェクトを「完了にする」と、進行中の一覧から外れてここに移動します。</p>`;
    return;
  }

  host.innerHTML = projects
    .map(
      (project) => `
      <article class="project-card">
        <div class="project-card-head">
          <div>
            <h3>${esc(project.name)}<span class="chip done">完了</span></h3>
            <div class="project-meta">
              <span>${esc(project.client || "発注者未設定")}</span>
              <span>${esc(project.category || "")}</span>
              <span>工期 ${formatFull(project.start)} 〜 ${formatFull(project.end)}</span>
              <span>完了日 ${project.completedAt ? formatFull(project.completedAt) : "-"}</span>
              <span>タスク ${(project.tasks || []).length}件</span>
            </div>
          </div>
          <div class="card-actions">
            <button type="button" class="button secondary small" data-restore-project="${project.id}"><i data-lucide="rotate-ccw"></i>進行中に戻す</button>
            <button type="button" class="button danger-ghost small" data-delete-project="${project.id}"><i data-lucide="trash-2"></i>完全に削除</button>
          </div>
        </div>
      </article>`
    )
    .join("");
}

/* ---------------- ダイアログ ---------------- */

let editingProjectId = null;
let editingTaskRef = null; /* {projectId, taskId} */
let editingMemberId = null;

function memberCheckboxes(host, selected, nameAttr) {
  host.innerHTML = state.data.members.length
    ? state.data.members
        .map(
          (m) => `<label><input type="checkbox" name="${nameAttr}" value="${m.id}"${
            selected.includes(m.id) ? " checked" : ""
          } />${esc(m.name)}</label>`
        )
        .join("")
    : `<span class="load-sub">メンバーが未登録です。</span>`;
}

function openProjectDialog(projectId) {
  editingProjectId = projectId || null;
  const dialog = $('[data-dialog="project"]');
  const form = $('[data-form="project"]');
  const project = projectId ? findProject(projectId) : null;

  $("[data-title]", dialog).textContent = project ? "プロジェクトを編集" : "プロジェクトを追加";

  const managerSelect = $("[data-member-select]", form);
  managerSelect.innerHTML =
    `<option value="">未設定</option>` +
    state.data.members
      .map((m) => `<option value="${m.id}"${project && project.manager === m.id ? " selected" : ""}>${esc(m.name)}</option>`)
      .join("");

  memberCheckboxes($("[data-member-checks]", form), project ? project.memberIds || [] : [], "memberIds");

  form.elements.name.value = project ? project.name : "";
  form.elements.client.value = project ? project.client || "" : "";
  form.elements.category.value = project ? project.category || "橋梁設計" : "橋梁設計";
  form.elements.start.value = project ? project.start : toKey(today());
  form.elements.end.value = project ? project.end : toKey(addDays(today(), 60));
  form.elements.priority.value = project ? project.priority || "normal" : "normal";
  form.elements.note.value = project ? project.note || "" : "";

  icons();
  dialog.showModal();
}

function openTaskDialog(projectId, taskId) {
  const dialog = $('[data-dialog="task"]');
  const form = $('[data-form="task"]');
  const project = findProject(projectId) || activeProjects()[0];
  if (!project) {
    toast("先にプロジェクトを追加してください。");
    return;
  }
  const task = taskId ? (project.tasks || []).find((t) => t.id === taskId) : null;
  editingTaskRef = task ? { projectId: project.id, taskId: task.id } : null;

  $("[data-title]", dialog).textContent = task ? "タスクを編集" : "タスクを追加";
  $("[data-delete-task]", dialog).hidden = !task;

  $("[data-task-project]", form).innerHTML = activeProjects()
    .map((p) => `<option value="${p.id}"${p.id === project.id ? " selected" : ""}>${esc(p.name)}</option>`)
    .join("");

  memberCheckboxes($("[data-task-member-checks]", form), task ? task.assigneeIds || [] : [], "assigneeIds");

  form.elements.name.value = task ? task.name : "";
  form.elements.start.value = task ? task.start : project.start || toKey(today());
  form.elements.end.value = task ? task.end : toKey(addDays(today(), 14));
  form.elements.planDays.value = task ? task.planDays : 5;
  form.elements.progress.value = task ? task.progress : 0;
  form.elements.note.value = task ? task.note || "" : "";

  icons();
  dialog.showModal();
}

function openMemberDialog(memberId) {
  editingMemberId = memberId || null;
  const dialog = $('[data-dialog="member"]');
  const form = $('[data-form="member"]');
  const member = memberId ? findMember(memberId) : null;

  $("[data-title]", dialog).textContent = member ? "メンバーを編集" : "メンバーを追加";
  $("[data-delete-member]", dialog).hidden = !member;

  $("[data-skill-checks]", form).innerHTML = CATEGORIES.map(
    (c) =>
      `<label><input type="checkbox" name="skills" value="${esc(c)}"${
        member && (member.skills || []).includes(c) ? " checked" : ""
      } />${esc(c)}</label>`
  ).join("");

  form.elements.name.value = member ? member.name : "";
  form.elements.role.value = member ? member.role || "担当技術者" : "担当技術者";
  form.elements.capacityRate.value = member ? member.capacityRate || 100 : 100;
  form.elements.note.value = member ? member.note || "" : "";

  icons();
  dialog.showModal();
}

function openSupportDialog(projectId, taskId) {
  const project = findProject(projectId);
  if (!project) return;
  const task = taskId ? (project.tasks || []).find((t) => t.id === taskId) : null;
  const { need, candidates } = supportCandidates(project, task);
  const ref = today();
  const body = $("[data-support-body]");

  const targetInfo = task
    ? `<strong>${esc(task.name)}</strong>
       <span>${esc(project.name)}</span>
       <span>担当: ${esc((task.assigneeIds || []).map(memberName).join("、") || "未割当")} ／ 期限 ${formatFull(task.end)}</span>
       <span>進捗 ${Math.round(Number(task.progress) || 0)}%（予定 ${Math.round(plannedProgress(task, ref))}%）</span>
       <span><b>挽回に必要な工数: 約${need}人日</b></span>`
    : `<strong>${esc(project.name)}</strong><span>残工数 約${round1(need)}人日</span>`;

  body.innerHTML = `
    <div class="support-target">${targetInfo}</div>
    <p class="panel-note">基準月 ${state.baseMonth} の空き工数・分野の一致・業務への参加状況から並べ替えています。</p>
    <div class="cand-list">
      ${
        candidates.length
          ? candidates
              .map(
                (c, index) => `
        <div class="cand${index === 0 ? " top" : ""}">
          <div class="cand-head">
            <strong>${index === 0 ? "◎ " : ""}${esc(c.entry.member.name)}<span class="load-sub"> ${esc(
              c.entry.member.role || ""
            )}</span></strong>
            <span class="rate ${rateClass(c.entry.rate)}">稼働率 ${Math.round(c.entry.rate)}%</span>
          </div>
          <div class="cand-reason">${esc(c.reasons.join(" ／ "))}</div>
          <div class="cand-metrics">
            <span>空き工数 ${c.free}人日</span>
            <span>割当 ${c.entry.load}人日 / 可能 ${c.entry.capacity}人日</span>
            <span>${c.skillMatch ? `分野一致: ${esc(project.category)}` : "分野一致なし"}</span>
          </div>
        </div>`
              )
              .join("")
          : `<p class="empty">応援に回せるメンバーがいません。工期の見直しや外注を検討してください。</p>`
      }
    </div>`;

  icons();
  $('[data-dialog="support"]').showModal();
}

/* ---------------- フォーム保存 ---------------- */

function checkedValues(form, name) {
  return $$(`input[name="${name}"]:checked`, form).map((input) => input.value);
}

function handleProjectSubmit(event) {
  const form = event.target;
  const values = {
    name: form.elements.name.value.trim(),
    client: form.elements.client.value.trim(),
    category: form.elements.category.value,
    start: form.elements.start.value,
    end: form.elements.end.value,
    manager: form.elements.manager.value,
    priority: form.elements.priority.value,
    note: form.elements.note.value.trim(),
    memberIds: checkedValues(form, "memberIds")
  };

  if (!values.name || !values.start || !values.end) return;
  if (values.end < values.start) {
    toast("履行期限は着手日より後にしてください。");
    event.preventDefault();
    return;
  }

  if (editingProjectId) {
    const project = findProject(editingProjectId);
    Object.assign(project, values);
  } else {
    state.data.projects.push({
      id: uid("p"),
      status: "active",
      tasks: [],
      ...values
    });
  }
  editingProjectId = null;
  save();
  render();
  toast("プロジェクトを保存しました。");
}

function handleTaskSubmit(event) {
  const form = event.target;
  const projectId = form.elements.projectId.value;
  const project = findProject(projectId);
  if (!project) return;

  const values = {
    name: form.elements.name.value.trim(),
    start: form.elements.start.value,
    end: form.elements.end.value,
    planDays: Number(form.elements.planDays.value) || 0,
    progress: Math.min(100, Math.max(0, Number(form.elements.progress.value) || 0)),
    assigneeIds: checkedValues(form, "assigneeIds"),
    note: form.elements.note.value.trim()
  };

  if (!values.name || !values.start || !values.end) return;
  if (values.end < values.start) {
    toast("終了予定日は開始日より後にしてください。");
    event.preventDefault();
    return;
  }

  if (editingTaskRef) {
    const source = findProject(editingTaskRef.projectId);
    const index = (source.tasks || []).findIndex((t) => t.id === editingTaskRef.taskId);
    const existing = source.tasks[index];
    if (source.id === project.id) {
      Object.assign(existing, values);
    } else {
      source.tasks.splice(index, 1);
      project.tasks = project.tasks || [];
      project.tasks.push({ ...existing, ...values });
    }
  } else {
    project.tasks = project.tasks || [];
    project.tasks.push({ id: uid("t"), ...values });
  }

  editingTaskRef = null;
  save();
  render();
  toast("タスクを保存しました。");
}

function handleMemberSubmit(event) {
  const form = event.target;
  const values = {
    name: form.elements.name.value.trim(),
    role: form.elements.role.value,
    capacityRate: Math.min(100, Math.max(10, Number(form.elements.capacityRate.value) || 100)),
    skills: checkedValues(form, "skills"),
    note: form.elements.note.value.trim()
  };
  if (!values.name) return;

  if (editingMemberId) {
    Object.assign(findMember(editingMemberId), values);
  } else {
    state.data.members.push({ id: uid("m"), ...values });
  }
  editingMemberId = null;
  save();
  render();
  toast("メンバーを保存しました。");
}

/* ---------------- 書き出し・読み込み ---------------- */

function exportData() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `koutei-kanri-${toKey(today())}.json`;
  link.click();
  URL.revokeObjectURL(url);
  toast("バックアップを保存しました。");
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!parsed || !Array.isArray(parsed.projects) || !Array.isArray(parsed.members)) {
        throw new Error("形式が違います");
      }
      state.data = parsed;
      save();
      render();
      toast("バックアップを読み込みました。");
    } catch (error) {
      toast("読み込めませんでした。バックアップファイルを確認してください。");
    }
  };
  reader.readAsText(file);
}

/* ---------------- イベント ---------------- */

function bindEvents() {
  $$(".tab").forEach((tab) => tab.addEventListener("click", () => setView(tab.dataset.view)));

  $("[data-base-month]").value = state.baseMonth;
  $("[data-base-month]").addEventListener("change", (event) => {
    state.baseMonth = event.target.value || monthKey(today());
    renderDashboard();
    renderMembers();
    icons();
  });

  $("[data-gantt-project]").addEventListener("change", (event) => {
    state.ganttProjectId = event.target.value;
    renderGantt();
    icons();
  });

  $$("[data-scale]").forEach((button) =>
    button.addEventListener("click", () => {
      state.scale = button.dataset.scale;
      $$("[data-scale]").forEach((b) => b.classList.toggle("is-active", b === button));
      renderGantt();
      icons();
    })
  );

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action], [data-edit-project], [data-delete-project], [data-complete-project], [data-restore-project], [data-add-task], [data-edit-task], [data-edit-member], [data-open-gantt], [data-support-task], [data-close]");
    if (!target) return;

    if (target.dataset.close !== undefined) {
      target.closest("dialog").close();
      return;
    }

    const action = target.dataset.action;
    if (action === "new-project") return openProjectDialog(null);
    if (action === "new-task") return openTaskDialog(state.ganttProjectId, null);
    if (action === "new-member") return openMemberDialog(null);
    if (action === "export") return exportData();
    if (action === "import") return $("[data-import-file]").click();

    if (target.dataset.supportTask) {
      event.stopPropagation();
      return openSupportDialog(target.dataset.project, target.dataset.supportTask);
    }
    if (target.dataset.editProject) return openProjectDialog(target.dataset.editProject);
    if (target.dataset.addTask) return openTaskDialog(target.dataset.addTask, null);
    if (target.dataset.editTask) {
      event.stopPropagation();
      return openTaskDialog(target.dataset.project, target.dataset.editTask);
    }
    if (target.dataset.editMember) return openMemberDialog(target.dataset.editMember);

    if (target.dataset.openGantt) {
      state.ganttProjectId = target.dataset.openGantt;
      setView("gantt");
      renderGantt();
      icons();
      return;
    }

    if (target.dataset.completeProject) {
      const project = findProject(target.dataset.completeProject);
      if (!project) return;
      if (!confirm(`「${project.name}」を完了にします。進行中の一覧から外れ、「完了業務」に移動します。よろしいですか？`)) return;
      project.status = "done";
      project.completedAt = toKey(today());
      save();
      render();
      toast("完了業務に移動しました。");
      return;
    }

    if (target.dataset.restoreProject) {
      const project = findProject(target.dataset.restoreProject);
      if (!project) return;
      project.status = "active";
      delete project.completedAt;
      save();
      render();
      toast("進行中に戻しました。");
      return;
    }

    if (target.dataset.deleteProject) {
      const project = findProject(target.dataset.deleteProject);
      if (!project) return;
      if (!confirm(`「${project.name}」を完全に削除します。元に戻せません。よろしいですか？`)) return;
      state.data.projects = state.data.projects.filter((p) => p.id !== project.id);
      save();
      render();
      toast("削除しました。");
    }
  });

  $("[data-import-file]").addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) importData(file);
    event.target.value = "";
  });

  $('[data-form="project"]').addEventListener("submit", handleProjectSubmit);
  $('[data-form="task"]').addEventListener("submit", handleTaskSubmit);
  $('[data-form="member"]').addEventListener("submit", handleMemberSubmit);

  $("[data-delete-task]").addEventListener("click", () => {
    if (!editingTaskRef) return;
    const project = findProject(editingTaskRef.projectId);
    const task = (project.tasks || []).find((t) => t.id === editingTaskRef.taskId);
    if (!confirm(`タスク「${task ? task.name : ""}」を削除します。よろしいですか？`)) return;
    project.tasks = project.tasks.filter((t) => t.id !== editingTaskRef.taskId);
    editingTaskRef = null;
    save();
    render();
    $('[data-dialog="task"]').close();
    toast("タスクを削除しました。");
  });

  $("[data-delete-member]").addEventListener("click", () => {
    if (!editingMemberId) return;
    const member = findMember(editingMemberId);
    if (!confirm(`「${member ? member.name : ""}」を削除します。担当の割当も外れます。よろしいですか？`)) return;
    state.data.members = state.data.members.filter((m) => m.id !== editingMemberId);
    state.data.projects.forEach((project) => {
      project.memberIds = (project.memberIds || []).filter((id) => id !== editingMemberId);
      if (project.manager === editingMemberId) project.manager = "";
      (project.tasks || []).forEach((task) => {
        task.assigneeIds = (task.assigneeIds || []).filter((id) => id !== editingMemberId);
      });
    });
    editingMemberId = null;
    save();
    render();
    $('[data-dialog="member"]').close();
    toast("メンバーを削除しました。");
  });
}

/* ---------------- 起動 ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  load();
  bindEvents();
  render();
  setView("dashboard");
});
