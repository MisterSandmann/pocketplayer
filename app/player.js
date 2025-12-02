// app/player.js
window.addEventListener('DOMContentLoaded', async () => {
    // Hintergrund über preload.js laden (funktioniert auch im Build)
  const bgPath = window.pocketPaths.background.replace(/\\/g, '/');
  const songsDir = window.pocketPaths.songsDir.replace(/\\/g, '/');

  console.log('✅ Background image path:', bgPath);
  console.log('🎵 Songs dir:', songsDir);

  // Hintergrundbild auf Body anwenden
  document.body.style.backgroundImage = `url('file://${bgPath}')`;
  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundPosition = 'center';
  document.body.style.backgroundRepeat = 'no-repeat';
  document.body.style.backgroundColor = '#000'; // Fallback
    // UI-Refs
    const audio = document.getElementById('audio');
    const title = document.getElementById('song-title');
    const playPauseBtn = document.getElementById('play-pause');
    const nextBtn = document.getElementById('next');
    const prevBtn = document.getElementById('prev');
    const cover = document.getElementById('cover');
    const seek = document.getElementById('seek');
    const curTime = document.getElementById('current-time');
    const duration = document.getElementById('duration');
  
    let songs = [];
    let currentIndex = 0;
    let isPlaying = false;
    let isSeeking = false; // verhindert „Springen“ während Drag
  
    const formatTitle = (filename) => filename.replace(/\.[^/.]+$/, '');
    const fmt = (sec) => {
      if (!isFinite(sec) || sec < 0) sec = 0;
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    };
  
    try {
      songs = await window.pocketAPI.getSongs();
    } catch (e) {
      console.error(e);
      title.textContent = 'Fehler beim Laden der Songs';
    }
  
    if (!Array.isArray(songs) || songs.length === 0) {
      title.textContent = 'Keine Songs gefunden 🎵';
      playPauseBtn.disabled = nextBtn.disabled = prevBtn.disabled = true;
      return;
    }
  
    function loadSong(index) {
      if (index < 0 || index >= songs.length) return;
      const filename = songs[index];
      audio.src = `../assets/songs/${filename}`;
      title.textContent = formatTitle(filename);
      cover.src = '../assets/images/Mindfieldcover.png';
      // Reset Progress
      seek.value = 0;
      curTime.textContent = '0:00';
      duration.textContent = '0:00';
      // ✅ Button-Bild an Wiedergabestatus anpassen
      const playImg = playPauseBtn.querySelector('img');
      playImg.src = isPlaying
      ? '../assets/images/pausebutton.png'
      : '../assets/images/playbutton.png';
    }
  
    function playCurrent() {
      audio.play().catch(err => console.error('Play error:', err));
      isPlaying = true;
      // ✅ Icon auf „Pause“ wechseln
     const playImg = playPauseBtn.querySelector('img');
     playImg.src = '../assets/images/pausebutton.png';
    }
  
    function pauseCurrent() {
      audio.pause();
      isPlaying = false;
      // ✅ Icon auf „Play" wechseln
     const playImg = playPauseBtn.querySelector('img');
     playImg.src = '../assets/images/playbutton.png';
    }
  
    // Buttons
    playPauseBtn.addEventListener('click', () => (isPlaying ? pauseCurrent() : playCurrent()));
    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % songs.length;
      loadSong(currentIndex);
      playCurrent();
    });
    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + songs.length) % songs.length;
      loadSong(currentIndex);
      playCurrent();
    });
  
    // Fortschritt: wenn Metadaten geladen sind, Dauer setzen
    audio.addEventListener('loadedmetadata', () => {
      duration.textContent = fmt(audio.duration);
    });
  
    // Fortschritt: während der Wiedergabe Balken updaten
    audio.addEventListener('timeupdate', () => {
      if (isSeeking) return; // nicht überschreiben, wenn der User gerade zieht
      if (audio.duration > 0) {
        const pct = (audio.currentTime / audio.duration) * 100;
        seek.value = pct;
        curTime.textContent = fmt(audio.currentTime);
      }
    });
  
    // Seek: Drag start
    seek.addEventListener('mousedown', () => (isSeeking = true));
    seek.addEventListener('touchstart', () => (isSeeking = true));
  
    // Seek: während Drag (optional live anzeigen)
    seek.addEventListener('input', () => {
      if (audio.duration > 0) {
        const newTime = (seek.value / 100) * audio.duration;
        curTime.textContent = fmt(newTime);
      }
    });
  
    // Seek: loslassen → springen
    const finishSeek = () => {
      if (audio.duration > 0) {
        const newTime = (seek.value / 100) * audio.duration;
        audio.currentTime = newTime;
      }
      isSeeking = false;
    };
    seek.addEventListener('mouseup', finishSeek);
    seek.addEventListener('touchend', finishSeek);
    seek.addEventListener('mouseleave', () => (isSeeking = false)); // falls Cursor rausfährt
  
    // Auto-Next
    audio.addEventListener('ended', () => {
      currentIndex = (currentIndex + 1) % songs.length;
      loadSong(currentIndex);
      playCurrent();
    });
  
    // ✅ Keyboard-Shortcuts
    // Space: Play/Pause
    // Pfeil rechts/links: 5s vor/zurück
    // Shift+Pfeil rechts/links: Track next/prev
    // (optional) Pfeil hoch/runter: Lautstärke ±5%
    window.addEventListener('keydown', (e) => {
      // Space in Buttons/Inputs nicht blocken
      const tag = document.activeElement?.tagName?.toLowerCase();
      const inForm = tag === 'input' || tag === 'textarea' || tag === 'button';
      if (e.code === 'Space' && !inForm) {
        e.preventDefault();
        isPlaying ? pauseCurrent() : playCurrent();
        return;
      }
  
      // Shift + Arrow → Track skip
      if (e.shiftKey && e.code === 'ArrowRight') {
        e.preventDefault();
        nextBtn.click();
        return;
      }
      if (e.shiftKey && e.code === 'ArrowLeft') {
        e.preventDefault();
        prevBtn.click();
        return;
      }
  
      // Normale Pfeile → seek ±5s
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        audio.currentTime = Math.min((audio.currentTime || 0) + 5, audio.duration || Infinity);
        return;
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        audio.currentTime = Math.max((audio.currentTime || 0) - 5, 0);
        return;
      }
  
      // Optional: Lautstärke
      if (e.code === 'ArrowUp') {
        e.preventDefault();
        audio.volume = Math.min(1, (audio.volume ?? 1) + 0.05);
        return;
      }
      if (e.code === 'ArrowDown') {
        e.preventDefault();
        audio.volume = Math.max(0, (audio.volume ?? 1) - 0.05);
        return;
      }
    });
  
    // Erstes Lied laden (ohne Autoplay)
    loadSong(currentIndex);
  });
  
  