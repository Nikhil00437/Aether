# 🌌 Aether Music Player

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/61fd3c83-8f9a-4ff3-89e5-e18e15b41254" />


Aether is a premium, high-fidelity web-based music player built with React and Vite. It combines professional-grade audio features—such as crossfading, parametric equalization, reverb convolution, and volume normalization—with a playful, visually stunning cyber-aesthetic featuring an interactive Chibi companion, retro scratch vinyl deck, and real-time canvas visualizers.

---

## ✨ Key Features

### 🎵 1. Advanced Audio Engine (`AudioContext.jsx`)
* **IndexedDB Cache Engine**: Automatically caches local audio tracks in the browser's IndexedDB database for offline capabilities and instantaneous loading.
* **Dual-Element Crossfading**: Smoothly blends tracks during transitions (configurable fade duration) by fading out the current track on one audio element while fading in the next track on a second audio element.
* **Audio Equalizer (Sound Lab)**: 3-band parametric EQ (Bass, Mid, Treble) with pre-configured presets (*Bass Boost*, *Treble Boost*, *Vocal*, *Acoustic*, *Chill*, *Flat*).
* **Reverb Effects**: Convolution-based reverb engine simulating *Room*, *Concert Hall*, and *Cathedral* acoustics.
* **Volume Normalization**: Built-in dynamic range compression to maintain uniform loudness across different tracks.
* **Sleep Timer**: Schedule playback cutoff with a smooth volume fade-out.

### 🎮 2. Interactive Chibi Companion ("Aethy")

* **Interactive mascot**: Aethy sits in the sidebar, tracking your active tab. When you navigate to a new section, Aethy teleports via a spinning neon portal and lands on the new tab icon.
* **Aethy's Habitat Room**: Enter Aethy's Room view to see Aethy headbang in sync with the beats when music is playing, or float into a deep sleep with drifting `"Zzz"` bubbles when idle.
* **Wardrobe & Customization**: Unlock vanity accessories as you listen:
  * **Wizard Hat** (unlocked with a Listening Streak of 1+ day)
  * **Cyber Visor** (unlocked after 5 minutes of total listening time)
  * **Floating Synth Deck** (unlocked after 15 minutes of total listening time)

### 💿 3. Retro Vinyl Scratch Deck

* Rendered on the home screen, this simulated turntable displays the album art of the currently playing song on the center spindle.
* **Drag-to-Scratch**: Grab and spin the record with your mouse to scratch and manually seek through the audio timeline in real time.
* **Tone Arm Needle**: The tonearm needle automatically pivots onto the vinyl platter when playback starts and lifts away when paused.

### 🎨 4. Smart Mood Ring Auto-Theming
* When enabled, the player dynamically updates the CSS theme variables (*Accent Primary*, *Accent Secondary*, *Gradients*, and *Glows*) based on the colors extracted from the current track's album cover art.
* Alternatively, the **Auto Mood Ring** analyzes the live frequency spectrum (low-end bass vs high-end treble) to switch themes dynamically to match the mood of the music.

### 🎤 5. Kinetic Karaoke Synced Lyrics

* Loads synchronized `.lrc` and plain-text lyrics from online databases (via LRCLib) and prefetches them for upcoming tracks.
* **Bouncing Ball Animation**: Splits lyrics word-by-word and moves a glowing ball in a physics-based parabolic bounce from word to word as they are sung.
* **Sync Calibration**: Calibrate offsets manually in real time (+/- 0.5s) to fix timing alignment.

### 📂 6. Playlist & Queue Management
* **Drag-and-Drop**: Drag a track row from any song table and drop it directly onto a playlist in the sidebar to add it.
* **Smart Queue**: Reorder your play queue via dragging, clear the queue, or play next.
* **Aether Wrapped**: View listening analytics (Listening streak, top song, top artist, total minutes).

---

## ⌨️ Keyboard Shortcuts

Press `?` anywhere to toggle the shortcuts help modal:

| Key | Action |
| --- | --- |
| `Space` | Play / Pause |
| `N` | Next Track |
| `P` | Previous Track |
| `L` | Like / Favorite current track |
| `→` | Seek Forward 5s |
| `←` | Seek Backward 5s |
| `↑` | Volume Up 5% |
| `↓` | Volume Down 5% |
| `Q` | Toggle Play Queue Panel |
| `Y` | Toggle Synced Lyrics Screen |
| `?` | Toggle Help Cheat Sheet |

---

## 🛠️ Technology Stack

* **Frontend Framework**: React 19 (Functional components, hooks)
* **Build System**: Vite (Fast HMR and bundling)
* **Styling**: Vanilla CSS (Modern custom properties, glassmorphism, responsive grids)
* **Icons**: Lucide React
* **Audio Processing**: Web Audio API (AnalyserNode, BiquadFilterNode, ConvolverNode, DynamicsCompressorNode)
* **Storage**: IndexedDB (Audio blobs) & LocalStorage (User settings, history, playlists)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/free-music.git
   cd free-music
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally
To launch the Vite development server with hot module replacement (HMR):
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### Adding Your Own Tracks
You can populate your own local tracks by editing/generating `/public/songs.json`. Alternatively, the player automatically falls back to high-quality royalty-free demo tracks on initial run.
To re-index local music in your public directory, you can run:
```bash
npm run index-music
```

### Production Build
To build the project into static assets for deployment:
```bash
npm run build
```
The compiled build output will be stored in the `/dist` folder.

---

## 📁 Project Structure

```text
├── public/
│   ├── songs.json           # Track catalog configuration
│   └── music/               # Local audio tracks folder
├── src/
│   ├── assets/              # Icons and styling helpers
│   ├── components/
│   │   ├── AmbientBackground.jsx  # Canvas-based particle swarm
│   │   ├── CanvasVisualizer.jsx   # Frequency bars and circular orbital visualizer
│   │   ├── ChibiCompanion.jsx     # Chibi mascot logic and assets
│   │   ├── KaraokeOverlay.jsx     # Bouncing ball lyrics renderer
│   │   ├── MainContent.jsx        # Routing views, Vinyl Platter, Wardrobe UI
│   │   ├── PlayerBar.jsx          # Bottom controls & Sound Lab
│   │   ├── PlaylistCover.jsx      # Playlist cover generator
│   │   ├── RightDrawer.jsx        # Queue & Lyrics overlay
│   │   └── Sidebar.jsx            # Primary navigation & Drag-and-drop links
│   ├── context/
│   │   └── AudioContext.jsx       # State management, Web Audio node routing
│   ├── App.jsx              # Main entry point & layout wireframe
│   ├── index.css            # Core design tokens, gradients, animations
│   └── main.jsx             # React DOM bootstrapping
├── package.json
└── vite.config.js
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
