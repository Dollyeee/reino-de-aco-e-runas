import Phaser from 'phaser';
import { WORLD, RENDER_SCALE, LIGHTING } from './config/visual.js';
import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import ResultScene from './scenes/ResultScene.js';

// Espera as fontes do Google carregarem (com limite de tempo, para funcionar offline).
async function waitForFont () {
    if (!document.fonts) { return; }
    const timeout = new Promise((resolve) => setTimeout(resolve, 2000));
    try {
        await Promise.race([
            Promise.all([document.fonts.load('bold 32px "Cinzel"'), document.fonts.load('bold 32px "Oxanium"')]),
            timeout
        ]);
    } catch (e) {
        // sem a fonte: usa o fallback definido em FONT
    }
}

function startGame () {
    return new Phaser.Game({
        type: Phaser.WEBGL,
        parent: 'game',
        width: WORLD.width * RENDER_SCALE,
        height: WORLD.height * RENDER_SCALE,
        backgroundColor: '#1a1226',
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        render: {
            // pixel art: filtro NEAREST, roundPixels e canvas "crisp" (texturas suaves pedem LINEAR no BootScene)
            pixelArt: true,
            maxLights: LIGHTING.maxLights
        },
        scene: [BootScene, GameScene, UIScene, ResultScene]
    });
}

waitForFont().then(() => {
    // Acesso pelo console do navegador, útil para depurar/ajustar.
    window.__game = startGame();
});
