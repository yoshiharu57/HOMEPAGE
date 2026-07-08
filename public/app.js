/* 業務日報・労務管理アプリ フロントエンド */
'use strict';

/* ==================== 共通ユーティリティ ==================== */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let employees = [];
let tasks = [];

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function thisMonthStr() {
  return todayStr().slice(0, 7);
}

function shiftMonth(month, diff) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + diff, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtHours(h) {
  return Number.isInteger(h) ? String(h) : String(Math.round(h * 100) / 100);
}

function taskLabel(t) {
  return t.code ? `[${t.code}] ${t.name}` : t.name;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let toastTimer;
function toast(msg, isError) {
  const el = $('#toast');
  el.textContent = msg;
  el.className = 'show' + (isError ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.className = ''), 3000);
}

async function apiFetch(url, options) {
  const res = await fetch(url, options);
  let data = null;
  try { data = await res.json(); } catch { /* CSVなど */ }
  if (!res.ok) throw new Error((data && data.error) || `通信エラー (${res.status})`);
  return data;
}

const api = {
  get: (url) => apiFetch(url),
  post: (url, body) => apiFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  put: (url, body) => apiFetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  del: (url) => apiFetch(url, { method: 'DELETE' }),
};

async function reloadMasters() {
  [employees, tasks] = await Promise.all([api.get('/api/employees'), api.get('/api/tasks')]);
}

/* ==================== タブ切り替え ==================== */

$$('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('.tab').forEach((b) => b.classList.remove('active'));
    $$('.panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    $('#tab-' + btn.dataset.tab).classList.add('active');
    refreshTab(btn.dataset.tab);
  });
});

function refreshTab(tab) {
  if (tab === 'entry') renderEntryTab();
  if (tab === 'summary') renderSummary();
  if (tab === 'bytask') renderByTask();
  if (tab === 'status') renderStatus();
  if (tab === 'master') renderMaster();
}

/* ==================== 日報入力 ==================== */

function activeEmployees() { return employees.filter((p) => p.active); }
function activeTasks() { return tasks.filter((t) => t.active); }

function renderEmployeeSelect() {
  const sel = $('#entry-employee');
  const prev = sel.value;
  sel.innerHTML = '<option value="">-- 選択してください --</option>' +
    activeEmployees().map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
  if (prev) sel.value = prev;
}

function taskOptionsHtml(selectedId) {
  return '<option value="">-- 業務を選択 --</option>' +
    activeTasks().map((t) => `<option value="${t.id}" ${t.id === selectedId ? 'selected' : ''}>${escapeHtml(taskLabel(t))}</option>`).join('');
}

