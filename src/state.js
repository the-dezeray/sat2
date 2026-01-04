export const state = {
  timeScale: 1,
  currentTime: new Date(),
  isPaused: false,
  orbitVisible: false,
  cameraMode: 'FREE', // FREE, FOLLOW, NADIR
  selectedSatelliteIndex: -1,
  lastInfoUpdate: 0,
  viewMode: 'earth', // earth, satellite
  meshMode: 'marble' // marble, night, dark, gray
};

export function updateState(updates) {
  Object.assign(state, updates);
}
