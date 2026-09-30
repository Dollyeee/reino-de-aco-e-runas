import Phaser from 'phaser';
import Tower from './Tower.js';
import LaserBolt from '../projectiles/LaserBolt.js';
import { BALANCE } from '../config/balance.js';
import { COLORS } from '../config/visual.js';
import { towerPixel } from '../config/art.js';
import { HEAD_ANGLES, headFrameFor, headPoint } from '../config/towerArt.js';
import { animKey, makeArt, makeSprite, anchor } from '../world/art.js';

const TURN_SPEED = 14;          // quão rápido a besta gira (rad/s, suavizado)
const RECOIL_PX = 3;            // recuo da cabeça em pixel art (px inteiros, na direção oposta ao tiro)
const HEAD_IDLE_FPS = 8;        // fases do idle da cabeça (brilho correndo pela corda), quando a versão tem

// Besta Laser: torre rápida e barata. Gira para mirar e dispara virotes em linha reta.
// Arte atual (SVG): a cabeça gira (rotation) e dá um tranco elástico.
// Pixel art (TOWER_VARIANT): a cabeça é uma folha com um quadro por ângulo (redesenhada pelo gerador, sem rotação);
// para a esquerda usa o quadro espelhado; o recuo é um deslocamento de pixels inteiros.
export default class LaserCrossbow extends Tower {
    constructor (scene, x, y) {
        const px = towerPixel('laserCrossbow');
        super(scene, x, y, 'laserCrossbow', BALANCE.towers.laserCrossbow, 'tower-crossbow', px);
        this.px = px;

        if (px) {
            // base: imagem, ou sprite com idle em loop (bandeira, runa) quando a versão tem quadros
            this.baseImg = px.base.frames > 1
                ? makeSprite(scene, 0, 0, px.baseKey).setLighting(true).play(animKey(px.baseKey, 'idle'))
                : makeArt(scene, 0, 0, px.baseKey).setLighting(true);
            this.mount = px.headMount;
            this.muzzle = px.muzzle;
            this.crystal = px.crystal;
            this.headRig = new Phaser.GameObjects.Container(scene, this.mount.x, this.mount.y);
            this.head = makeSprite(scene, 0, 0, px.pieceKey).setLighting(true);
        } else {
            this.baseImg = makeArt(scene, 0, 0, 'tower-crossbow-base').setLighting(true);
            this.mount = anchor('tower-crossbow-base', 'headMount');
            this.muzzle = anchor('tower-crossbow-head', 'muzzle');
            this.crystal = anchor('tower-crossbow-head', 'crystal');
            this.headRig = new Phaser.GameObjects.Container(scene, this.mount.x, this.mount.y);
            this.head = makeArt(scene, 0, 0, 'tower-crossbow-head').setLighting(true);
        }
        // pixel art: cabeça menor → brilho do cristal menor
        this.glowSize = px ? 20 : 34;
        this.crystalGlow = scene.make.image({ x: this.crystal.x, y: this.crystal.y, key: 'dot' }, false)
            .setBlendMode('ADD').setTint(COLORS.cyan).setDisplaySize(this.glowSize, this.glowSize);
        this.headRig.add([this.head, this.crystalGlow]);
        this.rig.add([this.baseImg, this.headRig]);
        this.pieces = [this.baseImg, this.headRig];   // materialização: base, depois a cabeça

        this.aim = -0.4 + Math.random() * 0.8;
        this.pulseT = Math.random() * 10;
        this.recoil = { x: 0, y: 0 };
        this.applyAim();

        if (!px) {
            // brilho que desliza pela besta (Shine do Phaser 4) — só na arte vetorial
            this.shine = Phaser.Actions.AddEffectShine(this.head, {
                duration: 1600,
                repeatDelay: 1800,
                radius: 0.25,
                direction: Math.PI * 0.25,
                colorFactor: [1.2, 1.9, 2.0, 1]
            })[0];
        }
    }

