// UI Controller for Horizon Racing
class UIController {
    constructor() {
        this.screens = new Map();
        this.currentScreen = null;
        this.animations = {
            fadeSpeed: 300,
            slideSpeed: 400
        };
        this.sounds = {
            enabled: true,
            volume: 0.5
        };
        
        this.initializeScreens();
        this.setupEventListeners();
    }
    
    initializeScreens() {
        // Register all screens
        this.screens.set('loadingScreen', document.getElementById('loadingScreen'));
        this.screens.set('mainMenu', document.getElementById('mainMenu'));
        this.screens.set('carSelection', document.getElementById('carSelection'));
        this.screens.set('garage', document.getElementById('garage'));
        this.screens.set('gameScreen', document.getElementById('gameScreen'));
        this.screens.set('multiplayerLobby', document.getElementById('multiplayerLobby'));
        this.screens.set('settings', document.getElementById('settings'));
        this.screens.set('raceResults', document.getElementById('raceResults'));
    }
    
    setupEventListeners() {
        // Settings controls
        const masterVolume = document.getElementById('masterVolume');
        const graphicsQuality = document.getElementById('graphicsQuality');
        const controlScheme = document.getElementById('controlScheme');
        
        if (masterVolume) {
            masterVolume.addEventListener('input', (e) => {
                this.updateMasterVolume(parseInt(e.target.value));
            });
        }
        
        if (graphicsQuality) {
            graphicsQuality.addEventListener('change', (e) => {
                this.updateGraphicsQuality(e.target.value);
            });
        }
        
        if (controlScheme) {
            controlScheme.addEventListener('change', (e) => {
                this.updateControlScheme(e.target.value);
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Window events
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
        
        // Prevent right-click context menu during gameplay
        document.addEventListener('contextmenu', (e) => {
            if (this.currentScreen === 'gameScreen') {
                e.preventDefault();
            }
        });
    }
    
    // Screen management
    showScreen(screenId, options = {}) {
        const screen = this.screens.get(screenId);
        if (!screen) {
            console.error(`Screen ${screenId} not found`);
            return;
        }
        
        // Hide current screen
        if (this.currentScreen) {
            const currentScreenElement = this.screens.get(this.currentScreen);
            if (currentScreenElement) {
                this.hideScreenWithAnimation(currentScreenElement, options.hideAnimation);
            }
        }
        
        // Show new screen
        this.showScreenWithAnimation(screen, options.showAnimation);
        this.currentScreen = screenId;
        
        // Screen-specific setup
        this.onScreenShow(screenId);
        
        // Play screen transition sound
        if (this.sounds.enabled) {
            this.playUISound('screen_transition');
        }
    }
    
    hideScreenWithAnimation(screenElement, animationType = 'fade') {
        screenElement.style.transition = `opacity ${this.animations.fadeSpeed}ms ease-out`;
        screenElement.style.opacity = '0';
        
        setTimeout(() => {
            screenElement.classList.add('hidden');
            screenElement.style.transition = '';
            screenElement.style.opacity = '';
        }, this.animations.fadeSpeed);
    }
    
    showScreenWithAnimation(screenElement, animationType = 'fade') {
        screenElement.classList.remove('hidden');
        screenElement.style.opacity = '0';
        screenElement.style.transition = `opacity ${this.animations.fadeSpeed}ms ease-in`;
        
        // Force reflow
        screenElement.offsetHeight;
        
        screenElement.style.opacity = '1';
        
        setTimeout(() => {
            screenElement.style.transition = '';
            screenElement.style.opacity = '';
        }, this.animations.fadeSpeed);
    }
    
    onScreenShow(screenId) {
        switch(screenId) {
            case 'carSelection':
                this.updateCarSelection();
                break;
            case 'garage':
                this.updateGarageDisplay();
                break;
            case 'gameScreen':
                this.setupGameControls();
                break;
            case 'settings':
                this.loadSettings();
                break;
            case 'multiplayerLobby':
                this.refreshMultiplayerLobby();
                break;
        }
    }
    
    // Car selection UI
    updateCarSelection() {
        const carGrid = document.getElementById('carGrid');
        if (!carGrid) return;
        
        carGrid.innerHTML = '';
        
        gameData.cars.forEach((car, index) => {
            const carElement = this.createCarSelectionElement(car, index);
            carGrid.appendChild(carElement);
        });
        
        // Update start race button state
        this.updateStartRaceButton();
    }
    
    createCarSelectionElement(car, index) {
        const carDiv = document.createElement('div');
        carDiv.className = 'car-item';
        carDiv.dataset.carIndex = index;
        
        const performanceRating = CarManager.getCarPerformanceRating(car);
        
        carDiv.innerHTML = `
            <div class="car-preview" style="background: ${car.color};">
                <span class="car-icon">${car.icon}</span>
            </div>
            <div class="car-name">${car.name}</div>
            <div class="car-price">${car.price > 0 ? '$' + car.price : 'FREE'}</div>
            <div class="performance-rating">
                <label>Performance: ${performanceRating}%</label>
                <div class="performance-bar">
                    <div class="performance-fill" style="width: ${performanceRating}%"></div>
                </div>
            </div>
            <div class="car-stats">
                <div class="stat-row">
                    <span>Speed:</span>
                    <div class="stat-bars">${this.createStatBars(car.stats.speed)}</div>
                </div>
                <div class="stat-row">
                    <span>Handling:</span>
                    <div class="stat-bars">${this.createStatBars(car.stats.handling)}</div>
                </div>
                <div class="stat-row">
                    <span>Acceleration:</span>
                    <div class="stat-bars">${this.createStatBars(car.stats.acceleration)}</div>
                </div>
                <div class="stat-row">
                    <span>Braking:</span>
                    <div class="stat-bars">${this.createStatBars(car.stats.braking)}</div>
                </div>
            </div>
            <div class="car-details">
                <small>Top Speed: ${car.topSpeed} km/h</small>
                <small>0-100: ${car.acceleration}s</small>
                <small>Engine: ${car.engine}</small>
            </div>
        `;
        
        // Add click handler
        carDiv.addEventListener('click', () => {
            this.selectCar(index);
        });
        
        // Add hover effects
        carDiv.addEventListener('mouseenter', () => {
            if (this.sounds.enabled) {
                this.playUISound('hover');
            }
        });
        
        return carDiv;
    }
    
    createStatBars(value) {
        let bars = '';
        for (let i = 0; i < 10; i++) {
            const filled = i < value ? 'filled' : '';
            bars += `<div class="stat-bar ${filled}"></div>`;
        }
        return bars;
    }
    
    selectCar(index) {
        // Remove previous selection
        document.querySelectorAll('.car-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add selection to clicked car
        const carElement = document.querySelector(`[data-car-index="${index}"]`);
        if (carElement) {
            carElement.classList.add('selected');
            
            // Selection animation
            carElement.style.transform = 'scale(1.05)';
            setTimeout(() => {
                carElement.style.transform = '';
            }, 200);
        }
        
        // Update game state
        if (window.game) {
            window.game.selectedCar = index;
        }
        
        // Update start race button
        this.updateStartRaceButton();
        
        // Play selection sound
        if (this.sounds.enabled) {
            this.playUISound('select');
        }
    }
    
    updateStartRaceButton() {
        const startBtn = document.querySelector('.start-race-btn');
        if (startBtn) {
            const hasSelection = window.game && window.game.selectedCar !== null;
            startBtn.disabled = !hasSelection;
            
            if (hasSelection) {
                startBtn.textContent = 'START RACE';
                startBtn.classList.remove('disabled');
            } else {
                startBtn.textContent = 'SELECT A CAR';
                startBtn.classList.add('disabled');
            }
        }
    }
    
    // Garage UI
    updateGarageDisplay() {
        if (!window.game || window.game.selectedCar === null) return;
        
        const car = gameData.cars[window.game.selectedCar];
        const showcase = document.getElementById('carShowcase');
        
        if (showcase) {
            showcase.innerHTML = `
                <div class="showcase-header">
                    <h3>${car.name}</h3>
                    <div class="performance-rating">
                        Performance: ${CarManager.getCarPerformanceRating(car)}%
                    </div>
                </div>
                <div class="car-display" style="background: ${car.color};">
                    <span class="car-icon-large">${car.icon}</span>
                </div>
                <div class="car-specifications">
                    <div class="spec-item">
                        <label>Top Speed:</label>
                        <span>${car.topSpeed} km/h</span>
                    </div>
                    <div class="spec-item">
                        <label>0-100 km/h:</label>
                        <span>${car.acceleration}s</span>
                    </div>
                    <div class="spec-item">
                        <label>Weight:</label>
                        <span>${car.weight} kg</span>
                    </div>
                    <div class="spec-item">
                        <label>Engine:</label>
                        <span>${car.engine}</span>
                    </div>
                </div>
                <div class="current-upgrades">
                    <h4>Current Upgrades</h4>
                    <div class="upgrade-status">
                        <span>Engine: Level ${car.upgrades.engine}/5</span>
                        <span>Tires: Level ${car.upgrades.tires}/5</span>
                        <span>Handling: Level ${car.upgrades.handling}/5</span>
                    </div>
                </div>
            `;
        }
        
        this.updateUpgradeButtons();
        this.updateColorPicker();
    }
    
    updateUpgradeButtons() {
        if (!window.game || window.game.selectedCar === null) return;
        
        const car = gameData.cars[window.game.selectedCar];
        const credits = window.game.gameState.playerStats.credits;
        
        // Update engine upgrade
        const engineBtn = document.querySelector('.upgrade-item:nth-child(1) button');
        if (engineBtn) {
            const canUpgrade = CarManager.canAffordUpgrade(credits, car, 'engine');
            const cost = CarManager.calculateUpgradeCost(car, 'engine', car.upgrades.engine + 1);
            
            engineBtn.disabled = !canUpgrade || car.upgrades.engine >= 5;
            engineBtn.textContent = car.upgrades.engine >= 5 ? 'MAX LEVEL' : `UPGRADE ($${cost})`;
        }
        
        // Update tires upgrade
        const tiresBtn = document.querySelector('.upgrade-item:nth-child(2) button');
        if (tiresBtn) {
            const canUpgrade = CarManager.canAffordUpgrade(credits, car, 'tires');
            const cost = CarManager.calculateUpgradeCost(car, 'tires', car.upgrades.tires + 1);
            
            tiresBtn.disabled = !canUpgrade || car.upgrades.tires >= 5;
            tiresBtn.textContent = car.upgrades.tires >= 5 ? 'MAX LEVEL' : `UPGRADE ($${cost})`;
        }
        
        // Update handling upgrade
        const handlingBtn = document.querySelector('.upgrade-item:nth-child(3) button');
        if (handlingBtn) {
            const canUpgrade = CarManager.canAffordUpgrade(credits, car, 'handling');
            const cost = CarManager.calculateUpgradeCost(car, 'handling', car.upgrades.handling + 1);
            
            handlingBtn.disabled = !canUpgrade || car.upgrades.handling >= 5;
            handlingBtn.textContent = car.upgrades.handling >= 5 ? 'MAX LEVEL' : `UPGRADE ($${cost})`;
        }
    }
    
    updateColorPicker() {
        const colorPicker = document.getElementById('carColor');
        if (colorPicker && window.game && window.game.selectedCar !== null) {
            const car = gameData.cars[window.game.selectedCar];
            colorPicker.value = car.color;
        }
    }
    
    // Game controls UI
    setupGameControls() {
        // Show control hints
        this.showControlHints();
        
        // Setup touch controls for mobile
        if (this.isMobile()) {
            this.setupTouchControls();
        }
    }
    
    showControlHints() {
        const hintsContainer = document.querySelector('.controls-help');
        if (hintsContainer) {
            const controlScheme = window.game?.gameState.settings.controlScheme || 'wasd';
            
            let controlsText = '';
            switch(controlScheme) {
                case 'wasd':
                    controlsText = 'WASD to drive • SPACE to brake • ESC for pause';
                    break;
                case 'arrows':
                    controlsText = 'Arrow Keys to drive • SPACE to brake • ESC for pause';
                    break;
                case 'gamepad':
                    controlsText = 'Left stick to drive • Right trigger to accelerate • Left trigger to brake';
                    break;
            }
            
            hintsContainer.innerHTML = `<p>${controlsText}</p>`;
        }
    }
    
    setupTouchControls() {
        // This would add virtual joystick and buttons for mobile devices
        const gameScreen = document.getElementById('gameScreen');
        if (!gameScreen) return;
        
        const touchControlsHtml = `
            <div class="touch-controls">
                <div class="virtual-joystick" id="virtualJoystick">
                    <div class="joystick-knob"></div>
                </div>
                <div class="touch-buttons">
                    <button class="touch-btn accelerate-btn" id="accelerateBtn">🚀</button>
                    <button class="touch-btn brake-btn" id="brakeBtn">🛑</button>
                </div>
            </div>
        `;
        
        gameScreen.insertAdjacentHTML('beforeend', touchControlsHtml);
        this.setupVirtualJoystick();
    }
    
    setupVirtualJoystick() {
        // Virtual joystick implementation for mobile
        const joystick = document.getElementById('virtualJoystick');
        const knob = joystick?.querySelector('.joystick-knob');
        
        if (!joystick || !knob) return;
        
        let isDragging = false;
        let startX, startY;
        
        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDragging = true;
            const touch = e.touches[0];
            const rect = joystick.getBoundingClientRect();
            startX = rect.left + rect.width / 2;
            startY = rect.top + rect.height / 2;
        });
        
        joystick.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const maxDistance = 40;
            
            if (distance <= maxDistance) {
                knob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            } else {
                const angle = Math.atan2(deltaY, deltaX);
                const x = Math.cos(angle) * maxDistance;
                const y = Math.sin(angle) * maxDistance;
                knob.style.transform = `translate(${x}px, ${y}px)`;
            }
            
            // Update game input
            if (window.game) {
                window.game.virtualInput = {
                    x: Math.max(-1, Math.min(1, deltaX / maxDistance)),
                    y: Math.max(-1, Math.min(1, deltaY / maxDistance))
                };
            }
        });
        
        joystick.addEventListener('touchend', () => {
            isDragging = false;
            knob.style.transform = 'translate(0, 0)';
            if (window.game) {
                window.game.virtualInput = { x: 0, y: 0 };
            }
        });
    }
    
