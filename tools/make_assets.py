#!/usr/bin/env python3
"""연필 스케치 스타일 지도 SVG 생성기.  실행: python3 tools/make_assets.py
결과: assets/world-map.svg, assets/region-old.svg  (시드를 바꾸면 다른 그림이 나옵니다)"""
import random, math, os
W, H = 630, 785
INK = "#33332f"

class Sketch:
    def __init__(self, seed): self.R = random.Random(seed); self.items = []
    def j(self, a): return self.R.uniform(-a, a)
    def add(self, y, s): self.items.append((y, s))
    def path(self, pts, close=False, fill="none", sw=1.3, op=.85, a=.8, dash=""):
        p = [(x + self.j(a), y + self.j(a)) for x, y in pts]
        d = "M%.1f %.1f" % p[0] + "".join(" L%.1f %.1f" % q for q in p[1:]) + (" Z" if close else "")
        ds = f' stroke-dasharray="{dash}"' if dash else ""
        return f'<path d="{d}" fill="{fill}" stroke="{INK}" stroke-width="{sw}" stroke-opacity="{op}" stroke-linejoin="round" stroke-linecap="round"{ds}/>'
    def fillonly(self, pts, fill, op=.5):
        d = "M" + " L".join("%.1f %.1f" % p for p in pts) + " Z"
        return f'<path d="{d}" fill="{fill}" fill-opacity="{op}"/>'
    def ln(self, x1, y1, x2, y2, sw=1, op=.7, a=.5):
        return self.path([(x1, y1), ((x1 + x2) / 2 + self.j(1.2), (y1 + y2) / 2 + self.j(1.2)), (x2, y2)], sw=sw, op=op, a=a)

    # ---- 오브젝트 ----
    def mountain(self, cx, by, w, h):
        R = self.R; px, py = cx + self.j(w * .05), by - h; rx = cx + w * .08
        l, r = (cx - w / 2, by), (cx + w / 2, by)
        s = [self.fillonly([l, (cx - w * .2, py + h * .35), (px, py), (cx + w * .2, py + h * .3), r], "#dedcd5", .95),
             self.fillonly([(px, py), (rx, py + h * .45), (rx + w * .05, by), r, (cx + w * .2, py + h * .3)], "#a9a8a2", .55),
             self.path([l, (cx - w * .2, py + h * .35), (px, py), (cx + w * .2, py + h * .3), r], sw=1.4),
             self.path([(px, py), (rx - w * .02, py + h * .5), (rx, by)], sw=1, op=.7)]
        for i in range(int(h / 6)):
            f = (i + 1) / (h / 6 + 1); y = py + h * f
            s.append(self.ln(px + (rx - px) * f + 2, y, px + (r[0] - px) * f - 2, y + h * .05, .6, .55))
        for i in range(int(h / 14)):
            f = (i + 1.5) / (h / 14 + 1); y = py + h * f
            s.append(self.ln(px - w * .2 * f, y, px - w * .02 * f, y + h * .06, .5, .4))
        s.append(self.ln(l[0] - 4, by + 2, r[0] + 8, by + 3, .8, .4))
        self.add(by, "".join(s))
    def tree(self, x, y, s=1):
        h, w = 24 * s, 13 * s
        pts = [(x, y - h), (x - w * .33, y - h * .62), (x - w * .17, y - h * .62), (x - w * .48, y - h * .3), (x - w * .2, y - h * .3), (x - w * .55, y),
               (x + w * .55, y), (x + w * .2, y - h * .3), (x + w * .48, y - h * .3), (x + w * .17, y - h * .62), (x + w * .33, y - h * .62)]
        g = self.fillonly(pts, "#cfcec7", .95) + self.path(pts, True, sw=1, op=.8, a=.4)
        for k in (.25, .5, .78): g += self.ln(x + w * .08, y - h * k, x + w * .3 * (1.2 - k * .5), y - h * (k - .12), .5, .5)
        self.add(y, g)
    def forest(self, x0, y0, x1, y1, n, s=(.8, 1.2)):
        for _ in range(n): self.tree(self.R.uniform(x0, x1), self.R.uniform(y0, y1), self.R.uniform(*s))
    def rubble(self, x, y, n=4, sp=14):
        for _ in range(n):
            a, b = x + self.j(sp), y + self.j(sp * .5); r = self.R.uniform(2, 5)
            self.add(b, self.path([(a, b), (a + r, b - r * .6), (a + r * 1.8, b), (a + r, b + r * .4)], True, "#b8b7b0", .8, .8, .3))
    def building(self, x, y, w, h, ruin=False, d=None, win=True):
        R = self.R; d = d or w * .45; dy = d * .5; top = y - h
        tp = [(x, top)]
        if ruin:
            n = max(3, int(w / 9))
            for i in range(1, n): tp.append((x + w * i / n, top + R.uniform(-h * .1, h * .22)))
        tp.append((x + w, top + (R.uniform(0, h * .15) if ruin else 0)))
        front = [(x, y)] + tp + [(x + w, y)]
        rt = tp[-1][1]
        side = [(x + w, y), (x + w, rt), (x + w + d, rt - dy + (R.uniform(0, h * .2) if ruin else 0)), (x + w + d, y - dy)]
        g = self.fillonly(side, "#aeada7", .8) + self.fillonly(front, "#e0dfd9", .98)
        if not ruin: g += self.path([(x, top), (x + d, top - dy), (x + w + d, top - dy), (x + w, top)], True, "#ebeae5", 1.1, .8, .4)
        g += self.path(front, True, sw=1.3, a=.7) + self.path(side, True, sw=1.1, a=.6)
        if win:
            for r in range(int((h - 6) / 13)):
                for c in range(int((w - 4) / 11)):
                    if R.random() < .78:
                        wx, wy = x + 4 + c * 11, top + 7 + r * 13
                        if ruin and wy < min(p[1] for p in tp) + 6: continue
                        g += f'<rect x="{wx:.1f}" y="{wy:.1f}" width="6" height="8" fill="#4a4944" fill-opacity=".5"/>'
        for i in range(int(d / 4)): g += self.ln(x + w + 2 + i * 4, y - 2 - i * 2, x + w + 2 + i * 4, rt + 4 - i * 2, .5, .45)
        self.add(y, g)
        if ruin: self.rubble(x + w / 2, y + 4, 3, w * .6)
    def house(self, x, y, w=46, h=30):
        g = self.fillonly([(x, y), (x, y - h), (x + w, y - h), (x + w, y)], "#e0dfd9", .98)
        roof = [(x - 5, y - h), (x + w / 2, y - h - 26), (x + w + 5, y - h)]
        g += self.fillonly(roof, "#b4b3ac", .9) + self.path(roof, True, sw=1.3) + self.path([(x, y), (x, y - h), (x + w, y - h), (x + w, y)], True)
        g += f'<rect x="{x+w*.4:.1f}" y="{y-16:.1f}" width="9" height="16" fill="#4a4944" fill-opacity=".6"/>'
        g += f'<rect x="{x+6:.1f}" y="{y-h+8:.1f}" width="8" height="8" fill="#4a4944" fill-opacity=".5"/>'
        g += self.path([(x + w * .75, y - h - 14), (x + w * .75, y - h - 26), (x + w * .75 + 7, y - h - 26), (x + w * .75 + 7, y - h - 10)], sw=1)
        self.add(y, g)
        for i in range(5): self.add(y + 12, self.path([(x - 10 + i * 14, y + 14), (x - 10 + i * 14, y + 4)], sw=1, a=.5))
    def factory(self, cx, by):
        self.building(cx - 62, by, 92, 44, d=26, win=False)
        for i, (dx, hh) in enumerate([(-50, 112), (-22, 92), (26, 76)]):
            x = cx + dx; w = 15
            self.add(by - 30 + i, self.fillonly([(x, by - 22), (x, by - hh), (x + w, by - hh), (x + w, by - 22)], "#d6d5cf", .98)
                     + self.path([(x, by - 22), (x, by - hh), (x + w, by - hh), (x + w, by - 22)], sw=1.3) + self.path([(x - 3, by - hh), (x + w + 3, by - hh)], sw=2)
                     + self.path([(x + w / 2, by - hh - 3), (x + w / 2 - 6, by - hh - 16), (x + w / 2 + 6, by - hh - 28), (x + w / 2 - 3, by - hh - 42)], sw=.8, op=.45, a=1.5)
                     + "".join(self.ln(x + w * .6, by - 26 - k * 7, x + w, by - 30 - k * 7, .5, .5) for k in range(int((hh - 30) / 7))))
        for t in (cx + 50, cx + 78):
            self.add(by + 6, f'<ellipse cx="{t}" cy="{by-30}" rx="14" ry="5" fill="#e2e1db" stroke="{INK}" stroke-width="1.2"/>' +
                     self.path([(t - 14, by - 30), (t - 14, by), (t + 14, by), (t + 14, by - 30)], False, "#d6d5cf", 1.2) +
                     f'<ellipse cx="{t}" cy="{by}" rx="14" ry="5" fill="none" stroke="{INK}" stroke-width="1.2"/>')
        self.add(by + 8, self.path([(cx + 30, by - 18), (cx + 40, by - 18), (cx + 40, by - 6), (cx + 52, by - 6)], sw=1.8) + self.path([(cx - 62, by + 2), (cx - 80, by + 2), (cx - 80, by - 20)], sw=1.8))
        self.rubble(cx + 10, by + 14, 6, 60)
    def lake(self, cx, cy, rx, ry):
        pts = [(cx + rx * (1 + .12 * math.sin(a * 3 + 1)) * math.cos(a), cy + ry * (1 + .15 * math.cos(a * 2)) * math.sin(a)) for a in [i * math.pi / 9 for i in range(18)]]
        g = self.path(pts, True, "#c6cccd", 1.6, .8, 1.2)
        for k in range(7):
            x = cx + self.R.uniform(-rx * .6, rx * .5); y = cy + self.R.uniform(-ry * .5, ry * .5); w = self.R.uniform(14, 34)
            g += self.path([(x, y), (x + w * .3, y - 2), (x + w * .6, y), (x + w, y - 1)], sw=.7, op=.5, a=.6)
        self.items.append((-500, g))
    def road(self, pts, sw=2.6, dash="7 7", band=0):
        d = "M%.1f %.1f " % pts[0] + " ".join("Q%.1f %.1f %.1f %.1f" % (pts[i][0] + self.j(10), pts[i][1] + self.j(10), pts[i + 1][0], pts[i + 1][1]) for i in range(len(pts) - 1))
        g = ""
        if band: g += f'<path d="{d}" fill="none" stroke="#bdbcb4" stroke-width="{band}" stroke-linecap="round" stroke-opacity=".7"/>'
        g += f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{sw}" stroke-opacity=".55" stroke-dasharray="{dash}" stroke-linecap="round"/>' if dash else \
             f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="1" stroke-opacity=".6"/>'
        self.items.append((-400, g))
    def cracks(self, n, box=(20, 20, 610, 765)):
        for _ in range(n):
            x, y = self.R.uniform(box[0], box[2]), self.R.uniform(box[1], box[3]); pts = [(x, y)]
            for _ in range(self.R.randint(3, 5)): x += self.R.uniform(-14, 14); y += self.R.uniform(2, 12); pts.append((x, y))
            self.items.append((-300, self.path(pts, sw=.6, op=.35, a=.5)))

    def ground(self, n, box=(25, 25, 605, 760)):
        for _ in range(n):
            x, y = self.R.uniform(box[0], box[2]), self.R.uniform(box[1], box[3]); w = self.R.uniform(8, 26)
            self.items.append((-350, self.path([(x, y), (x + w * .5, y - 1), (x + w, y + .5)], sw=.7, op=.35, a=.5)))
            if self.R.random() < .4: self.items.append((-350, self.path([(x + 3, y + 4), (x + w * .7, y + 4)], sw=.6, op=.25, a=.4)))

    def save(self, name, extra=""):
        body = "".join(s for _, s in sorted(self.items, key=lambda t: t[0]))
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
<defs>
<filter id="pencil" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.4"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="9"/><feColorMatrix values="0 0 0 0 .25  0 0 0 0 .24  0 0 0 0 .2  0 0 0 .3 0"/></filter>
<radialGradient id="vig" cx="50%" cy="48%" r="75%"><stop offset="55%" stop-color="#6b6755" stop-opacity="0"/><stop offset="100%" stop-color="#6b6755" stop-opacity=".45"/></radialGradient>
</defs>
<rect width="{W}" height="{H}" fill="#dad9d3"/>
<g filter="url(#pencil)">{body}</g>{extra}
<rect width="{W}" height="{H}" fill="url(#vig)"/>
<rect width="{W}" height="{H}" filter="url(#grain)"/>
<rect x="9" y="9" width="{W-18}" height="{H-18}" fill="none" stroke="{INK}" stroke-opacity=".5" stroke-width="1" stroke-dasharray="1.5 3"/>
<rect x="15" y="15" width="{W-30}" height="{H-30}" fill="none" stroke="{INK}" stroke-opacity=".6" stroke-width="1.2"/>
</svg>'''
        os.makedirs("assets", exist_ok=True); open(f"assets/{name}", "w", encoding="utf8").write(svg)

# ================= 세계 지도 =================
def world():
    s = Sketch(21); R = s.R
    s.lake(235, 330, 92, 40)
    s.road([(132, 520), (200, 470), (300, 480), (420, 440), (479, 540)]); s.road([(150, 200), (180, 290), (140, 420)]); s.road([(300, 380), (400, 320), (447, 270)])
    s.cracks(40); s.ground(420)
    s.factory(150, 150)
    for x, y, w, h in [(380, 100, 70, 38), (440, 118, 96, 52), (500, 92, 60, 30), (520, 140, 80, 34), (350, 135, 50, 22), (470, 80, 50, 26), (410, 140, 60, 30), (560, 110, 46, 24)]: s.mountain(x, y, w, h)
    s.forest(35, 225, 235, 330, 46); s.forest(270, 215, 345, 300, 16); s.forest(30, 540, 215, 750, 70, (1, 1.6)); s.forest(210, 640, 320, 735, 16); s.forest(230, 360, 330, 400, 8); s.forest(30, 180, 90, 230, 6)
    for x, y, w, h, rn in [(55, 440, 36, 62, 1), (95, 425, 48, 80, 0), (150, 440, 42, 56, 1), (190, 455, 36, 44, 1), (75, 470, 30, 36, 0), (120, 470, 34, 40, 1), (215, 438, 30, 34, 1)]:
        s.building(x, y, w, h, bool(rn))
    s.building(255, 478, 26, 30, True); s.building(300, 470, 30, 24, True)
    for x, y, w, h, rn in [(350, 215, 34, 52, 1), (390, 225, 28, 40, 1), (425, 205, 40, 70, 1), (470, 235, 36, 118, 0), (512, 245, 28, 64, 0), (550, 260, 34, 80, 1),
                           (440, 290, 40, 36, 1), (490, 295, 34, 30, 1), (535, 305, 30, 26, 1), (395, 285, 30, 30, 1), (580, 280, 26, 56, 1)]:
        s.building(x, y, w, h, bool(rn))
    s.building(332, 200, 40, 34, True)
    cx = 350
    for x, by, w, h in [(380, 560, 90, 70), (440, 610, 80, 60), (300, 490, 60, 40), (470, 460, 70, 56), (520, 560, 80, 90), (560, 640, 90, 75), (420, 680, 70, 50), (350, 650, 55, 42),
                        (520, 470, 60, 50), (580, 530, 50, 40), (340, 560, 40, 34), (500, 650, 70, 60), (400, 500, 50, 36), (360, 610, 60, 46), (560, 700, 70, 52), (460, 720, 80, 58), (300, 700, 56, 40), (440, 530, 64, 50), (545, 600, 56, 44)]: s.mountain(x, by, w, h)
    for _ in range(40): s.rubble(R.uniform(50, 590), R.uniform(330, 720), 3, 18)
    s.forest(270, 520, 330, 560, 6)
    s.save("world-map.svg")

# ================= 구도심 지역 지도 =================
def region():
    s = Sketch(5); R = s.R
    nodes = [(189, 235), (454, 188), (315, 392), (466, 534), (176, 581)]
    roads = [[(30, 330), (200, 345), (400, 320), (610, 335)], [(330, 30), (310, 250), (345, 480), (325, 760)],
             [(40, 150), (200, 300), (330, 380), (480, 640), (600, 740)], [(330, 330), (60, 700)]]
    for r, bw in zip(roads, (34, 34, 26, 22)): s.road(r, band=bw, dash="")
    s.cracks(80); s.ground(300)
    def road_d(x, y):
        best = 999
        for r in roads:
            for (ax, ay), (bx, by) in zip(r, r[1:]):
                dx, dy = bx - ax, by - ay; u = max(0, min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)))
                best = min(best, math.hypot(x - ax - u * dx, y - ay - u * dy))
        return best
    def near_road(x, y): return abs(y - 335) < 32 or abs(x - 325) < 32 or abs((x - 40) * .8 - (y - 150) * .5 * 0 - (y - 150) * .95 + 0) < 0
    gy = 70
    while gy < 745:
        gx = 45
        while gx < 590:
            x, y = gx + R.uniform(-12, 12), gy + R.uniform(-8, 8)
            if road_d(x + 20, y - 20) > 48 and all(math.hypot(x + 20 - nx, y - 20 - ny) > 80 for nx, ny in nodes):
                w, h = R.uniform(28, 50), R.uniform(30, 82)
                s.building(x, y, w, h, R.random() < .55)
            gx += R.uniform(62, 80)
        gy += R.uniform(58, 72)
    s.forest(20, 700, 120, 765, 10); s.forest(520, 60, 610, 120, 8)
    # --- 장소별 고유 건물 ---
    s.building(135, 270, 62, 150, True, win=True); s.building(205, 262, 40, 96, True)          # 폐건물
    s.building(395, 205, 74, 40, False, d=22); s.add(206, s.path([(392, 168), (470, 168), (480, 180), (385, 180)], True, "#c3c2bb", 1.3) + "".join(s.ln(400 + i * 12, 169, 397 + i * 12, 180, .8, .6) for i in range(7)))  # 편의점+차양
    s.house(262, 410, 54, 34); s.house(350, 420, 46, 30)                                          # 주택
    s.building(410, 560, 100, 80, False, d=30); s.building(515, 548, 44, 50, True)                  # 병원
    s.add(561, f'<circle cx="460" cy="500" r="13" fill="#e9e8e3" stroke="{INK}" stroke-width="1.3"/><path d="M455 500h10M460 495v10" stroke="{INK}" stroke-width="2.6"/>')
    stairs = "".join(s.ln(118 + i * 3, 590 + i * 5, 178 - i * 3, 590 + i * 5, .9, .7) for i in range(7))       # 지하철 입구 계단
    s.add(600, s.path([(115, 586), (181, 586), (170, 626), (126, 626)], True, "#8c8b85", 1.4) + stairs + s.path([(112, 584), (112, 560), (184, 560), (184, 584)], sw=1.4) + s.path([(108, 560), (188, 560)], sw=2.4))
    s.save("region-old.svg")

world(); region(); print("ok")
