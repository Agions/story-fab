//! Script Generator Providers — re-exports of the canonical LLM providers.
//!
//! As of Stage 5b (refactor O1) the real provider implementations and the
//! dispatch scheduler live in a single place: `crate::llm::providers`. This
//! module previously duplicated those implementations (`openai_call.rs`,
//! `gemini_call.rs`, `anthropic_call.rs`) and a second scheduler (`call_llm`).
//! The duplicates have been removed and this module now only re-exports the
//! symbols the rest of `script_generator` still needs, routing all calls
//! through the canonical, shared code path.

pub use super::client::{get_default_model, get_http_client};
pub use crate::llm::providers::{
    call_anthropic, call_gemini, call_llm_provider, call_openai_compatible,
};
