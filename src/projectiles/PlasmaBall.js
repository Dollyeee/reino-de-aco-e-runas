import Phaser from 'phaser';
import { COLORS, DEPTH, LIGHTING } from '../config/visual.js';
import { SHADOWS } from '../config/art.js';
import ShadowLayer from '../effects/Shadow.js';
import { addArt } from '../world/art.js';

// Bola de plasma: voa em arco (parábola) até um ponto do chão e explode em área.
// A sombra fica no chão, cresce e escurece conforme a bola desce.
export default class PlasmaBall {
    constructor (scene, opts) {
        this.scene = scene;
        this.sx = opts.groundX;
        this.sy = opts.groundY;
        this.h0 = opts.height;
        this.tx = opts.targetX;
        this.ty = opts.targetY;
        this.flightTime = opts.flightTime;
        this.arcHeight = opts.arcHeight;
        this.damage = opts.damage;
        this.edgeFactor = opts.edgeDamageFactor;
        this.radius = opts.splashRadius;
        this.t = 0;
        this.done = false;

        this.glow = scene.add.image(0, 0, 'dot').setBlendMode('ADD').setTint(COLORS.cyan).setAlpha(0.8);
        this.glow.setDisplaySize(70, 70);
        this.image = addArt(scene, this.sx, this.sy - this.h0, 'projectile-plasma');
        const sh = SHADOWS['projectile-plasma'];
        this.shadow = scene.shadows.add(this.sx, this.sy, sh[0], sh[1]);
        this.light = scene.effects.acquireLight(this.sx, this.sy, LIGHTING.plasmaLight);
        this.update(0);
    }

    update (dt) {
        if (this.done) { return; }
        this.t += dt * 1000 / this.flightTime;
        const p = Math.min(1, this.t);

        const gx = Phaser.Math.Linear(this.sx, this.tx, p);
        const gy = Phaser.Math.Linear(this.sy, this.ty, p);
        const h = this.h0 * (1 - p) + 4 * this.arcHeight * p * (1 - p);

        // velocidade na tela (para esticar a bola na direção do movimento)
        const dhdp = -this.h0 + 4 * this.arcHeight * (1 - 2 * p);
        const vx = (this.tx - this.sx);
        const vy = (this.ty - this.sy) - dhdp;
        const speed = Math.hypot(vx, vy);
        const stretch = Math.min(0.35, speed / 1400);

        const x = gx, y = gy - h;
        this.image.setPosition(x, y);
        this.image.rotation = Math.atan2(vy, vx);
        const bs = this.image.baseScale;
        this.image.setScale(bs * (1 + stretch), bs * (1 - stretch * 0.6));
        this.glow.setPosition(x, y);
        this.glow.setAlpha(0.6 + 0.3 * Math.sin(this.t * 30));

        const depth = DEPTH.OBJECTS + gy + 60;
        this.image.setDepth(depth);
        this.glow.setDepth(depth - 1);

        if (dt > 0) { this.scene.effects.trail.emitParticleAt(x, y, 2); }
        ShadowLayer.follow(this.shadow, gx, gy, h, 1);
        if (this.light) { this.light.x = x; this.light.y = y + h * 0.6; }

        if (p >= 1) {
            this.explode();
        }
    }

    explode () {
        const scene = this.scene;
        const r = this.radius;
        for (const e of scene.enemies) {
            if (!e.alive) { continue; }
            const d = Math.hypot(e.x - this.tx, e.y - this.ty);
            if (d <= r) {
                const k = d / r;
                const dmg = this.damage * (1 - k * (1 - this.edgeFactor));
                e.takeDamage(Math.round(dmg), '#7afcff');
            }
        }
        scene.effects.plasmaExplosion(this.tx, this.ty, r);
        this.destroy();
    }

    destroy () {
        this.done = true;
        this.image.destroy();
        this.glow.destroy();
        this.shadow.destroy();
        this.scene.effects.releaseLight(this.light);
    }
}
