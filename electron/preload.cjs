const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Island window resizing
  setIslandBounds: (bounds) => ipcRenderer.send('island:resize', bounds),
  
  // Agent events & IPC communication
  sendAgentAction: (action, payload) => ipcRenderer.send('agent:action', { action, payload }),
  onAgentAction: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('agent:action', subscription);
    return () => ipcRenderer.removeListener('agent:action', subscription);
  },

  // State synchronization between Controller and Island
  syncState: (state) => ipcRenderer.send('agent:sync-state', state),
  onSyncState: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('agent:sync-state', subscription);
    return () => ipcRenderer.removeListener('agent:sync-state', subscription);
  },

  // Permission response from Island back to Controller
  respondPermission: (approved) => ipcRenderer.send('permission:response', approved),
  onPermissionResponse: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('permission:response', subscription);
    return () => ipcRenderer.removeListener('permission:response', subscription);
  }
});
