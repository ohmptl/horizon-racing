// Car Data and Definitions
const gameData = {
    cars: [
        {
            name: "Lightning Bolt",
            icon: "🏎️",
            color: "#FF0000",
            stats: {
                speed: 9,
                handling: 7,
                acceleration: 8,
                braking: 6
            },
            topSpeed: 320,
            acceleration: 3.2,
            weight: 1200,
            engine: "V8 Twin Turbo",
            price: 0, // Free starting car
            upgrades: {
                engine: 1,
                tires: 1,
                handling: 1
            }
        },
        {
            name: "Speed Demon",
            icon: "🚗",
            color: "#0066FF",
            stats: {
                speed: 8,
                handling: 9,
                acceleration: 7,
                braking: 8
            },
            topSpeed: 290,
            acceleration: 3.8,
            weight: 1100,
            engine: "V6 Turbo",
            price: 1500,
            upgrades: {
                engine: 1,
                tires: 1,
                handling: 1
            }
        },
        {
            name: "Turbo Thunder",
            icon: "🏁",
            color: "#FFD700",
            stats: {
                speed: 10,
                handling: 6,
                acceleration: 9,
                braking: 7
            },
            topSpeed: 350,
            acceleration: 2.9,
            weight: 1300,
            engine: "V12 Naturally Aspirated",
            price: 2500,
            upgrades: {
                engine: 1,
                tires: 1,
                handling: 1
            }
        },
        {
            name: "Drift King",
            icon: "🚙",
            color: "#FF6B35",
            stats: {
                speed: 7,
                handling: 10,
                acceleration: 6,
                braking: 9
            },
            topSpeed: 270,
            acceleration: 4.1,
            weight: 1050,
            engine: "Flat-6 Turbo",
            price: 2000,
            upgrades: {
                engine: 1,
                tires: 1,
                handling: 1
            }
        },
        {
            name: "Road Warrior",
            icon: "🚐",
            color: "#8B4513",
            stats: {
                speed: 6,
                handling: 8,
                acceleration: 7,
                braking: 8
            },
            topSpeed: 250,
            acceleration: 4.5,
            weight: 1400,
            engine: "V8 Supercharged",
            price: 1200,
            upgrades: {
                engine: 1,
                tires: 1,
                handling: 1
            }
        },
        {
            name: "Electric Storm",
            icon: "⚡",
            color: "#00FF41",
            stats: {
                speed: 8,
                handling: 8,
                acceleration: 10,
                braking: 7
            },
            topSpeed: 300,
            acceleration: 2.5,
            weight: 1600,
            engine: "Quad Motor Electric",
            price: 3000,
            upgrades: {
                engine: 1,
                tires: 1,
                handling: 1
            }
        }
    ],
    
    tracks: [
        {
            name: "Horizon Circuit",
            type: "circuit",
            length: 2.8,
            difficulty: "Medium",
            weather: "clear",
            timeOfDay: "day",
            description: "A fast-paced circuit with sweeping curves and long straights.",
            checkpoints: 8,
            lapRecord: "1:23.45",
            environment: "racing_complex",
            color: "#333333"
        },
        {
            name: "Neon City Streets",
            type: "street",
            length: 3.2,
            difficulty: "Medium",
            weather: "clear",
            timeOfDay: "night",
            description: "Urban racing through neon-lit city streets with skyscrapers.",
            checkpoints: 10,
            lapRecord: "1:45.23",
            environment: "urban",
            color: "#444444"
        },
        {
            name: "Desert Rally Course",
            type: "offroad",
            length: 4.1,
            difficulty: "Hard",
            weather: "clear",
            timeOfDay: "day",
            description: "Off-road rally through challenging desert terrain with dunes.",
            checkpoints: 12,
            lapRecord: "2:34.67",
            environment: "desert",
            color: "#654321"
        },
        {
            name: "Tokyo Drift Zone",
            type: "drift",
            length: 1.8,
            difficulty: "Expert",
            weather: "clear",
            timeOfDay: "night",
            description: "Professional drift course with tight corners and obstacles.",
            checkpoints: 6,
            lapRecord: "0:58.45",
            environment: "industrial",
            color: "#222222"
        },
        {
            name: "Alpine Mountain Pass",
            type: "circuit",
            length: 5.2,
            difficulty: "Hard",
            weather: "clear",
            timeOfDay: "dawn",
            description: "Challenging mountain road with tight hairpins and elevation changes.",
            checkpoints: 15,
            lapRecord: "2:45.67",
            environment: "mountain",
            color: "#2c3e50"
        },
        {
            name: "Coastal Highway",
            type: "street",
            length: 6.8,
            difficulty: "Easy",
            weather: "clear",
            timeOfDay: "sunset",
            description: "Scenic coastal road with beautiful ocean views.",
            checkpoints: 18,
            lapRecord: "3:12.89",
            environment: "coastal",
            color: "#34495e"
        },
        {
            name: "Industrial Complex",
            type: "circuit",
            length: 2.1,
            difficulty: "Medium",
            weather: "rain",
            timeOfDay: "day",
            description: "Technical circuit through an industrial area with tight sections.",
            checkpoints: 8,
            lapRecord: "1:18.34",
            environment: "industrial",
            color: "#555555"
        },
        {
            name: "Forest Rally",
            type: "offroad",
            length: 3.8,
            difficulty: "Hard",
            weather: "clear",
            timeOfDay: "morning",
            description: "Fast rally stage through dense forest with jumps and crests.",
            checkpoints: 14,
            lapRecord: "2:05.78",
            environment: "forest",
            color: "#228B22"
        }
    ],
    
    powerups: [
        {
            name: "Nitro Boost",
            icon: "🔥",
            description: "Temporary speed boost",
            duration: 3000,
            effect: "speed_boost",
            multiplier: 1.5,
            rarity: "common"
        },
        {
            name: "Super Brakes",
            icon: "🛑",
            description: "Enhanced braking power",
            duration: 5000,
            effect: "brake_boost",
            multiplier: 2.0,
            rarity: "common"
        },
        {
            name: "Ghost Mode",
            icon: "👻",
            description: "Phase through opponents",
            duration: 4000,
            effect: "no_collision",
            multiplier: 1.0,
            rarity: "rare"
        },
        {
            name: "Time Slow",
            icon: "⏰",
            description: "Slow down time around you",
            duration: 3000,
            effect: "time_dilation",
            multiplier: 0.5,
            rarity: "epic"
        },
        {
            name: "Turbo Jump",
            icon: "🚀",
            description: "Launch into the air",
            duration: 1000,
            effect: "jump",
            multiplier: 3.0,
            rarity: "rare"
        }
    ],
    
    achievements: [
        {
            id: "first_win",
            name: "First Victory",
            description: "Win your first race",
            icon: "🏆",
            reward: 500,
            unlocked: false
        },
        {
            id: "speed_demon",
            name: "Speed Demon",
            description: "Reach 200 km/h",
            icon: "💨",
            reward: 300,
            unlocked: false
        },
        {
            id: "collector",
            name: "Car Collector",
            description: "Own 3 different cars",
            icon: "🚗",
            reward: 1000,
            unlocked: false
        },
        {
            id: "perfect_lap",
            name: "Perfect Lap",
            description: "Complete a lap without hitting anything",
            icon: "✨",
            reward: 750,
            unlocked: false
        },
        {
            id: "drift_master",
            name: "Drift Master",
            description: "Maintain a drift for 5 seconds",
            icon: "🌪️",
            reward: 400,
            unlocked: false
        },
        {
            id: "champion",
            name: "Racing Champion",
            description: "Win 10 races",
            icon: "👑",
            reward: 2000,
            unlocked: false
        }
    ],
    
    customization: {
        colors: [
            { name: "Racing Red", value: "#FF0000", price: 0 },
            { name: "Electric Blue", value: "#0066FF", price: 100 },
            { name: "Lightning Yellow", value: "#FFD700", price: 100 },
            { name: "Forest Green", value: "#228B22", price: 150 },
            { name: "Sunset Orange", value: "#FF6B35", price: 150 },
            { name: "Royal Purple", value: "#6A0DAD", price: 200 },
            { name: "Hot Pink", value: "#FF1493", price: 200 },
            { name: "Cyber Cyan", value: "#00FFFF", price: 250 },
            { name: "Chrome Silver", value: "#C0C0C0", price: 300 },
            { name: "Midnight Black", value: "#000000", price: 350 }
        ],
        
        decals: [
            { name: "Racing Stripes", price: 200, description: "Classic racing stripes" },
            { name: "Flame Design", price: 300, description: "Hot flame graphics" },
            { name: "Lightning Bolt", price: 250, description: "Electric lightning design" },
            { name: "Tribal Pattern", price: 400, description: "Tribal art design" },
            { name: "Carbon Fiber", price: 500, description: "Carbon fiber texture" }
        ],
        
        wheels: [
            { name: "Sport Wheels", price: 300, stats: { handling: +1 } },
            { name: "Racing Slicks", price: 500, stats: { speed: +1 } },
            { name: "Off-Road Tires", price: 400, stats: { traction: +1 } },
            { name: "Drift Tires", price: 450, stats: { drift: +2 } },
            { name: "Pro Racing", price: 800, stats: { speed: +1, handling: +1 } }
        ],
        
        spoilers: [
            { name: "Low Profile", price: 200, stats: { stability: +1 } },
            { name: "High Downforce", price: 400, stats: { handling: +2 } },
            { name: "Adjustable Wing", price: 600, stats: { speed: +1, handling: +1 } },
            { name: "GT Wing", price: 500, stats: { stability: +2 } }
        ]
    },
    
    weather: {
        sunny: {
            name: "Sunny",
            icon: "☀️",
            traction: 1.0,
            visibility: 1.0,
            description: "Perfect racing conditions"
        },
        rainy: {
            name: "Rainy",
            icon: "🌧️",
            traction: 0.7,
            visibility: 0.8,
            description: "Slippery conditions, reduced visibility"
        },
        foggy: {
            name: "Foggy",
            icon: "🌫️",
            traction: 0.9,
            visibility: 0.5,
            description: "Poor visibility conditions"
        },
        storm: {
            name: "Storm",
            icon: "⛈️",
            traction: 0.6,
            visibility: 0.6,
            description: "Extreme weather, dangerous conditions"
        },
        snow: {
            name: "Snow",
            icon: "❄️",
            traction: 0.5,
            visibility: 0.7,
            description: "Icy conditions, very slippery"
        }
    },
    
    gameMode: {
        singleRace: {
            name: "Single Race",
            description: "Quick race on any track",
            minPlayers: 1,
            maxPlayers: 8,
            credits: { min: 100, max: 500 }
        },
        championship: {
            name: "Championship",
            description: "Series of races across multiple tracks",
            minPlayers: 1,
            maxPlayers: 8,
            credits: { min: 1000, max: 5000 }
        },
        timeAttack: {
            name: "Time Attack",
            description: "Beat the best lap times",
            minPlayers: 1,
            maxPlayers: 1,
            credits: { min: 200, max: 800 }
        },
        drift: {
            name: "Drift Challenge",
            description: "Score points by drifting",
            minPlayers: 1,
            maxPlayers: 8,
            credits: { min: 150, max: 600 }
        },
        elimination: {
            name: "Elimination",
            description: "Last car standing wins",
            minPlayers: 4,
            maxPlayers: 8,
            credits: { min: 300, max: 1000 }
        }
    },
    
    difficulty: {
        easy: {
            name: "Rookie",
            aiSpeed: 0.8,
            aiAggression: 0.3,
            creditMultiplier: 0.8,
            description: "Perfect for beginners"
        },
        medium: {
            name: "Pro",
            aiSpeed: 1.0,
            aiAggression: 0.6,
            creditMultiplier: 1.0,
            description: "Balanced challenge"
        },
        hard: {
            name: "Expert",
            aiSpeed: 1.2,
            aiAggression: 0.8,
            creditMultiplier: 1.3,
            description: "For experienced racers"
        },
        extreme: {
            name: "Legend",
            aiSpeed: 1.5,
            aiAggression: 1.0,
            creditMultiplier: 1.5,
            description: "Ultimate challenge"
        }
    }
};

