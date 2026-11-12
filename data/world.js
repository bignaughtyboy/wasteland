// ===== 월드 데이터: 지역 / 장소 / 아이템 / 엔딩 =====
// 새 지역 추가: regions에 항목을 넣고 places[지역id]에 장소를 추가하세요.
window.GAME_DATA = {
  bagSlots: 20,   // 가방 격자 칸 수 (종류가 더 많으면 자동으로 늘어남)
  mapAspect: 1312 / 1199,   // 지도 이미지 세로/가로 비율
  worldMap: "assets/world-map.jpg",   // 세계 지도 이미지 (교체 가능)
  regions: [
    // x,y: 세계 지도 위 마커 위치(%) / zoom: 지역 화면에서 지도를 확대할 배율
    { id: "old",  name: "구도심",   x: 25, y: 20, unlocked: true, zoom: 2.4 },
    { id: "ind",  name: "산업지대", x: 20, y: 66, unlocked: false },
    { id: "lake", name: "호수",     x: 57, y: 45, unlocked: false },
    { id: "city", name: "신도시",   x: 80, y: 22, unlocked: false },
    { id: "mtn",  name: "산악지대", x: 82, y: 64, unlocked: false }
  ],
  // art: 이벤트 장면 그림 = 지도 이미지의 확대 영역 (x,y는 지도 위 위치 %, z는 확대 배율)
  places: {
    old: [
      { id: "building",    name: "폐건물", icon: "building",      x: 47, y: 30, art: { x: 22.5, y: 15, z: 3.1 } },
      { id: "convenience", name: "편의점", icon: "store",      x: 78, y: 48, art: { x: 36, y: 19, z: 3.2 } },
      { id: "house",       name: "버려진 주택", icon: "house", x: 14, y: 62, art: { x: 9, y: 20, z: 3.2 } },
      { id: "hospital",    name: "병원", icon: "hospital",        x: 30, y: 50, art: { x: 17, y: 19, z: 3.0 } },
      { id: "subway",      name: "지하철역", icon: "subway",    x: 58, y: 72, art: { x: 30, y: 30, z: 3.0 } }
    ]
  },
  invSlots: 20,   // 가방에 표시되는 칸 수 (5칸씩 한 줄)
  // use: 가방에서 사용할 때의 효과 / img: "assets/items/파일.png" 를 넣으면 스케치 아이콘 대신 이 이미지를 사용
  items: {
    bandage:   { name: "붕대",        desc: "상처를 감는다. 체력 +3", use: { hp: 3 } },
    medicine:  { name: "치료제",      desc: "유통기한이 지난 약. 체력 +5", use: { hp: 5 } },
    flashlight:{ name: "손전등",      desc: "어두운 곳을 조사할 수 있다." },
    key:       { name: "약품실 열쇠", desc: "어딘가의 잠긴 문을 연다." },
    crowbar:   { name: "쇠지렛대",    desc: "문을 억지로 연다." },
    cloth:     { name: "천 조각",     desc: "비교적 깨끗하다." },
    scrap:     { name: "금속 부품",   desc: "쓸모가 있을지도 모른다." },
    can:       { name: "통조림",      desc: "교환이나 호의에 쓸 수 있다." },
    photo:     { name: "낡은 사진",   desc: "누군가의 가족사진. 정신력 +1", use: { san: 1 } },
    note:      { name: "연구 기록",   desc: "병원 서고에서 찾은 문서. 중요한 단서." }
  },
  // [최소, 최대, 이름]  (밸런스 테스트 후 조정)
  hpStates: [ [9,10,"건강"], [7,8,"가벼운 부상"], [4,6,"부상"], [1,3,"위독"], [0,0,"쓰러짐"] ],
  sanStates: [ [8,10,"정상"], [5,7,"불안"], [2,4,"심각한 불안정"], [1,1,"붕괴 직전"], [0,0,"정신 붕괴"] ],
  lowSan: 4, // 이 값 이하에서 event.textLow 사용
  fillers: [
    "구석구석 뒤져 보았지만 쓸 만한 것은 없었다. 먼지만 일어난다.",
    "누군가 이미 다 가져간 듯하다. 바닥에는 발자국만 남아 있다.",
    "바람 소리뿐이다. 오늘은 이곳에서 얻을 것이 없다."
  ],
  endings: {
    death:    { title: "탐험 실패", text: "몸이 더는 움직이지 않았다.\n구도심의 폐허는 또 하나의 이야기를 삼켰다." }
  }
};

// ===== 아이템 아이콘 (32x32 선화) =====
// 실제 그림을 쓰려면 아이템에 img: "assets/items/아이템id.png" 를 지정하세요. img가 있으면 아이콘 대신 사용됩니다.
Object.entries({
  bandage:   '<circle cx="14" cy="15" r="9"/><circle cx="14" cy="15" r="3.5"/><path d="M6 21q8 4 16 0M22 19l7 7h-9"/>',
  medicine:  '<path d="M12 4h8v4h-8zM11 8h10v3l2 2v14H9V13l2-2z"/><path d="M13 20h6M16 17v6"/>',
  flashlight:'<rect x="3" y="13" width="15" height="6" rx="1"/><path d="M18 11h4l4-3v16l-4-3h-4zM26 12l4-2M27 16h3M26 20l4 2"/>',
  key:       '<circle cx="9" cy="16" r="5"/><circle cx="9" cy="16" r="1.6"/><path d="M14 16h15M24 16v5M28 16v4"/>',
  crowbar:   '<path d="M5 27L23 9q4-4 6-1l-3 3M5 27l3 1"/><path d="M8 24l3 3"/>',
  cloth:     '<path d="M5 8h22l-2 15H7z"/><path d="M5 8l6 4 5-4 5 4 6-4M9 17h14"/>',
  scrap:     '<path d="M16 4l3 3h5v5l3 3-3 3v5h-5l-3 3-3-3H8v-5l-3-3 3-3V7h5z"/><circle cx="16" cy="15" r="4"/>',
  can:       '<ellipse cx="16" cy="8" rx="8" ry="3"/><path d="M8 8v16c0 2 4 3 8 3s8-1 8-3V8M8 14c0 2 4 3 8 3s8-1 8-3M8 20c0 2 4 3 8 3s8-1 8-3"/>',
  photo:     '<rect x="4" y="5" width="24" height="22"/><rect x="8" y="9" width="16" height="12"/><circle cx="13" cy="14" r="2"/><path d="M8 21l5-4 4 3 3-2 4 3"/>',
  note:      '<path d="M8 4h12l5 5v19H8z"/><path d="M20 4v5h5M12 14h9M12 18h9M12 22h6"/>'
}).forEach(([k, v]) => { if (window.GAME_DATA.items[k]) window.GAME_DATA.items[k].icon = v; });
