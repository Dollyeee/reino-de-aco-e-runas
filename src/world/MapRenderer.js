import { COLORS, DEPTH, LIGHTING, RENDER_SCALE, WORLD } from '../config/visual.js';
import { SHADOWS } from '../config/art.js';
import { addArt, anchor } from './art.js';

const hex = (c) => '#' + c.toString(16).padStart(6, '0');

function rng (seed) {
    return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// Desenha o chão (grama + caminho de terra) numa textura estática e posiciona a decoração.
export default class MapRenderer {
    constructor (scene, map, track, shadows) {
        this.scene = scene;
        this.map = map;
        this.track = track;
        this.shadows = shadows;
        this.decorations = [];
    }

    build () {
        const key = `ground-${this.map.name}`;
        if (!this.scene.textures.exists(key)) {
            this.paintGround(key);
        }
        this.ground = this.scene.add.image(0, 0, key)
            .setOrigin(0, 0)
            .setScale(1 / RENDER_SCALE)
            .setDepth(DEPTH.GROUND)
            .setLighting(true);

        this.placeDecorations();
        return this;
    }

    paintGround (key) {
        const W = WORLD.width, H = WORLD.height, S = RENDER_SCALE;
        const tex = this.scene.textures.createCanvas(key, W * S, H * S);
        const ctx = tex.getContext();
        ctx.scale(S, S);
        const rand = rng(1337);
        const pts = this.track.points;
        const pw = this.map.pathWidth;

        // --- grama
        ctx.fillStyle = hex(COLORS.grass);
        ctx.fillRect(0, 0, W, H);

        for (let i = 0; i < 70; i++) {
            const x = rand() * W, y = rand() * H;
            const r = 30 + rand() * 70;
            ctx.fillStyle = rand() < 0.5 ? hex(COLORS.grassDark) : hex(COLORS.grassLight);
            ctx.globalAlpha = 0.35;
            ctx.beginPath();
            ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // --- caminho de terra (contorno escuro, sombra do lado oposto à luz, base e brilho)
        const strokePath = (width, color, ox = 0, oy = 0, alpha = 1) => {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(ox, oy);
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) { ctx.lineTo(pts[i].x, pts[i].y); }
            ctx.stroke();
            ctx.restore();
        };
        strokePath(pw + 22, hex(COLORS.grassDark), 5, 5, 0.6);       // grama sombreada ao redor
        strokePath(pw + 10, hex(COLORS.dirtOutline));                 // contorno grosso
        strokePath(pw, hex(COLORS.dirtDark));                         // lado escuro (baixo/direita)
        strokePath(pw - 10, hex(COLORS.dirt), -2, -3);                // cor base
        strokePath(pw * 0.32, hex(COLORS.dirtLight), -5, -7, 0.7);    // brilho (cima/esquerda)

        // pedrinhas no caminho
        for (let i = 0; i < pts.length; i += 3) {
            if (rand() > 0.45) { continue; }
            const p = pts[i];
            const ox = (rand() - 0.5) * (pw - 18), oy = (rand() - 0.5) * (pw - 18);
            const r = 2 + rand() * 3.5;
            ctx.fillStyle = rand() < 0.5 ? hex(COLORS.stone) : hex(COLORS.stoneLight);
            ctx.strokeStyle = hex(COLORS.dirtOutline);
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.ellipse(p.x + ox, p.y + oy, r * 1.3, r, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // --- tufos de grama e flores (evitando o caminho)
        const tuft = (x, y, s) => {
            ctx.strokeStyle = hex(COLORS.grassBlade);
            ctx.lineWidth = 2.4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - 5 * s, y); ctx.quadraticCurveTo(x - 6 * s, y - 6 * s, x - 9 * s, y - 10 * s);
            ctx.moveTo(x, y); ctx.quadraticCurveTo(x, y - 8 * s, x + 1 * s, y - 13 * s);
            ctx.moveTo(x + 5 * s, y); ctx.quadraticCurveTo(x + 6 * s, y - 6 * s, x + 9 * s, y - 9 * s);
            ctx.stroke();
            ctx.strokeStyle = hex(COLORS.grassLight);
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(x - 1 * s, y - 2 * s); ctx.quadraticCurveTo(x - 1 * s, y - 7 * s, x, y - 11 * s);
            ctx.stroke();
        };
        for (let i = 0; i < 260; i++) {
            const x = rand() * W, y = rand() * H;
            if (this.track.distanceTo(x, y) < pw / 2 + 10) { continue; }
            tuft(x, y, 0.8 + rand() * 0.6);
        }
        const flowerColors = COLORS.flowers.map(hex);
        for (let i = 0; i < 45; i++) {
            const x = rand() * W, y = rand() * H;
            if (this.track.distanceTo(x, y) < pw / 2 + 10) { continue; }
            ctx.fillStyle = flowerColors[Math.floor(rand() * flowerColors.length)];
            ctx.strokeStyle = hex(COLORS.outline);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, 2.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // --- circuitos rúnicos ciano gravados no chão, levando energia ao castelo
        const c = this.map.castle;
        const traces = [
            [[c.x - 150, c.y - 250], [c.x - 150, c.y - 200], [c.x - 110, c.y - 200]],
            [[c.x + 40, c.y + 70], [c.x + 40, c.y + 160], [c.x - 40, c.y + 160]],
            [[c.x - 250, c.y - 60], [c.x - 200, c.y - 60], [c.x - 200, c.y - 20]]
        ];
        for (const tr of traces) {
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.strokeStyle = hex(COLORS.outline);
            ctx.lineWidth = 6;
            ctx.beginPath();
            tr.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            ctx.stroke();
            ctx.strokeStyle = hex(COLORS.cyan);
            ctx.lineWidth = 2.5;
            ctx.stroke();
            for (const [x, y] of [tr[0], tr[tr.length - 1]]) {
                ctx.fillStyle = hex(COLORS.cyan);
                ctx.strokeStyle = hex(COLORS.outline);
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, 4.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }

        tex.refresh();
    }

    placeDecorations () {
        const scene = this.scene;
        for (const d of this.map.decorations) {
            const img = addArt(scene, d.x, d.y, d.type, d.scale).setLighting(true);
            img.setDepth(DEPTH.OBJECTS + d.y);
            const sh = SHADOWS[d.type];
            if (sh) { this.shadows.add(d.x, d.y, sh[0] * d.scale, sh[1] * d.scale); }

            if (d.type === 'tree') {
                // leve balanço ao vento
                scene.tweens.add({
                    targets: img,
                    angle: { from: -1.5, to: 1.5 },
                    scaleY: img.baseScale * 1.02,
                    duration: 1800 + Math.random() * 900,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                    delay: Math.random() * 1000
                });
            }

            if (d.type === 'crystal-cluster') {
                img.setLighting(false); // cristais emitem luz própria
                const g = anchor('crystal-cluster', 'glow');
                const gx = d.x + g.x * d.scale, gy = d.y + g.y * d.scale;
                const halo = scene.add.pointlight(gx, gy, COLORS.cyan, 70 * d.scale, 0.35, 0.08)
                    .setDepth(DEPTH.OBJECTS + d.y + 1);
                scene.tweens.add({
                    targets: halo,
                    intensity: { from: 0.2, to: 0.45 },
                    duration: 1400 + Math.random() * 600,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
                scene.tweens.add({
                    targets: img,
                    scaleY: img.baseScale * 1.05,
                    scaleX: img.baseScale * 0.97,
                    duration: 1100 + Math.random() * 500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
                if (d.light) {
                    const L = LIGHTING.crystalLight;
                    const light = scene.lights.addLight(gx, gy + 20, L.radius * d.scale, L.color, L.intensity);
                    scene.tweens.add({
                        targets: light,
                        intensity: { from: L.intensity * 0.6, to: L.intensity * 1.2 },
                        duration: 1400 + Math.random() * 600,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
            }
            this.decorations.push(img);
        }
    }
}
