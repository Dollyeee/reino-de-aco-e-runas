import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { BUILD_FX, COLORS, DEPTH, SHADOW } from '../config/visual.js';
import { SHADOWS } from '../config/art.js';
import { addArt, makeArt } from '../world/art.js';
import { canHit } from '../combat/damage.js';

const ADD_BLEND = Phaser.BlendModes.ADD;

// fração de progresso dentro de uma fase [início, fim]
function phase (t, range) {
    return Phaser.Math.Clamp((t - range[0]) / (range[1] - range[0]), 0, 1);
}

// Liga/desliga o visual de holograma (tint FILL ciano, sem iluminação) numa imagem ou Container.
// Imagens aditivas (brilhos) ficam como estão.
function setHologram (obj, on) {
    if (obj.list) { obj.list.forEach((c) => setHologram(c, on)); return; }
    if (!obj.setTintMode || obj.blendMode === ADD_BLEND) { return; }
    if (on) {
        if (obj._holoLit === undefined) { obj._holoLit = !!obj.lighting; }
        obj.setTint(BUILD_FX.color).setTintMode(Phaser.TintModes.FILL);
        if (obj.setLighting) { obj.setLighting(false); }
    } else {
        obj.clearTint();
        if (obj._holoLit !== undefined && obj.setLighting) { obj.setLighting(obj._holoLit); }
        delete obj._holoLit;
    }
}

// Distância entre o centro da face de cima da plataforma e a base da torre.
export const PLATFORM_OFFSET = 10;

