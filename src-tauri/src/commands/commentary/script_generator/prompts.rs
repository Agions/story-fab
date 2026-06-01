//! Script Generator Prompts — Prompt 构建

use super::types::ScriptStyle;

/// 构建系统 Prompt
pub fn build_system_prompt(style: ScriptStyle, summary: Option<&str>, angle: Option<&str>) -> String {
    let style_desc = match style {
        ScriptStyle::Humorous => "幽默搞笑、吐槽风格，语言生动有趣，善于制造笑点和梗",
        ScriptStyle::Serious => "严肃正式，注重逻辑和深度，分析到位，观点鲜明",
        ScriptStyle::Conversational => "轻松随意，像和朋友聊天一样，自然亲切，接地气",
        ScriptStyle::Suspense => "悬疑紧张，节奏紧凑，善于设置悬念，吊足观众胃口",
        ScriptStyle::Warm => "温情治愈，注重情感渲染，能够打动人心，引发共鸣",
    };

    let context = match (summary, angle) {
        (Some(s), Some(a)) => format!("视频内容：{}\n解说角度：{}", s, a),
        (Some(s), None) => format!("视频内容：{}", s),
        _ => String::new(),
    };

    format!(
        "你是一位专业的影视解说博主，擅长用生动的语言解说电影/电视剧/短视频。\n\
         风格要求：{}\n\n\
         {}\n\
         请根据提供的字幕内容，生成精彩的影视解说文案。\n\
         要求：\n\
         1. 语言生动有趣，有感染力\n\
         2. 适当加入场景描述和情感渲染\n\
         3. 不要照搬原字幕，要有自己的解读和评论\n\
         4. 控制节奏，不要太长或太短\n\
         5. 用中文输出",
        style_desc, context
    )
}

/// 构建用户 Prompt
pub fn build_user_prompt(
    subtitles: &str,
    duration_secs: Option<f64>,
    target_duration: Option<f64>,
    highlights: Option<&[String]>,
    style: ScriptStyle,
) -> String {
    let duration_info = match (duration_secs, target_duration) {
        (Some(d), Some(t)) => format!("原视频时长 {:.1} 秒，目标解说时长约 {} 秒", d, t as i32),
        (Some(d), None) => format!("原视频时长 {:.1} 秒", d),
        _ => "视频时长未知".to_string(),
    };

    let highlights_info = highlights
        .map(|h| {
            if h.is_empty() {
                String::new()
            } else {
                format!(
                    "\n\n核心看点：\n{}\n",
                    h.iter()
                        .enumerate()
                        .map(|(i, p)| format!("{}. {}", i + 1, p))
                        .collect::<Vec<_>>()
                        .join("\n")
                )
            }
        })
        .unwrap_or_default();

    // 悬疑风格要求分段叙事
    let structure_hint = match style {
        ScriptStyle::Suspense => "\n\n请按叙事节奏分段，每段设置一个小悬念，引导观众继续看下去。",
        _ => "",
    };

    format!(
        "请为以下影视内容生成解说文案：\n\
         {}{}\n\n\
         字幕内容：\n{}{}",
        duration_info, highlights_info, subtitles, structure_hint
    )
}