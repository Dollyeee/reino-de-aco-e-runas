import Phaser from 'phaser';
import { DEPTH } from '../config/visual.js';
import { SHADOWS } from '../config/art.js';

// Distância entre o centro da face de cima da plataforma e a base da torre.
export const SLOT_GROUND_OFFSET = 10;

// Torre base. Estrutura:
//   Tower (Container no chão)  → escala usada para squash/stretch (construção, disparo)
//     └─ rig (Container)       → scaleX = ±1 para virar de lado; filhos = arte da torre
export default class Tower extends Phaser.GameObjects.Container {
    constructor (scene, slot, type, stats, shadowKey) {
        super(scene, slot.x, slot.y + SLOT_GROUND_OFFSET);
        scene.add.existing(this);

        this.slot = slot;
        this.type = type;
        this.stats = stats;
        this.cooldown = 0;
        this.target = null;
        this.ready = false;

        this.rig = new Phaser.GameObjects.Container(scene, 0, 0);
        this.add(this.rig);

        const sh = SHADOWS[shadowKey] || [80, 28];
        this.shadow = scene.shadows.add(this.x, this.y - 4, sh[0], sh[1]);
        this.setDepth(DEPTH.OBJECTS + this.y);
    }

    // Cai do céu, achata ao tocar a plataforma e volta com elasticidade.
    playBuildAnimation () {
        const scene = this.scene;
        const groundY = this.y;
        this.y = groundY - 140;
        this.setScale(0.75, 1.35);
        this.setAlpha(0);
        this.shadow.setScale(0.2);

        scene.tweens.add({ targets: this.shadow, scaleX: this.shadow.scaleX * 5, scaleY: this.shadow.scaleY * 5, duration: 260, ease: 'Quad.easeIn' });
        scene.tweens.chain({
            targets: this,
            tweens: [
                { y: groundY, alpha: 1, duration: 260, ease: 'Quad.easeIn' },
                {
                    scaleX: 1.3, scaleY: 0.68, duration: 80, ease: 'Quad.easeOut',
                    onStart: () => scene.effects.buildPuff(this.x, groundY)
                },
                { scaleX: 1, scaleY: 1, duration: 650, ease: 'Elastic.easeOut', easeParams: [1.2, 0.35] }
            ],
            onComplete: () => { this.ready = true; }
        });
        // corrige a sombra ao tamanho final
        const sh = this.shadow;
        scene.time.delayedCall(270, () => sh.setDisplaySize(sh.baseW, sh.baseH));
    }

    // Squash rápido do corpo todo (disparo).
    kick (sx = 1.12, sy = 0.88, duration = 420) {
        this.scene.tweens.killTweensOf(this);
        this.setScale(sx, sy);
        this.scene.tweens.add({ targets: this, scaleX: 1, scaleY: 1, duration, ease: 'Elastic.easeOut', easeParams: [1.1, 0.4] });
    }

    // Alvo = inimigo mais avançado no caminho dentro do alcance.
    acquireTarget (range, minRange = 0) {
        let best = null;
        for (const e of this.scene.enemies) {
            if (!e.alive) { continue; }
            const d = Math.hypot(e.x - this.x, e.y - this.y);
            if (d <= range && d >= minRange && (!best || e.distance > best.distance)) {
                best = e;
            }
        }
        return best;
    }

    update (dt) {
        this.cooldown -= dt * 1000;
    }

    getInfo () {
        return { type: this.type, stats: this.stats };
    }

    destroyAll () {
        this.shadow.destroy();
        this.destroy();
    }
}
