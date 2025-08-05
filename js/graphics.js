// Graphics Engine for Horizon Racing
class GraphicsEngine {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1,
            shake: { x: 0, y: 0, intensity: 0 }
        };
        this.effects = {
            motionBlur: false,
            lighting: true,
            shadows: true,
            particles: true
        };
        this.performance = {
            frameCount: 0,
            fps: 60,
            lastFpsTime: Date.now()
        };
    }
    
    // Main render function
    render(gameState, deltaTime) {
        this.updatePerformance();
        this.updateCamera(gameState);
        this.clearCanvas();
        
        // Apply camera transformations
        this.ctx.save();
        this.applyCameraTransform();
        
        // Render game world
        this.renderBackground(gameState);
        this.renderTrack(gameState.currentRace.track);
        this.renderCheckpoints(gameState.currentRace.checkpoints);
        this.renderVehicles(gameState);
        this.renderEffects(gameState, deltaTime);
        
        this.ctx.restore();
        
        // Render UI elements (not affected by camera)
        this.renderUI(gameState);
        this.renderDebugInfo(gameState);
    }
    
    updatePerformance() {
        this.performance.frameCount++;
        const now = Date.now();
        if (now - this.performance.lastFpsTime >= 1000) {
            this.performance.fps = this.performance.frameCount;
            this.performance.frameCount = 0;
            this.performance.lastFpsTime = now;
        }
    }
    
    updateCamera(gameState) {
        // Follow player vehicle
        const player = gameState.currentRace;
        const targetX = player.playerX;
        const targetY = player.playerY;
        
        // Smooth camera following
        const followSpeed = 0.05;
        this.camera.x += (targetX - this.camera.x) * followSpeed;
        this.camera.y += (targetY - this.camera.y) * followSpeed;
        
        // Speed-based zoom
        const speed = player.speed || 0;
        const targetZoom = Math.max(0.8, 1.2 - (speed / 100));
        this.camera.zoom += (targetZoom - this.camera.zoom) * 0.02;
        
        // Camera shake based on speed and collisions
        if (speed > 80) {
            this.camera.shake.intensity = Math.min((speed - 80) / 50, 0.5);
        } else {
            this.camera.shake.intensity *= 0.95;
        }
        
        if (this.camera.shake.intensity > 0.01) {
            this.camera.shake.x = (Math.random() - 0.5) * this.camera.shake.intensity * 10;
            this.camera.shake.y = (Math.random() - 0.5) * this.camera.shake.intensity * 10;
        }
    }
    
    applyCameraTransform() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Translate to center, apply zoom, then offset by camera position
        this.ctx.translate(centerX + this.camera.shake.x, centerY + this.camera.shake.y);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    renderBackground(gameState) {
        const gradient = this.ctx.createRadialGradient(
            this.camera.x, this.camera.y, 0,
            this.camera.x, this.camera.y, 800
        );
        
        // Dynamic sky color based on time or weather
        const weather = gameState.weather || 'sunny';
        switch(weather) {
            case 'sunny':
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(0.7, '#98FB98');
                gradient.addColorStop(1, '#228B22');
                break;
            case 'rainy':
                gradient.addColorStop(0, '#696969');
                gradient.addColorStop(0.7, '#556B2F');
                gradient.addColorStop(1, '#2F4F4F');
                break;
            case 'night':
                gradient.addColorStop(0, '#191970');
                gradient.addColorStop(0.7, '#2F2F4F');
                gradient.addColorStop(1, '#000000');
                break;
            default:
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(1, '#228B22');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            this.camera.x - this.canvas.width,
            this.camera.y - this.canvas.height,
            this.canvas.width * 2,
            this.canvas.height * 2
        );
        
        // Add environmental details
        this.renderEnvironmentalDetails(gameState);
    }
    
    renderEnvironmentalDetails(gameState) {
        // Clouds
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 5; i++) {
            const cloudX = this.camera.x + (i - 2) * 300 + Math.sin(Date.now() * 0.0001 + i) * 50;
            const cloudY = this.camera.y - 200 + Math.cos(Date.now() * 0.00008 + i) * 30;
            this.drawCloud(cloudX, cloudY, 40 + i * 10);
        }
        
        // Trees/Buildings (simple representations)
        this.ctx.fillStyle = '#2F4F2F';
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const distance = 600 + Math.sin(i) * 100;
            const treeX = this.camera.x + Math.cos(angle) * distance;
            const treeY = this.camera.y + Math.sin(angle) * distance;
            
            this.ctx.beginPath();
            this.ctx.arc(treeX, treeY, 15, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawCloud(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.6, y, size * 0.8, 0, Math.PI * 2);
        this.ctx.arc(x - size * 0.6, y, size * 0.8, 0, Math.PI * 2);
        this.ctx.arc(x, y - size * 0.6, size * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    renderTrack(track) {
        if (!track) return;
        
        const segments = 64;
        const angleStep = (Math.PI * 2) / segments;
        
        // Track surface with gradient
        const gradient = this.ctx.createRadialGradient(
            track.centerX, track.centerY, track.radiusX * 0.5,
            track.centerX, track.centerY, track.radiusX * 1.2
        );
        gradient.addColorStop(0, '#404040');
        gradient.addColorStop(0.5, '#505050');
        gradient.addColorStop(1, '#303030');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        
        // Outer edge
        for (let i = 0; i <= segments; i++) {
            const angle = i * angleStep;
            const x = track.centerX + Math.cos(angle) * track.radiusX * 1.2;
            const y = track.centerY + Math.sin(angle) * track.radiusY * 1.2;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        
        // Inner edge (reverse direction for hole)
        for (let i = segments; i >= 0; i--) {
            const angle = i * angleStep;
            const x = track.centerX + Math.cos(angle) * track.radiusX * 0.5;
            const y = track.centerY + Math.sin(angle) * track.radiusY * 0.5;
            this.ctx.lineTo(x, y);
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        
        // Track markings
        this.renderTrackMarkings(track);
        
        // Track barriers
        this.renderTrackBarriers(track);
    }
    
    renderTrackMarkings(track) {
        const segments = 32;
        const angleStep = (Math.PI * 2) / segments;
        
        // Center line
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([20, 20]);
        this.ctx.beginPath();
        
        for (let i = 0; i <= segments; i++) {
            const angle = i * angleStep;
            const x = track.centerX + Math.cos(angle) * track.radiusX * 0.85;
            const y = track.centerY + Math.sin(angle) * track.radiusY * 0.85;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Start/Finish line
        const startAngle = 0;
        const startX1 = track.centerX + Math.cos(startAngle) * track.radiusX * 0.6;
        const startY1 = track.centerY + Math.sin(startAngle) * track.radiusY * 0.6;
        const startX2 = track.centerX + Math.cos(startAngle) * track.radiusX * 1.1;
        const startY2 = track.centerY + Math.sin(startAngle) * track.radiusY * 1.1;
        
        // Checkered pattern
        this.ctx.lineWidth = 8;
        for (let i = 0; i < 10; i++) {
            this.ctx.strokeStyle = i % 2 === 0 ? '#FFFFFF' : '#000000';
            const t1 = i / 10;
            const t2 = (i + 1) / 10;
            this.ctx.beginPath();
            this.ctx.moveTo(
                startX1 + (startX2 - startX1) * t1,
                startY1 + (startY2 - startY1) * t1
            );
            this.ctx.lineTo(
                startX1 + (startX2 - startX1) * t2,
                startY1 + (startY2 - startY1) * t2
            );
            this.ctx.stroke();
        }
    }
    
    renderTrackBarriers(track) {
        const segments = 64;
        const angleStep = (Math.PI * 2) / segments;
        
        // Outer barriers
        this.ctx.strokeStyle = '#FF0000';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        
        for (let i = 0; i <= segments; i++) {
            const angle = i * angleStep;
            const x = track.centerX + Math.cos(angle) * track.radiusX * 1.3;
            const y = track.centerY + Math.sin(angle) * track.radiusY * 1.3;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
        
        // Inner barriers
        this.ctx.strokeStyle = '#FF0000';
        this.ctx.beginPath();
        
        for (let i = 0; i <= segments; i++) {
            const angle = i * angleStep;
            const x = track.centerX + Math.cos(angle) * track.radiusX * 0.4;
            const y = track.centerY + Math.sin(angle) * track.radiusY * 0.4;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
    }
    
    renderCheckpoints(checkpoints) {
        if (!checkpoints) return;
        
        checkpoints.forEach((checkpoint, index) => {
            const alpha = checkpoint.passed ? 0.3 : 0.8;
            const color = checkpoint.passed ? '#00FF00' : '#FF6B35';
            
            // Checkpoint circle
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = alpha;
            this.ctx.beginPath();
            this.ctx.arc(checkpoint.x, checkpoint.y, 25, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Checkpoint number
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 16px Orbitron';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText((index + 1).toString(), checkpoint.x, checkpoint.y);
            
            // Pulse effect for active checkpoint
            if (!checkpoint.passed) {
                const pulseSize = 25 + Math.sin(Date.now() * 0.01) * 5;
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 3;
                this.ctx.globalAlpha = 0.5;
                this.ctx.beginPath();
                this.ctx.arc(checkpoint.x, checkpoint.y, pulseSize, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    renderVehicles(gameState) {
        // Render opponents first (so they appear behind player)
        if (gameState.currentRace.opponents) {
            gameState.currentRace.opponents.forEach(opponent => {
                this.renderVehicle(opponent, false);
            });
        }
        
        // Render player vehicle
        const player = {
            x: gameState.currentRace.playerX,
            y: gameState.currentRace.playerY,
            angle: gameState.currentRace.playerAngle,
            color: gameData.cars[game.selectedCar]?.color || '#FF0000',
            icon: gameData.cars[game.selectedCar]?.icon || '🏎️',
            isPlayer: true
        };
        
        this.renderVehicle(player, true);
    }
    
    renderVehicle(vehicle, isPlayer = false) {
        this.ctx.save();
        this.ctx.translate(vehicle.x, vehicle.y);
        this.ctx.rotate(vehicle.angle);
        
        // Shadow
        if (this.effects.shadows) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(-18, -12, 36, 24);
        }
        
        // Car body
        const carLength = isPlayer ? 30 : 28;
        const carWidth = isPlayer ? 16 : 14;
        
        this.ctx.fillStyle = vehicle.color || '#FF0000';
        this.ctx.fillRect(-carLength/2, -carWidth/2, carLength, carWidth);
        
        // Car details
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(-carLength/2 + 3, -carWidth/2 + 2, carLength - 6, carWidth - 4);
        
        // Windshield
        this.ctx.fillStyle = 'rgba(100, 150, 255, 0.7)';
        this.ctx.fillRect(-carLength/2 + 6, -carWidth/2 + 3, carLength - 12, carWidth - 6);
        
        // Headlights
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.beginPath();
        this.ctx.arc(carLength/2 - 2, -carWidth/2 + 2, 2, 0, Math.PI * 2);
        this.ctx.arc(carLength/2 - 2, carWidth/2 - 2, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Taillights (if visible from behind)
        this.ctx.fillStyle = '#FF0000';
        this.ctx.beginPath();
        this.ctx.arc(-carLength/2 + 2, -carWidth/2 + 2, 1.5, 0, Math.PI * 2);
        this.ctx.arc(-carLength/2 + 2, carWidth/2 - 2, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Car icon overlay
        if (vehicle.icon && isPlayer) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(vehicle.icon, 0, 0);
        }
        
        // Player indicator
        if (isPlayer) {
            this.ctx.strokeStyle = '#00FF00';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, carLength/2 + 5, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
        
        // Speed lines for fast movement
        if (isPlayer && gameState.currentRace.speed > 50) {
            this.renderSpeedLines(vehicle, gameState.currentRace.speed);
        }
    }
    
    renderSpeedLines(vehicle, speed) {
        const intensity = Math.min(speed / 100, 1);
        const lineCount = Math.floor(intensity * 8) + 2;
        
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.6})`;
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i < lineCount; i++) {
            const angle = vehicle.angle + Math.PI + (Math.random() - 0.5) * 0.8;
            const distance = 20 + Math.random() * 40;
            const startDistance = 25;
            
            const startX = vehicle.x + Math.cos(angle) * startDistance;
            const startY = vehicle.y + Math.sin(angle) * startDistance;
            const endX = startX + Math.cos(angle) * distance;
            const endY = startY + Math.sin(angle) * distance;
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
    }
    
    renderEffects(gameState, deltaTime) {
        // Render particles if enabled
        if (this.effects.particles && window.particleSystem) {
            window.particleSystem.render(this.ctx);
        }
        
        // Weather effects
        this.renderWeatherEffects(gameState);
        
        // Race start countdown
        if (gameState.countdown && gameState.countdown > 0) {
            this.renderCountdown(gameState.countdown);
        }
    }
    
    renderWeatherEffects(gameState) {
        const weather = gameState.weather || 'sunny';
        
        switch(weather) {
            case 'rainy':
                this.renderRain();
                break;
            case 'snow':
                this.renderSnow();
                break;
            case 'foggy':
                this.renderFog();
                break;
        }
    }
    
    renderRain() {
        this.ctx.strokeStyle = 'rgba(173, 216, 230, 0.6)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < 100; i++) {
            const x = this.camera.x + (Math.random() - 0.5) * this.canvas.width * 2;
            const y = this.camera.y + (Math.random() - 0.5) * this.canvas.height * 2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x - 2, y + 10);
            this.ctx.stroke();
        }
    }
    
    renderSnow() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        for (let i = 0; i < 50; i++) {
            const x = this.camera.x + (Math.random() - 0.5) * this.canvas.width * 2;
            const y = this.camera.y + (Math.random() - 0.5) * this.canvas.height * 2;
            const size = Math.random() * 3 + 1;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    renderFog() {
        const gradient = this.ctx.createRadialGradient(
            this.camera.x, this.camera.y, 0,
            this.camera.x, this.camera.y, 400
        );
        gradient.addColorStop(0, 'rgba(200, 200, 200, 0)');
        gradient.addColorStop(1, 'rgba(200, 200, 200, 0.4)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            this.camera.x - 400,
            this.camera.y - 400,
            800,
            800
        );
    }
    
    renderCountdown(count) {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for UI
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Countdown text
        this.ctx.fillStyle = '#FF6B35';
        this.ctx.font = 'bold 72px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        
        const text = count > 0 ? count.toString() : 'GO!';
        this.ctx.strokeText(text, centerX, centerY);
        this.ctx.fillText(text, centerX, centerY);
        
        this.ctx.restore();
    }
    
    renderUI(gameState) {
        // Reset transformation for UI rendering
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Performance can be handled by HTML elements, but we can add canvas-based UI here
        this.renderMinimap(gameState);
        this.renderPositionIndicator(gameState);
    }
    
    renderMinimap(gameState) {
        const minimapSize = 150;
        const minimapX = this.canvas.width - minimapSize - 20;
        const minimapY = 20;
        
        // Minimap background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
        
        // Track outline
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(
            minimapX + minimapSize/2,
            minimapY + minimapSize/2,
            minimapSize/3,
            0, Math.PI * 2
        );
        this.ctx.stroke();
        
        // Player position
        if (gameState.currentRace.track) {
            const track = gameState.currentRace.track;
            const playerRelX = (gameState.currentRace.playerX - track.centerX) / (track.radiusX * 2);
            const playerRelY = (gameState.currentRace.playerY - track.centerY) / (track.radiusY * 2);
            
            const playerMapX = minimapX + minimapSize/2 + playerRelX * minimapSize/3;
            const playerMapY = minimapY + minimapSize/2 + playerRelY * minimapSize/3;
            
            this.ctx.fillStyle = '#00FF00';
            this.ctx.beginPath();
            this.ctx.arc(playerMapX, playerMapY, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Opponents
        if (gameState.currentRace.opponents) {
            gameState.currentRace.opponents.forEach(opponent => {
                if (gameState.currentRace.track) {
                    const track = gameState.currentRace.track;
                    const opponentRelX = (opponent.x - track.centerX) / (track.radiusX * 2);
                    const opponentRelY = (opponent.y - track.centerY) / (track.radiusY * 2);
                    
                    const opponentMapX = minimapX + minimapSize/2 + opponentRelX * minimapSize/3;
                    const opponentMapY = minimapY + minimapSize/2 + opponentRelY * minimapSize/3;
                    
                    this.ctx.fillStyle = '#FF6B35';
                    this.ctx.beginPath();
                    this.ctx.arc(opponentMapX, opponentMapY, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            });
        }
    }
    
    renderPositionIndicator(gameState) {
        // Visual position indicator in the game world
        const positions = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
        const currentPos = gameState.currentRace.position || 1;
        
        // Position change animation could be added here
    }
    
    renderDebugInfo(gameState) {
        if (!gameState.debug) return;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 100);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        
        const debugInfo = [
            `FPS: ${this.performance.fps}`,
            `Speed: ${gameState.currentRace.speed || 0} km/h`,
            `Position: ${gameState.currentRace.playerX?.toFixed(1)}, ${gameState.currentRace.playerY?.toFixed(1)}`,
            `Angle: ${((gameState.currentRace.playerAngle || 0) * 180 / Math.PI).toFixed(1)}°`,
            `Lap: ${gameState.currentRace.lap}/${gameState.currentRace.totalLaps}`,
            `Camera: ${this.camera.x.toFixed(1)}, ${this.camera.y.toFixed(1)}`
        ];
        
        debugInfo.forEach((info, index) => {
            this.ctx.fillText(info, 15, 25 + index * 15);
        });
    }
    
    // Effect methods
    screenFlash(color = '#FFFFFF', duration = 200) {
        const flashElement = document.createElement('div');
        flashElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: ${color};
            pointer-events: none;
            z-index: 9999;
            opacity: 0.8;
            animation: screenFlash ${duration}ms ease-out;
        `;
        
        document.body.appendChild(flashElement);
        setTimeout(() => {
            document.body.removeChild(flashElement);
        }, duration);
    }
    
    addCameraShake(intensity = 1, duration = 500) {
        this.camera.shake.intensity = Math.max(this.camera.shake.intensity, intensity);
        
        setTimeout(() => {
            this.camera.shake.intensity *= 0.5;
        }, duration);
    }
    
    // Settings
    updateSettings(settings) {
        this.effects = { ...this.effects, ...settings };
    }
    
    setQuality(quality) {
        switch(quality) {
            case 'low':
                this.effects.motionBlur = false;
                this.effects.lighting = false;
                this.effects.shadows = false;
                this.effects.particles = false;
                break;
            case 'medium':
                this.effects.motionBlur = false;
                this.effects.lighting = true;
                this.effects.shadows = true;
                this.effects.particles = true;
                break;
            case 'high':
                this.effects.motionBlur = true;
                this.effects.lighting = true;
                this.effects.shadows = true;
                this.effects.particles = true;
                break;
            case 'ultra':
                this.effects.motionBlur = true;
                this.effects.lighting = true;
                this.effects.shadows = true;
                this.effects.particles = true;
                // Additional effects for ultra quality
                break;
        }
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes screenFlash {
        0% { opacity: 0.8; }
        50% { opacity: 0.4; }
        100% { opacity: 0; }
    }
    
    @keyframes slideIn {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100px); opacity: 0; }
    }
    
    .achievement-notification {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .achievement-icon {
        font-size: 2rem;
    }
    
    .achievement-content h4 {
        margin: 0;
        font-size: 1rem;
    }
    
    .achievement-content p {
        margin: 0.2rem 0;
        font-size: 0.9rem;
    }
    
    .achievement-content small {
        font-size: 0.8rem;
        opacity: 0.8;
    }
`;
document.head.appendChild(style);
