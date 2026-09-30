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
import TowerPlacer from '../towers/TowerPlacer.js';
import PlacementRules from '../world/PlacementRules.js';
import { setupWorldCamera } from '../world/art.js';

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
        this.placer = new TowerPlacer(this, new PlacementRules(this.map, this.track));

        // botão direito cancela o posicionamento (sem abrir o menu do navegador)
        if (this.input.mouse) { this.input.mouse.disableContextMenu(); }
        this.input.on('pointerdown', (pointer, over) => {
            if (this.placer.active) { this.placer.onPointerDown(pointer); return; }
            if (over.length === 0) { this.clearSelection(); }   // clicar no "nada" fecha o painel/seleção
        });
        this.input.on('pointerup', (pointer) => this.placer.onPointerUp(pointer));
        this.input.keyboard.on('keydown-SPACE', () => this.startWave());
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.placer.active) { this.placer.cancel(); } else { this.clearSelection(); }
        });

        this.listen(EVT.PLACEMENT_START, this.onPlacementStart);
        this.listen(EVT.PLACEMENT_RELEASE, ({ moved }) => this.placer.onReleaseOnBar(moved));
        this.listen(EVT.PLACEMENT_CANCEL, () => this.placer.cancel());
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

    // ---------------------------------------------------------- construção

    get isOver () {
        return this.state.phase === 'victory' || this.state.phase === 'defeat';
    }

    onPlacementStart ({ type, drag }) {
        if (this.isOver) { return; }
        if (this.state.ether < BALANCE.towers[type].cost) {
            this.game.events.emit(EVT.NOT_ENOUGH_ETHER);
            return;
        }
        this.clearSelection();
        this.placer.start(type, drag);
    }

    // Constrói de fato (o TowerPlacer já validou o local e o éter).
    buildTower (type, x, y) {
        this.state.ether -= BALANCE.towers[type].cost;
        const tower = new TOWER_TYPES[type](this, x, y);
        tower.playBuildAnimation();
        this.towers.push(tower);
        this.emitState();
        return tower;
    }

    onTowerClicked (tower) {
        if (this.placer.active || this.isOver) { return; }   // no modo posicionamento o clique é tratado pelo TowerPlacer
        this.selected = tower;
        this.showRange(tower.x, tower.y, tower.stats.range);
        this.game.events.emit(EVT.TOWER_SELECTED, { x: tower.placeX, y: tower.placeY, type: tower.type });
        tower.kick(1.08, 0.92, 400);
    }

    clearSelection () {
        if (!this.selected) { return; }
        this.game.events.emit(EVT.SELECTION_CLEARED);
    }

    onSelectionCleared () {
        this.selected = null;
        this.hideRange();
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
        this.placer.cancel();
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
        this.placer.cancel();
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
        this.placer.update();
    }
}
