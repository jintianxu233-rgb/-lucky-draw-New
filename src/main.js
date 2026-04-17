import "./style.css";

const app = document.querySelector("#app");

const TERMINAL_CONFIG = {
  guildName: "胜利女神",
  guildUid: "228",
  activityName: "日常补给抽取",
  mode: "工会活动抽奖",
};

app.innerHTML = `
  <div class="bg-overlay"></div>
  <div class="bg-grid"></div>
  <div class="scanline"></div>

  <main class="container">
    <header class="hero panel panel-hud">
      <div class="hero-topline">
        <div>
          <h1>胜利女神工会抽奖终端</h1>
          <p class="hero-en">Guild Lucky Draw Terminal</p>
        </div>
        <div class="status-tags">
          <span class="tag">GUILD EVENT</span>
          <span class="tag">SUPPLY DRAW</span>
          <span class="tag">TERMINAL READY</span>
        </div>
      </div>
      <div class="hero-meta">
        <span>工会名称：${TERMINAL_CONFIG.guildName}</span>
        <span>工会 UID：${TERMINAL_CONFIG.guildUid}</span>
        <span class="status-online">系统状态：SYSTEM ONLINE</span>
      </div>
      <p class="hero-tip">指挥系统已连接，等待执行本轮成员抽取</p>
    </header>

    <section class="panel info-panel panel-hud">
      <div class="panel-header">
        <h2>工会信息面板</h2>
        <span class="hint">Guild Data</span>
      </div>
      <div class="info-grid">
        <div class="info-row"><span>公会名称</span><strong>${TERMINAL_CONFIG.guildName}</strong></div>
        <div class="info-row"><span>UID</span><strong>${TERMINAL_CONFIG.guildUid}</strong></div>
        <div class="info-row"><span>模式</span><strong>${TERMINAL_CONFIG.mode}</strong></div>
        <div class="info-row"><span>状态</span><strong class="status-online">ONLINE</strong></div>
        <div class="info-row info-activity"><span>当前活动</span><strong>${TERMINAL_CONFIG.activityName}</strong></div>
      </div>
    </section>

    <section class="panel input-panel panel-hud">
      <div class="panel-header">
        <h2>候选成员池</h2>
        <span class="hint">每行录入一名成员，可填写昵称 / UID / 自定义编号</span>
      </div>
      <textarea
        id="nameListInput"
        placeholder="示例：&#10;Commander_A01&#10;228-119&#10;昵称-白夜&#10;..."
        aria-label="名单输入框"
      ></textarea>
      <div class="row">
        <button id="saveListBtn" class="btn btn-primary">保存成员池并去重</button>
        <button id="clearListBtn" class="btn btn-secondary">清空成员池</button>
      </div>
    </section>

    <section class="panel control-panel panel-hud">
      <div class="panel-header">
        <h2>抽取参数设置</h2>
        <span class="hint">Supply Draw Parameters</span>
      </div>

      <div class="stats" id="statsBox">
        <div class="stat-item">
          <span class="label">成员总数</span>
          <strong id="totalCount">0</strong>
        </div>
        <div class="stat-item">
          <span class="label">当前可抽数</span>
          <strong id="availableCount">0</strong>
        </div>
        <div class="stat-item">
          <span class="label">已中签数</span>
          <strong id="winnerCount">0</strong>
        </div>
      </div>

      <div class="row wrap">
        <label for="drawCount">本轮抽取人数</label>
        <input
          id="drawCount"
          type="number"
          min="1"
          step="1"
          value="1"
          aria-label="抽取人数"
        />
        <div class="quick-counts" role="group" aria-label="快速选择抽取人数">
          <button class="btn btn-ghost quick-count-btn" data-count="1">1人</button>
          <button class="btn btn-ghost quick-count-btn" data-count="3">3人</button>
          <button class="btn btn-ghost quick-count-btn" data-count="5">5人</button>
        </div>
      </div>

      <div class="row wrap">
        <label class="switch-item">
          <input type="radio" name="repeatMode" value="noRepeat" checked />
          <span>不可重复中签（默认）</span>
        </label>
        <label class="switch-item">
          <input type="radio" name="repeatMode" value="allowRepeat" />
          <span>允许重复中签</span>
        </label>
      </div>

      <div class="row">
        <button id="drawBtn" class="btn btn-primary btn-draw">开始补给抽取</button>
        <button id="resetResultBtn" class="btn btn-secondary">重置抽取记录</button>
        <button id="exportBtn" class="btn btn-secondary">导出中签名单</button>
      </div>
    </section>

    <section class="panel result-panel panel-hud">
      <div class="panel-header">
        <h2>本轮中签成员</h2>
        <span class="hint">Draw Result</span>
      </div>
      <p id="resultTip" class="result-tip">执行抽取后，此处将显示本轮中签成员列表。</p>
      <ul id="resultList" class="result-list" aria-live="polite"></ul>
    </section>
  </main>
`;

