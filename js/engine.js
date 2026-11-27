// ===== 게임 엔진: 데이터(data/*.js)를 읽어 동작합니다. 콘텐츠는 data만 고치면 됩니다. =====
(() => {
const D = window.GAME_DATA, $ = s => document.querySelector(s);
const SND = window.Sound || { play(){}, set(){}, on:true };
const KEY = "wasteland-rpg-save", MAX = 10;
const ACT = D.actMax || 5;
const norm = o => {
  if(!o) return o;
  if(!o.unlocked) o.unlocked = {};
  if(o.day == null){ o.day = 1; o.act = ACT; if(o.started && !(o.flags||{}).intro){ o.flags = o.flags || {}; o.flags.intro = 1; } }  // 이전 버전 세이브 호환
  if(o.act == null) o.act = ACT;
  if(!o.view) o.view = "bunker";
  if(!o.pity) o.pity = {};
  return o;
};
let S = norm(load()) || fresh();

function fresh(){ return { started:false, unlocked:{}, hp:MAX, san:MAX, inv:[], flags:{}, done:{}, seen:{}, log:[], region:null, over:null, day:1, act:ACT, view:"bunker", pity:{} }; }
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
  if(r.day && (S.day < r.day[0] || S.day > r.day[1])) return false;
  return true;
}
function need(r){
  const n = []; if(!r) return "";
  (r.items||[]).forEach(i => n.push(iname(i)));
  (r.flags||[]).forEach(f => n.push((D.flagHints && D.flagHints[f]) || "특정 조건"));
  if(r.san) n.push(`정신력 ${r.san[0]}~${r.san[1]}일 때`);
  return n.length ? "필요: " + n.join(", ") : "";
}

// ---------- 화면 ----------
let prev = null, prevDay = 0, animating = false;
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
  { const g = [...S.inv].reverse().map(i => D.items[i]).find(it => it && it.clue && it.hint), el = $("#bk-goal");
    if(el) el.innerHTML = S.flags.intro ? `<small>${g ? "다음 단서" : "목표"}</small>${esc(g ? g.hint.replace(/^다음 단서 → /, "") : "밖으로 나가 단서를 찾자.")}` : ""; }
  const bar = (v,id) => { $(id).innerHTML = Array.from({length:MAX},(_,i)=>`<b class="${i<v?'on':''}"></b>`).join(""); };
  bar(S.hp,"#hp-bar"); bar(S.san,"#san-bar");
  if(prev){
    if(S.hp < prev.hp) flash("#v-hp .ico","hit"); else if(S.hp > prev.hp) flash("#v-hp .ico","gain");
    if(S.san < prev.san) flash("#v-san .ico","hit"); else if(S.san > prev.san) flash("#v-san .ico","gain");
  }
  prev = { hp:S.hp, san:S.san };
  $("#hp-num").innerHTML = `${S.hp}<small>/${MAX}</small>`; $("#san-num").innerHTML = `${S.san}<small>/${MAX}</small>`;
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
  // 일차
  const dn = $("#day-no");
  if(dn.textContent !== String(S.day)){ dn.textContent = S.day; if(prevDay && prevDay !== S.day){ const t = $("#daytag"); t.classList.remove("pop"); void t.offsetWidth; t.classList.add("pop"); } }
  prevDay = S.day;
  // 활동력: 등불이 작아지고 칸이 줄어든다
  $("#act-bar").innerHTML = Array.from({length:ACT},(_,i)=>`<b class="${i<S.act?'on':''}"></b>`).join("");
  $("#act-num").innerHTML = `${S.act}<small>/${ACT}</small>`;
  const fl = $("#flame"), k = S.act / ACT;
  fl.style.transform = `translateY(${((1-k)*8).toFixed(1)}px) scale(${(0.55 + 0.45*k).toFixed(2)})`; fl.style.transformOrigin = "32px 46px"; fl.style.opacity = S.act > 0 ? 1 : 0;
  $("#v-act").classList.toggle("low", S.act <= 1);
  applyView();
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
  bunker:   svg('<rect x="4" y="10" width="16" height="10"/><path d="M8 10V7h8v3M12 13v4M9.500 15h5"/>'),
  factory:  svg('<path d="M3 21V11l5 3V11l5 3V7h4v14zM17 7V3M8 17h1M12 17h1M16 17h1"/>'),
  dock:     svg('<path d="M4 21h16M7 21V8h10M7 8l-3 3M17 8v6M15 14h4"/>'),
  bolt:     svg('<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>'),
  office:   svg('<path d="M4 7h16v13H4zM9 7V4h6v3M4 12h16"/>'),
  trash:    svg('<path d="M5 7h14M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>'),
  anchor:   svg('<circle cx="12" cy="5" r="2"/><path d="M12 7v14M7 12H5a7 7 0 0 0 14 0h-2M8 11h8"/>'),
  lighthouse: svg('<path d="M9 21l1-12h4l1 12zM10 9l2-5 2 5M7 21h10M3 6l4 2M21 6l-4 2"/>'),
  village:  svg('<path d="M2 14l10-9 10 9M5 12v8h14v-8M9 20v-4h6v4"/>'),
  island:   svg('<path d="M3 19c3-2 5 2 9 0s6 2 9 0M12 17V8M12 8c-3-3-6-2-7 0M12 8c3-3 6-2 7 0"/>'),
  antenna:  svg('<circle cx="12" cy="11" r="2"/><path d="M12 13v8M8 21h8M7 6a7 7 0 0 0 0 10M17 6a7 7 0 0 1 0 10"/>'),
  apartment:svg('<path d="M5 21V4h9v17M14 9h5v12M8 8h3M8 12h3M8 16h3M16 13h1M16 17h1"/>'),
  cart:     svg('<path d="M3 4h3l2 12h10l2-8H7M10 20h.01M17 20h.01"/>'),
  gate:     svg('<path d="M4 20V5M4 8h16v4H4M8 8l4 4M14 8l4 4"/>'),
  tower:    svg('<path d="M10 21l1-14h2l1 14M8 21h8M12 7V3M9 5l3-2 3 2M9 14h6"/>'),
  cabin:    svg('<path d="M3 12l9-8 9 8M5 10v10h14V10M8 20v-6h3v6M14 13h3v3h-3z"/>'),
  cablecar: svg('<path d="M3 4l18 4M12 6v4M7 10h10v7H7zM10 13h4"/>'),
  peak:     svg('<path d="M2 20l7-13 4 7 3-4 6 10zM9 7l2 3"/>'),
  dome:     svg('<path d="M4 20h16M5 20a7 7 0 0 1 14 0M12 8V4M12 12l5-4M9 20v-4h6v4"/>'),
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
  $("#btn-back").hidden = false; $("#btn-back").textContent = reg ? "← 뒤로" : "← 벙커";
  $("#map-title").textContent = reg ? reg.name : "";
  zoom(reg);
  (reg ? D.places[reg.id] : D.regions).forEach(n => {
    const open = n.unlocked || S.unlocked[n.id], locked = !reg && !open;
    const b = document.createElement("button");
    b.className = "node " + (reg ? "place" : "region") + (locked ? " locked" : "") + (S.seen[n.id] ? " seen" : "") + (!reg && S.unlocked[n.id] && !S.seen[n.id] ? " fresh" : "");
    const pl = D.places[n.id];
    const sub = reg ? "" : locked ? "잠김" : (S.unlocked[n.id] && !S.seen[n.id]) ? "새 지역" : pl ? "" : "준비 중";
    b.innerHTML = `<span class="sign"><span class="ic">${locked ? ICON.lock : ICON[n.icon || (reg ? "dot" : "pin")]}</span><span class="lb"><span class="nm">${n.name}</span>${sub ? `<span class="stt">${sub}</span>` : ""}</span></span>`;
    b.style.left = Math.min(88, Math.max(12, n.x)) + "%"; b.style.top = Math.min(90, Math.max(8, n.y)) + "%";
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
function artStyle(a, img){
  const z = a.z || 2.6, ar = D.mapAspect || 1.094, bh = 5/12, cl = v => Math.max(0, Math.min(100, v));
  const px = cl((0.5 - a.x/100*z) / (1 - z) * 100), py = cl((bh/2 - a.y/100*z*ar) / (bh - z*ar) * 100);
  // img가 있으면 그 이미지를 위에 깔고, 파일이 없거나 못 불러오면 지도 확대 그림이 대신 보입니다.
  if(img) return `background-image:url(${img}),url(${D.worldMap});background-size:cover,${z*100}% auto;background-position:center,${px}% ${py}%;background-repeat:no-repeat`;
  return `background-image:url(${D.worldMap});background-size:${z*100}% auto;background-position:${px}% ${py}%`;
}
function placeOf(id){ for(const k in D.places){ const p = D.places[k].find(x => x.id===id); if(p) return p; } return null; }
function artHTML(e, place){
  const a = (e && e.art) || (place && place.art) || { x:50, y:50, z:2.6 }, img = (e && e.img) || (place && place.img);
  if(!img && !(e && e.art) && !(place && place.art)) return "";
  return `<div class="art" style="${artStyle(a, img)}">${place ? `<span class="cap">${place.name}</span>` : ""}</div>`;
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


function chips(r, extra){
  const c = [], sg = v => (v>0 ? "+" : "") + v;
  if(r.hp)  c.push([`체력 ${sg(r.hp)}`, r.hp>0]);
  if(r.san) c.push([`정신력 ${sg(r.san)}`, r.san>0]);
  (r.give||[]).forEach(i => c.push([(D.items[i].clue ? "단서 획득: " : "획득: ")+iname(i), true]));
  (r.take||[]).forEach(i => c.push(["소모: "+iname(i), false]));
  (r.unlock||[]).forEach(id => c.push(["새 지역 해금: "+D.regions.find(x=>x.id===id).name, true]));
  (extra||[]).forEach(x => c.push(x));
  return c.length ? `<div class="chips">${c.map(([t,p])=>`<span class="${p?"pos":""}">${t}</span>`).join("")}</div>` : "";
}
function addLog(t){ S.log.unshift(t); S.log = S.log.slice(0,60); }

// ---------- 탐험 ----------
function regionOf(placeId){ for(const k in D.places){ if(D.places[k].some(p => p.id===placeId)) return k; } return null; }
// 이벤트 뽑기: ① 스토리 이벤트는 조건을 만족하면 일정 확률(chance)로만 ② 아주 낮은 확률로 "아무것도 없음" ③ 나머지는 가중치로 (직전에 본 이벤트는 피함)
function pickEvent(placeId){
  const pool = D.events.filter(e => e.place===placeId && (e.repeat || !S.done[e.id]) && ok(e.req));
  const stories = pool.filter(e => e.type==="story" || e.type==="fixed");
  const pity = Math.min((S.pity[placeId] || 0) * (D.pityStep || 0.1), D.pityMax || 0.35);   // 줄거리를 못 만난 횟수만큼 확률 보정
  for(const e of stories){
    if(e.type==="fixed" || Math.random() < Math.min(0.95, (e.chance == null ? 0.35 : e.chance) + pity)){ S.pity[placeId] = 0; return e; }
  }
  if(stories.length) S.pity[placeId] = (S.pity[placeId] || 0) + 1;
  if(Math.random() < (D.fillerChance || 0)) return null;
  let rnd = pool.filter(e => e.type==="random" || e.type==="conditional");
  if(!rnd.length) return null;
  const alt = rnd.filter(e => e.id !== S.lastEvent); if(alt.length) rnd = alt;
  let r = Math.random() * rnd.reduce((s,e)=>s+(e.weight||1),0);
  for(const e of rnd){ r -= (e.weight||1); if(r<=0) return e; }
  return rnd[0];
}
function bunkerArt(){
  const img = D.bunker && D.bunker.sceneImg;
  return `<div class="art bunker-art" style="${img ? `background-image:url(${img}),linear-gradient(#2a2925,#1a1917);background-size:cover,cover;background-position:center` : ""}"><span class="cap">벙커</span></div>`;
}
// ---------- 벙커 / 화면 전환 ----------
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
function applyView(){
  if(animating) return;
  $("#bunker").hidden = S.view !== "bunker"; $("#map").hidden = S.view !== "map";
}
function setView(v, animate){
  if(S.view === v){ applyView(); return; }
  if(v === "bunker") S.region = null;
  if(!animate || REDUCE){ S.view = v; save(); render(); return; }
  const b = $("#bunker"), m = $("#map"), st = $("#stage");
  animating = true; st.classList.add("busy"); SND.play("open");
  S.view = v; save(); renderMap();
  const from = v === "map" ? b : m, to = v === "map" ? m : b;
  to.hidden = false; from.hidden = false;
  to.classList.add(v === "map" ? "reveal" : "fade-in"); from.classList.add(v === "map" ? "push" : "pull");
  setTimeout(() => {
    from.hidden = true; ["reveal","fade-in","push","pull"].forEach(c => { b.classList.remove(c); m.classList.remove(c); });
    animating = false; st.classList.remove("busy"); render();
  }, 950);
}
let lastSlp = "";
function pickText(norm, lowHp, lowSan){
  let pool = norm;
  if(S.hp <= 4 && lowHp && lowHp.length && Math.random() < 0.6) pool = lowHp;
  else if(S.san <= 4 && lowSan && lowSan.length && Math.random() < 0.6) pool = lowSan;
  const alt = pool.filter(x => x !== lastSlp); pool = alt.length ? alt : pool;
  return lastSlp = pool[Math.floor(Math.random()*pool.length)];
}
function confirmSleep(){
  const t = pickText(D.sleepPrompts, D.sleepPromptsLowHp, D.sleepPromptsLowSan);
  show(`<h2>잠들기</h2><p>${t.replace(/\n/g,"<br>")}</p><button class="choice" data-i="0" id="sl"><b class="no">1</b><span class="t">잠든다</span></button><button class="choice" data-i="1" id="no"><b class="no">2</b><span class="t">아직 잠들지 않는다</span></button>`);
  $("#sl").onclick = () => sleep(bunkerArt()); $("#no").onclick = close;
}
$("#bk-go").onclick = () => setView("map", true);
$("#bk-sleep").onclick = confirmSleep;
$("#bk-inv").onclick = () => $("#btn-inv").click();
$("#bk-log").onclick = () => $("#btn-log").click();
function showIntro(){
  const items = (D.start && D.start.items) || [];
  scene({ title: "WASTELAND", art: bunkerArt(), pgs: pages(D.intro), finish: el => {
    el.innerHTML = `<div class="chips">${items.map(i => `<span class="pos">획득: ${iname(i)}</span>`).join("")}<span class="pos">활동력 ${ACT}</span></div><button class="choice" id="ok">눈을 뜬다</button>`;
    $("#ok").onclick = () => { items.forEach(i => S.inv.push(i)); S.flags.intro = 1; S.act = ACT; addLog("벙커에서 눈을 떴다. 1일차."); SND.play("item"); save(); close(); render(); };
  } });
}
function sleep(art){
  const r = D.sleep || {};
  S.day++; S.act = ACT;
  if(r.hp) S.hp = clamp(S.hp + r.hp); if(r.san) S.san = clamp(S.san + r.san);
  addLog(`${S.day}일차 아침`); SND.play("heal"); save(); render();
  const t = pickText(D.mornings, D.morningsLowHp, D.morningsLowSan), extra = D.dayLines && D.dayLines[S.day];
  scene({ title: `${S.day}일차`, art, pgs: extra ? [t, extra] : [t], finish: el => {
    el.innerHTML = `<div class="chips">${r.hp ? `<span class="pos">체력 +${r.hp}</span>` : ""}${r.san ? `<span class="pos">정신력 +${r.san}</span>` : ""}<span class="pos">활동력 ${ACT}</span></div><button class="choice" id="ok">일어난다</button>`;
    $("#ok").onclick = close;
  } });
}
function explore(place){
  if(S.act <= 0){
    return scene({ title: place.name, art: artHTML(null, place), pgs: ["몸이 무겁다. 더 돌아다니면 쓰러질 것이다.\n\n벙커로 돌아가 쉬어야 한다."], finish: el => {
      el.innerHTML = `<button class="choice" id="ok">돌아간다</button>`; $("#ok").onclick = close; } });
  }
  S.act--; render();
  S.seen[place.id] = 1;
  const e = pickEvent(place.id), art = artHTML(e, place);
  if(!e){
    const fl = ((D.fillersBy && D.fillersBy[regionOf(place.id)]) || []).concat(D.fillers), f = fl[Math.floor(Math.random()*fl.length)];
    return scene({ title: place.name, art, pgs: [f], finish: el => {
      el.innerHTML = `<button class="choice" id="ok">돌아간다</button>`; $("#ok").onclick = () => { close(); render(); save(); }; } });
  }
  S.lastEvent = e.id; save();
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
  let r = c.result;
  if(r.roll){   // 확률로 결과 하나 고르기
    let t = Math.random() * r.roll.reduce((a,x) => a + x[0], 0);
    r = (r.roll.find(x => (t -= x[0]) <= 0) || r.roll[r.roll.length-1])[1];
  }
  if(!e.repeat && !r.again) S.done[e.id] = 1;
  if(r.t === "__minjae__") r = minjaeResult();
  if(Array.isArray(r.t)) r = Object.assign({}, r, { t: r.t[Math.floor(Math.random() * r.t.length)] });   // 문구 여러 개 중 하나
  let newClue = null;   // 줄거리가 쥐여 주는 단서: 이미 가졌으면 지급도 안내문도 없다
  if(r.clue && !S.inv.includes(r.clue)){ newClue = r.clue; r = Object.assign({}, r, { give: (r.give||[]).concat(r.clue), t: r.t + `\n\n알아낸 것을 쪽지로 정리해 가방에 넣었다. (가방 → ${D.items[r.clue].name})` }); }
  if(r.hp) S.hp = clamp(S.hp + r.hp);
  if(r.san) S.san = clamp(S.san + r.san);
  (r.take||[]).forEach(i => { const k = S.inv.indexOf(i); if(k>=0) S.inv.splice(k,1); });
  r = Object.assign({}, r, { give: (r.give||[]).filter(i => !(D.items[i].clue && S.inv.includes(i))) });   // 단서는 한 번만 얻는다
  r.give.forEach(i => S.inv.push(i));
  const amb = ambient(e, r);
  Object.assign(S.flags, r.set||{});
  (r.unlock||[]).forEach(id => S.unlocked[id] = 1);
  if((r.unlock||[]).length) SND.play("ending"); else if(r.hp < 0) SND.play("hurt"); else if(r.san < 0) SND.play("mind");
  else if(r.hp > 0 || r.san > 0) SND.play("heal"); else if((r.give||[]).length) SND.play("item");
  addLog(`[${e.title}] ${c.text}`);
  save();
  scene({ title: e.title, art, pgs: pages(r.t), finish: el => {
    el.innerHTML = chips(r, amb) + `<button class="choice" id="next">계속</button>`;
    $("#next").onclick = () => afterEvent(r.ending);
  } });
}
// 후반 지역의 환경 피해: world.js 의 ambient 설정대로 탐험 때마다 확률적으로 체력·정신력이 깎인다.
function ambient(e, r){
  const a = D.ambient && D.ambient[regionOf(e.place)], out = [];
  if(!a || e.type === "story" || r.safe || r.ending || (r.unlock||[]).length) return out;
  [["hp","체력"],["san","정신력"]].forEach(([k,nm]) => {
    const x = a[k]; if(!x || Math.random() >= x.p) return;
    S[k] = clamp(S[k] - x.n); out.push([`${x.why} ${nm} -${x.n}`, false]);
  });
  if(out.length) addLog(`[${e.title}] ${out.map(o => o[0]).join(", ")}`);
  return out;
}
function minjaeResult(){
  S.flags.minjae_returned = 1;
  if(S.flags.minjae_helped) return { t:"“이번엔 제가 도울 차례입니다.” 민재가 가방에서 치료제를 꺼내 건넸다. 오랜만에 사람의 온기를 느낀다.", give:["medicine"], san:1 };
  if(S.flags.minjae_cold)   return { t:"민재는 당신을 노려보다 어깨를 부딪치며 지나갔다. 가방이 가벼워진 느낌이다.", hp:-1 };
  return { t:"민재는 경계하며 몇 마디를 나눈 뒤 자리를 떠났다. 서로 아무것도 얻지 못했다." };
}
function deathId(){ const k = "death_" + (S.region || "old"); return D.endings[k] ? k : "death"; }
function afterEvent(ending){
  if(ending) return end(ending);
  if(S.hp <= 0) return end(deathId());
  if(S.san <= 0) return collapse();
  close(); render();
}
function collapse(){
  S.hp = clamp(S.hp - 2); S.san = 3; addLog("[정신 붕괴] 의식을 잃었다."); save();
  if(S.hp <= 0) return end(deathId());
  show(`<h2>정신 붕괴</h2><p>귀가 울린다. 벽의 얼룩이 사람 얼굴처럼 보이고, 숨소리가 낯선 곳에서 들려온다.\n\n정신을 차렸을 때는 한참이 지나 있었다. 무릎이 까져 있다.</p><div class="chips"><span>체력 -2</span><span>정신력 3으로 회복</span></div><button class="choice" id="ok">일어난다</button>`);
  $("#ok").onclick = () => { close(); render(); };
}
function endingsSeen(){ try{ return JSON.parse(localStorage.getItem("wasteland-endings")) || []; }catch(e){ return []; } }
function end(id){
  S.over = id; save(); render(); close(); SND.play("ending");   // 열려 있던 이벤트 창을 닫고 엔딩 전용 화면으로 넘어간다
  const e = D.endings[id] || D.endings.death, seen = endingsSeen(), isNew = !seen.includes(id);
  if(isNew){ seen.push(id); try{ localStorage.setItem("wasteland-endings", JSON.stringify(seen)); }catch(_){} }
  // 엔딩 기록: 처음 본 일차와 본 횟수를 남긴다.
  const meta = endingMeta(), m = meta[id] || (meta[id] = { n:0, day:S.day });
  m.n++; try{ localStorage.setItem("wasteland-endings-meta", JSON.stringify(meta)); }catch(_){}
  endScreen(id, isNew, seen.length);
}
function restart(){ const el = $("#ending"); if(el) el.remove(); S = fresh(); save(); close(); showTitle(); }

// ---------- 엔딩 연출: 전용 화면(이미지 + 본문 + 후일담 + 기록) ----------
const pad2 = n => String(n).padStart(2, "0");
function endArt(id, e, W = innerWidth, H = innerHeight){
  const [r, pid] = e.place || ["old", "building"], p = (D.places[r] || []).find(x => x.id === pid) || {}, w = p.art || { x:50, y:50 };
  // 화면 비율에 맞춰 지도를 확대해, 장소가 한가운데 오도록 자른다. assets/endings/<id>.jpg 가 있으면 그 이미지를 위에 깐다.
  const z = Math.max(2.6, H / W / (D.mapAspect || 1.094) * 1.15 + 1.2), ar = D.mapAspect || 1.094, cl = v => Math.max(0, Math.min(100, v));
  const px = cl((0.5 - w.x/100*z) / (1 - z) * 100), imgH = z * W * ar, py = cl((H/2 - w.y/100*imgH) / (H - imgH) * 100);
  const own = (D.endingImages || []).includes(id);   // 전용 이미지를 올린 엔딩만 요청한다 (없는 파일을 요청해 404 가 나지 않도록)
  return `background-image:${own ? `url(assets/endings/${id}.jpg),` : ""}url(${D.worldMap});background-size:${own ? "cover," : ""}${z*100}% auto;background-position:${own ? "center," : ""}${px}% ${py}%;background-repeat:no-repeat`;
}
const paras = t => pages(t).map(x => `<p>${esc(x).replace(/\n/g,"<br>")}</p>`).join("");
function endScreen(id, isNew, got){
  const e = D.endings[id] || D.endings.death; id = D.endings[id] ? id : "death";
  const ids = Object.keys(D.endings), total = ids.length, no = ids.indexOf(id) + 1, old = $("#ending"); if(old) old.remove();
  const el = document.createElement("div"); el.id = "ending"; el.className = "tone-" + (e.tone || "quiet");
  el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", e.title); el.tabIndex = -1;
  el.innerHTML = `<div class="e-img" style="${endArt(id, e)}"></div><div class="e-shade"></div><div class="e-bar t"></div><div class="e-bar b"></div>
  <div class="e-scroll"><div class="e-body">
    <div class="e-kicker">${e.dead ? "THE END" : "ENDING"} · ${pad2(no)} / ${pad2(total)}${isNew ? `<b>NEW</b>` : ""}</div>
    <h1>${e.title}</h1><div class="e-rule"></div>
    <div class="e-text">${paras(e.text)}</div>
    ${e.epilogue ? `<div class="e-sep">후일담</div><div class="e-epi">${paras(e.epilogue)}</div>` : ""}
    <div class="e-stats"><div><small>도달</small><b>${S.day}일차</b></div><div><small>체력</small><b>${S.hp}</b></div><div><small>정신력</small><b>${S.san}</b></div><div><small>수집한 엔딩</small><b>${got} / ${total}</b></div></div>
    <div class="e-actions"><button id="e-copy">결과 복사</button><button id="e-rec">엔딩 기록</button><button id="e-again" class="main">처음부터 다시 시작</button></div>
    <small id="e-msg" role="status"></small>
  </div></div><div class="e-skip">화면을 누르거나 Enter 로 건너뛰기</div>`;
  document.body.appendChild(el);
  // 한 줄씩 나타나게 하되, 전체 연출은 8초 안쪽으로 끝낸다.
  const seq = [...el.querySelectorAll(".e-kicker, h1, .e-rule, .e-text p, .e-sep, .e-epi p, .e-stats, .e-actions")], step = Math.min(1.1, 7 / seq.length);
  seq.forEach((n, k) => { n.classList.add("e-seq"); n.style.setProperty("--d", (k * step + .5) + "s"); });
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finish = () => { el.classList.add("skip", "done"); const b = $("#e-again"); if(b && document.activeElement === el) b.focus({ preventScroll:true }); };
  if(reduce) finish(); else setTimeout(() => el.classList.add("done"), (seq.length * step + 1.8) * 1000);
  el.addEventListener("click", ev => { if(!ev.target.closest("button")) finish(); });
  el.addEventListener("keydown", ev => { if(ev.key === "Enter" || ev.key === " " || ev.key === "Escape"){ if(!el.classList.contains("skip")){ ev.preventDefault(); finish(); } } });
  el.focus({ preventScroll:true });
  $("#e-again").onclick = restart;
  $("#e-rec").onclick = () => showEndings(true);
  $("#e-copy").onclick = async () => {
    const t = `WASTELAND · ${S.day}일차 · 「${e.title}」 엔딩 (${got}/${total})\n${location.href.split("#")[0]}`;
    try{ await navigator.clipboard.writeText(t); $("#e-msg").textContent = "결과를 복사했다. 어디든 붙여 넣어 공유하자."; }
    catch(_){ $("#e-msg").textContent = t.replace(/\n/g, "  "); }
  };
}
function endingMeta(){ try{ return JSON.parse(localStorage.getItem("wasteland-endings-meta")) || {}; }catch(e){ return {}; } }
// ---------- 엔딩 기록: 처음엔 전부 잠겨 있고, 본 엔딩만 하나씩 열린다 ----------
function showEndings(fromEnd, openId){
  const ids = Object.keys(D.endings), seen = endingsSeen(), meta = endingMeta();
  if(openId){
    const e = D.endings[openId], m = meta[openId];
    show(`<div class="end-banner" style="${endArt(openId, e, 600, 150)}"></div><h2>${e.title}</h2><div class="end-paper">${paras(e.text)}${e.epilogue ? `<div class="end-sep">후일담</div>${paras(e.epilogue)}` : ""}</div>${m ? `<div class="end-meta">${m.day}일차에 처음 도달 · ${m.n}번 맞이함</div>` : ""}<button class="choice" id="x">목록으로</button>`, "endings read");
    $("#x").onclick = () => showEndings(fromEnd);
    return;
  }
  const cell = (id, i) => seen.includes(id)
    ? `<button class="end-cell open" data-id="${id}"><b>${String(i+1).padStart(2,"0")}</b><span>${D.endings[id].title}</span></button>`
    : `<div class="end-cell locked" aria-label="잠긴 엔딩"><b>${String(i+1).padStart(2,"0")}</b><span>? ? ?</span><i>🔒</i></div>`;
  const dead = ids.map((id,i) => [id,i]).filter(([id]) => D.endings[id].dead), rest = ids.map((id,i) => [id,i]).filter(([id]) => !D.endings[id].dead);
  const sec = (name, arr) => `<h3>${name} <small>${arr.filter(([id]) => seen.includes(id)).length} / ${arr.length}</small></h3><div class="end-grid">${arr.map(([id,i]) => cell(id,i)).join("")}</div>`;
  show(`<h2>엔딩 기록 <small class="cnt">${seen.filter(id => D.endings[id]).length} / ${ids.length}</small></h2>${sec("결말", rest)}${sec("쓰러진 기록", dead)}<p class="end-note">엔딩을 보면 이곳에 기록되고, 눌러서 다시 읽을 수 있다.</p><button class="choice" id="x">${fromEnd ? "처음으로" : "닫기"}</button>`, "endings");
  $("#x").onclick = fromEnd ? restart : close;
  document.querySelectorAll(".end-cell.open").forEach(b => b.onclick = () => { SND.play("click"); showEndings(fromEnd, b.dataset.id); });
}

// ---------- 가방 / 기록 ----------
// ---------- 가방: 격자 + 아이템 이미지 ----------
// 아이템 이미지는 data/world.js의 items에 img:"assets/items/파일.png"를 지정하면 그 이미지를 쓰고, 없으면 아래 스케치 아이콘을 씁니다.
const A = d => `<svg viewBox="0 0 48 48" aria-hidden="true"><g filter="url(#rough)">${d}</g></svg>`;
const ITEM_ART = {
  battery:    A('<rect x="6" y="14" width="32" height="20" rx="2"/><path d="M38 20h4v8h-4M12 20v8M18 24h8M30 20v8"/>'),
  rope:       A('<path d="M8 36c6-18 10 6 16-10s10 6 16-12M8 42c6-18 10 6 16-10s10 6 16-12"/>'),
  mask:       A('<path class="f" d="M7 17q17-9 34 0v12q-5 12-17 12T7 29z"/><circle cx="17" cy="29" r="4"/><circle cx="31" cy="29" r="4"/><path d="M19 36q5 3 10 0"/>'),
  wrench:     A('<path class="f" d="M34 6a9 9 0 0 0-7 12L7 38l4 4 20-20a9 9 0 0 0 12-8l-6 4-4-1-1-5z"/>'),
  fuel:       A('<path class="f" d="M10 12h22v30H10zM32 18l7 5v16"/><path d="M15 12V7h12v5M15 22h12M15 30h12"/>'),
  water:      A('<path class="f" d="M19 6h10v6l5 5v25H14V17l5-5z"/><path d="M14 26h20M14 34h20"/>'),
  badge:      A('<rect class="f" x="7" y="10" width="34" height="28" rx="3"/><circle cx="18" cy="21" r="5"/><path d="M11 33h14M28 18h8M28 24h8M28 30h5"/>'),
  tape:       A('<rect class="f" x="5" y="13" width="38" height="24" rx="2"/><circle cx="17" cy="25" r="5.500"/><circle cx="31" cy="25" r="5.500"/><path d="M12 37l3-6h18l3 6"/>'),
  bandage:    A('<circle cx="22" cy="26" r="15"/><circle cx="22" cy="26" r="6"/><path d="M34 34l9 6M10 22l24 8"/>'),
  medicine:   A('<rect x="17" y="6" width="14" height="6"/><path class="f" d="M19 12v5l-6 8v16h22V25l-6-8v-5z"/><rect x="17" y="27" width="14" height="9"/><path d="M24 29v5M21.5 31.5h5"/>'),
  flashlight: A('<path class="f" d="M5 14l9 4v12l-9 4z"/><rect x="14" y="18" width="26" height="12" rx="2"/><path d="M20 18v12M5 6l4 5M2 24h5M5 42l4-5"/>'),
  key:        A('<circle cx="13" cy="24" r="8"/><circle cx="13" cy="24" r="2.5"/><path d="M21 24h22M36 24v8M42 24v6"/>'),
  crowbar:    A('<path d="M14 40L38 10"/><path d="M38 10c3-4 9-3 8 2"/><path d="M14 40c-3 4-9 3-8-2"/><path d="M11 36l5 4"/>'),
  cloth:      A('<path class="f" d="M7 12h34l-3 8 3 8-4 8H11l-3-8 3-8z"/><path d="M15 12l2 24M24 12v24M33 12l-2 24"/>'),
  scrap:      A('<path class="f" d="M8 30l9-17 15 4 9 15-11 11-19-3z"/><circle cx="24" cy="27" r="4"/><path d="M17 13l6 9M32 17l-8 10"/>'),
  can:        A('<ellipse cx="24" cy="12" rx="13" ry="4.5"/><path class="f" d="M11 12v24c0 2.5 5.8 4.5 13 4.5s13-2 13-4.5V12c0 2.5-5.8 4.5-13 4.5S11 14.500 11 12z"/><path d="M11 22c0 2.500 5.800 4.500 13 4.500S37 24.500 37 22M11 31c0 2.500 5.800 4.500 13 4.500S37 33.500 37 31"/>'),
  photo:      A('<rect x="7" y="9" width="34" height="30"/><rect x="12" y="14" width="24" height="19"/><circle cx="20" cy="21" r="3"/><path d="M12 33l9-7 6 4 5-5 4 8"/>'),
  note:       A('<path class="f" d="M11 5h19l9 9v29H11z"/><path d="M30 5v9h9M16 22h18M16 28h18M16 34h11"/>'),
  map:        A('<path class="f" d="M6 10l12-4 12 4 12-4v32l-12 4-12-4-12 4z"/><path d="M18 6v32M30 10v32M10 20l5 4M34 18l4 5"/>'),
  unknown:    A('<path class="f" d="M7 17l17-9 17 9v19l-17 9-17-9z"/><path d="M7 17l17 9 17-9M24 26v19"/>')
};
const itemArt = id => { const it = D.items[id]; return it.img ? `<img src="${it.img}" alt="" draggable="false">` : (ITEM_ART[id] || ITEM_ART.unknown); };
let invSel = null;
function showInventory(){
  const groups = [];
  S.inv.forEach(id => { const g = groups.find(x => x.id === id); g ? g.n++ : groups.push({ id, n: 1 }); });
  if(!groups.some(g => g.id === invSel)) invSel = groups.length ? groups[0].id : null;
  const total = Math.max(D.invSlots || 20, Math.ceil(groups.length / 5) * 5);
  let cells = "";
  for(let i = 0; i < total; i++){
    const g = groups[i];
    cells += g
      ? `<button class="slot${g.id === invSel ? " on" : ""}" data-id="${g.id}" aria-label="${iname(g.id)} ${g.n}개"><span class="art">${itemArt(g.id)}</span>${g.n > 1 ? `<b class="cnt">×${g.n}</b>` : ""}</button>`
      : `<div class="slot empty"></div>`;
  }
  const it = invSel && D.items[invSel], cur = invSel && groups.find(g => g.id === invSel);
  const detail = it
    ? `<div class="detail"><div class="dtxt"><strong>${it.name}${cur.n > 1 ? ` ×${cur.n}` : ""}</strong><span>${it.desc}</span></div>${it.use ? `<button id="use">사용</button>` : ""}</div>`
    : `<div class="detail muted"><span>가방이 비어 있다.</span></div>`;
  show(`<h2>가방</h2><div class="grid">${cells}</div>${detail}<button class="choice" id="x">닫기</button>`, "inv");
  $("#x").onclick = close;
  document.querySelectorAll(".slot[data-id]").forEach(b => b.onclick = () => { invSel = b.dataset.id; SND.play("click"); showInventory(); });
  const use = $("#use");
  if(use) use.onclick = () => {
    const u = D.items[invSel].use;
    if(u.hp) S.hp = clamp(S.hp + u.hp); if(u.san) S.san = clamp(S.san + u.san);
    S.inv.splice(S.inv.indexOf(invSel), 1);
    addLog(`${iname(invSel)} 사용`); SND.play("heal"); save(); render(); showInventory();
  };
}
function itemIcon(id){
  const it = D.items[id];
  if(it.img) return `<img src="${it.img}" alt="" draggable="false">`;
  const art = !it.icon && (ITEM_ART[id] || (it.kind && ITEM_ART[it.kind]) || (it.clue && ITEM_ART.note));
  if(art) return art;
  return `<svg viewBox="0 0 32 32" aria-hidden="true">${it.icon || '<rect x="7" y="7" width="18" height="18" rx="2"/><path d="M13 14h6M13 18h4"/>'}</svg>`;
}
let bagSel = null;
// 단서 아이템 자세히 보기: item.read 본문을 종이 쪽지처럼 보여 준다.
function showClue(id){
  const it = D.items[id];
  show(`<h2>${it.name}</h2><div class="clue-paper">${it.read.split("\n\n").map(p => `<p>${p.replace(/\n/g,"<br>")}</p>`).join("")}</div>${it.hint ? `<div class="clue-hint">${it.hint}</div>` : ""}<button class="choice" id="x">돌아가기</button>`, "bag read");
  $("#x").onclick = showBag;
}
function showBag(){
  const stacks = [];
  S.inv.forEach(id => { const st = stacks.find(x => x.id === id); st ? st.n++ : stacks.push({ id, n:1 }); });
  if(!stacks.find(x => x.id === bagSel)) bagSel = stacks.length ? stacks[0].id : null;
  const total = Math.max(D.bagSlots || 20, stacks.length);
  const slots = Array.from({ length: total }, (_, i) => {
    const st = stacks[i];
    return st ? `<button class="slot full${st.id===bagSel ? " sel" : ""}${D.items[st.id].use ? " usable" : ""}" data-id="${st.id}" aria-label="${iname(st.id)}">${itemIcon(st.id)}${st.n>1 ? `<b class="qty">×${st.n}</b>` : ""}</button>` : `<div class="slot"></div>`;
  }).join("");
  const it = bagSel && D.items[bagSel];
  const detail = it
    ? `<div class="detail"><div><strong>${it.name}${it.clue ? ` <em class="clue-tag">단서</em>` : ""}</strong><small>${it.desc}</small></div>${it.use ? `<button id="use">사용</button>` : ""}${it.read ? `<button id="read">자세히</button>` : ""}${it.craft && S.inv.filter(x => x === bagSel).length >= it.craft.need ? `<button id="craft">${it.craft.label}</button>` : ""}</div>`
    : `<div class="detail"><small>가방이 비어 있다. 탐험에서 쓸 만한 물건을 찾아보자.</small></div>`;
  show(`<h2>가방 <small class="cnt">${S.inv.length}개</small></h2><div class="grid">${slots}</div>${detail}<button class="choice" id="x">닫기</button>`, "bag");
  $("#x").onclick = close;
  document.querySelectorAll(".slot.full").forEach(b => b.onclick = () => { bagSel = b.dataset.id; showBag(); });
  if($("#read")) $("#read").onclick = () => showClue(bagSel);
  if($("#craft")) $("#craft").onclick = () => { const cr = D.items[bagSel].craft; for(let n = 0; n < cr.need; n++) S.inv.splice(S.inv.indexOf(bagSel), 1); S.inv.push(cr.to); addLog(`${iname(bagSel)} ${cr.need}개로 ${iname(cr.to)} 제작`); SND.play("item"); save(); render(); bagSel = cr.to; showBag(); };
  const use = $("#use");
  if(use) use.onclick = () => {
    const u = D.items[bagSel].use, k = S.inv.indexOf(bagSel);
    if(k < 0) return;
    if(u.hp) S.hp = clamp(S.hp + u.hp); if(u.san) S.san = clamp(S.san + u.san);
    S.inv.splice(k, 1); addLog(`${iname(bagSel)} 사용`); save(); render(); showBag();
  };
}
$("#btn-inv").onclick = showBag;
function showSettings(){
  show(`<h2>설정</h2><div class="inv-row"><div>사운드<small>효과음을 켜거나 끕니다.</small></div><button id="s-sound" class="switch" role="switch" aria-checked="${SND.on}" aria-label="사운드"><span class="lbl">${SND.on ? "ON" : "OFF"}</span><span class="track"><span class="knob"></span></span></button></div><br><button class="choice" id="x">닫기</button>`);
  $("#x").onclick = close;
  $("#s-sound").onclick = () => { SND.set(!SND.on); showSettings(); };
}
$("#btn-settings").onclick = showSettings;
$("#t-settings").onclick = showSettings;
$("#t-endings").onclick = () => showEndings(false);
document.addEventListener("click", e => { if(e.target.closest("button:not(:disabled)")) SND.play("click"); });
$("#btn-log").onclick = () => {
  show(`<h2>기록</h2>${S.log.length ? S.log.map(l=>`<div class="log-row">${l}</div>`).join("") : "<p>아직 기록이 없다.</p>"}<br><button class="choice" id="x">닫기</button>`);
  $("#x").onclick = close;
};
$("#btn-back").onclick = () => { if(S.region){ S.region = null; save(); render(); } else setView("bunker", true); };

// ---------- 타이틀 ----------
function showTitle(){
  const sv = load();
  $("#t-continue").hidden = !(sv && sv.started && !sv.over);
  $("#title").classList.remove("hide");
}
function bunkerBg(){
  const img = D.bunker && D.bunker.img;
  $("#bunker-img").style.setProperty("--bimg", img ? `url("${new URL(img, document.baseURI).href}")` : "none");
}
function enter(){ bunkerBg(); $("#title").classList.add("hide"); render(); if(!S.flags.intro) showIntro(); }
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

bunkerBg();
render();
showTitle();
window.__wastelandLoaded = true;
})();
