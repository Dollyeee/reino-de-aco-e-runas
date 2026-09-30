import Phaser from 'phaser';
import { COLORS, DEPTH, ENEMY_ANIM, PIXEL_SCALE } from '../config/visual.js';
import { ART, SHADOWS } from '../config/art.js';
import { BALANCE } from '../config/balance.js';
import { finalDamage, layerOf } from '../combat/damage.js';
import ShadowLayer from '../effects/Shadow.js';
import { animKey, anchor, makeArt, makeSprite } from '../world/art.js';

const HP_BAR_W = 40;
const A = ENEMY_ANIM;
const PS = PIXEL_SCALE;

// Inimigo base. O Container fica no ponto de contato com o chão.
//   Arte com animação (pixel art, sprite sheet): toca "walk" em loop, com velocidade proporcional ao
//   deslocamento; sem escala fracionada nem rotação — dano vira recuo de pixels inteiros e a morte pisca
//   e afunda. Posição alinhada à grade de pixels da arte.
//   Arte sem animação (vetorial): passo pesado procedural, tranco ao levar dano, tombo ao morrer.
export default class Enemy extends Phaser.GameObjects.Container {
    constructor (scene, stats, artKey, opts = {}) {
        const start = scene.track.getPointAt(0);
        super(scene, start.x, start.y);
        scene.add.existing(this);

        this.artKey = artKey;
        this.def = ART[artKey];
        this.pixel = !!this.def.pixel;
        this.maxHealth = stats.health;
        this.health = stats.health;
        this.speed = stats.speed;
        this.reward = stats.reward;
        this.coreDamage = stats.coreDamage;

        // características (BALANCE.traitRules) e resistências por tipo de dano
        this.traits = stats.traits || ['terrestre'];
        this.resist = stats.resist || {};
        this.layer = layerOf(this.traits);
        const shieldRule = this.traits.includes('escudo') ? BALANCE.traitRules.escudo : null;
        this.maxShield = shieldRule ? shieldRule.shield : 0;
        this.shield = this.maxShield;
        this.shieldRegen = shieldRule ? shieldRule.shieldRegen : 0;

        this.distance = 0;
        this.alive = true;
        this.finished = false;
        this.stepPhase = Math.random() * Math.PI;
        this.stepRate = opts.stepRate || A.stepRate;
        this.hitSquash = 0;
        this.knockMs = 0;
        this.facing = 1;
        this._pt = {};

        // corpo (Sprite quando há sprite sheet)
        const walk = this.def.anims && this.def.anims.walk;
        this.sprite = (this.def.frame ? makeSprite : makeArt)(scene, 0, 0, artKey).setLighting(true);
        this.add(this.sprite);
        if (walk) {
            this.walkAnim = animKey(artKey, 'walk');
            this.walkFrames = walk.end - walk.start + 1;
            this.walkBaseRate = walk.frameRate;
            this.sprite.play({ key: this.walkAnim, startFrame: Phaser.Math.Between(0, this.walkFrames - 1) });
            this.lastFrame = -1;
            // dados por quadro do gerador (posição do olho acompanha o sobe-desce da cabeça)
            this.meta = this.def.meta ? scene.cache.json.get(`${artKey}:meta`) : null;
        }

        // brilho do olho robótico (aditivo e sem iluminação → pega Bloom)
        const eye = anchor(artKey, 'eye');
        if (eye) {
            this.eyeOffset = eye;
            this.eyeGlow = scene.make.image({ x: eye.x, y: eye.y, key: 'dot' }, false)
                .setBlendMode('ADD').setTint(COLORS.red).setDisplaySize(A.eyeGlowSize, A.eyeGlowSize);
            this.add(this.eyeGlow);
        }

        // ponto onde os disparos acertam + barra de vida (pontos definidos no manifesto de arte)
        this.hitOffset = anchor(artKey, 'hit') || { x: 0, y: -34 };
        this.headY = anchor(artKey, 'top') || -90;
        this.hpBar = scene.make.graphics({}, false);
        this.hpBar.setVisible(false);
        this.add(this.hpBar);

        const sh = SHADOWS[artKey] || [60, 20];
        this.shadow = scene.shadows.add(this.x, this.y, sh[0], sh[1], { pixel: this.pixel });

        // surge sem "pop" (pixel art: só opacidade, nada de escala)
        this.setAlpha(0);
        if (this.pixel) {
            scene.tweens.add({ targets: this, alpha: 1, duration: A.spawnMs, ease: 'Quad.easeOut' });
        } else {
            this.setScale(0.94);
            scene.tweens.add({ targets: this, alpha: 1, scale: 1, duration: A.spawnMs, ease: 'Quad.easeOut' });
        }
    }