const STORAGE_KEY = "lucky_draw_state_v1";

const state = {
  allEntries: [],
  winners: [],
};

const el = {
  input: document.getElementById("nameListInput"),
  saveListBtn: document.getElementById("saveListBtn"),
  clearListBtn: document.getElementById("clearListBtn"),
  drawCount: document.getElementById("drawCount"),
  drawBtn: document.getElementById("drawBtn"),
  resetResultBtn: document.getElementById("resetResultBtn"),
  exportBtn: document.getElementById("exportBtn"),
  resultTip: document.getElementById("resultTip"),
  resultList: document.getElementById("resultList"),
  totalCount: document.getElementById("totalCount"),
  availableCount: document.getElementById("availableCount"),
  winnerCount: document.getElementById("winnerCount"),
  quickCountBtns: Array.from(document.querySelectorAll(".quick-count-btn")),
  repeatModeRadios: Array.from(document.querySelectorAll("input[name='repeatMode']")),
};

let isDrawing = false;

function getRepeatMode() {
  const selected = el.repeatModeRadios.find((radio) => radio.checked);
  return selected ? selected.value : "noRepeat";
}

function parseInputList(rawText) {
  const rows = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return Array.from(new Set(rows));
}

function getAvailablePool() {
  if (getRepeatMode() === "allowRepeat") return [...state.allEntries];
  const winnerSet = new Set(state.winners);
  return state.allEntries.filter((name) => !winnerSet.has(name));
}

function getValidDrawCount() {
  const value = Number.parseInt(el.drawCount.value, 10);
  if (!Number.isFinite(value) || value <= 0) return 1;
  return value;
}

