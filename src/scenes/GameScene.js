import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { COLORS, DEPTH, HUD, LIGHTING, POSTFX } from '../config/visual.js';
import { EVT } from '../config/events.js';
import { MAP01 } from '../data/map01.js';
import PathTrack from '../world/PathTrack.js';
import MapRenderer from '../world/MapRenderer.js';
import Castle from '../world/Castle.js';
import ShadowLayer from '../effects/Shadow.js';
import Effects from '../effects/Effects.js';
import WaveManager from '../waves/WaveManager.js';
import { TOWER_TYPES } from '../towers/index.js';
import { addArt, setupWorldCamera } from '../world/art.js';

// Cena principal: mundo, torres, inimigos, projéteis e regras da partida.
export default class GameScene extends Phaser.Scene {
    constructor () {
        super('GameScene');
    }

    create () {
        const cam = setupWorldCamera(this.cameras.main);
        cam.setBackgroundColor(COLORS.grass);

        // iluminação dinâmica + pós-processamento (Bloom + vinheta)
        this.lights.enable().setAmbientColor(LIGHTING.ambient);
        Phaser.Actions.AddEffectBloom(cam, POSTFX.bloom);
        const v = POSTFX.vignette;
        cam.filters.external.addVignette(0.5, 0.5, v.radius, v.strength, v.color);

        this.map = MAP01;
        this.track = new PathTrack(this.map.path, this.map.cornerRadius);
        this.shadows = new ShadowLayer(this);
        this.effects = new Effects(this);
        new MapRenderer(this, this.map, this.track, this.shadows).build();
        this.castle = new Castle(this, this.map.castle);

        this.enemies = [];
        this.towers = [];
        this.projectiles = [];

        this.state = {
            ether: BALANCE.economy.startingEther,
            coreHealth: BALANCE.core.maxHealth,
            coreMax: BALANCE.core.maxHealth,
            wave: 0,
            totalWaves: BALANCE.waves.length,
            phase: 'build'           // 'build' | 'wave' | 'victory' | 'defeat'
        };
        this.waves = new WaveManager(this, BALANCE.waves);

        this.rangeGfx = this.add.graphics().setDepth(DEPTH.RANGE);
        this.createSlots();

        // clicar no "nada" fecha menus/seleção
        this.input.on('pointerdown', (pointer, over) => {
            if (over.length === 0) { this.clearSelection(); }
        });
        this.input.keyboard.on('keydown-SPACE', () => this.startWave());
        this.input.keyboard.on('keydown-ESC', () => this.clearSelection());

        this.listen(EVT.BUILD_REQUEST, this.onBuildRequest);
        this.listen(EVT.BUILD_PREVIEW, this.onBuildPreview);
        this.listen(EVT.START_WAVE, this.startWave);
        this.listen(EVT.SELECTION_CLEARED, this.onSelectionCleared);
        this.listen(EVT.RESTART, this.restartGame);

        if (this.scene.isActive('UIScene')) { this.scene.stop('UIScene'); }
        this.scene.launch('UIScene');

        cam.fadeIn(500, 26, 18, 38);
        this.time.delayedCall(50, () => this.emitState());
    }

    // Registra listener em game.events e remove automaticamente quando a cena encerra.
    listen (event, fn) {
        const bound = fn.bind(this);
        this.game.events.on(event, bound);
        this.events.once('shutdown', () => this.game.events.off(event, bound));
    }

    emitState () {
        this.game.events.emit(EVT.STATE_CHANGED, { ...this.state, canStartWave: this.canStartWave() });
    }

    canStartWave () {
        return this.state.phase === 'build' && this.waves.hasNext;
    }

    // ------------------------------------------------------------ plataformas

