import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { COLORS, HUD, WORLD } from '../config/visual.js';
import { EVT } from '../config/events.js';
import { addArt, numberStyle, setupWorldCamera, textStyle } from '../world/art.js';
import Button from '../ui/Button.js';
import TowerBar from '../ui/TowerBar.js';
import TowerInfoPanel from '../ui/TowerInfoPanel.js';
import { towerBarRect } from '../world/PlacementRules.js';

// HUD: éter, vida do Núcleo, onda atual, botão de iniciar onda, barra de torres, painel de torre e avisos.
// Roda por cima da GameScene, sem Bloom (textos ficam limpos).
export default class UIScene extends Phaser.Scene {
    constructor () {
        super('UIScene');
    }

    create () {
        setupWorldCamera(this.cameras.main);
        this.state = null;
        this.displayEther = BALANCE.economy.startingEther;

        this.buildHud();
        this.infoPanel = new TowerInfoPanel(this);
        this.towerBar = new TowerBar(this);
        this.input.keyboard.on('keydown-ONE', () => this.towerBar.select(0));
        this.input.keyboard.on('keydown-TWO', () => this.towerBar.select(1));

        const b = HUD.waveButton;
        this.buttonGlow = this.add.image(b.x, b.y + 4, 'dot').setBlendMode('ADD').setTint(COLORS.cyan)
            .setDisplaySize(300, 110).setAlpha(0);
        this.waveButton = new Button(this, b.x, b.y, b.w, b.h, 'Iniciar Onda 1', () => {
            this.game.events.emit(EVT.START_WAVE);
        }, { fontSize: 24 });
        this.glowTween = this.tweens.add({
            targets: this.buttonGlow,
            alpha: { from: 0.15, to: 0.55 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.hint = this.add.text(WORLD.width / 2, towerBarRect().y - 16,
            '1/2 escolhe a torre  •  clique constrói  •  Shift constrói várias  •  Esc cancela  •  Espaço inicia a onda  •  roda do mouse: zoom (0 volta)',
            textStyle(14, '#fff6e6', { strokeThickness: 4 })).setOrigin(0.5).setAlpha(0.95);
        this.tweens.add({ targets: this.hint, y: this.hint.y - 4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        const on = (evt, fn) => {
            const bound = fn.bind(this);
            this.game.events.on(evt, bound);
            this.events.once('shutdown', () => this.game.events.off(evt, bound));
        };
        on(EVT.STATE_CHANGED, this.onState);
        on(EVT.TOWER_SELECTED, (info) => this.infoPanel.open(info));
        on(EVT.SELECTION_CLEARED, () => this.infoPanel.close());
        on(EVT.PLACEMENT_CHANGED, (type) => this.towerBar.setActive(type));
        on(EVT.WAVE_STARTED, this.onWaveStarted);
        on(EVT.WAVE_CLEARED, this.onWaveCleared);
        on(EVT.NOT_ENOUGH_ETHER, this.onNotEnoughEther);
        on(EVT.GAME_OVER, this.onGameOver);
        on('ether-pulse', () => this.squash(this.etherIcon, 1.35, 0.7));
        on('core-hit', this.onCoreHit);
    }

    // ------------------------------------------------------------------ HUD

    buildHud () {
        const g = this.add.graphics();
        const { x, y, w, h } = HUD.panel;
        g.fillStyle(COLORS.outline, 1);
        g.fillRoundedRect(x - 4, y - 4, w + 8, h + 14, 22);
        g.fillStyle(0x3a2850, 1);
        g.fillRoundedRect(x, y, w, h + 5, 18);
        g.fillStyle(COLORS.uiPanelLight, 1);
        g.fillRoundedRect(x, y, w, h - 2, 18);
        g.fillStyle(0x6a4f8a, 1);
        g.fillRoundedRect(x + 16, y + 6, 160, 5, 2.5);
        g.lineStyle(2, 0x2b1d33, 0.6);
        g.lineBetween(HUD.core.x - 30, y + 12, HUD.core.x - 30, y + h - 12);
        g.lineBetween(HUD.wave.x - 30, y + 12, HUD.wave.x - 30, y + h - 12);

        this.etherIcon = addArt(this, HUD.ether.x, HUD.ether.y, 'icon-ether', 0.82);
        this.etherText = this.add.text(HUD.ether.x + 26, HUD.ether.y, '0', numberStyle(30, '#5ef0ff')).setOrigin(0, 0.5);

        this.coreIcon = addArt(this, HUD.core.x, HUD.core.y, 'icon-core', 0.8);
        this.coreText = this.add.text(HUD.core.x + 26, HUD.core.y - 9, '', numberStyle(22)).setOrigin(0, 0.5);
        this.coreBar = this.add.graphics();

        this.waveIcon = addArt(this, HUD.wave.x, HUD.wave.y, 'icon-wave', 0.8);
        this.waveText = this.add.text(HUD.wave.x + 26, HUD.wave.y, '', numberStyle(24)).setOrigin(0, 0.5);

        // ícones "respiram"
        for (const [icon, d] of [[this.etherIcon, 0], [this.coreIcon, 300], [this.waveIcon, 600]]) {
            icon.idle = this.tweens.add({
                targets: icon,
                scaleY: icon.baseScale * 1.06,
                scaleX: icon.baseScale * 0.96,
                duration: 900,
                delay: d,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    drawCoreBar (pct) {
        const g = this.coreBar;
        const x = HUD.core.x + 26, y = HUD.core.y + 8, w = 112, h = 10;
        g.clear();
        g.fillStyle(COLORS.outline, 1);
        g.fillRoundedRect(x - 3, y - 3, w + 6, h + 6, 7);
        g.fillStyle(0x5a2433, 1);
        g.fillRoundedRect(x, y, w, h, 5);
        if (pct > 0) {
            const color = pct > 0.5 ? 0xff4f6a : pct > 0.25 ? 0xff8a3d : 0xff2a3a;
            g.fillStyle(color, 1);
            g.fillRoundedRect(x, y, Math.max(10, w * pct), h, 5);
            g.fillStyle(0xffffff, 0.45);
            g.fillRoundedRect(x + 3, y + 2, Math.max(4, w * pct - 6), 3, 1.5);
        }
    }

    onState (state) {
        const prev = this.state;
        this.state = state;

        if (!prev || prev.ether !== state.ether) {
            this.tweens.killTweensOf(this);
            this.tweens.add({ targets: this, displayEther: state.ether, duration: 350, ease: 'Quad.easeOut' });
            if (prev && state.ether < prev.ether) { this.squash(this.etherIcon, 0.7, 1.3); }
        }

        this.coreText.setText(`${state.coreHealth}/${state.coreMax}`);
        this.drawCoreBar(state.coreHealth / state.coreMax);
        this.waveText.setText(`Onda ${state.wave}/${state.totalWaves}`);

        const btn = this.waveButton;
        if (state.phase === 'victory' || state.phase === 'defeat') {
            btn.setVisible(false);
            this.buttonGlow.setVisible(false);
        } else if (state.phase === 'wave') {
            btn.setLabel(`Onda ${state.wave} em curso`).setEnabled(false);
            this.buttonGlow.setVisible(false);
        } else {
            btn.setLabel(state.wave === 0 ? '▶ Iniciar Onda 1' : `▶ Próxima Onda (${state.wave + 1})`).setEnabled(state.canStartWave);
            this.buttonGlow.setVisible(state.canStartWave);
        }

        this.towerBar.setEther(state.ether);
    }

    update () {
        this.etherText.setText(`${Math.round(this.displayEther)}`);
    }

    // Achatamento elástico de um ícone do HUD.
    squash (icon, sx, sy) {
        const bs = icon.baseScale;
        if (icon.idle) { icon.idle.pause(); }
        this.tweens.killTweensOf(icon);
        icon.setScale(bs * sx, bs * sy);
        this.tweens.add({
            targets: icon,
            scaleX: bs,
            scaleY: bs,
            duration: 500,
            ease: 'Elastic.easeOut',
            onComplete: () => {
                icon.idle = this.tweens.add({
                    targets: icon, scaleY: bs * 1.06, scaleX: bs * 0.96, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
        });
    }

    // --------------------------------------------------------------- avisos

    banner (title, color, subtitle) {
        const cx = WORLD.width / 2, cy = WORLD.height * 0.36;
        const t = this.add.text(cx, cy, title, textStyle(64, color)).setOrigin(0.5).setScale(2.2, 0.2).setAlpha(0);
        const items = [t];
        if (subtitle) {
            const s = this.add.text(cx, cy + 52, subtitle, textStyle(26)).setOrigin(0.5).setAlpha(0).setScale(0.5);
            items.push(s);
            this.tweens.add({ targets: s, alpha: 1, scale: 1, delay: 180, duration: 300, ease: 'Back.easeOut' });
            this.tweens.add({ targets: s, alpha: 0, delay: 1700, duration: 250 });
        }
        this.tweens.chain({
            targets: t,
            tweens: [
                { scaleX: 1, scaleY: 1, alpha: 1, duration: 340, ease: 'Back.easeOut' },
                { scaleX: 1.05, scaleY: 0.95, duration: 600, yoyo: true, ease: 'Sine.easeInOut' },
                { scaleX: 0.3, scaleY: 1.6, alpha: 0, duration: 220, ease: 'Back.easeIn' }
            ],
            onComplete: () => items.forEach((i) => i.destroy())
        });
    }

    toast (x, y, text, color = '#ff6b7a') {
        const t = this.add.text(x, y, text, textStyle(20, color)).setOrigin(0, 0.5).setScale(0.3);
        this.tweens.add({ targets: t, scale: 1, duration: 220, ease: 'Back.easeOut' });
        this.tweens.add({ targets: t, y: y + 26, alpha: 0, delay: 900, duration: 300, onComplete: () => t.destroy() });
    }

    onWaveStarted (n) {
        const w = BALANCE.waves[n - 1];
        const name = BALANCE.enemies[w.enemy].name;
        this.banner(`Onda ${n}!`, '#ffd34d', `${w.count} × ${name}`);
        if (this.hint.visible) {
            this.tweens.add({ targets: this.hint, alpha: 0, duration: 400, onComplete: () => this.hint.setVisible(false) });
        }
        this.squash(this.waveIcon, 1.4, 0.7);
    }

    onWaveCleared (n, bonus) {
        this.banner('Onda concluída!', '#8af25a', `+${bonus} de éter`);
    }

    onNotEnoughEther () {
        this.squash(this.etherIcon, 1.3, 0.75);
        this.etherText.setColor('#ff6b7a');
        this.time.delayedCall(350, () => this.etherText.setColor('#5ef0ff'));
        this.toast(HUD.ether.x - 20, HUD.ether.y + 50, 'Éter insuficiente!');
    }

    onCoreHit () {
        this.squash(this.coreIcon, 1.4, 0.65);
        this.coreText.setColor('#ff6b7a');
        this.time.delayedCall(300, () => this.coreText.setColor('#fff6e6'));
    }

    onGameOver () {
        this.infoPanel.close(true);
        this.towerBar.setEnabled(false);
        this.hint.setVisible(false);
    }
}
