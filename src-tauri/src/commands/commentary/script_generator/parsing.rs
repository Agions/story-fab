//! Script Generator Parsing — 脚本解析

use super::types::{ScriptGeneratorOutput, ScriptSegment, ScriptStyle};

/// 解析 LLM 输出为分段
pub fn parse_script_output(output: &str, style: ScriptStyle, estimated_duration: f64) -> Vec<ScriptSegment> {
    let paragraphs: Vec<&str> = output
        .lines()
        .filter(|l| !l.trim().is_empty())
        .collect();

    if paragraphs.is_empty() {
        return vec![];
    }

    let total_chars: usize = paragraphs.iter().map(|p| p.chars().count()).sum();
    if total_chars == 0 {
        return vec![];
    }

    // 按总时长分配时间戳
    let mut segments = Vec::new();
    let mut current_time = 0.0;

    for para in paragraphs {
        let text = para.to_string();
        let char_count = text.chars().count() as f64;
        let duration = (char_count / 5.0).max(1.0);
        let end_time = (current_time + duration).min(estimated_duration);

        let emotion = match style {
            ScriptStyle::Humorous => Some("humorous".to_string()),
            ScriptStyle::Suspense => Some("suspense".to_string()),
            ScriptStyle::Warm => Some("warm".to_string()),
            _ => None,
        };

        segments.push(ScriptSegment {
            start_time: current_time,
            end_time,
            text,
            emotion,
        });

        current_time = end_time;
    }

    // 最后一段延伸到估算总时长
    if let Some(last) = segments.last_mut() {
        if last.end_time < estimated_duration {
            last.end_time = estimated_duration;
        }
    }

    segments
}

/// 估算脚本时长
pub fn estimate_duration(full_script: &str) -> f64 {
    (full_script.chars().count() as f64 / 5.0).max(1.0)
}