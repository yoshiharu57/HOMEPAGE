/**
 * 業務日報・労務管理アプリ サーバー
 *
 * 外部ライブラリ不要。Node.js (v18以上) だけで動作します。
 * 起動方法:  node server.js
 * ポート変更: PORT=8080 node server.js
 *
 * データは data/db.json に保存されます(自動作成)。
 * バックアップはこのファイルをコピーするだけです。
 */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

/* ---------------------------------- データ層 ---------------------------------- */

let db = {
  employees: [], // { id, name, active }
  tasks: [],     // { id, code, name, active }
  entries: [],   // { id, date: 'YYYY-MM-DD', employeeId, taskId, hours, note }
  seq: { employee: 0, task: 0, entry: 0 },
};

function loadDb() {
  if (fs.existsSync(DB_FILE)) {
    const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    db = Object.assign(db, raw);
    db.seq = Object.assign({ employee: 0, task: 0, entry: 0 }, raw.seq);
  }
}

function saveDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmp, DB_FILE);
}

function nextId(kind) {
  db.seq[kind] += 1;
  return db.seq[kind];
}

/* ---------------------------------- バリデーション ---------------------------------- */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

function isValidDate(s) {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(s + 'T00:00:00');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function isValidHours(h) {
  return typeof h === 'number' && Number.isFinite(h) && h > 0 && h <= 24;
}

/** 0.25時間(15分)単位に丸める */
function roundHours(h) {
  return Math.round(h * 4) / 4;
}

/* ---------------------------------- 集計 ---------------------------------- */

function entriesOfMonth(month) {
  return db.entries.filter((e) => e.date.startsWith(month + '-'));
}

/**
 * 月次総括表: 技術者×業務のマトリクス
 * その月に実績がある人・業務は退職/終了済みでも表示する
 */
function buildSummary(month) {
  const entries = entriesOfMonth(month);
  const usedEmp = new Set(entries.map((e) => e.employeeId));
  const usedTask = new Set(entries.map((e) => e.taskId));

  const employees = db.employees.filter((p) => p.active || usedEmp.has(p.id));
  const tasks = db.tasks.filter((t) => t.active || usedTask.has(t.id));

  // matrix[employeeId][taskId] = hours
  const matrix = {};
  const empTotals = {};   // 技術者ごとの合計時間
  const taskTotals = {};  // 業務ごとの合計時間
  const empDays = {};     // 技術者ごとの入力日数
  const daysSeen = {};
  let grandTotal = 0;

  for (const e of entries) {
    matrix[e.employeeId] = matrix[e.employeeId] || {};
    matrix[e.employeeId][e.taskId] = (matrix[e.employeeId][e.taskId] || 0) + e.hours;
    empTotals[e.employeeId] = (empTotals[e.employeeId] || 0) + e.hours;
    taskTotals[e.taskId] = (taskTotals[e.taskId] || 0) + e.hours;
    grandTotal += e.hours;
    daysSeen[e.employeeId] = daysSeen[e.employeeId] || new Set();
    daysSeen[e.employeeId].add(e.date);
  }
  for (const [empId, set] of Object.entries(daysSeen)) empDays[empId] = set.size;

  return { month, employees, tasks, matrix, empTotals, taskTotals, empDays, grandTotal };
}

/** 入力状況: 技術者×日付ごとの合計時間(未入力チェック用) */
function buildStatus(month) {
  const entries = entriesOfMonth(month);
  const byEmpDate = {};
  for (const e of entries) {
    byEmpDate[e.employeeId] = byEmpDate[e.employeeId] || {};
    byEmpDate[e.employeeId][e.date] = (byEmpDate[e.employeeId][e.date] || 0) + e.hours;
  }
  const employees = db.employees.filter((p) => p.active || byEmpDate[p.id]);
  return { month, employees, byEmpDate };
}

/* ---------------------------------- CSV出力 ---------------------------------- */

function csvEscape(v) {
  const s = String(v == null ? '' : v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function toCsv(rows) {
  // BOM付きUTF-8(Excelで文字化けしないように)
  return '\uFEFF' + rows.map((r) => r.map(csvEscape).join(',')).join('\r\n');
}

function summaryCsv(month) {
  const s = buildSummary(month);
  const header = ['技術者', ...s.tasks.map((t) => (t.code ? `[${t.code}] ${t.name}` : t.name)), '合計', '入力日数'];
  const rows = [[`業務時間 総括表 (${month})`], [], header];
  for (const p of s.employees) {
    rows.push([
      p.name,
      ...s.tasks.map((t) => (s.matrix[p.id] && s.matrix[p.id][t.id]) || ''),
      s.empTotals[p.id] || 0,
      s.empDays[p.id] || 0,
    ]);
  }
  rows.push(['業務別合計', ...s.tasks.map((t) => s.taskTotals[t.id] || 0), s.grandTotal, '']);
  return toCsv(rows);
}

function entriesCsv(month) {
  const empName = new Map(db.employees.map((p) => [p.id, p.name]));
  const taskName = new Map(db.tasks.map((t) => [t.id, t.name]));
  const rows = [['日付', '技術者', '業務', '時間', '備考']];
  const entries = entriesOfMonth(month).slice().sort((a, b) =>
    a.date === b.date ? a.employeeId - b.employeeId : a.date.localeCompare(b.date)
  );
  for (const e of entries) {
    rows.push([e.date, empName.get(e.employeeId) || '', taskName.get(e.taskId) || '', e.hours, e.note || '']);
  }
  return toCsv(rows);
}

/* ---------------------------------- HTTPユーティリティ ---------------------------------- */

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        reject(new Error('リクエストが大きすぎます'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('JSONの形式が不正です'));
      }
    });
    req.on('error', reject);
  });
}

