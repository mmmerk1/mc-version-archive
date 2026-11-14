const $ = (id) => document.getElementById(id);

const state = {
  versions: window.MC_VERSIONS || [],
  netease: window.MC_NETEASE || null,
  q: "",
  type: "all",
  major: "all",
  dir: "desc",
  mirror: "123云盘",
  shown: 120
};

const MAJOR_RE = /^(1\.26|26)\..*/;
const WIKI = (v) => "https://zh.minecraft.wiki/index.php?search=" + encodeURIComponent("基岩版 " + v);

function majorOf(a) {
  if (/^0\./.test(a)) return "0.x";
  if (/^1\.26\./.test(a) || /^26\./.test(a)) return "26.x";
  const m = a.match(/^1\.(\d+)\./);
  return m ? "1." + m[1] : "其他";
}

function fmtSize(s) {
  if (!s) return "—";
  return s.replace("/", " / ");
}

function pickLink(item) {
  const m = item.l[mState()] || item.l["123云盘"] || item.l["OneDrive"] || item.l["夸克网盘"];
  return m || ["", ""];
}
function mState() { return state.mirror; }

function initStats() {
  const all = state.versions;
  $("stTotal").textContent = all.length;
  $("stStable").textContent = all.filter((v) => !v.b).length;
  $("stBeta").textContent = all.filter((v) => v.b).length;
  const dated = all.filter((v) => v.d);
  const sorted = [...dated].sort((a, b) => a.d.localeCompare(b.d));
  $("stRange").textContent = (sorted[0] ? sorted[0].v : "—") + " → " + (sorted[sorted.length - 1] ? sorted[sorted.length - 1].v : "—");
}

function buildMajors() {
  const counts = {};
  state.versions.forEach((v) => { const k = majorOf(v.a); counts[k] = (counts[k] || 0) + 1; });
  const order = Object.keys(counts).sort((a, b) => {
    const na = a === "26.x" ? 99 : a === "0.x" ? -1 : parseFloat(a.slice(2));
    const nb = b === "26.x" ? 99 : b === "0.x" ? -1 : parseFloat(b.slice(2));
    return nb - na;
  });
  const wrap = $("majorChips");
  wrap.innerHTML = `<button class="chip on" data-mj="all">全部系列</button>` +
    order.map((k) => `<button class="chip" data-mj="${k}">${k}<sup>${counts[k]}</sup></button>`).join("");
  wrap.addEventListener("click", (e) => {
    const b = e.target.closest("[data-mj]");
    if (!b) return;
    wrap.querySelectorAll(".chip").forEach((c) => c.classList.remove("on"));
    b.classList.add("on");
    state.major = b.dataset.mj;
    state.shown = 120;
    render();
  });
}

function filtered() {
  const q = state.q.trim().toLowerCase();
  let out = state.versions.filter((v) => {
    if (state.type !== "all" && String(v.b) !== state.type) return false;
    if (state.major !== "all" && majorOf(v.a) !== state.major) return false;
    if (q && !(v.v.toLowerCase().includes(q) || v.a.toLowerCase().includes(q))) return false;
    return true;
  });
  out.sort((a, b) => state.dir === "desc" ? b.d.localeCompare(a.d) || b.a.length - a.a.length : a.d.localeCompare(b.d) || a.a.length - b.a.length);
  return out;
}

function cardHtml(v) {
  const [v7, v8] = pickLink(v);
  const badge = v.b ? `<span class="badge bt">测试版</span>` : `<span class="badge st">正式版</span>`;
  const b8 = v8 ? `<a class="dl" href="${v8}" target="_blank" rel="noopener">ARMv8</a>` : "";
  return `<div class="card${v.b ? " beta" : ""}">
    <div class="c-top"><span class="c-v">${v.v}</span>${badge}</div>
    <div class="c-meta"><span>${v.d || "日期未知"}</span><span>${fmtSize(v.s)}</span><span>${v.a}</span></div>
    <div class="c-acts">
      <a class="dl${v7 ? "" : " off"}" href="${v7}" target="_blank" rel="noopener">ARMv7</a>
      ${b8}
      <a class="wiki" href="${WIKI(v.v)}" target="_blank" rel="noopener" title="在中文维基查这个版本">维基</a>
    </div>
  </div>`;
}

