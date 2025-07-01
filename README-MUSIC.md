# 🎵 Jak dodać prawdziwy Darude - Sandstorm

## Problem
Obecnie używamy placeholder audio (dzwoneczki) zamiast prawdziwego Sandstorm ze względów licencyjnych.

## Rozwiązanie

### Opcja 1: Lokalny plik MP3
1. Pobierz Darude - Sandstorm MP3
2. Umieść plik w folderze `public/` jako `sandstorm.mp3`
3. W `src/App.tsx` zmień linię 167:
```jsx
// Zmień z:
<source src="https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" type="audio/wav" />

// Na:
<source src="/sandstorm.mp3" type="audio/mpeg" />
```

### Opcja 2: YouTube Audio (wymaga dodatkowej biblioteki)
```bash
npm install react-youtube
```

### Opcja 3: Spotify Web Playback SDK
Dla prawdziwego streamingu muzyki.

### Opcja 4: Darmowe alternatywy
- Freesound.org
- Zapsplat.com
- Incompetech.com

## Aktualny stan
- ✅ Pełny system muzyczny działa
- ✅ Kontrola głośności
- ✅ Play/Pause
- ✅ Animowany equalizer
- ✅ Keyboard shortcuts (SPACEBAR)
- ❌ Prawdziwy Sandstorm (placeholder audio)

## Jak to naprawić
Wystarczy podmienić URL w audio source na prawdziwy plik MP3!