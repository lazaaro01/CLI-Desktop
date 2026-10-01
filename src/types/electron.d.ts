export interface ElectronAPI {
  setIslandBounds: (bounds: { width: number; height: number }) => void;
  sendAgentAction: (action: string, payload?: unknown) => void;
  onAgentAction: (callback: (data: { action: string; payload?: unknown }) => void) => () => void;
  syncState: (state: unknown) => void;
  onSyncState: (callback: (state: unknown) => void) => () => void;
  respondPermission: (approved: boolean) => void;
  onPermissionResponse: (callback: (approved: boolean) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
