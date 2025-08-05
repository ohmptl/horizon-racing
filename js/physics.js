// Physics Engine for Horizon Racing
class PhysicsEngine {
    constructor() {
        this.gravity = 0.98;
        this.friction = 0.95;
        this.airResistance = 0.99;
        this.maxSpeed = 10;
        this.collisionDamping = 0.8;
    }

    // Vehicle physics calculation
    updateVehiclePhysics(vehicle, input, deltaTime) {
        const dt = Math.min(deltaTime / 16.67, 2); // Cap delta time to prevent physics breakage
        
        // Get vehicle stats
        const stats = vehicle.stats || { speed: 5, handling: 5, acceleration: 5, braking: 5 };
        const maxSpeed = (stats.speed / 10) * this.maxSpeed;
        const acceleration = (stats.acceleration / 10) * 0.002;
        const turnSpeed = (stats.handling / 10) * 0.004;
        const brakeForce = (stats.braking / 10) * 0.95;
        
        // Initialize velocity if not present
        if (!vehicle.velocity) {
            vehicle.velocity = { x: 0, y: 0 };
        }
        
        // Current speed calculation
        const currentSpeed = Math.sqrt(vehicle.velocity.x ** 2 + vehicle.velocity.y ** 2);
        
        // Apply input forces
        this.applyInputForces(vehicle, input, acceleration, maxSpeed, turnSpeed, brakeForce, currentSpeed, dt);
        
        // Apply environmental forces
        this.applyEnvironmentalForces(vehicle, dt);
        
        // Update position
        vehicle.x += vehicle.velocity.x * dt;
        vehicle.y += vehicle.velocity.y * dt;
        
        // Update angle based on velocity direction (for AI cars)
        if (currentSpeed > 0.1 && !input.isPlayer) {
            const targetAngle = Math.atan2(vehicle.velocity.y, vehicle.velocity.x);
            vehicle.angle = this.lerpAngle(vehicle.angle, targetAngle, 0.1 * dt);
        }
        
        return {
            speed: currentSpeed,
            angle: vehicle.angle,
            position: { x: vehicle.x, y: vehicle.y }
        };
    }
    
