import { config } from 'config';

const danceFloor = document.getElementById('dance-floor');
const musicInput = document.getElementById('music-input');
let audioContext;
let analyser;
let source;
let dataArray;
let animationFrameId;

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
    } else {
        clearLights(); // Turn off all lights if below threshold
    }


    animationFrameId = requestAnimationFrame(animationLoop);
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