    // Posição prevista daqui a `ms` milissegundos (para a catapulta mirar).
    predictPosition (ms, out = {}) {
        return this.scene.track.getPointAt(this.distance + this.speed * ms / 1000, out);
    }

    get hitY () {
        return this.y + this.hitOffset.y;
    }

    // Altura do ponto de acerto acima do chão.
    get hitHeight () {
        return -this.hitOffset.y;
    }

    update (dt) {
        if (!this.alive) { return; }
        const track = this.scene.track;
        const step = this.speed * dt;
        this.distance += step;
        if (this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + this.shieldRegen * dt);
        }
        const p = track.getPointAt(this.distance, this._pt);
        if (this.pixel) {
            // alinhado à grade de pixels da arte (deslocamentos inteiros)
            this.x = Math.round(p.x / PS) * PS;
            this.y = Math.round(p.y / PS) * PS;
        } else {
            this.x = p.x;
            this.y = p.y;
        }

        // virar para o lado do movimento
        if (Math.abs(p.dx) > 0.3) {
            const f = p.dx < 0 ? -1 : 1;
            if (f !== this.facing) {
                this.facing = f;
                this.sprite.setFlipX(f < 0);
                if (!this.walkAnim) { this.hitSquash = Math.max(this.hitSquash, 0.5); }
            }
        }

        const lift = this.walkAnim ? this.updateSheet(dt) : this.updateProcedural(step, dt);

        ShadowLayer.follow(this.shadow, this.x, this.y, lift);
        this.setDepth(DEPTH.OBJECTS + this.y);