    applyInputForces(vehicle, input, acceleration, maxSpeed, turnSpeed, brakeForce, currentSpeed, dt) {
        // Acceleration
        if (input.accelerate) {
            if (currentSpeed < maxSpeed) {
                const forceX = Math.cos(vehicle.angle) * acceleration * dt;
                const forceY = Math.sin(vehicle.angle) * acceleration * dt;
                vehicle.velocity.x += forceX;
                vehicle.velocity.y += forceY;
            }
        }
        
        // Braking
        if (input.brake) {
            vehicle.velocity.x *= Math.pow(brakeForce, dt);
            vehicle.velocity.y *= Math.pow(brakeForce, dt);
        }
        
        // Turning (only effective when moving)
        if (currentSpeed > 0.01) {
            if (input.turnLeft) {
                vehicle.angle -= turnSpeed * currentSpeed * dt;
            }
            if (input.turnRight) {
                vehicle.angle += turnSpeed * currentSpeed * dt;
            }
            
            // Update player angle for better control feel
            if (input.isPlayer && (input.turnLeft || input.turnRight)) {
                // Adjust velocity direction slightly towards car direction
                const velocityAngle = Math.atan2(vehicle.velocity.y, vehicle.velocity.x);
                const angleDiff = this.angleDistance(vehicle.angle, velocityAngle);
                const adjustment = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 0.1) * dt;
                
                const newVelAngle = velocityAngle + adjustment;
                const speed = Math.sqrt(vehicle.velocity.x ** 2 + vehicle.velocity.y ** 2);
                vehicle.velocity.x = Math.cos(newVelAngle) * speed;
                vehicle.velocity.y = Math.sin(newVelAngle) * speed;
            }
        }
    }
    
    applyEnvironmentalForces(vehicle, dt) {
        // Air resistance
        vehicle.velocity.x *= Math.pow(this.airResistance, dt);
        vehicle.velocity.y *= Math.pow(this.airResistance, dt);
        
        // Ground friction
        vehicle.velocity.x *= Math.pow(this.friction, dt);
        vehicle.velocity.y *= Math.pow(this.friction, dt);
    }
    
    // Collision detection and response
    checkCollision(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (obj1.radius || 20) + (obj2.radius || 20);
        
        return {
            colliding: distance < minDistance,
            distance: distance,
            normal: { x: dx / distance, y: dy / distance },
            overlap: minDistance - distance
        };
    }
    
    resolveCollision(obj1, obj2, collision) {
        if (!collision.colliding) return;
        
        // Separate objects
        const separationDistance = collision.overlap * 0.5;
        obj1.x += collision.normal.x * separationDistance;
        obj1.y += collision.normal.y * separationDistance;
        obj2.x -= collision.normal.x * separationDistance;
        obj2.y -= collision.normal.y * separationDistance;
        
        // Calculate relative velocity
        const relVelX = (obj1.velocity?.x || 0) - (obj2.velocity?.x || 0);
        const relVelY = (obj1.velocity?.y || 0) - (obj2.velocity?.y || 0);
        
        // Calculate relative velocity along collision normal
        const velAlongNormal = relVelX * collision.normal.x + relVelY * collision.normal.y;
        
        // Don't resolve if velocities are separating
        if (velAlongNormal > 0) return;
        
        // Calculate collision impulse
        const e = this.collisionDamping; // Coefficient of restitution
        const j = -(1 + e) * velAlongNormal;
        const impulse = j * 0.5; // Assume equal mass
        
        // Apply impulse
        if (obj1.velocity) {
            obj1.velocity.x += impulse * collision.normal.x;
            obj1.velocity.y += impulse * collision.normal.y;
        }
        if (obj2.velocity) {
            obj2.velocity.x -= impulse * collision.normal.x;
            obj2.velocity.y -= impulse * collision.normal.y;
        }
    }
    
    // Drift physics
    calculateDrift(vehicle, input, deltaTime) {
        if (!vehicle.velocity) return { isDrifting: false, driftAngle: 0, driftScore: 0 };
        
        const speed = Math.sqrt(vehicle.velocity.x ** 2 + vehicle.velocity.y ** 2);
        if (speed < 0.5) return { isDrifting: false, driftAngle: 0, driftScore: 0 };
        
        const velocityAngle = Math.atan2(vehicle.velocity.y, vehicle.velocity.x);
        const driftAngle = this.angleDistance(vehicle.angle, velocityAngle);
        const isDrifting = Math.abs(driftAngle) > 0.3 && speed > 1.0;
        
        let driftScore = 0;
        if (isDrifting) {
            driftScore = Math.abs(driftAngle) * speed * 10;
            
            // Reduce grip during drift
            const driftFactor = Math.min(Math.abs(driftAngle) / 1.5, 0.7);
            vehicle.velocity.x *= (1 - driftFactor * 0.1);
            vehicle.velocity.y *= (1 - driftFactor * 0.1);
        }
        
        return {
            isDrifting,
            driftAngle: Math.abs(driftAngle),
            driftScore,
            speed
        };
    }
    
    // Track boundaries and checkpoints
    checkTrackBoundaries(vehicle, track) {
        const centerX = track.centerX;
        const centerY = track.centerY;
        const innerRadius = Math.min(track.radiusX, track.radiusY) * 0.6;
        const outerRadius = Math.max(track.radiusX, track.radiusY) * 1.4;
        
        const dx = vehicle.x - centerX;
        const dy = vehicle.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        let onTrack = distance >= innerRadius && distance <= outerRadius;
        let correction = { x: 0, y: 0 };
        
        if (!onTrack) {
            if (distance < innerRadius) {
                // Too close to center
                const pushDistance = innerRadius - distance;
                const pushAngle = Math.atan2(dy, dx);
                correction.x = Math.cos(pushAngle) * pushDistance;
                correction.y = Math.sin(pushAngle) * pushDistance;
            } else if (distance > outerRadius) {
                // Too far from center
                const pullDistance = distance - outerRadius;
                const pullAngle = Math.atan2(dy, dx);
                correction.x = -Math.cos(pullAngle) * pullDistance;
                correction.y = -Math.sin(pullAngle) * pullDistance;
            }
            
            // Apply correction
            vehicle.x += correction.x;
            vehicle.y += correction.y;
            
            // Reduce speed when off track
            if (vehicle.velocity) {
                vehicle.velocity.x *= 0.9;
                vehicle.velocity.y *= 0.9;
            }
        }
        
        return {
            onTrack,
            correction,
            distance,
            innerRadius,
            outerRadius
        };
    }
    
    checkCheckpoint(vehicle, checkpoint, checkpointRadius = 50) {
        const dx = vehicle.x - checkpoint.x;
        const dy = vehicle.y - checkpoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < checkpointRadius;
    }
    
    // Weather effects on physics
    applyWeatherEffects(vehicle, weather, deltaTime) {
        if (!weather || !vehicle.velocity) return;
        
        const weatherData = gameData.weather[weather];
        if (!weatherData) return;
        
        // Reduce traction based on weather
        const tractionReduction = 1 - weatherData.traction;
        vehicle.velocity.x *= (1 - tractionReduction * 0.1);
        vehicle.velocity.y *= (1 - tractionReduction * 0.1);
        
        // Add random weather effects
        if (weather === 'storm' && Math.random() < 0.01) {
            // Random wind gusts
            const windForce = (Math.random() - 0.5) * 0.05;
            vehicle.velocity.x += windForce;
            vehicle.velocity.y += windForce * 0.5;
        }
        
        if (weather === 'snow' && Math.random() < 0.005) {
            // Occasional slipping
            vehicle.velocity.x += (Math.random() - 0.5) * 0.02;
            vehicle.velocity.y += (Math.random() - 0.5) * 0.02;
        }
    }
    
    // AI physics assistance
    calculateAIInput(vehicle, targetX, targetY, obstacles = []) {
        if (!vehicle.velocity) vehicle.velocity = { x: 0, y: 0 };
        
        // Calculate direction to target
        const dx = targetX - vehicle.x;
        const dy = targetY - vehicle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const targetAngle = Math.atan2(dy, dx);
        
        // Calculate current movement angle
        const currentSpeed = Math.sqrt(vehicle.velocity.x ** 2 + vehicle.velocity.y ** 2);
        
        // Basic AI input
        let input = {
            accelerate: distance > 30,
            brake: false,
            turnLeft: false,
            turnRight: false,
            isPlayer: false
        };
        
        // Turning logic
        if (currentSpeed > 0.1) {
            const angleDiff = this.angleDistance(vehicle.angle, targetAngle);
            const turnThreshold = 0.1;
            
            if (angleDiff > turnThreshold) {
                input.turnLeft = true;
            } else if (angleDiff < -turnThreshold) {
                input.turnRight = true;
            }
            
            // Brake before sharp turns
            if (Math.abs(angleDiff) > 0.8 && currentSpeed > 2) {
                input.brake = true;
                input.accelerate = false;
            }
        }
        
        // Obstacle avoidance
        obstacles.forEach(obstacle => {
            const obsDx = obstacle.x - vehicle.x;
            const obsDy = obstacle.y - vehicle.y;
            const obsDistance = Math.sqrt(obsDx * obsDx + obsDy * obsDy);
            
            if (obsDistance < 80) {
                // Steer away from obstacle
                const avoidAngle = Math.atan2(obsDy, obsDx) + Math.PI;
                const angleDiff = this.angleDistance(vehicle.angle, avoidAngle);
                
                if (angleDiff > 0) {
                    input.turnRight = true;
                } else {
                    input.turnLeft = true;
                }
                
                if (obsDistance < 50) {
                    input.brake = true;
                    input.accelerate = false;
                }
            }
        });
        
        return input;
    }
    
    // Utility functions
    angleDistance(a, b) {
        let diff = a - b;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        return diff;
    }
    
    lerpAngle(a, b, t) {
        const diff = this.angleDistance(b, a);
        return a + diff * t;
    }
    
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    // Powerup physics effects
    applyPowerupEffect(vehicle, powerup, deltaTime) {
        if (!powerup || !vehicle.velocity) return;
        
        switch(powerup.effect) {
            case 'speed_boost':
                const boostForce = 0.005 * deltaTime;
                vehicle.velocity.x += Math.cos(vehicle.angle) * boostForce;
                vehicle.velocity.y += Math.sin(vehicle.angle) * boostForce;
                break;
                
            case 'brake_boost':
                // Enhanced braking is handled in input processing
                break;
                
            case 'jump':
                // Add vertical velocity component (would need 3D for full effect)
                vehicle.jumpHeight = (vehicle.jumpHeight || 0) + 0.1;
                if (vehicle.jumpHeight > 1) vehicle.jumpHeight = 1;
                break;
                
            case 'time_dilation':
                // This would affect global time scale
                break;
                
            case 'no_collision':
                // Collision detection would skip this vehicle
                vehicle.ghostMode = true;
                break;
        }
    }
    
    // Performance optimization
    optimizePhysics(vehicles, maxDistance = 1000) {
        // Reduce physics calculations for distant vehicles
        return vehicles.map(vehicle => {
            const playerDistance = this.calculateDistanceToPlayer(vehicle);
            
            if (playerDistance > maxDistance) {
                // Use simplified physics for distant vehicles
                return this.simplePhysicsUpdate(vehicle);
            }
            
            return vehicle; // Full physics
        });
    }
    
    calculateDistanceToPlayer(vehicle) {
        // This would calculate distance to player vehicle
        // For now, return 0 to ensure full physics
        return 0;
    }
    
    simplePhysicsUpdate(vehicle) {
        // Simplified physics for performance
        if (!vehicle.velocity) vehicle.velocity = { x: 0, y: 0 };
        
        // Simple forward movement
        vehicle.x += Math.cos(vehicle.angle) * 0.5;
        vehicle.y += Math.sin(vehicle.angle) * 0.5;
        
        return vehicle;
    }
}

