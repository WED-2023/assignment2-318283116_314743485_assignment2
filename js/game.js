window.configModule = {
    getConfig: function() {
        return window.gameConfig || {
            fireKey: 'Space',
            gameTime: 2,
            playerColor: '#6d28d9',
            enemyColor: '#ef4444'
        };
    }
};
// Game variables
let gameInterval;
let speedIncreaseInterval;
let enemies = [];
let playerBullets = [];
let enemyBullets = [];
let player = {};
let score = 0;
let lives = 3;
let gameTime = 120000; // milliseconds (2 minutes by default)
let timeRemaining = 120000;
let enemiesDirection = 1; // 1 for right, -1 for left
let enemySpeed = 2; // Increased from 1 to 2 for faster initial speed
let speedIncreaseCount = 0;
let gameStarted = false;
let gameWidth, gameHeight;
let shootingAllowed = true;
let enemiesKilled = 0;
let gameHistory = [];
let backgroundMusic;
let frameCount = 0; // Add frame counter for timing
let keydownListenerActive = false;
let keyupListenerActive = false;
let gameLoopId = null; // ID of the current requestAnimationFrame


// Canvas context
let ctx;

// Image objects
let playerImage;
let enemyImages = []; // Array to hold different enemy images
let backgroundImage;

// Game loop function
function gameLoop() {
    if (!gameStarted) {
        console.log('Game not started, stopping game loop');
        return;
    }
    
    update();
    draw();
    
    if (gameStarted) {
        gameLoopId = requestAnimationFrame(gameLoop);
    }
}


// Update game state
function update() {
    if (!gameStarted) return;
    
    // Update time (only decrement once per second, approximately every 60 frames)
    frameCount++;
    if (frameCount >= 60) {
        timeRemaining--;
        frameCount = 0;
        
        if (timeRemaining <= 0) {
            endGame('time');
            return;
        }
        updateTimeDisplay();
    }
    
    // Move player based on keys pressed
    movePlayer();
    
    // Move enemies
    moveEnemies();
    
    // Move bullets
    movePlayerBullets();
    moveEnemyBullets();
    
    // Check for collisions
    checkBulletEnemyCollisions();
    checkBulletPlayerCollisions();
    
    // Random enemy fire
    if (Math.random() < 0.05) { // 5% chance each frame
        fireEnemyBullet();
    }
    
    // Check if all enemies are dead
    if (enemies.every(enemy => !enemy.alive)) {
        endGame('win');
    }
}

// Draw the entire game screen
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, gameWidth, gameHeight);
    
    // Draw player
    drawPlayer();
    
    // Draw enemies
    drawEnemies();
    
    // Draw bullets
    drawBullets();
}

// Draw player
function drawPlayer() {
    if (playerImage && playerImage.complete) {
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    } else {
        // Fallback drawing if image not loaded
        const config = getConfig();
        ctx.fillStyle = config.playerColor;
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2, player.y);
        ctx.lineTo(player.x + player.width, player.y + player.height);
        ctx.lineTo(player.x, player.y + player.height);
        ctx.closePath();
        ctx.fill();
    }
}

// Draw enemies
function drawEnemies() {
    for (const enemy of enemies) {
        if (!enemy.alive) continue;
        
        if (enemyImages[enemy.row] && enemyImages[enemy.row].complete) {
            ctx.drawImage(enemyImages[enemy.row], enemy.x, enemy.y, enemy.width, enemy.height);
        } else {
            // Fallback drawing if image not loaded
            ctx.fillStyle = getEnemyColor(enemy.row);

            // Draw inverted triangle
            ctx.beginPath();
            ctx.moveTo(enemy.x, enemy.y);
            ctx.lineTo(enemy.x + enemy.width, enemy.y);
            ctx.lineTo(enemy.x + enemy.width/2, enemy.y + enemy.height);
            ctx.closePath();
            ctx.fill();
        }
        
        // Determine score value based on row
        let scoreValue;
        switch (enemy.row) {
            case 0: scoreValue = 20; break; // Top row
            case 1: scoreValue = 15; break;
            case 2: scoreValue = 10; break;
            case 3: scoreValue = 5; break;  // Bottom row
        }
        
        // Draw score value on enemy
        ctx.fillStyle = "#ffffff"; // White text color
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(scoreValue, enemy.x + enemy.width/2, enemy.y + enemy.height/2);
    }
}

