import Phaser from 'phaser';
import Tower from './Tower.js';
import LaserBolt from '../projectiles/LaserBolt.js';
import { BALANCE } from '../config/balance.js';
import { COLORS } from '../config/visual.js';
import { makeArt, anchor } from '../world/art.js';

const TURN_SPEED = 14;          // quão rápido a besta gira (rad/s, suavizado)
const CRYSTAL_OFFSET = { x: -21, y: 0 };

// Besta Laser: torre rápida e barata. Gira para mirar e dispara virotes em linha reta.
export default class LaserCrossbow extends Tower {
    constructor (scene, x, y) {
        super(scene, x, y, 'laserCrossbow', BALANCE.towers.laserCrossbow, 'tower-crossbow');

        this.baseImg = makeArt(scene, 0, 0, 'tower-crossbow-base').setLighting(true);
        const mount = anchor('tower-crossbow-base', 'headMount');
        this.mount = mount;

        this.headRig = new Phaser.GameObjects.Container(scene, mount.x, mount.y);
        this.head = makeArt(scene, 0, 0, 'tower-crossbow-head').setLighting(true);
        this.crystalGlow = scene.make.image({ x: CRYSTAL_OFFSET.x, y: CRYSTAL_OFFSET.y, key: 'dot' }, false)
            .setBlendMode('ADD').setTint(COLORS.cyan).setDisplaySize(34, 34);
        this.headRig.add([this.head, this.crystalGlow]);
        this.rig.add([this.baseImg, this.headRig]);

        this.aim = -0.4 + Math.random() * 0.8;
        this.pulseT = Math.random() * 10;
        this.applyAim();

        // brilho que desliza pela besta (Shine do Phaser 4)
        this.shine = Phaser.Actions.AddEffectShine(this.head, {
            duration: 1600,
            repeatDelay: 1800,
            radius: 0.25,
            direction: Math.PI * 0.25,
            colorFactor: [1.2, 1.9, 2.0, 1]
        })[0];
    }

    applyAim () {
        this.headRig.rotation = this.aim;
        // mantém a besta "de pé" quando aponta para a esquerda
        this.headRig.scaleY = Math.cos(this.aim) < 0 ? -1 : 1;
    }

    update (dt) {
        super.update(dt);
        this.pulseT += dt;
        const pulse = 0.7 + 0.3 * Math.sin(this.pulseT * 4);
        this.crystalGlow.setAlpha(pulse * (this.cooldown > 0 ? 0.6 : 1));
        if (!this.ready) { return; }

        const s = this.stats;
        this.target = this.acquireTarget(s.range);
        if (!this.target) { return; }

        const pivotY = this.y + this.mount.y;
        const desired = Math.atan2(this.target.hitY - pivotY, this.target.x - this.x);
        const diff = Phaser.Math.Angle.Wrap(desired - this.aim);
        this.aim += diff * Math.min(1, TURN_SPEED * dt);
        this.applyAim();

        if (this.cooldown <= 0 && Math.abs(diff) < 0.35) {
            this.fire();
        }
    }

    fire () {
        const s = this.stats;
        this.cooldown = s.fireCooldown;

        const muzzle = anchor('tower-crossbow-head', 'muzzle');
        const cos = Math.cos(this.aim), sin = Math.sin(this.aim);
        const mx = this.x + this.mount.x + muzzle.x * cos;
        const my = this.y + this.mount.y + muzzle.x * sin;

        const bolt = new LaserBolt(this.scene, mx, this.y, this.y - my, this.target, s.damage, s.projectileSpeed);
        this.scene.projectiles.push(bolt);
        this.scene.effects.muzzleFlash(mx, my);

        // recuo elástico: a besta dá um tranco para trás e achata no eixo do disparo
        const bs = this.head.baseScale;
        this.scene.tweens.killTweensOf(this.head);
        this.head.x = -11;
        this.head.setScale(bs * 0.78, bs * 1.18);
        this.scene.tweens.add({ targets: this.head, x: 0, duration: 380, ease: 'Elastic.easeOut', easeParams: [1.2, 0.3] });
        this.scene.tweens.add({ targets: this.head, scaleX: bs, scaleY: bs, duration: 300, ease: 'Back.easeOut' });
        this.crystalGlow.setDisplaySize(60, 60);
        this.scene.tweens.add({ targets: this.crystalGlow, displayWidth: 34, displayHeight: 34, duration: 250 });
        this.kick(1.06, 0.94, 360);
    }
}
