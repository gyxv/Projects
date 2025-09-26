class CrosswordCube3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.cube = null;
        this.letters = [];
        this.words = [];
        this.foundWords = new Set();
        this.selectedLetters = [];
        this.cubeSize = 0;
        this.letterObjects = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.autoRotate = false;
        this.showWireframe = false;
        
        this.init();
        this.setupEventListeners();
    }

    init() {
        // Check if Three.js is loaded
        if (typeof THREE === 'undefined') {
            console.error('Three.js not loaded!');
            alert('Error: Three.js not loaded. Please refresh the page.');
            return;
        }

        console.log('Initializing 3D Crossword Cube...');
        this.setupScene();
        this.setupControls();
        this.setupLighting();

        // Check for OrbitControls after a short delay
        setTimeout(() => {
            if (typeof THREE.OrbitControls === 'undefined') {
                console.warn('OrbitControls not yet available, waiting...');
                this.waitForOrbitControls();
            } else {
                console.log('OrbitControls available, proceeding...');
                this.finalizeInit();
            }
        }, 100);
    }

    waitForOrbitControls() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds at 100ms intervals

        const checkControls = () => {
            attempts++;
            if (typeof THREE.OrbitControls !== 'undefined') {
                console.log('OrbitControls loaded after delay!');
                this.finalizeInit();
            } else if (attempts < maxAttempts) {
                setTimeout(checkControls, 100);
            } else {
                console.error('OrbitControls failed to load after multiple attempts');
                alert('Error: 3D controls failed to load. Please refresh the page.');
            }
        };

        checkControls();
    }

    finalizeInit() {
        this.setupOrbitControls();
        console.log('3D Crossword Cube initialized successfully!');
    }

    setupOrbitControls() {
        // OrbitControls - should be available now
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.enableRotate = true;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 50;
        
        console.log('OrbitControls initialized with standard settings');
    }

    setupScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(10, 10, 10);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        // Don't initialize OrbitControls here - it's handled in finalizeInit()
        console.log('Scene setup complete');
    }

    setupControls() {
        // Resize handler
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Simple click handler for letter selection
        this.renderer.domElement.addEventListener('click', (event) => {
            // Small delay to ensure OrbitControls has processed the event
            setTimeout(() => {
                this.onMouseClick(event);
            }, 10);
        });

        // Mouse move for hover effects
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            this.onMouseMove(event);
        });
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Point light for interior
        const pointLight = new THREE.PointLight(0x4fc3f7, 0.5, 30);
        pointLight.position.set(0, 0, 0);
        this.scene.add(pointLight);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async generateCube(inputWords, manualSize = null) {
        this.showLoading();
        this.updateLoadingProgress(0, 'Processing words...');
        
        // Process words
        this.words = inputWords.map(word => word.toUpperCase()).filter(word => word.length > 1);
        if (this.words.length === 0) {
            alert('Please enter at least one word with more than 1 character.');
            this.hideLoading();
            return;
        }

        console.log('Processing words:', this.words);
        this.updateLoadingProgress(10, `Processing ${this.words.length} words...`);
        await this.sleep(200);

        // Determine cube size
        const maxWordLength = Math.max(...this.words.map(word => word.length));
        this.cubeSize = manualSize || Math.max(5, Math.min(15, maxWordLength + 2));
        console.log('Cube size:', this.cubeSize);
        
        this.updateLoadingProgress(20, `Creating ${this.cubeSize}x${this.cubeSize}x${this.cubeSize} cube...`);
        await this.sleep(200);

        // Initialize cube
        this.cube = this.create3DArray(this.cubeSize, this.cubeSize, this.cubeSize, null);
        this.foundWords = new Set();
        this.selectedLetters = [];

        this.updateLoadingProgress(30, 'Clearing previous cube...');
        await this.sleep(100);

        // Clear existing cube
        this.clearCube();

        this.updateLoadingProgress(50, 'Placing words in 3D space...');
        await this.sleep(200);

        // Place words in cube
        this.placeWords();

        this.updateLoadingProgress(70, 'Filling empty spaces...');
        await this.sleep(200);

        // Fill empty spaces with random letters
        this.fillEmptySpaces();

        this.updateLoadingProgress(85, 'Rendering 3D cube...');
        await this.sleep(200);

        // Render the cube
        this.renderCube();

        this.updateLoadingProgress(95, 'Finalizing...');
        await this.sleep(200);

        // Update UI
        this.updateWordList();
        this.updateScore();

        this.updateLoadingProgress(100, 'Complete!');
        await this.sleep(300);
        
        this.hideLoading();
        console.log('About to hide word input panel...');
        
        // Hide word input panel with a slight delay to ensure loading screen is gone
        setTimeout(() => {
            console.log('Calling hideWordInputPanel...');
            this.hideWordInputPanel();
            console.log('Word input panel should be hidden now');
            
            // Reset camera position to properly view the cube
            console.log('Resetting camera position to view cube...');
            this.resetCameraToViewCube();
            
            // Force a debug check after everything is set up
            setTimeout(() => {
                this.debugCubeVisibility();
            }, 200);
            
        }, 100);
        
        console.log('Cube generation complete!');
    }

    create3DArray(x, y, z, defaultValue) {
        const array = [];
        for (let i = 0; i < x; i++) {
            array[i] = [];
            for (let j = 0; j < y; j++) {
                array[i][j] = [];
                for (let k = 0; k < z; k++) {
                    array[i][j][k] = defaultValue;
                }
            }
        }
        return array;
    }

    placeWords() {
        // Define all possible directions (26 total: 3D directions)
        const directions = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    if (dx !== 0 || dy !== 0 || dz !== 0) {
                        directions.push([dx, dy, dz]);
                    }
                }
            }
        }

        const placedWords = [];
        const maxAttempts = 100;

        for (const word of this.words) {
            let placed = false;
            let attempts = 0;

            while (!placed && attempts < maxAttempts) {
                // Random starting position
                const startX = Math.floor(Math.random() * this.cubeSize);
                const startY = Math.floor(Math.random() * this.cubeSize);
                const startZ = Math.floor(Math.random() * this.cubeSize);

                // Random direction
                const direction = directions[Math.floor(Math.random() * directions.length)];
                const [dx, dy, dz] = direction;

                // Check if word fits
                const positions = [];
                let fits = true;

                for (let i = 0; i < word.length; i++) {
                    const x = startX + dx * i;
                    const y = startY + dy * i;
                    const z = startZ + dz * i;

                    if (x < 0 || x >= this.cubeSize || 
                        y < 0 || y >= this.cubeSize || 
                        z < 0 || z >= this.cubeSize) {
                        fits = false;
                        break;
                    }

                    positions.push([x, y, z]);
                }

                if (fits) {
                    // Check for conflicts
                    let hasConflict = false;
                    for (let i = 0; i < word.length; i++) {
                        const [x, y, z] = positions[i];
                        const existingLetter = this.cube[x][y][z];
                        if (existingLetter !== null && existingLetter !== word[i]) {
                            hasConflict = true;
                            break;
                        }
                    }

                    if (!hasConflict) {
                        // Place the word
                        for (let i = 0; i < word.length; i++) {
                            const [x, y, z] = positions[i];
                            this.cube[x][y][z] = word[i];
                        }
                        
                        placedWords.push({
                            word: word,
                            positions: positions,
                            direction: direction
                        });
                        placed = true;
                    }
                }

                attempts++;
            }

            if (!placed) {
                console.warn(`Could not place word: ${word}`);
            }
        }

        console.log(`Placed ${placedWords.length} out of ${this.words.length} words`);
    }

    fillEmptySpaces() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        for (let x = 0; x < this.cubeSize; x++) {
            for (let y = 0; y < this.cubeSize; y++) {
                for (let z = 0; z < this.cubeSize; z++) {
                    if (this.cube[x][y][z] === null) {
                        this.cube[x][y][z] = letters[Math.floor(Math.random() * letters.length)];
                    }
                }
            }
        }
        console.log('Filled empty spaces with random letters');
    }

    renderCube() {
        console.log('Starting cube rendering...');
        this.clearCube();
        this.letterObjects = [];

        const letterSize = 0.8;
        const spacing = 1;
        const offset = (this.cubeSize - 1) * spacing / 2;

        console.log(`Rendering cube: size=${this.cubeSize}, offset=${offset}`);

        // Create cube framework
        this.createCubeFramework(offset, spacing);

        // Create letters - but only on the surface for better visibility
        let letterCount = 0;
        for (let x = 0; x < this.cubeSize; x++) {
            for (let y = 0; y < this.cubeSize; y++) {
                for (let z = 0; z < this.cubeSize; z++) {
                    // Only render letters on the surface (faces) of the cube for better visibility
                    const isOnSurface = x === 0 || x === this.cubeSize - 1 || 
                                       y === 0 || y === this.cubeSize - 1 || 
                                       z === 0 || z === this.cubeSize - 1;
                    
                    if (isOnSurface) {
                        const letter = this.cube[x][y][z];
                        if (letter) {
                            const letterMesh = this.createLetterMesh(
                                letter,
                                x * spacing - offset,
                                y * spacing - offset,
                                z * spacing - offset,
                                letterSize
                            );
                            
                            letterMesh.userData = {
                                letter: letter,
                                position: [x, y, z],
                                cubeCoords: [x, y, z]
                            };

                            this.letterObjects.push(letterMesh);
                            this.scene.add(letterMesh);
                            letterCount++;
                        }
                    }
                }
            }
        }
        
        console.log(`Rendered ${letterCount} letter objects on cube surface`);
    }

    resetCameraToViewCube() {
        if (this.controls && this.camera) {
            const distance = this.cubeSize * 2;
            this.camera.position.set(distance, distance, distance);
            this.camera.lookAt(0, 0, 0);
            this.controls.target.set(0, 0, 0);
            this.controls.update();
            console.log(`Camera positioned at distance ${distance} to view cube size ${this.cubeSize}`);
        }
    }

    createCubeFramework(offset, spacing) {
        const size = this.cubeSize - 1;
        const wireframeGeometry = new THREE.BoxGeometry(
            size * spacing, 
            size * spacing, 
            size * spacing
        );
        
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x4fc3f7,
            wireframe: true,
            transparent: true,
            opacity: 0.2
        });
        
        const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        wireframeMesh.name = 'wireframe';
        this.scene.add(wireframeMesh);

        // Add face planes for better visualization
        this.createFacePlanes(offset, spacing);
    }

    createFacePlanes(offset, spacing) {
        const size = (this.cubeSize - 1) * spacing;
        const planeGeometry = new THREE.PlaneGeometry(size, size);
        const planeMaterial = new THREE.MeshBasicMaterial({
            color: 0x4fc3f7,
            transparent: true,
            opacity: 0.05,
            side: THREE.DoubleSide
        });

        // Six faces of the cube
        const faces = [
            { pos: [0, 0, size/2], rot: [0, 0, 0] },      // Front
            { pos: [0, 0, -size/2], rot: [0, Math.PI, 0] }, // Back
            { pos: [size/2, 0, 0], rot: [0, Math.PI/2, 0] }, // Right
            { pos: [-size/2, 0, 0], rot: [0, -Math.PI/2, 0] }, // Left
            { pos: [0, size/2, 0], rot: [-Math.PI/2, 0, 0] }, // Top
            { pos: [0, -size/2, 0], rot: [Math.PI/2, 0, 0] }  // Bottom
        ];

        faces.forEach((face, index) => {
            const plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.position.set(...face.pos);
            plane.rotation.set(...face.rot);
            plane.name = `face-${index}`;
            plane.userData.isFace = true;
            this.scene.add(plane);
        });
    }

    createLetterMesh(letter, x, y, z, size) {
        // Create text geometry
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 128;
        
        // White background
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Black text
        context.fillStyle = '#000000';
        context.font = 'bold 80px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(letter, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        
        // Create cube with letter texture
        const geometry = new THREE.BoxGeometry(size, size, size);
        const materials = [
            new THREE.MeshLambertMaterial({ map: texture, color: 0xffffff }), // Right
            new THREE.MeshLambertMaterial({ map: texture, color: 0xffffff }), // Left
            new THREE.MeshLambertMaterial({ map: texture, color: 0xffffff }), // Top
            new THREE.MeshLambertMaterial({ map: texture, color: 0xffffff }), // Bottom
            new THREE.MeshLambertMaterial({ map: texture, color: 0xffffff }), // Front
            new THREE.MeshLambertMaterial({ map: texture, color: 0xffffff })  // Back
        ];
        
        const letterMesh = new THREE.Mesh(geometry, materials);
        letterMesh.position.set(x, y, z);
        letterMesh.castShadow = true;
        letterMesh.receiveShadow = true;
        
        // Add some debugging info
        console.log(`Created letter ${letter} at position (${x}, ${y}, ${z})`);
        
        return letterMesh;
    }

    clearCube() {
        // Remove existing letter objects
        this.letterObjects.forEach(obj => {
            this.scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => mat.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
        this.letterObjects = [];

        // Remove wireframe and faces
        const objectsToRemove = [];
        this.scene.traverse(child => {
            if (child.name && (child.name.startsWith('wireframe') || child.name.startsWith('face-'))) {
                objectsToRemove.push(child);
            }
        });
        objectsToRemove.forEach(obj => this.scene.remove(obj));
    }

    onMouseMove(event) {
        if (!this.letterObjects.length) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.letterObjects);

        // Reset all letters to normal color
        this.letterObjects.forEach(obj => {
            obj.material.forEach(mat => {
                mat.emissive.setHex(0x000000);
            });
        });

        // Highlight hovered letter
        if (intersects.length > 0) {
            const hoveredObject = intersects[0].object;
            hoveredObject.material.forEach(mat => {
                mat.emissive.setHex(0x444444);
            });
            this.renderer.domElement.style.cursor = 'pointer';
        } else {
            this.renderer.domElement.style.cursor = 'default';
        }

        // Highlight selected letters
        this.selectedLetters.forEach(letterObj => {
            letterObj.material.forEach(mat => {
                mat.emissive.setHex(0x4fc3f7);
            });
        });
    }

    onMouseClick(event) {
        if (!this.letterObjects.length) return;

        // Calculate mouse position for raycasting
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObjects(this.letterObjects);

        if (intersects.length > 0) {
            const selectedObject = intersects[0].object;
            this.selectLetter(selectedObject);
            console.log('Letter clicked:', selectedObject.userData.letter);
        }
    }

    selectLetter(letterObj) {
        const index = this.selectedLetters.findIndex(obj => obj === letterObj);
        
        if (index > -1) {
            // Deselect letter
            this.selectedLetters.splice(index, 1);
            letterObj.material.forEach(mat => {
                mat.emissive.setHex(0x000000);
            });
            console.log('Deselected letter:', letterObj.userData.letter);
        } else {
            // Select letter
            this.selectedLetters.push(letterObj);
            letterObj.material.forEach(mat => {
                mat.emissive.setHex(0x4fc3f7);
            });
            console.log('Selected letter:', letterObj.userData.letter);
        }

        this.updateSelectionInfo();
        this.checkSelectedWord();
    }

    // Zoom methods for W/S keys
    zoomIn() {
        const direction = new THREE.Vector3();
        direction.subVectors(this.controls.target, this.camera.position).normalize();
        const distance = this.camera.position.distanceTo(this.controls.target);
        
        if (distance > this.controls.minDistance) {
            direction.multiplyScalar(distance * 0.1);
            this.camera.position.add(direction);
            console.log('Zoomed in');
        }
    }

    zoomOut() {
        const direction = new THREE.Vector3();
        direction.subVectors(this.camera.position, this.controls.target).normalize();
        const distance = this.camera.position.distanceTo(this.controls.target);
        
        if (distance < this.controls.maxDistance) {
            direction.multiplyScalar(distance * 0.1);
            this.camera.position.add(direction);
            console.log('Zoomed out');
        }
    }

    updateSelectionInfo() {
        const selectionInfo = document.getElementById('selection-info');
        if (this.selectedLetters.length === 0) {
            selectionInfo.textContent = 'Click letters to select words';
        } else {
            const selectedWord = this.selectedLetters.map(obj => obj.userData.letter).join('');
            const positions = this.selectedLetters.map(obj => 
                `(${obj.userData.cubeCoords.join(', ')})`
            ).join(' → ');
            selectionInfo.innerHTML = `
                <strong>Selected:</strong> ${selectedWord}<br>
                <small>Positions: ${positions}</small>
            `;
        }
    }

    checkSelectedWord() {
        if (this.selectedLetters.length < 2) return;

        const selectedWord = this.selectedLetters.map(obj => obj.userData.letter).join('');
        const reverseWord = selectedWord.split('').reverse().join('');

        // Check if selected word matches any target word
        const matchedWord = this.words.find(word => 
            word === selectedWord || word === reverseWord
        );

        if (matchedWord && !this.foundWords.has(matchedWord)) {
            this.foundWords.add(matchedWord);
            this.animateFoundWord();
            this.updateScore();
            this.updateWordList();
            
            // Keep letters selected with different color
            this.selectedLetters.forEach(letterObj => {
                letterObj.material.forEach(mat => {
                    mat.emissive.setHex(0x4CAF50); // Green for found words
                });
            });

            setTimeout(() => {
                this.selectedLetters = [];
                this.updateSelectionInfo();
            }, 1000);
        }
    }

    animateFoundWord() {
        // Animate selected letters with native JavaScript
        this.selectedLetters.forEach((letterObj, index) => {
            setTimeout(() => {
                const originalScale = { x: letterObj.scale.x, y: letterObj.scale.y, z: letterObj.scale.z };
                
                // Scale up animation
                const animateUp = () => {
                    let progress = 0;
                    const duration = 300;
                    const startTime = Date.now();
                    
                    const animate = () => {
                        const elapsed = Date.now() - startTime;
                        progress = Math.min(elapsed / duration, 1);
                        
                        // Easing function (back ease out)
                        const easeProgress = this.easeBackOut(progress);
                        
                        letterObj.scale.set(
                            originalScale.x + (0.5 * easeProgress),
                            originalScale.y + (0.5 * easeProgress),
                            originalScale.z + (0.5 * easeProgress)
                        );
                        
                        if (progress < 1) {
                            requestAnimationFrame(animate);
                        } else {
                            // Scale down animation
                            animateDown();
                        }
                    };
                    animate();
                };
                
                const animateDown = () => {
                    let progress = 0;
                    const duration = 300;
                    const startTime = Date.now();
                    
                    const animate = () => {
                        const elapsed = Date.now() - startTime;
                        progress = Math.min(elapsed / duration, 1);
                        
                        const easeProgress = this.easeBackIn(progress);
                        
                        letterObj.scale.set(
                            originalScale.x + 0.5 - (0.5 * easeProgress),
                            originalScale.y + 0.5 - (0.5 * easeProgress),
                            originalScale.z + 0.5 - (0.5 * easeProgress)
                        );
                        
                        if (progress >= 1) {
                            letterObj.scale.set(originalScale.x, originalScale.y, originalScale.z);
                        } else {
                            requestAnimationFrame(animate);
                        }
                    };
                    animate();
                };
                
                animateUp();
            }, index * 100);
        });
    }

    easeBackOut(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    easeBackIn(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
    }

    updateScore() {
        const score = this.foundWords.size * 100;
        const progress = this.words.length > 0 ? (this.foundWords.size / this.words.length) * 100 : 0;
        
        document.getElementById('score').textContent = score;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        document.getElementById('progress-text').textContent = 
            `${this.foundWords.size} / ${this.words.length} words found`;

        // Check if all words found
        if (this.foundWords.size === this.words.length && this.words.length > 0) {
            setTimeout(() => {
                alert('🎉 Congratulations! You found all the words!');
            }, 500);
        }
    }

    updateWordList() {
        const wordList = document.getElementById('word-list');
        
        if (this.words.length === 0) {
            wordList.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.5);">Enter words above to start</div>';
            return;
        }

        wordList.innerHTML = this.words.map(word => {
            const found = this.foundWords.has(word);
            return `
                <div class="word-item ${found ? 'found' : 'not-found'}">
                    <span>${word}</span>
                    <span>${found ? '✓' : '○'}</span>
                </div>
            `;
        }).join('');
    }

    setupEventListeners() {
        // Generate cube button
        document.getElementById('generate-cube').addEventListener('click', async () => {
            const input = document.getElementById('word-input').value.trim();
            const sizeInput = document.getElementById('cube-size').value;
            const manualSize = sizeInput ? parseInt(sizeInput) : null;
            
            if (!input) {
                alert('Please enter some words first!');
                document.getElementById('word-input').focus();
                return;
            }

            const words = input.split(/[,\n]+/).map(w => w.trim()).filter(w => w.length > 0);
            
            if (words.length === 0) {
                alert('Please enter valid words separated by commas or new lines!');
                document.getElementById('word-input').focus();
                return;
            }

            console.log('Starting cube generation with words:', words);
            try {
                await this.generateCube(words, manualSize);
            } catch (error) {
                console.error('Error generating cube:', error);
                alert('Error generating cube. Check console for details.');
                this.hideLoading();
            }
        });

        // Control buttons
        document.getElementById('reset-view').addEventListener('click', () => {
            this.resetView();
        });

        document.getElementById('auto-rotate').addEventListener('click', (e) => {
            if (!this.controls) {
                alert('Please generate a cube first!');
                return;
            }

            this.autoRotate = !this.autoRotate;
            this.controls.autoRotate = this.autoRotate;
            e.target.textContent = this.autoRotate ? 'Stop Rotate' : 'Auto Rotate';
            e.target.style.background = this.autoRotate ?
                'linear-gradient(45deg, #f44336, #d32f2f)' :
                'linear-gradient(45deg, #4fc3f7, #29b6f6)';
        });

        document.getElementById('show-wireframe').addEventListener('click', (e) => {
            if (!this.letterObjects || this.letterObjects.length === 0) {
                alert('Please generate a cube first!');
                return;
            }

            this.toggleWireframe();
            e.target.textContent = this.showWireframe ? 'Hide Wireframe' : 'Show Wireframe';
        });

        document.getElementById('regenerate-cube').addEventListener('click', () => {
            if (this.words.length > 0) {
                this.generateCube(this.words);
            } else {
                alert('Please generate a cube first!');
            }
        });

        // New Puzzle button - shows the word input panel
        document.getElementById('new-puzzle').addEventListener('click', () => {
            this.showWordInputPanel();
        });

        // Cancel button - hides the word input panel
        document.getElementById('cancel-puzzle').addEventListener('click', () => {
            this.hideWordInputPanel();
        });

        // Debug button - shows cube visibility info
        document.getElementById('debug-cube').addEventListener('click', () => {
            this.debugCubeVisibility();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            switch(event.key.toLowerCase()) {
                case 'r':
                    this.resetView();
                    break;
                case 'w':
                    this.zoomIn();
                    break;
                case 's':
                    this.zoomOut();
                    break;
                case 'escape':
                    this.selectedLetters = [];
                    this.updateSelectionInfo();
                    this.letterObjects.forEach(obj => {
                        obj.material.forEach(mat => {
                            mat.emissive.setHex(0x000000);
                        });
                    });
                    break;
            }
        });
    }

    resetView() {
        if (!this.controls) {
            alert('Please generate a cube first!');
            return;
        }

        this.resetCameraToViewCube();
    }

    toggleWireframe() {
        this.showWireframe = !this.showWireframe;
        
        this.scene.traverse(child => {
            if (child.name && child.name.startsWith('wireframe')) {
                child.material.opacity = this.showWireframe ? 0.5 : 0.2;
            }
            if (child.name && child.name.startsWith('face-')) {
                child.material.opacity = this.showWireframe ? 0.1 : 0.05;
            }
        });
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
        this.updateLoadingProgress(0, 'Starting...');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    updateLoadingProgress(percent, message) {
        document.getElementById('progress-bar-fill').style.width = percent + '%';
        document.getElementById('progress-text-loading').textContent = message;
        document.getElementById('loading-text').textContent = `Generating 3D Crossword Cube... ${Math.round(percent)}%`;
    }

    showWordInputPanel() {
        const panel = document.getElementById('word-input-panel');
        if (panel) {
            panel.style.display = 'block';
            panel.style.visibility = 'visible';
            panel.style.zIndex = '2000';
            
            // Clear the textarea for new input
            const wordInput = document.getElementById('word-input');
            const cubeSize = document.getElementById('cube-size');
            if (wordInput) wordInput.value = '';
            if (cubeSize) cubeSize.value = '';
            
            console.log('Word input panel shown successfully');
            
            // Force focus on the textarea
            setTimeout(() => {
                if (wordInput) wordInput.focus();
            }, 100);
        } else {
            console.error('Word input panel not found when trying to show!');
        }
    }

    hideWordInputPanel() {
        const panel = document.getElementById('word-input-panel');
        if (panel) {
            panel.style.display = 'none';
            panel.style.visibility = 'hidden';
            console.log('Word input panel hidden - display: none, visibility: hidden');
            
            // Additional check to make sure it's really hidden
            setTimeout(() => {
                if (panel.style.display !== 'none') {
                    console.error('Panel still visible after hide attempt!');
                    panel.style.display = 'none !important';
                    panel.style.visibility = 'hidden !important';
                }
            }, 50);
        } else {
            console.error('Word input panel not found when trying to hide!');
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.controls) {
            this.controls.update();
        }
        
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    // Debug method to check if cube is visible
    debugCubeVisibility() {
        console.log('=== CUBE VISIBILITY DEBUG ===');
        console.log('Scene children count:', this.scene.children.length);
        console.log('Letter objects count:', this.letterObjects.length);
        console.log('Camera position:', this.camera.position);
        console.log('Controls target:', this.controls ? this.controls.target : 'No controls');
        console.log('Renderer size:', this.renderer.getSize(new THREE.Vector2()));
        
        // Check if any letter objects are in the scene
        let lettersInScene = 0;
        this.scene.traverse((child) => {
            if (child.userData && child.userData.letter) {
                lettersInScene++;
            }
        });
        console.log('Letters found in scene:', lettersInScene);
        
        // Force a render
        this.renderer.render(this.scene, this.camera);
        console.log('=== END DEBUG ===');
    }
}

// Initialize the application
let crosswordCube;

document.addEventListener('DOMContentLoaded', () => {
    crosswordCube = new CrosswordCube3D();
    crosswordCube.animate();
    
    // Initialize with example words but don't generate automatically
    const exampleWords = ['HELLO', 'WORLD', 'CUBE', 'PUZZLE', 'GAME', 'CODE', 'THREE', 'JAVASCRIPT'];
    crosswordCube.words = exampleWords;
    crosswordCube.updateWordList();
    
    console.log('3D Crossword Cube ready! Word input panel should be visible.');
    
    // Show welcome message
    document.getElementById('selection-info').innerHTML = 
        '<strong>Welcome!</strong><br>Enter your words in the panel and click "Generate Cube" to start!';
    
    // Show word input panel immediately on load
    crosswordCube.showWordInputPanel();
    
    // Additional check after a short delay
    setTimeout(() => {
        const panel = document.getElementById('word-input-panel');
        if (panel && panel.style.display !== 'block') {
            console.log('Forcing word input panel to show');
            crosswordCube.showWordInputPanel();
        }
    }, 100);
});

// For debugging in console
window.crosswordCube = crosswordCube;
