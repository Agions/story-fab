// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;
use serde::{Deserialize, Serialize};
use tauri::command;
use std::fs::{self, File};
use std::io::Write;
use tauri::api::path::app_data_dir;
use tauri::Window;
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Debug)]
struct VideoMetadata {
    duration: f64,
    width: u32,
    height: u32,
    fps: f64,
    codec: String,
    bitrate: u32,
}

// 视频剪辑片段结构
#[derive(Deserialize, Debug)]
struct VideoSegment {
    start: f64,
    end: f64,
    type_field: Option<String>,
    content: Option<String>,
}

// 视频剪辑参数
#[derive(Deserialize, Debug)]
struct CutVideoParams {
    input_path: String,
    output_path: String,
    segments: Vec<VideoSegment>,
    quality: Option<String>,
    format: Option<String>,
    transition: Option<String>,
    transition_duration: Option<f64>,
    volume: Option<f64>,
    add_subtitles: Option<bool>,
}

// 预览片段参数
#[derive(Deserialize, Debug)]
struct PreviewParams {
    input_path: String,
    segment: VideoSegment,
    transition: Option<String>,
    transition_duration: Option<f64>,
    volume: Option<f64>,
    add_subtitles: Option<bool>,
}

// 清理临时文件参数
#[derive(Deserialize, Debug)]
struct CleanFileParams {
    path: String,
}

/// 分析视频文件获取元数据
#[command]
fn analyze_video(path: String) -> Result<VideoMetadata, String> {
    println!("分析视频: {}", path);
    
    // 确保FFmpeg已安装
    if !is_ffmpeg_installed() {
        return Err("未安装FFmpeg，请先安装FFmpeg后再试".into());
    }
    
    // 执行FFmpeg命令获取视频信息
    let output = Command::new("ffprobe")
        .args(&[
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            &path
        ])
        .output()
        .map_err(|e| format!("运行ffprobe失败: {}", e))?;
    
    if !output.status.success() {
        return Err(format!("ffprobe命令执行失败: {}", String::from_utf8_lossy(&output.stderr)));
    }
    
    // 解析FFmpeg输出的JSON
    let json_output = String::from_utf8_lossy(&output.stdout);
    let json_value: serde_json::Value = serde_json::from_str(&json_output)
        .map_err(|e| format!("解析JSON失败: {}", e))?;
    
    // 提取视频元数据
    let streams = json_value["streams"].as_array().ok_or("无法获取视频流信息")?;
    let video_stream = streams.iter()
        .find(|s| s["codec_type"].as_str().unwrap_or("") == "video")
        .ok_or("未找到视频流")?;
    
    let width = video_stream["width"].as_u64().unwrap_or(0) as u32;
    let height = video_stream["height"].as_u64().unwrap_or(0) as u32;
    
    // 获取帧率
    let fps_str = video_stream["r_frame_rate"].as_str().unwrap_or("0/1");
    let fps = parse_fps(fps_str);
    
    // 获取编解码器
    let codec = video_stream["codec_name"].as_str().unwrap_or("unknown").to_string();
    
    // 获取时长和比特率
    let format = &json_value["format"];
    let duration = format["duration"].as_str().unwrap_or("0")
        .parse::<f64>().unwrap_or(0.0);
    
    let bitrate = format["bit_rate"].as_str().unwrap_or("0")
        .parse::<u32>().unwrap_or(0);
    
    Ok(VideoMetadata {
        duration,
        width,
        height,
        fps,
        codec,
        bitrate,
    })
}

/// 从视频中提取关键帧
#[command]
fn extract_key_frames(path: String, count: u32) -> Result<Vec<String>, String> {
    println!("提取关键帧: {}, 数量: {}", path, count);
    
    // 确保FFmpeg已安装
    if !is_ffmpeg_installed() {
        return Err("未安装FFmpeg，请先安装FFmpeg后再试".into());
    }
    
    // 获取视频时长
    let metadata = analyze_video(path.clone())?;
    let duration = metadata.duration;
    
    // 创建临时目录存放关键帧
    let temp_dir = std::env::temp_dir().join("ClipFlow_keyframes");
    fs::create_dir_all(&temp_dir).map_err(|e| format!("创建临时目录失败: {}", e))?;
    
    // 计算均匀分布的帧位置
    let mut frame_positions = Vec::new();
    let segment = duration / (count as f64 + 1.0);
    
    for i in 1..=count {
        let position = segment * (i as f64);
        frame_positions.push(position);
    }
    
    let mut frame_paths = Vec::new();
    
    // 提取每个位置的帧
    for (i, &position) in frame_positions.iter().enumerate() {
        let output_path = temp_dir.join(format!("frame_{}.jpg", i+1));
        let output_str = output_path.to_str().ok_or("路径转换失败")?;
        
        // 使用FFmpeg提取帧
        let status = Command::new("ffmpeg")
            .args(&[
                "-ss", &format!("{}", position),
                "-i", &path,
                "-vframes", "1",
                "-q:v", "2",
                "-f", "image2",
                output_str
            ])
            .status()
            .map_err(|e| format!("运行ffmpeg失败: {}", e))?;
        
        if !status.success() {
            return Err("提取帧失败".into());
        }
        
        frame_paths.push(output_str.to_string());
    }
    
    Ok(frame_paths)
}

