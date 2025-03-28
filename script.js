import { config } from 'config';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const danceFloor = document.getElementById('dance-floor');
const musicInput = document.getElementById('music-input');
const characterSelect = document.getElementById('character-select');
const scene3D = document.getElementById('scene3D');
let audioContext;
let analyser;
let source;
let dataArray;
let animationFrameId;

// Three.js variables
let scene, camera, renderer, mixer, character, clock;
let danceAnimations = [];
let currentAnimationIndex = 0;
let isCharacterLoaded = false;

// --- Create Dance Floor Grid ---
function createGrid() {
    danceFloor.innerHTML = ''; // Clear previous grid
    danceFloor.style.setProperty('--grid-cols', config.gridSize);
    danceFloor.style.setProperty('--grid-rows', config.gridSize);

    for (let i = 0; i < config.gridSize * config.gridSize; i++) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.dataset.index = i;
        danceFloor.appendChild(tile);
    }
}

// --- Audio Processing ---
function setupAudioContext(audioFile) {
    if (audioContext) {
        audioContext.close(); // Close existing context if any
    }
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = config.analysisBufferSize;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    const reader = new FileReader();

    reader.onload = (e) => {
        audioContext.decodeAudioData(e.target.result, (buffer) => {
            if (source) {
                source.stop();
                source.disconnect();
            }
            source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            source.start(0);
            startAnimation();
            // Stop animation when music ends
            source.onended = () => {
                stopAnimation();
                clearLights();
            };
        });
    };
    reader.readAsArrayBuffer(audioFile);
}

// --- Animation Loop ---
function startAnimation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    clock = new THREE.Clock();
    animationLoop();
}

function stopAnimation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    clearLights(); // Turn off lights when stopping
}

function animationLoop() {
    analyser.getByteFrequencyData(dataArray);

    // Simple beat detection (average volume)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    let average = sum / dataArray.length;

    // Normalize average (0-1 range roughly)
    let normalizedAverage = average / 128.0; // Values in dataArray are 0-255

    if (normalizedAverage > config.beatDetectionThreshold) {
        lightUpAllTiles(); // Light up the entire floor
        if (isCharacterLoaded) {
            // Change dance animation on beat
            changeCharacterAnimation();
        }
    } else {
        clearLights(); // Turn off all lights if below threshold
    }

    // Update character animation
    if (mixer) {
        mixer.update(clock.getDelta());
    }
    
    // Render the 3D scene
    if (renderer) {
        renderer.render(scene, camera);
    }

    animationFrameId = requestAnimationFrame(animationLoop);
}

// Change character animation randomly
function changeCharacterAnimation() {
    if (danceAnimations.length > 0) {
        // Stop current animation
        danceAnimations[currentAnimationIndex].weight = 0;
        
        // Start a new random animation
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * danceAnimations.length);
        } while (newIndex === currentAnimationIndex && danceAnimations.length > 1);
        
        currentAnimationIndex = newIndex;
        danceAnimations[currentAnimationIndex].weight = 1;
        danceAnimations[currentAnimationIndex].reset();
        
        // Ensure animation is playing
        if (!danceAnimations[currentAnimationIndex].isRunning()) {
            danceAnimations[currentAnimationIndex].play();
        }
    }
}

// --- Tile Lighting Logic ---
function lightUpAllTiles() {
    const tiles = danceFloor.querySelectorAll('.tile');
    tiles.forEach(tile => {
        const randomColor = config.lightColors[Math.floor(Math.random() * config.lightColors.length)];
        tile.style.backgroundColor = randomColor;
    });
}

function clearLights() {
    const tiles = danceFloor.querySelectorAll('.tile');
    tiles.forEach(tile => {
        tile.style.backgroundColor = '#333'; // Reset to default dark color
    });
}

// --- Setup 3D Scene ---
function setupScene() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, config.cameraHeight, config.cameraDistance);
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    scene3D.appendChild(renderer.domElement);
    
    // Create lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 10, 5);
    scene.add(directionalLight);
    
    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(10, 10);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Load character model
function loadCharacter(characterUrl) {
    if (character) {
        scene.remove(character);
    }
    
    danceAnimations = [];
    currentAnimationIndex = 0;
    isCharacterLoaded = false;
    
    const loader = new GLTFLoader();
    loader.load(
        characterUrl,
        (gltf) => {
            character = gltf.scene;
            
            // Properly size and position the character based on model type
            if (characterUrl.includes('RobotExpressive')) {
                character.scale.set(0.5, 0.5, 0.5);
                character.position.y = 0;
            } else if (characterUrl.includes('Soldier')) {
                character.scale.set(1.5, 1.5, 1.5);
                character.position.y = 0;
            } else if (characterUrl.includes('Parrot')) {
                character.scale.set(0.35, 0.35, 0.35);
                character.position.y = 1.5; // Float the parrot above the ground
            } else {
                // Default sizing
                character.scale.set(1, 1, 1);
                character.position.y = 0;
            }
            
            character.position.x = 0;
            character.position.z = 0;
            scene.add(character);
            
            // Setup character animations
            if (gltf.animations && gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(character);
                
                // For the Robot model which has named animations
                if (characterUrl.includes('RobotExpressive')) {
                    const danceClips = ['Dance', 'Running', 'Walking', 'Idle'];
                    
                    gltf.animations.forEach((clip) => {
                        if (danceClips.some(name => clip.name.includes(name))) {
                            const action = mixer.clipAction(clip);
                            action.weight = 0;
                            danceAnimations.push(action);
                        }
                    });
                } else {
                    // For other models, use all available animations
                    gltf.animations.forEach((clip) => {
                        const action = mixer.clipAction(clip);
                        action.weight = 0;
                        danceAnimations.push(action);
                    });
                }
                
                // Start with the first animation
                if (danceAnimations.length > 0) {
                    danceAnimations[0].weight = 1;
                    danceAnimations[0].play();
                }
                
                // Play all animations at the beginning
                danceAnimations.forEach(animation => animation.play());
            }
            
            isCharacterLoaded = true;
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        (error) => {
            console.error('An error occurred loading the character:', error);
        }
    );
}

// Populate character selection dropdown
function populateCharacterSelection() {
    config.characters.forEach(char => {
        const option = document.createElement('option');
        option.value = char.id;
        option.textContent = char.name;
        characterSelect.appendChild(option);
    });
}

// --- Event Listeners ---
musicInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        if (audioContext && audioContext.state === 'running') {
             stopAnimation(); // Stop current animation if running
         }
        setupAudioContext(file);
    }
});

characterSelect.addEventListener('change', (event) => {
    const selectedCharId = event.target.value;
    const selectedChar = config.characters.find(char => char.id === selectedCharId);
    if (selectedChar) {
        loadCharacter(selectedChar.url);
    }
});

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    createGrid(); // Create the grid on page load
    setupScene(); // Setup 3D scene
    populateCharacterSelection(); // Populate character dropdown
    
    // Load default character
    if (config.characters.length > 0) {
        loadCharacter(config.characters[0].url);
    }
});