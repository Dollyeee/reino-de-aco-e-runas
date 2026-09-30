import Phaser from 'phaser';
import { COLORS, DEPTH } from '../config/visual.js';
import { SHADOWS } from '../config/art.js';
import { addArt } from '../world/art.js';

// Distância entre o centro da face de cima da plataforma e a base da torre.
export const PLATFORM_OFFSET = 10;

// Torre base. (x, y) é o ponto escolhido no mapa = centro da plataforma rúnica.
// Estrutura:
//   Tower (Container no chão)  → escala usada para squash/stretch (construção, disparo)
//     └─ rig (Container)       → scaleX = ±1 para virar de lado; filhos = arte da torre
//   platform / platformGlow    → plataforma rúnica no chão (faz parte da torre, mas fica na camada do chão)
//   hitZone                    → área de clique para abrir o painel de informações
export default class Tower extends Phaser.GameObjects.Container {
    constructor (scene, x, y, type, stats, shadowKey) {
        super(scene, x, y + PLATFORM_OFFSET);
        scene.add.existing(this);

        this.placeX = x;
        this.placeY = y;
        this.footprint = stats.footprintRadius;
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

        // plataforma rúnica embaixo da torre
        const psh = SHADOWS['build-slot'];
        this.platformShadow = scene.add.image(x + 6, y + 16, 'shadow').setDisplaySize(psh[0] + 12, psh[1] + 4).setAlpha(0.3).setDepth(DEPTH.DECAL);
        this.platform = addArt(scene, x, y, 'build-slot').setLighting(true).setDepth(DEPTH.DECAL + 1);
        this.platformGlow = scene.add.image(x, y, 'ring')
            .setBlendMode('ADD').setTint(COLORS.cyan).setDisplaySize(66, 24).setAlpha(0.35)
            .setDepth(DEPTH.DECAL + 2);
        scene.tweens.add({
            targets: this.platformGlow,
            alpha: { from: 0.2, to: 0.5 },
            duration: 1300 + Math.random() * 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.hitZone = scene.add.zone(x, y - 45, 100, 130).setInteractive({ useHandCursor: true });
        this.hitZone.on('pointerdown', () => scene.onTowerClicked(this));
    }

    // A plataforma surge do chão; em seguida a torre cai do céu, achata ao tocar a plataforma e volta com elasticidade.
    playBuildAnimation () {
        const scene = this.scene;
        const groundY = this.y;
        const PLATFORM_MS = 220;

        const pbs = this.platform.baseScale;
        this.platform.setScale(pbs * 0.2, pbs * 0.1).setAlpha(0);
        this.platformShadow.setAlpha(0);
        scene.tweens.add({ targets: this.platform, scaleX: pbs, scaleY: pbs, alpha: 1, duration: PLATFORM_MS, ease: 'Back.easeOut' });
        scene.tweens.add({ targets: this.platformShadow, alpha: 0.3, duration: PLATFORM_MS });
        scene.effects.flash(this.placeX, this.placeY, COLORS.cyan, 90, 260, DEPTH.DECAL + 3);
        scene.effects.dust.explode(8, this.placeX, this.placeY + 4);

        this.y = groundY - 140;
        this.setScale(0.75, 1.35);
        this.setAlpha(0);
        this.shadow.setScale(0.2);

        scene.tweens.add({ targets: this.shadow, scaleX: this.shadow.scaleX * 5, scaleY: this.shadow.scaleY * 5, delay: PLATFORM_MS, duration: 260, ease: 'Quad.easeIn' });
        scene.tweens.chain({
            targets: this,
            delay: PLATFORM_MS,
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
        scene.time.delayedCall(PLATFORM_MS + 270, () => sh.setDisplaySize(sh.baseW, sh.baseH));
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
        this.platformShadow.destroy();
        this.platform.destroy();
        this.platformGlow.destroy();
        this.hitZone.destroy();
        this.destroy();
    }
}
