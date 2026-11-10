// ===== 게임 엔진: 데이터(data/*.js)를 읽어 동작합니다. 콘텐츠는 data만 고치면 됩니다. =====
(() => {
const D = window.GAME_DATA, $ = s => document.querySelector(s);
const SND = window.Sound || { play(){}, set(){}, on:true };
const KEY = "wasteland-rpg-save", MAX = 10;
const norm = o => { if(o && !o.unlocked) o.unlocked = {}; return o; };
let S = norm(load()) || fresh();

function fresh(){ return { started:false, unlocked:{}, hp:MAX, san:MAX, inv:[], flags:{}, done:{}, seen:{}, log:[], region:null, over:null }; }
function load(){ try{ return JSON.parse(localStorage.getItem(KEY)); }catch(e){ return null; } }
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
const clamp = v => Math.max(0, Math.min(MAX, v));
const iname = id => D.items[id].name;

function ok(r){
  if(!r) return true;
  if(r.flags && !r.flags.every(f => S.flags[f])) return false;
  if(r.notFlags && r.notFlags.some(f => S.flags[f])) return false;
  if(r.done && !r.done.every(e => S.done[e])) return false;
  if(r.items && !r.items.every(i => S.inv.includes(i))) return false;
  if(r.anyItems && !r.anyItems.some(i => S.inv.includes(i))) return false;
  if(r.san && (S.san < r.san[0] || S.san > r.san[1])) return false;
  return true;
}
function need(r){
  const n = []; if(!r) return "";
  (r.items||[]).forEach(i => n.push(iname(i)));
  (r.flags||[]).forEach(() => n.push("특정 조건"));
  return n.length ? "필요: " + n.join(", ") : "";
}

// ---------- 화면 ----------
let prev = null;
function flash(sel, cls){ const el = $(sel); el.classList.remove("hit","gain"); void el.getBoundingClientRect(); el.classList.add(cls); }
// 정신력이 떨어질수록 눈 위에 늘어나는 낙서(고정 시드)
(function(){
  let r = 7; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647, g = $("#scribbles");
  for(let i=0;i<MAX;i++){
    let d = "M" + (6+rnd()*52).toFixed(1) + " " + (14+rnd()*36).toFixed(1);
    for(let k=0;k<4;k++) d += " L" + (6+rnd()*52).toFixed(1) + " " + (14+rnd()*36).toFixed(1);
    g.insertAdjacentHTML("beforeend", `<path d="${d}" fill="none" stroke="#2b2a27" stroke-width="1.4" stroke-opacity=".75" stroke-linecap="round" style="display:none"/>`);
  }
})();
function stateOf(list, v){ const s = list && list.find(x => v>=x[0] && v<=x[1]); return s ? s[2] : ""; }
function render(){
  const bar = (v,id) => { $(id).innerHTML = Array.from({length:MAX},(_,i)=>`<b class="${i<v?'on':''}"></b>`).join(""); };
  bar(S.hp,"#hp-bar"); bar(S.san,"#san-bar");
  if(prev){
    if(S.hp < prev.hp) flash("#v-hp .ico","hit"); else if(S.hp > prev.hp) flash("#v-hp .ico","gain");
    if(S.san < prev.san) flash("#v-san .ico","hit"); else if(S.san > prev.san) flash("#v-san .ico","gain");
  }
  prev = { hp:S.hp, san:S.san };
  $("#hp-num").innerHTML = `${S.hp}<small>/${MAX}</small>`; $("#san-num").innerHTML = `${S.san}<small>/${MAX}</small>`;
  $("#hp-state").textContent = stateOf(D.hpStates, S.hp); $("#san-state").textContent = stateOf(D.sanStates, S.san);
  // 심장: 피가 차오르는 높이 / 박동 속도
  $("#hp-rect").setAttribute("y", (56 - 46*S.hp/MAX).toFixed(1));
  $("#v-hp .ico").style.setProperty("--beat", (0.5 + S.hp*0.09).toFixed(2) + "s");
  // 눈: 동공 확장 + 낙서 증가
  $("#pupil").setAttribute("r", (4 + (MAX-S.san)*.75).toFixed(1));
  [...$("#scribbles").children].forEach((p,i) => p.style.display = i < MAX-S.san ? "" : "none");
  const st = $("#status").classList;
  st.toggle("hp-crit", S.hp <= 3); st.toggle("hp-dead", S.hp <= 0);
  st.toggle("san-low", S.san <= D.lowSan); st.toggle("san-crit", S.san <= 2);
  $("#fx-hp").classList.toggle("on", S.hp <= 3 && S.hp > 0);
  $("#fx-san").classList.toggle("on", S.san <= D.lowSan);
  $("#fx-san").classList.toggle("crit", S.san <= 2);
  document.body.classList.toggle("low", S.san <= D.lowSan);
  renderMap();
}
const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const ICON = {
  pin:      svg('<path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/>'),
  lock:     svg('<rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  dot:      svg('<circle cx="12" cy="12" r="5"/>'),
  building: svg('<rect x="6" y="3" width="12" height="18"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>'),
  store:    svg('<path d="M4 9l2-5h12l2 5M5 9v11h14V9M9 20v-6h6v6"/>'),
  house:    svg('<path d="M3 12l9-8 9 8M6 10v10h12V10M10 20v-6h4v6"/>'),
  hospital: svg('<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M12 8v8M8 12h8"/>'),
  subway:   svg('<rect x="6" y="3" width="12" height="14" rx="3"/><path d="M6 11h12M9 14h.01M15 14h.01M9 20l-2 2M15 20l2 2"/>')
};
function zoom(reg){
  const img = $("#map-img");
  img.style.backgroundImage = `url(${(reg && reg.map) || D.worldMap})`;
  if(!reg || !reg.zoom){ img.style.transform = "none"; return; }
  const k = reg.zoom, cl = (v,lo,hi) => Math.max(lo, Math.min(hi, v));
  const tx = cl((0.5 - k*reg.x/100)*100, (1-k)*100, 0), ty = cl((0.5 - k*reg.y/100)*100, (1-k)*100, 0);
  img.style.transform = `translate(${tx}%,${ty}%) scale(${k})`;
}
function soon(n){
  S.seen[n.id] = 1; save(); renderMap();
  show(`<h2>${n.name}</h2><p>터널 끝에서 새어 나온 바람에 기름과 쇳내가 섞여 있다. 길은 열렸지만, 이 지역의 탐험은 아직 준비되지 않았다.\n\n(프로토타입은 구도심까지만 플레이할 수 있습니다.)</p><button class="choice" id="x">돌아간다</button>`);
  $("#x").onclick = close;
}
function renderMap(){
  const nodes = $("#nodes"); nodes.innerHTML = "";
  const reg = (S.region && D.places[S.region]) ? D.regions.find(r => r.id===S.region) : null;
  $("#btn-back").hidden = !reg;
  $("#map-title").textContent = reg ? reg.name : "";
  zoom(reg);
  (reg ? D.places[reg.id] : D.regions).forEach(n => {
    const open = n.unlocked || S.unlocked[n.id], locked = !reg && !open;
    const b = document.createElement("button");
    b.className = "node " + (reg ? "place" : "region") + (locked ? " locked" : "") + (S.seen[n.id] ? " seen" : "") + (!reg && S.unlocked[n.id] && !S.seen[n.id] ? " fresh" : "");
    const pl = D.places[n.id];
    const sub = reg ? "" : locked ? "잠김" : (S.unlocked[n.id] && !S.seen[n.id]) ? "새 지역" : pl ? `탐험 ${pl.filter(x => S.seen[x.id]).length}/${pl.length}` : "준비 중";
    b.innerHTML = `<span class="sign"><span class="ic">${locked ? ICON.lock : ICON[n.icon || (reg ? "dot" : "pin")]}</span><span class="lb"><span class="nm">${n.name}</span>${sub ? `<span class="stt">${sub}</span>` : ""}</span></span>`;
    b.style.left = n.x + "%"; b.style.top = n.y + "%";
    b.disabled = locked;
    b.setAttribute("aria-label", locked ? n.name + " (잠김)" : n.name);
    b.onclick = () => reg ? explore(n) : (D.places[n.id] ? (S.seen[n.id] = 1, S.region = n.id, save(), render()) : soon(n));
    nodes.appendChild(b);
  });
}

// ---------- 모달 ----------
let T = null, ADV = null;
function show(html, cls = ""){ $("#sheet").className = cls; $("#sheet").innerHTML = html; $("#modal").hidden = false; }
function close(){ clearInterval(T); ADV = null; $("#modal").hidden = true; }
const esc = t => t.replace(/&/g,"&amp;").replace(/</g,"&lt;");
const pages = t => t.split(/\n\n+/).filter(Boolean);
function artStyle(a){
  const z = a.z || 2.6, ar = D.mapAspect || 1.094, bh = 5/12, cl = v => Math.max(0, Math.min(100, v));
  const px = cl((0.5 - a.x/100*z) / (1 - z) * 100), py = cl((bh/2 - a.y/100*z*ar) / (bh - z*ar) * 100);
  return `background-image:url(${D.worldMap});background-size:${z*100}% auto;background-position:${px}% ${py}%`;
}
function placeOf(id){ for(const k in D.places){ const p = D.places[k].find(x => x.id===id); if(p) return p; } return null; }
function artHTML(e, place){
  const a = (e && e.art) || (place && place.art); if(!a) return "";
  return `<div class="art" style="${artStyle(a)}">${place ? `<span class="cap">${place.name}</span>` : ""}</div>`;
}
// 장면: 위에 그림, 아래에 글. 클릭할 때마다 한 장면씩 넘어가고 마지막에 finish()가 선택지를 붙인다.
function scene({ title, art = "", pgs, finish }){
  clearInterval(T);
  show(`${art}<h2>${title}</h2><div class="story" id="story"><p id="line"></p><span class="more" id="more">▾ 클릭하여 계속</span></div><div id="extra"></div>`, "scene");
  const line = $("#line"), more = $("#more"), extra = $("#extra");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let i = 0, full = false;
  const last = () => i >= pgs.length - 1;
  function done(){ full = true; clearInterval(T); line.innerHTML = esc(pgs[i]); if(last()){ more.style.visibility = "hidden"; finish(extra); } else more.style.visibility = "visible"; }
  function type(){
    full = false; more.style.visibility = "hidden"; const t = pgs[i]; let n = 0;
    if(reduce) return done();
    clearInterval(T);
    T = setInterval(() => { n++; line.innerHTML = esc(t.slice(0,n)) + `<span class="rest">${esc(t.slice(n))}</span>`; if(n >= t.length) done(); }, 24);
  }
  ADV = () => { if(!full) return done(); if(!last()){ i++; SND.play("click"); type(); } };
  $("#story").onclick = ADV;
  type();
}


function chips(r){
  const c = [], sg = v => (v>0 ? "+" : "") + v;
  if(r.hp)  c.push([`체력 ${sg(r.hp)}`, r.hp>0]);
  if(r.san) c.push([`정신력 ${sg(r.san)}`, r.san>0]);
  (r.give||[]).forEach(i => c.push(["획득: "+iname(i), true]));
  (r.take||[]).forEach(i => c.push(["소모: "+iname(i), false]));
  (r.unlock||[]).forEach(id => c.push(["새 지역 해금: "+D.regions.find(x=>x.id===id).name, true]));
  return c.length ? `<div class="chips">${c.map(([t,p])=>`<span class="${p?"pos":""}">${t}</span>`).join("")}</div>` : "";
}
function addLog(t){ S.log.unshift(t); S.log = S.log.slice(0,60); }

// ---------- 탐험 ----------
function pickEvent(placeId){
  const pool = D.events.filter(e => e.place===placeId && !S.done[e.id] && ok(e.req));
  const fixed = pool.find(e => e.type==="fixed" || e.type==="story");
  if(fixed) return fixed;
  const rnd = pool.filter(e => e.type==="random" || e.type==="conditional");
  if(!rnd.length) return null;
  let r = Math.random() * rnd.reduce((s,e)=>s+(e.weight||1),0);
  for(const e of rnd){ r -= (e.weight||1); if(r<=0) return e; }
  return rnd[0];
}
function explore(place){
  S.seen[place.id] = 1;
  const e = pickEvent(place.id), art = artHTML(e, place);
  if(!e){
    const f = D.fillers[Math.floor(Math.random()*D.fillers.length)];
    return scene({ title: place.name, art, pgs: [f], finish: el => {
      el.innerHTML = `<button class="choice" id="ok">돌아간다</button>`; $("#ok").onclick = () => { close(); render(); save(); }; } });
  }
  SND.play("open");
  const t = (S.san <= D.lowSan && e.textLow) ? e.textLow : e.text;
  scene({ title: e.title, art, pgs: pages(t), finish: el => {
    el.innerHTML = e.choices.map((c,i) => {
      const can = ok(c.req);
      return `<button class="choice" data-i="${i}" ${can?"":"disabled"}><b class="no">${i+1}</b><span><span class="t">${c.text}</span>${can?"":`<span class="hint">${need(c.req)}</span>`}</span></button>`;
    }).join("");
    el.querySelectorAll(".choice").forEach(b => b.onclick = () => choose(e, e.choices[+b.dataset.i], art));
  } });
}
function choose(e, c, art){
  S.done[e.id] = 1;
  let r = c.result;
  if(r.t === "__minjae__") r = minjaeResult();
  if(r.hp) S.hp = clamp(S.hp + r.hp);
  if(r.san) S.san = clamp(S.san + r.san);
  (r.take||[]).forEach(i => { const k = S.inv.indexOf(i); if(k>=0) S.inv.splice(k,1); });
  (r.give||[]).forEach(i => S.inv.push(i));
  Object.assign(S.flags, r.set||{});
  (r.unlock||[]).forEach(id => S.unlocked[id] = 1);
  if((r.unlock||[]).length) SND.play("ending"); else if(r.hp < 0) SND.play("hurt"); else if(r.san < 0) SND.play("mind");
  else if(r.hp > 0 || r.san > 0) SND.play("heal"); else if((r.give||[]).length) SND.play("item");
  addLog(`[${e.title}] ${c.text}`);
  save();
  scene({ title: e.title, art, pgs: pages(r.t), finish: el => {
    el.innerHTML = chips(r) + `<button class="choice" id="next">계속</button>`;
    $("#next").onclick = () => afterEvent(r.ending);
  } });
}
function minjaeResult(){
  S.flags.minjae_returned = 1;
  if(S.flags.minjae_helped) return { t:"“이번엔 제가 도울 차례입니다.” 민재가 가방에서 치료제를 꺼내 건넸다. 오랜만에 사람의 온기를 느낀다.", give:["medicine"], san:1 };
  if(S.flags.minjae_cold)   return { t:"민재는 당신을 노려보다 어깨를 부딪치며 지나갔다. 가방이 가벼워진 느낌이다.", hp:-1 };
  return { t:"민재는 경계하며 몇 마디를 나눈 뒤 자리를 떠났다. 서로 아무것도 얻지 못했다." };
}
function afterEvent(ending){
  if(ending) return end(ending);
  if(S.hp <= 0) return end("death");
  if(S.san <= 0) return collapse();
  close(); render();
}
function collapse(){
  S.hp = clamp(S.hp - 2); S.san = 3; addLog("[정신 붕괴] 의식을 잃었다."); save();
  if(S.hp <= 0) return end("death");
  show(`<h2>정신 붕괴</h2><p>귀가 울린다. 벽의 얼룩이 사람 얼굴처럼 보이고, 숨소리가 낯선 곳에서 들려온다.\n\n정신을 차렸을 때는 한참이 지나 있었다. 무릎이 까져 있다.</p><div class="chips"><span>체력 -2</span><span>정신력 3으로 회복</span></div><button class="choice" id="ok">일어난다</button>`);
  $("#ok").onclick = () => { close(); render(); };
}
function end(id){
  S.over = id; save(); render(); SND.play("ending");
  const e = D.endings[id];
  scene({ title: e.title, pgs: pages(e.text), finish: el => {
    el.innerHTML = `<button class="choice" id="again">처음부터 다시 시작</button>`; $("#again").onclick = restart; } });
}
function restart(){ S = fresh(); save(); close(); showTitle(); }

// ---------- 가방 / 기록 ----------
$("#btn-inv").onclick = () => {
  const rows = S.inv.length ? S.inv.map((id,i) => { const it = D.items[id];
    return `<div class="inv-row"><div>${it.name}<small>${it.desc}</small></div>${it.use?`<button data-i="${i}">사용</button>`:""}</div>`; }).join("") : "<p>가방이 비어 있다.</p>";
  show(`<h2>가방</h2>${rows}<br><button class="choice" id="x">닫기</button>`);
  $("#x").onclick = close;
  document.querySelectorAll(".inv-row button").forEach(b => b.onclick = () => {
    const id = S.inv[+b.dataset.i], u = D.items[id].use;
    if(u.hp) S.hp = clamp(S.hp+u.hp); if(u.san) S.san = clamp(S.san+u.san);
    S.inv.splice(+b.dataset.i,1); addLog(`${iname(id)} 사용`); save(); render(); $("#btn-inv").onclick();
  });
};
function showSettings(){
  show(`<h2>설정</h2><div class="inv-row"><div>사운드<small>효과음을 켜거나 끕니다.</small></div><button id="s-sound" aria-pressed="${SND.on}">${SND.on ? "켜짐" : "꺼짐"}</button></div><br><button class="choice" id="x">닫기</button>`);
  $("#x").onclick = close;
  $("#s-sound").onclick = () => { SND.set(!SND.on); showSettings(); };
}
$("#btn-settings").onclick = showSettings;
$("#t-settings").onclick = showSettings;
document.addEventListener("click", e => { if(e.target.closest("button:not(:disabled)")) SND.play("click"); });
$("#btn-log").onclick = () => {
  show(`<h2>기록</h2>${S.log.length ? S.log.map(l=>`<div class="log-row">${l}</div>`).join("") : "<p>아직 기록이 없다.</p>"}<br><button class="choice" id="x">닫기</button>`);
  $("#x").onclick = close;
};
$("#btn-back").onclick = () => { S.region = null; save(); render(); };

// ---------- 타이틀 ----------
function showTitle(){
  const sv = load();
  $("#t-continue").hidden = !(sv && sv.started && !sv.over);
  $("#title").classList.remove("hide");
}
function enter(){ $("#title").classList.add("hide"); render(); }
$("#t-start").onclick = () => {
  const sv = load();
  if(sv && sv.started && !sv.over && !confirm("저장된 진행 상황이 지워집니다. 새로 시작할까요?")) return;
  S = fresh(); S.started = true; save(); enter();
};
$("#t-continue").onclick = () => { S = norm(load()) || fresh(); enter(); };
$("#btn-title").onclick = () => { save(); showTitle(); };

document.addEventListener("keydown", e => {
  if(!$("#modal").hidden && ADV && (e.key === " " || e.key === "Enter") && !e.target.closest("button")){ e.preventDefault(); ADV(); return; }
  if($("#modal").hidden || e.ctrlKey || e.metaKey || e.altKey || !/^[1-9]$/.test(e.key)) return;
  const b = document.querySelectorAll("#sheet .choice[data-i]")[+e.key - 1];
  if(b && !b.disabled) b.click();
});

// 텍스트 복사·선택·드래그·우클릭 방지 (브라우저 기능 차단일 뿐 완전한 보호는 아님)
["copy","cut","contextmenu","selectstart","dragstart"].forEach(t => document.addEventListener(t, e => e.preventDefault()));

render();
showTitle();
window.__wastelandLoaded = true;
})();
