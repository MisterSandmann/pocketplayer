const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');


process.env.NODE_ENV = process.env.NODE_ENV || 'development';

function createWindow() {
    const mainWindow = new BrowserWindow({
      width: 400,
      height: 600,
      resizable: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: true,
        sandbox: false,
        webSecurity: false,
      }
    });
  
    // 🧭 DEV oder BUILD?
    let htmlPath;
    if (app.isPackaged) {
      // ⚙️ Entweder aus app.asar extrahiert oder aus app.asar.unpacked laden
      const candidate1 = path.join(process.resourcesPath, 'app.asar', 'app', 'index.html');
      const candidate2 = path.join(process.resourcesPath, 'app', 'index.html');
      const candidate3 = path.join(process.resourcesPath, 'app.asar.unpacked', 'app', 'index.html');
  
      // Nimm den ersten existierenden
      if (fs.existsSync(candidate2)) htmlPath = candidate2;
      else if (fs.existsSync(candidate3)) htmlPath = candidate3;
      else htmlPath = candidate1;
  
      console.log('📦 Build-Modus → Pfadkandidaten:');
      console.log(' 1️⃣', candidate1);
      console.log(' 2️⃣', candidate2);
      console.log(' 3️⃣', candidate3);
      console.log('👉 Verwende:', htmlPath);
    } else {
      htmlPath = path.join(__dirname, 'app', 'index.html');
      console.log('🧭 Dev-Modus →', htmlPath);
    }
  
    // 🚀 Lade per URL
    const { pathToFileURL } = require('url');
    const htmlUrl = pathToFileURL(htmlPath).href;
    console.log('🌐 Lade URL:', htmlUrl);
  
    mainWindow.loadURL(htmlUrl);
    mainWindow.setMenu(null);
  }

// App starten
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// App schließen (außer auf macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// === IPC-Kommunikation: Songs an Renderer liefern ===
ipcMain.handle('get-songs', async () => {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const songDir = isDev
      ? path.join(__dirname, 'assets', 'songs')
      : path.join(process.resourcesPath, 'assets', 'songs');

    console.log('🎵 Songs-Verzeichnis:', songDir);

    if (!fs.existsSync(songDir)) {
      console.error('❌ Songs-Ordner nicht gefunden:', songDir);
      return [];
    }

    const files = fs.readdirSync(songDir);
    const songs = files.filter(f => f.endsWith('.mp3') || f.endsWith('.wav'));

    console.log('🎵 Songs gefunden:', songs);
    return songs;
  } catch (err) {
    console.error('Fehler beim Lesen der Songs:', err);
    return [];
  }
});

  