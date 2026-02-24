declare module "*?worker&url" {
  const url: string;
  export default url;
}

// Vite ImportMeta interface
interface ImportMeta {
  readonly env: {
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly MODE: string;
    [key: string]: any;
  };
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
