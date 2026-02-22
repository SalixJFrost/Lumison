// Music services barrel export
export * from './lyricsService';
export * from './audioStreamService';
export * from './geminiService';
export { 
  getPlatformConfig, 
  updatePlatformConfig,
  getApiStats,
  resetApiStats,
  testNeteaseApis
} from './multiPlatformLyrics';
