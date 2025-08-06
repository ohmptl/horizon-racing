// 3D Graphics Engine for Horizon Racing
class Graphics3D {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        // Game objects
        this.track = null;
        this.cars = [];
        this.environment = [];
        this.effects = [];
        
        // Camera settings
        this.cameraSettings = {
            mode: 'chase', // chase, cockpit, overhead
            distance: 25,
            height: 12,
            angle: 0.1,
            smoothing: 0.1
        };
        
        // Lighting
        this.lights = {};
        
        // Performance settings
        this.quality = {
            shadows: true,
            antialiasing: true,
            particleCount: 100,
            lodDistance: 200
        };
        
        this.init();
    }
    
    init() {
        if (typeof THREE === 'undefined') {
            console.error('Three.js is not loaded. Please include Three.js before using Graphics3D.');
            return false;
        }
        
        try {
            this.setupScene();
            this.setupRenderer();
            this.setupLighting();
            this.setupControls();
            
            // Add test geometry to verify rendering
            this.addTestGeometry();
            
            console.log('3D Graphics engine initialized successfully');
            console.log('Scene:', this.scene);
            console.log('Camera:', this.camera);
            console.log('Renderer:', this.renderer);
            
            return true;
        } catch (error) {
            console.error('Failed to initialize 3D graphics:', error);
            return false;
        }
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 300);
        
        // Camera setup - position it to see the track clearly
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        // Start with a high overview position to see everything
        this.camera.position.set(0, 50, 50);
        this.camera.lookAt(0, 0, 0); // Look at the center where cars and track are
        
        console.log('3D Scene setup complete, camera at:', this.camera.position);
    }
    
    addTestGeometry() {
        console.log('Adding test geometry for debugging...');
        
        // Add a large colored cube at origin
        const cubeGeometry = new THREE.BoxGeometry(10, 10, 10);
        const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.position.set(0, 5, 0);
        this.scene.add(cube);
        
        // Add a green ground plane
        const planeGeometry = new THREE.PlaneGeometry(100, 100);
        const planeMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = 0;
        this.scene.add(plane);
        
        console.log('Test geometry added, scene now has', this.scene.children.length, 'objects');
    }

    setupRenderer() {
        console.log('Setting up WebGL renderer...');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: this.quality.antialiasing 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        console.log('Renderer created, canvas size:', window.innerWidth, 'x', window.innerHeight);
        
        if (this.quality.shadows) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        console.log('Renderer setup complete, shadows enabled:', this.quality.shadows);
    }
    
    setupLighting() {
        // Ambient light
        this.lights.ambient = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(this.lights.ambient);
        
        // Sun (directional light)
        this.lights.sun = new THREE.DirectionalLight(0xffffff, 1.2);
        this.lights.sun.position.set(100, 100, 50);
        this.lights.sun.castShadow = this.quality.shadows;
        
        if (this.quality.shadows) {
            this.lights.sun.shadow.mapSize.width = 2048;
            this.lights.sun.shadow.mapSize.height = 2048;
            this.lights.sun.shadow.camera.near = 0.5;
            this.lights.sun.shadow.camera.far = 500;
            this.lights.sun.shadow.camera.left = -100;
            this.lights.sun.shadow.camera.right = 100;
            this.lights.sun.shadow.camera.top = 100;
            this.lights.sun.shadow.camera.bottom = -100;
        }
        
        this.scene.add(this.lights.sun);
        
        // Additional environment lighting
        this.lights.hemisphere = new THREE.HemisphereLight(0x87CEEB, 0x228B22, 0.4);
        this.scene.add(this.lights.hemisphere);
    }
    
    setupControls() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    createTrack(trackData) {
        if (this.track) {
            this.scene.remove(this.track);
        }
        
        this.track = new THREE.Group();
        
        console.log('Creating track with data:', trackData);
        
        // Create different track types based on track data
        switch (trackData.type || 'circuit') {
            case 'circuit':
                this.createCircuitTrack(trackData);
                break;
            case 'street':
                this.createStreetTrack(trackData);
                break;
            case 'offroad':
                this.createOffroadTrack(trackData);
                break;
            case 'drift':
                this.createDriftTrack(trackData);
                break;
            default:
                this.createCircuitTrack(trackData);
        }
        
        this.scene.add(this.track);
        console.log('Track added to scene, track children:', this.track.children.length);
    }
    
    createCircuitTrack(trackData) {
        // Main track surface
        const trackGeometry = new THREE.RingGeometry(25, 35, 64);
        const trackMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x333333,
            transparent: true,
            opacity: 0.95
        });
        const trackSurface = new THREE.Mesh(trackGeometry, trackMaterial);
        trackSurface.rotation.x = -Math.PI / 2;
        trackSurface.receiveShadow = true;
        this.track.add(trackSurface);
        
        // Track markings
        this.createTrackMarkings(25, 35);
        
        // Safety barriers
        this.createSafetyBarriers(25, 35);
        
        // Grandstands
        this.createGrandstands();
        
        // Start/finish line
        this.createStartFinishLine(30);
    }
    
    createStreetTrack(trackData) {
        // Street-style track with buildings
        const trackWidth = 8;
        const segments = [
            { start: [40, 0], end: [0, 0], width: trackWidth },
            { start: [0, 0], end: [0, 40], width: trackWidth },
            { start: [0, 40], end: [-40, 40], width: trackWidth },
            { start: [-40, 40], end: [-40, 0], width: trackWidth },
            { start: [-40, 0], end: [40, 0], width: trackWidth }
        ];
        
        segments.forEach((segment, index) => {
            const geometry = new THREE.PlaneGeometry(
                Math.abs(segment.end[0] - segment.start[0]) || segment.width,
                Math.abs(segment.end[1] - segment.start[1]) || segment.width
            );
            const material = new THREE.MeshLambertMaterial({ color: 0x444444 });
            const road = new THREE.Mesh(geometry, material);
            
            road.position.set(
                (segment.start[0] + segment.end[0]) / 2,
                0.1,
                (segment.start[1] + segment.end[1]) / 2
            );
            road.rotation.x = -Math.PI / 2;
            road.receiveShadow = true;
            
            this.track.add(road);
        });
        
        // Add street elements
        this.createStreetElements();
    }
    
    createOffroadTrack(trackData) {
        // Dirt/rally track
        const geometry = new THREE.PlaneGeometry(100, 100, 32, 32);
        const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        // Add terrain height variation
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i + 1] = Math.sin(vertices[i] * 0.1) * Math.cos(vertices[i + 2] * 0.1) * 2;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        const terrain = new THREE.Mesh(geometry, material);
        terrain.rotation.x = -Math.PI / 2;
        terrain.receiveShadow = true;
        this.track.add(terrain);
        
        // Add dirt road
        const roadGeometry = new THREE.RingGeometry(15, 20, 32);
        const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.y = 0.1;
        road.receiveShadow = true;
        this.track.add(road);
        
        // Add natural elements
        this.createNaturalElements();
    }
    
    createDriftTrack(trackData) {
        // Specialized drift course
        const geometry = new THREE.PlaneGeometry(80, 80);
        const material = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const surface = new THREE.Mesh(geometry, material);
        surface.rotation.x = -Math.PI / 2;
        surface.receiveShadow = true;
        this.track.add(surface);
        
        // Create drift zones with special markings
        this.createDriftZones();
        
        // Add tire barriers
        this.createTireBarriers();
    }
    
    createTrackMarkings(innerRadius, outerRadius) {
        // Center line
        const lineGeometry = new THREE.RingGeometry(
            (innerRadius + outerRadius) / 2 - 0.1,
            (innerRadius + outerRadius) / 2 + 0.1,
            64
        );
        const lineMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
        centerLine.rotation.x = -Math.PI / 2;
        centerLine.position.y = 0.01;
        this.track.add(centerLine);
        
        // Start/finish line markers
        for (let i = 0; i < 8; i++) {
            const markerGeometry = new THREE.BoxGeometry(1, 0.1, 0.5);
            const markerMaterial = new THREE.MeshBasicMaterial({ 
                color: i % 2 === 0 ? 0xffffff : 0x000000 
            });
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.set(outerRadius - 2, 0.1, i - 4);
            this.track.add(marker);
        }
    }
    
    createSafetyBarriers(innerRadius, outerRadius) {
        // Outer barriers
        for (let i = 0; i < 128; i++) {
            const angle = (i / 128) * Math.PI * 2;
            const barrier = this.createBarrierSegment();
            barrier.position.set(
                Math.cos(angle) * (outerRadius + 2),
                1,
                Math.sin(angle) * (outerRadius + 2)
            );
            barrier.rotation.y = angle + Math.PI / 2;
            this.track.add(barrier);
        }
        
        // Inner barriers
        for (let i = 0; i < 64; i++) {
            const angle = (i / 64) * Math.PI * 2;
            const barrier = this.createBarrierSegment();
            barrier.position.set(
                Math.cos(angle) * (innerRadius - 2),
                1,
                Math.sin(angle) * (innerRadius - 2)
            );
            barrier.rotation.y = angle - Math.PI / 2;
            this.track.add(barrier);
        }
    }
    
    createBarrierSegment() {
        const geometry = new THREE.BoxGeometry(3, 2, 0.5);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        const barrier = new THREE.Mesh(geometry, material);
        barrier.castShadow = true;
        return barrier;
    }
    
    createGrandstands() {
        // Multiple grandstand sections
        const positions = [
            { x: 45, z: 0, rotation: Math.PI },
            { x: -45, z: 0, rotation: 0 },
            { x: 0, z: 45, rotation: -Math.PI / 2 },
            { x: 0, z: -45, rotation: Math.PI / 2 }
        ];
        
        positions.forEach(pos => {
            const grandstand = this.createGrandstandSection();
            grandstand.position.set(pos.x, 0, pos.z);
            grandstand.rotation.y = pos.rotation;
            this.track.add(grandstand);
        });
    }
    
    createGrandstandSection() {
        const grandstand = new THREE.Group();
        
        // Main structure
        const structureGeometry = new THREE.BoxGeometry(20, 10, 8);
        const structureMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const structure = new THREE.Mesh(structureGeometry, structureMaterial);
        structure.position.y = 5;
        structure.castShadow = true;
        grandstand.add(structure);
        
        // Seating tiers
        for (let tier = 0; tier < 5; tier++) {
            const seatGeometry = new THREE.BoxGeometry(18, 1, 1.5);
            const seatMaterial = new THREE.MeshLambertMaterial({ 
                color: new THREE.Color().setHSL(0.6, 0.5, 0.3 + tier * 0.1)
            });
            const seats = new THREE.Mesh(seatGeometry, seatMaterial);
            seats.position.set(0, 1 + tier * 1.5, -3 + tier * 0.8);
            grandstand.add(seats);
        }
        
        return grandstand;
    }
    
    createStartFinishLine(radius) {
        // Finish line structure
        const geometry = new THREE.BoxGeometry(8, 0.2, 1);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });
        
        // Checkered pattern
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const checkSize = 8;
        for (let x = 0; x < canvas.width; x += checkSize) {
            for (let y = 0; y < canvas.height; y += checkSize) {
                ctx.fillStyle = ((x / checkSize) + (y / checkSize)) % 2 ? '#ffffff' : '#000000';
                ctx.fillRect(x, y, checkSize, checkSize);
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        const checkeredMaterial = new THREE.MeshBasicMaterial({ map: texture });
        
        const finishLine = new THREE.Mesh(geometry, checkeredMaterial);
        finishLine.position.set(radius, 0.1, 0);
        finishLine.rotation.x = -Math.PI / 2;
        finishLine.rotation.z = Math.PI / 2;
        
        this.track.add(finishLine);
        
        // Start line tower
        const towerGeometry = new THREE.BoxGeometry(2, 8, 2);
        const towerMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(radius + 10, 4, 0);
        tower.castShadow = true;
        this.track.add(tower);
    }
    
    createStreetElements() {
        // Add street lights
        for (let i = 0; i < 8; i++) {
            const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 6);
            const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            
            const lightGeometry = new THREE.SphereGeometry(0.5, 8, 8);
            const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa });
            const light = new THREE.Mesh(lightGeometry, lightMaterial);
            light.position.y = 3;
            
            const streetLight = new THREE.Group();
            streetLight.add(pole);
            streetLight.add(light);
            
            streetLight.position.set(
                Math.random() * 60 - 30,
                3,
                Math.random() * 60 - 30
            );
            
            this.track.add(streetLight);
        }
        
        // Add building outlines
        for (let i = 0; i < 12; i++) {
            const buildingGeometry = new THREE.BoxGeometry(
                5 + Math.random() * 10,
                8 + Math.random() * 15,
                5 + Math.random() * 8
            );
            const buildingMaterial = new THREE.MeshLambertMaterial({ 
                color: new THREE.Color().setHSL(0.6, 0.2, 0.3 + Math.random() * 0.4)
            });
            const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
            
            building.position.set(
                (Math.random() - 0.5) * 100,
                building.geometry.parameters.height / 2,
                (Math.random() - 0.5) * 100
            );
            building.castShadow = true;
            building.receiveShadow = true;
            
            this.track.add(building);
        }
    }
    
    createNaturalElements() {
        // Add rocks
        for (let i = 0; i < 15; i++) {
            const rockGeometry = new THREE.DodecahedronGeometry(1 + Math.random() * 2);
            const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            
            rock.position.set(
                (Math.random() - 0.5) * 80,
                rock.geometry.parameters.radius / 2,
                (Math.random() - 0.5) * 80
            );
            rock.castShadow = true;
            rock.receiveShadow = true;
            
            this.track.add(rock);
        }
        
        // Add bushes
        for (let i = 0; i < 20; i++) {
            const bushGeometry = new THREE.SphereGeometry(1 + Math.random(), 6, 6);
            const bushMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
            const bush = new THREE.Mesh(bushGeometry, bushMaterial);
            
            bush.position.set(
                (Math.random() - 0.5) * 90,
                bush.geometry.parameters.radius / 2,
                (Math.random() - 0.5) * 90
            );
            bush.castShadow = true;
            
            this.track.add(bush);
        }
    }
    
    createDriftZones() {
        // Create drift zone markings
        const zones = [
            { x: -20, z: -20, width: 15, height: 15 },
            { x: 20, z: 20, width: 12, height: 12 },
            { x: -25, z: 25, width: 10, height: 18 }
        ];
        
        zones.forEach(zone => {
            const zoneGeometry = new THREE.PlaneGeometry(zone.width, zone.height);
            const zoneMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff6600,
                transparent: true,
                opacity: 0.3
            });
            const driftZone = new THREE.Mesh(zoneGeometry, zoneMaterial);
            driftZone.rotation.x = -Math.PI / 2;
            driftZone.position.set(zone.x, 0.05, zone.z);
            
            this.track.add(driftZone);
        });
    }
    
    createTireBarriers() {
        // Create tire barriers around the drift track
        for (let i = 0; i < 24; i++) {
            const tireGeometry = new THREE.TorusGeometry(1, 0.3, 8, 16);
            const tireMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
            const tire = new THREE.Mesh(tireGeometry, tireMaterial);
            
            const angle = (i / 24) * Math.PI * 2;
            tire.position.set(
                Math.cos(angle) * 35,
                0.3,
                Math.sin(angle) * 35
            );
            tire.rotation.x = Math.PI / 2;
            tire.castShadow = true;
            
            this.track.add(tire);
        }
    }
    
    createCar(carData) {
        console.log('Creating car with data:', carData);
        
        const carGroup = new THREE.Group();
        
        // Car body
        const bodyGeometry = new THREE.BoxGeometry(4.5, 1.2, 2);
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: carData.color || '#ff0000',
            transparent: true,
            opacity: 0.9
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6;
        body.castShadow = true;
        carGroup.add(body);
        
        // Car roof/cabin
        const roofGeometry = new THREE.BoxGeometry(2.8, 1, 1.6);
        const roofMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x222222,
            transparent: true,
            opacity: 0.8
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(-0.3, 1.5, 0);
        roof.castShadow = true;
        carGroup.add(roof);
        
        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4);
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
        
        const wheelPositions = [
            { x: 1.5, z: 1.2 },   // Front right
            { x: 1.5, z: -1.2 },  // Front left
            { x: -1.5, z: 1.2 },  // Rear right
            { x: -1.5, z: -1.2 }  // Rear left
        ];
        
        carGroup.wheels = [];
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos.x, 0.6, pos.z);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            carGroup.add(wheel);
            carGroup.wheels.push(wheel);
        });
        
        // Headlights
        const headlightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const headlightMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffcc,
            transparent: true,
            opacity: 0.8
        });
        
        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(2.3, 0.8, 0.8);
        carGroup.add(leftHeadlight);
        
        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.position.set(2.3, 0.8, -0.8);
        carGroup.add(rightHeadlight);
        
        // Exhaust effects (will be animated during gameplay)
        const exhaustGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const exhaustMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x666666,
            transparent: true,
            opacity: 0.6
        });
        
        const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        exhaust.position.set(-2.5, 0.5, 0);
        carGroup.add(exhaust);
        carGroup.exhaust = exhaust;
        
        console.log('Car created successfully, children:', carGroup.children.length);
        return carGroup;
    }
    
    updateCamera(playerCar, deltaTime) {
        if (!playerCar || !this.camera) return;
        
        const smoothing = this.cameraSettings.smoothing;
        
        switch (this.cameraSettings.mode) {
            case 'chase':
                this.updateChaseCamera(playerCar, deltaTime, smoothing);
                break;
            case 'cockpit':
                this.updateCockpitCamera(playerCar, deltaTime, smoothing);
                break;
            case 'overhead':
                this.updateOverheadCamera(playerCar, deltaTime, smoothing);
                break;
        }
    }
    
    updateChaseCamera(playerCar, deltaTime, smoothing) {
        const idealPosition = new THREE.Vector3();
        const idealLookAt = new THREE.Vector3();
        
        // Calculate ideal camera position behind the car
        const carDirection = new THREE.Vector3(0, 0, 1);
        carDirection.applyQuaternion(playerCar.quaternion);
        
        idealPosition.copy(playerCar.position);
        idealPosition.add(carDirection.multiplyScalar(-this.cameraSettings.distance));
        idealPosition.y += this.cameraSettings.height;
        
        // Look ahead of the car
        idealLookAt.copy(playerCar.position);
        idealLookAt.add(carDirection.multiplyScalar(10));
        
        // Smooth camera movement
        this.camera.position.lerp(idealPosition, smoothing);
        
        const currentLookAt = new THREE.Vector3();
        this.camera.getWorldDirection(currentLookAt);
        currentLookAt.multiplyScalar(100);
        currentLookAt.add(this.camera.position);
        currentLookAt.lerp(idealLookAt, smoothing);
        
        this.camera.lookAt(currentLookAt);
    }
    
    updateCockpitCamera(playerCar, deltaTime, smoothing) {
        const cockpitPosition = new THREE.Vector3(0, 1.5, 1);
        cockpitPosition.applyQuaternion(playerCar.quaternion);
        cockpitPosition.add(playerCar.position);
        
        this.camera.position.lerp(cockpitPosition, smoothing);
        this.camera.quaternion.slerp(playerCar.quaternion, smoothing);
    }
    
    updateOverheadCamera(playerCar, deltaTime, smoothing) {
        const overheadPosition = new THREE.Vector3();
        overheadPosition.copy(playerCar.position);
        overheadPosition.y += 50;
        
        this.camera.position.lerp(overheadPosition, smoothing);
        this.camera.lookAt(playerCar.position);
    }
    
    render(gameState, deltaTime) {
        if (!this.scene || !this.camera || !this.renderer) {
            console.warn('3D render called but components not ready:', {
                scene: !!this.scene,
                camera: !!this.camera,
                renderer: !!this.renderer
            });
            return;
        }
        
        // Log scene content for debugging
        if (gameState && gameState.debugFrame % 60 === 0) { // Every 60 frames
            console.log('3D Scene children:', this.scene.children.length);
            console.log('Cars in scene:', this.cars.length);
            console.log('Track in scene:', !!this.track);
            console.log('Camera position:', this.camera.position);
        }
        
        // Update animations
        this.updateAnimations(gameState, deltaTime);
        
        // Update lighting based on time of day
        this.updateLighting(gameState);
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
    
    updateAnimations(gameState, deltaTime) {
        // Animate car wheels
        if (this.cars.length > 0) {
            this.cars.forEach((car, index) => {
                if (car.wheels && gameState.players && gameState.players[index]) {
                    const player = gameState.players[index];
                    const wheelRotation = player.speed * deltaTime * 0.1;
                    
                    car.wheels.forEach(wheel => {
                        wheel.rotation.x += wheelRotation;
                    });
                    
                    // Exhaust effects based on speed
                    if (car.exhaust) {
                        const exhaustIntensity = Math.min(player.speed / 100, 1);
                        car.exhaust.scale.setScalar(0.5 + exhaustIntensity * 0.5);
                        car.exhaust.material.opacity = 0.3 + exhaustIntensity * 0.3;
                    }
                }
            });
        }
    }
    
    updateLighting(gameState) {
        // Dynamic lighting based on race conditions
        if (gameState.weather) {
            switch (gameState.weather) {
                case 'night':
                    this.lights.ambient.intensity = 0.2;
                    this.lights.sun.intensity = 0.3;
                    this.scene.fog.color.setHex(0x001122);
                    break;
                case 'rain':
                    this.lights.ambient.intensity = 0.4;
                    this.lights.sun.intensity = 0.6;
                    this.scene.fog.color.setHex(0x666666);
                    break;
                default:
                    this.lights.ambient.intensity = 0.6;
                    this.lights.sun.intensity = 1.2;
                    this.scene.fog.color.setHex(0x87CEEB);
            }
        }
    }
    
    setCameraMode(mode) {
        this.cameraSettings.mode = mode;
    }
    
    setQuality(quality) {
        this.quality = { ...this.quality, ...quality };
        // Apply quality changes
        this.renderer.shadowMap.enabled = this.quality.shadows;
    }
    
    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Dispose of geometries and materials
        this.scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }
}

// Make Graphics3D available globally
window.Graphics3D = Graphics3D;
