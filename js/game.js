// Main Game Logic - Horizon Racing 3D
class HorizonRacing {
    constructor() {
        this.currentScreen = 'loadingScreen';
        this.selectedCar = null;
        this.gameState = {
            playerStats: {
                credits: 2500,
                level: 1,
                totalRaces: 0,
                wins: 0
            },
            currentRace: {
                position: 1,
                lap: 1,
                totalLaps: 3,
                time: 0,
                speed: 0,
                rpm: 800,
                gear: 1,
                isRacing: false
            },
            settings: {
                masterVolume: 50,
                graphicsQuality: 'medium',
                controlScheme: 'wasd',
                cameraMode: 'chase'
            },
            weather: 'clear',
            timeOfDay: 'day'
        };
        this.canvas = null;
        this.ctx = null;
        this.graphics3D = null;
        this.gameLoop = null;
        this.keys = {};
        this.lastTime = 0;
        
        // 3D Game objects
        this.playerCars3D = [];
        this.currentTrack3D = null;
        
        // Physics and game state
        this.players = [
            {
                id: 1,
                name: 'Player 1',
                car: null,
                position: new THREE.Vector3(30, 1, 0),
                rotation: new THREE.Euler(0, Math.PI / 2, 0),
                velocity: new THREE.Vector3(0, 0, 0),
                speed: 0,
                rpm: 800,
                gear: 1,
                lapCount: 0,
                lastCheckpoint: 0
            }
        ];
        
        // Split screen mode
        this.splitScreenMode = false;
        this.player2Active = false;
        
        this.init();
    }

