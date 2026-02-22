# Icon Generation

This directory contains application icons for the Tauri desktop application.

## Generating Icons

1. Create a 1024x1024 PNG version of the Lumison icon (based on `public/icon-static.svg`)
2. Save it as `icon.png` in this directory
3. Run `npm run tauri:icon` to generate all required icon sizes

The tauri icon command will automatically generate:
- icon.ico (Windows)
- Various PNG sizes for different platforms
- Other platform-specific icon formats

## Current Status

The icon.png file needs to be created. You can:
- Convert `public/icon-static.svg` to PNG at 1024x1024 resolution
- Use an image editor (Photoshop, GIMP, Inkscape, etc.)
- Use an online SVG to PNG converter

Once icon.png is created, run `npm run tauri:icon` to generate all variants.