// Draw bullets
function drawBullets() {
    // Player bullets
    ctx.fillStyle = '#00ff00'; // Green for player bullets
    for (const bullet of playerBullets) {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
    
    // Enemy bullets
    ctx.fillStyle = '#ff0000'; // Red for enemy bullets
    for (const bullet of enemyBullets) {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
}

// Game initialization
function initGame() {
    resetGameState(); // 
    enemies = [];
    playerBullets = [];
    enemyBullets = [];
    score = 0;
    lives = 3;
    const config = window.gameConfig; 
    gameTime = config.gameTime * 60 * 1000; // convert minutes to milliseconds
    timeRemaining = gameTime / 1000; // Convert to seconds for display
    enemiesDirection = 1;
    enemySpeed = 2;
    speedIncreaseCount = 0;
    enemiesKilled = 0;
    shootingAllowed = true;
    gameStarted = false;  

    // Update display
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    updateTimeDisplay();
    
    // Get canvas and context
    const canvas = document.getElementById('game-canvas');
    gameWidth = canvas.width;
    gameHeight = canvas.height;
    ctx = canvas.getContext('2d');

    if (!ctx) {
        console.error('Could not get canvas context!');
        return;
    }
    
    console.log('Canvas initialized:', gameWidth, 'x', gameHeight);
    
    // Load images
    loadImages();
    
    // Create player
    createPlayer();
    
    // Create enemies
    createEnemies();
    
    // Add event listeners (only if not already added)
    if (!keydownListenerActive) {
        document.addEventListener('keydown', handleKeyDown);
        keydownListenerActive = true;
    }
    if (!keyupListenerActive) {
        document.addEventListener('keyup', handleKeyUp);
        keyupListenerActive = true;
    }
    
    playBackgroundMusic();
    
    
    // Start game loop
    gameStarted = true;
    gameLoop(); // Start the game loop using requestAnimationFrame
    
    // Set up speed increase timer (every 5 sec)
    speedIncreaseInterval = setInterval(function() {
        if (gameStarted && speedIncreaseCount < 4) {
            increaseEnemySpeed();
        }
    }, 5000);
}

function resetGameState() {
    gameStarted = false;
    
    if (speedIncreaseInterval) {
        clearInterval(speedIncreaseInterval);
        speedIncreaseInterval = null;
    }

    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }

    // Remove event listeners if they exist
    if (keydownListenerActive) {
        document.removeEventListener('keydown', handleKeyDown);
        keydownListenerActive = false;
    }
    if (keyupListenerActive) {
        document.removeEventListener('keyup', handleKeyUp);
        keyupListenerActive = false;
    }

    stopBackgroundMusic();

    // Reset critical game variables
    enemySpeed = 2;
    speedIncreaseCount = 0;
    
    console.log('Game state reset');
}

// Load game images
function loadImages() {
    // Load player image
    playerImage = new Image();
    playerImage.src = createTriangleImage(window.gameConfig.playerColor);
    
    // Use inverted triangles for all enemies
    const enemyColor = window.gameConfig.enemyColor;
    for (let row = 0; row < 4; row++) {
        enemyImages[row] = new Image();
        enemyImages[row].src = createTriangleImage(enemyColor);
    } 
    
}

// Create data URL for triangle image
function createTriangleImage(color) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 50;
    tempCanvas.height = 50;
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.fillStyle = color;
    tempCtx.beginPath();
    tempCtx.moveTo(25, 0);
    tempCtx.lineTo(50, 50);
    tempCtx.lineTo(0, 50);
    tempCtx.closePath();
    tempCtx.fill();
    
    return tempCanvas.toDataURL();
}


