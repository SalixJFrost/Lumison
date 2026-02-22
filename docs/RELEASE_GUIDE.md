# Release Guide

This guide explains how to publish new versions of Lumison with auto-update support.

## Prerequisites

- Rust toolchain installed
- Signing key generated (see [Setup](#setup))
- GitHub repository access

## Setup

### Generate Signing Key (One-time)

```bash
npx @tauri-apps/cli signer generate --write-keys ~/.tauri/lumison.key
```

Password: `superadmin`

This generates:
- Private key: `~/.tauri/lumison.key` (Keep secret!)
- Public key: `~/.tauri/lumison.key.pub` (Already in `tauri.conf.json`)

## Release Process

### 1. Update Version Numbers

Edit `src-tauri/tauri.conf.json`:
```json
{
  "version": "1.0.1"
}
```

Edit `src-tauri/Cargo.toml`:
```toml
[package]
version = "1.0.1"
```

### 2. Set Signing Environment Variables

**PowerShell:**
```powershell
$privateKey = Get-Content "D:\Lumison\~\.tauri\lumison.key" -Raw
$env:TAURI_SIGNING_PRIVATE_KEY = $privateKey
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "superadmin"
$env:Path += ";$env:USERPROFILE\.cargo\bin"
```

**Bash:**
```bash
export TAURI_SIGNING_PRIVATE_KEY=$(cat ~/.tauri/lumison.key)
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="superadmin"
```

### 3. Build Release

```bash
npm run tauri:build
```

This generates:
- `src-tauri/target/release/bundle/msi/Lumison_x.x.x_x64_en-US.msi`
- `src-tauri/target/release/bundle/nsis/Lumison_x.x.x_x64-setup.exe`
- `src-tauri/target/release/bundle/nsis/Lumison_x.x.x_x64-setup.nsis.zip` (updater)
- `src-tauri/target/release/bundle/nsis/Lumison_x.x.x_x64-setup.nsis.zip.sig` (signature)

### 4. Create Update Manifest

Create `latest.json`:

```json
{
  "version": "1.0.1",
  "notes": "Release notes here",
  "pub_date": "2025-02-22T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "SIGNATURE_FROM_SIG_FILE",
      "url": "https://github.com/SalixJFrost/Lumison/releases/download/v1.0.1/Lumison_1.0.1_x64-setup.nsis.zip"
    }
  }
}
```

Get signature:
```bash
cat src-tauri/target/release/bundle/nsis/Lumison_x.x.x_x64-setup.nsis.zip.sig
```

### 5. Create GitHub Release

1. Go to https://github.com/SalixJFrost/Lumison/releases/new
2. Tag: `v1.0.1`
3. Title: `Lumison v1.0.1`
4. Upload files:
   - `Lumison_x.x.x_x64_en-US.msi`
   - `Lumison_x.x.x_x64-setup.exe`
   - `Lumison_x.x.x_x64-setup.nsis.zip`
   - `Lumison_x.x.x_x64-setup.nsis.zip.sig`
   - `latest.json`
5. Publish release

### 6. Verify

- Download links work
- `latest.json` is accessible
- Install old version and check for update notification

## Auto-Update Flow

1. Client starts → checks for updates (after 3 seconds)
2. Fetches `latest.json` from GitHub
3. Compares version numbers
4. Shows notification if update available
5. Downloads `.nsis.zip` file
6. Verifies signature
7. Installs and restarts

## Security

⚠️ **Important:**
- Never commit private key to Git
- Never share private key password publicly
- Keep `~/.tauri/lumison.key` secure
- Use environment variables for CI/CD

## Troubleshooting

### Signature verification fails
- Ensure correct private key is used
- Check password is correct
- Verify public key in `tauri.conf.json`

### Update not detected
- Check `latest.json` is accessible
- Verify version number is higher
- Check browser console for errors

### Build fails
- Ensure Rust toolchain is installed
- Check environment variables are set
- Verify private key path is correct

## References

- [Tauri Updater Documentation](https://tauri.app/v1/guides/distribution/updater)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)
