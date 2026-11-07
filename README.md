# 미정 (가칭) — 텍스트 기반 탐험·생존 RPG

낡은 종이 스케치 스타일의 싱글 플레이 텍스트 RPG. 빌드 도구 없이 **순수 HTML/CSS/JS**로 동작합니다.

## 실행
- 로컬: `index.html`을 브라우저로 열기 (서버 불필요)
- GitHub Pages: 저장소 업로드 → **Settings → Pages → Branch: main / (root)** 저장 → `https://<아이디>.github.io/<저장소>/`

## 구조
```
index.html        화면 틀
css/style.css     종이 스케치 UI
js/engine.js      게임 로직 (탐험·선택·능력치·인벤토리·저장·엔딩)
data/world.js     지역, 장소, 아이템, 엔딩, 정신력 구간
data/events.js    이벤트 (콘텐츠 대부분은 여기만 수정)
```

## 콘텐츠 추가 방법
- **이벤트**: `data/events.js` 배열에 항목 추가 (type: fixed / story / random / conditional)
- **조건(req)**: `flags`, `notFlags`, `done`, `items`, `anyItems`, `san:[최소,최대]`
- **결과(result)**: `t`(텍스트), `hp`, `san`, `give`, `take`, `set`(플래그), `ending`
- **정신력에 따른 묘사**: 이벤트에 `textLow` 추가 (정신력 4 이하에서 표시)
- **장소/지역**: `data/world.js`의 `places`, `regions` (지역은 `unlocked:true`로 해금)
- **아이템**: `data/world.js`의 `items` (`use`를 주면 가방에서 사용 가능)
- 진행 상황은 브라우저 localStorage에 자동 저장됩니다.

## 현재 범위 (1차 프로토타입)
구도심 1개 지역 · 장소 5 · 일반 이벤트 10 · 스토리 이벤트 3 · NPC 2(민재, 상인) · 아이템 10 · 엔딩 3(+실패)
