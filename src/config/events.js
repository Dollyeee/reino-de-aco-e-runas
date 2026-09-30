// Nomes dos eventos trocados entre cenas via this.game.events.
export const EVT = {
    STATE_CHANGED: 'state-changed',      // (state) éter, vida, onda, fase
    TOWER_SELECTED: 'tower-selected',    // ({ x, y, type }) jogador clicou numa torre existente
    SELECTION_CLEARED: 'selection-cleared',
    PLACEMENT_START: 'placement-start',  // ({ type, drag }) UI pede o modo posicionamento
    PLACEMENT_RELEASE: 'placement-release', // ({ moved }) ponteiro solto sobre a carta de onde saiu
    PLACEMENT_CANCEL: 'placement-cancel',
    PLACEMENT_CHANGED: 'placement-changed', // (type | null) modo posicionamento ligou/desligou
    START_WAVE: 'start-wave',
    WAVE_STARTED: 'wave-started',        // (waveNumber)
    WAVE_CLEARED: 'wave-cleared',        // (waveNumber, bonus)
    GAME_OVER: 'game-over',              // ({ victory, wave, ether })
    RESTART: 'restart',
    NOT_ENOUGH_ETHER: 'not-enough-ether'
};
