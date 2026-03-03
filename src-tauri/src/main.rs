// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            println!("启动 ClipFlow 应用");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
