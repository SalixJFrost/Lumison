// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    lumison_lib::AppBuilder::new()
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            
            // Desktop-specific plugins
            #[cfg(desktop)]
            {
                use tauri_plugin_updater::UpdaterExt;
                app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
            }
            
            Ok(())
        })
        .run();
}

// ============================================================================
// FUTURE EXTENSION HOOKS
// ============================================================================

// System Audio Capture (Requirement 7.3)
// Implementation approach:
// - Use Windows WASAPI (Windows Audio Session API) via windows-rs crate
// - Create a Tauri command that returns audio stream data
// - Frontend can request audio capture and receive PCM data
// - Example signature:
// #[tauri::command]
// async fn capture_system_audio() -> Result<Vec<f32>, String> { ... }

// Multi-Screen Output (Requirement 7.4)
// Implementation approach:
// - Use tauri::window::WindowBuilder to create additional windows
// - Query available displays using tauri::window::Monitor
// - Create fullscreen windows on secondary displays
// - Example signature:
// #[tauri::command]
// async fn create_output_window(display_id: u32) -> Result<(), String> { ... }

// Exhibition Mode (Requirement 7.5)
// Implementation approach:
// - Create a fullscreen window with decorations: false
// - Disable cursor using tauri::window::Window::set_cursor_visible(false)
// - Implement keyboard shortcut to exit (e.g., Esc key)
// - Example signature:
// #[tauri::command]
// async fn enter_exhibition_mode() -> Result<(), String> { ... }
