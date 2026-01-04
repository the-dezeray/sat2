import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { SatelliteManager } from './SatelliteManager.js';
import { state, updateState } from './state.js';
import { createUI, updateInfoBox } from './ui.js';
import './style.css';

// UI Elements
const UI = createUI();
const {
  timeLogger,
  searchContainer,
  infoBox,
  hoverLabel,
  zoomControls,
  actionButtons,
  viewModeSelector,
  orbitLegend,
  controlsPanel
} = UI;

const Globe = new ThreeGlobe()
  .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg')
  .showAtmosphere(true)
  .atmosphereColor('#5da9ff')
  .atmosphereAltitude(0.15);

const satelliteManager = new SatelliteManager(Globe);
satelliteManager.init();

// Hide loading overlay when ready
satelliteManager.onReadyCallback = () => {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
    setTimeout(() => overlay.remove(), 500);
  }
};

// Scene Setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.querySelector('#app').innerHTML = '<div id="globeViz"></div>';
const vizContainer = document.getElementById('globeViz');
vizContainer.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.add(Globe);
scene.add(new THREE.AmbientLight(0x404040, 0.6));

const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
sunLight.position.set(1000, 0, 1000);
scene.add(sunLight);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 200000);
camera.position.set(0, 0, 800);

const tbControls = new TrackballControls(camera, renderer.domElement);
tbControls.rotateSpeed = 5;
tbControls.zoomSpeed = 0.8;

function drawOrbitPath(points, isSelected = false) {
  const oldLine = Globe.getObjectByName('orbitLine');
  if (oldLine) Globe.remove(oldLine);
  if (points.length < 2) return;

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: isSelected ? 0x00ff00 : 0x38bdf8,
    linewidth: 2,
    transparent: true,
    opacity: isSelected ? 0.8 : 0.4
  });
  const line = new THREE.Line(geometry, material);
  line.name = 'orbitLine';
  Globe.add(line);
}

function drawDownwardLine(satPos) {
  const oldLine = Globe.getObjectByName('downwardLine');
  if (oldLine) Globe.remove(oldLine);

  if (!satPos) return;

  // Calculate the point on Earth's surface directly below the satellite
  const earthSurfacePoint = satPos.clone().normalize().multiplyScalar(100);

  const points = [satPos.clone(), earthSurfacePoint];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x00ff00,
    linewidth: 2,
    transparent: true,
    opacity: 0.6
  });
  const line = new THREE.Line(geometry, material);
  line.name = 'downwardLine';
  Globe.add(line);
}

// Animation Loop
(function animate() {
  requestAnimationFrame(animate);

  if (!state.isPaused) {
    state.currentTime = new Date(state.currentTime.getTime() + (1000 / 60) * state.timeScale);
  }

  satelliteManager.update(state.currentTime);
  satelliteManager.updateSatelliteScale(camera);

  // Update selected satellite telemetry and draw downward line
  const selectedIndex = satelliteManager.getSelected();
  if (selectedIndex >= 0) {
    const now = performance.now();
    // Throttle UI updates to 10Hz (every 100ms)
    if (now - state.lastInfoUpdate > 100) {
      const satData = satelliteManager.getSatelliteData(selectedIndex);
      if (satData) {
        const liveData = satelliteManager.getLiveStats(selectedIndex);
        updateInfoBox(infoBox, satData, liveData);
      }
      timeLogger.innerText = `UTC ${state.currentTime.toISOString().replace('T', ' ').slice(0, 19)} | GLOBAL SURVEILLANCE ACTIVE`;
      state.lastInfoUpdate = now;
    }

    // Draw downward line
    const satPos = satelliteManager.getSelectedPosition();
    if (satPos) {
      drawDownwardLine(satPos);

      // Camera Modes Logic
      if (state.cameraMode !== 'FREE') {
        const globalPos = satPos.clone();
        globalPos.applyMatrix4(Globe.matrixWorld);

        if (state.cameraMode === 'FOLLOW') {
          const offset = camera.position.clone().sub(tbControls.target);
          tbControls.target.copy(globalPos);
          camera.position.copy(globalPos.clone().add(offset));
        } else if (state.cameraMode === 'NADIR') {
          const nadirPos = globalPos.clone().normalize().multiplyScalar(globalPos.length() + 50);
          camera.position.lerp(nadirPos, 0.1);
          tbControls.target.lerp(globalPos, 0.1);
        }
      }
    }
  } else {
    const oldLine = Globe.getObjectByName('downwardLine');
    if (oldLine) Globe.remove(oldLine);
    infoBox.style.display = 'none';
    
    // Still update time logger even if no satellite is selected
    const now = performance.now();
    if (now - state.lastInfoUpdate > 100) {
      timeLogger.innerText = `UTC ${state.currentTime.toISOString().replace('T', ' ').slice(0, 19)} | GLOBAL SURVEILLANCE ACTIVE`;
      state.lastInfoUpdate = now;
    }
  }

  tbControls.update();

  // Make sunlight follow camera slightly to ensure view is always lit
  sunLight.position.copy(camera.position).add(new THREE.Vector3(100, 100, 100));

  renderer.render(scene, camera);
})();

