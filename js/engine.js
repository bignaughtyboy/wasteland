// ===== 게임 엔진: 데이터(data/*.js)를 읽어 동작합니다. 콘텐츠는 data만 고치면 됩니다. =====
(() => {
const D = window.GAME_DATA, $ = s => document.querySelector(s);
const KEY = "wasteland-rpg-save", MAX = 10;
let S = load() || fresh();

function fresh(){ return { started:false, hp:MAX, san:MAX, inv:[], flags:{}, done:{}, seen:{}, log:[], region:null, over:null }; }
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
function render(){
  const bar = (v,id) => { $(id).innerHTML = Array.from({length:MAX},(_,i)=>`<b class="${i<v?'on':''}"></b>`).join(""); };
  bar(S.hp,"#hp-bar"); bar(S.san,"#san-bar");
  $("#hp-num").textContent = `${S.hp}/${MAX}`; $("#san-num").textContent = `${S.san}/${MAX}`;
  const st = D.sanStates.find(s => S.san>=s[0] && S.san<=s[1]);
  $("#san-state").textContent = st ? st[2] : "";
  document.body.classList.toggle("low", S.san <= D.lowSan);
  renderMap();
}
const ICON = {
  pin:  '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  dot:  '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/></svg>'
};
function zoom(reg){
  const img = $("#map-img");
  if(!reg){ img.style.transform = "none"; return; }
  const s = 2.4, cl = (v,lo,hi) => Math.max(lo, Math.min(hi, v));
  const tx = cl((0.5 - s*reg.x/100)*100, (1-s)*100, 0), ty = cl((0.5 - s*reg.y/100)*100, (1-s)*100, 0);
  img.style.transform = `translate(${tx}%,${ty}%) scale(${s})`;
}
function renderMap(){
  const nodes = $("#nodes"); nodes.innerHTML = "";
  const reg = (S.region && D.places[S.region]) ? D.regions.find(r => r.id===S.region) : null;
  $("#btn-back").hidden = !reg;
  $("#map-title").textContent = reg ? reg.name : "";
  zoom(reg);
  (reg ? D.places[reg.id] : D.regions).forEach(n => {
    const locked = !reg && !n.unlocked;
    const b = document.createElement("button");
    b.className = "node" + (locked ? " locked" : "") + (S.seen[n.id] ? " seen" : "");
    b.innerHTML = `<span class="dia">${locked ? ICON.lock : reg ? ICON.dot : ICON.pin}</span><span class="plate">${n.name}</span>`;
    b.style.left = n.x + "%"; b.style.top = n.y + "%";
    b.disabled = locked;
    b.setAttribute("aria-label", locked ? n.name + " (잠김)" : n.name);
    b.onclick = () => reg ? explore(n) : (S.region = n.id, save(), render());
    nodes.appendChild(b);
  });
}

// ---------- 모달 ----------
function show(html){ $("#sheet").innerHTML = html; $("#modal").hidden = false; }
function close(){ $("#modal").hidden = true; }
function chips(r){
  const c = [];
  if(r.hp) c.push(`체력 ${r.hp>0?"+":""}${r.hp}`);
  if(r.san) c.push(`정신력 ${r.san>0?"+":""}${r.san}`);
  (r.give||[]).forEach(i => c.push("획득: "+iname(i)));
  (r.take||[]).forEach(i => c.push("소모: "+iname(i)));
  return c.length ? `<div class="chips">${c.map(x=>`<span>${x}</span>`).join("")}</div>` : "";
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
  const e = pickEvent(place.id);
  if(!e){
    const f = D.fillers[Math.floor(Math.random()*D.fillers.length)];
    return show(`<h2>${place.name}</h2><p>${f}</p><button class="choice" id="ok">돌아간다</button>`), $("#ok").onclick = () => { close(); render(); save(); };
  }
  const t = (S.san <= D.lowSan && e.textLow) ? e.textLow : e.text;
  const btns = e.choices.map((c,i) => {
    const can = ok(c.req);
    return `<button class="choice" data-i="${i}" ${can?"":"disabled"}>${c.text}${can?"":`<span class="hint">${need(c.req)}</span>`}</button>`;
  }).join("");
  show(`<h2>${e.title}</h2><p>${t}</p>${btns}`);
  document.querySelectorAll(".choice").forEach(b => b.onclick = () => choose(e, e.choices[+b.dataset.i]));
}
function choose(e, c){
  S.done[e.id] = 1;
  let r = c.result;
  if(r.t === "__minjae__") r = minjaeResult();
  if(r.hp) S.hp = clamp(S.hp + r.hp);
  if(r.san) S.san = clamp(S.san + r.san);
  (r.take||[]).forEach(i => { const k = S.inv.indexOf(i); if(k>=0) S.inv.splice(k,1); });
  (r.give||[]).forEach(i => S.inv.push(i));
  Object.assign(S.flags, r.set||{});
  addLog(`[${e.title}] ${c.text}`);
  save();
  show(`<h2>${e.title}</h2><p>${r.t}</p>${chips(r)}<button class="choice" id="next">계속</button>`);
  $("#next").onclick = () => afterEvent(r.ending);
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
  S.over = id; save(); render();
  const e = D.endings[id];
  show(`<h2>${e.title}</h2><p>${e.text}</p><button class="choice" id="again">처음부터 다시 시작</button>`);
  $("#again").onclick = restart;
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
$("#t-continue").onclick = () => { S = load() || fresh(); enter(); };
$("#btn-title").onclick = () => { save(); showTitle(); };

render();
showTitle();
window.__wastelandLoaded = true;
})();
