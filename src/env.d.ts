declare module "*?worker&url" {
  const url: string;
  export default url;
}

// Tauri API types
interface Window {
  __TAURI__?: {
    window: {
      getCurrent: () => {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        unmaximize: () => Promise<void>;
        close: () => Promise<void>;
        isMaximized: () => Promise<boolean>;
      };
    };
  };
  electronAPI?: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
}
