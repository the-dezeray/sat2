<p align="center">
  <img src="docs/image.png" alt="MOPHI Satellite Tracker" width="100%">
</p>

<h1 align="center">MOPHI</h1>

<p align="center">
  <strong>Mini Orbital Ephemeris Index</strong><br>
  A high-performance, real-time satellite tracking visualization powered by Three.js.
</p>

<p align="center">
  <a href="https://github.com/kefranabg/readme-md-generator/blob/master/LICENSE">
    <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow.svg" target="_blank" />
  </a>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Three.js-000000?style=flat&logo=three.js&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black" alt="JavaScript" />
</p>

---

## 🛰️ Overview

**MOPHI** is a sophisticated satellite tracking application that visualizes thousands of satellites orbiting Earth in real-time. By leveraging the power of WebGL and Web Workers, it provides a smooth, interactive experience for exploring the complex network of objects in terrestrial orbit.

## ✨ Features

- **Real-time Tracking**: Dynamic propagation of orbital data for over 20,000+ satellites using `satellite.js`.
- **High-Performance Rendering**: Optimized 3D visualization using `InstancedMesh`, capable of handling high object counts with 60FPS performance.
- **Multithreaded Calculations**: Offloads intensive orbital mathematics to Web Workers to ensure a stutter-free main thread.
- **Color-Coded Orbits**: Visual classification by orbital period:
  - ⚪ **LEO** (Low Earth Orbit): White
  - 🟡 **MEO** (Medium Earth Orbit): Yellow
  - 🔴 **HEO** (High Earth Orbit): Red
  - 🟢 **STARLINK**: Emerald green
- **Interactive UI**: Search, select, and inspect individual satellites for live telemetry including altitude, latitude, and longitude.
- **Dynamic Orbit Paths**: Real-time calculation and rendering of future orbital trajectories.

## 🛠️ Tech Stack

- **Core**: JavaScript (ES6+)
- **Visualization**: [Three.js](https://threejs.org/) & [Three-Globe](https://github.com/vasturiano/three-globe)
- **Physics/Math**: [satellite.js](https://github.com/shashwatak/satellite-js)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **UI Architecture**: Component-based vanilla JS with CSS Grid/Flexbox

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/sat2.git
   cd sat2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 📖 Usage

- **Navigation**: Use mouse/touch to rotate, zoom, and pan around the globe.
- **Search**: Use the search bar in the UI to find specific satellites by name or NORAD ID.
- **Details**: Click on a satellite point to lock focus and view live telemetry data.
- **Tracking**: Enable "Tracking Mode" to automatically follow a selected satellite's path.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/kefranabg/readme-md-generator/blob/master/LICENSE) link for details.

---

<p align="center">
  Built with ❤️ for the aerospace community.
</p>
