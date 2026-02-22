// Mobile-specific code for Android and iOS

use tauri::App;

#[tauri::mobile_entry_point]
pub fn run() {
    crate::AppBuilder::new()
        .setup(|app| {
            setup_mobile(app)?;
            Ok(())
        })
        .run();
}

fn setup_mobile(_app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    // Mobile-specific setup code
    // Note: updater plugin is not available on mobile
    Ok(())
}