// Create player spaceship
function createPlayer() {
    const config = getConfig();
    
    // Calculate 40% of the game area from the bottom
    const playerAreaHeight = gameHeight * 0.4;
    const playerStartY = gameHeight - 60; // 60px from bottom
    
    // Start position: center of the screen
    const StartX = (gameWidth / 2) - 25; // Center minus half player width (50px player)
    
    player = {
        x: StartX,
        y: playerStartY,
        width: 50,
        height: 50,
        speed: 5,
        minY: gameHeight - playerAreaHeight, // Upper boundary (60% from the top)
        maxY: gameHeight - 50, // Lower boundary
        keysPressed: {},
        isHit: false,
        invulnerableUntil: 0
    };
}
// Create enemy spaceships (5x4 grid)
function createEnemies() {
    const enemyWidth = 40;
    const enemyHeight = 40;
    const horizontalSpacing = 60;
    const verticalSpacing = 50;
    const topMargin = 50;
    
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 5; col++) {
            const enemy = {
                x: col * horizontalSpacing + (gameWidth - 5 * horizontalSpacing) / 2 + horizontalSpacing / 2,
                y: row * verticalSpacing + topMargin,
                width: enemyWidth,
                height: enemyHeight,
                row: row, // Row number (0-3)
                col: col, // Column number (0-4)
                alive: true,
            };
            
            enemies.push(enemy);
        }
    }
}
function getConfig() {
    // This provides a fallback if the config module isn't working
    return window.gameConfig || {
        fireKey: 'Space',
        gameTime: 2,
        playerColor: '#6d28d9',
        enemyColor: '#ef4444'
    };
}

function getEnemyColor(row) {
    return window.gameConfig.enemyColor;
}


// Handle keyboard input
function handleKeyDown(e) {
    if (!gameStarted) return;
    
    player.keysPressed[e.code] = true;
    
    // Fire bullet with configured key
    const config = getConfig();
    let fireKeyCode;
    
    // Convert config fire key to key code
    if (config.fireKey === 'Space') {
        fireKeyCode = 'Space';
    } else {
        fireKeyCode = 'Key' + config.fireKey;
    }
    
    if (e.code === fireKeyCode && shootingAllowed) {
        console.log('Player fired!');
        firePlayerBullet();
        shootingAllowed = false; // Prevent rapid fire
        setTimeout(() => { shootingAllowed = true; }, 300); // Allow shooting again after 300ms
    }
}

function handleKeyUp(e) {
    if (!gameStarted) return;
    player.keysPressed[e.code] = false;
}

// Player shoots a bullet
function firePlayerBullet() {
    let xDirection = 0;
    if (player.keysPressed['ArrowLeft'] || player.keysPressed['KeyA']) {
        xDirection = -1; 
    } else if (player.keysPressed['ArrowRight'] || player.keysPressed['KeyD']) {
        xDirection = 1; 
    }
    const bullet = {
        x: player.x + player.width / 2 - 2, // Center of player (2 is half of bullet width)
        y: player.y - 15,
        width: 4,
        height: 15,
        speed: 7,
        xSpeed: 5 * xDirection 

    };
    
    playerBullets.push(bullet);
    
    // Play shooting sound
    playSound('player-shoot');

}

// Random enemy shoots a bullet
function fireEnemyBullet() {
    if (!gameStarted || enemies.length === 0) return;
    // Only shoot if there are no enemy bullets or all bullets have passed 3/4 of the screen
    // This ensures that we ONLY fire when no bullets are in the top 3/4 of the screen
    if (enemyBullets.length > 0) {
        // Check if ANY bullet is still in the top 3/4 of the screen
        const anyBulletInTop = enemyBullets.some(bullet => bullet.y <= gameHeight * 0.75);
        if (anyBulletInTop) {
            return; // Can't shoot yet
        }
    }
    
    // Get only alive enemies
    const aliveEnemies = enemies.filter(enemy => enemy.alive);
    if (aliveEnemies.length === 0) return;
    
    // Choose a random enemy
    const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    
    const xDirection = Math.random() > 0.5 ? 1 : -1;

    const bullet = {
        x: randomEnemy.x + randomEnemy.width / 2 - 2, // Center of enemy (2 is half of bullet width)
        y: randomEnemy.y + randomEnemy.height,
        width: 4,
        height: 15,
        speed: 3 + speedIncreaseCount * 0.5, // Increase speed based on level
        xSpeed: 4 * xDirection 

    };
    
    enemyBullets.push(bullet);
    
    // Play shooting sound
    playSound('enemy-shoot');
    }

