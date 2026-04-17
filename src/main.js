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
        <button id="exportCurrentBtn" class="btn btn-secondary">导出本轮名单</button>
        <button id="exportBtn" class="btn btn-secondary">导出全部历史</button>
        <button id="exportJsonBtn" class="btn btn-secondary">导出历史JSON</button>
        <button id="importJsonBtn" class="btn btn-secondary">导入历史JSON</button>
        <input id="importJsonInput" type="file" accept="application/json" hidden />
      </div>
    </section>

    <section class="panel result-panel panel-hud">
      <div class="panel-header">
        <h2>本轮中签成员</h2>
        <span class="hint">Draw Result</span>
      </div>
      <p id="resultTip" class="result-tip">执行抽取后，此处将显示本轮中签成员列表。</p>
      <ul id="resultList" class="result-list" aria-live="polite"></ul>
      <div class="history-header">
        <h3>抽奖历史记录</h3>
        <span class="hint">Round History</span>
      </div>
      <ul id="historyList" class="history-list" aria-live="polite"></ul>
    </section>
  </main>
`;

const STORAGE_KEY = "lucky_draw_state_v1";

const state = {
  allEntries: [],
  winners: [],
  drawRounds: [],
  lastRoundWinners: [],
};

const el = {
  input: document.getElementById("nameListInput"),
  saveListBtn: document.getElementById("saveListBtn"),
  clearListBtn: document.getElementById("clearListBtn"),
  drawCount: document.getElementById("drawCount"),
  drawBtn: document.getElementById("drawBtn"),
  resetResultBtn: document.getElementById("resetResultBtn"),
  exportCurrentBtn: document.getElementById("exportCurrentBtn"),
  exportBtn: document.getElementById("exportBtn"),
  exportJsonBtn: document.getElementById("exportJsonBtn"),
  importJsonBtn: document.getElementById("importJsonBtn"),
  importJsonInput: document.getElementById("importJsonInput"),
  resultTip: document.getElementById("resultTip"),
  resultList: document.getElementById("resultList"),
  historyList: document.getElementById("historyList"),
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
  const winnerSet = new Set(state.winners);
  return state.allEntries.filter((name) => !winnerSet.has(name));
}

function getValidDrawCount() {
  const value = Number.parseInt(el.drawCount.value, 10);
  if (!Number.isFinite(value) || value <= 0) return 1;
  return value;
}

function randomPick(pool, count) {
  if (pool.length === 0 || count <= 0) return [];

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

function renderHistoryList() {
  el.historyList.innerHTML = "";

  if (!state.drawRounds.length) {
    const empty = document.createElement("li");
    empty.className = "history-item history-empty";
    empty.textContent = "暂无历史记录，完成抽取后将自动保存到本地。";
    el.historyList.appendChild(empty);
    return;
  }

  const rounds = [...state.drawRounds].reverse();
  rounds.forEach((round) => {
    const li = document.createElement("li");
    li.className = "history-item";
    const winnerText = round.winners.map((name) => escapeHtml(name)).join(" / ");
    li.innerHTML = `
      <div class="history-top">
        <strong>第 ${round.round} 轮</strong>
        <span>${escapeHtml(round.time)}</span>
      </div>
      <div class="history-mid">${winnerText}</div>
      <div class="history-bottom">人数：${round.winners.length}</div>
    `;
    el.historyList.appendChild(li);
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
    drawRounds: state.drawRounds,
    lastRoundWinners: state.lastRoundWinners,
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
    state.drawRounds = Array.isArray(data.drawRounds) ? data.drawRounds : [];
    state.lastRoundWinners = Array.isArray(data.lastRoundWinners) ? data.lastRoundWinners : [];
    el.input.value =
      typeof data.rawInput === "string" ? data.rawInput : state.allEntries.join("\n");
    el.drawCount.value = Number.isFinite(data.drawCount) ? String(data.drawCount) : "1";

    const noRepeatRadio = el.repeatModeRadios.find((r) => r.value === "noRepeat");
    if (noRepeatRadio) noRepeatRadio.checked = true;
  } catch (_error) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function handleSaveList() {
  const list = parseInputList(el.input.value);
  if (!list.length) {
    state.allEntries = [];
    state.winners = [];
    state.lastRoundWinners = [];
    renderStats();
    renderResultList([]);
    saveState();
    showNotice("成员池为空，当前抽取记录已清空，历史记录已保留。");
    return;
  }

  state.allEntries = list;
  const set = new Set(state.allEntries);
  state.winners = state.winners.filter((winner) => set.has(winner));
  renderStats();
  saveState();
  showNotice(`成员池已保存并去重，共 ${list.length} 人。`);
}

function handleClearList() {
  el.input.value = "";
  state.allEntries = [];
  state.winners = [];
  state.lastRoundWinners = [];
  renderStats();
  renderResultList([]);
  saveState();
  showNotice("成员池已清空，历史记录已保留。");
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function handleDraw() {
  if (isDrawing) return;

  const drawCount = getValidDrawCount();
  const pool = getAvailablePool();

  if (!state.allEntries.length) {
    showNotice("请先录入并保存成员池。", true);
    return;
  }

  if (!pool.length) {
    showNotice("当前可抽成员为空，请重置抽取记录后继续。", true);
    return;
  }

  if (drawCount > pool.length) {
    showNotice(`当前最多还能抽 ${pool.length} 人，已按最大值抽取。`);
  }

  isDrawing = true;
  el.drawBtn.disabled = true;
  el.drawBtn.classList.add("is-drawing");
  el.drawBtn.textContent = "抽取执行中...";
  el.resultTip.textContent = "终端演算中，请稍候...";
  await sleep(1200);

  const winners = randomPick(pool, drawCount);
  if (!winners.length) {
    showNotice("本轮未抽取到有效结果。", true);
    isDrawing = false;
    el.drawBtn.disabled = false;
    el.drawBtn.classList.remove("is-drawing");
    el.drawBtn.textContent = "开始补给抽取";
    return;
  }

  state.lastRoundWinners = [...winners];
  state.winners = Array.from(new Set([...state.winners, ...winners]));
  state.drawRounds.push({
    round: state.drawRounds.length + 1,
    winners: [...winners],
    time: new Date().toLocaleString(),
  });
  renderResultList(winners);
  renderHistoryList();
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
  state.lastRoundWinners = [];
  renderStats();
  renderResultList([]);
  saveState();
  showNotice("当前抽取记录已重置，历史记录已保留。");
}

function downloadTextFile(content, fileName) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function handleExportCurrent() {
  if (!state.lastRoundWinners.length) {
    showNotice("暂无本轮结果可导出，请先执行一轮抽取。", true);
    return;
  }

  const roundNo = state.drawRounds.length;
  const lines = [
    "胜利女神工会抽奖终端 / 本轮中签名单导出",
    `公会名称：${TERMINAL_CONFIG.guildName}`,
    `公会 UID：${TERMINAL_CONFIG.guildUid}`,
    `当前活动：${TERMINAL_CONFIG.activityName}`,
    `导出时间：${new Date().toLocaleString()}`,
    `轮次：第 ${roundNo} 轮`,
    `中签人数：${state.lastRoundWinners.length}`,
    "",
    "本轮中签名单：",
    ...state.lastRoundWinners.map((name, idx) => `${idx + 1}. ${name}`),
  ];
  downloadTextFile(lines.join("\n"), `round-${roundNo}-winners-${Date.now()}.txt`);
}

function handleExport() {
  if (!state.drawRounds.length) {
    showNotice("暂无可导出的历史记录。", true);
    return;
  }

  const modeText = "不可重复中签（强制）";
  const lines = [
    "胜利女神工会抽奖终端 / 全部抽奖历史导出",
    `公会名称：${TERMINAL_CONFIG.guildName}`,
    `公会 UID：${TERMINAL_CONFIG.guildUid}`,
    `当前活动：${TERMINAL_CONFIG.activityName}`,
    `导出时间：${new Date().toLocaleString()}`,
    `抽奖模式：${modeText}`,
    `历史轮次数：${state.drawRounds.length}`,
    `累计中签人数（去重）：${state.winners.length}`,
    "",
    "==== 轮次明细 ====",
  ];

  state.drawRounds.forEach((round) => {
    lines.push(`第 ${round.round} 轮 | ${round.time} | ${round.winners.length} 人`);
    round.winners.forEach((name, idx) => {
      lines.push(`  ${idx + 1}. ${name}`);
    });
    lines.push("");
  });

  downloadTextFile(lines.join("\n"), `draw-history-${Date.now()}.txt`);
}

function handleExportHistoryJson() {
  if (!state.drawRounds.length) {
    showNotice("暂无历史记录可导出。", true);
    return;
  }

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    guild: {
      name: TERMINAL_CONFIG.guildName,
      uid: TERMINAL_CONFIG.guildUid,
      activity: TERMINAL_CONFIG.activityName,
    },
    drawRounds: state.drawRounds,
    winners: state.winners,
  };

  downloadTextFile(
    JSON.stringify(payload, null, 2),
    `draw-history-backup-${Date.now()}.json`,
  );
}

function normalizeRounds(rounds) {
  return rounds
    .filter((item) => item && Array.isArray(item.winners))
    .map((item) => ({
      round: 0,
      winners: Array.from(new Set(item.winners.map((v) => String(v).trim()).filter(Boolean))),
      time: typeof item.time === "string" && item.time ? item.time : new Date().toLocaleString(),
    }))
    .filter((item) => item.winners.length > 0);
}

function handleImportHistoryJson(event) {
  const [file] = event.target.files || [];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      const rounds = normalizeRounds(parsed.drawRounds || []);

      if (!rounds.length) {
        showNotice("导入失败：JSON 中未找到有效历史轮次。", true);
        return;
      }

      const merged = [...state.drawRounds, ...rounds].map((item, index) => ({
        round: index + 1,
        winners: item.winners,
        time: item.time,
      }));

      state.drawRounds = merged;
      state.winners = Array.from(new Set(merged.flatMap((item) => item.winners)));
      state.lastRoundWinners = [...merged[merged.length - 1].winners];

      renderStats();
      renderHistoryList();
      renderResultList(state.lastRoundWinners);
      saveState();
      showNotice(`导入成功：新增 ${rounds.length} 轮历史记录。`);
    } catch (_error) {
      showNotice("导入失败：JSON 格式不正确。", true);
    } finally {
      el.importJsonInput.value = "";
    }
  };

  reader.readAsText(file, "utf-8");
}

function bindEvents() {
  el.saveListBtn.addEventListener("click", handleSaveList);
  el.clearListBtn.addEventListener("click", handleClearList);
  el.drawBtn.addEventListener("click", handleDraw);
  el.resetResultBtn.addEventListener("click", handleResetResult);
  el.exportCurrentBtn.addEventListener("click", handleExportCurrent);
  el.exportBtn.addEventListener("click", handleExport);
  el.exportJsonBtn.addEventListener("click", handleExportHistoryJson);
  el.importJsonBtn.addEventListener("click", () => el.importJsonInput.click());
  el.importJsonInput.addEventListener("change", handleImportHistoryJson);

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
      if (radio.value === "allowRepeat" && radio.checked) {
        const noRepeatRadio = el.repeatModeRadios.find((item) => item.value === "noRepeat");
        if (noRepeatRadio) noRepeatRadio.checked = true;
        showNotice("当前版本已强制不可重复中签，已自动切回默认模式。");
      }
      renderStats();
      saveState();
    });
  });
}

function init() {
  loadState();
  renderStats();
  renderResultList([]);
  renderHistoryList();
  bindEvents();
}

init();
