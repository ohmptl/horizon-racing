// Multiplayer System for Horizon Racing
class MultiplayerManager {
    constructor() {
        this.isConnected = false;
        this.isHost = false;
        this.roomId = null;
        this.players = new Map();
        this.localPlayer = null;
        this.networkLatency = 0;
        this.syncInterval = null;
        this.messageQueue = [];
        
        // For demo purposes, we'll simulate multiplayer
        this.simulatedMode = true;
        this.simulatedPlayers = [];
        
        this.init();
    }
    
    init() {
        // In a real implementation, this would connect to a WebSocket server
        // For demo purposes, we'll simulate multiplayer behavior
        console.log('Multiplayer Manager initialized (Demo Mode)');
        
        if (this.simulatedMode) {
            this.initializeSimulatedMultiplayer();
        }
    }
    
    // Simulated multiplayer for demo
    initializeSimulatedMultiplayer() {
        // Create some AI players to simulate other players
        this.simulatedPlayers = [
            {
                id: 'player1',
                name: 'SpeedRacer',
                car: 1,
                position: { x: 400, y: 300 },
                angle: 0,
                speed: 0,
                isAI: true,
                color: '#FF0000'
            },
            {
                id: 'player2',
                name: 'TurboMax',
                car: 2,
                position: { x: 450, y: 300 },
                angle: 0,
                speed: 0,
                isAI: true,
                color: '#0066FF'
            },
            {
                id: 'player3',
                name: 'DriftKing',
                car: 3,
                position: { x: 500, y: 300 },
                angle: 0,
                speed: 0,
                isAI: true,
                color: '#FFD700'
            }
        ];
        
        this.isConnected = true;
        this.startSimulatedSync();
    }
    
    startSimulatedSync() {
        // Simulate network sync every 50ms
        this.syncInterval = setInterval(() => {
            this.updateSimulatedPlayers();
            this.broadcastPlayerState();
        }, 50);
    }
    