// Move player based on keys pressed
function movePlayer() {
    // Move horizontal
    if (player.keysPressed['ArrowLeft'] || player.keysPressed['KeyA']) {
        player.x = Math.max(0, player.x - player.speed);
    }
    if (player.keysPressed['ArrowRight'] || player.keysPressed['KeyD']) {
        player.x = Math.min(gameWidth - player.width, player.x + player.speed);
    }
    
    // Move vertical (limited to bottom 40% of screen)
    if (player.keysPressed['ArrowUp'] || player.keysPressed['KeyW']) {
        player.y = Math.max(player.minY, player.y - player.speed);
    }
    if (player.keysPressed['ArrowDown'] || player.keysPressed['KeyS']) {
        player.y = Math.min(player.maxY, player.y + player.speed);
    }
}
function movePlayerBullets() {
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
        
        bullet.y -= bullet.speed;
        bullet.x += bullet.xSpeed;
        
        if (bullet.y + bullet.height < 0 || bullet.x < 0 || bullet.x > gameWidth) {
            playerBullets.splice(i, 1);
        }
    }
}

function moveEnemies() {
    let hitEdge = false;
    
    // Check if any enemy reached the edge
    for (const enemy of enemies) {
        if (!enemy.alive) continue;
        
        if ((enemiesDirection > 0 && enemy.x + enemy.width >= gameWidth) ||
            (enemiesDirection < 0 && enemy.x <= 0)) {
            hitEdge = true;
            break;
        }
    }
    
    // Change direction if hit edge
    if (hitEdge) {
        enemiesDirection *= -1;
        
        // Move enemies down
        for (const enemy of enemies) {
            if (!enemy.alive) continue;
            
            enemy.y += enemy.height / 2;
            
            // Check if enemies reached player zone
            if (enemy.y + enemy.height > player.minY) {
                endGame('invaded');
                return;
            }
        }
    }
    
    // Move all enemies horizontally
    for (const enemy of enemies) {
        if (!enemy.alive) continue;
        
        enemy.x += enemiesDirection * enemySpeed;
    }
}

function moveEnemyBullets() {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        
        bullet.y += bullet.speed;
        bullet.x += bullet.xSpeed;
        
        if (bullet.y > gameHeight || bullet.x < 0 || bullet.x > gameWidth) {
            enemyBullets.splice(i, 1);
        }
    }
}

// Check collisions between player bullets and enemies
function checkBulletEnemyCollisions() {
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
        let bulletHit = false;
        
        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            if (!enemy.alive || bulletHit) continue;
            
            if (bullet.x < enemy.x + enemy.width && 
                bullet.x + bullet.width > enemy.x && 
                bullet.y < enemy.y + enemy.height && 
                bullet.y + bullet.height > enemy.y) {
                
                bulletHit = true;
                playerBullets.splice(i, 1);
                
                enemy.alive = false;
                enemiesKilled++;
                
                let points;
                switch (enemy.row) {
                    case 0: points = 20; break; 
                    case 1: points = 15; break;
                    case 2: points = 10; break;
                    case 3: points = 5; break;  
                }
                score += points;
                document.getElementById('score').textContent = score;
                
                playSound('enemy-hit');
            }
        }
    }
}


// Check collisions between enemy bullets and player
function checkBulletPlayerCollisions() {

    
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        
        // Check collision (simple rectangle collision)
        if (bullet.x < player.x + player.width && 
            bullet.x + bullet.width > player.x && 
            bullet.y < player.y + player.height && 
            bullet.y + bullet.height > player.y) {
            
            // Remove bullet
            enemyBullets.splice(i, 1);
            
            // Reduce lives
            lives--;
            document.getElementById('lives').textContent = lives;
            
            // Create player hit animation
            createPlayerHitAnimation();
            
            // Play player hit sound
            playSound('player-hit');
            
            
            // Check game over
            if (lives <= 0) {
                endGame('lives');
                return;
            }

            // Reset player position to center
            player.x = (gameWidth / 2) - (player.width / 2);
            player.y = gameHeight - 60;
            
            // Cancel blinking effect
            player.isHit = false;
            player.invulnerableUntil = 0;
            
            break; // Only one bullet can hit player at a time
        }
    }
}