    // Settings management
    loadSettings() {
        const settings = window.game?.gameState.settings;
        if (!settings) return;
        
        const masterVolume = document.getElementById('masterVolume');
        const graphicsQuality = document.getElementById('graphicsQuality');
        const controlScheme = document.getElementById('controlScheme');
        
        if (masterVolume) masterVolume.value = settings.masterVolume;
        if (graphicsQuality) graphicsQuality.value = settings.graphicsQuality;
        if (controlScheme) controlScheme.value = settings.controlScheme;
    }
    
    updateMasterVolume(volume) {
        if (window.game) {
            window.game.gameState.settings.masterVolume = volume;
        }
        this.sounds.volume = volume / 100;
        
        // Update all audio elements
        document.querySelectorAll('audio').forEach(audio => {
            audio.volume = this.sounds.volume;
        });
    }
    
    updateGraphicsQuality(quality) {
        if (window.game) {
            window.game.gameState.settings.graphicsQuality = quality;
        }
        
        // Update graphics engine settings
        if (window.graphics) {
            window.graphics.setQuality(quality);
        }
    }
    
    updateControlScheme(scheme) {
        if (window.game) {
            window.game.gameState.settings.controlScheme = scheme;
        }
        
        // Update control hints if in game
        if (this.currentScreen === 'gameScreen') {
            this.showControlHints();
        }
    }
    
