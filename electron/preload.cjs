const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nativeTTS', {
  speak: (text, rate) => ipcRenderer.invoke('tts:speak', text, rate),
  getVoices: () => ipcRenderer.invoke('tts:voices'),
  setVoice: (name) => ipcRenderer.invoke('tts:setVoice', name),
});
