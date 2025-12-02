// preload.js

const path = require('path'); // 🧠 fehlte bisher

// 1) Wir holen uns das 'contextBridge'- und 'ipcRenderer'-Modul von Electron
//    Damit können wir sicher mit dem Hauptprozess (main.js) kommunizieren.
const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';
const basePath = isDev
  ? path.join(__dirname, 'assets')
  : path.join(process.resourcesPath, 'assets');

  const backgroundPath = path.join(basePath, 'images', 'Background.png');
  const songsDir = path.join(basePath, 'songs');

// 2) Über den contextBridge stellen wir dem Renderer (UI) eine eigene API zur Verfügung.
//    Diese API ist das EINZIGE, was das Frontend sieht — es kann nicht auf Node.js direkt zugreifen.
contextBridge.exposeInMainWorld('pocketAPI', {
  // 3) Beispiel-Funktion: Renderer kann den Main-Prozess anpingen
  ping: () => ipcRenderer.invoke('ping'),

  // 4) Beispiel-Funktion: Songs vom Main-Prozess anfordern
  getSongs: () => ipcRenderer.invoke('get-songs'),

  // 5) Beispiel-Funktion: Nachricht an Main senden (ohne Antwort)
  log: (message) => ipcRenderer.send('log', message),
});


contextBridge.exposeInMainWorld('pocketPaths', {
  background: backgroundPath,
  songsDir,
});
