import Phaser from 'phaser';
import { COLORS, DEPTH, LIGHTING } from '../config/visual.js';
import { addArt, numberStyle } from '../world/art.js';

const MAX_DYNAMIC_LIGHTS = 24;

// Todos os efeitos visuais "descartáveis": partículas, luzes temporárias,
// números de dano, ondas de choque e tremidas de câmera.
export default class Effects {
    constructor (scene) {
        this.scene = scene;
        this.activeLights = 0;

        const add = (key, cfg) => scene.add.particles(0, 0, key, Object.assign({ emitting: false }, cfg)).setDepth(DEPTH.FX);

        this.sparks = add('spark', {
            lifespan: { min: 180, max: 420 },
            speed: { min: 90, max: 300 },
            scale: { start: 0.55, end: 0 },
            rotate: { min: 0, max: 360 },
            tint: [0xffffff, COLORS.cyan, COLORS.cyanPale],
            blendMode: 'ADD'
        });
        this.redSparks = add('spark', {
            lifespan: { min: 200, max: 450 },
            speed: { min: 80, max: 260 },
            scale: { start: 0.6, end: 0 },
            rotate: { min: 0, max: 360 },
            tint: [0xffffff, COLORS.red, 0xff9aa6],
            blendMode: 'ADD'
        });
        this.plasma = add('dot', {
            lifespan: { min: 320, max: 680 },
            speed: { min: 50, max: 280 },
            scale: { start: 0.95, end: 0 },
            color: [0xffffff, 0x9ffcff, COLORS.cyan, 0x1d6fd6],
            colorEase: 'Quad.easeOut',
            blendMode: 'ADD'
        });
        this.fire = add('dot', {
            lifespan: { min: 280, max: 600 },
            speed: { min: 40, max: 230 },
            scale: { start: 0.85, end: 0 },
            color: [0xffffff, 0xffe27a, COLORS.orange, COLORS.red],
            colorEase: 'Quad.easeOut',
            blendMode: 'ADD'
        });
        this.debris = add('chunk', {
            lifespan: { min: 600, max: 950 },
            speed: { min: 140, max: 330 },
            angle: { min: 200, max: 340 },
            gravityY: 900,
            scale: { min: 0.45, max: 0.95 },
            rotate: { start: 0, end: 540 },
            tint: [0x5a5e65, 0x6c7547, 0x3b3e44, 0x7a4a2c, 0x4a5130],
            alpha: { start: 1, end: 0.6 }
        });
        this.dust = add('dot', {
            lifespan: { min: 380, max: 620 },
            speed: { min: 20, max: 70 },
            scale: { start: 0.35, end: 1.0 },
            alpha: { start: 0.55, end: 0 },
            tint: 0xa38f72
        });
        this.dust.setDepth(DEPTH.SHADOW + 1);
        this.embers = add('spark', {
            lifespan: { min: 350, max: 700 },
            speed: { min: 50, max: 190 },
            angle: { min: 200, max: 340 },
            gravityY: 420,
            scale: { start: 0.42, end: 0 },
            rotate: { min: 0, max: 360 },
            tint: [0xffffff, COLORS.orange, 0xff7a2f, COLORS.red],
            blendMode: 'ADD'
        });
        this.trail = add('dot', {
            lifespan: 240,
            speed: { min: 0, max: 12 },
            scale: { start: 0.38, end: 0 },
            alpha: { start: 0.8, end: 0 },
            tint: COLORS.cyan,
            blendMode: 'ADD'
        });
    }

    // ------------------------------------------------------------------ luzes

    // Luz dinâmica que acende e apaga sozinha (ilumina chão, torres e inimigos ao redor).
    flashLight (x, y, cfg, duration = 250, intensityMul = 1) {
        if (this.activeLights >= MAX_DYNAMIC_LIGHTS) { return null; }
        const light = this.scene.lights.addLight(x, y, cfg.radius, cfg.color, cfg.intensity * intensityMul);
        this.activeLights++;
        this.scene.tweens.add({
            targets: light,
            intensity: 0,
            duration,
            ease: 'Quad.easeIn',
            onComplete: () => this.releaseLight(light)
        });
        return light;
    }

    // Luz que acompanha um objeto (ex.: projétil). Devolva com releaseLight().
    acquireLight (x, y, cfg) {
        if (this.activeLights >= MAX_DYNAMIC_LIGHTS) { return null; }
        this.activeLights++;
        return this.scene.lights.addLight(x, y, cfg.radius, cfg.color, cfg.intensity);
    }

    releaseLight (light) {
        if (!light || light._released) { return; }
        light._released = true;
        this.scene.lights.removeLight(light);
        this.activeLights = Math.max(0, this.activeLights - 1);
    }

    // Clarão visível (halo aditivo) que infla e some.
    flash (x, y, color = 0xffffff, size = 60, duration = 160, depth = DEPTH.FX) {
        const img = this.scene.add.image(x, y, 'dot').setBlendMode('ADD').setTint(color).setDepth(depth);
        img.setDisplaySize(size * 0.4, size * 0.4);
        this.scene.tweens.add({
            targets: img,
            displayWidth: size,
            displayHeight: size,
            alpha: 0,
            duration,
            ease: 'Quad.easeOut',
            onComplete: () => img.destroy()
        });
    }

