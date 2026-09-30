import Phaser from 'phaser';
import { COLORS, DEPTH, ENEMY_ANIM } from '../config/visual.js';
import { SHADOWS } from '../config/art.js';
import ShadowLayer from '../effects/Shadow.js';
import { makeArt, anchor } from '../world/art.js';

const HP_BAR_W = 40;
const A = ENEMY_ANIM;

// Inimigo base: anda pelo caminho com passo pesado, dá um tranco ao levar dano,
// tomba para frente e se desmancha em faíscas ao morrer.
// O Container fica no ponto de contato com o chão; o corpo balança dentro dele.
export default class Enemy extends Phaser.GameObjects.Container {
    constructor (scene, stats, artKey, opts = {}) {
        const start = scene.track.getPointAt(0);
        super(scene, start.x, start.y);
        scene.add.existing(this);

        this.artKey = artKey;
        this.maxHealth = stats.health;
        this.health = stats.health;
        this.speed = stats.speed;
        this.reward = stats.reward;
        this.coreDamage = stats.coreDamage;

        this.distance = 0;
        this.alive = true;
        this.finished = false;
        this.stepPhase = Math.random() * Math.PI;
        this.stepRate = opts.stepRate || A.stepRate;
        this.hitSquash = 0;
        this.facing = 1;
        this._pt = {};

        // corpo
        this.sprite = makeArt(scene, 0, 0, artKey).setLighting(true);
        this.add(this.sprite);

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
        this.shadow = scene.shadows.add(this.x, this.y, sh[0], sh[1]);

        // surge sem "pop": só entra em cena
        this.setAlpha(0).setScale(0.94);
        scene.tweens.add({ targets: this, alpha: 1, scale: 1, duration: A.spawnMs, ease: 'Quad.easeOut' });
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
        const p = track.getPointAt(this.distance, this._pt);
        this.x = p.x;
        this.y = p.y;

        // virar para o lado do movimento (com um tranco leve)
        if (Math.abs(p.dx) > 0.3) {
            const f = p.dx < 0 ? -1 : 1;
            if (f !== this.facing) {
                this.facing = f;
                this.sprite.setFlipX(f < 0);
                this.hitSquash = Math.max(this.hitSquash, 0.5);
            }
        }

        // passo pesado: o corpo sobe pouco entre os passos e "assenta" com um achatamento curto no impacto do pé
        const prevPhase = this.stepPhase;
        this.stepPhase += step * this.stepRate;
        const s = Math.abs(Math.sin(this.stepPhase));
        const lift = s * A.stepBob;
        const impact = Math.pow(1 - s, 8);
        let sx = 1 + A.stepSquash * impact;
        let sy = 1 - A.stepSquash * impact;
        let tilt = A.sway * Math.sin(this.stepPhase);

        // tranco ao levar dano (inclina para trás e achata um pouco)
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
            // acompanha a rotação do corpo em torno dos pés
            const ex = this.eyeOffset.x * sx * this.facing;
            const ey = this.eyeOffset.y * sy;
            const r = this.sprite.rotation;
            this.eyeGlow.x = ex * Math.cos(r) - ey * Math.sin(r);
            this.eyeGlow.y = ex * Math.sin(r) + ey * Math.cos(r) - lift;
            this.eyeGlow.alpha = 0.7 + 0.2 * Math.sin(this.scene.time.now / 140);
        }

        // poeira quando o pé bate no chão
        if (Math.floor(prevPhase / Math.PI) !== Math.floor(this.stepPhase / Math.PI) && Math.random() < A.dustChance) {
            this.scene.effects.landingDust(this.x + this.facing * 8, this.y + 2, 1);
        }

        ShadowLayer.follow(this.shadow, this.x, this.y, lift);
        this.setDepth(DEPTH.OBJECTS + this.y);

        if (this.distance >= track.length) {
            this.reachEnd();
        }
    }

    takeDamage (amount, color = '#ffffff') {
        if (!this.alive) { return; }
        this.health -= amount;
        this.scene.effects.damageNumber(this.x, this.y + this.headY + 10, amount, color);

        // flash branco + tranco
        this.hitSquash = 1;
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
            g.fillStyle(pct > 0.35 ? 0xc8412c : 0xff5a2a, 1);
            g.fillRect(-HP_BAR_W / 2, y, Math.max(2, HP_BAR_W * pct), 4);
            g.fillStyle(0xffffff, 0.25);
            g.fillRect(-HP_BAR_W / 2, y, Math.max(2, HP_BAR_W * pct), 1);
        }
    }

    // Morte: tomba para frente sobre os pés, bate no chão e se desmancha em faíscas.
    die () {
        this.alive = false;
        this.scene.onEnemyKilled(this);
        const scene = this.scene;
        const D = A.death;
        const f = this.facing;
        const bs = this.sprite.baseScale;

        this.hpBar.setVisible(false);
        if (this._flashTimer) { this._flashTimer.remove(); this._flashTimer = null; }
        this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
        scene.time.delayedCall(60, () => {
            if (this.sprite.active) { this.sprite.setTint(0x8a8078).setTintMode(Phaser.TintModes.MULTIPLY); }
        });
        this.sprite.setScale(bs);
        this.sprite.y = 0;

        // o olho robótico pisca e apaga
        if (this.eyeGlow) {
            scene.tweens.add({ targets: this.eyeGlow, alpha: { from: 1, to: 0 }, duration: 160, repeat: 1, yoyo: false });
        }

        // a sombra se alonga na direção do tombo
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
                // cai acelerando, como um peso morto
                { rotation: f * D.tipAngle, x: f * 4, duration: D.fallMs, ease: 'Quad.easeIn' },
                {
                    // impacto: assenta com um achatamento curto (≤ 8%)
                    scaleX: bs * 1.06, scaleY: bs * 0.94, duration: D.impactMs, ease: 'Quad.easeOut', yoyo: true,
                    onStart: () => scene.effects.enemyImpact(this.x + f * 40, this.y)
                },
                {
                    // desmancha: escurece e some enquanto solta faíscas
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
        // atravessa o portão: escurece e some
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 0.9,
            y: this.y - 6,
            duration: 260,
            ease: 'Quad.easeIn',
            onComplete: () => this.destroyAll()
        });
        this.scene.tweens.add({ targets: this.shadow, alpha: 0, duration: 240 });
    }

    destroyAll () {
        if (this._flashTimer) { this._flashTimer.remove(); }
        if (this.shadow) { this.shadow.destroy(); this.shadow = null; }
        this.destroy();
    }
}