    init() {
        // Initialize the game
        this.setupEventListeners();
        this.simulateLoading();
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Prevent default browser behavior for game keys
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Window resize
        window.addEventListener('resize', () => {
            if (this.canvas) {
                this.resizeCanvas();
            }
        });

        // Prevent context menu on right click
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    simulateLoading() {
        // Simulate game loading
        setTimeout(() => {
            this.showScreen('mainMenu');
        }, 3500);
    }

    showScreen(screenId) {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.add('hidden'));
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
            this.currentScreen = screenId;
            
            // Screen-specific initialization
            switch(screenId) {
                case 'carSelection':
                    this.populateCarSelection();
                    break;
                case 'garage':
                    this.updateGarage();
                    break;
                case 'gameScreen':
                    this.initGameCanvas();
                    break;
                case 'multiplayerLobby':
                    this.updateMultiplayerLobby();
                    break;
                case 'splitScreenSetup':
                    this.initSplitScreenSetup();
                    break;
            }
        }
    }

    populateCarSelection() {
        const carGrid = document.getElementById('carGrid');
        carGrid.innerHTML = '';
        
        gameData.cars.forEach((car, index) => {
            const carElement = this.createCarElement(car, index);
            carGrid.appendChild(carElement);
        });
    }

    createCarElement(car, index) {
        const carDiv = document.createElement('div');
        carDiv.className = 'car-item';
        carDiv.dataset.carIndex = index;
        
        carDiv.innerHTML = `
            <div class="car-preview" style="background: ${car.color};">
                ${car.icon}
            </div>
            <div class="car-name">${car.name}</div>
            <div class="car-stats">
                <div class="stat-item">
                    <span>Speed:</span>
                    <span>${car.stats.speed}/10</span>
                </div>
                <div class="stat-item">
                    <span>Handling:</span>
                    <span>${car.stats.handling}/10</span>
                </div>
                <div class="stat-item">
                    <span>Acceleration:</span>
                    <span>${car.stats.acceleration}/10</span>
                </div>
                <div class="stat-item">
                    <span>Braking:</span>
                    <span>${car.stats.braking}/10</span>
                </div>
            </div>
            <div class="stat-bars">
                ${this.createStatBars(car.stats.speed)}
            </div>
        `;
        
        carDiv.addEventListener('click', () => {
            this.selectCar(index);
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
        
        // Select new car
        const carElement = document.querySelector(`[data-car-index="${index}"]`);
        carElement.classList.add('selected');
        
        this.selectedCar = index;
        
        // Enable start race button
        const startBtn = document.querySelector('.start-race-btn');
        startBtn.disabled = false;
    }

    updateGarage() {
        if (this.selectedCar !== null) {
            const car = gameData.cars[this.selectedCar];
            const showcase = document.getElementById('carShowcase');
            
            showcase.innerHTML = `
                <div class="car-preview" style="background: ${car.color}; height: 200px; font-size: 4rem;">
                    ${car.icon}
                </div>
                <h3>${car.name}</h3>
                <div class="car-details">
                    <p><strong>Top Speed:</strong> ${car.topSpeed} km/h</p>
                    <p><strong>0-100:</strong> ${car.acceleration}s</p>
                    <p><strong>Weight:</strong> ${car.weight} kg</p>
                    <p><strong>Engine:</strong> ${car.engine}</p>
                </div>
            `;
        }
    }

    initGameCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        
        // Initialize 3D Graphics Engine
        this.graphics3D = new Graphics3D(this.canvas);
        
        if (!this.graphics3D.init()) {
            console.error('Failed to initialize 3D graphics. Falling back to 2D mode.');
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
        }
        
        this.resetRaceState();
        this.setup3DScene();
        this.startGameLoop();
    }
    
    setup3DScene() {
        if (!this.graphics3D || !this.graphics3D.scene) return;
        
        // Create the racing track
        const currentTrackData = gameData.tracks[0]; // Default track
        this.graphics3D.createTrack(currentTrackData);
        
        // Create player cars
        this.createPlayerCars3D();
        
        // Set initial camera mode
        this.graphics3D.setCameraMode(this.gameState.settings.cameraMode);
    }
    
    createPlayerCars3D() {
        this.playerCars3D = [];
        
        this.players.forEach((player, index) => {
            if (this.selectedCar || gameData.cars[0]) {
                const carData = this.selectedCar || gameData.cars[0];
                const car3D = this.graphics3D.createCar(carData);
                
                // Position the car
                car3D.position.copy(player.position);
                car3D.rotation.copy(player.rotation);
                
                // Add to scene and store reference
                this.graphics3D.scene.add(car3D);
                this.playerCars3D.push(car3D);
                
                // Update player reference
                player.car = car3D;
            }
        });
    }

    resizeCanvas() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    resetRaceState() {
        this.gameState.currentRace = {
            position: 1,
            lap: 1,
            totalLaps: 3,
            time: 0,
            speed: 0,
            isRacing: true,
            playerX: this.canvas.width / 2,
            playerY: this.canvas.height * 0.8,
            playerAngle: 0,
            velocity: { x: 0, y: 0 },
            checkpoints: [],
            opponents: this.generateOpponents()
        };
        
        // Initialize race track and checkpoints
        this.initializeTrack();
    }

    initializeTrack() {
        const track = {
            centerX: this.canvas.width / 2,
            centerY: this.canvas.height / 2,
            radiusX: Math.min(this.canvas.width, this.canvas.height) * 0.3,
            radiusY: Math.min(this.canvas.width, this.canvas.height) * 0.2
        };
        
        // Generate checkpoints around the track
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.gameState.currentRace.checkpoints.push({
                x: track.centerX + Math.cos(angle) * track.radiusX,
                y: track.centerY + Math.sin(angle) * track.radiusY,
                passed: false
            });
        }
        
        this.gameState.currentRace.track = track;
    }

    generateOpponents() {
        const opponents = [];
        const names = ['Lightning McQueen', 'Speed Demon', 'Turbo Thunder', 'Nitro Nova', 'Velocity Vector'];
        
        for (let i = 0; i < 5; i++) {
            opponents.push({
                name: names[i],
                x: this.canvas.width / 2 + (i - 2) * 100,
                y: this.canvas.height * 0.85,
                angle: 0,
                speed: 0.5 + Math.random() * 0.3,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`
            });
        }
        
        return opponents;
    }

    startGameLoop() {
        const gameLoop = (currentTime) => {
            const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
            this.lastTime = currentTime;
            
            if (this.currentScreen === 'gameScreen' && this.gameState.currentRace.isRacing) {
                this.updateGame(deltaTime);
                this.renderGame3D(deltaTime);
                this.updateHUD();
            }
            
            this.gameLoop = requestAnimationFrame(gameLoop);
        };
        
        this.lastTime = performance.now();
        this.gameLoop = requestAnimationFrame(gameLoop);
    }

    updateGame(deltaTime) {
        this.handleInput3D(deltaTime);
        this.updatePhysics3D(deltaTime);
        this.updateRaceProgress();
        
        // Update race time
        this.gameState.currentRace.time += deltaTime;
    }

    handleInput3D(deltaTime) {
        // Handle Player 1
        this.handlePlayerInput(0, deltaTime);
        
        // Handle Player 2 (if in split-screen mode)
        if (this.splitScreenMode && this.player2Active && this.players[1]) {
            this.handlePlayerInput(1, deltaTime);
        }
    }
    
    handlePlayerInput(playerIndex, deltaTime) {
        if (!this.players[playerIndex] || !this.players[playerIndex].car) return;
        
        const player = this.players[playerIndex];
        const carData = this.selectedCar || gameData.cars[player.selectedCar || 0];
        
        // Car physics constants
        const acceleration = carData.stats.acceleration * 20;
        const maxSpeed = carData.stats.speed * 5;
        const turnSpeed = carData.stats.handling * 2;
        const brakeForce = 30;
        const friction = 0.95;
        
        let accelerating = false;
        let braking = false;
        let turning = 0;
        
        // Different control schemes for different players
        if (playerIndex === 0) {
            // Player 1 controls
            switch(this.gameState.settings.controlScheme) {
                case 'wasd':
                    if (this.keys['KeyW']) accelerating = true;
                    if (this.keys['KeyS']) braking = true;
                    if (this.keys['KeyA']) turning = -1;
                    if (this.keys['KeyD']) turning = 1;
                    break;
                case 'arrows':
                    if (this.keys['ArrowUp']) accelerating = true;
                    if (this.keys['ArrowDown']) braking = true;
                    if (this.keys['ArrowLeft']) turning = -1;
                    if (this.keys['ArrowRight']) turning = 1;
                    break;
            }
            
            // Camera switching for player 1
            if (this.keys['KeyC']) {
                const modes = ['chase', 'cockpit', 'overhead'];
                const currentIndex = modes.indexOf(this.gameState.settings.cameraMode);
                const nextIndex = (currentIndex + 1) % modes.length;
                this.gameState.settings.cameraMode = modes[nextIndex];
                this.graphics3D.setCameraMode(modes[nextIndex]);
                this.keys['KeyC'] = false; // Prevent rapid switching
            }
        } else if (playerIndex === 1) {
            // Player 2 controls (Arrow keys)
            if (this.keys['ArrowUp']) accelerating = true;
            if (this.keys['ArrowDown']) braking = true;
            if (this.keys['ArrowLeft']) turning = -1;
            if (this.keys['ArrowRight']) turning = 1;
        }
        
        // Apply forces
        if (accelerating) {
            player.speed = Math.min(player.speed + acceleration * deltaTime, maxSpeed);
            player.rpm = Math.min(800 + player.speed * 50, 8000);
        } else if (braking) {
            player.speed = Math.max(player.speed - brakeForce * deltaTime, 0);
            player.rpm = Math.max(player.rpm - 1000 * deltaTime, 800);
        } else {
            player.speed *= friction;
            player.rpm = Math.max(player.rpm - 500 * deltaTime, 800);
        }
        
        // Update gear based on RPM
        if (player.rpm > 3000 && player.gear < 6) {
            player.gear = Math.min(Math.floor(player.rpm / 1200), 6);
        } else if (player.rpm < 1500 && player.gear > 1) {
            player.gear = Math.max(Math.floor(player.rpm / 1200), 1);
        }
        
        // Turning (only when moving)
        if (Math.abs(turning) > 0 && player.speed > 0.1) {
            const turnAmount = turning * turnSpeed * deltaTime * (player.speed / maxSpeed);
            player.rotation.y += turnAmount;
            player.car.rotation.y = player.rotation.y;
        }
        
        // Update game state for HUD (only for player 1)
        if (playerIndex === 0) {
            this.gameState.currentRace.speed = Math.round(player.speed * 3.6); // Convert to km/h
            this.gameState.currentRace.rpm = Math.round(player.rpm);
            this.gameState.currentRace.gear = player.gear;
        }
    }

    updatePhysics3D(deltaTime) {
        // Update Player 1
        this.updatePlayerPhysics(0, deltaTime);
        
        // Update Player 2 (if in split-screen mode)
        if (this.splitScreenMode && this.player2Active && this.players[1]) {
            this.updatePlayerPhysics(1, deltaTime);
        }
        
        // Update camera (follow player 1)
        if (this.graphics3D && this.players[0] && this.players[0].car) {
            this.graphics3D.updateCamera(this.players[0].car, deltaTime);
        }
    }
    
    updatePlayerPhysics(playerIndex, deltaTime) {
        if (!this.players[playerIndex] || !this.players[playerIndex].car) return;
        
        const player = this.players[playerIndex];
        
        // Calculate movement direction
        const direction = new THREE.Vector3(0, 0, 1);
        direction.applyEuler(player.rotation);
        
        // Update velocity
        player.velocity.copy(direction);
        player.velocity.multiplyScalar(player.speed);
        
        // Update position
        const movement = player.velocity.clone();
        movement.multiplyScalar(deltaTime);
        player.position.add(movement);
        
        // Keep car on ground
        player.position.y = 1;
        
        // Update 3D car position and rotation
        player.car.position.copy(player.position);
        player.car.rotation.copy(player.rotation);
    }

    renderGame3D(deltaTime) {
        if (this.graphics3D) {
            this.graphics3D.render(this.gameState, deltaTime);
        } else {
            // Fallback to 2D rendering
            this.renderGame();
        }
    }
    
    // Legacy 2D methods for fallback
    updatePlayer(deltaTime) {
        // Update player position
        this.gameState.currentRace.playerX += this.gameState.currentRace.velocity.x;
        this.gameState.currentRace.playerY += this.gameState.currentRace.velocity.y;
        
        // Keep player on screen (with some buffer)
        const buffer = 50;
        this.gameState.currentRace.playerX = Math.max(buffer, Math.min(this.canvas.width - buffer, this.gameState.currentRace.playerX));
        this.gameState.currentRace.playerY = Math.max(buffer, Math.min(this.canvas.height - buffer, this.gameState.currentRace.playerY));
    }

    updateOpponents(deltaTime) {
        // Simple AI for opponents - they follow the track
        this.gameState.currentRace.opponents.forEach((opponent, index) => {
            const track = this.gameState.currentRace.track;
            const targetAngle = Math.atan2(
                track.centerY - opponent.y,
                track.centerX - opponent.x
            );
            
            // Move opponents along track
            opponent.x += Math.cos(opponent.angle) * opponent.speed;
            opponent.y += Math.sin(opponent.angle) * opponent.speed;
            
            // Simple track following
            opponent.angle += (targetAngle - opponent.angle) * 0.02;
        });
    }

    checkCollisions() {
        // Check player collision with opponents
        this.gameState.currentRace.opponents.forEach(opponent => {
            const dx = this.gameState.currentRace.playerX - opponent.x;
            const dy = this.gameState.currentRace.playerY - opponent.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 40) {
                // Collision - bounce away
                this.gameState.currentRace.velocity.x += dx * 0.01;
                this.gameState.currentRace.velocity.y += dy * 0.01;
            }
        });
    }

    updateRaceProgress() {
        // Check checkpoint progress
        this.gameState.currentRace.checkpoints.forEach((checkpoint, index) => {
            if (!checkpoint.passed) {
                const dx = this.gameState.currentRace.playerX - checkpoint.x;
                const dy = this.gameState.currentRace.playerY - checkpoint.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 50) {
                    checkpoint.passed = true;
                    
                    // Check if all checkpoints passed
                    const allPassed = this.gameState.currentRace.checkpoints.every(cp => cp.passed);
                    if (allPassed) {
                        this.completeLap();
                    }
                }
            }
        });
    }

    completeLap() {
        this.gameState.currentRace.lap++;
        
        // Reset checkpoints
        this.gameState.currentRace.checkpoints.forEach(checkpoint => {
            checkpoint.passed = false;
        });
        
        if (this.gameState.currentRace.lap > this.gameState.currentRace.totalLaps) {
            this.finishRace();
        }
    }

    finishRace() {
        this.gameState.currentRace.isRacing = false;
        
        // Calculate final position and rewards
        const finalTime = (this.gameState.currentRace.time / 1000).toFixed(2);
        const position = Math.floor(Math.random() * 3) + 1; // Random position for demo
        const credits = Math.max(100, 1000 - (position - 1) * 300);
        
        this.gameState.playerStats.credits += credits;
        this.gameState.playerStats.totalRaces++;
        if (position === 1) this.gameState.playerStats.wins++;
        
        // Show results
        document.getElementById('finalPosition').textContent = this.getPositionText(position);
        document.getElementById('bestLap').textContent = (Math.random() * 30 + 60).toFixed(2) + 's';
        document.getElementById('totalTime').textContent = finalTime + 's';
        document.getElementById('creditsEarned').textContent = '$' + credits;
        
        setTimeout(() => {
            this.showScreen('raceResults');
        }, 2000);
    }

    getPositionText(position) {
        switch(position) {
            case 1: return '1st';
            case 2: return '2nd';
            case 3: return '3rd';
            default: return position + 'th';
        }
    }

    renderGame() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw track
        this.drawTrack();
        
        // Draw checkpoints
        this.drawCheckpoints();
        
        // Draw opponents
        this.drawOpponents();
        
        // Draw player
        this.drawPlayer();
        
        // Draw effects
        this.drawEffects();
    }

    drawBackground() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#98FB98');
        gradient.addColorStop(1, '#228B22');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add some texture
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            this.ctx.fillRect(x, y, 2, 2);
        }
    }

    drawTrack() {
        const track = this.gameState.currentRace.track;
        
        // Draw track outline
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 120;
        this.ctx.beginPath();
        this.ctx.ellipse(track.centerX, track.centerY, track.radiusX, track.radiusY, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw track surface
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 100;
        this.ctx.beginPath();
        this.ctx.ellipse(track.centerX, track.centerY, track.radiusX, track.radiusY, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw center line
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([20, 20]);
        this.ctx.beginPath();
        this.ctx.ellipse(track.centerX, track.centerY, track.radiusX, track.radiusY, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawCheckpoints() {
        this.gameState.currentRace.checkpoints.forEach((checkpoint, index) => {
            this.ctx.fillStyle = checkpoint.passed ? '#00FF00' : '#FF6B35';
            this.ctx.beginPath();
            this.ctx.arc(checkpoint.x, checkpoint.y, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Checkpoint number
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '12px Orbitron';
            this.ctx.textAlign = 'center';
            this.ctx.fillText((index + 1).toString(), checkpoint.x, checkpoint.y + 4);
        });
    }

    drawOpponents() {
        this.gameState.currentRace.opponents.forEach(opponent => {
            this.ctx.save();
            this.ctx.translate(opponent.x, opponent.y);
            this.ctx.rotate(opponent.angle);
            
            // Car body
            this.ctx.fillStyle = opponent.color;
            this.ctx.fillRect(-15, -8, 30, 16);
            
            // Car details
            this.ctx.fillStyle = '#FFF';
            this.ctx.fillRect(-12, -6, 24, 12);
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(-10, -4, 20, 8);
            
            this.ctx.restore();
        });
    }

    drawPlayer() {
        const car = gameData.cars[this.selectedCar];
        
        this.ctx.save();
        this.ctx.translate(this.gameState.currentRace.playerX, this.gameState.currentRace.playerY);
        this.ctx.rotate(this.gameState.currentRace.playerAngle);
        
        // Car shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(-17, -10, 34, 20);
        
        // Car body
        this.ctx.fillStyle = car.color;
        this.ctx.fillRect(-15, -8, 30, 16);
        
        // Car details
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillRect(-12, -6, 24, 12);
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(-10, -4, 20, 8);
        
        // Car icon overlay
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(car.icon, 0, 4);
        
        this.ctx.restore();
        
        // Speed lines effect
        if (this.gameState.currentRace.speed > 50) {
            this.drawSpeedLines();
        }
    }

    drawSpeedLines() {
        const intensity = Math.min(this.gameState.currentRace.speed / 100, 1);
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.5})`;
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i < 10; i++) {
            const angle = this.gameState.currentRace.playerAngle + Math.PI + (Math.random() - 0.5) * 0.5;
            const distance = 30 + Math.random() * 50;
            
            const startX = this.gameState.currentRace.playerX + Math.cos(angle) * 20;
            const startY = this.gameState.currentRace.playerY + Math.sin(angle) * 20;
            const endX = startX + Math.cos(angle) * distance;
            const endY = startY + Math.sin(angle) * distance;
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
    }

    drawEffects() {
        // Add some particle effects or other visual enhancements
        // This could include tire smoke, sparks, etc.
    }

    updateHUD() {
        // Update speed
        document.getElementById('speedValue').textContent = this.gameState.currentRace.speed;
        
        // Update lap count
        document.getElementById('lapCount').textContent = this.gameState.currentRace.lap;
        
        // Update position
        document.getElementById('position').textContent = this.getPositionText(this.gameState.currentRace.position);
        
        // Update race time
        const minutes = Math.floor(this.gameState.currentRace.time / 60000);
        const seconds = Math.floor((this.gameState.currentRace.time % 60000) / 1000);
        document.getElementById('raceTime').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateMultiplayerLobby() {
        // This would connect to a real multiplayer service in a full implementation
        console.log('Updating multiplayer lobby...');
    }

    initSplitScreenSetup() {
        this.splitScreenMode = true;
        
        // Populate car selections for both players
        this.populateSplitScreenCars();
        this.populateSplitScreenTracks();
        
        // Set up event listeners for split-screen controls
        this.setupSplitScreenEventListeners();
    }
    
    populateSplitScreenCars() {
        const player1Cars = document.querySelector('.player-1 .car-selection-mini');
        const player2Cars = document.querySelector('.player-2 .car-selection-mini');
        
        if (player1Cars && player2Cars) {
            player1Cars.innerHTML = '';
            player2Cars.innerHTML = '';
            
            gameData.cars.forEach((car, index) => {
                const carElement1 = this.createSplitScreenCarElement(car, index, 1);
                const carElement2 = this.createSplitScreenCarElement(car, index, 2);
                
                player1Cars.appendChild(carElement1);
                player2Cars.appendChild(carElement2);
            });
        }
    }
    
    createSplitScreenCarElement(car, index, playerId) {
        const carDiv = document.createElement('div');
        carDiv.className = 'car-mini-item';
        carDiv.dataset.car = index;
        
        carDiv.innerHTML = `
            <div class="car-mini-preview" style="background: ${car.color};">
                ${car.icon}
            </div>
            <div class="car-mini-name">${car.name}</div>
        `;
        
        carDiv.addEventListener('click', () => {
            selectCarForPlayer(playerId, index);
        });
        
        return carDiv;
    }
    
    populateSplitScreenTracks() {
        const trackGrid = document.querySelector('.track-grid');
        
        if (trackGrid) {
            trackGrid.innerHTML = '';
            
            gameData.tracks.forEach((track, index) => {
                const trackElement = this.createSplitScreenTrackElement(track, index);
                trackGrid.appendChild(trackElement);
            });
        }
    }
    
    createSplitScreenTrackElement(track, index) {
        const trackDiv = document.createElement('div');
        trackDiv.className = 'track-item';
        trackDiv.dataset.track = index;
        
        trackDiv.innerHTML = `
            <div class="track-preview" style="background: linear-gradient(45deg, ${track.color || '#2c3e50'}, ${track.environment === 'desert' ? '#f39c12' : track.environment === 'forest' ? '#27ae60' : '#34495e'});">
            </div>
            <div class="track-name">${track.name}</div>
            <div class="track-details">
                <div class="track-detail-item">
                    <span>Type:</span>
                    <span>${track.type}</span>
                </div>
                <div class="track-detail-item">
                    <span>Length:</span>
                    <span>${track.length}km</span>
                </div>
                <div class="track-detail-item">
                    <span>Difficulty:</span>
                    <span>${track.difficulty}</span>
                </div>
                <div class="track-detail-item">
                    <span>Weather:</span>
                    <span>${track.weather}</span>
                </div>
            </div>
        `;
        
        trackDiv.addEventListener('click', () => {
            selectTrackForSplitScreen(index);
        });
        
        return trackDiv;
    }
    
    setupSplitScreenEventListeners() {
        // Start race button
        const startBtn = document.getElementById('startSplitScreenRace');
        if (startBtn) {
            startBtn.addEventListener('click', startSplitScreenRace);
        }
        
        // Back button
        const backBtn = document.getElementById('backFromSplitScreen');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.splitScreenMode = false;
                this.showScreen('mainMenu');
            });
        }
    }

    // Garage functions
    updateCarColor(color) {
        if (this.selectedCar !== null) {
            gameData.cars[this.selectedCar].color = color;
            this.updateGarage();
        }
    }

    upgradeEngine() {
        if (this.gameState.playerStats.credits >= 500 && this.selectedCar !== null) {
            const car = gameData.cars[this.selectedCar];
            if (car.upgrades.engine < 5) {
                this.gameState.playerStats.credits -= 500;
                car.upgrades.engine++;
                car.stats.speed = Math.min(10, car.stats.speed + 1);
                document.getElementById('engineLevel').textContent = `Level ${car.upgrades.engine}`;
            }
        }
    }

    upgradeTires() {
        if (this.gameState.playerStats.credits >= 300 && this.selectedCar !== null) {
            const car = gameData.cars[this.selectedCar];
            if (car.upgrades.tires < 5) {
                this.gameState.playerStats.credits -= 300;
                car.upgrades.tires++;
                car.stats.handling = Math.min(10, car.stats.handling + 1);
                document.getElementById('tiresLevel').textContent = `Level ${car.upgrades.tires}`;
            }
        }
    }

    upgradeHandling() {
        if (this.gameState.playerStats.credits >= 400 && this.selectedCar !== null) {
            const car = gameData.cars[this.selectedCar];
            if (car.upgrades.handling < 5) {
                this.gameState.playerStats.credits -= 400;
                car.upgrades.handling++;
                car.stats.braking = Math.min(10, car.stats.braking + 1);
                document.getElementById('handlingLevel').textContent = `Level ${car.upgrades.handling}`;
            }
        }
    }

    // Cleanup
    destroy() {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
    }
}