function render() {
  const rows = filtered();
  const slice = rows.slice(0, state.shown);
  $("list").innerHTML = slice.map(cardHtml).join("");
  $("empty").hidden = rows.length !== 0;
  $("more").hidden = rows.length <= state.shown;
  $("more").textContent = `再加载 ${Math.min(120, rows.length - state.shown)} 个（剩 ${rows.length - state.shown}）`;
}

function bind() {
  $("q").addEventListener("input", (e) => { state.q = e.target.value; state.shown = 120; render(); });
  $("typeChips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-t]");
    if (!b) return;
    $("typeChips").querySelectorAll(".chip").forEach((c) => c.classList.remove("on"));
    b.classList.add("on");
    state.type = b.dataset.t;
    state.shown = 120;
    render();
  });
  $("mirrorChips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-m]");
    if (!b) return;
    $("mirrorChips").querySelectorAll(".chip").forEach((c) => c.classList.remove("on"));
    b.classList.add("on");
    state.mirror = b.dataset.m;
    render();
  });
  $("sort").addEventListener("click", () => {
    state.dir = state.dir === "desc" ? "asc" : "desc";
    $("sort").textContent = state.dir === "desc" ? "最新在前 ↓" : "最早在前 ↑";
    state.shown = 120;
    render();
  });
  $("more").addEventListener("click", () => { state.shown += 120; render(); });

  $("tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    $("tabs").querySelectorAll(".tab").forEach((t) => t.classList.remove("on"));
    b.classList.add("on");
    ["intl", "netease", "wiki"].forEach((k) => { $("view-" + k).hidden = k !== b.dataset.tab; });
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function renderNetease() {
  const d = state.netease;
  if (!d) return;
  $("neTime").textContent = d.time || "—";
  const cards = [];
  cards.push(`<div class="ncard"><div class="k">手游版 · 官服</div><div class="v">${d.mobile.version}</div>
    <div class="t">补丁 ${d.mobile.patch || "—"}</div>
    <a href="${d.mobile.url}" target="_blank" rel="noopener">官方包直链</a></div>`);
  cards.push(`<div class="ncard"><div class="k">iOS · 官服</div><div class="v">${d.ios.version}</div>
    <div class="t">App Store 版本</div>
    <a href="${d.ios.url.replace("itms-apps://", "https://")}" target="_blank" rel="noopener">打开 App Store</a></div>`);
  cards.push(`<div class="ncard"><div class="k">端游 · ${d.pc.name}</div><div class="v">${d.pc.legacy_version}</div>
    <div class="t">补丁 ${d.pc.patch || "—"}</div>
    <a href="${d.pc.url}" target="_blank" rel="noopener">官方安装包</a></div>`);
  cards.push(`<div class="ncard"><div class="k">官网入口</div><div class="v">mc.163.com</div>
    <div class="t">最新包与公告的源头</div>
    <a href="https://mc.163.com/" target="_blank" rel="noopener">打开官网</a></div>`);
  $("neNow").innerHTML = cards.join("");
  $("neTimeline").innerHTML = (d.timeline || []).map((t) => `
    <div class="tl"><div class="tv">${t.v}</div><div class="td">${t.d}</div>
      <div class="tn">${t.note}</div><div class="ts">来源：${t.src}</div></div>`).join("");
}

async function checkBackend() {
  try {
    const r = await fetch("api/health", { cache: "no-store" });
    if (!r.ok) throw new Error("no");
    const j = await r.json();
    if (!j.ok) throw new Error("no");
    $("engine").classList.add("ok");
    $("engine").innerHTML = "<i></i>后端在线";
    const vr = await fetch("api/versions", { cache: "no-store" });
    if (vr.ok) {
      const vj = await vr.json();
      if (Array.isArray(vj.versions) && vj.versions.length > state.versions.length) {
        state.versions = vj.versions;
        initStats(); buildMajors(); render();
      }
    }
  } catch (e) {
    $("engine").innerHTML = "<i></i>静态数据";
  }
}

initStats();
buildMajors();
bind();
render();
renderNetease();
checkBackend();
