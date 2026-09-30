import Phaser from 'phaser';
import Tower from './Tower.js';
import PlasmaBall from '../projectiles/PlasmaBall.js';
import { BALANCE } from '../config/balance.js';
import { COLORS, LIGHTING } from '../config/visual.js';
import { towerPixel } from '../config/art.js';
import { ARM_ANGLES, armFrameFor } from '../config/towerArt.js';
import { makeArt, makeSprite, anchor } from '../world/art.js';

const REST_ANGLE = -0.35;       // braço inclinado para trás, em repouso
const WINDUP_ANGLE = -0.85;     // puxada antes do arremesso
const THROW_ANGLE = 1.05;       // ponto em que solta a bola
const WINDUP_MS = 170;
const THROW_MS = 110;

// Catapulta de Plasma: lenta e cara, arremessa bolas de plasma em arco com dano em área.
// Arte atual (SVG): o braço gira (rotation). Pixel art (TOWER_VARIANT): os tweens animam o ângulo de `armPose`
// e o braço troca de quadro (um por ângulo, redesenhado pelo gerador); a bola acompanha a concha do quadro.
export default class PlasmaCatapult extends Tower {
    constructor (scene, x, y) {
        const px = towerPixel('plasmaCatapult');
        super(scene, x, y, 'plasmaCatapult', BALANCE.towers.plasmaCatapult, 'tower-catapult', px);
        this.px = px;

        this.baseImg = makeArt(scene, 0, 0, px ? px.baseKey : 'tower-catapult-base').setLighting(true);
        const pivot = px ? px.armPivot : anchor('tower-catapult-base', 'armPivot');
        this.pivot = pivot;
        this.cup = px ? px.cup : anchor('tower-catapult-arm', 'cup');
        const orb = px ? px.orb : anchor('tower-catapult-arm', 'orb');
        this.orbAnchor = orb;

        this.armRig = new Phaser.GameObjects.Container(scene, pivot.x, pivot.y);
        this.arm = px ? makeSprite(scene, 0, 0, px.pieceKey).setLighting(true) : makeArt(scene, 0, 0, 'tower-catapult-arm').setLighting(true);
        // pixel art: concha menor → bola e brilho menores
        const glowSize = px ? 30 : 56;
        this.orbGlow = scene.make.image({ x: orb.x, y: orb.y, key: 'dot' }, false)
            .setBlendMode('ADD').setTint(COLORS.cyan).setDisplaySize(glowSize, glowSize);
        this.orb = makeArt(scene, orb.x, orb.y, 'projectile-plasma', px ? 0.45 : 0.9);
        this.armRig.add([this.arm, this.orbGlow, this.orb]);
        this.rig.add([this.baseImg, this.armRig]);
        this.pieces = [this.baseImg, this.armRig];    // materialização: base, depois o braço

        // alvo dos tweens do braço: o próprio Container (SVG) ou um ângulo virtual (pixel art, sem rotação)
        this.armPose = px ? { rotation: REST_ANGLE } : this.armRig;
        this.armPose.rotation = REST_ANGLE;
        this.applyArm();
        this.facing = 1;
        this.loaded = true;
        this.firing = false;
        this.pulseT = Math.random() * 10;

        this.shine = Phaser.Actions.AddEffectShine(this.orb, {
            duration: 1200,
            repeatDelay: 900,
            radius: 0.3,
            colorFactor: [1.4, 2.0, 2.0, 1]
        })[0];
    }

    // Pixel art: quadro do braço para o ângulo atual; a bola e o brilho ficam na concha daquele quadro.
    applyArm () {
        if (!this.px) { return; }
        const f = armFrameFor(this.armPose.rotation);
        this.arm.setFrame(f);
        const a = ARM_ANGLES[f], o = this.orbAnchor;
        const ox = Math.round(o.x * Math.cos(a) - o.y * Math.sin(a));
        const oy = Math.round(o.x * Math.sin(a) + o.y * Math.cos(a));
        this.orb.setPosition(ox, oy);
        this.orbGlow.setPosition(ox, oy);
    }