    applyAim () {
        if (!this.px) {
            this.headRig.rotation = this.aim;
            // mantém a besta "de pé" quando aponta para a esquerda
            this.headRig.scaleY = Math.cos(this.aim) < 0 ? -1 : 1;
            return;
        }
        const f = headFrameFor(this.aim);
        // idle da cabeça: quadro = fase × nº de ângulos + ângulo
        const phases = this.px.head.phases || 1;
        const phase = phases > 1 ? Math.floor(this.pulseT * HEAD_IDLE_FPS) % phases : 0;
        this.head.setFrame(phase * HEAD_ANGLES.length + f.frame).setFlipX(f.flip);
        this.head.x = this.recoil.x;
        this.head.y = this.recoil.y;
        // o brilho do cristal acompanha o quadro desenhado (ângulo do quadro, espelhado se for o caso)
        const g = headPoint(this.crystal, HEAD_ANGLES[f.frame], this.px.head.foreshorten);
        this.crystalGlow.setPosition(Math.round(f.flip ? -g.x : g.x) + this.recoil.x, Math.round(g.y) + this.recoil.y);
        this.shownAngle = f.angle;
    }

    update (dt) {
        super.update(dt);
        this.pulseT += dt;
        const pulse = 0.7 + 0.3 * Math.sin(this.pulseT * 4);
        this.crystalGlow.setAlpha(pulse * (this.cooldown > 0 ? 0.6 : 1));
        if (this.px && this.px.head.phases > 1) { this.applyAim(); }   // idle da cabeça corre sempre
        if (!this.ready) { return; }
        if (this.px && this.px.float) {
            // pedestal flutuante: a cabeça sobe e desce em pixels inteiros
            this.headRig.y = this.mount.y + Math.round(Math.sin(this.pulseT * 1.8) * this.px.float);
        }

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

        const muzzle = this.muzzle;
        const cos = Math.cos(this.aim), sin = Math.sin(this.aim);
        let mx = this.x + this.mount.x + muzzle.x * cos;
        let my = this.y + this.mount.y + muzzle.x * sin;
        if (this.px?.head.foreshorten) {
            // besta com escorço 3/4: a ponta do virote é a do quadro desenhado
            const f = headFrameFor(this.aim), m = headPoint(muzzle, HEAD_ANGLES[f.frame], this.px.head.foreshorten);
            mx = this.x + this.mount.x + (f.flip ? -m.x : m.x);
            my = this.y + this.mount.y + m.y;
        }

        const bolt = new LaserBolt(this.scene, mx, this.y, this.y - my, this.target, this.attack(s.damage), s.projectileSpeed);
        this.scene.projectiles.push(bolt);
        this.scene.effects.muzzleFlash(mx, my);

        this.crystalGlow.setDisplaySize(this.glowSize * 1.8, this.glowSize * 1.8);
        this.scene.tweens.add({ targets: this.crystalGlow, displayWidth: this.glowSize, displayHeight: this.glowSize, duration: 250 });

        if (this.px) {
            // recuo em pixels inteiros na direção oposta ao tiro, voltando em 2 passos
            const a = this.shownAngle ?? this.aim;
            const back = (k) => ({ x: Math.round(-Math.cos(a) * RECOIL_PX * k), y: Math.round(-Math.sin(a) * RECOIL_PX * k) });
            this.recoil = back(1);
            this.applyAim();
            this.scene.time.delayedCall(70, () => { this.recoil = back(0.5); this.applyAim(); });
            this.scene.time.delayedCall(150, () => { this.recoil = { x: 0, y: 0 }; this.applyAim(); });
            this.kick();
            return;
        }

        // recuo elástico: a besta dá um tranco para trás e achata no eixo do disparo
        const bs = this.head.baseScale;
        this.scene.tweens.killTweensOf(this.head);
        this.head.x = -11;
        this.head.setScale(bs * 0.78, bs * 1.18);
        this.scene.tweens.add({ targets: this.head, x: 0, duration: 380, ease: 'Elastic.easeOut', easeParams: [1.2, 0.3] });
        this.scene.tweens.add({ targets: this.head, scaleX: bs, scaleY: bs, duration: 300, ease: 'Back.easeOut' });
        this.kick(1.06, 0.94, 360);
    }
}
