import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AudioContext = createContext();

const DEMO_SONGS = [
  {
    id: "demo-1",
    title: "Aether Drift",
    artist: "SoundHelix Alpha",
    album: "Nebula Echoes",
    duration: 372,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: null,
    trackNumber: 1,
    year: 2026,
    isDemo: true
  },
  {
    id: "demo-2",
    title: "Starlight Flow",
    artist: "SoundHelix Beta",
    album: "Nebula Echoes",
    duration: 425,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    coverUrl: null,
    trackNumber: 2,
    year: 2026,
    isDemo: true
  },
  {
    id: "demo-3",
    title: "Deep Space Voyage",
    artist: "SoundHelix Gamma",
    album: "Nebula Echoes",
    duration: 344,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    coverUrl: null,
    trackNumber: 3,
    year: 2026,
    isDemo: true
  }
];
// ==========================================
// INDEXEDDB AUDIO CACHE ENGINE
// ==========================================
const DB_NAME = 'AetherMusicCache';
const STORE_NAME = 'audio_cache';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function getCachedAudio(url) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    return null;
  }
}

async function cacheAudio(url, blob) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(blob, url);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("Failed to cache audio in IndexedDB:", e);
  }
}

async function getAllCachedUrls() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    return [];
  }
}

export const AudioProvider = ({ children }) => {
  const [songs, setSongs] = useState([]);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem('aether-volume');
    return savedVolume ? parseFloat(savedVolume) : 0.8;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('aether-favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [shuffle, setShuffle] = useState(() => {
    return localStorage.getItem('aether-shuffle') === 'true';
  });
  const [repeat, setRepeat] = useState(() => {
    return localStorage.getItem('aether-repeat') || 'none';
  });
  const [playQueue, setPlayQueue] = useState([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(-1);
  const [originalQueue, setOriginalQueue] = useState([]);

  // Playlists State
  const [playlists, setPlaylists] = useState(() => {
    const saved = localStorage.getItem('aether-playlists');
    return saved ? JSON.parse(saved) : [];
  });

  // Play counts & Recently Played state (persisted in localStorage)
  const [playCounts, setPlayCounts] = useState(() => {
    const saved = localStorage.getItem('aether-play-counts');
    return saved ? JSON.parse(saved) : {};
  });
  const [recentlyPlayedIds, setRecentlyPlayedIds] = useState(() => {
    const saved = localStorage.getItem('aether-recent-played-ids');
    return saved ? JSON.parse(saved) : [];
  });

  // Global Toast Notification State
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  const audio1Ref = useRef(new Audio());
  const audio2Ref = useRef(new Audio());
  const activeAudioIndexRef = useRef(1);
  const [activeAudioIndex, setActiveAudioIndex] = useState(1);
  
  const activeAudioRef = useRef(null);
  useEffect(() => {
    activeAudioRef.current = activeAudioIndex === 1 ? audio1Ref.current : audio2Ref.current;
  }, [activeAudioIndex]);

  const isInitialLoadRef = useRef(true);
  const lastSavedTimeRef = useRef(0);

  const [eqPreset, setEqPreset] = useState('Flat');
  const [eqGains, setEqGains] = useState(() => {
    const saved = localStorage.getItem('aether-eq-gains');
    return saved ? JSON.parse(saved) : { bass: 0, mid: 0, treble: 0 };
  });

  const [reverbPreset, setReverbPreset] = useState('Off');
  const reverbNodeRef = useRef(null);
  const reverbWetGainRef = useRef(null);
  const reverbDryGainRef = useRef(null);

  const [crossfadeDuration, setCrossfadeDuration] = useState(() => {
    const saved = localStorage.getItem('aether-crossfade-duration');
    return saved ? parseInt(saved, 10) : 3;
  });

  const [sleepTimer, setSleepTimer] = useState(null);
  const sleepTimerRef = useRef(null);
  const originalVolumeRef = useRef(null);
  const isFadingOutRef = useRef(false);

  const [lyricsOffset, setLyricsOffset] = useState(0);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('aether-theme') || 'Aether Dynamic';
  });

  const [activeAccessories, setActiveAccessories] = useState(() => {
    const saved = localStorage.getItem('aether-active-accessories');
    return saved ? JSON.parse(saved) : { wizardHat: false, cyberVisor: false, synthDeck: false };
  });

  useEffect(() => {
    localStorage.setItem('aether-active-accessories', JSON.stringify(activeAccessories));
  }, [activeAccessories]);

  const [autoMoodRing, setAutoMoodRing] = useState(() => {
    return localStorage.getItem('aether-auto-mood-ring') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('aether-auto-mood-ring', autoMoodRing.toString());
  }, [autoMoodRing]);

  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem('aether-listening-streak');
    if (saved) return parseInt(saved, 10);
    return 0;
  });

  useEffect(() => {
    localStorage.setItem('aether-listening-streak', streak.toString());
  }, [streak]);

  useEffect(() => {
    if (recentlyPlayedIds.length > 0 && streak === 0) {
      setStreak(1);
    }
  }, [recentlyPlayedIds, streak]);

  // Smart Mood Ring Theme Changer
  useEffect(() => {
    if (!autoMoodRing || !isPlaying || !analyserRef.current || !webAudioCtxRef.current) return;

    let intervalId;
    const analyzeAudioMood = () => {
      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      // Low frequency range (Bass): bin 0 to 10
      let bassSum = 0;
      for (let i = 0; i < 10; i++) {
        bassSum += dataArray[i];
      }
      const avgBass = bassSum / 10;

      // High frequency range (Treble): bin 40 to 100
      let trebleSum = 0;
      let count = 0;
      for (let i = 40; i < 100 && i < bufferLength; i++) {
        trebleSum += dataArray[i];
        count++;
      }
      const avgTreble = trebleSum / (count || 1);

      // Auto shift theme based on spectral profile
      if (avgBass > 140 && avgTreble > 80) {
        setTheme('Cyberpunk Magenta');
      } else if (avgBass > 120 && avgTreble <= 80) {
        setTheme('Aether Dynamic');
      } else if (avgBass <= 120 && avgTreble < 50) {
        setTheme('Auroral Green');
      } else if (avgBass <= 120 && avgTreble >= 50) {
        setTheme('Sunset Amber');
      }
    };

    intervalId = setInterval(analyzeAudioMood, 6000);
    return () => clearInterval(intervalId);
  }, [autoMoodRing, isPlaying, setTheme]);

  const [visualizerMode, setVisualizerMode] = useState(() => {
    return localStorage.getItem('aether-visualizer-mode') || 'both';
  });

  const cycleVisualizerMode = () => {
    setVisualizerMode(prev => {
      const next = prev === 'linear' ? 'orbit' : prev === 'orbit' ? 'both' : 'linear';
      localStorage.setItem('aether-visualizer-mode', next);
      return next;
    });
  };

  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const currentSongRef = useRef(null);
  const lyricsCacheRef = useRef({});
  const pendingLyricsRequestsRef = useRef({});

  const [isNormalized, setIsNormalized] = useState(() => {
    return localStorage.getItem('aether-normalized') === 'true';
  });
  const compressorNodeRef = useRef(null);

  const [isKaraokeMode, setIsKaraokeMode] = useState(false);

  const cachedUrlsSetRef = useRef(new Set());
  const objectUrlMapRef = useRef(new Map());

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  const toggleQueue = () => {
    setShowQueue(prev => {
      if (!prev) setShowLyrics(false);
      return !prev;
    });
  };

  const toggleLyrics = () => {
    setShowLyrics(prev => {
      if (!prev) setShowQueue(false);
      return !prev;
    });
  };

  const webAudioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const analyserRef = useRef(null);
  const eqFiltersRef = useRef({});

  // Helper HSL / RGB Math conversion utilities
  const rgbToHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [h * 360, s, l];
  };

  const hslToRgb = (h, s, l) => {
    h /= 360;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  const applyThemeColors = (r, g, b) => {
    const root = document.documentElement;
    let [h, s, l] = rgbToHsl(r, g, b);
    let h2 = (h + 40) % 360;
    let [r2, g2, b2] = hslToRgb(h2, s, l);
    root.style.setProperty('--accent-primary', `rgb(${r}, ${g}, ${b})`);
    root.style.setProperty('--accent-primary-rgb', `${r}, ${g}, ${b}`);
    root.style.setProperty('--accent-secondary', `rgb(${r2}, ${g2}, ${b2})`);
    root.style.setProperty('--accent-gradient', `linear-gradient(135deg, rgb(${r}, ${g}, ${b}) 0%, rgb(${r2}, ${g2}, ${b2}) 100%)`);
    root.style.setProperty('--accent-glow', `0 0 25px rgba(${r}, ${g}, ${b}, 0.38)`);
  };

  const extractCoverColors = (coverUrl) => {
    if (!coverUrl) {
      applyThemeColors(99, 102, 241); // default indigo
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = coverUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 10;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 10, 10);
        const data = ctx.getImageData(0, 0, 10, 10).data;
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness > 25 && brightness < 230) {
            rSum += r;
            gSum += g;
            bSum += b;
            count++;
          }
        }
        let r = 99, g = 102, b = 241;
        if (count > 0) {
          r = Math.round(rSum / count);
          g = Math.round(gSum / count);
          b = Math.round(bSum / count);
        } else {
          let allR = 0, allG = 0, allB = 0;
          for (let i = 0; i < data.length; i += 4) {
            allR += data[i];
            allG += data[i + 1];
            allB += data[i + 2];
          }
          r = Math.round(allR / (data.length / 4));
          g = Math.round(allG / (data.length / 4));
          b = Math.round(allB / (data.length / 4));
        }
        let [h, s, l] = rgbToHsl(r, g, b);
        s = Math.max(0.60, s); // Keep accent colors saturated
        l = Math.max(0.48, Math.min(0.62, l)); // Keep in premium mid-brightness
        const [finalR, finalG, finalB] = hslToRgb(h, s, l);
        applyThemeColors(finalR, finalG, finalB);
      } catch (e) {
        applyThemeColors(99, 102, 241);
      }
    };
    img.onerror = () => {
      applyThemeColors(99, 102, 241);
    };
  };

  // Theme variable updater
  useEffect(() => {
    localStorage.setItem('aether-theme', theme);
    const root = document.documentElement;
    switch (theme) {
      case 'Cyberpunk Magenta':
        root.style.setProperty('--accent-primary', '#ec4899');
        root.style.setProperty('--accent-primary-rgb', '236, 72, 153');
        root.style.setProperty('--accent-secondary', '#f43f5e');
        root.style.setProperty('--accent-gradient', 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)');
        root.style.setProperty('--accent-glow', '0 0 20px rgba(236, 72, 153, 0.35)');
        break;
      case 'Auroral Green':
        root.style.setProperty('--accent-primary', '#10b981');
        root.style.setProperty('--accent-primary-rgb', '16, 185, 129');
        root.style.setProperty('--accent-secondary', '#06b6d4');
        root.style.setProperty('--accent-gradient', 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)');
        root.style.setProperty('--accent-glow', '0 0 20px rgba(16, 185, 129, 0.3)');
        break;
      case 'Sunset Amber':
        root.style.setProperty('--accent-primary', '#f59e0b');
        root.style.setProperty('--accent-primary-rgb', '245, 158, 11');
        root.style.setProperty('--accent-secondary', '#ef4444');
        root.style.setProperty('--accent-gradient', 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)');
        root.style.setProperty('--accent-glow', '0 0 20px rgba(245, 158, 11, 0.3)');
        break;
      case 'Aether Cyan':
        root.style.setProperty('--accent-primary', '#06b6d4');
        root.style.setProperty('--accent-primary-rgb', '6, 182, 212');
        root.style.setProperty('--accent-secondary', '#6366f1');
        root.style.setProperty('--accent-gradient', 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)');
        root.style.setProperty('--accent-glow', '0 0 20px rgba(6, 182, 212, 0.3)');
        break;
      case 'Aether Dynamic':
        if (currentSong) {
          extractCoverColors(currentSong.coverUrl);
        } else {
          applyThemeColors(6, 182, 212); // Fallback to cyan
        }
        break;
      default: // Aether Cyan fallback
        root.style.setProperty('--accent-primary', '#06b6d4');
        root.style.setProperty('--accent-primary-rgb', '6, 182, 212');
        root.style.setProperty('--accent-secondary', '#6366f1');
        root.style.setProperty('--accent-gradient', 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)');
        root.style.setProperty('--accent-glow', '0 0 20px rgba(6, 182, 212, 0.3)');
        break;
    }
  }, [theme, currentSong]);

  const parseLrc = (lrcString) => {
    if (!lrcString) return [];
    const lines = lrcString.split('\n');
    const result = [];
    const timeRegex = /\[(\d+):(\d+)(?:\.(\d+))?\]/;

    for (const line of lines) {
      const match = timeRegex.exec(line);
      if (match) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
        const time = min * 60 + sec + ms / 1000;
        const text = line.replace(timeRegex, '').trim();
        if (text) {
          result.push({ time, text });
        }
      }
    }
    return result.sort((a, b) => a.time - b.time);
  };

  const parsePlainLyrics = (plainText, durationSec) => {
    if (!plainText) return [];
    const lines = plainText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    const trackDuration = durationSec || 180;
    const step = trackDuration / (lines.length + 1);
    return lines.map((text, idx) => ({
      time: (idx + 1) * step,
      text
    }));
  };

  const generateFallbackLyrics = (song) => {
    if (!song) return [];
    const MOCK_LYRICS = {
      "demo-1": [
        { time: 0, text: "🌌 [Instrumental Cosmic Intro]" },
        { time: 8, text: "Floating into the neon space..." },
        { time: 16, text: "Aether Drift begins to guide us..." },
        { time: 24, text: "Waves of sound shifting in the dark." },
        { time: 32, text: "Feel the frequency resonance in your ears." },
        { time: 40, text: "🌟 Try tweaking the Audio Equalizer presets!" },
        { time: 48, text: "Select Bass Boost or Acoustic for rich sound." },
        { time: 56, text: "🎨 Toggle accent themes: Emerald Green or Sunset Amber." },
        { time: 64, text: "Smooth animations, fluid curves, custom visualizers." },
        { time: 72, text: "🎹 [Synthesizer Solo Interlude]" },
        { time: 100, text: "We are drifting... drifting away..." },
        { time: 110, text: "Through the indigo nebulae..." },
        { time: 120, text: "Aether Music Player: Designed for audiophiles." },
        { time: 130, text: "All data sessions saved dynamically." },
        { time: 140, text: "Close your eyes and let the soundHelix flow..." },
        { time: 155, text: "🎵 [Chill electronic beat fading out]" }
      ],
      "demo-2": [
        { time: 0, text: "✨ [Luminous Ambient Intro]" },
        { time: 10, text: "Starlight flows through the night sky..." },
        { time: 20, text: "A gentle stream of beats and chords." },
        { time: 30, text: "Highlighting the path, glowing in glassmorphism." },
        { time: 40, text: "Every pixel designed to look premium." },
        { time: 50, text: "Press Space to pause, Left/Right to seek." },
        { time: 60, text: "Press L to add this track to your Favorites!" },
        { time: 70, text: "🎶 [Melodious Piano Bridge]" },
        { time: 100, text: "The stars align, creating music notes..." },
        { time: 110, text: "We are floating in a starlight flow." },
        { time: 125, text: "Thank you for paired programming with us!" },
        { time: 140, text: "Enjoy the high-fidelity Canvas visualizer below." },
        { time: 150, text: "🎵 [Peaceful ambient echo]" }
      ],
      "demo-3": [
        { time: 0, text: "🛸 [Deep Sub-bass Intro]" },
        { time: 12, text: "Launching into deep space voyage..." },
        { time: 24, text: "Engines engaged, visual visualizer active." },
        { time: 36, text: "Exploring the borders of Aether Sound." },
        { time: 48, text: "Audiophile equalizers, heavy rotation suggestion shelf." },
        { time: 60, text: "Drag a song row from Library and drop it on Playlists!" },
        { time: 72, text: "Check your active queue in this sliding panel." },
        { time: 84, text: "🎸 [Heavy Space Bass Solo]" },
        { time: 120, text: "Deep space voyage continues..." },
        { time: 135, text: "No placeholders, real ID3 tags, content header deduplication." },
        { time: 150, text: "Resuming session seek time on refresh." },
        { time: 165, text: "🎵 [Mysterious space echoes fading]" }
      ]
    };

    if (MOCK_LYRICS[song.id]) return MOCK_LYRICS[song.id];

    const title = song.title || "Unknown Track";
    const artist = song.artist || "Unknown Artist";
    return [
      { time: 0, text: `🎵 Listening to "${title}"` },
      { time: 5, text: `Performed by ${artist}` },
      { time: 12, text: "Resonant waves carrying the rhythm..." },
      { time: 22, text: "Web Audio filter chain active and processing..." },
      { time: 35, text: "Drag songs to the sidebar to build your playlist" },
      { time: 48, text: "Equalizer presets applying gains in real time" },
      { time: 65, text: "Aether Music: Your personal local sound hub" },
      { time: 80, text: `Enjoy the beats of "${title}"` },
      { time: 100, text: "Bouncing canvas equalizer tracking the frequency spectrum" },
      { time: 120, text: "Resuming session parameters saved dynamically" },
      { time: 140, text: "🎵 [Music Interlude]" },
      { time: 170, text: `Thank you for streaming ${artist}` },
      { time: 200, text: "🌌 [End of track]" }
    ];
  };

  const fetchLyricsForSong = async (song) => {
    if (!song) return [];
    const mock = generateFallbackLyrics(song);
    if (song.id.startsWith("demo-")) {
      return mock;
    }

    try {
      const cleanArtist = (song.artist || "").replace(/[^\w\s]/gi, '').trim();
      
      // Strip version suffixes (e.g. (Slowed + Reverb), (Nightcore), etc.) for clean lyrics search
      const rawTitle = song.title || "";
      const queryTitle = rawTitle.replace(/\s*[\(\[][^\]\)]*?\b(slowed|reverb|nightcore|speedup|sped\s*up|remix|lofi|lo-fi|live|instrumental|karaoke|cover|duet)\b[^\]\)]*?[\)\]]/gi, '');
      const cleanTitle = queryTitle.replace(/[^\w\s]/gi, '').trim();
      
      const query = encodeURIComponent(`${cleanArtist} ${cleanTitle}`);

      const response = await fetch(`https://lrclib.net/api/search?q=${query}`);
      if (!response.ok) throw new Error("Lyrics request failed");

      const data = await response.json();
      if (data && data.length > 0) {
        const match = data.find(item => item.syncedLyrics) || data.find(item => item.plainLyrics) || data[0];
        
        if (match.syncedLyrics) {
          const parsed = parseLrc(match.syncedLyrics);
          if (parsed && parsed.length > 0) {
            return parsed;
          }
        }
        
        if (match.plainLyrics) {
          const parsed = parsePlainLyrics(match.plainLyrics, song.duration || match.duration);
          if (parsed && parsed.length > 0) {
            return parsed;
          }
        }
      }
      return mock;
    } catch (e) {
      console.warn("Could not load online lyrics for", song.title, ":", e);
      return mock;
    }
  };

  const fetchLyrics = async (song) => {
    if (!song) {
      setLyrics([]);
      return;
    }
    const songId = song.id;
    if (lyricsCacheRef.current[songId]) {
      setLyrics(lyricsCacheRef.current[songId]);
      setLyricsLoading(false);
      return;
    }

    setLyricsLoading(true);
    setLyrics([]);

    let result;
    if (pendingLyricsRequestsRef.current[songId]) {
      result = await pendingLyricsRequestsRef.current[songId];
    } else {
      const promise = fetchLyricsForSong(song);
      pendingLyricsRequestsRef.current[songId] = promise;
      result = await promise;
      lyricsCacheRef.current[songId] = result;
      delete pendingLyricsRequestsRef.current[songId];
    }

    if (currentSongRef.current?.id === songId) {
      setLyrics(result);
      setLyricsLoading(false);
    }
  };

  const searchLyricsManually = async (query) => {
    if (!currentSong) return;
    setLyricsLoading(true);
    setLyrics([]);
    setLyricsOffset(0);

    const mockSong = {
      id: currentSong.id,
      title: query,
      artist: '',
      duration: currentSong.duration
    };

    const result = await fetchLyricsForSong(mockSong);
    lyricsCacheRef.current[currentSong.id] = result;
    setLyrics(result);
    setLyricsLoading(false);
  };

  // Trigger loading of current lyrics and prefetching adjacent songs (2 before and 2 after)
  useEffect(() => {
    if (!currentSong) {
      setLyrics([]);
      return;
    }

    fetchLyrics(currentSong);

    // Prefetch 2 before and 2 after
    if (playQueue.length > 0 && currentQueueIndex !== -1) {
      const indicesToPrefetch = [
        currentQueueIndex - 2,
        currentQueueIndex - 1,
        currentQueueIndex + 1,
        currentQueueIndex + 2
      ].filter(idx => idx >= 0 && idx < playQueue.length && idx !== currentQueueIndex);

      for (const idx of indicesToPrefetch) {
        const adjacentSong = playQueue[idx];
        if (adjacentSong) {
          const songId = adjacentSong.id;
          if (!lyricsCacheRef.current[songId] && !pendingLyricsRequestsRef.current[songId]) {
            const promise = fetchLyricsForSong(adjacentSong).then(result => {
              lyricsCacheRef.current[songId] = result;
              delete pendingLyricsRequestsRef.current[songId];
              return result;
            }).catch(() => {
              delete pendingLyricsRequestsRef.current[songId];
              return [];
            });
            pendingLyricsRequestsRef.current[songId] = promise;
          }
        }
      }
    }
  }, [currentSong, playQueue, currentQueueIndex]);

  const createReverbImpulseResponse = (ctx, duration, decay) => {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const percent = i / length;
      const decayFactor = Math.pow(1 - percent, decay);
      left[i] = (Math.random() * 2 - 1) * decayFactor;
      right[i] = (Math.random() * 2 - 1) * decayFactor;
    }
    return impulse;
  };

  const applyReverbPreset = (presetName) => {
    setReverbPreset(presetName);
    const reverbNode = reverbNodeRef.current;
    const wetGain = reverbWetGainRef.current;
    const dryGain = reverbDryGainRef.current;
    if (!reverbNode || !wetGain || !dryGain || !webAudioCtxRef.current) return;

    if (presetName === 'Off') {
      wetGain.gain.setTargetAtTime(0, webAudioCtxRef.current.currentTime, 0.1);
      dryGain.gain.setTargetAtTime(1.0, webAudioCtxRef.current.currentTime, 0.1);
    } else {
      let duration = 1.5;
      let decay = 2.0;
      let wetLevel = 0.3;

      if (presetName === 'Room') {
        duration = 0.8;
        decay = 1.5;
        wetLevel = 0.25;
      } else if (presetName === 'Concert Hall') {
        duration = 2.5;
        decay = 3.0;
        wetLevel = 0.45;
      } else if (presetName === 'Cathedral') {
        duration = 4.5;
        decay = 4.5;
        wetLevel = 0.6;
      }

      const impulse = createReverbImpulseResponse(webAudioCtxRef.current, duration, decay);
      reverbNode.buffer = impulse;

      wetGain.gain.setTargetAtTime(wetLevel, webAudioCtxRef.current.currentTime, 0.1);
      dryGain.gain.setTargetAtTime(1.0 - wetLevel * 0.5, webAudioCtxRef.current.currentTime, 0.1);
    }
  };

  // Web Audio Context initializer
  const initWebAudio = () => {
    if (webAudioCtxRef.current) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      webAudioCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const bass = ctx.createBiquadFilter();
      bass.type = 'lowshelf';
      bass.frequency.value = 150;

      const mid = ctx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 1000;
      mid.Q.value = 1;

      const treble = ctx.createBiquadFilter();
      treble.type = 'highshelf';
      treble.frequency.value = 6000;

      eqFiltersRef.current = { bass, mid, treble };

      const reverb = ctx.createConvolver();
      reverbNodeRef.current = reverb;

      const wetGain = ctx.createGain();
      wetGain.gain.value = 0;
      reverbWetGainRef.current = wetGain;

      const dryGain = ctx.createGain();
      dryGain.gain.value = 1.0;
      reverbDryGainRef.current = dryGain;

      const source1 = ctx.createMediaElementSource(audio1Ref.current);
      const source2 = ctx.createMediaElementSource(audio2Ref.current);
      sourceRef.current = source1;

      source1.connect(bass);
      source2.connect(bass);

      bass.connect(mid);
      mid.connect(treble);

      treble.connect(dryGain);
      treble.connect(reverb);
      reverb.connect(wetGain);

      dryGain.connect(analyser);
      wetGain.connect(analyser);

      // Construct and wire DynamicsCompressorNode for Volume Normalization
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      compressorNodeRef.current = compressor;

      if (isNormalized) {
        analyser.connect(compressor);
        compressor.connect(ctx.destination);
      } else {
        analyser.connect(ctx.destination);
      }

      // Apply initial gains from the current preset/manual gains
      bass.gain.value = eqGains.bass;
      mid.gain.value = eqGains.mid;
      treble.gain.value = eqGains.treble;

      if (reverbPreset !== 'Off') {
        applyReverbPreset(reverbPreset);
      }
    } catch (e) {
      console.warn("Failed to init Web Audio API:", e);
    }
  };

  const toggleNormalization = (enabled) => {
    setIsNormalized(enabled);
    localStorage.setItem('aether-normalized', enabled.toString());
    if (!webAudioCtxRef.current || !analyserRef.current) return;
    try {
      analyserRef.current.disconnect();
      if (enabled) {
        if (!compressorNodeRef.current) {
          const comp = webAudioCtxRef.current.createDynamicsCompressor();
          comp.threshold.value = -24;
          comp.knee.value = 30;
          comp.ratio.value = 12;
          comp.attack.value = 0.003;
          comp.release.value = 0.25;
          compressorNodeRef.current = comp;
        }
        analyserRef.current.connect(compressorNodeRef.current);
        compressorNodeRef.current.connect(webAudioCtxRef.current.destination);
      } else {
        analyserRef.current.connect(webAudioCtxRef.current.destination);
      }
    } catch (e) {
      console.warn("Failed to toggle normalization:", e);
    }
  };

  const applyEqPreset = (presetName) => {
    setEqPreset(presetName);
    const filters = eqFiltersRef.current;
    if (!filters || !filters.bass) return;

    let bassGain = 0;
    let midGain = 0;
    let trebleGain = 0;

    switch (presetName) {
      case 'Bass Boost':
        bassGain = 7;
        midGain = 0;
        trebleGain = -2;
        break;
      case 'Treble Boost':
        bassGain = -2;
        midGain = 1;
        trebleGain = 7;
        break;
      case 'Vocal':
        bassGain = -3;
        midGain = 5;
        trebleGain = 2;
        break;
      case 'Acoustic':
        bassGain = 3;
        midGain = 1;
        trebleGain = 3;
        break;
      case 'Chill':
        bassGain = 4;
        midGain = -1;
        trebleGain = 1;
        break;
      default: // Flat
        bassGain = 0;
        midGain = 0;
        trebleGain = 0;
        break;
    }

    setEqGains({ bass: bassGain, mid: midGain, treble: trebleGain });

    if (webAudioCtxRef.current) {
      const now = webAudioCtxRef.current.currentTime;
      filters.bass.gain.linearRampToValueAtTime(bassGain, now + 0.1);
      filters.mid.gain.linearRampToValueAtTime(midGain, now + 0.1);
      filters.treble.gain.linearRampToValueAtTime(trebleGain, now + 0.1);
    } else {
      filters.bass.gain.value = bassGain;
      filters.mid.gain.value = midGain;
      filters.treble.gain.value = trebleGain;
    }
  };

  const setManualEqGain = (band, gainValue) => {
    const clamped = Math.max(-12, Math.min(12, gainValue));
    const newGains = { ...eqGains, [band]: clamped };
    setEqGains(newGains);
    localStorage.setItem('aether-eq-gains', JSON.stringify(newGains));
    setEqPreset('Custom');

    const filters = eqFiltersRef.current;
    if (!filters || !filters[band]) return;

    if (webAudioCtxRef.current) {
      const now = webAudioCtxRef.current.currentTime;
      filters[band].gain.linearRampToValueAtTime(clamped, now + 0.1);
    } else {
      filters[band].gain.value = clamped;
    }
  };

  // Derive recentlyPlayed song objects from IDs
  const recentlyPlayed = recentlyPlayedIds
    .map(id => songs.find(s => s.id === id))
    .filter(Boolean);

  // Fetch songs catalog & Restore Session
  useEffect(() => {
    const loadSongs = async () => {
      try {
        const res = await fetch('/songs.json');
        if (!res.ok) throw new Error('Failed to load songs.json');
        const data = await res.json();
        
        const rawSongs = data && data.length > 0 ? data : DEMO_SONGS;
        // Deduplicate songs by id to prevent duplicates in library
        const activeSongs = [];
        const seenIds = new Set();
        rawSongs.forEach(song => {
          if (song && song.id && !seenIds.has(song.id)) {
            seenIds.add(song.id);
            activeSongs.push(song);
          }
        });

        setSongs(activeSongs);
        setIsDemoMode(!(data && data.length > 0));

        // Load cached keys from IndexedDB
        try {
          const cachedUrls = await getAllCachedUrls();
          cachedUrls.forEach(url => cachedUrlsSetRef.current.add(url));
          console.log(`[Cache Load] Loaded ${cachedUrls.length} cached tracks from IndexedDB.`);
        } catch (e) {
          console.warn("Failed to load cached keys:", e);
        }
        
        // Restore session details
        const lastSongId = localStorage.getItem('aether-last-song-id');
        const lastTime = parseFloat(localStorage.getItem('aether-last-time') || '0');
        const lastQueueIndex = parseInt(localStorage.getItem('aether-last-queue-index') || '-1', 10);
        const lastQueueIds = JSON.parse(localStorage.getItem('aether-last-queue-ids') || '[]');
        
        if (lastSongId) {
          const song = activeSongs.find(s => s.id === lastSongId);
          if (song) {
            setCurrentSong(song);
            
            // Restore queue
            if (lastQueueIds.length > 0) {
              const restoredQueue = lastQueueIds
                .map(id => activeSongs.find(s => s.id === id))
                .filter(Boolean);
              if (restoredQueue.length > 0) {
                setPlayQueue(restoredQueue);
                setOriginalQueue(restoredQueue);
                setCurrentQueueIndex(lastQueueIndex !== -1 ? lastQueueIndex : 0);
              }
            } else {
              setPlayQueue(activeSongs);
              setOriginalQueue(activeSongs);
              const index = activeSongs.findIndex(s => s.id === song.id);
              setCurrentQueueIndex(index !== -1 ? index : 0);
            }
            
            // Load audio source and seek position without playing
            const activeAudio = activeAudioIndexRef.current === 1 ? audio1Ref.current : audio2Ref.current;
            loadAudioSrc(activeAudio, song.audioUrl, () => {
              if (lastTime > 0) {
                activeAudio.currentTime = lastTime;
                setCurrentTime(lastTime);
                lastSavedTimeRef.current = Math.floor(lastTime);
              }
            });
          } else {
            isInitialLoadRef.current = false;
          }
        } else {
          isInitialLoadRef.current = false;
        }
      } catch (err) {
        console.warn('Could not read songs.json, falling back to demo tracks.', err);
        setSongs(DEMO_SONGS);
        setIsDemoMode(true);
        isInitialLoadRef.current = false;
      }
    };
    loadSongs();
  }, []);

  // Save favorites & volume
  useEffect(() => {
    localStorage.setItem('aether-favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('aether-volume', volume.toString());
    if (!isMuted) {
      audio1Ref.current.volume = volume;
      audio2Ref.current.volume = volume;
    }
  }, [volume, isMuted]);

  // Save play counts & recent plays
  useEffect(() => {
    localStorage.setItem('aether-play-counts', JSON.stringify(playCounts));
  }, [playCounts]);

  useEffect(() => {
    localStorage.setItem('aether-recent-played-ids', JSON.stringify(recentlyPlayedIds));
  }, [recentlyPlayedIds]);

  // Save playlists
  useEffect(() => {
    localStorage.setItem('aether-playlists', JSON.stringify(playlists));
  }, [playlists]);

  // Save player preferences
  useEffect(() => {
    localStorage.setItem('aether-shuffle', shuffle.toString());
  }, [shuffle]);

  useEffect(() => {
    localStorage.setItem('aether-repeat', repeat);
  }, [repeat]);

  // Save queue details
  useEffect(() => {
    if (playQueue.length > 0) {
      const ids = playQueue.map(s => s.id);
      localStorage.setItem('aether-last-queue-ids', JSON.stringify(ids));
    }
    localStorage.setItem('aether-last-queue-index', currentQueueIndex.toString());
  }, [playQueue, currentQueueIndex]);

  const isCrossfadingRef = useRef(false);

  const loadAudioSrc = (audioElement, url, startPlayCallback) => {
    if (objectUrlMapRef.current.has(audioElement)) {
      try {
        URL.revokeObjectURL(objectUrlMapRef.current.get(audioElement));
      } catch (e) {}
      objectUrlMapRef.current.delete(audioElement);
    }

    if (cachedUrlsSetRef.current.has(url)) {
      getCachedAudio(url).then(cachedBlob => {
        if (cachedBlob) {
          const objectUrl = URL.createObjectURL(cachedBlob);
          objectUrlMapRef.current.set(audioElement, objectUrl);
          audioElement.src = objectUrl;
          audioElement.load();
          if (startPlayCallback) startPlayCallback();
        } else {
          audioElement.src = url;
          audioElement.load();
          if (startPlayCallback) startPlayCallback();
        }
      }).catch(() => {
        audioElement.src = url;
        audioElement.load();
        if (startPlayCallback) startPlayCallback();
      });
    } else {
      audioElement.src = url;
      audioElement.load();
      if (startPlayCallback) startPlayCallback();

      if (url.startsWith('/music/')) {
        fetch(url)
          .then(res => {
            if (!res.ok) throw new Error("Fetch failed");
            return res.blob();
          })
          .then(blob => {
            cacheAudio(url, blob);
            cachedUrlsSetRef.current.add(url);
          })
          .catch(err => {
            console.warn("Background cache error:", err.message);
          });
      }
    }
  };

  const transitionTrack = (nextSong, startPlaying = true) => {
    if (!nextSong) return;

    initWebAudio();
    if (webAudioCtxRef.current && webAudioCtxRef.current.state === 'suspended') {
      webAudioCtxRef.current.resume();
    }

    const durationVal = crossfadeDuration;

    // If crossfade is disabled (0 seconds) or audio is not playing, do instant switch
    if (durationVal === 0 || !isPlaying || isInitialLoadRef.current) {
      const activeAudio = activeAudioIndexRef.current === 1 ? audio1Ref.current : audio2Ref.current;
      loadAudioSrc(activeAudio, nextSong.audioUrl, () => {
        activeAudio.currentTime = 0;
        setCurrentTime(0);
        lastSavedTimeRef.current = 0;
        setCurrentSong(nextSong);

        if (startPlaying) {
          activeAudio.play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      });
      return;
    }

    // Dual-audio crossfade transition
    if (isCrossfadingRef.current) {
      isCrossfadingRef.current = false;
    }

    isCrossfadingRef.current = true;

    const currentAudio = activeAudioIndexRef.current === 1 ? audio1Ref.current : audio2Ref.current;
    const nextAudio = activeAudioIndexRef.current === 1 ? audio2Ref.current : audio1Ref.current;

    loadAudioSrc(nextAudio, nextSong.audioUrl, () => {
      nextAudio.currentTime = 0;
      const targetVolume = isMuted ? 0 : volume;

      nextAudio.volume = 0;
      currentAudio.volume = targetVolume;

      nextAudio.play().then(() => {
        const steps = 30;
        const stepTime = (durationVal * 1000) / steps;
        let step = 0;

        const interval = setInterval(() => {
          if (!isCrossfadingRef.current) {
            clearInterval(interval);
            return;
          }

          step++;
          const ratio = step / steps;
          
          nextAudio.volume = targetVolume * ratio;
          currentAudio.volume = targetVolume * (1 - ratio);

          if (step >= steps) {
            clearInterval(interval);
            currentAudio.pause();
            currentAudio.volume = targetVolume;
            
            activeAudioIndexRef.current = activeAudioIndexRef.current === 1 ? 2 : 1;
            setActiveAudioIndex(activeAudioIndexRef.current);
            isCrossfadingRef.current = false;
          }
        }, stepTime);
      }).catch((err) => {
        console.warn("Failed to play next audio during crossfade:", err);
        currentAudio.pause();
        currentAudio.volume = targetVolume;
        nextAudio.volume = targetVolume;
        nextAudio.play().then(() => {
          activeAudioIndexRef.current = activeAudioIndexRef.current === 1 ? 2 : 1;
          setActiveAudioIndex(activeAudioIndexRef.current);
        }).catch(() => setIsPlaying(false));
        isCrossfadingRef.current = false;
      });
    });

    setCurrentSong(nextSong);
  };

  // Audio event listeners
  useEffect(() => {
    const a1 = audio1Ref.current;
    const a2 = audio2Ref.current;

    const handleTimeUpdate = (e) => {
      const activeAudio = activeAudioIndexRef.current === 1 ? a1 : a2;
      if (e.target === activeAudio) {
        setCurrentTime(activeAudio.currentTime);
        const sec = Math.floor(activeAudio.currentTime);
        if (sec !== lastSavedTimeRef.current) {
          lastSavedTimeRef.current = sec;
          localStorage.setItem('aether-last-time', sec.toString());
        }

        // Auto trigger crossfade before ending!
        if (
          crossfadeDuration > 0 && 
          !isCrossfadingRef.current && 
          activeAudio.duration > 0 && 
          activeAudio.currentTime >= activeAudio.duration - crossfadeDuration
        ) {
          nextTrack();
        }
      }
    };

    const handleDurationChange = (e) => {
      const activeAudio = activeAudioIndexRef.current === 1 ? a1 : a2;
      if (e.target === activeAudio) {
        setDuration(activeAudio.duration || 0);
      }
    };

    const handleEnded = (e) => {
      const activeAudio = activeAudioIndexRef.current === 1 ? a1 : a2;
      if (e.target === activeAudio) {
        if (crossfadeDuration === 0) {
          nextTrack();
        }
      }
    };

    a1.addEventListener('timeupdate', handleTimeUpdate);
    a1.addEventListener('durationchange', handleDurationChange);
    a1.addEventListener('ended', handleEnded);

    a2.addEventListener('timeupdate', handleTimeUpdate);
    a2.addEventListener('durationchange', handleDurationChange);
    a2.addEventListener('ended', handleEnded);

    return () => {
      a1.removeEventListener('timeupdate', handleTimeUpdate);
      a1.removeEventListener('durationchange', handleDurationChange);
      a1.removeEventListener('ended', handleEnded);

      a2.removeEventListener('timeupdate', handleTimeUpdate);
      a2.removeEventListener('durationchange', handleDurationChange);
      a2.removeEventListener('ended', handleEnded);
    };
  }, [playQueue, currentQueueIndex, repeat, shuffle, crossfadeDuration, volume, isMuted]);

  // Handle source changes
  useEffect(() => {
    if (!currentSong) return;
    
    // Skip play increment on the initial load of page session
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }
    
    // Record play statistics
    setPlayCounts(prev => ({
      ...prev,
      [currentSong.id]: (prev[currentSong.id] || 0) + 1
    }));
    setRecentlyPlayedIds(prev => {
      const filtered = prev.filter(id => id !== currentSong.id);
      return [currentSong.id, ...filtered].slice(0, 12);
    });

    localStorage.setItem('aether-last-song-id', currentSong.id);

    transitionTrack(currentSong, isPlaying);
  }, [currentSong]);

  // Playlists API
  const createPlaylist = (name) => {
    if (!name || !name.trim()) return null;
    const playlistId = `playlist-${Date.now()}`;
    const cleanName = name.toLowerCase().replace(/[^a-z0-9\s]/gi, '').trim();
    const query = encodeURIComponent(cleanName || 'music');
    // Generate a random lock ID to ensure LoremFlickr returns a consistent image
    const randomLock = Math.floor(Math.random() * 100000) + 1;
    const coverUrl = `https://loremflickr.com/320/320/${query}?lock=${randomLock}`;

    const newPlaylist = {
      id: playlistId,
      name: name.trim(),
      songIds: [],
      coverUrl: coverUrl
    };
    setPlaylists(prev => [...prev, newPlaylist]);
    showToast(`Created playlist "${name.trim()}"`);
    
    return newPlaylist;
  };

  const deletePlaylist = (id) => {
    const pl = playlists.find(p => p.id === id);
    if (pl) showToast(`Deleted playlist "${pl.name}"`);
    setPlaylists(prev => prev.filter(p => p.id !== id));
  };

  const addSongToPlaylist = (playlistId, songId) => {
    const pl = playlists.find(p => p.id === playlistId);
    const song = songs.find(s => s.id === songId);
    if (pl && song) {
      if (pl.songIds.includes(songId)) {
        showToast(`"${song.title}" is already in "${pl.name}"`);
        return;
      }
      showToast(`Added "${song.title}" to "${pl.name}"`);
    }
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        if (p.songIds.includes(songId)) return p;
        return {
          ...p,
          songIds: [...p.songIds, songId]
        };
      }
      return p;
    }));
  };

  const removeSongFromPlaylist = (playlistId, songId) => {
    const pl = playlists.find(p => p.id === playlistId);
    const song = songs.find(s => s.id === songId);
    if (pl && song) {
      showToast(`Removed "${song.title}" from "${pl.name}"`);
    }
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return {
          ...p,
          songIds: p.songIds.filter(id => id !== songId)
        };
      }
      return p;
    }));
  };

  // Add Song to Play Queue (Play Next)
  const addToQueue = (song) => {
    if (!song) return;
    
    setPlayQueue(prev => {
      const index = currentQueueIndex !== -1 ? currentQueueIndex : 0;
      const newQueue = [...prev];
      newQueue.splice(index + 1, 0, song);
      return newQueue;
    });

    setOriginalQueue(prev => {
      const index = prev.findIndex(s => s.id === currentSong?.id);
      const newOriginal = [...prev];
      if (index !== -1) {
        newOriginal.splice(index + 1, 0, song);
      } else {
        newOriginal.push(song);
      }
      return newOriginal;
    });

    showToast(`Added "${song.title}" to play next`);
  };

  // Remove Song from Play Queue
  const removeFromQueue = (indexToRemove) => {
    if (indexToRemove < 0) return;
    
    setPlayQueue(prev => {
      if (prev.length <= 1) {
        showToast("Cannot remove the last song from the queue");
        return prev;
      }
      
      const newQueue = prev.filter((_, idx) => idx !== indexToRemove);
      
      if (indexToRemove === currentQueueIndex) {
        const nextIndex = indexToRemove < newQueue.length ? indexToRemove : newQueue.length - 1;
        setCurrentQueueIndex(nextIndex);
        setCurrentSong(newQueue[nextIndex]);
      } else if (indexToRemove < currentQueueIndex) {
        setCurrentQueueIndex(prevIndex => prevIndex - 1);
      }
      
      return newQueue;
    });
  };

  // Clear Play Queue (keeps only the currently playing song)
  const clearQueue = () => {
    if (!currentSong) return;
    setPlayQueue([currentSong]);
    setCurrentQueueIndex(0);
    showToast("Queue cleared");
  };

  // Reorder queue item
  const reorderQueue = (sourceIndex, targetIndex) => {
    if (sourceIndex < 0 || sourceIndex >= playQueue.length || targetIndex < 0 || targetIndex >= playQueue.length) return;
    if (sourceIndex === targetIndex) return;

    setPlayQueue(prev => {
      const nextQueue = [...prev];
      const [movedItem] = nextQueue.splice(sourceIndex, 1);
      nextQueue.splice(targetIndex, 0, movedItem);
      
      // Update current queue index if the currently playing song moved or indices shifted
      if (currentQueueIndex === sourceIndex) {
        setCurrentQueueIndex(targetIndex);
      } else if (sourceIndex < currentQueueIndex && targetIndex >= currentQueueIndex) {
        setCurrentQueueIndex(prevIdx => prevIdx - 1);
      } else if (sourceIndex > currentQueueIndex && targetIndex <= currentQueueIndex) {
        setCurrentQueueIndex(prevIdx => prevIdx + 1);
      }
      
      return nextQueue;
    });
  };

  // Play a specific track
  const playTrack = (song, trackList = songs) => {
    if (!song) return;

    initWebAudio();
    if (webAudioCtxRef.current && webAudioCtxRef.current.state === 'suspended') {
      webAudioCtxRef.current.resume();
    }

    // Set queue
    let listToUse = [...trackList];
    if (shuffle) {
      const otherTracks = listToUse.filter(t => t.id !== song.id);
      for (let i = otherTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherTracks[i], otherTracks[j]] = [otherTracks[j], otherTracks[i]];
      }
      listToUse = [song, ...otherTracks];
      setPlayQueue(listToUse);
      setCurrentQueueIndex(0);
    } else {
      setPlayQueue(listToUse);
      const index = listToUse.findIndex(t => t.id === song.id);
      setCurrentQueueIndex(index !== -1 ? index : 0);
    }

    setOriginalQueue(trackList);
    
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      setIsPlaying(true);
      setCurrentSong(song);
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!currentSong) {
      if (songs.length > 0) {
        playTrack(songs[0]);
      }
      return;
    }

    initWebAudio();
    if (webAudioCtxRef.current && webAudioCtxRef.current.state === 'suspended') {
      webAudioCtxRef.current.resume();
    }

    const activeAudio = activeAudioIndexRef.current === 1 ? audio1Ref.current : audio2Ref.current;
    if (isPlaying) {
      activeAudio.pause();
      setIsPlaying(false);
    } else {
      activeAudio.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.warn("Playback error:", err);
          setIsPlaying(false);
        });
    }
  };

  // Play next track
  const nextTrack = () => {
    if (playQueue.length === 0) return;

    if (repeat === 'one') {
      const activeAudio = activeAudioIndexRef.current === 1 ? audio1Ref.current : audio2Ref.current;
      activeAudio.currentTime = 0;
      activeAudio.play().catch(() => setIsPlaying(false));
      return;
    }

    let nextIndex = currentQueueIndex + 1;
    if (nextIndex >= playQueue.length) {
      if (repeat === 'all') {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        const activeAudio = activeAudioIndexRef.current === 1 ? audio1Ref.current : audio2Ref.current;
        activeAudio.pause();
        return;
      }
    }

    setCurrentQueueIndex(nextIndex);
    setCurrentSong(playQueue[nextIndex]);
  };

  // Play previous track
  const prevTrack = () => {
    if (playQueue.length === 0) return;

    const activeAudio = activeAudioIndexRef.current === 1 ? audio1Ref.current : audio2Ref.current;
    if (activeAudio.currentTime > 3) {
      activeAudio.currentTime = 0;
      return;
    }

    let prevIndex = currentQueueIndex - 1;
    if (prevIndex < 0) {
      if (repeat === 'all') {
        prevIndex = playQueue.length - 1;
      } else {
        activeAudio.currentTime = 0;
        return;
      }
    }

    setCurrentQueueIndex(prevIndex);
    setCurrentSong(playQueue[prevIndex]);
  };

  // Seek within the song
  const seek = (time) => {
    const activeAudio = activeAudioIndexRef.current === 1 ? audio1Ref.current : audio2Ref.current;
    activeAudio.currentTime = time;
    setCurrentTime(time);
    localStorage.setItem('aether-last-time', Math.floor(time).toString());
  };

  // Adjust volume
  const adjustVolume = (vol) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolume(clamped);
    if (clamped > 0) {
      setIsMuted(false);
    }
    audio1Ref.current.volume = clamped;
    audio2Ref.current.volume = clamped;
  };

  // Toggle Mute
  const toggleMute = () => {
    if (isMuted) {
      audio1Ref.current.volume = volume;
      audio2Ref.current.volume = volume;
      setIsMuted(false);
    } else {
      audio1Ref.current.volume = 0;
      audio2Ref.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Start / stop sleep timer
  const startSleepTimer = (minutes) => {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }

    if (minutes === 0) {
      setSleepTimer(null);
      if (isFadingOutRef.current && originalVolumeRef.current !== null) {
        const activeAudio = activeAudioIndexRef.current === 1 ? audio1Ref.current : audio2Ref.current;
        activeAudio.volume = originalVolumeRef.current;
        originalVolumeRef.current = null;
      }
      isFadingOutRef.current = false;
      return;
    }

    const durationSeconds = minutes * 60;
    setSleepTimer(durationSeconds);
    let secondsLeft = durationSeconds;

    sleepTimerRef.current = setInterval(() => {
      secondsLeft--;
      setSleepTimer(secondsLeft);

      // Smooth fade out in the last 15 seconds
      if (secondsLeft <= 15 && secondsLeft > 0) {
        if (!isFadingOutRef.current) {
          isFadingOutRef.current = true;
          originalVolumeRef.current = volume;
        }
        const activeAudio = activeAudioIndexRef.current === 1 ? audio1Ref.current : audio2Ref.current;
        const volumeFactor = secondsLeft / 15;
        activeAudio.volume = originalVolumeRef.current * volumeFactor;
      }

      if (secondsLeft <= 0) {
        clearInterval(sleepTimerRef.current);
        sleepTimerRef.current = null;
        setSleepTimer(null);
        
        const activeAudio = activeAudioIndexRef.current === 1 ? audio1Ref.current : audio2Ref.current;
        activeAudio.pause();
        setIsPlaying(false);

        if (originalVolumeRef.current !== null) {
          activeAudio.volume = originalVolumeRef.current;
          originalVolumeRef.current = null;
        }
        isFadingOutRef.current = false;
        showToast("Sleep timer finished. Playback paused.");
      }
    }, 1000);
  };

  // Toggle favorite status
  const toggleFavorite = (id) => {
    const song = songs.find(s => s.id === id);
    setFavorites(prev => {
      const isFav = prev.includes(id);
      if (song) {
        showToast(isFav ? `Removed "${song.title}" from Favorites` : `Added "${song.title}" to Favorites`);
      }
      if (isFav) {
        return prev.filter(fId => fId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Toggle shuffle
  const toggleShuffle = () => {
    setShuffle(prev => {
      const nextShuffle = !prev;
      if (nextShuffle && currentSong) {
        const otherTracks = originalQueue.filter(t => t.id !== currentSong.id);
        for (let i = otherTracks.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [otherTracks[i], otherTracks[j]] = [otherTracks[j], otherTracks[i]];
        }
        const newQueue = [currentSong, ...otherTracks];
        setPlayQueue(newQueue);
        setCurrentQueueIndex(0);
      } else if (currentSong) {
        setPlayQueue(originalQueue);
        const index = originalQueue.findIndex(t => t.id === currentSong.id);
        setCurrentQueueIndex(index !== -1 ? index : 0);
      }
      return nextShuffle;
    });
  };

  // Toggle repeat
  const toggleRepeat = () => {
    setRepeat(prev => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  };

  const totalSeconds = Object.keys(playCounts).reduce((acc, id) => {
    const song = songs.find(s => s.id === id);
    return acc + (playCounts[id] || 0) * (song ? song.duration : 180);
  }, 0);
  const totalMinutes = Math.round(totalSeconds / 60);

  return (
    <AudioContext.Provider value={{
      songs,
      isDemoMode,
      currentSong,
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      favorites,
      shuffle,
      repeat,
      playQueue,
      playCounts,
      recentlyPlayed,
      playlists,
      toast,
      showToast,
      createPlaylist,
      deletePlaylist,
      addSongToPlaylist,
      removeSongFromPlaylist,
      addToQueue,
      playTrack,
      togglePlay,
      nextTrack,
      prevTrack,
      seek,
      adjustVolume,
      toggleMute,
      toggleFavorite,
      toggleShuffle,
      toggleRepeat,
      eqPreset,
      applyEqPreset,
      eqGains,
      setManualEqGain,
      reverbPreset,
      applyReverbPreset,
      crossfadeDuration,
      setCrossfadeDuration,
      sleepTimer,
      startSleepTimer,
      lyricsOffset,
      setLyricsOffset,
      fetchLyricsForSong,
      setLyrics,
      theme,
      setTheme,
      visualizerMode,
      cycleVisualizerMode,
      analyserRef,
      activeAudioRef,
      removeFromQueue,
      clearQueue,
      showQueue,
      setShowQueue,
      showLyrics,
      setShowLyrics,
      toggleQueue,
      toggleLyrics,
      lyrics,
      lyricsLoading,
      fetchLyrics,
      searchLyricsManually,
      isNormalized,
      toggleNormalization,
      isKaraokeMode,
      setIsKaraokeMode,
      reorderQueue,
      activeAccessories,
      setActiveAccessories,
      autoMoodRing,
      setAutoMoodRing,
      streak,
      setStreak,
      totalMinutes
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);