    createSlots () {
        this.slots = this.map.buildSlots.map((s) => {
            this.add.image(s.x + 6, s.y + 16, 'shadow').setDisplaySize(108, 38).setAlpha(0.3).setDepth(DEPTH.DECAL);
            const img = addArt(this, s.x, s.y, 'build-slot').setLighting(true).setDepth(DEPTH.DECAL + 1);
            const glow = this.add.image(s.x, s.y, 'ring')
                .setBlendMode('ADD').setTint(COLORS.cyan).setDisplaySize(66, 24).setAlpha(0.4)
                .setDepth(DEPTH.DECAL + 2);
            this.tweens.add({
                targets: glow,
                alpha: { from: 0.25, to: 0.7 },
                duration: 1100 + Math.random() * 400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            const zone = this.add.zone(s.x, s.y, 100, 44);
            zone.setInteractive({
                hitArea: new Phaser.Geom.Ellipse(50, 22, 100, 44),
                hitAreaCallback: Phaser.Geom.Ellipse.Contains,
                useHandCursor: true
            });

            const slot = { ...s, img, glow, zone, tower: null };
            zone.on('pointerover', () => this.hoverSlot(slot, true));
            zone.on('pointerout', () => this.hoverSlot(slot, false));
            zone.on('pointerdown', () => this.selectSlot(slot));
            return slot;
        });
    }

    hoverSlot (slot, over) {
        if (slot.tower) { return; }
        const bs = slot.img.baseScale;
        this.tweens.killTweensOf(slot.img);
        this.tweens.add({
            targets: slot.img,
            scaleX: bs * (over ? 1.1 : 1),
            scaleY: bs * (over ? 1.1 : 1),
            duration: over ? 260 : 180,
            ease: over ? 'Back.easeOut' : 'Quad.easeOut'
        });
    }

    selectSlot (slot) {
        if (this.state.phase === 'victory' || this.state.phase === 'defeat') { return; }

        if (slot.tower) {
            this.selected = slot;
            this.showRange(slot.tower.x, slot.tower.y, slot.tower.stats.range);
            this.game.events.emit(EVT.TOWER_SELECTED, {
                slotId: slot.id, x: slot.x, y: slot.y, type: slot.tower.type
            });
            slot.tower.kick(1.08, 0.92, 400);
            return;
        }

        this.selected = slot;
        this.rangeGfx.clear();
        const bs = slot.img.baseScale;
        this.tweens.killTweensOf(slot.img);
        slot.img.setScale(bs * 1.25, bs * 0.8);
        this.tweens.add({ targets: slot.img, scaleX: bs * 1.1, scaleY: bs * 1.1, duration: 420, ease: 'Elastic.easeOut' });
        this.game.events.emit(EVT.SLOT_SELECTED, { slotId: slot.id, x: slot.x, y: slot.y });
    }

    clearSelection () {
        if (!this.selected) { return; }
        this.game.events.emit(EVT.SELECTION_CLEARED);
    }

    onSelectionCleared () {
        const slot = this.selected;
        this.selected = null;
        this.hideRange();
        if (slot && !slot.tower) { this.hoverSlot(slot, false); }
    }

    showRange (x, y, r) {
        const g = this.rangeGfx;
        g.clear();
        g.setPosition(x, y);
        g.fillStyle(COLORS.cyan, 0.12);
        g.fillCircle(0, 0, r);
        g.lineStyle(3, COLORS.cyan, 0.75);
        g.strokeCircle(0, 0, r);
        g.lineStyle(2, 0xffffff, 0.35);
        g.strokeCircle(0, 0, r - 5);
        g.setAlpha(1);
        this.tweens.killTweensOf(g);
        g.setScale(0.6);
        this.tweens.add({ targets: g, scale: 1, duration: 300, ease: 'Back.easeOut' });
    }

    hideRange () {
        const g = this.rangeGfx;
        this.tweens.killTweensOf(g);
        this.tweens.add({ targets: g, alpha: 0, scale: 0.9, duration: 140, onComplete: () => g.clear() });
    }

    onBuildPreview ({ slotId, type }) {
        const slot = this.slots.find((s) => s.id === slotId);
        if (!slot || slot.tower) { return; }
        if (type) {
            this.showRange(slot.x, slot.y, BALANCE.towers[type].range);
        } else {
            this.hideRange();
        }
    }

    onBuildRequest ({ slotId, type }) {
        const slot = this.slots.find((s) => s.id === slotId);
        if (!slot || slot.tower) { return; }
        const cost = BALANCE.towers[type].cost;
        if (this.state.ether < cost) {
            this.game.events.emit(EVT.NOT_ENOUGH_ETHER);
            return;
        }
        this.state.ether -= cost;

        const tower = new TOWER_TYPES[type](this, slot);
        tower.playBuildAnimation();
        slot.tower = tower;
        this.towers.push(tower);

        // a plataforma fica ocupada: some o brilho e a área de clique passa a cobrir a torre
        this.tweens.killTweensOf(slot.glow);
        this.tweens.add({ targets: slot.glow, alpha: 0, duration: 200 });
        slot.img.setScale(slot.img.baseScale);
        slot.zone.setSize(100, 130);
        slot.zone.y = slot.y - 43;
        slot.zone.input.hitArea = new Phaser.Geom.Rectangle(0, 0, 100, 130);
        slot.zone.input.hitAreaCallback = Phaser.Geom.Rectangle.Contains;

        this.clearSelection();
        this.emitState();
    }

    // ----------------------------------------------------------------- ondas

    startWave () {
        if (!this.canStartWave()) { return; }
        if (this.waves.start()) {
            this.state.phase = 'wave';
            this.state.wave = this.waves.number;
            this.game.events.emit(EVT.WAVE_STARTED, this.waves.number);
            this.emitState();
        }
    }

    onWaveCleared (number) {
        if (this.state.phase !== 'wave') { return; }
        const eco = BALANCE.economy;
        const bonus = eco.waveClearBonusBase + eco.waveClearBonusPerWave * number;

        if (!this.waves.hasNext) {
            this.victory();
            return;
        }
        this.state.ether += bonus;
        this.state.phase = 'build';
        this.game.events.emit(EVT.WAVE_CLEARED, number, bonus);
        this.emitState();
    }

    onEnemyKilled (enemy) {
        this.state.ether += enemy.reward;
        this.effects.etherGain(enemy.x, enemy.y, enemy.reward, HUD.ether.x, HUD.ether.y, () => {
            this.game.events.emit('ether-pulse');
        });
        this.emitState();
    }

    onEnemyReachedCore (enemy) {
        if (this.state.phase !== 'wave') { return; }
        this.state.coreHealth = Math.max(0, this.state.coreHealth - enemy.coreDamage);
        this.castle.hit(this.state.coreHealth / this.state.coreMax);
        this.game.events.emit('core-hit');
        this.emitState();
        if (this.state.coreHealth <= 0) {
            this.defeat();
        }
    }

    victory () {
        this.state.phase = 'victory';
        this.clearSelection();
        this.emitState();
        // fogos de plasma sobre o castelo
        for (let i = 0; i < 7; i++) {
            this.time.delayedCall(i * 260, () => {
                const x = Phaser.Math.Between(200, 1100), y = Phaser.Math.Between(160, 520);
                this.effects.plasma.explode(26, x, y);
                this.effects.sparks.explode(14, x, y);
                this.effects.flashLight(x, y, { radius: 260, color: [COLORS.cyan, COLORS.gold, 0xff8fb1][i % 3], intensity: 2 }, 500);
            });
        }
        this.time.delayedCall(1400, () => this.showResult(true));
    }

    defeat () {
        this.state.phase = 'defeat';
        this.clearSelection();
        this.castle.shatter();
        this.emitState();
        this.time.delayedCall(1500, () => this.showResult(false));
    }

    showResult (victory) {
        this.game.events.emit(EVT.GAME_OVER, { victory, wave: this.state.wave, totalWaves: this.state.totalWaves });
        this.scene.launch('ResultScene', {
            victory,
            wave: this.state.wave,
            totalWaves: this.state.totalWaves,
            coreHealth: this.state.coreHealth,
            coreMax: this.state.coreMax,
            towers: this.towers.length
        });
    }

    restartGame () {
        this.scene.stop('ResultScene');
        this.scene.restart();
    }

    // ------------------------------------------------------------------ loop

    update (time, deltaMs) {
        const dt = Math.min(deltaMs, 50) / 1000;

        if (this.state.phase === 'wave') {
            this.waves.update(dt);
        }

        for (const e of this.enemies) { e.update(dt); }
        for (const t of this.towers) { t.update(dt); }
        for (const p of this.projectiles) { p.update(dt); }

        this.enemies = this.enemies.filter((e) => e.alive);
        this.projectiles = this.projectiles.filter((p) => !p.done);

        this.castle.update(dt);
    }
}