/// 生成视频缩略图
#[command]
fn generate_thumbnail(path: String) -> Result<String, String> {
    println!("生成缩略图: {}", path);
    
    // 确保FFmpeg已安装
    if !is_ffmpeg_installed() {
        return Err("未安装FFmpeg，请先安装FFmpeg后再试".into());
    }
    
    // 创建临时目录存放缩略图
    let temp_dir = std::env::temp_dir().join("ClipFlow_thumbnails");
    fs::create_dir_all(&temp_dir).map_err(|e| format!("创建临时目录失败: {}", e))?;
    
    // 生成随机文件名
    let thumbnail_path = temp_dir.join(format!("thumb_{}.jpg", random_id()));
    let thumbnail_str = thumbnail_path.to_str().ok_or("路径转换失败")?;
    
    // 使用FFmpeg获取视频的15%位置的一帧作为缩略图
    let status = Command::new("ffmpeg")
        .args(&[
            "-ss", "15%",
            "-i", &path,
            "-vframes", "1",
            "-vf", "scale=320:-1",
            "-q:v", "2",
            "-f", "image2",
            thumbnail_str
        ])
        .status()
        .map_err(|e| format!("运行ffmpeg失败: {}", e))?;
    
    if !status.success() {
        return Err("生成缩略图失败".into());
    }
    
    Ok(thumbnail_str.to_string())
}

/// 检查并创建应用数据目录
#[command]
fn check_app_data_directory() -> Result<String, String> {
    let app_data_dir = match app_data_dir(&Default::default()) {
        Some(dir) => dir,
        None => return Err("无法获取应用数据目录".into()),
    };

    let app_dir = app_data_dir.join("ClipFlow");
    
    // 确保目录存在
    if !app_dir.exists() {
        match fs::create_dir_all(&app_dir) {
            Ok(_) => (),
            Err(e) => return Err(format!("创建目录失败: {}", e)),
        }
    }

    Ok(app_dir.to_string_lossy().into_owned())
}

#[command]
fn save_project_file(project_id: String, content: String) -> Result<(), String> {
    let app_data_dir = match app_data_dir(&Default::default()) {
        Some(dir) => dir,
        None => return Err("无法获取应用数据目录".into()),
    };

    let app_dir = app_data_dir.join("ClipFlow");
    
    // 确保目录存在
    if !app_dir.exists() {
        match fs::create_dir_all(&app_dir) {
            Ok(_) => (),
            Err(e) => return Err(format!("创建目录失败: {}", e)),
        }
    }

    let file_path = app_dir.join(format!("{}.json", project_id));
    
    // 创建文件并写入内容
    let mut file = match File::create(&file_path) {
        Ok(file) => file,
        Err(e) => return Err(format!("创建文件失败: {}", e)),
    };

    match file.write_all(content.as_bytes()) {
        Ok(_) => (),
        Err(e) => return Err(format!("写入文件失败: {}", e)),
    }

    // 确认文件成功写入
    if !file_path.exists() {
        return Err("文件写入后无法确认其存在".into());
    }

    Ok(())
}

