// Script da página escolha-torres.html (T19), embutido pelo gerador. Recebe DATA (torres, ângulos, cena).
// Cada versão tem 4 canvases: parado 1×, animado 1× (materialização → mira/recuo ou arremesso), animado 4× e parado 4×.
// A cena é desenhada em 1× num canvas fora da tela e copiada ampliada (pixels inteiros, sem suavização).
/* global DATA */

const IMG = {};
function load (src) {
    if (!IMG[src]) { IMG[src] = new Image(); IMG[src].src = src; }
    return IMG[src];
}

// versão em ciano (holograma da materialização), feita uma vez por imagem
const HOLO = new Map();
function holo (img) {
    if (!img.complete || !img.width) { return img; }
    if (HOLO.has(img)) { return HOLO.get(img); }
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = '#3ff5ff';
    x.fillRect(0, 0, c.width, c.height);
    HOLO.set(img, c);
    return c;
}

const S = DATA.scene;
const easeBackOut = (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const phase = (t, r) => clamp((t - r[0]) / (r[1] - r[0]), 0, 1);

function nearest (angles, a) {
    let best = 0;
    angles.forEach((v, i) => { if (Math.abs(v - a) < Math.abs(angles[best] - a)) { best = i; } });
    return best;
}
function headFrame (aim) {
    let a = Math.atan2(Math.sin(aim), Math.cos(aim)), flip = false;
    if (Math.cos(a) < 0) { a = Math.PI - a; flip = true; }
    a = Math.atan2(Math.sin(a), Math.cos(a));
    const i = nearest(DATA.headAngles, a);
    return { i, flip, angle: DATA.headAngles[i] };
}
const armFrame = (rot) => nearest(DATA.armAngles, rot);
const rot = (p, a) => ({ x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a) });

// sprite com pivot; flip espelha em volta do pivot; clip (0..1) mostra só a faixa de baixo para cima
function sprite (ctx, img, sx, sw, sh, px, py, x, y, flip = false, alpha = 1, band = null) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(Math.round(x), Math.round(y));
    if (flip) { ctx.scale(-1, 1); }
    let y0 = 0, h = sh;
    if (band) { const lo = Math.round(sh * band[0]), hi = Math.round(sh * band[1]); y0 = sh - hi; h = hi - lo; }
    if (h > 0) { ctx.drawImage(img, sx, y0, sw, h, -px, -py + y0, sw, h); }
    ctx.restore();
}

function pixelEllipse (ctx, cx, cy, w, h, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            const nx = (i + 0.5 - w / 2) / (w / 2), ny = (j + 0.5 - h / 2) / (h / 2);
            if (nx * nx + ny * ny <= 1) { ctx.fillRect(Math.round(cx - w / 2) + i, Math.round(cy - h / 2) + j, 1, 1); }
        }
    }
    ctx.restore();
}

// ------------------------------------------------------------------ estado de uma torre animada
function makeSim (tw) {
    return { aim: -0.35, cooldown: 0, recoil: { x: 0, y: 0 }, recoilT: -1, bolts: [], arm: tw.rest, throwT: -1, loaded: true, reloadT: 0, balls: [], booms: [], facing: 1 };
}

function orcAt (t) {
    const x = -60 + ((t * S.orcSpeed) % (S.w + 120));
    return { x, y: S.pathY, frame: Math.floor(t * 10) % 8 };
}

