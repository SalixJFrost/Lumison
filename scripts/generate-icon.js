#!/usr/bin/env node

/**
 * 生成应用图标
 * 将 SVG 转换为 PNG，然后使用 Tauri CLI 生成所有平台的图标
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SVG_PATH = join(__dirname, '../src-tauri/icons/icon.svg');
const PNG_PATH = join(__dirname, '../src-tauri/icons/icon.png');

async function generateIcon() {
  try {
    console.log('📦 读取 SVG 文件...');
    const svgBuffer = readFileSync(SVG_PATH);
    
    console.log('🎨 转换 SVG 到 PNG (1024x1024)...');
    await sharp(svgBuffer)
      .resize(1024, 1024)
      .png()
      .toFile(PNG_PATH);
    
    console.log('✅ PNG 图标生成成功:', PNG_PATH);
    console.log('');
    console.log('📝 下一步：运行以下命令生成所有平台图标');
    console.log('   npm run tauri:icon');
    console.log('');
  } catch (error) {
    console.error('❌ 生成图标失败:', error.message);
    console.error('');
    console.error('💡 提示：请确保已安装 sharp 依赖');
    console.error('   npm install sharp --save-dev');
    process.exit(1);
  }
}

generateIcon();