    updateSimulatedPlayers() {
        if (!window.game || !window.game.gameState.currentRace.track) return;
        
        const track = window.game.gameState.currentRace.track;
        
        this.simulatedPlayers.forEach(player => {
            if (player.isAI) {
                // Simple AI movement around the track
                const centerX = track.centerX;
                const centerY = track.centerY;
                const radius = (track.radiusX + track.radiusY) / 2 * 0.85;
                
                // Calculate target position on track
                const currentAngle = Math.atan2(player.position.y - centerY, player.position.x - centerX);
                const targetAngle = currentAngle + 0.02; // Move around track
                
                const targetX = centerX + Math.cos(targetAngle) * radius;
                const targetY = centerY + Math.sin(targetAngle) * radius;
                
                // Move towards target
                const dx = targetX - player.position.x;
                const dy = targetY - player.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 5) {
                    const speed = 2;
                    player.position.x += (dx / distance) * speed;
                    player.position.y += (dy / distance) * speed;
                    player.angle = Math.atan2(dy, dx);
                    player.speed = Math.round(Math.random() * 50 + 30); // Random speed for variety
                }
            }
        });
    }
    
    // Connection management
    async connect(serverUrl = 'ws://localhost:8080') {
        if (this.simulatedMode) {
            console.log('Using simulated multiplayer mode');
            return true;
        }
        
        try {
            this.socket = new WebSocket(serverUrl);
            
            this.socket.onopen = () => {
                console.log('Connected to multiplayer server');
                this.isConnected = true;
                this.sendMessage({ type: 'player_join', data: this.getLocalPlayerData() });
            };
            
            this.socket.onmessage = (event) => {
                this.handleMessage(JSON.parse(event.data));
            };
            
            this.socket.onclose = () => {
                console.log('Disconnected from multiplayer server');
                this.isConnected = false;
                this.cleanup();
            };
            
            this.socket.onerror = (error) => {
                console.error('Multiplayer connection error:', error);
                this.isConnected = false;
            };
            
            return true;
        } catch (error) {
            console.error('Failed to connect to multiplayer server:', error);
            return false;
        }
    }
    
    disconnect() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.sendMessage({ type: 'player_leave', data: { playerId: this.localPlayer?.id } });
            this.socket.close();
        }
        
        this.cleanup();
    }
    
    cleanup() {
        this.isConnected = false;
        this.isHost = false;
        this.roomId = null;
        this.players.clear();
        this.localPlayer = null;
        
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
    
    // Room management
    async createRoom(roomConfig) {
        if (this.simulatedMode) {
            this.roomId = 'demo_room_' + Math.random().toString(36).substr(2, 9);
            this.isHost = true;
            console.log('Created simulated room:', this.roomId);
            return this.roomId;
        }
        
        const message = {
            type: 'create_room',
            data: {
                name: roomConfig.name,
                maxPlayers: roomConfig.maxPlayers || 8,
                track: roomConfig.track,
                gameMode: roomConfig.gameMode || 'race',
                password: roomConfig.password
            }
        };
        
        this.sendMessage(message);
        return new Promise((resolve) => {
            this.onRoomCreated = resolve;
        });
    }
    
    async joinRoom(roomId, password = null) {
        if (this.simulatedMode) {
            this.roomId = roomId;
            console.log('Joined simulated room:', roomId);
            return true;
        }
        
        const message = {
            type: 'join_room',
            data: {
                roomId,
                password,
                player: this.getLocalPlayerData()
            }
        };
        
        this.sendMessage(message);
        return new Promise((resolve) => {
            this.onRoomJoined = resolve;
        });
    }
    
    leaveRoom() {
        if (this.roomId) {
            this.sendMessage({
                type: 'leave_room',
                data: { roomId: this.roomId, playerId: this.localPlayer?.id }
            });
            
            this.roomId = null;
            this.isHost = false;
            this.players.clear();
        }
    }
    
    // Game state synchronization
    broadcastPlayerState() {
        if (!this.isConnected || !window.game) return;
        
        const gameState = window.game.gameState.currentRace;
        const playerState = {
            id: this.localPlayer?.id || 'local_player',
            position: {
                x: gameState.playerX,
                y: gameState.playerY
            },
            angle: gameState.playerAngle,
            speed: gameState.speed,
            lap: gameState.lap,
            checkpoints: gameState.checkpoints?.map(cp => cp.passed) || [],
            timestamp: Date.now()
        };
        
        if (this.simulatedMode) {
            // In simulated mode, just store our state
            this.localPlayerState = playerState;
        } else {
            this.sendMessage({
                type: 'player_state',
                data: playerState
            });
        }
    }
    
    updateRemotePlayer(playerId, state) {
        const player = this.players.get(playerId);
        if (player) {
            // Interpolate position for smooth movement
            const latency = this.networkLatency;
            const timeDiff = Date.now() - state.timestamp;
            
            // Predict position based on latency
            if (state.speed > 0) {
                const predictedX = state.position.x + Math.cos(state.angle) * state.speed * (latency + timeDiff) * 0.001;
                const predictedY = state.position.y + Math.sin(state.angle) * state.speed * (latency + timeDiff) * 0.001;
                
                player.position.x = predictedX;
                player.position.y = predictedY;
            } else {
                player.position.x = state.position.x;
                player.position.y = state.position.y;
            }
            
            player.angle = state.angle;
            player.speed = state.speed;
            player.lap = state.lap;
        }
    }
    
    // Message handling
    sendMessage(message) {
        if (this.simulatedMode) {
            // In simulated mode, handle messages locally
            this.handleSimulatedMessage(message);
            return;
        }
        
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            // Queue message if not connected
            this.messageQueue.push(message);
        }
    }
    
    handleMessage(message) {
        switch (message.type) {
            case 'room_created':
                this.roomId = message.data.roomId;
                this.isHost = true;
                if (this.onRoomCreated) {
                    this.onRoomCreated(this.roomId);
                }
                break;
                
            case 'room_joined':
                this.roomId = message.data.roomId;
                this.players = new Map(message.data.players.map(p => [p.id, p]));
                if (this.onRoomJoined) {
                    this.onRoomJoined(true);
                }
                break;
                
            case 'player_joined':
                this.players.set(message.data.id, message.data);
                this.onPlayerJoined?.(message.data);
                break;
                
            case 'player_left':
                this.players.delete(message.data.playerId);
                this.onPlayerLeft?.(message.data.playerId);
                break;
                
            case 'player_state':
                this.updateRemotePlayer(message.data.id, message.data);
                break;
                
            case 'race_start':
                this.onRaceStart?.(message.data);
                break;
                
            case 'race_finish':
                this.onRaceFinish?.(message.data);
                break;
                
            case 'chat_message':
                this.onChatMessage?.(message.data);
                break;
                
            case 'error':
                console.error('Multiplayer error:', message.data);
                break;
        }
    }
    
    handleSimulatedMessage(message) {
        // Handle messages in simulated mode
        switch (message.type) {
            case 'player_state':
                // Update our simulated players
                break;
            case 'create_room':
                // Simulate room creation
                break;
        }
    }
    
    // Race management
    startRace() {
        if (this.isHost) {
            this.sendMessage({
                type: 'start_race',
                data: {
                    roomId: this.roomId,
                    track: window.game?.gameState.currentTrack,
                    countdown: 3
                }
            });
        }
    }
    
    finishRace(results) {
        this.sendMessage({
            type: 'race_finish',
            data: {
                playerId: this.localPlayer?.id,
                results: results,
                timestamp: Date.now()
            }
        });
    }
    
    // Chat system
    sendChatMessage(message) {
        this.sendMessage({
            type: 'chat_message',
            data: {
                playerId: this.localPlayer?.id,
                playerName: this.localPlayer?.name || 'Player',
                message: message,
                timestamp: Date.now()
            }
        });
    }
    
    // Utility functions
    getLocalPlayerData() {
        return {
            id: this.generatePlayerId(),
            name: this.getPlayerName(),
            car: window.game?.selectedCar || 0,
            position: { x: 0, y: 0 },
            angle: 0,
            speed: 0,
            isReady: false
        };
    }
    
    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }
    
    getPlayerName() {
        // Get player name from local storage or prompt
        let name = localStorage.getItem('playerName');
        if (!name) {
            name = prompt('Enter your player name:') || 'Anonymous';
            localStorage.setItem('playerName', name);
        }
        return name;
    }
    
    calculateNetworkLatency() {
        if (this.simulatedMode) {
            this.networkLatency = Math.random() * 50 + 20; // Simulate 20-70ms latency
            return;
        }
        
        const startTime = Date.now();
        this.sendMessage({
            type: 'ping',
            data: { timestamp: startTime }
        });
        
        // Response would update this.networkLatency
    }
    
    // Leaderboard
    updateLeaderboard(players) {
        const sortedPlayers = Array.from(players.values()).sort((a, b) => {
            if (a.lap !== b.lap) return b.lap - a.lap;
            return a.raceTime - b.raceTime;
        });
        
        return sortedPlayers.map((player, index) => ({
            ...player,
            position: index + 1
        }));
    }
    
    // Anti-cheat (basic validation)
    validatePlayerState(state) {
        // Basic validation to prevent obvious cheating
        const maxSpeed = 200; // km/h
        const maxPosition = 2000; // pixels from center
        
        if (state.speed > maxSpeed) {
            console.warn('Player speed validation failed:', state.speed);
            return false;
        }
        
        const distanceFromCenter = Math.sqrt(state.position.x ** 2 + state.position.y ** 2);
        if (distanceFromCenter > maxPosition) {
            console.warn('Player position validation failed:', distanceFromCenter);
            return false;
        }
        
        return true;
    }
    
    // Get multiplayer data for rendering
    getMultiplayerData() {
        if (this.simulatedMode) {
            return {
                isConnected: true,
                players: this.simulatedPlayers,
                roomId: this.roomId,
                isHost: this.isHost,
                playerCount: this.simulatedPlayers.length + 1
            };
        }
        
        return {
            isConnected: this.isConnected,
            players: Array.from(this.players.values()),
            roomId: this.roomId,
            isHost: this.isHost,
            playerCount: this.players.size + (this.localPlayer ? 1 : 0)
        };
    }
    
    // Event handlers (can be overridden)
    onPlayerJoined(player) {
        console.log('Player joined:', player.name);
        if (window.uiController) {
            window.uiController.showNotification(`${player.name} joined the race!`, 'info');
        }
    }
    
    onPlayerLeft(playerId) {
        const player = this.players.get(playerId);
        console.log('Player left:', player?.name);
        if (window.uiController && player) {
            window.uiController.showNotification(`${player.name} left the race!`, 'warning');
        }
    }
    
    onRaceStart(data) {
        console.log('Race starting!');
        if (window.game) {
            window.game.startRace();
        }
    }
    
    onRaceFinish(data) {
        console.log('Player finished race:', data);
        // Update leaderboard, show results, etc.
    }
    
    onChatMessage(data) {
        console.log('Chat message:', data);
        this.displayChatMessage(data);
    }
    
    displayChatMessage(data) {
        // Create chat message element
        const chatContainer = document.getElementById('chatContainer');
        if (!chatContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        messageElement.innerHTML = `
            <span class="chat-player">${data.playerName}:</span>
            <span class="chat-text">${data.message}</span>
        `;
        
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Remove old messages
        while (chatContainer.children.length > 50) {
            chatContainer.removeChild(chatContainer.firstChild);
        }
    }
}

