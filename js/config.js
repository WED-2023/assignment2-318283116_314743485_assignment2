// Game configuration
let gameConfig = {
    fireKey: 'Space',
    gameTime: 2, // minutes
    playerColor: '#6d28d9',
    enemyColor: '#ef4444',
};

document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const configForm = document.getElementById('config-form');
    const fireKeySelect = document.getElementById('fire-key');
    const gameTimeSlider = document.getElementById('game-time');
    const gameTimeValue = document.getElementById('game-time-value');
    const playerColorInput = document.getElementById('player-color');
    const enemyColorInput = document.getElementById('enemy-color');
    
    // Populate key options
    if (fireKeySelect) {
        populateKeyOptions();
    }
    
    // Set up event listeners
    if (gameTimeSlider) {
        gameTimeSlider.addEventListener('input', function() {
            gameTimeValue.textContent = this.value;
        });
    }
    
    // Config form handler
    if (configForm) {
        configForm.addEventListener('submit', startGame);
    }
    
});

// Populate fire key options
function populateKeyOptions() {
    const fireKeySelect = document.getElementById('fire-key');
    
    // Add letter keys (A-Z)
    for (let i = 65; i <= 90; i++) {
        const key = String.fromCharCode(i);
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        fireKeySelect.appendChild(option);
    }
}

function startGame(e) {
    e.preventDefault();
    
    const fireKeyValue = document.getElementById('fire-key').value;
    const gameTimeValue = parseInt(document.getElementById('game-time').value);
    const playerColorValue = document.getElementById('player-color').value;
    const enemyColorValue = document.getElementById('enemy-color').value;
    
    if (!fireKeyValue) {
        alert('אנא בחר מקש יריה');
        return;
    }
    
    
    window.gameConfig = {
        fireKey: fireKeyValue,
        gameTime: gameTimeValue,
        playerColor: playerColorValue,
        enemyColor: enemyColorValue
    };
    
    console.log("Game config saved:", window.gameConfig);
    
    window.appFunctions.showScreen('game-screen');
    window.gameModule.initGame();
}