    // Onda de choque achatada no chão (visão 3/4 → elipse).
    shockwave (x, y, radius, color = COLORS.cyan, duration = 380) {
        const ring = this.scene.add.image(x, y, 'ring').setBlendMode('ADD').setTint(color).setDepth(DEPTH.SHADOW + 2);
        ring.setDisplaySize(10, 5);
        this.scene.tweens.add({
            targets: ring,
            displayWidth: radius * 2.2,
            displayHeight: radius * 1.1,
            alpha: { from: 1, to: 0 },
            duration,
            ease: 'Cubic.easeOut',
            onComplete: () => ring.destroy()
        });
    }

    shake (intensity = 0.004, duration = 140) {
        this.scene.cameras.main.shake(duration, intensity);
    }

    // --------------------------------------------------------------- combos

    muzzleFlash (x, y) {
        this.sparks.explode(4, x, y);
        this.flash(x, y, COLORS.cyanPale, 46, 120);
        this.flashLight(x, y, LIGHTING.muzzleLight, 140);
    }

    boltHit (x, y) {
        this.sparks.explode(7, x, y);
        this.flash(x, y, COLORS.cyan, 40, 140);
        this.flashLight(x, y, LIGHTING.boltLight, 160);
    }

    plasmaExplosion (x, y, radius) {
        this.plasma.explode(30, x, y - 10);
        this.sparks.explode(12, x, y - 10);
        this.dust.explode(10, x, y);
        this.flash(x, y - 12, 0xffffff, radius * 1.6, 220);
        this.shockwave(x, y, radius, COLORS.cyan, 420);
        this.flashLight(x, y, { ...LIGHTING.explosionLight, color: COLORS.cyan }, 380, 1.1);
        this.shake(0.005, 150);

        const scorch = this.scene.add.image(x, y, 'scorch').setDepth(DEPTH.DECAL);
        scorch.setDisplaySize(radius * 1.7, radius * 0.85);
        this.scene.tweens.add({ targets: scorch, alpha: 0, delay: 1800, duration: 1500, onComplete: () => scorch.destroy() });
    }

    // Corpo batendo no chão depois do tombo.
    enemyImpact (x, y) {
        this.dust.explode(10, x, y);
        this.debris.explode(3, x, y - 6);
    }

    // Corpo caído se desmanchando em faíscas e destroços ao longo do comprimento.
    enemyDissolve (x, y, facing) {
        for (let i = 0; i < 5; i++) {
            this.embers.explode(4, x + facing * (8 + i * 15), y - 6 - Math.random() * 8);
        }
        const mx = x + facing * 36;
        this.debris.explode(7, mx, y - 8);
        this.flash(mx, y - 8, COLORS.orange, 70, 200);
        this.flashLight(mx, y - 10, LIGHTING.explosionLight, 280, 0.55);
    }

    buildPuff (x, y) {
        this.dust.explode(16, x, y);
        this.sparks.explode(8, x, y - 20);
        this.shockwave(x, y, 55, COLORS.cyan, 380);
        this.flashLight(x, y - 30, LIGHTING.muzzleLight, 350);
    }

    landingDust (x, y, count = 1) {
        this.dust.explode(count, x, y);
    }

    // ------------------------------------------------------------ textos

    damageNumber (x, y, amount, color = '#ffffff', size = 18) {
        const t = this.scene.add.text(x + Phaser.Math.Between(-8, 8), y, `${Math.round(amount)}`, numberStyle(size, color))
            .setOrigin(0.5)
            .setDepth(DEPTH.FLOATING_TEXT)
            .setScale(0.7);
        this.scene.tweens.add({ targets: t, scale: 1, duration: 120, ease: 'Quad.easeOut' });
        this.scene.tweens.add({ targets: t, y: y - 30, duration: 520, ease: 'Cubic.easeOut' });
        this.scene.tweens.add({ targets: t, alpha: 0, delay: 300, duration: 220, onComplete: () => t.destroy() });
    }

    // Cristal de éter que salta do inimigo e voa até o contador do HUD.
    etherGain (x, y, amount, hudX, hudY, onArrive) {
        const label = this.scene.add.text(x, y - 60, `+${amount}`, numberStyle(20, '#5ef0ff'))
            .setOrigin(0.5).setDepth(DEPTH.FLOATING_TEXT).setScale(0);
        this.scene.tweens.add({ targets: label, scale: 1, y: y - 84, duration: 360, ease: 'Back.easeOut' });
        this.scene.tweens.add({ targets: label, alpha: 0, delay: 600, duration: 250, onComplete: () => label.destroy() });

        const gem = addArt(this.scene, x, y - 40, 'icon-ether', 0.5).setDepth(DEPTH.FLOATING_TEXT).setScale(0);
        const s = gem.baseScale;
        this.scene.tweens.chain({
            targets: gem,
            tweens: [
                { scale: s, y: y - 70, duration: 240, ease: 'Back.easeOut' },
                { x: hudX, y: hudY, scale: s * 0.6, angle: 360, duration: 520, ease: 'Cubic.easeIn' }
            ],
            onComplete: () => {
                gem.destroy();
                if (onArrive) { onArrive(); }
            }
        });
    }
}