    // Multiplayer lobby
    refreshMultiplayerLobby() {
        // This would fetch real multiplayer data in a full implementation
        this.updateRoomList();
    }
    
    updateRoomList() {
        // Simulate multiplayer rooms
        const roomList = document.querySelector('.room-list');
        if (!roomList) return;
        
        const rooms = [
            { name: 'Speed Circuit', players: 3, maxPlayers: 8, track: 'Horizon Circuit' },
            { name: 'Mountain Challenge', players: 6, maxPlayers: 8, track: 'Mountain Pass' },
            { name: 'Night Racing', players: 2, maxPlayers: 6, track: 'City Streets' },
            { name: 'Desert Storm', players: 4, maxPlayers: 8, track: 'Desert Storm' }
        ];
        
        const roomsHtml = rooms.map(room => `
            <div class="room-item">
                <div class="room-info">
                    <h4>${room.name}</h4>
                    <p>Players: ${room.players}/${room.maxPlayers}</p>
                    <small>Track: ${room.track}</small>
                </div>
                <button class="join-btn" ${room.players >= room.maxPlayers ? 'disabled' : ''}>
                    ${room.players >= room.maxPlayers ? 'FULL' : 'JOIN'}
                </button>
            </div>
        `).join('');
        
        roomList.innerHTML = `<h3>AVAILABLE ROOMS</h3>${roomsHtml}`;
    }
    