// Multiplayer UI components
class MultiplayerUI {
    constructor(multiplayerManager) {
        this.mp = multiplayerManager;
        this.setupUI();
    }
    
    setupUI() {
        this.createLobbyUI();
        this.createInGameUI();
        this.createChatUI();
    }
    
    createLobbyUI() {
        // Room creation modal
        const roomModal = document.createElement('div');
        roomModal.id = 'roomCreationModal';
        roomModal.className = 'modal hidden';
        roomModal.innerHTML = `
            <div class="modal-content">
                <h3>Create Room</h3>
                <div class="form-group">
                    <label>Room Name:</label>
                    <input type="text" id="roomName" placeholder="Enter room name">
                </div>
                <div class="form-group">
                    <label>Max Players:</label>
                    <select id="maxPlayers">
                        <option value="2">2</option>
                        <option value="4">4</option>
                        <option value="6">6</option>
                        <option value="8" selected>8</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Track:</label>
                    <select id="trackSelect">
                        <option value="horizon">Horizon Circuit</option>
                        <option value="mountain">Mountain Pass</option>
                        <option value="city">City Streets</option>
                        <option value="desert">Desert Storm</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Password (optional):</label>
                    <input type="password" id="roomPassword" placeholder="Enter password">
                </div>
                <div class="modal-buttons">
                    <button onclick="multiplayerUI.createRoom()">Create Room</button>
                    <button onclick="multiplayerUI.closeModal()">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(roomModal);
    }
    
    createInGameUI() {
        // Multiplayer HUD overlay
        const mpHUD = document.createElement('div');
        mpHUD.id = 'multiplayerHUD';
        mpHUD.className = 'multiplayer-hud hidden';
        mpHUD.innerHTML = `
            <div class="player-list">
                <h4>Players</h4>
                <div id="playerListContent"></div>
            </div>
            <div class="leaderboard">
                <h4>Leaderboard</h4>
                <div id="leaderboardContent"></div>
            </div>
        `;
        
        document.body.appendChild(mpHUD);
    }
    
    createChatUI() {
        // Chat interface
        const chatUI = document.createElement('div');
        chatUI.id = 'chatInterface';
        chatUI.className = 'chat-interface hidden';
        chatUI.innerHTML = `
            <div class="chat-header">
                <h4>Chat</h4>
                <button onclick="multiplayerUI.toggleChat()" class="chat-toggle">–</button>
            </div>
            <div id="chatContainer" class="chat-container"></div>
            <div class="chat-input">
                <input type="text" id="chatInputField" placeholder="Type a message..." maxlength="100">
                <button onclick="multiplayerUI.sendChat()">Send</button>
            </div>
        `;
        
        document.body.appendChild(chatUI);
        
        // Chat input handler
        const chatInput = document.getElementById('chatInputField');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChat();
                }
            });
        }
    }
    
    showRoomCreation() {
        const modal = document.getElementById('roomCreationModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
    
    closeModal() {
        const modal = document.getElementById('roomCreationModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    async createRoom() {
        const roomName = document.getElementById('roomName').value;
        const maxPlayers = parseInt(document.getElementById('maxPlayers').value);
        const track = document.getElementById('trackSelect').value;
        const password = document.getElementById('roomPassword').value;
        
        if (!roomName.trim()) {
            alert('Please enter a room name');
            return;
        }
        
        const config = {
            name: roomName,
            maxPlayers,
            track,
            password: password || null
        };
        
        const roomId = await this.mp.createRoom(config);
        if (roomId) {
            this.closeModal();
            this.showInGameUI();
            if (window.uiController) {
                window.uiController.showNotification('Room created successfully!', 'success');
            }
        }
    }
    
    showInGameUI() {
        const mpHUD = document.getElementById('multiplayerHUD');
        const chatUI = document.getElementById('chatInterface');
        
        if (mpHUD) mpHUD.classList.remove('hidden');
        if (chatUI) chatUI.classList.remove('hidden');
        
        this.updatePlayerList();
        this.updateLeaderboard();
    }
    
    hideInGameUI() {
        const mpHUD = document.getElementById('multiplayerHUD');
        const chatUI = document.getElementById('chatInterface');
        
        if (mpHUD) mpHUD.classList.add('hidden');
        if (chatUI) chatUI.classList.add('hidden');
    }
    
    updatePlayerList() {
        const container = document.getElementById('playerListContent');
        if (!container) return;
        
        const mpData = this.mp.getMultiplayerData();
        const players = mpData.players;
        
        container.innerHTML = players.map(player => `
            <div class="player-item">
                <span class="player-name">${player.name || 'Unknown'}</span>
                <span class="player-status">${player.isReady ? '✓' : '⏳'}</span>
            </div>
        `).join('');
    }
    
    updateLeaderboard() {
        const container = document.getElementById('leaderboardContent');
        if (!container) return;
        
        const mpData = this.mp.getMultiplayerData();
        const leaderboard = this.mp.updateLeaderboard(new Map(mpData.players.map(p => [p.id, p])));
        
        container.innerHTML = leaderboard.map(player => `
            <div class="leaderboard-item">
                <span class="position">${player.position}</span>
                <span class="player-name">${player.name}</span>
                <span class="lap">Lap ${player.lap || 1}</span>
            </div>
        `).join('');
    }
    
    sendChat() {
        const input = document.getElementById('chatInputField');
        if (!input || !input.value.trim()) return;
        
        this.mp.sendChatMessage(input.value.trim());
        input.value = '';
    }
    
    toggleChat() {
        const chatContainer = document.getElementById('chatContainer');
        const chatInput = document.querySelector('.chat-input');
        const toggleBtn = document.querySelector('.chat-toggle');
        
        if (chatContainer && chatInput && toggleBtn) {
            const isCollapsed = chatContainer.style.display === 'none';
            
            chatContainer.style.display = isCollapsed ? 'block' : 'none';
            chatInput.style.display = isCollapsed ? 'flex' : 'none';
            toggleBtn.textContent = isCollapsed ? '–' : '+';
        }
    }
}

// Multiplayer styles
const multiplayerStyles = document.createElement('style');
multiplayerStyles.textContent = `
    .multiplayer-hud {
        position: fixed;
        top: 150px;
        right: 20px;
        width: 200px;
        max-height: 400px;
        background: rgba(0, 0, 0, 0.8);
        border-radius: 10px;
        padding: 1rem;
        z-index: 100;
        font-family: 'Orbitron', monospace;
        font-size: 0.8rem;
    }
    
    .player-list, .leaderboard {
        margin-bottom: 1rem;
    }
    
    .player-list h4, .leaderboard h4 {
        color: #FF6B35;
        margin-bottom: 0.5rem;
        font-size: 1rem;
    }
    
    .player-item, .leaderboard-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.3rem;
        margin-bottom: 0.2rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
    }
    