// Particle system for visual effects
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 500;
    }
    
    addParticle(x, y, type, options = {}) {
        if (this.particles.length >= this.maxParticles) {
            this.particles.shift(); // Remove oldest particle
        }
        
        const particle = {
            x,
            y,
            vx: options.vx || (Math.random() - 0.5) * 2,
            vy: options.vy || (Math.random() - 0.5) * 2,
            size: options.size || Math.random() * 3 + 1,
            life: options.life || 1.0,
            maxLife: options.life || 1.0,
            color: options.color || '#FFF',
            type,
            gravity: options.gravity || 0,
            fade: options.fade !== false
        };
        
        this.particles.push(particle);
    }
    
    update(deltaTime) {
        const dt = deltaTime / 16.67;
        
        this.particles = this.particles.filter(particle => {
            // Update position
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            
            // Apply gravity
            particle.vy += particle.gravity * dt;
            
            // Update life
            particle.life -= dt * 0.02;
            
            // Particle-specific updates
            switch(particle.type) {
                case 'tire_smoke':
                    particle.vx *= 0.98;
                    particle.vy *= 0.98;
                    particle.size *= 1.01;
                    break;
                case 'sparks':
                    particle.vy += 0.01; // Gravity
                    particle.vx *= 0.99;
                    break;
                case 'dust':
                    particle.vx *= 0.95;
                    particle.vy *= 0.95;
                    break;
            }
            
            return particle.life > 0;
        });
    }
    
    render(ctx) {
        this.particles.forEach(particle => {
            ctx.save();
            
            if (particle.fade) {
                ctx.globalAlpha = particle.life / particle.maxLife;
            }
            
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    addTireSmoke(x, y, angle, intensity = 1) {
        for (let i = 0; i < intensity * 3; i++) {
            const offsetAngle = angle + (Math.random() - 0.5) * Math.PI;
            const speed = Math.random() * 2 + 1;
            
            this.addParticle(
                x + Math.cos(offsetAngle) * 10,
                y + Math.sin(offsetAngle) * 10,
                'tire_smoke',
                {
                    vx: Math.cos(offsetAngle) * speed * 0.5,
                    vy: Math.sin(offsetAngle) * speed * 0.5,
                    size: Math.random() * 4 + 2,
                    color: `rgba(200, 200, 200, ${Math.random() * 0.5 + 0.3})`,
                    life: Math.random() * 2 + 1
                }
            );
        }
    }
    
    addSparks(x, y, intensity = 1) {
        for (let i = 0; i < intensity * 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            
            this.addParticle(
                x,
                y,
                'sparks',
                {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: Math.random() * 2 + 0.5,
                    color: `hsl(${Math.random() * 60 + 15}, 100%, 70%)`,
                    life: Math.random() * 1 + 0.5,
                    gravity: 0.02
                }
            );
        }
    }
    
    clear() {
        this.particles = [];
    }
}
