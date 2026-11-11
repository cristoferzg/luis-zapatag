// Puente mínimo y seguro entre la web y el programa de PC: solo permite pedir que se muestre la
// ventana (al tocar un aviso). No da acceso a archivos ni al sistema.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('innovaPC', { mostrar: () => ipcRenderer.send('innova-mostrar') });