// Create player hit animation
function createPlayerHitAnimation() {
    // Similar to explosion, but for player hit
    const x = player.x + player.width / 2;
    const y = player.y + player.height / 2;
    const hitRadius = 30;
    const hitDuration = 500; // ms
    const startTime = Date.now();
    
    function drawHitEffect() {
        const elapsed = Date.now() - startTime;
        if (elapsed >= hitDuration) return;
        
        const progress = elapsed / hitDuration;
        const alpha = 1 - progress;
        const size = hitRadius * (0.5 + progress * 1.5);
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Continue animation
        requestAnimationFrame(drawHitEffect);
    }
    
    // Start the hit animation
    drawHitEffect();
}

// Increase enemy speed
function increaseEnemySpeed() {
    if (speedIncreaseCount >= 4) return;
    
    speedIncreaseCount++;
    enemySpeed *= 1.5; // Changed from 1.2 to 1.5 for more dramatic speed increases
    
    
    // Also speed up enemy bullets that are already on screen
    for (const bullet of enemyBullets) {
        bullet.speed *= 1.5; // Changed from 1.2 to 1.5 for consistency
        bullet.xSpeed *= 1.5; 

    }
    
    // Visual indication of speed increase
    displaySpeedAlert();
    
    // Play speed up sound
    playSound('speed-up');
    }


// Display a speed alert on screen
function displaySpeedAlert() {
    const alertDuration = 1500; // ms
    const startTime = Date.now();
    
    function drawSpeedAlert() {
        const elapsed = Date.now() - startTime;
        if (elapsed >= alertDuration) return;
        
        const progress = elapsed / alertDuration;
        let alpha = 1;
        let scale = 1;
        
        // Fade in and out
        if (progress < 0.2) {
            alpha = progress / 0.2; // Fade in
            scale = 0.8 + 0.2 * (progress / 0.2);
        } else if (progress > 0.8) {
            alpha = (1 - progress) / 0.2; // Fade out
            scale = 1 + 0.2 * ((progress - 0.8) / 0.2);
        }
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 30px Arial';
        ctx.fillStyle = '#ff0000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Apply scale
        ctx.translate(gameWidth / 2, gameHeight / 2);
        ctx.scale(scale, scale);
        ctx.fillText('מהירות הוגברה!', 0, 0);
        ctx.restore();
        
        // Continue animation
        requestAnimationFrame(drawSpeedAlert);
    }
    
    // Start the alert animation
    drawSpeedAlert();
}

// End the game
function endGame(reason) {
    gameStarted = false;
    clearInterval(speedIncreaseInterval);
    
    // Remove event listeners
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    keydownListenerActive = false;
    keyupListenerActive = false;
    // Stop background music
    stopBackgroundMusic();
    
    // Save game history
    saveGameHistory();
    
    // Show game over message
    let message = '';
    
    if (reason === 'lives') {
        message = 'Game Over! You Lost!';
        playSound('game-over');
        
    } else if (reason === 'time') {
        if (score < 100) {
            message = `Time's up! You can do better. Score: ${score}`;
        } else {
            message = `Time's up! Winner! Score: ${score}`;
        }
            playSound('game-win');

    } else if (reason === 'win') {
        message = 'Champion! You destroyed all spaceships!';
        playSound('game-win');
        
    } else if (reason === 'invaded') {
        message = 'You can do better!';
            playSound('game-over');
    }
    
    // Display message and high scores
    showGameOverDialog(message, reason === 'win' || (reason === 'time' && score >= 100));
}

