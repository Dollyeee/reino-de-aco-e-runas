// Nomes dos eventos trocados entre cenas via this.game.events.
export const EVT = {
    STATE_CHANGED: 'state-changed',      // (state) éter, vida, onda, fase
    SLOT_SELECTED: 'slot-selected',      // (slot) jogador clicou numa plataforma vazia
    TOWER_SELECTED: 'tower-selected',    // (tower) jogador clicou numa torre existente
    SELECTION_CLEARED: 'selection-cleared',
    BUILD_REQUEST: 'build-request',      // (slotId, towerType) UI pede construção
    BUILD_PREVIEW: 'build-preview',      // (slotId, towerType|null) mostrar alcance no hover
    START_WAVE: 'start-wave',
    WAVE_STARTED: 'wave-started',        // (waveNumber)
    WAVE_CLEARED: 'wave-cleared',        // (waveNumber, bonus)
    GAME_OVER: 'game-over',              // ({ victory, wave, ether })
    RESTART: 'restart',
    NOT_ENOUGH_ETHER: 'not-enough-ether'
};