function addEntryRow(taskId, hours, note) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><select class="row-task">${taskOptionsHtml(taskId)}</select></td>
    <td><input type="number" class="row-hours" min="0.25" max="24" step="0.25" value="${hours != null ? fmtHours(hours) : ''}" placeholder="例: 2.5"></td>
    <td><input type="text" class="row-note" value="${note != null ? escapeHtml(note) : ''}" placeholder="(任意)"></td>
    <td class="center"><button class="row-del" title="行を削除">✕</button></td>`;
  tr.querySelector('.row-del').addEventListener('click', () => { tr.remove(); updateEntryTotal(); });
  tr.querySelector('.row-hours').addEventListener('input', updateEntryTotal);
  $('#entry-rows').appendChild(tr);
}

function updateEntryTotal() {
  let total = 0;
  $$('#entry-rows .row-hours').forEach((inp) => { total += Number(inp.value) || 0; });
  $('#entry-total').textContent = fmtHours(total);
}

/** 選択中の技術者・日付の既存日報をフォームに読み込む */
async function loadDayIntoForm() {
  const employeeId = Number($('#entry-employee').value);
  const date = $('#entry-date').value;
  $('#entry-rows').innerHTML = '';
  if (employeeId && date) {
    const entries = await api.get(`/api/entries?date=${date}&employeeId=${employeeId}`);
    for (const e of entries) addEntryRow(e.taskId, e.hours, e.note);
  }
  if (!$('#entry-rows').children.length) {
    addEntryRow(); addEntryRow(); addEntryRow();
  }
  updateEntryTotal();
  renderHistory();
}

async function saveDay() {
  const employeeId = Number($('#entry-employee').value);
  const date = $('#entry-date').value;
  if (!employeeId) return toast('技術者を選択してください', true);
  if (!date) return toast('日付を入力してください', true);

  const items = [];
  for (const tr of $$('#entry-rows tr')) {
    const taskId = Number(tr.querySelector('.row-task').value);
    const hours = Number(tr.querySelector('.row-hours').value);
    const note = tr.querySelector('.row-note').value;
    if (!taskId && !hours) continue; // 空行は無視
    if (!taskId) return toast('業務が選択されていない行があります', true);
    if (!hours) return toast('時間が入力されていない行があります', true);
    items.push({ taskId, hours, note });
  }

  try {
    await api.post('/api/entries/day', { employeeId, date, items });
    toast(items.length ? `${date} の日報を保存しました(${items.length}件)` : `${date} の日報を削除しました`);
    loadDayIntoForm();
  } catch (err) {
    toast(err.message, true);
  }
}

/** 今月の入力履歴(選択中の技術者) */
async function renderHistory() {
  const employeeId = Number($('#entry-employee').value);
  const box = $('#entry-history');
  const emp = employees.find((p) => p.id === employeeId);
  $('#history-emp-name').textContent = emp ? `― ${emp.name}` : '';
  if (!employeeId) {
    box.innerHTML = '<div class="empty">技術者を選択すると今月の入力履歴が表示されます</div>';
    return;
  }
  const month = ($('#entry-date').value || todayStr()).slice(0, 7);
  const entries = await api.get(`/api/entries?month=${month}&employeeId=${employeeId}`);
  if (!entries.length) {
    box.innerHTML = `<div class="empty">${month} の入力はまだありません</div>`;
    return;
  }
  const taskMap = new Map(tasks.map((t) => [t.id, taskLabel(t)]));
  const byDate = {};
  for (const e of entries) (byDate[e.date] = byDate[e.date] || []).push(e);
  const dates = Object.keys(byDate).sort().reverse();

  box.innerHTML = dates.map((date) => {
    const list = byDate[date];
    const total = list.reduce((s, e) => s + e.hours, 0);
    const d = new Date(date + 'T00:00:00');
    const rows = list.map((e) => `
      <tr>
        <td>${escapeHtml(taskMap.get(e.taskId) || '(削除済み業務)')}</td>
        <td class="num">${fmtHours(e.hours)}</td>
        <td>${escapeHtml(e.note || '')}</td>
      </tr>`).join('');
    return `
      <details class="history-day">
        <summary><span>${date} (${WEEKDAYS[d.getDay()]})</span><span>${fmtHours(total)} 時間</span></summary>
        <table><tbody>${rows}</tbody></table>
      </details>`;
  }).join('');
}

async function renderEntryTab() {
  await reloadMasters();
  renderEmployeeSelect();
  if (!$('#entry-date').value) $('#entry-date').value = todayStr();
  loadDayIntoForm();
}

$('#entry-employee').addEventListener('change', loadDayIntoForm);
$('#entry-date').addEventListener('change', loadDayIntoForm);
$('#btn-add-row').addEventListener('click', () => addEntryRow());
$('#btn-save-day').addEventListener('click', saveDay);
$('#btn-today').addEventListener('click', () => { $('#entry-date').value = todayStr(); loadDayIntoForm(); });
$('#btn-yesterday').addEventListener('click', () => {
  const d = new Date(); d.setDate(d.getDate() - 1);
  $('#entry-date').value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  loadDayIntoForm();
});

/* ==================== 月次総括表 ==================== */

async function renderSummary() {
  const month = $('#summary-month').value || thisMonthStr();
  $('#summary-month').value = month;
  $('#btn-csv-summary').href = `/api/export/summary?month=${month}`;
  $('#btn-csv-entries').href = `/api/export/entries?month=${month}`;

  const s = await api.get(`/api/summary?month=${month}`);
  const box = $('#summary-table');

  if (!s.employees.length || !s.tasks.length) {
    box.innerHTML = '<div class="empty">データがありません。マスタ管理で技術者と業務を登録し、日報を入力してください。</div>';
    return;
  }

  let html = '<table class="summary-table"><thead><tr><th>技術者</th>';
  for (const t of s.tasks) html += `<th class="rotate">${escapeHtml(taskLabel(t))}</th>`;
  html += '<th class="total-col">合計</th><th class="total-col">入力日数</th></tr></thead><tbody>';

  for (const p of s.employees) {
    html += `<tr><td>${escapeHtml(p.name)}${p.active ? '' : ' <span class="muted">(無効)</span>'}</td>`;
    for (const t of s.tasks) {
      const h = (s.matrix[p.id] && s.matrix[p.id][t.id]) || 0;
      html += `<td class="num ${h ? '' : 'zero'}">${h ? fmtHours(h) : '-'}</td>`;
    }
    html += `<td class="num total-col">${fmtHours(s.empTotals[p.id] || 0)}</td>`;
    html += `<td class="num total-col">${s.empDays[p.id] || 0}</td></tr>`;
  }

  html += '<tr class="total-row"><td>業務別合計</td>';
  for (const t of s.tasks) html += `<td class="num">${fmtHours(s.taskTotals[t.id] || 0)}</td>`;
  html += `<td class="num">${fmtHours(s.grandTotal)}</td><td></td></tr>`;
  html += '</tbody></table>';
  box.innerHTML = html;
}

$('#summary-month').addEventListener('change', renderSummary);
$('#summary-prev').addEventListener('click', () => { $('#summary-month').value = shiftMonth($('#summary-month').value, -1); renderSummary(); });
$('#summary-next').addEventListener('click', () => { $('#summary-month').value = shiftMonth($('#summary-month').value, 1); renderSummary(); });

/* ==================== 業務別集計 ==================== */

async function renderByTask() {
  const month = $('#bytask-month').value || thisMonthStr();
  $('#bytask-month').value = month;

  const s = await api.get(`/api/summary?month=${month}`);
  const box = $('#bytask-table');

  const rows = s.tasks
    .map((t) => ({ task: t, hours: s.taskTotals[t.id] || 0 }))
    .filter((r) => r.hours > 0)
    .sort((a, b) => b.hours - a.hours);

  if (!rows.length) {
    box.innerHTML = '<div class="empty">この月の実績はありません</div>';
    return;
  }

  const max = rows[0].hours;
  let html = '<table><thead><tr><th>業務</th><th class="num">合計時間</th><th class="num">割合</th><th class="bar-cell"></th></tr></thead><tbody>';
  for (const r of rows) {
    const pct = s.grandTotal ? Math.round((r.hours / s.grandTotal) * 1000) / 10 : 0;
    html += `<tr>
      <td>${escapeHtml(taskLabel(r.task))}</td>
      <td class="num">${fmtHours(r.hours)}</td>
      <td class="num">${pct}%</td>
      <td class="bar-cell"><span class="bar" style="width:${Math.max(2, (r.hours / max) * 100)}%"></span></td>
    </tr>`;
  }
  html += `<tr class="bold"><td>全体合計</td><td class="num">${fmtHours(s.grandTotal)}</td><td class="num">100%</td><td></td></tr>`;
  html += '</tbody></table>';
  box.innerHTML = html;
}

$('#bytask-month').addEventListener('change', renderByTask);
$('#bytask-prev').addEventListener('click', () => { $('#bytask-month').value = shiftMonth($('#bytask-month').value, -1); renderByTask(); });
$('#bytask-next').addEventListener('click', () => { $('#bytask-month').value = shiftMonth($('#bytask-month').value, 1); renderByTask(); });

/* ==================== 入力状況 ==================== */

async function renderStatus() {
  const month = $('#status-month').value || thisMonthStr();
  $('#status-month').value = month;

  const s = await api.get(`/api/status?month=${month}`);
  const box = $('#status-table');

  if (!s.employees.length) {
    box.innerHTML = '<div class="empty">技術者が登録されていません</div>';
    return;
  }

  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const today = todayStr();

  let html = '<table class="status-table"><thead><tr><th class="name-col">技術者</th>';
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(y, m - 1, d).getDay();
    const cls = dow === 0 ? 'sun' : dow === 6 ? 'sat' : '';
    html += `<th class="${cls}">${d}<br>${WEEKDAYS[dow]}</th>`;
  }
  html += '<th>入力<br>日数</th></tr></thead><tbody>';

  for (const p of s.employees) {
    const dayMap = s.byEmpDate[p.id] || {};
    let count = 0;
    html += `<tr><td class="name-col">${escapeHtml(p.name)}</td>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${month}-${String(d).padStart(2, '0')}`;
      const dow = new Date(y, m - 1, d).getDay();
      const hours = dayMap[date];
      if (hours) count++;
      const isPastWeekday = dow >= 1 && dow <= 5 && date <= today;
      const cls = hours ? 'filled' : isPastWeekday ? 'missing-weekday' : '';
      html += `<td class="${cls}">${hours ? fmtHours(hours) : ''}</td>`;
    }
    html += `<td class="num bold">${count}</td></tr>`;
  }
  html += '</tbody></table>';
  box.innerHTML = html;
}

$('#status-month').addEventListener('change', renderStatus);
$('#status-prev').addEventListener('click', () => { $('#status-month').value = shiftMonth($('#status-month').value, -1); renderStatus(); });
$('#status-next').addEventListener('click', () => { $('#status-month').value = shiftMonth($('#status-month').value, 1); renderStatus(); });

/* ==================== マスタ管理 ==================== */

async function renderMaster() {
  await reloadMasters();

  const empBody = $('#employee-table tbody');
  empBody.innerHTML = employees.map((p) => `
    <tr class="${p.active ? '' : 'inactive'}">
      <td>${escapeHtml(p.name)}</td>
      <td><span class="badge ${p.active ? '' : 'off'}">${p.active ? '有効' : '無効'}</span></td>
      <td>
        <button class="btn small" data-act="rename-emp" data-id="${p.id}">名前変更</button>
        <button class="btn small" data-act="toggle-emp" data-id="${p.id}">${p.active ? '無効にする' : '有効に戻す'}</button>
        <button class="btn small danger-text" data-act="del-emp" data-id="${p.id}">削除</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="3" class="muted">まだ登録がありません</td></tr>';

  const taskBody = $('#task-table tbody');
  taskBody.innerHTML = tasks.map((t) => `
    <tr class="${t.active ? '' : 'inactive'}">
      <td>${escapeHtml(t.code || '')}</td>
      <td>${escapeHtml(t.name)}</td>
      <td><span class="badge ${t.active ? '' : 'off'}">${t.active ? '有効' : '無効'}</span></td>
      <td>
        <button class="btn small" data-act="rename-task" data-id="${t.id}">名前変更</button>
        <button class="btn small" data-act="toggle-task" data-id="${t.id}">${t.active ? '無効にする' : '有効に戻す'}</button>
        <button class="btn small danger-text" data-act="del-task" data-id="${t.id}">削除</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="4" class="muted">まだ登録がありません</td></tr>';
}

$('#form-employee').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api.post('/api/employees', { name: $('#new-employee-name').value });
    $('#new-employee-name').value = '';
    toast('技術者を追加しました');
    renderMaster();
  } catch (err) { toast(err.message, true); }
});

$('#form-task').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api.post('/api/tasks', { code: $('#new-task-code').value, name: $('#new-task-name').value });
    $('#new-task-code').value = '';
    $('#new-task-name').value = '';
    toast('業務を追加しました');
    renderMaster();
  } catch (err) { toast(err.message, true); }
});

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const act = btn.dataset.act;
  try {
    if (act === 'rename-emp') {
      const emp = employees.find((p) => p.id === id);
      const name = prompt('新しい氏名を入力してください', emp.name);
      if (name == null) return;
      await api.put(`/api/employees/${id}`, { name });
    } else if (act === 'toggle-emp') {
      const emp = employees.find((p) => p.id === id);
      await api.put(`/api/employees/${id}`, { active: !emp.active });
    } else if (act === 'del-emp') {
      const emp = employees.find((p) => p.id === id);
      if (!confirm(`「${emp.name}」を削除しますか?\n(日報の実績がある場合は削除できません)`)) return;
      await api.del(`/api/employees/${id}`);
    } else if (act === 'rename-task') {
      const task = tasks.find((t) => t.id === id);
      const name = prompt('新しい業務名を入力してください', task.name);
      if (name == null) return;
      const code = prompt('業務番号(空欄可)', task.code || '');
      if (code == null) return;
      await api.put(`/api/tasks/${id}`, { name, code });
    } else if (act === 'toggle-task') {
      const task = tasks.find((t) => t.id === id);
      await api.put(`/api/tasks/${id}`, { active: !task.active });
    } else if (act === 'del-task') {
      const task = tasks.find((t) => t.id === id);
      if (!confirm(`「${task.name}」を削除しますか?\n(日報の実績がある場合は削除できません)`)) return;
      await api.del(`/api/tasks/${id}`);
    } else {
      return;
    }
    renderMaster();
  } catch (err) {
    toast(err.message, true);
  }
});

/* ==================== 初期表示 ==================== */

renderEntryTab();
