export const config = {
  gridSize: 10, // Number of rows and columns for the dance floor
  lightUpProbability: 0.1, // Chance for a tile to light up on a beat
  maxActiveLights: 15, // Maximum number of tiles lit simultaneously
  lightColors: ['#ff00ff', '#00ffff', '#ffff00', '#ff5500', '#00ff55', '#5500ff'], // Colors for the lights
  beatDetectionThreshold: 0.15, // Sensitivity for detecting beats (lower = more sensitive)
  analysisBufferSize: 1024, // FFT size for audio analysis
};