// Save game history
function saveGameHistory() {
    // Check if user is logged in
    const currentUser = window.authModule.getCurrentUser();
    if (!currentUser) return;
    
    let userHistory = JSON.parse(localStorage.getItem(`gameHistory_${currentUser.username}`)) || [];
    
    // Add current game
    userHistory.push({
        score: score,
        time: gameTime / 1000 - timeRemaining,
        enemiesKilled: enemiesKilled,
        date: new Date().toISOString(),
        victory: enemies.every(enemy => !enemy.alive) || (timeRemaining <= 0 && score >= 100)
    });
    
    // Sort by score (highest first)
    userHistory.sort((a, b) => b.score - a.score);
    
    // Save history
    localStorage.setItem(`gameHistory_${currentUser.username}`, JSON.stringify(userHistory));
    
    // Update global variable
    gameHistory = userHistory;
}

// Show game over dialog
function showGameOverDialog(message, isVictory) {
    const gameOverDialog = document.getElementById('game-over-dialog');
    const gameOverTitle = document.getElementById('game-over-title');
    const finalScore = document.getElementById('final-score');
    const enemiesDestroyed = document.getElementById('enemies-destroyed');
    const timeElapsed = document.getElementById('time-elapsed');
    
    // Set content
    gameOverTitle.textContent = message;
    gameOverTitle.className = isVictory ? 'text-success' : 'text-error';
    
    finalScore.textContent = score;
    enemiesDestroyed.textContent = enemiesKilled;
    
    // Format time
    const elapsedTime = gameTime / 1000 - timeRemaining;
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = Math.floor(elapsedTime % 60);
    timeElapsed.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Populate history table
    populateHistoryTable();
    
    // Show dialog
    window.appFunctions.openModal(gameOverDialog);
    
    // Set up button listeners
    document.getElementById('play-again-btn').addEventListener('click', function() {
        window.appFunctions.closeModal(gameOverDialog);
        initGame();
    });
    
    document.getElementById('back-to-config-from-game-over').addEventListener('click', function() {
        window.appFunctions.closeModal(gameOverDialog);
        window.appFunctions.showScreen('config-screen');
    });
}

// Populate history table
function populateHistoryTable() {
    const historyTableBody = document.getElementById('history-table-body');
    historyTableBody.innerHTML = '';

    if (!gameHistory || gameHistory.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4;
        cell.textContent = 'No game history';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        historyTableBody.appendChild(row);
        return;
    }

    gameHistory.sort((a, b) => b.score - a.score);

    for (let i = 0; i < gameHistory.length; i++) {
        const game = gameHistory[i];
        const rank = i + 1;
        const row = createHistoryRow(game, rank);

        if (isCurrentGame(game)) {
            row.classList.add('current-game');
        }

        historyTableBody.appendChild(row);
    }
}

function createHistoryRow(game, rank) {
    const row = document.createElement('tr');

    const rankCell = document.createElement('td');
    rankCell.textContent = rank;
    row.appendChild(rankCell);

    const scoreCell = document.createElement('td');
    scoreCell.textContent = game.score;
    row.appendChild(scoreCell);

    const timeCell = document.createElement('td');
    const minutes = Math.floor(game.time / 60);
    const seconds = Math.floor(game.time % 60);
    timeCell.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    row.appendChild(timeCell);

    const enemiesCell = document.createElement('td');
    enemiesCell.textContent = game.enemiesKilled;
    row.appendChild(enemiesCell);

    return row;
}

function isCurrentGame(game) {
    return game.score === score && game.enemiesKilled === enemiesKilled;
}


function createHistoryRow(game, rank) {
    const row = document.createElement('tr');

    const rankCell = document.createElement('td');
    rankCell.textContent = rank;
    row.appendChild(rankCell);

    const scoreCell = document.createElement('td');
    scoreCell.textContent = game.score;
    row.appendChild(scoreCell);

    const timeCell = document.createElement('td');
    const minutes = Math.floor(game.time / 60);
    const seconds = Math.floor(game.time % 60);
    timeCell.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    row.appendChild(timeCell);

    const enemiesCell = document.createElement('td');
    enemiesCell.textContent = game.enemiesKilled;
    row.appendChild(enemiesCell);

    return row;
}

function isCurrentGame(game) {
    return game.score === score && game.enemiesKilled === enemiesKilled;
}


