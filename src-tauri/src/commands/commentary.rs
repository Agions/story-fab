//! Commentary Mode — AI 影视解说核心模块
//!
//! 包含 Director Agent、Script Generator、Commentary Synthesizer 三个子模块
//! 遵循"最优方案"架构设计
//!
//! ## 模块划分
//!
//! - [director.rs](director) — AI 导演 Agent，负责任务规划、状态机、多轮对话
//! - [script_generator.rs](script_generator) — LLM 文案生成器，负责解说词创作
//! - [commentary_synthesizer.rs](commentary_synthesizer) — 解说配音合成器

pub mod director;
pub mod script_generator;
pub mod commentary_synthesizer;

pub use director::{DirectorAgent, DirectorPlan, DirectorState};
pub use script_generator::{ScriptGenerator, ScriptStyle, generate_commentary_script};
pub use commentary_synthesizer::{CommentarySynthesizer, SynthesizeOptions};