function randomPick(pool, count, allowRepeat) {
  if (pool.length === 0 || count <= 0) return [];

  if (allowRepeat) {
    const picks = [];
    for (let i = 0; i < count; i += 1) {
      const idx = Math.floor(Math.random() * pool.length);
      picks.push(pool[idx]);
    }
    return picks;
  }

  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

function renderStats() {
  const available = getAvailablePool().length;
  el.totalCount.textContent = String(state.allEntries.length);
  el.availableCount.textContent = String(available);
  el.winnerCount.textContent = String(state.winners.length);
}

function renderResultList(items) {
  el.resultList.innerHTML = "";
  if (!items.length) {
    el.resultTip.textContent = "执行抽取后，此处将显示本轮中签成员列表。";
    return;
  }

  el.resultTip.textContent = `结果确认：本轮已锁定 ${items.length} 位中签成员`;
  items.forEach((winner, index) => {
    const li = document.createElement("li");
    li.className = "winner-item";
    li.innerHTML = `
      <div class="idx">No.${String(index + 1).padStart(2, "0")}</div>
      <div class="name">${escapeHtml(winner)}</div>
      <span class="winner-badge">SELECTED</span>
    `;
    el.resultList.appendChild(li);
  });
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showNotice(message, isError = false) {
  const existing = document.querySelector(".notice");
  if (existing) existing.remove();

  const note = document.createElement("div");
  note.className = `notice${isError ? " error" : ""}`;
  note.textContent = message;
  document.querySelector(".result-panel").appendChild(note);
  window.setTimeout(() => {
    note.remove();
  }, 2600);
}

function saveState() {
  const payload = {
    allEntries: state.allEntries,
    winners: state.winners,
    drawCount: getValidDrawCount(),
    repeatMode: getRepeatMode(),
    rawInput: el.input.value,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);

    state.allEntries = Array.isArray(data.allEntries) ? data.allEntries : [];
    state.winners = Array.isArray(data.winners) ? data.winners : [];
    el.input.value =
      typeof data.rawInput === "string" ? data.rawInput : state.allEntries.join("\n");
    el.drawCount.value = Number.isFinite(data.drawCount) ? String(data.drawCount) : "1";

    if (data.repeatMode === "allowRepeat") {
      const allowRepeatRadio = el.repeatModeRadios.find((r) => r.value === "allowRepeat");
      if (allowRepeatRadio) allowRepeatRadio.checked = true;
    }
  } catch (_error) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function handleSaveList() {
  const list = parseInputList(el.input.value);
  if (!list.length) {
    state.allEntries = [];
    state.winners = [];
    renderStats();
    renderResultList([]);
    saveState();
    showNotice("成员池为空，已清空历史数据。");
    return;
  }

  state.allEntries = list;
  if (getRepeatMode() === "noRepeat") {
    const set = new Set(state.allEntries);
    state.winners = state.winners.filter((winner) => set.has(winner));
  }
  renderStats();
  saveState();
  showNotice(`成员池已保存并去重，共 ${list.length} 人。`);
}

function handleClearList() {
  el.input.value = "";
  state.allEntries = [];
  state.winners = [];
  renderStats();
  renderResultList([]);
  saveState();
  showNotice("成员池已清空。");
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function handleDraw() {
  if (isDrawing) return;

  const drawCount = getValidDrawCount();
  const allowRepeat = getRepeatMode() === "allowRepeat";
  const pool = getAvailablePool();

  if (!state.allEntries.length) {
    showNotice("请先录入并保存成员池。", true);
    return;
  }

  if (!pool.length) {
    showNotice("当前可抽成员为空，请重置记录或切换允许重复中签。", true);
    return;
  }

  if (!allowRepeat && drawCount > pool.length) {
    showNotice(`当前最多还能抽 ${pool.length} 人，已按最大值抽取。`);
  }

  isDrawing = true;
  el.drawBtn.disabled = true;
  el.drawBtn.classList.add("is-drawing");
  el.drawBtn.textContent = "抽取执行中...";
  el.resultTip.textContent = "终端演算中，请稍候...";
  await sleep(1200);

  const winners = randomPick(pool, drawCount, allowRepeat);
  if (!winners.length) {
    showNotice("本轮未抽取到有效结果。", true);
    isDrawing = false;
    el.drawBtn.disabled = false;
    el.drawBtn.classList.remove("is-drawing");
    el.drawBtn.textContent = "开始补给抽取";
    return;
  }

  state.winners = [...state.winners, ...winners];
  renderResultList(winners);
  renderStats();
  saveState();
  showNotice("终端提示：锁定完成，结果已确认。");

  isDrawing = false;
  el.drawBtn.disabled = false;
  el.drawBtn.classList.remove("is-drawing");
  el.drawBtn.textContent = "开始补给抽取";
}

function handleResetResult() {
  state.winners = [];
  renderStats();
  renderResultList([]);
  saveState();
  showNotice("抽取记录已重置。");
}

function handleExport() {
  if (!state.winners.length) {
    showNotice("暂无可导出的中签名单。", true);
    return;
  }

  const modeText = getRepeatMode() === "allowRepeat" ? "允许重复中签" : "不可重复中签";
  const lines = [
    "胜利女神工会抽奖终端 / 中签名单导出",
    `公会名称：${TERMINAL_CONFIG.guildName}`,
    `公会 UID：${TERMINAL_CONFIG.guildUid}`,
    `当前活动：${TERMINAL_CONFIG.activityName}`,
    `导出时间：${new Date().toLocaleString()}`,
    `抽奖模式：${modeText}`,
    `中签总条目：${state.winners.length}`,
    "",
    "中签名单：",
    ...state.winners.map((name, idx) => `${idx + 1}. ${name}`),
  ];
  const content = lines.join("\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `lucky-draw-winners-${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function bindEvents() {
  el.saveListBtn.addEventListener("click", handleSaveList);
  el.clearListBtn.addEventListener("click", handleClearList);
  el.drawBtn.addEventListener("click", handleDraw);
  el.resetResultBtn.addEventListener("click", handleResetResult);
  el.exportBtn.addEventListener("click", handleExport);

  el.drawCount.addEventListener("change", () => {
    const count = getValidDrawCount();
    el.drawCount.value = String(count);
    saveState();
  });

  el.quickCountBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const count = Number.parseInt(btn.dataset.count, 10);
      if (Number.isFinite(count) && count > 0) {
        el.drawCount.value = String(count);
        saveState();
      }
    });
  });

  el.repeatModeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      renderStats();
      saveState();
    });
  });
}

function init() {
  loadState();
  renderStats();
  renderResultList([]);
  bindEvents();
}

init();
