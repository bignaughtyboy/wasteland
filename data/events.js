// ===== 이벤트 데이터 =====
// type: fixed(고정) | story(스토리) | random(랜덤) | conditional(조건부)
// req: { flags:[], notFlags:[], done:[이벤트id], items:[], anyItems:[], san:[최소,최대] }
// text / textLow(정신력 낮을 때) / choices[{ text, req, result:{ t, hp, san, give:[], take:[], set:{}, ending } }]
// fixed/story는 조건을 만족하면 항상 먼저 나오고, random/conditional은 weight 가중치로 뽑힙니다.
window.GAME_DATA.events = [

// ---------- 스토리 이벤트 (3) ----------
{ id:"s1_radio", place:"building", type:"story", title:"무너진 사무실의 라디오",
  text:"계단참을 지나 반쯤 무너진 사무실에 들어선다. 책상 아래에서 아직 전원이 들어오는 낡은 라디오를 발견했다.\n\n잡음 사이로 누군가의 목소리가 끊어졌다 이어진다.",
  textLow:"사무실 책상 아래에서 라디오가 혼자 지직거린다. 전원선은 잘려 있는데도.\n\n목소리가 당신의 이름을 부르는 것 같다.",
  choices:[
   { text:"주파수를 천천히 돌려본다.", result:{ t:"“…산…연구소…남쪽 출구…구조…” 반복되는 신호를 들었다. 어딘가 도움을 요청하고 있다.", san:-1, set:{signal:1} } },
   { text:"부품만 챙기고 자리를 뜬다.", result:{ t:"배터리 케이스에서 금속 부품을 뜯어냈다. 신호는 흐릿하게나마 귀에 남았다.", give:["scrap"], set:{signal:1} } }
 ]},
{ id:"s2_records", place:"hospital", type:"story", req:{ done:["s1_radio"] }, title:"병원 지하 서고",
  text:"라디오의 신호가 '연구'를 말했다. 병원 지하 서고는 이상하게 정리되어 있다. 누군가 서둘러 무언가를 치운 흔적이다.\n\n서가 한 칸에서 봉인된 서류철을 발견한다.",
  textLow:"서고의 서류철들이 숨 쉬듯 들썩인다. 한 권만 정확히 당신 쪽으로 튀어나와 있다.",
  choices:[
   { text:"서류철을 열어 읽는다.", result:{ t:"환자 기록이 아니다. 도시 지하 시설의 환기 일지와 '재난 이전'의 날짜들. 그리고 지하철 관제실 위치가 적혀 있다.", san:-1, give:["note"], set:{knowsLab:1} } },
   { text:"함부로 건드리지 않고 나온다.", result:{ t:"왠지 모를 불안에 서류철을 두고 나왔다. 돌아서려는 순간 겉표지의 '지하철 관제'라는 글자가 눈에 들어왔다.", set:{knowsLab:1} } }
 ]},
{ id:"s3_control", place:"subway", type:"story", req:{ done:["s2_records"], items:["flashlight"] }, title:"관제실의 철문",
  text:"손전등 불빛이 승강장 끝의 철문을 비춘다. 관제실이다. 문 너머로 바람이 새어 나오는 터널이 보인다. 외부로 이어지는 길일지도 모른다.\n\n이곳이 구도심의 끝이다. 어떻게 할 것인가.",
  textLow:"철문이 당신을 기다렸다는 듯 반쯤 열려 있다. 터널 안쪽에서 누군가 손을 흔드는 것이 보인다.",
  choices:[
   { text:"터널을 따라 바깥으로 나간다.", result:{ t:"어둠 속으로 걸음을 옮긴다.", ending:"escape" } },
   { text:"관제실 장부를 연구 기록과 대조한다.", req:{ items:["note"] }, result:{ t:"장부와 기록이 정확히 맞물린다.", ending:"truth" } },
   { text:"민재를 먼저 터널로 보내고 문을 닫는다.", req:{ flags:["minjae_helped"] }, result:{ t:"그가 부르는 소리를 등지고, 당신은 문을 닫는다.", ending:"sacrifice" } }
 ]},

// ---------- 일반 이벤트 (10) ----------
{ id:"conv_shelf", place:"convenience", type:"fixed", title:"편의점 진열대",
  text:"깨진 유리문 너머, 쓰러진 진열대 사이에 아직 뜯기지 않은 물건이 몇 개 보인다.",
  textLow:"진열대 사이에서 무언가 낮게 웃는 것 같다. 아니, 환풍기 소리다.",
  choices:[
   { text:"계산대 아래를 뒤진다.", result:{ t:"손전등과 통조림 하나를 찾았다. 전지는 아직 살아 있다.", give:["flashlight","can"] } },
   { text:"천천히 진열대를 살핀다.", result:{ t:"통조림 하나와 손전등을 발견했다. 유리 파편에 손을 베였다.", hp:-1, give:["flashlight","can"] } }
 ]},
{ id:"house_photo", place:"house", type:"random", weight:3, title:"식탁 위의 사진",
  text:"식탁에는 먼지 쌓인 접시 세 개와 액자 하나가 놓여 있다. 웃고 있는 가족사진이다.",
  textLow:"사진 속 사람들의 눈이 당신을 따라 움직이는 것 같다.",
  choices:[
   { text:"사진을 챙긴다.", result:{ t:"사진을 조심스럽게 가방에 넣었다.", give:["photo"], san:-1 } },
   { text:"액자를 제자리에 둔다.", result:{ t:"사진을 바로 세워 두었다. 어쩐지 마음이 가라앉는다.", san:1 } }
 ]},
{ id:"house_drawer", place:"house", type:"random", weight:3, title:"잠긴 서랍",
  text:"침실 서랍장의 맨 아래 칸이 잠겨 있다. 안쪽에서 금속이 부딪히는 소리가 난다.",
  choices:[
   { text:"쇠지렛대로 연다.", req:{ items:["crowbar"] }, result:{ t:"서랍을 열자 열쇠와 천 조각이 들어 있었다.", give:["key","cloth"] } },
   { text:"맨손으로 억지로 연다.", result:{ t:"서랍이 열리며 손톱이 부러졌다. 열쇠가 굴러 나왔다.", hp:-1, give:["key"] } },
   { text:"포기한다.", result:{ t:"서랍을 닫고 방을 나온다." } }
 ]},
{ id:"house_trader", place:"house", type:"random", weight:2, title:"거실의 상인",
  text:"거실 한가운데 낡은 담요 위에 물건을 펼쳐 놓은 노인이 앉아 있다.\n\n“교환하겠소? 서두를 것 없소.”",
  textLow:"노인의 얼굴이 담요 그림자에 가려 보이지 않는다. 목소리만 또렷하다.\n\n“교환하겠소? 서두를 것 없소.”",
  choices:[
   { text:"통조림을 주고 치료제를 받는다.", req:{ items:["can"] }, result:{ t:"노인은 말없이 통조림을 가져가며 약병을 내밀었다.", take:["can"], give:["medicine"] } },
   { text:"천 조각을 주고 붕대를 받는다.", req:{ items:["cloth"] }, result:{ t:"노인이 천을 매만지다 붕대 두루마리를 건넸다.", take:["cloth"], give:["bandage"] } },
   { text:"이야기만 나눈다.", result:{ t:"노인은 ‘남쪽 지하철이 아직 조용하다’는 말만 남기고 입을 닫았다.", san:1 } }
 ]},
{ id:"hospital_door", place:"hospital", type:"conditional", weight:4, title:"잠긴 약품실",
  text:"병원 2층 약품실 문은 굳게 잠겨 있다. 문틈으로 약 냄새가 희미하게 새어 나온다.",
  choices:[
   { text:"열쇠로 연다.", req:{ items:["key"] }, result:{ t:"문이 소리 없이 열렸다. 선반에서 붕대와 치료제를 챙겼다.", take:["key"], give:["bandage","medicine"] } },
   { text:"쇠지렛대로 비집어 연다.", req:{ items:["crowbar"] }, result:{ t:"경첩이 비명을 지르며 문이 열렸다. 치료제를 챙겼다.", give:["medicine"] } },
   { text:"문을 걷어찬다.", result:{ t:"세 번째 발길질에 문이 열렸다. 발목이 시큰하다. 치료제 하나를 건졌다.", hp:-2, give:["medicine"] } },
   { text:"다음에 다시 온다.", result:{ t:"약품실 앞을 뒤로하고 계단을 내려간다." } }
 ]},
{ id:"hospital_sound", place:"hospital", type:"random", weight:3, title:"복도의 발소리",
  text:"병동 복도 끝에서 규칙적으로 무언가 끌리는 소리가 들린다. 휠체어 바퀴 소리 같다.",
  textLow:"소리는 점점 가까워진다. 이름을 부르는 것 같다. 당신은 대답하고 싶지 않다.",
  choices:[
   { text:"소리가 나는 쪽으로 다가간다.", result:{ t:"빈 휠체어가 느리게 굴러가고 있었다. 팔걸이에 붕대가 걸려 있다.", san:-1, give:["bandage"] } },
   { text:"숨을 죽이고 가만히 있는다.", result:{ t:"소리는 서서히 멀어졌다. 식은땀이 흐른다.", san:-1 } }
 ]},
{ id:"building_stairs", place:"building", type:"random", weight:4, title:"무너진 계단",
  text:"위층으로 가는 계단 한 칸이 통째로 사라져 있다. 아래에는 쇠지렛대가 녹슨 채 꽂혀 있다.",
  choices:[
   { text:"뛰어넘어 지렛대를 챙긴다.", result:{ t:"난간이 흔들렸지만 간신히 건넜다. 팔이 쓸렸다.", hp:-1, give:["crowbar"] } },
   { text:"난간에 매달려 조심히 내려간다.", result:{ t:"시간은 걸렸지만 다치지 않고 지렛대를 얻었다.", give:["crowbar"] } }
 ]},
{ id:"minjae_meet", place:"building", type:"conditional", weight:99, req:{ done:["s1_radio"], notFlags:["minjae_met"] }, title:"옥상의 생존자",
  text:"옥상 문틈으로 연기가 오른다. 낡은 담요 위에 앉은 청년이 당신을 쳐다본다.\n\n“잠깐만요. 혹시 먹을 것을 가지고 있습니까? 저는 민재라고 합니다.”",
  choices:[
   { text:"통조림을 건네준다.", req:{ items:["can"] }, result:{ t:"민재가 허겁지겁 먹으며 고개를 숙였다. “이 은혜 잊지 않겠습니다.”", take:["can"], san:1, set:{minjae_met:1, minjae_helped:1} } },
   { text:"물건을 교환하자고 제안한다.", result:{ t:"민재는 경계하는 눈빛으로 천 조각을 내밀었다. 거래는 성사됐다.", give:["cloth"], set:{minjae_met:1} } },
   { text:"정체를 먼저 묻는다.", result:{ t:"민재는 '병원에서 살아 돌아온 사람'이라고만 답했다. 불안한 기색이다.", san:-1, set:{minjae_met:1, minjae_known:1} } },
   { text:"아무 말 없이 자리를 떠난다.", result:{ t:"등 뒤에서 민재가 낮게 욕하는 소리가 들렸다.", set:{minjae_met:1, minjae_cold:1} } }
 ]},
{ id:"minjae_return", place:"subway", type:"conditional", weight:99, req:{ flags:["minjae_met"], notFlags:["minjae_returned"] }, title:"승강장의 민재",
  text:"승강장 벤치에 낯익은 그림자가 있다. 민재가 먼저 당신을 알아본다.",
  choices:[
   { text:"다가가 말을 건다.", result:{ t:"__minjae__" } }
 ]},
{ id:"subway_dark", place:"subway", type:"conditional", weight:3, req:{ items:["flashlight"] }, title:"어두운 승강장",
  text:"손전등을 켜자 승강장 아래 선로에 떨어진 가방들이 드러난다. 오래된 짐 속에 쓸 만한 것이 있을지도 모른다.",
  textLow:"불빛이 닿지 않는 어둠이 조금씩 가까워진다.",
  choices:[
   { text:"선로로 내려가 가방을 뒤진다.", result:{ t:"가방 속에서 금속 부품과 천 조각을 찾았다. 위쪽에서 뭔가 지나간 듯 소름이 돋는다.", san:-1, give:["scrap","cloth"] } },
   { text:"위에서 불빛만 비춰 본다.", result:{ t:"눈에 띄는 것은 없었다. 어둠만 깊어질 뿐이다." } }
 ]}
];