function findCurrentGameRank() {
    for (let i = 0; i < gameHistory.length; i++) {
        const game = gameHistory[i];
        if (isCurrentGame(game)) {
            return i + 1; 
        }
    }
    return -1;
}


// Update time display
function updateTimeDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = Math.floor(timeRemaining % 60);
    document.getElementById('time').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Sound system
function playSound(type) {    
    let sound = new Audio();
    
    switch (type) {
        case 'player-shoot':
            sound.src = 'assets/sounds/player-shoot.mp3';
            break;
        case 'enemy-shoot':
            sound.src = 'assets/sounds/enemy-shoot.mp3';
            break;
        case 'player-hit':
            sound.src = 'assets/sounds/player-hit.mp3';
            break;
        case 'enemy-hit':
            sound.src = 'assets/sounds/enemy-hit.mp3';
            break;
        case 'game-over':
            sound.src = 'assets/sounds/game-over.mp3';
            break;
        case 'game-win':
            sound.src = 'assets/sounds/game-win.mp3';
            break;
        case 'speed-up':
            sound.src = 'assets/sounds/speed-up.mp3';
            break;
        default:
            return;
    }
    
    sound.volume = 0.3;
    sound.play();
}

function playBackgroundMusic() {    
    backgroundMusic = new Audio('assets/sounds/background-music.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.1;
    backgroundMusic.play();
}

function stopBackgroundMusic() {
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
}

// Game controls event listeners
document.addEventListener('DOMContentLoaded', function() {
    const newGameBtn = document.getElementById('new-game-btn');
    const backToConfigBtn = document.getElementById('back-to-config-btn');
    
    if (newGameBtn) {
        newGameBtn.addEventListener('click', function(event) {
            event.target.blur(); 
            resetGameState();
            initGame();
        });
        
    }
    
    if (backToConfigBtn) {
        backToConfigBtn.addEventListener('click', function() {
            resetGameState();
            window.appFunctions.showScreen('config-screen');
        });
        
    }
    
    // Load game history if user is logged in
    const currentUser = window.authModule.getCurrentUser();
    if (currentUser) {
        const userHistory = localStorage.getItem(`gameHistory_${currentUser.username}`);
        if (userHistory) {
            gameHistory = JSON.parse(userHistory);
        }
    }
});

// Expose functions to other modules
window.gameModule = {
    initGame,
    resetGameState,
    getScore: function() {
        return score;
    },
    getLives: function() {
        return lives;
    },
    getTimeRemaining: function() {
        return timeRemaining;
    }
};

// 6. Add initialization check to make sure everything is connected
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking game elements...');
    
    // Check if canvas exists
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error('Game canvas not found!');
    } else {
        console.log('Game canvas found, dimensions:', canvas.width, 'x', canvas.height);
    }
    
    // Check if game controls exist
    const newGameBtn = document.getElementById('new-game-btn');
    const backToConfigBtn = document.getElementById('back-to-config-btn');
    
    if (!newGameBtn) console.error('New Game button not found!');
    if (!backToConfigBtn) console.error('Back to Settings button not found!');
    
    // Setup game configuration access
    if (!window.gameConfig) {
        console.warn('Game config not found, creating default config');
        window.gameConfig = {
            fireKey: 'Space',
            gameTime: 2,
            playerColor: '#6d28d9',
            enemyColor: '#ef4444'
        };
    }
    
    if (newGameBtn) {
        newGameBtn.addEventListener('click', function() {
            console.log('New Game button clicked');
            resetGameState();
            initGame();
        });
    }
    
    if (backToConfigBtn) {
        backToConfigBtn.addEventListener('click', function() {
            console.log('Back to Settings button clicked');
            resetGameState();
            window.appFunctions.showScreen('config-screen');
        });
    }
    
    // Load game history if user is logged in
    const currentUser = window.authModule ? window.authModule.getCurrentUser() : null;
    if (currentUser) {
        const userHistory = localStorage.getItem(`gameHistory_${currentUser.username}`);
        if (userHistory) {
            gameHistory = JSON.parse(userHistory);
        }
    }
});