/* ---------------------------------- APIハンドラ ---------------------------------- */

const api = {
  /* ---- 技術者マスタ ---- */
  'GET /api/employees'(req, res) {
    sendJson(res, 200, db.employees);
  },

  async 'POST /api/employees'(req, res) {
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    if (!name) return sendError(res, 400, '氏名を入力してください');
    if (db.employees.some((p) => p.name === name)) return sendError(res, 400, '同じ氏名がすでに登録されています');
    const emp = { id: nextId('employee'), name, active: true };
    db.employees.push(emp);
    saveDb();
    sendJson(res, 201, emp);
  },

  async 'PUT /api/employees/:id'(req, res, params) {
    const emp = db.employees.find((p) => p.id === Number(params.id));
    if (!emp) return sendError(res, 404, '技術者が見つかりません');
    const body = await readBody(req);
    if (body.name != null) {
      const name = String(body.name).trim();
      if (!name) return sendError(res, 400, '氏名を入力してください');
      if (db.employees.some((p) => p.name === name && p.id !== emp.id)) {
        return sendError(res, 400, '同じ氏名がすでに登録されています');
      }
      emp.name = name;
    }
    if (body.active != null) emp.active = Boolean(body.active);
    saveDb();
    sendJson(res, 200, emp);
  },

  'DELETE /api/employees/:id'(req, res, params) {
    const id = Number(params.id);
    if (db.entries.some((e) => e.employeeId === id)) {
      return sendError(res, 409, '日報の実績がある技術者は削除できません。「無効」にしてください');
    }
    const before = db.employees.length;
    db.employees = db.employees.filter((p) => p.id !== id);
    if (db.employees.length === before) return sendError(res, 404, '技術者が見つかりません');
    saveDb();
    sendJson(res, 200, { ok: true });
  },

  /* ---- 業務マスタ ---- */
  'GET /api/tasks'(req, res) {
    sendJson(res, 200, db.tasks);
  },

  async 'POST /api/tasks'(req, res) {
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    const code = String(body.code || '').trim();
    if (!name) return sendError(res, 400, '業務名を入力してください');
    if (db.tasks.some((t) => t.name === name)) return sendError(res, 400, '同じ業務名がすでに登録されています');
    const task = { id: nextId('task'), code, name, active: true };
    db.tasks.push(task);
    saveDb();
    sendJson(res, 201, task);
  },

  async 'PUT /api/tasks/:id'(req, res, params) {
    const task = db.tasks.find((t) => t.id === Number(params.id));
    if (!task) return sendError(res, 404, '業務が見つかりません');
    const body = await readBody(req);
    if (body.name != null) {
      const name = String(body.name).trim();
      if (!name) return sendError(res, 400, '業務名を入力してください');
      if (db.tasks.some((t) => t.name === name && t.id !== task.id)) {
        return sendError(res, 400, '同じ業務名がすでに登録されています');
      }
      task.name = name;
    }
    if (body.code != null) task.code = String(body.code).trim();
    if (body.active != null) task.active = Boolean(body.active);
    saveDb();
    sendJson(res, 200, task);
  },

  'DELETE /api/tasks/:id'(req, res, params) {
    const id = Number(params.id);
    if (db.entries.some((e) => e.taskId === id)) {
      return sendError(res, 409, '日報の実績がある業務は削除できません。「無効」にしてください');
    }
    const before = db.tasks.length;
    db.tasks = db.tasks.filter((t) => t.id !== id);
    if (db.tasks.length === before) return sendError(res, 404, '業務が見つかりません');
    saveDb();
    sendJson(res, 200, { ok: true });
  },

  /* ---- 日報 ---- */
  'GET /api/entries'(req, res, params, query) {
    let entries = db.entries;
    if (query.get('month')) {
      const month = query.get('month');
      if (!MONTH_RE.test(month)) return sendError(res, 400, '月の形式はYYYY-MMです');
      entries = entries.filter((e) => e.date.startsWith(month + '-'));
    }
    if (query.get('date')) entries = entries.filter((e) => e.date === query.get('date'));
    if (query.get('employeeId')) entries = entries.filter((e) => e.employeeId === Number(query.get('employeeId')));
    sendJson(res, 200, entries);
  },

  /**
   * 1日分の日報をまとめて保存(その技術者・その日の既存データを置き換える)
   * body: { employeeId, date, items: [{ taskId, hours, note }] }
   */
  async 'POST /api/entries/day'(req, res) {
    const body = await readBody(req);
    const employeeId = Number(body.employeeId);
    const date = String(body.date || '');
    const items = Array.isArray(body.items) ? body.items : null;

    if (!db.employees.some((p) => p.id === employeeId)) return sendError(res, 400, '技術者を選択してください');
    if (!isValidDate(date)) return sendError(res, 400, '日付の形式が正しくありません');
    if (!items) return sendError(res, 400, '入力内容がありません');

    const seen = new Set();
    const cleaned = [];
    let total = 0;
    for (const item of items) {
      const taskId = Number(item.taskId);
      const hours = roundHours(Number(item.hours));
      if (!db.tasks.some((t) => t.id === taskId)) return sendError(res, 400, '業務の選択が正しくありません');
      if (seen.has(taskId)) return sendError(res, 400, '同じ業務が2行以上あります。1つの行にまとめてください');
      if (!isValidHours(hours)) return sendError(res, 400, '時間は0より大きく24以下で入力してください');
      seen.add(taskId);
      total += hours;
      cleaned.push({ taskId, hours, note: String(item.note || '').trim() });
    }
    if (total > 24) return sendError(res, 400, `1日の合計が24時間を超えています(${total}時間)`);

    db.entries = db.entries.filter((e) => !(e.employeeId === employeeId && e.date === date));
    for (const c of cleaned) {
      db.entries.push({ id: nextId('entry'), date, employeeId, taskId: c.taskId, hours: c.hours, note: c.note });
    }
    saveDb();
    sendJson(res, 200, { ok: true, saved: cleaned.length });
  },

  /* ---- 集計 ---- */
  'GET /api/summary'(req, res, params, query) {
    const month = query.get('month');
    if (!MONTH_RE.test(month || '')) return sendError(res, 400, '月の形式はYYYY-MMです');
    sendJson(res, 200, buildSummary(month));
  },

  'GET /api/status'(req, res, params, query) {
    const month = query.get('month');
    if (!MONTH_RE.test(month || '')) return sendError(res, 400, '月の形式はYYYY-MMです');
    sendJson(res, 200, buildStatus(month));
  },

  'GET /api/export/summary'(req, res, params, query) {
    const month = query.get('month');
    if (!MONTH_RE.test(month || '')) return sendError(res, 400, '月の形式はYYYY-MMです');
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="soukatsu_${month}.csv"`,
    });
    res.end(summaryCsv(month));
  },

  'GET /api/export/entries'(req, res, params, query) {
    const month = query.get('month');
    if (!MONTH_RE.test(month || '')) return sendError(res, 400, '月の形式はYYYY-MMです');
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="nippou_${month}.csv"`,
    });
    res.end(entriesCsv(month));
  },
};