// Car utility functions
class CarManager {
    static getCarByName(name) {
        return gameData.cars.find(car => car.name === name);
    }
    
    static getAvailableCars(credits) {
        return gameData.cars.filter(car => car.price <= credits);
    }
    
    static getCarPerformanceRating(car) {
        const total = car.stats.speed + car.stats.handling + car.stats.acceleration + car.stats.braking;
        return Math.round((total / 40) * 100); // Convert to percentage
    }
    
    static getUpgradedStats(car) {
        const upgradedStats = { ...car.stats };
        
        // Apply upgrades
        upgradedStats.speed += car.upgrades.engine;
        upgradedStats.handling += car.upgrades.tires;
        upgradedStats.braking += car.upgrades.handling;
        upgradedStats.acceleration += Math.floor((car.upgrades.engine + car.upgrades.tires) / 2);
        
        // Cap at 10
        Object.keys(upgradedStats).forEach(key => {
            upgradedStats[key] = Math.min(10, upgradedStats[key]);
        });
        
        return upgradedStats;
    }
    
    static calculateUpgradeCost(car, upgradeType, currentLevel) {
        const baseCosts = {
            engine: 500,
            tires: 300,
            handling: 400
        };
        
        return baseCosts[upgradeType] * currentLevel;
    }
    
