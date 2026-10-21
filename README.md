# 🏏 Gully Cricket: Neighborhood Chaos

A nostalgic, fast-paced 3D Indian street cricket browser game built with **TypeScript**, **HTML5 Canvas**, **Three.js**, and procedural **Web Audio API**.

Play directly in any desktop or mobile browser — zero installs, 60 FPS performance, authentic street ambiance, and reactive neighborhood targets.

---

## ✨ Features & Mechanics

### 1. Authentic Street Cricket Rules
* **Timing-Based Batting**: Time your swing relative to the sweet spot indicator to execute lofted maximums, ground drives, or late dabs.
* **Reactive Neighborhood Hazards**:
  * 🚗 **Parked Car**:
  * 🪟 **Residential Windows**
  * ❄️ **AC Unit & Newspaper Uncle**
* **Wicket Physics**
* **3-Ball Life System**

### 2. Multi-Layered Hybrid Rendering Pipeline
* **Layer 1 (2D Background)**: Illustrated Indian gully street scene with colorful buildings, balconies, local tea stall, and overhead wiring.
* **Layer 2 (3D Characters)**: Real-time 3D Three.js rendering for the bowler and batter with FBX animations, custom toon materials, and stance blending.
* **Layer 3 (2D Effects & Ball Physics)**: Parabolic ball trajectory with ground shadows, bat impact shockwaves, glass shatter shards, and score popups.
* **Layer 4 (Screen-Space HUD)**: Clean scoreboard pill, live balls indicator, center score badge with shockwave animations, minimal commentary subtitle bar, and audio mute control.

### 3. Procedural Web Audio Soundscape
* **Zero External Audio Assets**: All sound effects and background ambiances are generated dynamically in real time via the **Web Audio API**.
* **Impact FX**: Wood-on-leather bat "thock", stump timber crash, glass shatter crunch, and car horn alarm with Doppler modulation.
* **Living Street Ambience**: Randomized, variable-intensity background birds and distant street horns.

### 4. Responsive & Mobile-First
* Automatic canvas scaling with aspect ratio preservation and window clamping.
* Built-in **Rotate Phone** orientation overlay for optimal mobile landscape gameplay.
* Touch and keyboard inputs supported seamlessly.

---

## 🎮 Controls

| Action | Control |
| :--- | :--- |
| **Bowl / Bat** | Left Mouse Click / Mobile Tap / `Spacebar` |
| **Mute / Unmute Audio** | Top-right 🔊 icon / `M` key |

---

## 🛠️ Tech Stack

* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **Bundler & Dev Server**: [Vite](https://vitejs.dev/)
* **3D Engine**: [Three.js](https://threejs.org/) (FBXLoader, Bone Rigs, Toon Shaders)
* **2D Graphics**: Native HTML5 Canvas 2D Context
* **Audio**: Native Web Audio API (Synthesizers, Noise Buffers, Bandpass Filters)
* **SEO**: OpenGraph, Twitter Cards, Schema.org `VideoGame` JSON-LD

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* `npm`

### Installation
```bash
# Clone the repository
git clone https://github.com/Abhinav-Muralidhar/cricket.git

# Navigate to project directory
cd cricket

# Install dependencies
npm install
```

### Development
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Production Build
```bash
npm run build
```
Generates an optimized production bundle inside the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

---

## 👤 Author

Developed by **Abhinav M**  
* GitHub: [@Abhinav-Muralidhar](https://github.com/Abhinav-Muralidhar)

---