// Mouse move for hover detection
window.addEventListener('mousemove', (event) => {
  if (event.target.closest('.glass') || event.target.closest('.search-container')) {
    satelliteManager.setHovered(-1);
    document.body.classList.remove('hovering-satellite');
    hoverLabel.style.display = 'none';
    return;
  }

  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );

  const hoveredIndex = satelliteManager.checkHover(mouse, camera);
  satelliteManager.setHovered(hoveredIndex);

  if (hoveredIndex >= 0) {
    document.body.classList.add('hovering-satellite');

    const hoveredSat = satelliteManager.getSatelliteData(hoveredIndex);
    const hoveredPos = satelliteManager.getPosition(hoveredIndex);
    if (hoveredSat && hoveredPos) {
      // Anchor hover label to the hovered satellite's screen projection
      const worldPos = hoveredPos.clone().applyMatrix4(Globe.matrixWorld);
      const projected = worldPos.clone().project(camera);

      if (projected.z > -1 && projected.z < 1) {
        const screenX = (projected.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-projected.y * 0.5 + 0.5) * window.innerHeight;
        hoverLabel.textContent = hoveredSat[1];
        hoverLabel.style.display = 'block';
        hoverLabel.style.transform = `translate(${screenX + 12}px, ${screenY + 12}px)`;
      } else {
        hoverLabel.style.display = 'none';
      }
    } else {
      hoverLabel.style.display = 'none';
    }
  } else {
    document.body.classList.remove('hovering-satellite');
    hoverLabel.style.display = 'none';
  }
});

window.addEventListener('mouseleave', () => {
  satelliteManager.setHovered(-1);
  document.body.classList.remove('hovering-satellite');
  hoverLabel.style.display = 'none';
});

// Interaction - Click to select satellite
window.addEventListener('click', async (event) => {
  if (event.target.closest('.glass') || event.target.closest('.search-container')) return;

  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );

  // Check if clicking on a satellite from the satellite manager
  const clickedIndex = satelliteManager.checkHover(mouse, camera);
  if (clickedIndex >= 0) {
    selectSatellite(clickedIndex);
    return;
  }
});

// Controls Listeners
document.getElementById('speed-slider').addEventListener('input', (e) => {
  const timeScale = parseInt(e.target.value);
  updateState({ timeScale });
  document.getElementById('speed-value').textContent = timeScale;
});

document.getElementById('pause-btn').addEventListener('click', () => {
  const isPaused = !state.isPaused;
  updateState({ isPaused });
  document.getElementById('pause-icon').textContent = isPaused ? '▶' : '⏸';
  document.getElementById('pause-btn').classList.toggle('active', isPaused);
});

document.getElementById('reset-btn').addEventListener('click', () => {
  updateState({ currentTime: new Date() });
});

document.getElementById('camera-selector').addEventListener('click', (e) => {
  const option = e.target.closest('.selector-option');
  if (!option) return;

  document.querySelectorAll('#camera-selector .selector-option').forEach(el => el.classList.remove('active'));
  option.classList.add('active');
  const cameraMode = option.dataset.mode;
  updateState({ cameraMode });

  if (cameraMode === 'FREE') {
    tbControls.target.set(0, 0, 0);
  }
});

// Zoom Controls Listeners
document.getElementById('zoom-slider').addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  const minDist = 105;
  const maxDist = 2000;
  // Inverted logic: Higher value (Top) = Closer (Zoom In)
  const newDist = maxDist - (maxDist - minDist) * (value / 100);
  camera.position.normalize().multiplyScalar(newDist);
  document.getElementById('zoom-value').textContent = value;
});

// Mesh Selector Listener
const MESHES = {
  marble: '//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg',
  night: '//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg',
  dark: '//cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg',
  gray: '//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png'
};

document.getElementById('mesh-selector').addEventListener('click', (e) => {
  const option = e.target.closest('.selector-option');
  if (!option) return;

  document.querySelectorAll('#mesh-selector .selector-option').forEach(el => el.classList.remove('active'));
  option.classList.add('active');
  const meshMode = option.dataset.mesh;
  updateState({ meshMode });
  Globe.globeImageUrl(MESHES[meshMode]);
});

// Track Single Listener
document.getElementById('track-single-btn').addEventListener('click', () => {
  updateState({ cameraMode: 'FOLLOW' });
  document.querySelectorAll('#camera-selector .selector-option').forEach(el => el.classList.remove('active'));
  document.querySelector('#camera-selector [data-mode="FOLLOW"]').classList.add('active');

  const selectedIndex = satelliteManager.getSelected();
  if (selectedIndex >= 0) {
    const satPos = satelliteManager.getSelectedPosition();
    if (satPos) {
      const globalPos = satPos.clone();
      globalPos.applyMatrix4(Globe.matrixWorld);
      tbControls.target.copy(globalPos);
    }
  }
});