/* ---------------------------------- ルーティング ---------------------------------- */

const routes = Object.entries(api).map(([key, handler]) => {
  const [method, pattern] = key.split(' ');
  const paramNames = [];
  const regex = new RegExp(
    '^' + pattern.replace(/:[^/]+/g, (m) => {
      paramNames.push(m.slice(1));
      return '([^/]+)';
    }) + '$'
  );
  return { method, regex, paramNames, handler };
});

/* ---------------------------------- 静的ファイル ---------------------------------- */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res, pathname) {
  const rel = pathname === '/' ? 'index.html' : pathname.slice(1);
  const file = path.join(PUBLIC_DIR, rel);
  if (!file.startsWith(PUBLIC_DIR + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

/* ---------------------------------- サーバー ---------------------------------- */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname.startsWith('/api/')) {
    for (const route of routes) {
      if (route.method !== req.method) continue;
      const m = pathname.match(route.regex);
      if (!m) continue;
      const params = {};
      route.paramNames.forEach((name, i) => (params[name] = m[i + 1]));
      try {
        await route.handler(req, res, params, url.searchParams);
      } catch (err) {
        sendError(res, 400, err.message || 'エラーが発生しました');
      }
      return;
    }
    return sendError(res, 404, 'APIが見つかりません');
  }

  serveStatic(req, res, pathname);
});

loadDb();
server.listen(PORT, () => {
  console.log('==============================================');
  console.log(' 業務日報・労務管理アプリ が起動しました');
  console.log(`   このPCから:   http://localhost:${PORT}`);
  console.log('   他のPCから:  http://<このPCのIPアドレス>:' + PORT);
  console.log('   停止するには: Ctrl + C');
  console.log('==============================================');
});
