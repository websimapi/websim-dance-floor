export const config = {
  gridSize: 10, // Number of rows and columns for the dance floor
  lightColors: [
      '#FF0000', // Red
      '#FF7F00', // Orange
      '#FFFF00', // Yellow
      '#00FF00', // Lime
      '#00FFFF', // Cyan
      '#0000FF', // Blue
      '#8B00FF', // Violet
      '#FF00FF', // Magenta
      '#FF1493', // Deep Pink
      '#00BFFF', // Deep Sky Blue
      '#ADFF2F'  // Green Yellow
  ],
  beatDetectionThreshold: 0.15, // Sensitivity for detecting beats (lower = more sensitive)
  analysisBufferSize: 1024, // FFT size for audio analysis
};