function drawTower (ctx, tw, sim, T, still) {
    const B = tw.base, P = tw.piece;
    const X = S.tower.x, Y = S.tower.y;
    const f = still ? 1 : phase(T, [0, 0.9]);        // materialização (s)
    const F = DATA.buildFx;
    const u = f;                                     // fração da construção
    const flip = sim.facing < 0;
    const imgB = load(B.src), imgP = load(P.src);
    // sombra
    pixelEllipse(ctx, X + 7, Y - 4 + 4, tw.shadow[0], tw.shadow[1], 'rgb(30,14,40)', 0.28 * (still ? 1 : phase(u, F.base)));
    // runas
    if (!still && u < 1) {
        const r = phase(u, F.runes), fade = 1 - phase(u, F.finale);
        ctx.save();
        ctx.translate(X, Y - 10);
        ctx.scale(1, F.runeFlatten);
        ctx.rotate(u * F.runeSpin);
        ctx.strokeStyle = `rgba(63,245,255,${0.9 * r * fade})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.arc(0, 0, F.runeRadius * (0.6 + 0.4 * easeBackOut(r)), 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, F.runeRadius * 0.62, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    }
    // base: sólida atrás da varredura, faixa de holograma na frente
    const b = still ? 1 : phase(u, F.base);
    const lag = F.scanLag / B.h;
    const solid = b <= 0 ? 0 : (b >= 1 ? 1 : Math.max(0, b - lag));
    const kick = sim.kick > 0 ? 1 : 0;
    sprite(ctx, imgB, 0, B.w, B.h, B.px, B.py, X, Y + kick, flip, 1, [0, solid]);
    if (b > 0 && b < 1) {
        sprite(ctx, holo(imgB), 0, B.w, B.h, B.px, B.py, X, Y, flip, 0.6, [solid, b]);
        ctx.fillStyle = 'rgba(232,254,255,0.9)';
        ctx.fillRect(X - B.w * 0.55, Math.round(Y - B.h * b), B.w * 1.1, 2);
    }
    // peça de cima: desce e encaixa
    const sp = still ? 1 : phase(u, F.snap);
    if (sp <= 0) { return; }
    const lift = Math.round(F.snapLift * (1 - easeBackOut(sp)));
    const snapped = sp >= 1;
    const mx = X + (flip ? -tw.mount.x : tw.mount.x), my = Y + tw.mount.y - lift + kick + (tw.float && snapped ? Math.round(Math.sin(T * 1.8) * tw.float) : 0);
    const pimg = snapped ? imgP : holo(imgP);
    const alpha = snapped ? 1 : Math.min(1, sp * 4) * 0.6;
    if (tw.kind === 'besta') {
        const hf = headFrame(sim.aim);
        sprite(ctx, pimg, hf.i * P.w, P.w, P.h, P.px, P.py, mx + sim.recoil.x, my + sim.recoil.y, hf.flip, alpha);
        // brilho do cristal
        const c = rot(tw.crystal, hf.angle);
        const gx = mx + (hf.flip ? -c.x : c.x) + sim.recoil.x, gy = my + c.y + sim.recoil.y;
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 9);
        g.addColorStop(0, `rgba(63,245,255,${0.55 * alpha})`); g.addColorStop(1, 'rgba(63,245,255,0)');
        ctx.fillStyle = g; ctx.fillRect(gx - 10, gy - 10, 20, 20);
    } else {
        const af = armFrame(sim.arm);
        sprite(ctx, pimg, af * P.w, P.w, P.h, P.px, P.py, mx, my, flip, alpha);
        if (sim.loaded && snapped) {
            const o = rot(tw.orb, DATA.armAngles[af]);
            const ox = mx + (flip ? -o.x : o.x), oy = my + o.y;
            ball(ctx, ox, oy);
        }
    }
    if (!still && u >= F.finale[0] && u < 1) {
        ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - phase(u, F.finale))})`;
        ctx.beginPath(); ctx.arc(X, Y - B.h * 0.6, 26, 0, Math.PI * 2); ctx.fill();
    }
}

function ball (ctx, x, y) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, 10);
    g.addColorStop(0, 'rgba(122,252,255,0.8)'); g.addColorStop(1, 'rgba(63,245,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 10, y - 10, 20, 20);
    ctx.fillStyle = '#f2fff0'; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
    ctx.fillStyle = '#3ff5ff'; ctx.fillRect(Math.round(x) - 3, Math.round(y) - 1, 1, 2); ctx.fillRect(Math.round(x) + 2, Math.round(y) - 1, 1, 2);
    ctx.fillRect(Math.round(x) - 1, Math.round(y) - 3, 2, 1); ctx.fillRect(Math.round(x) - 1, Math.round(y) + 2, 2, 1);
}

