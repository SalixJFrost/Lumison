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

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: Record<string, unknown>;
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
}
