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
  
  // Character settings
  characters: [
    { id: 'robot', name: 'Robot', url: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/models/gltf/RobotExpressive/RobotExpressive.glb' },
    { id: 'soldier', name: 'Soldier', url: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/models/gltf/Soldier.glb' },
    { id: 'parrot', name: 'Parrot', url: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/models/gltf/Parrot.glb' }
  ],
  cameraDistance: 7, // Distance of camera from character (increased for better view)
  cameraHeight: 4,   // Height of camera above character (increased for better view)
};