/// 剪辑视频
#[tauri::command]
async fn cut_video(params: CutVideoParams, window: Window) -> Result<String, String> {
    println!("开始剪辑视频: {:?}", params);
    
    // 确保FFmpeg已安装
    if !is_ffmpeg_installed() {
        return Err("未安装FFmpeg，请先安装FFmpeg后再试".into());
    }
    
    // 创建临时文件夹
    let temp_dir = std::env::temp_dir().join("ClipFlow_temp");
    fs::create_dir_all(&temp_dir).map_err(|e| format!("创建临时目录失败: {}", e))?;
    
    // 处理输出格式
    let format = params.format.unwrap_or_else(|| "mp4".to_string());
    
    // 处理视频质量
    let quality = params.quality.unwrap_or_else(|| "medium".to_string());
    let quality_params = match quality.as_str() {
        "low" => "-vf scale=1280:720 -b:v 1.5M",
        "medium" => "-vf scale=1920:1080 -b:v 4M",
        "high" => "-b:v 8M", // 保持原始分辨率
        _ => "-vf scale=1920:1080 -b:v 4M", // 默认中等质量
    };
    
    // 处理转场效果
    let transition_type = params.transition.unwrap_or_else(|| "none".to_string());
    let transition_duration = params.transition_duration.unwrap_or(1.0);
    
    // 处理音量
    let volume = params.volume.unwrap_or(1.0);
    
    // 处理字幕
    let add_subtitles = params.add_subtitles.unwrap_or(false);
    
    // 确保片段有效
    if params.segments.is_empty() {
        return Err("没有提供有效的片段信息".into());
    }
    
    // 为每个片段生成一个临时文件
    let mut segment_files = Vec::new();
    let mut subtitle_files = Vec::new();
    
    for (i, segment) in params.segments.iter().enumerate() {
        // 跳过无效片段
        if segment.end <= segment.start {
            println!("忽略无效片段: {:?}", segment);
            continue;
        }
        
        // 计算片段时长
        let duration = segment.end - segment.start;
        
        // 临时片段文件路径
        let segment_file = temp_dir.join(format!("segment_{}.{}", i, format));
        let segment_path = segment_file.to_string_lossy().to_string();
        
        // 处理视频滤镜
        let mut video_filters = String::new();
        
        // 添加音量调整
        if (volume - 1.0).abs() > 0.01 {
            if !video_filters.is_empty() {
                video_filters.push_str(",");
            }
            video_filters.push_str(&format!("volume={}", volume));
        }
        
        // 添加字幕
        if add_subtitles && segment.content.is_some() {
            // 创建字幕文件
            let subtitle_file = temp_dir.join(format!("subtitle_{}.srt", i));
            let subtitle_path = subtitle_file.to_string_lossy().to_string();
            subtitle_files.push(subtitle_path.clone());
            
            // 写入SRT格式字幕
            let mut file = File::create(&subtitle_file)
                .map_err(|e| format!("创建字幕文件失败: {}", e))?;
            
            writeln!(file, "1")
                .map_err(|e| format!("写入字幕失败: {}", e))?;
            writeln!(file, "00:00:00,000 --> 00:{:02}:{:02},000", 
                (duration as u32) / 60, (duration as u32) % 60)
                .map_err(|e| format!("写入字幕失败: {}", e))?;
            writeln!(file, "{}", segment.content.as_ref().unwrap())
                .map_err(|e| format!("写入字幕失败: {}", e))?;
            
            // 添加字幕滤镜
            if !video_filters.is_empty() {
                video_filters.push_str(",");
            }
            video_filters.push_str(&format!("subtitles='{}'", subtitle_path));
        }
        
        // 构建完整的滤镜参数
        let filter_param = if !video_filters.is_empty() {
            format!("-vf \"{}\"", video_filters)
        } else {
            String::new()
        };
        
        // 构建FFmpeg命令
        let ffmpeg_command = format!(
            "ffmpeg -y -ss {} -i \"{}\" -t {} {} {} -c:a aac -strict experimental \"{}\"",
            segment.start,
            params.input_path,
            duration,
            quality_params,
            filter_param,
            segment_path
        );
        
        // 发送进度更新
        window.emit("cut_progress", i as f64 / params.segments.len() as f64 * 0.6).unwrap_or_default();
        
        // 执行FFmpeg命令
        println!("执行FFmpeg命令: {}", ffmpeg_command);
        let output = Command::new("sh")
            .arg("-c")
            .arg(&ffmpeg_command)
            .output()
            .map_err(|e| format!("执行FFmpeg命令失败: {}", e))?;
            
        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            println!("FFmpeg错误: {}", error);
            return Err(format!("剪辑片段失败: {}", error));
        }
        
        segment_files.push(segment_path);
    }
    
    // 处理转场效果
    if transition_type != "none" && segment_files.len() > 1 {
        // 创建转场临时文件
        let mut transition_files = Vec::new();
        
        window.emit("cut_progress", 0.7).unwrap_or_default();
        
        for i in 0..segment_files.len() - 1 {
            let file1 = &segment_files[i];
            let file2 = &segment_files[i + 1];
            let transition_file = temp_dir.join(format!("transition_{}_{}.{}", i, i+1, format));
            let transition_path = transition_file.to_string_lossy().to_string();
            
            // 根据转场类型构建不同的命令
            let transition_command = match transition_type.as_str() {
                "fade" => format!(
                    "ffmpeg -y -i \"{}\" -i \"{}\" -filter_complex \"[0:v]format=pix_fmts=yuva420p,fade=t=out:st={}:d={}:alpha=1[fv1];[1:v]format=pix_fmts=yuva420p,fade=t=in:st=0:d={}:alpha=1[fv2];[fv1][fv2]overlay=format=yuv420[outv]\" -map \"[outv]\" \"{}\"",
                    file1, file2, 
                    transition_duration, transition_duration, transition_duration,
                    transition_path
                ),
                "dissolve" => format!(
                    "ffmpeg -y -i \"{}\" -i \"{}\" -filter_complex \"[0:v][1:v]xfade=transition=fade:duration={}:offset={}[outv]\" -map \"[outv]\" \"{}\"",
                    file1, file2, 
                    transition_duration, 5.0, // 从第5秒开始淡出
                    transition_path
                ),
                "wipe" => format!(
                    "ffmpeg -y -i \"{}\" -i \"{}\" -filter_complex \"[0:v][1:v]xfade=transition=wiperight:duration={}:offset={}[outv]\" -map \"[outv]\" \"{}\"",
                    file1, file2, 
                    transition_duration, 5.0,
                    transition_path
                ),
                "slide" => format!(
                    "ffmpeg -y -i \"{}\" -i \"{}\" -filter_complex \"[0:v][1:v]xfade=transition=slideleft:duration={}:offset={}[outv]\" -map \"[outv]\" \"{}\"",
                    file1, file2, 
                    transition_duration, 5.0,
                    transition_path
                ),
                _ => format!(
                    "ffmpeg -y -i \"{}\" -i \"{}\" -filter_complex \"[0:v][1:v]concat=n=2:v=1:a=0[outv]\" -map \"[outv]\" \"{}\"",
                    file1, file2, 
                    transition_path
                ),
            };
            
            // 执行转场命令
            println!("执行转场命令: {}", transition_command);
            let output = Command::new("sh")
                .arg("-c")
                .arg(&transition_command)
                .output()
                .map_err(|e| format!("执行FFmpeg转场命令失败: {}", e))?;
                
            if !output.status.success() {
                let error = String::from_utf8_lossy(&output.stderr);
                println!("FFmpeg错误: {}", error);
                return Err(format!("创建转场失败: {}", error));
            }
            
            transition_files.push(transition_path);
        }
        
        // 使用转场后的文件代替原文件
        segment_files = transition_files;
    }
    
    // 创建片段列表文件
    let list_file = temp_dir.join("segments.txt");
    let mut file = fs::File::create(&list_file)
        .map_err(|e| format!("创建片段列表文件失败: {}", e))?;
    
    for segment_path in &segment_files {
        writeln!(file, "file '{}'", segment_path)
            .map_err(|e| format!("写入片段列表失败: {}", e))?;
    }
    
    // 使用FFmpeg连接所有片段
    let concat_command = format!(
        "ffmpeg -y -f concat -safe 0 -i \"{}\" -c copy \"{}\"",
        list_file.to_string_lossy(),
        params.output_path
    );
    
    // 发送进度更新
    window.emit("cut_progress", 0.9).unwrap_or_default();
    
    // 执行连接命令
    println!("执行连接命令: {}", concat_command);
    let output = Command::new("sh")
        .arg("-c")
        .arg(&concat_command)
        .output()
        .map_err(|e| format!("执行FFmpeg连接命令失败: {}", e))?;
        
    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        println!("FFmpeg错误: {}", error);
        return Err(format!("连接片段失败: {}", error));
    }
    
    // 发送进度更新
    window.emit("cut_progress", 1.0).unwrap_or_default();
    
    // 清理临时文件
    for segment_path in segment_files {
        fs::remove_file(segment_path).unwrap_or_default();
    }
    for subtitle_path in subtitle_files {
        fs::remove_file(subtitle_path).unwrap_or_default();
    }
    fs::remove_file(list_file).unwrap_or_default();
    
    Ok(params.output_path)
}