// passo da simulação (combate) — mesma lógica do jogo, simplificada
function stepSim (tw, sim, T, dt) {
    if (T < 1) { return; }
    const orc = orcAt(T);
    const X = S.tower.x, Y = S.tower.y;
    sim.kick = Math.max(0, (sim.kick || 0) - dt);
    if (tw.kind === 'besta') {
        const px = X + tw.mount.x, py = Y + tw.mount.y;
        const inRange = Math.hypot(orc.x - X, orc.y - Y) < 150 && orc.x > 0 && orc.x < S.w;
        sim.cooldown -= dt;
        if (inRange) {
            const desired = Math.atan2(orc.y - 45 - py, orc.x - px);
            let diff = desired - sim.aim;
            diff = Math.atan2(Math.sin(diff), Math.cos(diff));
            sim.aim += diff * Math.min(1, 14 * dt);
            if (sim.cooldown <= 0 && Math.abs(diff) < 0.35) {
                sim.cooldown = 0.45;
                const hf = headFrame(sim.aim);
                const m = rot(tw.muzzle, hf.angle);
                sim.bolts.push({ x0: px + (hf.flip ? -m.x : m.x), y0: py + m.y, t: 0 });
                sim.recoilT = 0; sim.recoilA = hf.angle * (hf.flip ? -1 : 1) + (hf.flip ? Math.PI : 0);
                sim.kick = 0.09;
            }
        }
        if (sim.recoilT >= 0) {
            sim.recoilT += dt;
            const k = sim.recoilT < 0.07 ? 1 : (sim.recoilT < 0.15 ? 0.5 : 0);
            const a = sim.recoilA;
            sim.recoil = { x: Math.round(-Math.cos(a) * 3 * k), y: Math.round(-Math.sin(a) * 3 * k) };
            if (k === 0) { sim.recoilT = -1; }
        }
        sim.bolts.forEach((b) => { b.t += dt; });
        sim.bolts = sim.bolts.filter((b) => b.t < 0.12);
        sim.target = orc;
    } else {
        sim.facing = orc.x < X ? -1 : 1;
        sim.cooldown -= dt;
        if (sim.cooldown <= 0 && sim.loaded && orc.x > 20 && orc.x < S.w - 20) {
            sim.cooldown = 2; sim.throwT = 0;
        }
        if (sim.throwT >= 0) {
            sim.throwT += dt;
            const t = sim.throwT;
            if (t < 0.17) { sim.arm = tw.rest + (tw.windup - tw.rest) * Math.sin((t / 0.17) * Math.PI / 2); }
            else if (t < 0.28) {
                sim.arm = tw.windup + (tw.throwA - tw.windup) * Math.pow((t - 0.17) / 0.11, 3);
            } else if (t < 0.8) {
                if (sim.loaded) {
                    sim.loaded = false; sim.reloadT = 1.1; sim.kick = 0.09;
                    const af = armFrame(tw.throwA), o = rot(tw.cup, DATA.armAngles[af]);
                    const sx = X + tw.mount.x * sim.facing + o.x * sim.facing, sy = Y + tw.mount.y + o.y;
                    sim.balls.push({ sx, sy, tx: orc.x + S.orcSpeed * 0.9, ty: orc.y, t: 0 });
                }
                const q = (t - 0.28) / 0.52;
                sim.arm = tw.throwA + (tw.rest - tw.throwA) * easeBackOut(q, 1.4);
            } else { sim.arm = tw.rest; sim.throwT = -1; }
        }
        if (!sim.loaded) { sim.reloadT -= dt; if (sim.reloadT <= 0) { sim.loaded = true; } }
        sim.balls.forEach((b) => { b.t += dt / 0.9; });
        sim.balls.filter((b) => b.t >= 1).forEach((b) => sim.booms.push({ x: b.tx, y: b.ty, t: 0 }));
        sim.balls = sim.balls.filter((b) => b.t < 1);
        sim.booms.forEach((b) => { b.t += dt; });
        sim.booms = sim.booms.filter((b) => b.t < 0.35);
    }
}