        if (this.distance >= track.length) {
            this.reachEnd();
        }
    }

    // Sprite sheet: a caminhada vem dos quadros; o código só ajusta a velocidade e o recuo (inteiro).
    updateSheet (dt) {
        // quadros por segundo proporcionais à velocidade: um ciclo completo a cada walkCycle px andados
        const fps = this.walkFrames * this.speed / (this.def.walkCycle || A.walkCycle);
        this.sprite.anims.timeScale = fps / this.walkBaseRate;

        this.knockMs = Math.max(0, this.knockMs - dt * 1000);
        this.sprite.x = this.knockMs > 0 ? -this.facing * A.knockback * PS : 0;
        this.sprite.y = 0;

        const frame = this.sprite.anims.currentFrame ? this.sprite.anims.currentFrame.index - 1 : 0;
        if (this.eyeGlow) {
            let ex = this.eyeOffset.x, ey = this.eyeOffset.y;
            const e = this.meta && this.meta.eye && this.meta.eye[frame];
            if (e) {
                // pixels da arte → pixels do mundo, a partir do pivot
                ex = (e.x - this.def.pivot[0] / PS) * PS;
                ey = (e.y - this.def.pivot[1] / PS) * PS;
            }
            this.eyeGlow.x = ex * this.facing + this.sprite.x;
            this.eyeGlow.y = ey;
            this.eyeGlow.alpha = 0.6 + 0.2 * Math.sin(this.scene.time.now / 140);
        }

        // poeira quando um pé toca o chão (quadros de contato)
        if (frame !== this.lastFrame) {
            if ((frame === 0 || frame === 4) && Math.random() < A.dustChance) {
                this.scene.effects.landingDust(this.x + this.facing * 8, this.y + 2, 1);
            }
            this.lastFrame = frame;
        }
        return 0;
    }

    // Arte vetorial: passo pesado procedural (sobe entre os passos e assenta com achatamento curto).
    updateProcedural (step, dt) {
        const prevPhase = this.stepPhase;
        this.stepPhase += step * this.stepRate;
        const s = Math.abs(Math.sin(this.stepPhase));
        const lift = s * A.stepBob;
        const impact = Math.pow(1 - s, 8);
        let sx = 1 + A.stepSquash * impact;
        let sy = 1 - A.stepSquash * impact;
        let tilt = A.sway * Math.sin(this.stepPhase);

        if (this.hitSquash > 0) {
            sx += A.hitSquash * this.hitSquash;
            sy -= A.hitSquash * this.hitSquash;
            tilt -= A.hitTilt * this.hitSquash;
            this.hitSquash = Math.max(0, this.hitSquash - dt * A.hitRecover);
        }

        const bs = this.sprite.baseScale;
        this.sprite.setScale(bs * sx, bs * sy);
        this.sprite.y = -lift;
        this.sprite.rotation = tilt * this.facing;
        if (this.eyeGlow) {
            const ex = this.eyeOffset.x * sx * this.facing;
            const ey = this.eyeOffset.y * sy;
            const r = this.sprite.rotation;
            this.eyeGlow.x = ex * Math.cos(r) - ey * Math.sin(r);
            this.eyeGlow.y = ex * Math.sin(r) + ey * Math.cos(r) - lift;
            this.eyeGlow.alpha = 0.7 + 0.2 * Math.sin(this.scene.time.now / 140);
        }

        if (Math.floor(prevPhase / Math.PI) !== Math.floor(this.stepPhase / Math.PI) && Math.random() < A.dustChance) {
            this.scene.effects.landingDust(this.x + this.facing * 8, this.y + 2, 1);
        }
        return lift;
    }

    // Recebe um ataque bruto: aplica resistências (tipo de dano × traits) e o escudo, depois o dano.
    receiveAttack (amount, damageType, color) {
        if (!this.alive) { return; }
        let dmg = finalDamage(this, amount, damageType);
        if (this.shield > 0) {
            const absorbed = Math.min(this.shield, dmg);
            this.shield -= absorbed;
            dmg -= absorbed;
            if (dmg <= 0) { return; }
        }
        this.takeDamage(dmg, color);
    }

    takeDamage (amount, color = '#ffffff') {
        if (!this.alive) { return; }
        this.health -= amount;
        this.scene.effects.damageNumber(this.x, this.y + this.headY + 10, amount, color);

        // flash branco + recuo (pixel art: deslocamento inteiro; vetorial: tranco)
        if (this.pixel) { this.knockMs = A.knockbackMs; } else { this.hitSquash = 1; }
        this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
        if (this._flashTimer) { this._flashTimer.remove(); }
        this._flashTimer = this.scene.time.delayedCall(70, () => {
            if (this.sprite && this.sprite.active) { this.sprite.clearTint(); }
        });

        this.drawHealthBar();
        if (this.health <= 0) {
            this.die();
        }
    }

    drawHealthBar () {
        const g = this.hpBar;
        const pct = Phaser.Math.Clamp(this.health / this.maxHealth, 0, 1);
        const y = this.headY - 6;
        g.clear();
        g.setVisible(true);
        g.fillStyle(COLORS.outline, 1);
        g.fillRect(-HP_BAR_W / 2 - 2, y - 2, HP_BAR_W + 4, 8);
        g.fillStyle(0x3a2320, 1);
        g.fillRect(-HP_BAR_W / 2, y, HP_BAR_W, 4);
        if (pct > 0) {
            const w = this.pixel ? Math.max(PS, Math.round(HP_BAR_W * pct / PS) * PS) : Math.max(2, HP_BAR_W * pct);
            g.fillStyle(pct > 0.35 ? 0xc8412c : 0xff5a2a, 1);
            g.fillRect(-HP_BAR_W / 2, y, w, 4);
            g.fillStyle(0xffffff, 0.25);
            g.fillRect(-HP_BAR_W / 2, y, w, this.pixel ? PS / 2 : 1);
        }
    }

    die () {
        this.alive = false;
        this.scene.onEnemyKilled(this);
        this.hpBar.setVisible(false);
        if (this._flashTimer) { this._flashTimer.remove(); this._flashTimer = null; }
        if (this.eyeGlow) {
            this.scene.tweens.add({ targets: this.eyeGlow, alpha: { from: 1, to: 0 }, duration: 160, repeat: 1 });
        }
        if (this.pixel) { this.diePixel(); } else { this.dieTopple(); }
    }

    // Pixel art: para, pisca e afunda em passos de pixel inteiro, depois se desfaz em faíscas.
    diePixel () {
        const scene = this.scene;
        const D = A.pixelDeath;
        this.sprite.stop();
        if (this.def.idle) { this.sprite.setTexture(this.def.idle); }
        this.sprite.x = 0;
        this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
        scene.time.delayedCall(60, () => {
            if (this.sprite.active) { this.sprite.setTint(0x8a8078).setTintMode(Phaser.TintModes.MULTIPLY); }
        });
        const steps = D.blinks * 2;
        let n = 0;
        scene.time.addEvent({
            delay: D.blinkMs,
            repeat: steps - 1,
            callback: () => {
                n++;
                this.sprite.setVisible(n % 2 === 0);
                if (n % 2 === 0 && this.sprite.y < D.sinkPx * PS) { this.sprite.y += PS; }
                if (n >= steps) {
                    scene.effects.enemyShatter(this.x, this.y + this.hitOffset.y);
                    this.destroyAll();
                }
            }
        });
    }

    // Arte vetorial: tomba para frente sobre os pés, bate no chão e se desmancha em faíscas.
    dieTopple () {
        const scene = this.scene;
        const D = A.death;
        const f = this.facing;
        const bs = this.sprite.baseScale;

        this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
        scene.time.delayedCall(60, () => {
            if (this.sprite.active) { this.sprite.setTint(0x8a8078).setTintMode(Phaser.TintModes.MULTIPLY); }
        });
        this.sprite.setScale(bs);
        this.sprite.y = 0;

        if (this.shadow) {
            scene.tweens.add({
                targets: this.shadow,
                x: this.shadow.x + f * 20,
                displayWidth: this.shadow.displayWidth * 1.6,
                duration: D.fallMs,
                ease: 'Quad.easeIn'
            });
        }

        scene.tweens.chain({
            targets: this.sprite,
            tweens: [
                { rotation: f * D.tipAngle, x: f * 4, duration: D.fallMs, ease: 'Quad.easeIn' },
                {
                    scaleX: bs * 1.06, scaleY: bs * 0.94, duration: D.impactMs, ease: 'Quad.easeOut', yoyo: true,
                    onStart: () => scene.effects.enemyImpact(this.x + f * 40, this.y)
                },
                {
                    alpha: 0, duration: D.dissolveMs, delay: D.dissolveDelay, ease: 'Quad.easeIn',
                    onStart: () => {
                        scene.effects.enemyDissolve(this.x, this.y, f);
                        if (this.shadow) { scene.tweens.add({ targets: this.shadow, alpha: 0, duration: D.dissolveMs }); }
                    }
                }
            ],
            onComplete: () => this.destroyAll()
        });
    }

    reachEnd () {
        this.alive = false;
        this.finished = true;
        this.hpBar.setVisible(false);
        this.scene.onEnemyReachedCore(this);
        // atravessa o portão: some (pixel art só com opacidade; vetorial também encolhe um pouco)
        const cfg = this.pixel
            ? { targets: this, alpha: 0, duration: 260, ease: 'Quad.easeIn' }
            : { targets: this, alpha: 0, scale: 0.9, y: this.y - 6, duration: 260, ease: 'Quad.easeIn' };
        this.scene.tweens.add({ ...cfg, onComplete: () => this.destroyAll() });
        this.scene.tweens.add({ targets: this.shadow, alpha: 0, duration: 240 });
    }

    destroyAll () {
        if (this._flashTimer) { this._flashTimer.remove(); }
        if (this.shadow) { this.shadow.destroy(); this.shadow = null; }
        this.destroy();
    }
}
