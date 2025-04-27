// Global variables
const screens = document.querySelectorAll('.screen');
const aboutModal = document.getElementById('about-modal');
const gameOverDialog = document.getElementById('game-over-dialog');
const closeModalBtns = document.querySelectorAll('.close');

// Current screen management
function showScreen(screenId) {
    // Hide all screens
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show the requested screen
    document.getElementById(screenId).classList.add('active');
}

// Navigation handlers
document.addEventListener('DOMContentLoaded', function() {
    // Welcome screen navigation
    document.getElementById('nav-welcome').addEventListener('click', function(e) {
        e.preventDefault();
        if (window.gameModule && window.gameModule.resetGameState) {
            window.gameModule.resetGameState();
        }
        showScreen('welcome-screen');
    });

    document.getElementById('nav-about').addEventListener('click', function(e) {
        e.preventDefault();
        openModal(aboutModal);
    });

    document.getElementById('register-btn').addEventListener('click', function() {
        if (window.gameModule && window.gameModule.resetGameState) {
            window.gameModule.resetGameState();
        }
        showScreen('register-screen');
    });

    document.getElementById('login-btn').addEventListener('click', function() {
        if (window.gameModule && window.gameModule.resetGameState) {
            window.gameModule.resetGameState();
        }
        showScreen('login-screen');
    });

    document.getElementById('nav-register').addEventListener('click', function(e) {
        if (window.gameModule && window.gameModule.resetGameState) {
            window.gameModule.resetGameState();
        }
        e.preventDefault();
        showScreen('register-screen');
    });
    
    document.getElementById('nav-login').addEventListener('click', function(e) {
        e.preventDefault();
        if (window.gameModule && window.gameModule.resetGameState) {
            window.gameModule.resetGameState();
        }
        showScreen('login-screen');
    });

    // Return to welcome screen buttons
    document.getElementById('back-to-welcome').addEventListener('click', function() {
        if (window.gameModule && window.gameModule.resetGameState) {
            window.gameModule.resetGameState();
        }
        showScreen('welcome-screen');
    });

    document.getElementById('back-to-welcome-from-login').addEventListener('click', function() {
        if (window.gameModule && window.gameModule.resetGameState) {
            window.gameModule.resetGameState();
        }
        showScreen('welcome-screen');
    });

    // Close modal buttons
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            closeAllModals();
        });
    });

    // Close modals when clicking outside content
    window.addEventListener('click', function(e) {
        if (e.target === aboutModal) {
            closeModal(aboutModal);
        }
    });

    // Close modals with ESC key
    window.addEventListener('keydown', function(e) {
        if (aboutModal.style.display === 'block') {
            closeModal(aboutModal);
        }
    });

    // Load the welcome screen initially
    showScreen('welcome-screen');
});

// Modal management
function openModal(modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Re-enable scrolling
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        closeModal(modal);
    });
}

// Export functions that will be used by other modules
window.appFunctions = {
    showScreen,
    openModal,
    closeModal
};