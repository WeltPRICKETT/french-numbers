const { app, BrowserWindow, ipcMain } = require('electron');
const { execFile } = require('child_process');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 520,
    height: 820,
    minWidth: 400,
    minHeight: 600,
    title: '个人法语学习助手',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

function findFrenchVoice() {
  return new Promise((resolve) => {
    execFile('say', ['-v', '?'], (err, stdout) => {
      if (err) { resolve('Thomas'); return; }
      const lines = stdout.split('\n');
      const frFR = lines.filter(l => l.includes('fr_FR'));
      const thomas = frFR.find(l => l.startsWith('Thomas'));
      if (thomas) { resolve('Thomas'); return; }
      const jacques = frFR.find(l => l.startsWith('Jacques'));
      if (jacques) { resolve('Jacques'); return; }
      if (frFR.length > 0) {
        resolve(frFR[0].split(/\s/)[0]);
        return;
      }
      const frAny = lines.find(l => /\bfr[_-]/.test(l));
      resolve(frAny ? frAny.split(/\s/)[0] : 'Thomas');
    });
  });
}

let frenchVoice = 'Thomas';

function registerMacTtsHandlers() {
  ipcMain.handle('tts:speak', (_event, text, rate) => {
    return new Promise((resolve, reject) => {
      const wpm = rate === 'slow' ? 100 : rate === 'fast' ? 260 : 180;
      const child = execFile('say', ['-v', frenchVoice, '-r', String(wpm), text]);
      child.on('close', (code) => {
        if (code === 0) resolve(true);
        else reject(new Error(`say exited with code ${code}`));
      });
      child.on('error', (err) => reject(err));
    });
  });

  ipcMain.handle('tts:voices', async () => {
    return new Promise((resolve) => {
      execFile('say', ['-v', '?'], (err, stdout) => {
        if (err) { resolve([]); return; }
        const voices = stdout.split('\n')
          .filter(l => /\bfr[_-]/.test(l))
          .map(l => {
            const name = l.split(/\s/)[0];
            const lang = l.includes('fr_FR') ? 'fr_FR' : 'fr_CA';
            return { name, lang };
          });
        resolve(voices);
      });
    });
  });

  ipcMain.handle('tts:setVoice', (_event, name) => {
    frenchVoice = name;
  });
}

app.whenReady().then(async () => {
  if (process.platform === 'darwin') {
    frenchVoice = await findFrenchVoice();
    registerMacTtsHandlers();
  }
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