// View Mode Selector Listener
document.getElementById('view-mode').addEventListener('click', (e) => {
  const option = e.target.closest('.selector-option');
  if (!option) return;

  document.querySelectorAll('#view-mode .selector-option').forEach(el => el.classList.remove('active'));
  option.classList.add('active');
  const viewMode = option.dataset.view;
  updateState({ viewMode });

  if (viewMode === 'earth') {
    // Earth View - center on Earth
    tbControls.target.set(0, 0, 0);
    const currentDist = camera.position.length();
    camera.position.set(0, 0, Math.max(currentDist, 400));
    updateState({ cameraMode: 'FREE' });
    document.querySelectorAll('#camera-selector .selector-option').forEach(el => el.classList.remove('active'));
    document.querySelector('#camera-selector [data-mode="FREE"]').classList.add('active');
  } else if (viewMode === 'satellite') {
    // Satellite View - focus on satellite
    const selectedIndex = satelliteManager.getSelected();
    if (selectedIndex >= 0) {
      const satPos = satelliteManager.getSelectedPosition();
      if (satPos) {
        const globalPos = satPos.clone();
        globalPos.applyMatrix4(Globe.matrixWorld);
        tbControls.target.copy(globalPos);

        // Position camera close to satellite
        const offset = new THREE.Vector3(20, 20, 20);
        camera.position.copy(globalPos.clone().add(offset));

        updateState({ cameraMode: 'FOLLOW' });
        document.querySelectorAll('#camera-selector .selector-option').forEach(el => el.classList.remove('active'));
        document.querySelector('#camera-selector [data-mode="FOLLOW"]').classList.add('active');
      }
    }
  }
});

// Search Listener
const searchInput = document.getElementById('sat-search');
const searchResults = document.getElementById('search-results');

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  if (query.length < 2) {
    searchResults.style.display = 'none';
    return;
  }

  const results = satelliteManager.searchSatellites(query);
  if (results.length > 0) {
    searchResults.innerHTML = results.map(res => `
      <div class="search-result-item" data-index="${res.index}">
        <span class="sat-name">${res.name}</span>
        <span class="sat-id">#${res.id}</span>
      </div>
    `).join('');
    searchResults.style.display = 'block';
  } else {
    searchResults.style.display = 'none';
  }
});

// Handle search result selection
searchResults.addEventListener('click', async (e) => {
  const item = e.target.closest('.search-result-item');
  if (!item) return;

  const index = parseInt(item.dataset.index);
  selectSatellite(index);
  searchResults.style.display = 'none';
  searchInput.value = '';
});

// Helper to select satellite
async function selectSatellite(index) {
  if (index >= 0) {
    const prevSelected = satelliteManager.getSelected();

    // Toggle orbit off if clicking the same selected satellite again
    if (prevSelected === index && state.orbitVisible) {
      updateState({ orbitVisible: false });
      const orbitLine = Globe.getObjectByName('orbitLine');
      if (orbitLine) Globe.remove(orbitLine);
      return;
    }

    satelliteManager.setSelected(index);
    updateState({ orbitVisible: true });

    // Get satellite data
    const satData = satelliteManager.getSatelliteData(index);
    if (satData) {
      // Initial info update (will be updated live in loop)
      updateInfoBox(infoBox, satData);

      // Calculate and draw orbit arc
      try {
        const orbitPoints = await satelliteManager.calculateOrbitPath(satData, Globe, state.currentTime);
        drawOrbitPath(orbitPoints, true);
      } catch (err) {
        console.error('Failed to calculate orbit:', err);
        updateState({ orbitVisible: false });
      }
    }

    // Focus camera on selected satellite
    setTimeout(() => {
      const satPos = satelliteManager.getSelectedPosition();
      if (satPos) {
        const globalPos = satPos.clone();
        globalPos.applyMatrix4(Globe.matrixWorld);

        tbControls.target.copy(globalPos);

        // Position camera relative to the satellite's position on the globe
        // Calculate normal vector from center of earth (0,0,0) to satellite
        const normal = globalPos.clone().normalize();
        const distance = 80; // Distance above the satellite
        const newCameraPos = globalPos.clone().add(normal.multiplyScalar(distance));

        camera.position.copy(newCameraPos);
        camera.lookAt(globalPos);
      }
    }, 100);
  }
}

// Keep Enter key for fallback or immediate first result
searchInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter') {
    const query = e.target.value.trim();
    if (query) {
      const index = satelliteManager.searchSatellite(query);
      if (index >= 0) {
        selectSatellite(index);
        searchResults.style.display = 'none';
      }
    }
  }
});

// Close search results when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container')) {
    searchResults.style.display = 'none';
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
