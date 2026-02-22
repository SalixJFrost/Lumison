import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion?: string;
  body?: string;
}

export class UpdateService {
  private static checkingUpdate = false;

  /**
   * 检查是否在 Tauri 环境中运行
   */
  private static isTauriEnvironment(): boolean {
    return typeof window !== 'undefined' && '__TAURI__' in window;
  }

  /**
   * 静默检查更新（启动时调用）
   */
  static async checkForUpdates(): Promise<UpdateInfo> {
    // 只在 Tauri 环境中检查更新
    if (!this.isTauriEnvironment()) {
      return { available: false, currentVersion: '1.0.0' };
    }

    if (this.checkingUpdate) {
      return { available: false, currentVersion: '1.0.0' };
    }

    this.checkingUpdate = true;

    try {
      const update = await check();
      
      if (update) {
        return {
          available: true,
          currentVersion: update.currentVersion,
          latestVersion: update.version,
          body: update.body,
        };
      }

      return {
        available: false,
        currentVersion: update?.currentVersion || '1.0.0',
      };
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return {
        available: false,
        currentVersion: '1.0.0',
      };
    } finally {
      this.checkingUpdate = false;
    }
  }

  /**
   * 下载并安装更新
   */
  static async downloadAndInstall(
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    // 只在 Tauri 环境中执行更新
    if (!this.isTauriEnvironment()) {
      console.warn('Update is only available in Tauri environment');
      return false;
    }

    try {
      const update = await check();
      
      if (!update) {
        return false;
      }

      let downloaded = 0;
      let total = 0;

      // 下载更新
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            onProgress?.(0);
            total = (event.data as any).contentLength || 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (total > 0) {
              const progress = (downloaded / total) * 100;
              onProgress?.(progress);
            }
            break;
          case 'Finished':
            onProgress?.(100);
            break;
        }
      });

      // 重启应用
      await relaunch();
      return true;
    } catch (error) {
      console.error('Failed to download and install update:', error);
      return false;
    }
  }
}