function drawEffects (ctx, tw, sim) {
    for (const b of sim.bolts) {
        const o = sim.target, k = Math.min(1, b.t / 0.1);
        const x = b.x0 + (o.x - b.x0) * k, y = b.y0 + (o.y - 45 - b.y0) * k;
        ctx.strokeStyle = '#a8fcf0'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - (o.x - b.x0) * 0.08, y - (o.y - 45 - b.y0) * 0.08); ctx.lineTo(x, y); ctx.stroke();
    }
    for (const b of sim.balls) {
        const x = b.sx + (b.tx - b.sx) * b.t;
        const y = b.sy + (b.ty - b.sy) * b.t - 4 * 90 * b.t * (1 - b.t);
        ball(ctx, x, y);
    }
    for (const e of sim.booms) {
        const r = 10 + e.t * 110;
        ctx.strokeStyle = `rgba(122,252,255,${1 - e.t / 0.35})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(e.x, e.y - 4, r, r * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
    }
}

function drawScene (ctx, tw, sim, T, still) {
    const ground = load(S.ground);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(ground, S.crop.x, S.crop.y, S.w, S.h, 0, 0, S.w, S.h);
    const items = [];
    for (const d of S.decor) {
        items.push({ y: d.y, draw: () => { pixelEllipse(ctx, d.x + 7, d.y + 4, d.shadow[0], d.shadow[1], 'rgb(30,14,40)', 0.28); sprite(ctx, load(d.src), 0, d.w, d.h, d.px, d.py, d.x, d.y); } });
    }
    items.push({ y: S.tower.y, draw: () => drawTower(ctx, tw, sim, T, still) });
    const orc = still ? { x: S.orcIdle.x, y: S.pathY, frame: 0 } : orcAt(T);
    items.push({ y: orc.y, draw: () => {
        pixelEllipse(ctx, orc.x + 7, orc.y + 4, S.orc.shadow[0], S.orc.shadow[1], 'rgb(30,14,40)', 0.28);
        sprite(ctx, load(still ? S.orc.idle : S.orc.walk), still ? 0 : orc.frame * S.orc.w, S.orc.w, S.orc.h, S.orc.px, S.orc.py, orc.x, orc.y);
    } });
    items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());
    if (!still) { drawEffects(ctx, tw, sim); }
}

// ------------------------------------------------------------------ montagem
const cells = [];
for (const cv of document.querySelectorAll('canvas[data-tw]')) {
    const tw = DATA.towers[cv.dataset.tw];
    const zoom = +cv.dataset.zoom, still = cv.dataset.mode === 'still';
    const crop = zoom > 1 ? tw.crop : { x: 0, y: 0, w: S.w, h: S.h };
    cv.width = crop.w * zoom; cv.height = crop.h * zoom;
    const off = document.createElement('canvas'); off.width = S.w; off.height = S.h;
    cells.push({ cv, tw, zoom, still, crop, off, sim: makeSim(tw) });
}

const LOOP = 9;
let last = performance.now(), T0 = last;
function frame (now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const T = ((now - T0) / 1000) % LOOP;
    for (const c of cells) {
        if (!c.still) {
            if (T < c.lastT) { c.sim = makeSim(c.tw); }   // recomeça o ciclo (materialização de novo)
            stepSim(c.tw, c.sim, T, dt);
        }
        c.lastT = T;
        const o = c.off.getContext('2d');
        drawScene(o, c.tw, c.sim, T, c.still);
        const x = c.cv.getContext('2d');
        x.imageSmoothingEnabled = false;
        x.drawImage(c.off, c.crop.x, c.crop.y, c.crop.w, c.crop.h, 0, 0, c.crop.w * c.zoom, c.crop.h * c.zoom);
    }
    requestAnimationFrame(frame);
}
// pede todas as imagens antes do primeiro quadro e só começa quando carregarem
for (const tw of Object.values(DATA.towers)) { load(tw.base.src); load(tw.piece.src); }
for (const d of S.decor) { load(d.src); }
load(S.ground); load(S.orc.walk); load(S.orc.idle);
Promise.all(Object.values(IMG).map((i) => (i.complete ? Promise.resolve() : new Promise((r) => { i.onload = r; i.onerror = r; }))))
    .then(() => requestAnimationFrame(frame));
