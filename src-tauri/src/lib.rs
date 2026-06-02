//! StoryFab — AI-driven professional video editing desktop app
//! Tauri 2.x backend entry point

use tauri::Manager;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub mod binary;
pub mod commands;
pub mod video;
pub mod types;
pub mod utils;
pub mod subtitle;
pub mod highlight;
pub mod segment;
pub mod llm;

pub use commands::{
    ai, auto_save, commentary, ffprobe, project, render, export_state, file_ops,
};
pub use types::*;

pub use commands::ffprobe::{analyze_video, check_ffmpeg, run_ffprobe};
pub use commands::ai::{
    detect_highlights, detect_zcr_bursts, detect_smart_segments,
    get_export_dir, run_ai_director_plan, synthesize_speech, check_tts_available, list_tts_backends, TtsBackendInfo, translate_text,
};
pub use commands::project::{
    check_app_data_directory, delete_file, delete_project_file, get_file_size,
    list_app_data_files, list_project_files, load_project_file, read_text_file, save_project_file,
};
pub use commands::render::{
    export_video, render_autonomous_cut, transcode_with_crop, generate_preview,
};
pub use commands::export_state::cancel_export;
pub use commands::file_ops::{clean_temp_file, open_file, voice_discovery};
pub use video::processor::VideoProcessor;
pub use video::ffmpeg_cmd::cut_video;
pub use video::mix_audio::{mix_audio, MixAudioInput};
pub use video::audio_duration::get_audio_duration;

// Subtitle re-exports
pub use subtitle::transcribe_audio;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化日志
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "story-fab=info,warn".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("StoryFab 启动中...");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            run_ai_director_plan,
            check_app_data_directory,
            save_project_file,
            load_project_file,
            delete_project_file,
            list_project_files,
            list_app_data_files,
            delete_file,
            read_text_file,
            get_file_size,
            render_autonomous_cut,
            transcode_with_crop,
            generate_preview,
            export_video,
            cancel_export,
            clean_temp_file,
            open_file,
            voice_discovery,
            cut_video,
            mix_audio,
            get_audio_duration,
            check_ffmpeg,
            analyze_video,
            run_ffprobe,
            // Whisper subtitle transcription (transcribe_audio lives in
            // subtitle/transcribe.rs; check_faster_whisper /
            // list_whisper_models / download_whisper_model /
            // get_whisper_supported_languages are Python helper snippets
            // in subtitle/whisper.rs and are NOT Tauri commands — they
            // are called from transcribe.rs internally. Skipped here.)
            subtitle::transcribe::transcribe_audio,
            // Highlight detection & smart segmentation
            detect_highlights,
            detect_zcr_bursts,
            detect_smart_segments,
            // TTS / AI
            synthesize_speech,
            check_tts_available,
            list_tts_backends,
            translate_text,
            get_export_dir,
            // Auto-save / crash recovery
            auto_save::auto_save_project,
            auto_save::clear_autosave,
            auto_save::list_recoverable_projects,
            auto_save::recover_autosave,
            auto_save::preview_autosave,
            // LLM / AI 脚本生成
            commands::llm::generate_narration_script,
            commands::llm::analyze_video_for_narration,
            commands::llm::list_available_models,
            // Commentary Mode (AI 影视解说) — 直接引用子模块，避免 re-export 导致 Tauri 宏无法解析
            commentary::director::commands::create_director_session,
            commentary::director::commands::get_director_status,
            commentary::director::commands::start_director_analysis,
            commentary::director::commands::generate_director_plan,
            commentary::director::commands::approve_director_plan,
            commentary::director::commands::revise_director_plan,
            commentary::director::commands::complete_director_render,
            commentary::director::commands::destroy_director_session,
            commentary::script_generator::generate_commentary_script,
            // Commentary Synthesizer (AI 影视解说 TTS) — 路径从 commentary_synthesizer
            // 直接指向 sibling 的 synthesizer/commands 子模块，因为 commentary_synthesizer
            // 只是 re-export shim，synthesizer/commands 才是 #[tauri::command] 宏展开位置。
            commentary::synthesizer::commands::synthesize_commentary_audio,
            commentary::synthesizer::commands::estimate_tts_duration,
            commentary::synthesizer::commands::list_commentary_voices,
        ])
        .setup(|app| {
            tracing::info!("[StoryFab] 应用初始化中...");

            let app_data_dir = app.path().app_data_dir().unwrap_or_default();
            tracing::info!("[StoryFab] App数据目录: {:?}", app_data_dir);

            // macOS / Windows / Linux 平台日志路径
            if let Ok(log_dir) = app_data_dir.join("logs").canonicalize() {
                tracing::info!("[StoryFab] 日志目录: {:?}", log_dir);
            }

            if let Some(window) = app.get_webview_window("main") {
                tracing::info!("[StoryFab] 主窗口已获取");

                // 确保窗口标题正确
                let _ = window.set_title("StoryFab - AI 视频创作平台");
            }

            tracing::info!("[StoryFab] 启动完成");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
