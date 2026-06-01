//! Script Generator Types — 类型定义

use serde::{Deserialize, Serialize};

/// 脚本风格
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ScriptStyle {
    /// 幽默风趣
    Humorous,
    /// 严肃正式
    Serious,
    /// 接地气
    Conversational,
    /// 悬疑紧张
    Suspense,
    /// 温情治愈
    Warm,
}

impl Default for ScriptStyle {
    fn default() -> Self {
        ScriptStyle::Conversational
    }
}

impl std::fmt::Display for ScriptStyle {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ScriptStyle::Humorous => write!(f, "humorous"),
            ScriptStyle::Serious => write!(f, "serious"),
            ScriptStyle::Conversational => write!(f, "conversational"),
            ScriptStyle::Suspense => write!(f, "suspense"),
            ScriptStyle::Warm => write!(f, "warm"),
        }
    }
}

/// 脚本生成输入
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScriptGeneratorInput {
    /// 视频字幕/SRT 内容
    pub subtitles: String,
    /// 视频时长（秒）
    pub duration_secs: Option<f64>,
    /// 目标解说时长（秒）
    pub target_duration_secs: Option<f64>,
    /// 脚本风格
    pub style: Option<ScriptStyle>,
    /// 视频内容摘要（可选，用于 Coherence）
    pub summary: Option<String>,
    /// 核心看点列表（可选）
    pub highlights: Option<Vec<String>>,
    /// 推荐解说角度
    pub angle: Option<String>,
    /// AI 提供商
    pub provider: Option<String>,
    /// 模型名称
    pub model: Option<String>,
    /// API Key
    pub api_key: Option<String>,
    /// Base URL（可选）
    pub base_url: Option<String>,
    /// 系统提示词补充
    pub system_prompt_extra: Option<String>,
}

/// 脚本片段
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScriptSegment {
    /// 起始时间（秒）
    pub start_time: f64,
    /// 结束时间（秒）
    pub end_time: f64,
    /// 解说文案
    pub text: String,
    /// 情绪标签
    pub emotion: Option<String>,
}

/// 脚本生成输出
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScriptGeneratorOutput {
    /// 完整解说文案
    pub full_script: String,
    /// 分段解说
    pub segments: Vec<ScriptSegment>,
    /// 总时长估算（秒）
    pub estimated_duration_secs: f64,
    /// 使用的模型
    pub model_used: String,
    /// 提供商
    pub provider: String,
}