/// 生成片段预览视频
#[tauri::command]
async fn generate_preview(params: PreviewParams) -> Result<String, String> {
    println!("生成预览片段: {:?}", params);
    
    // 确保FFmpeg已安装
    if !is_ffmpeg_installed() {
        return Err("未安装FFmpeg，请先安装FFmpeg后再试".into());
    }
    
    // 创建临时文件夹
    let temp_dir = std::env::temp_dir().join("ClipFlow_preview");
    fs::create_dir_all(&temp_dir).map_err(|e| format!("创建临时目录失败: {}", e))?;
    
    // 生成随机文件名
    let preview_file = temp_dir.join(format!("preview_{}.mp4", random_id()));
    let preview_path = preview_file.to_string_lossy().to_string();
    
    // 验证片段时间有效
    if params.segment.end <= params.segment.start {
        return Err("无效的片段时间范围".into());
    }
    
    // 计算片段时长
    let duration = params.segment.end - params.segment.start;
    
    // 处理音量参数
    let volume = params.volume.unwrap_or(1.0);
    let volume_filter = if (volume - 1.0).abs() > 0.01 {
        format!(",volume={}", volume)
    } else {
        "".to_string()
    };
    
    // 处理字幕参数
    let add_subtitles = params.add_subtitles.unwrap_or(false);
    let subtitle_filter = if add_subtitles {
        // 如果段落有内容，添加字幕
        if let Some(content) = &params.segment.type_field {
            // 将内容写入临时字幕文件
            let subtitle_file = temp_dir.join(format!("subtitle_{}.srt", random_id()));
            let mut file = File::create(&subtitle_file)
                .map_err(|e| format!("创建字幕文件失败: {}", e))?;
            
            // 写入SRT格式字幕
            writeln!(file, "1")
                .map_err(|e| format!("写入字幕失败: {}", e))?;
            writeln!(file, "00:00:00,000 --> 00:{:02}:{:02},000", 
                (duration as u32) / 60, (duration as u32) % 60)
                .map_err(|e| format!("写入字幕失败: {}", e))?;
            writeln!(file, "{}", content)
                .map_err(|e| format!("写入字幕失败: {}", e))?;
            
            // 添加字幕滤镜
            format!(",subtitles='{}'", subtitle_file.to_string_lossy())
        } else {
            "".to_string()
        }
    } else {
        "".to_string()
    };
    
    // 构建视频过滤器
    let video_filters = format!("scale=1280:720{}{}", volume_filter, subtitle_filter);
    
    // 构建FFmpeg命令
    let ffmpeg_command = format!(
        "ffmpeg -y -ss {} -i \"{}\" -t {} -vf \"{}\" -c:v libx264 -c:a aac -strict experimental \"{}\"",
        params.segment.start,
        params.input_path,
        duration,
        video_filters,
        preview_path
    );
    
    // 执行FFmpeg命令
    println!("执行FFmpeg命令: {}", ffmpeg_command);
    let output = Command::new("sh")
        .arg("-c")
        .arg(&ffmpeg_command)
        .output()
        .map_err(|e| format!("执行FFmpeg命令失败: {}", e))?;
        
    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        println!("FFmpeg错误: {}", error);
        return Err(format!("生成预览失败: {}", error));
    }
    
    Ok(preview_path)
}