    static canAffordUpgrade(credits, car, upgradeType) {
        const currentLevel = car.upgrades[upgradeType];
        if (currentLevel >= 5) return false; // Max level
        
        const cost = this.calculateUpgradeCost(car, upgradeType, currentLevel + 1);
        return credits >= cost;
    }
}

// Track utility functions
class TrackManager {
    static getTrackByName(name) {
        return gameData.tracks.find(track => track.name === name);
    }
    
    static getTracksByDifficulty(difficulty) {
        return gameData.tracks.filter(track => track.difficulty === difficulty);
    }
    
    static getRandomTrack() {
        return gameData.tracks[Math.floor(Math.random() * gameData.tracks.length)];
    }
    
    static calculateLapTime(car, track, weather = 'sunny') {
        const carRating = CarManager.getCarPerformanceRating(car) / 100;
        const weatherMultiplier = gameData.weather[weather].traction;
        const difficultyMultiplier = {
            'Easy': 0.8,
            'Medium': 1.0,
            'Hard': 1.3
        }[track.difficulty] || 1.0;
        
        const baseTime = 60; // Base time in seconds
        const trackMultiplier = track.length / 2.0; // Length factor
        
        return baseTime * trackMultiplier * difficultyMultiplier * (2 - carRating) * (2 - weatherMultiplier);
    }
}

