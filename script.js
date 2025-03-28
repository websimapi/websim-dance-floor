import { config } from 'config';

const danceFloor = document.getElementById('dance-floor');
const musicInput = document.getElementById('music-input');
let audioContext;
let analyser;
let source;
let dataArray;
let animationFrameId;
let activeTiles = [];

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

    // Simple beat detection (average volume change)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    let average = sum / dataArray.length;

    // Normalize average (0-1 range roughly)
    let normalizedAverage = average / 128.0; // Values in dataArray are 0-255

    if (normalizedAverage > config.beatDetectionThreshold) {
        lightUpRandomTiles();
    } else {
        // Optionally dim lights slightly when no strong beat
         fadeLights();
    }


    animationFrameId = requestAnimationFrame(animationLoop);
}

// --- Tile Lighting Logic ---
function lightUpRandomTiles() {
    const tiles = danceFloor.querySelectorAll('.tile');
    const numTiles = tiles.length;

    // Turn off some older lights if max is reached
    while (activeTiles.length >= config.maxActiveLights) {
        const tileToRemove = activeTiles.shift(); // Remove the oldest tile
        if (tileToRemove) { // Check if tileToRemove exists
           tileToRemove.style.backgroundColor = '#333'; // Reset color
        }
    }


    // Light up new tiles based on probability
    for (let i = 0; i < numTiles; i++) {
         // Only consider lighting up if not already lit and below max count
        if (!activeTiles.includes(tiles[i]) && activeTiles.length < config.maxActiveLights) {
            if (Math.random() < config.lightUpProbability) {
                 const randomColor = config.lightColors[Math.floor(Math.random() * config.lightColors.length)];
                 tiles[i].style.backgroundColor = randomColor;
                 activeTiles.push(tiles[i]); // Add to active list
            }
        }
    }
}

// Optional: Fade lights slowly when beat is low
function fadeLights() {
    activeTiles = activeTiles.filter(tile => {
        // Example: Reduce brightness slightly or just turn off after a delay
        // For simplicity, let's just turn them off randomly over time
        if (Math.random() < 0.05) { // Small chance to turn off each frame
             tile.style.backgroundColor = '#333';
             return false; // Remove from activeTiles
        }
        return true; // Keep in activeTiles
    });
}


function clearLights() {
    const tiles = danceFloor.querySelectorAll('.tile');
    tiles.forEach(tile => {
        tile.style.backgroundColor = '#333';
    });
    activeTiles = []; // Clear the active list
}


// --- Event Listener ---
musicInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        if (audioContext && audioContext.state === 'running') {
             stopAnimation(); // Stop current animation if running
         }
        setupAudioContext(file);
    }
});

// --- Initial Setup ---
createGrid(); // Create the grid on page load