/// 清理临时文件
#[tauri::command]
fn clean_temp_file(params: CleanFileParams) -> Result<(), String> {
    println!("清理临时文件: {}", params.path);
    
    // 检查路径有效性
    if !params.path.contains("temp") && !params.path.contains("ClipFlow") {
        return Err("无效的临时文件路径".into());
    }
    
    // 尝试删除文件
    if let Err(e) = fs::remove_file(&params.path) {
        println!("删除文件失败: {}", e);
        return Err(format!("清理临时文件失败: {}", e));
    }
    
    Ok(())
}

/// 列出应用数据目录中的文件
#[command]
fn list_app_data_files(directory: String) -> Result<Vec<String>, String> {
    let app_data_dir = match app_data_dir(&Default::default()) {
        Some(dir) => dir,
        None => return Err("无法获取应用数据目录".into()),
    };

    let target_dir = app_data_dir.join(directory);
    
    // 确保目录存在
    if !target_dir.exists() {
        match fs::create_dir_all(&target_dir) {
            Ok(_) => (),
            Err(e) => return Err(format!("创建目录失败: {}", e)),
        }
    }

    // 读取目录内容
    let entries = match fs::read_dir(&target_dir) {
        Ok(entries) => entries,
        Err(e) => return Err(format!("读取目录失败: {}", e)),
    };

    // 收集文件名
    let mut files = Vec::new();
    for entry in entries {
        match entry {
            Ok(entry) => {
                if let Some(file_name) = entry.file_name().to_str() {
                    files.push(file_name.to_string());
                }
            },
            Err(e) => return Err(format!("读取目录项失败: {}", e)),
        }
    }

    Ok(files)
}