// Achievement system
class AchievementManager {
    static checkAchievement(id, gameState) {
        const achievement = gameData.achievements.find(a => a.id === id);
        if (!achievement || achievement.unlocked) return false;
        
        let unlocked = false;
        
        switch(id) {
            case 'first_win':
                unlocked = gameState.playerStats.wins >= 1;
                break;
            case 'speed_demon':
                unlocked = gameState.currentRace.speed >= 200;
                break;
            case 'collector':
                // This would check owned cars in a full implementation
                unlocked = false;
                break;
            case 'perfect_lap':
                // This would track collisions during a lap
                unlocked = false;
                break;
            case 'drift_master':
                // This would track drift duration
                unlocked = false;
                break;
            case 'champion':
                unlocked = gameState.playerStats.wins >= 10;
                break;
        }
        
        if (unlocked) {
            achievement.unlocked = true;
            this.showAchievementNotification(achievement);
            return true;
        }
        
        return false;
    }
    
    static showAchievementNotification(achievement) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-content">
                <h4>Achievement Unlocked!</h4>
                <p>${achievement.name}</p>
                <small>+$${achievement.reward} credits</small>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #FFD700, #FF6B35);
            color: #000;
            padding: 1rem;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(255, 215, 0, 0.5);
            z-index: 1000;
            animation: slideIn 0.5s ease-out;
            font-family: 'Orbitron', monospace;
            font-weight: 700;
            min-width: 250px;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 4000);
    }
    
    static getUnlockedAchievements() {
        return gameData.achievements.filter(a => a.unlocked);
    }
    
    static getTotalRewards() {
        return this.getUnlockedAchievements().reduce((total, a) => total + a.reward, 0);
    }
}