    // Utility functions
    handleKeyboardShortcuts(e) {
        switch(e.code) {
            case 'Escape':
                if (this.currentScreen === 'gameScreen') {
                    this.showPauseMenu();
                } else if (this.currentScreen !== 'mainMenu') {
                    showMainMenu();
                }
                break;
            case 'F11':
                e.preventDefault();
                this.toggleFullscreen();
                break;
            case 'KeyM':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.toggleMute();
                }
                break;
        }
    }
    
    showPauseMenu() {
        if (!window.game || !window.game.gameState.currentRace.isRacing) return;
        
        // Pause the game
        window.game.gameState.currentRace.isRacing = false;
        
        // Show pause overlay
        const pauseOverlay = document.createElement('div');
        pauseOverlay.id = 'pauseOverlay';
        pauseOverlay.className = 'pause-overlay';
        pauseOverlay.innerHTML = `
            <div class="pause-content">
                <h2>GAME PAUSED</h2>
                <div class="pause-buttons">
                    <button class="menu-btn" onclick="uiController.resumeGame()">RESUME</button>
                    <button class="menu-btn" onclick="uiController.restartRace()">RESTART</button>
                    <button class="menu-btn" onclick="showMainMenu()">MAIN MENU</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(pauseOverlay);
    }
    
    resumeGame() {
        const pauseOverlay = document.getElementById('pauseOverlay');
        if (pauseOverlay) {
            document.body.removeChild(pauseOverlay);
        }
        
        if (window.game) {
            window.game.gameState.currentRace.isRacing = true;
        }
    }
    
    restartRace() {
        const pauseOverlay = document.getElementById('pauseOverlay');
        if (pauseOverlay) {
            document.body.removeChild(pauseOverlay);
        }
        
        if (window.game) {
            window.game.resetRaceState();
            window.game.gameState.currentRace.isRacing = true;
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(console.error);
        } else {
            document.exitFullscreen().catch(console.error);
        }
    }
    
    toggleMute() {
        this.sounds.enabled = !this.sounds.enabled;
        this.showNotification(this.sounds.enabled ? 'Audio Enabled' : 'Audio Disabled');
    }
    
    handleWindowResize() {
        // Update canvas size if in game
        if (this.currentScreen === 'gameScreen' && window.game && window.game.canvas) {
            window.game.resizeCanvas();
        }
    }
    
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // Notifications
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-family: 'Orbitron', monospace;
            font-weight: 700;
            z-index: 10000;
            animation: slideDown 0.3s ease-out;
        `;
        
        if (type === 'success') {
            notification.style.borderLeft = '4px solid #00FF00';
        } else if (type === 'error') {
            notification.style.borderLeft = '4px solid #FF0000';
        } else if (type === 'warning') {
            notification.style.borderLeft = '4px solid #FFD700';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease-in';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    // Sound effects
    playUISound(soundType) {
        if (!this.sounds.enabled) return;
        
        // This would play actual sound files in a full implementation
        const frequencies = {
            hover: 800,
            select: 1000,
            screen_transition: 600,
            error: 400,
            success: 1200
        };
        
        const frequency = frequencies[soundType] || 800;
        this.playBeep(frequency, 100);
    }
    
    playBeep(frequency, duration) {
        if (!window.AudioContext && !window.webkitAudioContext) return;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.sounds.volume * 0.1, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    }
}

// CSS for UI animations and styles
const uiStyles = document.createElement('style');
uiStyles.textContent = `
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
    }
    
    .pause-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        backdrop-filter: blur(5px);
    }
    
    .pause-content {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 3rem;
        text-align: center;
        border: 2px solid rgba(255, 107, 53, 0.5);
    }
    
    .pause-content h2 {
        color: #FF6B35;
        margin-bottom: 2rem;
        font-size: 3rem;
    }
    
    .pause-buttons {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .touch-controls {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 200px;
        pointer-events: none;
        z-index: 1000;
    }
    
    .virtual-joystick {
        position: absolute;
        bottom: 20px;
        left: 20px;
        width: 80px;
        height: 80px;
        border: 3px solid rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.3);
        pointer-events: auto;
    }
    
    .joystick-knob {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 30px;
        height: 30px;
        background: #FF6B35;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        transition: none;
    }
    
    .touch-buttons {
        position: absolute;
        bottom: 20px;
        right: 20px;
        display: flex;
        gap: 10px;
    }
    
    .touch-btn {
        width: 60px;
        height: 60px;
        border: none;
        border-radius: 50%;
        background: rgba(255, 107, 53, 0.8);
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        pointer-events: auto;
        transition: all 0.2s ease;
    }
    
    .touch-btn:active {
        transform: scale(0.9);
        background: rgba(255, 107, 53, 1);
    }
    
    .performance-bar {
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        overflow: hidden;
        margin-top: 0.5rem;
    }
    
    .performance-fill {
        height: 100%;
        background: linear-gradient(90deg, #FF6B35, #FFD700);
        border-radius: 4px;
        transition: width 0.3s ease;
    }
    
    .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }
    
    .stat-bars {
        display: flex;
        gap: 2px;
    }
    
    .car-details small {
        display: block;
        color: #ccc;
        margin-bottom: 0.2rem;
    }
    
    .disabled {
        opacity: 0.5;
        cursor: not-allowed !important;
    }
    
    @media (max-width: 768px) {
        .touch-controls {
            display: block;
        }
        
        .pause-content {
            padding: 2rem;
            margin: 1rem;
        }
        
        .pause-content h2 {
            font-size: 2rem;
        }
    }
`;
document.head.appendChild(uiStyles);

// Global UI controller instance
const uiController = new UIController();
