import { COLORS, DEPTH } from '../config/visual.js';
import { DECOR_FORCE, mapDecorKit } from '../config/art.js';
import { decorFor } from '../config/decor.js';
import { addArt } from './art.js';

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

    // Decoração em pixel art (kits de src/config/decor.js): kit base do mapa + `kit` por item (transições).
    // 1×, sem balanço nem escala (regras de pixel art); sombra = elipse de pixels do item.
    // Ciano da decoração sempre mais fraco que o de gameplay: tudo recebe a luz do cenário (os veios emissivos
    // escurecem junto) e os cristais só ganham um halo fraco — nenhuma luz dinâmica.
    placeDecorations () {
        const scene = this.scene;
        const baseKit = mapDecorKit(this.map);
        for (const d of this.map.decorations) {
            const dec = decorFor(d, baseKit, DECOR_FORCE);
            if (!dec) { console.warn(`[arte] decoração desconhecida em ${this.map.name}: ${JSON.stringify(d)}`); continue; }
            const def = dec.def;
            const img = addArt(scene, d.x, d.y, dec.key).setLighting(true).setDepth(DEPTH.OBJECTS + d.y);
            this.shadows.add(d.x, d.y, def.shadow[0], def.shadow[1], { pixel: true });
            if (def.glow) {
                const halo = scene.add.pointlight(d.x + def.glow.x, d.y + def.glow.y, COLORS.cyan, def.frame[0] * 0.5, 0.06, 0.1)
                    .setDepth(DEPTH.OBJECTS + d.y + 1);
                scene.tweens.add({
                    targets: halo, intensity: { from: 0.04, to: 0.09 },
                    duration: 1400 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
            this.decorations.push(img);
        }
    }
}
