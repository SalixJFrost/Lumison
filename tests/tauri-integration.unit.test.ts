/**
 * Unit Tests for Tauri Desktop Integration
 * Feature: tauri-desktop-integration
 */

import { test, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const rootDir = join(__dirname, '..');

/**
 * Test: Dependency Configuration
 * **Validates: Requirements 8.1, 8.2, 8.3**
 */
test('package.json contains @tauri-apps/cli in devDependencies', () => {
  const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
  expect(packageJson.devDependencies).toHaveProperty('@tauri-apps/cli');
  expect(packageJson.devDependencies['@tauri-apps/cli']).toMatch(/^\^2\./);
});

test('package.json contains @tauri-apps/api in dependencies', () => {
  const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
  expect(packageJson.dependencies).toHaveProperty('@tauri-apps/api');
  expect(packageJson.dependencies['@tauri-apps/api']).toMatch(/^\^2\./);
});

test('package.json contains all required Tauri scripts', () => {
  const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
  expect(packageJson.scripts).toHaveProperty('tauri');
  expect(packageJson.scripts).toHaveProperty('tauri:dev');
  expect(packageJson.scripts).toHaveProperty('tauri:build');
  expect(packageJson.scripts).toHaveProperty('tauri:icon');
  expect(packageJson.scripts.tauri).toBe('tauri');
  expect(packageJson.scripts['tauri:dev']).toBe('tauri dev');
  expect(packageJson.scripts['tauri:build']).toBe('tauri build');
  expect(packageJson.scripts['tauri:icon']).toBe('tauri icon');
});

test('Cargo.toml contains required Rust dependencies', () => {
  const cargoToml = readFileSync(join(rootDir, 'src-tauri', 'Cargo.toml'), 'utf-8');
  expect(cargoToml).toContain('tauri');
  expect(cargoToml).toContain('serde');
  expect(cargoToml).toContain('serde_json');
  expect(cargoToml).toContain('devtools');
});

/**
 * Test: File Structure
 * **Validates: Requirements 1.1, 1.2**
 */
test('src-tauri directory exists', () => {
  expect(existsSync(join(rootDir, 'src-tauri'))).toBe(true);
});

test('src-tauri/src/main.rs exists', () => {
  expect(existsSync(join(rootDir, 'src-tauri', 'src', 'main.rs'))).toBe(true);
});

test('src-tauri/Cargo.toml exists', () => {
  expect(existsSync(join(rootDir, 'src-tauri', 'Cargo.toml'))).toBe(true);
});

test('src-tauri/tauri.conf.json exists', () => {
  expect(existsSync(join(rootDir, 'src-tauri', 'tauri.conf.json'))).toBe(true);
});

test('src-tauri/icons directory exists', () => {
  expect(existsSync(join(rootDir, 'src-tauri', 'icons'))).toBe(true);
});

test('existing frontend structure is preserved', () => {
  expect(existsSync(join(rootDir, 'src'))).toBe(true);
  expect(existsSync(join(rootDir, 'public'))).toBe(true);
  expect(existsSync(join(rootDir, 'index.html'))).toBe(true);
});

/**
 * Test: main.rs Content
 * **Validates: Requirements 1.3, 6.1, 7.1, 7.3, 7.4, 7.5**
 */
test('main.rs contains windows_subsystem attribute', () => {
  const mainRs = readFileSync(join(rootDir, 'src-tauri', 'src', 'main.rs'), 'utf-8');
  expect(mainRs).toContain('#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]');
});

test('main.rs contains devtools setup in debug mode', () => {
  const mainRs = readFileSync(join(rootDir, 'src-tauri', 'src', 'main.rs'), 'utf-8');
  expect(mainRs).toContain('#[cfg(debug_assertions)]');
  expect(mainRs).toContain('open_devtools');
});

test('main.rs contains extension point comments for system audio capture', () => {
  const mainRs = readFileSync(join(rootDir, 'src-tauri', 'src', 'main.rs'), 'utf-8');
  expect(mainRs).toContain('System Audio Capture');
  expect(mainRs).toContain('WASAPI');
  expect(mainRs).toContain('capture_system_audio');
});

test('main.rs contains extension point comments for multi-screen output', () => {
  const mainRs = readFileSync(join(rootDir, 'src-tauri', 'src', 'main.rs'), 'utf-8');
  expect(mainRs).toContain('Multi-Screen Output');
  expect(mainRs).toContain('WindowBuilder');
  expect(mainRs).toContain('create_output_window');
});

test('main.rs contains extension point comments for exhibition mode', () => {
  const mainRs = readFileSync(join(rootDir, 'src-tauri', 'src', 'main.rs'), 'utf-8');
  expect(mainRs).toContain('Exhibition Mode');
  expect(mainRs).toContain('fullscreen');
  expect(mainRs).toContain('enter_exhibition_mode');
});

test('main.rs contains invoke_handler placeholder', () => {
  const mainRs = readFileSync(join(rootDir, 'src-tauri', 'src', 'main.rs'), 'utf-8');
  expect(mainRs).toContain('invoke_handler');
  expect(mainRs).toContain('Future extension point');
});

/**
 * Test: tauri.conf.json Structure
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 4.5**
 */
test('tauri.conf.json has correct window dimensions', () => {
  const tauriConf = JSON.parse(readFileSync(join(rootDir, 'src-tauri', 'tauri.conf.json'), 'utf-8'));
  const window = tauriConf.app.windows[0];
  expect(window.width).toBe(1280);
  expect(window.height).toBe(800);
  expect(window.minWidth).toBe(800);
  expect(window.minHeight).toBe(600);
});

test('tauri.conf.json has correct window title', () => {
  const tauriConf = JSON.parse(readFileSync(join(rootDir, 'src-tauri', 'tauri.conf.json'), 'utf-8'));
  const window = tauriConf.app.windows[0];
  expect(window.title).toBe('Lumison - Visual Art Engine');
});

test('tauri.conf.json has correct build commands and paths', () => {
  const tauriConf = JSON.parse(readFileSync(join(rootDir, 'src-tauri', 'tauri.conf.json'), 'utf-8'));
  expect(tauriConf.build.beforeDevCommand).toBe('npm run dev');
  expect(tauriConf.build.beforeBuildCommand).toBe('npm run build');
  expect(tauriConf.build.devUrl).toBe('http://localhost:1420');
  expect(tauriConf.build.frontendDist).toBe('../dist');
});

test('tauri.conf.json CSP includes required domains', () => {
  const tauriConf = JSON.parse(readFileSync(join(rootDir, 'src-tauri', 'tauri.conf.json'), 'utf-8'));
  const csp = tauriConf.app.security.csp;
  expect(csp).toContain('fonts.googleapis.com');
  expect(csp).toContain('fonts.gstatic.com');
  expect(csp).toContain('unsafe-inline');
  expect(csp).toContain('unsafe-eval');
  expect(csp).toContain('data:');
  expect(csp).toContain('blob:');
});

test('tauri.conf.json bundle targets include msi and nsis', () => {
  const tauriConf = JSON.parse(readFileSync(join(rootDir, 'src-tauri', 'tauri.conf.json'), 'utf-8'));
  expect(tauriConf.bundle.targets).toContain('msi');
  expect(tauriConf.bundle.targets).toContain('nsis');
});

/**
 * Test: .gitignore Configuration
 * **Validates: Requirements 8.5**
 */
test('.gitignore excludes src-tauri/target', () => {
  const gitignore = readFileSync(join(rootDir, '.gitignore'), 'utf-8');
  expect(gitignore).toContain('src-tauri/target/');
});

test('.gitignore excludes Cargo.lock', () => {
  const gitignore = readFileSync(join(rootDir, '.gitignore'), 'utf-8');
  expect(gitignore).toContain('src-tauri/Cargo.lock');
});