// Torre base. (x, y) é o ponto escolhido no mapa = centro da plataforma rúnica.
// Estrutura:
//   Tower (Container no chão)  → escala usada para squash/stretch (construção, disparo)
//     └─ rig (Container)       → scaleX = ±1 para virar de lado; filhos = arte da torre
//   platform / platformGlow    → plataforma rúnica no chão (faz parte da torre, mas fica na camada do chão)
//   hitZone                    → área de clique para abrir o painel de informações
//
// Materialização (playBuildAnimation) usa this.pieces = [base, ...peças de cima], definido por cada torre:
//   base (Image)                    → revelada de baixo para cima em holograma (setCrop) com linha de varredura
//   peças de cima (Image/Container) → surgem em holograma acima do encaixe, descem e encaixam
// Torres futuras com mais peças só precisam listar as peças na ordem.
export default class Tower extends Phaser.GameObjects.Container {
    // pixelDef: versão em pixel art (towerPixel() de src/config/art.js) ou null para a arte atual (SVG).
    // Em pixel art não há escala nem rotação nos sprites: squash/kick viram deslocamento de pixel inteiro.
    constructor (scene, x, y, type, stats, shadowKey, pixelDef = null) {
        super(scene, x, y + PLATFORM_OFFSET);
        scene.add.existing(this);

        this.placeX = x;
        this.placeY = y;
        // a arte ativa pode ocupar menos chão que a torre padrão (ex.: Besta solo, T26)
        this.footprint = pixelDef?.footprintRadius ?? stats.footprintRadius;
        this.type = type;
        this.stats = stats;
        this.cooldown = 0;
        this.target = null;
        this.ready = false;
        this.pieces = [];
        this.pixel = !!pixelDef;

        // capacidades de ataque (tipo de dano, camadas que acerta) = BALANCE + modificadores
        this.capabilityMods = [];
        this.refreshCapabilities();

        this.rig = new Phaser.GameObjects.Container(scene, 0, 0);
        this.add(this.rig);

        const sh = pixelDef ? pixelDef.shadow : (SHADOWS[shadowKey] || [80, 28]);
        this.shadow = scene.shadows.add(this.x, this.y - 4, sh[0], sh[1], { pixel: this.pixel });
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

    // ------------------------------------------------ materialização rúnica
    // 1) runas giram e acendem + luz ciano  2) base em holograma revelada de baixo para cima
    // 3) peças de cima descem e encaixam (squash)  4) flash, faíscas, luz e runas apagam.
    // A torre só procura alvos quando termina (this.ready).
    playBuildAnimation () {
        const scene = this.scene;
        const F = BUILD_FX;
        const [base, ...tops] = this.pieces;
        this.ready = false;
        this.snapped = tops.map(() => false);
        this.flashed = false;

        // plataforma e sombra começam apagadas
        this.platform.setAlpha(0);
        this.platformShadow.setAlpha(0);
        this.platformGlow.setVisible(false);
        this.shadow.setAlpha(0);

        // círculo de runas no chão (Container achatado → a imagem gira "deitada" no plano do chão)
        this.runes = scene.add.container(this.placeX, this.placeY).setDepth(DEPTH.DECAL).setScale(1, F.runeFlatten);
        this.runeImg = scene.add.image(0, 0, 'rune-circle').setBlendMode('ADD').setTint(F.color)
            .setDisplaySize(F.runeRadius * 2, F.runeRadius * 2).setAlpha(0);
        this.runes.add(this.runeImg);
        this.buildLight = scene.effects.acquireLight(this.placeX, this.placeY - 24,
            { radius: F.light.radius, color: F.color, intensity: 0 });

        // base: arte sólida + cópia em holograma por cima, as duas recortadas de baixo para cima
        const parent = base.parentContainer;
        this.holoBase = makeArt(scene, base.x, base.y, base.texture.key).setScale(base.scaleX, base.scaleY).setFrame(base.frame.name);
        setHologram(this.holoBase, true);
        this.scanLine = scene.make.image({ x: 0, y: 0, key: 'dot' }, false).setBlendMode('ADD').setTint(0xe8feff);
        parent.addAt(this.holoBase, parent.getIndex(base) + 1);
        parent.addAt(this.scanLine, parent.getIndex(this.holoBase) + 1);
        this.revealTo(base, 0);
        this.revealTo(this.holoBase, 0);

        // peças de cima: invisíveis e em holograma até a fase de encaixe
        for (const p of tops) {
            p._mountY = p.y;
            p.setAlpha(0);
            setHologram(p, true);
        }

        this.buildTween = scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: BALANCE.towers.buildTime * 1000,
            ease: 'Linear',
            onUpdate: (tw) => this.buildStep(tw.getValue()),
            onComplete: () => this.finishBuild()
        });
    }

    // Mostra só uma faixa horizontal da imagem, medida de BAIXO para CIMA em frações da altura
    // (from = 0 é a base da imagem, to = 1 é o topo). Usa setCrop em pixels da textura.
    revealBand (img, from, to) {
        const fw = img.frame.width, fh = img.frame.height;
        const lo = Math.round(fh * Phaser.Math.Clamp(from, 0, 1));
        const hi = Math.round(fh * Phaser.Math.Clamp(to, 0, 1));
        if (hi - lo <= 0) { img.setVisible(false); return; }
        img.setVisible(true);
        if (lo === 0 && hi === fh) { img.setCrop(); return; }
        img.setCrop(0, fh - hi, fw, hi - lo);
    }

    revealTo (img, fraction) {
        this.revealBand(img, 0, fraction);
    }

    buildStep (t) {
        const scene = this.scene;
        const F = BUILD_FX;
        const [base, ...tops] = this.pieces;

        // 1) runas + luz + plataforma (tudo apaga durante o final)
        const r = phase(t, F.runes);
        const fade = 1 - phase(t, F.finale);
        this.runeImg.rotation = t * F.runeSpin;
        this.runeImg.setAlpha(Phaser.Math.Easing.Quadratic.Out(r) * fade * (0.85 + 0.15 * Math.sin(t * 40)));
        const rs = 0.6 + 0.4 * Phaser.Math.Easing.Back.Out(r);
        this.runes.setScale(rs, rs * F.runeFlatten);
        if (this.buildLight) { this.buildLight.intensity = F.light.intensity * r * fade; }
        const pbs = this.platform.baseScale;
        this.platform.setAlpha(r).setScale(pbs * (0.7 + 0.3 * r));
        this.platformShadow.setAlpha(0.3 * r);

        // 2) base em holograma revelada de baixo para cima; a arte sólida vem logo atrás da varredura
        const b = phase(t, F.base);
        const h = base.displayHeight;
        const lag = F.scanLag / h;
        const solid = b <= 0 ? 0 : (b >= 1 ? 1 : Math.max(0, b - lag));
        this.revealTo(base, solid);
        // o holograma é só a faixa entre a arte já sólida e a linha de varredura
        this.revealBand(this.holoBase, solid, b >= 1 ? 0 : b);
        this.holoBase.setAlpha(F.hologramAlpha * (0.8 + 0.2 * Math.sin(t * 50)));
        const scanning = b > 0 && b < 1;
        this.scanLine.setVisible(scanning);
        if (scanning) {
            const top = base.y - h * base.originY;
            this.scanLine.setPosition(base.x, top + h * (1 - b));
            this.scanLine.setDisplaySize(base.displayWidth * F.scanWidth, 7).setAlpha(0.9);
        }

        // sombra cresce junto com a revelação (começa pequena e fraca)
        const k = 0.3 + 0.7 * b;
        if (!this.shadow.pixel) { this.shadow.setDisplaySize(this.shadow.baseW * k, this.shadow.baseH * k); }
        this.shadow.setAlpha(SHADOW.alpha * b);

        // 3) peças de cima: surgem acima do encaixe, descem com Back.easeOut e ficam sólidas no impacto
        const sp = phase(t, F.snap);
        tops.forEach((p, i) => {
            if (this.snapped[i]) { return; }
            const q = Phaser.Math.Clamp(sp * tops.length - i, 0, 1);
            p.y = p._mountY - F.snapLift * (1 - Phaser.Math.Easing.Back.Out(q));
            p.setAlpha(Math.min(1, q * 4) * F.hologramAlpha);
            if (q >= 1) { this.snapPiece(p, i); }
        });

        // 4) final: flash branco rápido e faíscas ciano (runas e luz já apagam acima)
        if (!this.flashed && t >= F.finale[0]) {
            this.flashed = true;
            const cy = this.y - h * 0.6;
            scene.effects.flash(this.x, cy, 0xffffff, F.flashSize, 140);
            scene.effects.sparks.explode(F.sparks, this.x, cy);
        }
    }

    snapPiece (p, i) {
        this.snapped[i] = true;
        p.y = p._mountY;
        p.setAlpha(1);
        setHologram(p, false);
        if (this.pixel) { this.kick(); return; }
        // squash de ~6% na torre inteira
        const sq = BUILD_FX.squash;
        this.scene.tweens.killTweensOf(this);
        this.setScale(1 + sq, 1 - sq);
        this.scene.tweens.add({ targets: this, scaleX: 1, scaleY: 1, duration: 260, ease: 'Back.easeOut' });
    }

    finishBuild () {
        const [base, ...tops] = this.pieces;
        tops.forEach((p, i) => { if (!this.snapped[i]) { this.snapPiece(p, i); } });
        base.setCrop();
        base.setVisible(true);
        if (this.holoBase) { this.holoBase.destroy(); this.holoBase = null; }
        if (this.scanLine) { this.scanLine.destroy(); this.scanLine = null; }
        if (this.runes) { this.runes.destroy(); this.runes = null; }
        this.scene.effects.releaseLight(this.buildLight);
        this.buildLight = null;
        this.platform.setAlpha(1).setScale(this.platform.baseScale);
        this.platformShadow.setAlpha(0.3);
        this.platformGlow.setVisible(true);
        if (!this.shadow.pixel) { this.shadow.setDisplaySize(this.shadow.baseW, this.shadow.baseH); }
        this.shadow.setAlpha(SHADOW.alpha);
        this.buildTween = null;
        this.ready = true;
    }

    // Squash rápido do corpo todo (disparo). Pixel art: afunda 1 px e volta (sem escala).
    kick (sx = 1.12, sy = 0.88, duration = 420) {
        if (this.pixel) {
            this.rig.y = 1;
            if (this._kickTimer) { this._kickTimer.remove(); }
            this._kickTimer = this.scene.time.delayedCall(90, () => { this.rig.y = 0; });
            return;
        }
        this.scene.tweens.killTweensOf(this);
        this.setScale(sx, sy);
        this.scene.tweens.add({ targets: this, scaleX: 1, scaleY: 1, duration, ease: 'Elastic.easeOut', easeParams: [1.1, 0.4] });
    }

    // ------------------------------------------------ capacidades de ataque
    // Hook para upgrades futuros: um modificador pode trocar o tipo de dano ou adicionar camadas,
    // ex.: addCapabilityMod({ damageType: 'explosivo' }) ou addCapabilityMod({ addCanHit: ['voador'] }).
    addCapabilityMod (mod) {
        this.capabilityMods.push(mod);
        this.refreshCapabilities();
    }

    refreshCapabilities () {
        let damageType = this.stats.damageType;
        const layers = new Set(this.stats.canHit);
        for (const m of this.capabilityMods) {
            if (m.damageType) { damageType = m.damageType; }
            for (const l of m.addCanHit || []) { layers.add(l); }
        }
        this.damageType = damageType;
        this.canHit = [...layers];
    }

    // Ataque com o dano informado e as capacidades atuais da torre (para os projéteis).
    attack (damage) {
        return { damage, damageType: this.damageType, canHit: this.canHit };
    }

    // Alvo = inimigo mais avançado no caminho dentro do alcance (só os que a torre consegue acertar).
    acquireTarget (range, minRange = 0) {
        let best = null;
        for (const e of this.scene.enemies) {
            if (!e.alive || !canHit(this, e)) { continue; }
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
        if (this.buildTween) { this.buildTween.remove(); }
        if (this.runes) { this.runes.destroy(); }
        if (this.buildLight) { this.scene.effects.releaseLight(this.buildLight); }
        this.shadow.destroy();
        this.platformShadow.destroy();
        this.platform.destroy();
        this.platformGlow.destroy();
        this.hitZone.destroy();
        this.destroy();
    }
}
