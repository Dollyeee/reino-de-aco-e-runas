import Phaser from 'phaser';
import { COLORS, WORLD } from '../config/visual.js';
import { EVT } from '../config/events.js';
import { addArt, setupWorldCamera, textStyle } from '../world/art.js';
import Button from '../ui/Button.js';

// Tela de vitória ou derrota, sobreposta ao jogo.
export default class ResultScene extends Phaser.Scene {
    constructor () {
        super('ResultScene');
    }

    create (data) {
        setupWorldCamera(this.cameras.main);
        const cx = WORLD.width / 2, cy = WORLD.height / 2;
        const victory = data.victory;

        // fundo escurecido que bloqueia cliques no jogo
        const dim = this.add.rectangle(cx, cy, WORLD.width + 40, WORLD.height + 40, 0x1a1226, 0.6).setInteractive();
        dim.setAlpha(0);
        this.tweens.add({ targets: dim, alpha: 1, duration: 400 });

        const panel = this.add.container(cx, cy);
        const w = 520, h = 330;
        const g = this.add.graphics();
        g.fillStyle(COLORS.outline, 1);
        g.fillRoundedRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 18, 32);
        g.fillStyle(0x3a2850, 1);
        g.fillRoundedRect(-w / 2, -h / 2, w, h + 6, 28);
        g.fillStyle(COLORS.uiPanelLight, 1);
        g.fillRoundedRect(-w / 2, -h / 2, w, h - 4, 28);
        g.fillStyle(0x6a4f8a, 1);
        g.fillRoundedRect(-w / 2 + 22, -h / 2 + 10, w * 0.4, 7, 3.5);
        g.lineStyle(3, victory ? COLORS.cyan : COLORS.red, 0.6);
        g.strokeRoundedRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 24, 22);
        panel.add(g);

        const icon = addArt(this, 0, -h / 2 + 8, victory ? 'core-crystal' : 'icon-core', victory ? 0.9 : 1.6);
        if (!victory) { icon.setTint(0x8a7f9e); }
        panel.add(icon);
        this.tweens.add({ targets: icon, y: icon.y - 8, angle: victory ? 0 : -8, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        const title = this.add.text(0, -58, victory ? 'VITÓRIA!' : 'DERROTA', textStyle(72, victory ? '#ffd34d' : '#ff6b7a')).setOrigin(0.5);
        panel.add(title);

        const lines = victory
            ? [`O Núcleo Arcano resistiu às ${data.totalWaves} ondas!`, `Vida restante: ${data.coreHealth}/${data.coreMax}  •  Torres: ${data.towers}`]
            : ['O Núcleo Arcano foi destruído...', `Você chegou à onda ${data.wave} de ${data.totalWaves}.`];
        lines.forEach((l, i) => panel.add(this.add.text(0, 8 + i * 32, l, textStyle(22)).setOrigin(0.5)));

        const btn = new Button(this, 0, 118, 250, 58, victory ? 'Jogar de novo' : 'Tentar de novo', () => {
            this.game.events.emit(EVT.RESTART);
        }, { palette: victory ? 'gold' : 'cyan', fontSize: 26 });
        panel.add(btn);

        // entrada: cai de cima e quica
        panel.y = -300;
        panel.setScale(0.8, 1.2);
        this.tweens.chain({
            targets: panel,
            tweens: [
                { y: cy, duration: 420, ease: 'Quad.easeIn' },
                { scaleX: 1.2, scaleY: 0.8, duration: 90, ease: 'Quad.easeOut' },
                { scaleX: 1, scaleY: 1, duration: 700, ease: 'Elastic.easeOut' }
            ]
        });
        this.tweens.add({ targets: title, scaleX: 1.06, scaleY: 0.95, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 600 });

        if (victory) {
            this.add.particles(cx, -20, 'chunk', {
                x: { min: -640, max: 640 },
                speedY: { min: 120, max: 260 },
                speedX: { min: -60, max: 60 },
                rotate: { start: 0, end: 720 },
                lifespan: 4200,
                scale: { min: 0.5, max: 1 },
                tint: [COLORS.cyan, COLORS.gold, 0xff8fb1, 0x8af25a, 0xffffff],
                frequency: 40,
                gravityY: 40
            });
        }
    }
}