/// 删除项目文件
#[command]
fn delete_project_file(project_id: String) -> Result<(), String> {
    let app_data_dir = match app_data_dir(&Default::default()) {
        Some(dir) => dir,
        None => return Err("无法获取应用数据目录".into()),
    };

    let file_path = app_data_dir.join("ClipFlow").join(format!("{}.json", project_id));
    
    // 检查文件是否存在
    if !file_path.exists() {
        return Err(format!("项目文件不存在: {}", file_path.display()));
    }

    // 删除文件
    match fs::remove_file(&file_path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("删除文件失败: {}", e)),
    }
}

/// 删除文件
#[command]
fn remove_file(path: String) -> Result<(), String> {
    match fs::remove_file(&path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("删除文件失败: {}", e)),
    }
}

/// 打开文件
#[command]
fn open_file(path: String) -> Result<(), String> {
    use std::process::Command;
    
    #[cfg(target_os = "windows")]
    {
        // Windows
        let status = Command::new("cmd")
            .args(&["/C", "start", "", &path])
            .status()
            .map_err(|e| format!("无法执行命令: {}", e))?;
        
        if !status.success() {
            return Err("无法打开文件".into());
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        // macOS
        let status = Command::new("open")
            .arg(&path)
            .status()
            .map_err(|e| format!("无法执行命令: {}", e))?;
        
        if !status.success() {
            return Err("无法打开文件".into());
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        // Linux
        let status = Command::new("xdg-open")
            .arg(&path)
            .status()
            .map_err(|e| format!("无法执行命令: {}", e))?;
        
        if !status.success() {
            return Err("无法打开文件".into());
        }
    }
    
    Ok(())
}

// 工具函数: 检查FFmpeg是否安装
fn is_ffmpeg_installed() -> bool {
    let ffmpeg = Command::new("ffmpeg")
        .arg("-version")
        .output();
    
    let ffprobe = Command::new("ffprobe")
        .arg("-version")
        .output();
    
    ffmpeg.is_ok() && ffprobe.is_ok()
}

/// 检查FFmpeg是否已安装
#[tauri::command]
fn check_ffmpeg() -> Result<HashMap<String, serde_json::Value>, String> {
    let mut result = HashMap::new();
    
    let is_installed = is_ffmpeg_installed();
    result.insert("installed".to_string(), serde_json::Value::Bool(is_installed));
    
    if is_installed {
        // 获取FFmpeg版本信息
        if let Ok(output) = Command::new("ffmpeg")
            .arg("-version")
            .output() {
            if output.status.success() {
                let version_str = String::from_utf8_lossy(&output.stdout);
                let first_line = version_str.lines().next().unwrap_or("");
                result.insert("version".to_string(), serde_json::Value::String(first_line.to_string()));
            }
        }
    }
    
    Ok(result)
}

// 工具函数: 解析FFmpeg帧率字符串 (如 "24000/1001")
fn parse_fps(fps_str: &str) -> f64 {
    let parts: Vec<&str> = fps_str.split('/').collect();
    if parts.len() == 2 {
        let numerator = parts[0].parse::<f64>().unwrap_or(0.0);
        let denominator = parts[1].parse::<f64>().unwrap_or(1.0);
        if denominator > 0.0 {
            return numerator / denominator;
        }
    }
    return 0.0;
}

// 工具函数: 生成随机ID
fn random_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    
    format!("{}", now)
}

fn main() {
    println!("启动 ClipFlow 应用");
    
    tauri::Builder::default()
        .setup(|_app| {
            println!("应用设置初始化");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            analyze_video,
            extract_key_frames,
            generate_thumbnail,
            check_app_data_directory,
            save_project_file,
            list_app_data_files,
            delete_project_file,
            remove_file,
            open_file,
            cut_video,
            generate_preview,
            clean_temp_file,
            check_ffmpeg
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