// Global game instance
let game;

// Initialize game when page loads
window.addEventListener('load', () => {
    game = new HorizonRacing();
});

// Screen navigation functions (called by HTML buttons)
function showMainMenu() {
    game.showScreen('mainMenu');
}

function showCarSelection() {
    game.showScreen('carSelection');
}

function showGarage() {
    game.showScreen('garage');
}

function showSettings() {
    game.showScreen('settings');
}

function showMultiplayer() {
    game.showScreen('multiplayerLobby');
}

function startRace() {
    if (game.selectedCar !== null) {
        game.showScreen('gameScreen');
    } else {
        alert('Please select a car first!');
    }
}

function raceAgain() {
    game.showScreen('gameScreen');
}

function createRoom() {
    alert('Multiplayer room creation would be implemented with a backend service!');
}

// Car customization functions
function updateCarColor(color) {
    game.updateCarColor(color);
}

function upgradeEngine() {
    game.upgradeEngine();
}

function upgradeTires() {
    game.upgradeTires();
}

function upgradeHandling() {
    game.upgradeHandling();
}

// Split-screen functions
function showSplitScreen() {
    game.showScreen('splitScreenSetup');
}

function selectCarForPlayer(playerId, carIndex) {
    if (game.splitScreenMode) {
        // Update player car selection
        if (playerId === 1) {
            game.players[0].selectedCar = carIndex;
        } else if (playerId === 2) {
            if (!game.players[1]) {
                game.players[1] = {
                    id: 2,
                    name: 'Player 2',
                    car: null,
                    position: new THREE.Vector3(30, 1, -3),
                    rotation: new THREE.Euler(0, Math.PI / 2, 0),
                    velocity: new THREE.Vector3(0, 0, 0),
                    speed: 0,
                    rpm: 800,
                    gear: 1,
                    lapCount: 0,
                    lastCheckpoint: 0
                };
            }
            game.players[1].selectedCar = carIndex;
        }
        
        // Update UI to show selection
        document.querySelectorAll(`.player-${playerId} .car-mini-item`).forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelector(`.player-${playerId} .car-mini-item[data-car="${carIndex}"]`).classList.add('selected');
    }
}

function selectTrackForSplitScreen(trackIndex) {
    if (game.splitScreenMode) {
        game.selectedTrack = trackIndex;
        
        // Update UI to show selection
        document.querySelectorAll('.track-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelector(`.track-item[data-track="${trackIndex}"]`).classList.add('selected');
    }
}

function startSplitScreenRace() {
    if (game.splitScreenMode) {
        // Validate that both players have selected cars
        if (game.players[0].selectedCar !== undefined && game.players[1] && game.players[1].selectedCar !== undefined) {
            game.player2Active = true;
            game.showScreen('gameScreen');
        } else {
            alert('Both players must select a car before starting the race!');
        }
    }
}

function enableSplitScreen() {
    game.splitScreenMode = true;
    game.canvas.classList.add('split-screen');
    
    // Initialize player 2 if not exists
    if (!game.players[1]) {
        game.players[1] = {
            id: 2,
            name: 'Player 2',
            car: null,
            position: new THREE.Vector3(30, 1, -3),
            rotation: new THREE.Euler(0, Math.PI / 2, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            speed: 0,
            rpm: 800,
            gear: 1,
            lapCount: 0,
            lastCheckpoint: 0
        };
    }
}
