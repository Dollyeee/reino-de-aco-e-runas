import Phaser from 'phaser';
import { COLORS, DEPTH, LIGHTING } from '../config/visual.js';
import { SHADOWS } from '../config/art.js';
import { addArt, anchor } from './art.js';

// Castelo + Núcleo Arcano (cristal flutuante com escudo de energia).
export default class Castle {
    constructor (scene, pos) {
        this.scene = scene;
        this.x = pos.x;
        this.y = pos.y;

        this.image = addArt(scene, pos.x, pos.y, 'castle').setLighting(true).setDepth(DEPTH.OBJECTS + pos.y);
        const sh = SHADOWS.castle;
        scene.shadows.add(pos.x, pos.y - 6, sh[0], sh[1]);

        const c = anchor('castle', 'core');
        this.coreX = pos.x + c.x;
        this.coreY = pos.y + c.y;
        const coreDepth = DEPTH.OBJECTS + pos.y + 2;

        // halo visível atrás do cristal
        this.halo = scene.add.pointlight(this.coreX, this.coreY, COLORS.cyan, 110, 0.55, 0.06).setDepth(coreDepth - 1);

        // o cristal
        this.crystal = addArt(scene, this.coreX, this.coreY, 'core-crystal').setDepth(coreDepth);
        this.crystalBaseScale = this.crystal.baseScale;
        this.bob = scene.tweens.add({
            targets: this.crystal,
            y: this.coreY - 9,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        this.pulseT = 0;
        this.pulseSpeed = 2.4;
        this.hitSquash = 0;

        Phaser.Actions.AddEffectShine(this.crystal, {
            duration: 1400,
            repeatDelay: 1300,
            radius: 0.22,
            direction: Math.PI * 0.35,
            colorFactor: [1.6, 2.2, 2.2, 1]
        });

        // partículas de energia subindo do cristal
        this.motes = scene.add.particles(this.coreX, this.coreY + 30, 'dot', {
            x: { min: -26, max: 26 },
            speedY: { min: -55, max: -20 },
            speedX: { min: -12, max: 12 },
            lifespan: { min: 900, max: 1500 },
            scale: { start: 0.28, end: 0 },
            alpha: { start: 0.9, end: 0 },
            tint: [COLORS.cyan, COLORS.cyanPale],
            frequency: 110,
            blendMode: 'ADD'
        }).setDepth(coreDepth + 1);

        // escudo de energia (bolha) sobre o castelo
        this.shield = scene.add.image(pos.x, pos.y - 128, 'shield')
            .setBlendMode('ADD')
            .setDisplaySize(310, 285)
            .setAlpha(0.28)
            .setDepth(DEPTH.OBJECTS + pos.y + 4);
        this.shieldBaseAlpha = 0.28;

        // luz dinâmica que ilumina castelo e chão ao redor
        const L = LIGHTING.coreLight;
        this.light = scene.lights.addLight(this.coreX, this.coreY + 90, L.radius, L.color, L.intensity);
        this.lightBase = L.intensity;
        this.healthPct = 1;
    }

    update (dt) {
        this.pulseT += dt * this.pulseSpeed;
        const p = Math.sin(this.pulseT * Math.PI);
        const bs = this.crystalBaseScale;
        let sx = 1 + 0.04 * p, sy = 1 + 0.06 * p;
        if (this.hitSquash > 0) {
            sx += 0.3 * this.hitSquash;
            sy -= 0.25 * this.hitSquash;
            this.hitSquash = Math.max(0, this.hitSquash - dt * 4);
        }
        this.crystal.setScale(bs * sx, bs * sy);
        this.halo.intensity = 0.45 + 0.15 * p;
        this.halo.y = this.crystal.y;
        this.light.intensity = this.lightBase * (0.85 + 0.2 * p);
        this.shield.setAlpha(this.shieldBaseAlpha + 0.05 * p);
    }

    // Núcleo atingido: flash vermelho, achatamento, escudo pisca, câmera treme.
    hit (healthPct) {
        const scene = this.scene;
        this.healthPct = healthPct;
        this.hitSquash = 1;

        this.crystal.setTint(0xff5a6a).setTintMode(Phaser.TintModes.FILL);
        scene.time.delayedCall(120, () => this.crystal.clearTint());

        this.shield.setTint(COLORS.red).setAlpha(0.9);
        scene.tweens.add({
            targets: this.shield,
            alpha: this.shieldBaseAlpha,
            duration: 500,
            ease: 'Quad.easeOut',
            onComplete: () => this.shield.clearTint()
        });

        scene.effects.redSparks.explode(14, this.coreX, this.coreY);
        scene.effects.flashLight(this.coreX, this.coreY + 60, { radius: 260, color: COLORS.red, intensity: 2 }, 400);
        scene.effects.shake(0.008, 220);

        // quanto menos vida, mais nervoso o cristal pulsa e mais quente fica a luz
        this.pulseSpeed = 2.4 + (1 - healthPct) * 5;
        const warm = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(COLORS.cyan),
            Phaser.Display.Color.ValueToColor(COLORS.orange),
            100, Math.round((1 - healthPct) * 100)
        );
        const rgb = Phaser.Display.Color.GetColor(warm.r, warm.g, warm.b);
        this.light.setColor(rgb);
    }

    // Explosão final na derrota.
    shatter () {
        const scene = this.scene;
        scene.effects.plasma.explode(60, this.coreX, this.coreY);
        scene.effects.redSparks.explode(30, this.coreX, this.coreY);
        scene.effects.flash(this.coreX, this.coreY, 0xffffff, 380, 500);
        scene.effects.shake(0.02, 600);
        this.motes.stop();
        this.bob.stop();
        scene.tweens.add({ targets: [this.crystal, this.halo], alpha: 0, scale: 0, duration: 300, ease: 'Back.easeIn' });
        scene.tweens.add({ targets: this.shield, alpha: 0, duration: 400 });
        scene.tweens.add({ targets: this.light, intensity: 0, duration: 800 });
    }
}