    .chat-interface {
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 300px;
        height: 200px;
        background: rgba(0, 0, 0, 0.9);
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        z-index: 100;
        font-family: 'Orbitron', monospace;
    }
    
    .chat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        background: rgba(255, 107, 53, 0.2);
        border-radius: 10px 10px 0 0;
    }
    
    .chat-header h4 {
        color: #FF6B35;
        font-size: 0.9rem;
        margin: 0;
    }
    
    .chat-toggle {
        background: none;
        border: none;
        color: #FF6B35;
        font-size: 1.2rem;
        cursor: pointer;
        width: 20px;
        height: 20px;
    }
    
    .chat-container {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem;
        font-size: 0.8rem;
    }
    
    .chat-message {
        margin-bottom: 0.3rem;
        word-wrap: break-word;
    }
    
    .chat-player {
        color: #FFD700;
        font-weight: bold;
    }
    
    .chat-text {
        color: #FFF;
    }
    
    .chat-input {
        display: flex;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 0 0 10px 10px;
    }
    
    .chat-input input {
        flex: 1;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        color: #FFF;
        padding: 0.3rem;
        font-size: 0.8rem;
    }
    
    .chat-input button {
        background: #FF6B35;
        border: none;
        border-radius: 4px;
        color: #FFF;
        padding: 0.3rem 0.8rem;
        margin-left: 0.5rem;
        cursor: pointer;
        font-size: 0.8rem;
    }
    
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    
    .modal-content {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        padding: 2rem;
        min-width: 400px;
        backdrop-filter: blur(10px);
        border: 2px solid rgba(255, 107, 53, 0.3);
    }
    
    .modal-content h3 {
        color: #FF6B35;
        margin-bottom: 1.5rem;
        text-align: center;
    }
    
    .form-group {
        margin-bottom: 1rem;
    }
    
    .form-group label {
        display: block;
        color: #FFF;
        margin-bottom: 0.3rem;
        font-weight: 700;
    }
    
    .form-group input, .form-group select {
        width: 100%;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 6px;
        color: #FFF;
        font-family: 'Orbitron', monospace;
    }
    
    .modal-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 1.5rem;
    }
    
    .modal-buttons button {
        padding: 0.8rem 1.5rem;
        background: #FF6B35;
        border: none;
        border-radius: 8px;
        color: #FFF;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .modal-buttons button:hover {
        background: #F7931E;
        transform: translateY(-2px);
    }
    
    @media (max-width: 768px) {
        .multiplayer-hud, .chat-interface {
            width: 250px;
        }
        
        .modal-content {
            min-width: 300px;
            margin: 1rem;
        }
    }
`;
document.head.appendChild(multiplayerStyles);

// Global multiplayer instances
const multiplayerManager = new MultiplayerManager();
const multiplayerUI = new MultiplayerUI(multiplayerManager);

// Global functions for HTML buttons
function createRoom() {
    multiplayerUI.showRoomCreation();
}

function joinRoom(roomId) {
    multiplayerManager.joinRoom(roomId);
}
