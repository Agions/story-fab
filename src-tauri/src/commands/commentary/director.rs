//! AI Director Agent —导演 Agent 核心模块
//!
//! 负责 Commentary Mode 的任务规划、状态机管理、用户介入决策
//!
//! ## 模块结构
//!
//! - `types.rs` — 所有类型定义（状态机、Plan、风格预设等）
//! - `states.rs` — 全局 HashMap 状态管理（get_state / update_state_from）
//! - `state_ops.rs` — 状态操作辅助函数（build_plan / apply_modifications 等）
//! - `commands.rs` — 8 个 Tauri 命令入口（薄封装，调用上述模块）

mod commands;
mod state_ops;
mod states;
mod types;

pub use types::*;
pub use states::*;
pub use commands::*;