    update (dt) {
        super.update(dt);
        this.pulseT += dt;
        this.applyArm();
        if (this.loaded) {
            const p = Math.sin(this.pulseT * 5);
            this.orbGlow.setAlpha(0.65 + 0.3 * p);
            const bs = this.orb.baseScale;
            this.orb.setScale(bs * (1 + 0.05 * p), bs * (1 - 0.05 * p));
        }
        if (!this.ready || this.firing) { return; }

        const s = this.stats;
        this.target = this.acquireTarget(s.range, s.minRange);
        if (!this.target) { return; }

        const f = this.target.x < this.x ? -1 : 1;
        if (f !== this.facing) { this.turn(f); }

        if (this.loaded && this.cooldown <= 0) {
            this.fire();
        }
    }

    turn (f) {
        this.facing = f;
        this.rig.scaleX = f;      // espelho inteiro (vale também para pixel art)
        this.kick(0.8, 1.12, 380);
    }

    fire () {
        const s = this.stats;
        const scene = this.scene;
        this.firing = true;
        this.cooldown = s.fireCooldown;
        const target = this.target;

        scene.tweens.killTweensOf(this.armPose);
        scene.tweens.chain({
            targets: this.armPose,
            tweens: [
                {
                    rotation: WINDUP_ANGLE, duration: WINDUP_MS, ease: 'Sine.easeOut',
                    onStart: () => {
                        if (this.pixel) { return; }   // pixel art: sem squash
                        scene.tweens.killTweensOf(this);
                        scene.tweens.add({ targets: this, scaleX: 1.12, scaleY: 0.86, duration: WINDUP_MS, ease: 'Sine.easeOut' });
                    }
                },
                {
                    rotation: THROW_ANGLE, duration: THROW_MS, ease: 'Cubic.easeIn',
                    onComplete: () => this.release(target)
                },
                this.px
                    ? { rotation: REST_ANGLE, duration: 520, ease: 'Back.easeOut', easeParams: [1.4] }   // pixel art: retorno firme
                    : { rotation: REST_ANGLE, duration: 750, ease: 'Elastic.easeOut', easeParams: [1.1, 0.35] }
            ],
            onComplete: () => { this.firing = false; }
        });
    }

    release (target) {
        const s = this.stats;
        const scene = this.scene;

        // posição da concha no mundo (considera rotação do braço e o lado para onde a catapulta olha)
        const rot = this.px ? ARM_ANGLES[armFrameFor(this.armPose.rotation)] : this.armRig.rotation;
        const lx = -this.cup.y * Math.sin(rot);
        const ly = this.cup.y * Math.cos(rot);
        const wx = this.x + (this.pivot.x + lx) * this.facing;
        const wy = this.y + this.pivot.y + ly;

        // mira onde o alvo vai estar quando a bola cair
        const aim = target.alive ? target.predictPosition(s.flightTime) : { x: target.x, y: target.y };

        scene.projectiles.push(new PlasmaBall(scene, {
            groundX: wx,
            groundY: this.y,
            height: this.y - wy,
            targetX: aim.x,
            targetY: aim.y,
            flightTime: s.flightTime,
            arcHeight: s.arcHeight,
            attack: this.attack(s.damage),
            edgeDamageFactor: s.edgeDamageFactor,
            splashRadius: s.splashRadius
        }));

        scene.effects.sparks.explode(6, wx, wy);
        scene.effects.flashLight(wx, wy, LIGHTING.muzzleLight, 200);
        this.kick(0.9, 1.14, 520);

        // recarrega: a bola reaparece na concha com um "pop"
        this.loaded = false;
        this.orb.setVisible(false);
        this.orbGlow.setVisible(false);
        scene.time.delayedCall(s.fireCooldown * 0.55, () => {
            if (!this.active) { return; }
            this.orb.setVisible(true).setScale(0);
            this.orbGlow.setVisible(true);
            scene.tweens.add({
                targets: this.orb,
                scale: this.orb.baseScale,
                duration: 360,
                ease: 'Back.easeOut',
                onComplete: () => { this.loaded = true; }
            });
        });
    }
}
