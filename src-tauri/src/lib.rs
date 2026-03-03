// lib.rs - Library entry point for Tauri
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            println!("[ClipFlow] 启动应用...");

            // 获取应用路径
            let app_data_dir = app.path().app_data_dir().unwrap_or_default();
            println!("[ClipFlow] App数据目录: {:?}", app_data_dir);

            // 获取资源路径
            if let Ok(resource_path) = app.path().resource_dir() {
                println!("[ClipFlow] 资源目录: {:?}", resource_path);
            }

            // Get the main window
            if let Some(window) = app.get_webview_window("main") {
                println!("[ClipFlow] 获取到主窗口");

                // Set window title
                if let Err(e) = window.set_title("ClipFlow - AI 视频创作平台") {
                    println!("[ClipFlow] 设置窗口标题失败: {:?}", e);
                } else {
                    println!("[ClipFlow] 窗口标题设置成功");
                }

                // 尝试加载 URL
                if let Ok(url) = window.url() {
                    println!("[ClipFlow] 当前URL: {:?}", url);
                }
            } else {
                println!("[ClipFlow] 无法获取主窗口!");
            }

            println!("[ClipFlow] 应用启动完成");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
