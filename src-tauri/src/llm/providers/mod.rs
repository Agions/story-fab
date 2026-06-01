//! LLM Providers — per-provider API implementations
//!
//! Sub-modules (each provider is isolated):
//!   openai_compat.rs — OpenAI / DeepSeek / Qwen (shared REST pattern)
//!   gemini.rs        — Google Gemini API
//!   anthropic.rs     — Anthropic Claude API
//!   router.rs        — dispatcher, routes to the right provider

mod anthropic;
mod gemini;
mod openai_compat;
mod router;

pub use openai_compat::{call_deepseek, call_openai_compatible, call_qwen};
pub use gemini::call_gemini;
pub use anthropic::call_anthropic;
pub use router::call_llm_provider;