import { COLORS, DEPTH, LIGHTING } from '../config/visual.js';
import { SHADOWS } from '../config/art.js';
import ShadowLayer from '../effects/Shadow.js';
import { addArt } from '../world/art.js';

// Virote laser: voa em linha reta (corrigindo levemente a mira) até o alvo.
// Guarda posição no chão (gx, gy) + altura, para a sombra acompanhar no chão.
export default class LaserBolt {
    constructor (scene, groundX, groundY, height, target, damage, speed) {
        this.scene = scene;
        this.target = target;
        this.targetH = target.hitHeight;   // altura do ponto de acerto (manifesto de arte)
        this.damage = damage;
        this.speed = speed;
        this.gx = groundX;
        this.gy = groundY;
        this.h0 = height;
        this.h = height;
        this.tx = target.x;
        this.ty = target.y;
        this.startDist = Math.max(1, Math.hypot(this.tx - groundX, this.ty - groundY));
        this.done = false;

        this.image = addArt(scene, groundX, groundY - height, 'projectile-bolt');
        this.image.setScale(this.image.baseScale * 1.25, this.image.baseScale * 1.1);
        this.glow = scene.add.image(this.image.x, this.image.y, 'dot').setBlendMode('ADD').setTint(COLORS.cyan).setAlpha(0.7);
        this.glow.setDisplaySize(54, 26);

        const sh = SHADOWS['projectile-bolt'];
        this.shadow = scene.shadows.add(groundX, groundY, sh[0], sh[1]);
        this.light = scene.effects.acquireLight(groundX, groundY, LIGHTING.boltLight);
    }

    update (dt) {
        if (this.done) { return; }
        if (this.target.alive) {
            this.tx = this.target.x;
            this.ty = this.target.y;
        }
        const dx = this.tx - this.gx, dy = this.ty - this.gy;
        const dist = Math.hypot(dx, dy);
        const move = this.speed * dt;

        if (dist <= move + 4) {
            this.gx = this.tx;
            this.gy = this.ty;
            this.hit();
            return;
        }

        const prevX = this.image.x, prevY = this.image.y;
        this.gx += dx / dist * move;
        this.gy += dy / dist * move;
        this.h = this.targetH + (this.h0 - this.targetH) * Math.min(1, dist / this.startDist);

        const vx = this.gx, vy = this.gy - this.h;
        this.image.setPosition(vx, vy);
        this.image.rotation = Math.atan2(vy - prevY, vx - prevX);
        this.glow.setPosition(vx, vy).setRotation(this.image.rotation);
        this.image.setDepth(DEPTH.OBJECTS + this.gy + 2);
        this.glow.setDepth(DEPTH.OBJECTS + this.gy + 1);

        this.scene.effects.trail.emitParticleAt(vx, vy, 1);
        ShadowLayer.follow(this.shadow, this.gx, this.gy, this.h * 0.5);
        if (this.light) { this.light.x = vx; this.light.y = vy + this.h * 0.4; }
    }

    hit () {
        const x = this.gx, y = this.gy - this.targetH;
        if (this.target.alive) {
            this.target.takeDamage(this.damage, '#ffffff');
            this.scene.effects.boltHit(x, y);
        } else {
            this.scene.effects.sparks.explode(3, x, y);
        }
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
