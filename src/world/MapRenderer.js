import { COLORS, DEPTH, LIGHTING } from '../config/visual.js';
import { DECOR, SHADOWS } from '../config/art.js';
import { decorItemFor } from '../config/decor.js';
import { addArt, anchor } from './art.js';

// Chão (pixel art 1× pré-desenhada por `npm run pixel` a partir dos dados do mapa) + decoração.
export default class MapRenderer {
    constructor (scene, map, track, shadows) {
        this.scene = scene;
        this.map = map;
        this.track = track;
        this.shadows = shadows;
        this.decorations = [];
    }

    build () {
        this.ground = addArt(this.scene, 0, 0, this.map.ground)
            .setDepth(DEPTH.GROUND)
            .setLighting(true);
        this.checkGround();
        this.placeDecorations();
        return this;
    }

    // O chão é desenhado a partir de src/data/map01.js; se o caminho mudou sem rodar `npm run pixel`,
    // o desenho não bate mais com o caminho dos inimigos.
    checkGround () {
        const meta = this.scene.cache.json.get(`${this.map.ground}:meta`);
        if (!meta) { return; }
        const m = this.map;
        const same = JSON.stringify(meta.path) === JSON.stringify(m.path) &&
            meta.pathWidth === m.pathWidth && meta.cornerRadius === m.cornerRadius;
        if (!same) {
            console.warn(`[arte] o chão "${this.map.ground}" foi desenhado com outro caminho: rode \`npm run pixel\`.`);
        }
    }

    placeDecorations () {
        if (DECOR) { this.placeKitDecorations(); return; }
        const scene = this.scene;
        for (const d of this.map.decorations) {
            if (d.kitOnly) { continue; }   // arbustos e elemento temático só existem nos kits de pixel art
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

    // Kit de pixel art (DECOR_KIT): cada decoração vira o item do kit (tamanho escolhido pela escala antiga),
    // em 1× e sem balanço/escala (regras de pixel art); sombra = elipse de pixels do item; cristais emitem luz.
    placeKitDecorations () {
        const scene = this.scene;
        for (const d of this.map.decorations) {
            const item = decorItemFor(d);
            if (!item) { continue; }
            const def = DECOR.items[item];
            const img = addArt(scene, d.x, d.y, `decor-${item}`).setDepth(DEPTH.OBJECTS + d.y);
            this.shadows.add(d.x, d.y, def.shadow[0], def.shadow[1], { pixel: true });
            if (item !== 'cristal') {
                img.setLighting(true);
            } else {
                // cristais emitem luz própria: sem iluminação de cena, halo e luz pulsando (só o brilho pulsa)
                const gx = d.x + def.glow.x, gy = d.y + def.glow.y;
                const halo = scene.add.pointlight(gx, gy, COLORS.cyan, def.frame[0] * 0.8, 0.3, 0.08)
                    .setDepth(DEPTH.OBJECTS + d.y + 1);
                scene.tweens.add({
                    targets: halo, intensity: { from: 0.18, to: 0.4 },
                    duration: 1400 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
                if (d.light) {
                    const L = LIGHTING.crystalLight;
                    const light = scene.lights.addLight(gx, gy + 20, L.radius, L.color, L.intensity);
                    scene.tweens.add({
                        targets: light, intensity: { from: L.intensity * 0.6, to: L.intensity * 1.2 },
                        duration: 1400 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                    });
                }
            }
            this.decorations.push(img);
        }
    }
}
