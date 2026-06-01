//! Director State Management — global state table

use std::collections::HashMap;
use std::sync::Mutex;
use once_cell::sync::Lazy;

use super::types::{DirectorStateMachine, DirectorState, ScriptStylePreset};

static DIRECTOR_STATES: Lazy<Mutex<HashMap<String, DirectorStateMachine>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

/// Get a clone of the DirectorStateMachine (creates if absent)
pub fn get_state(session_id: &str) -> DirectorStateMachine {
    let states = DIRECTOR_STATES.lock().expect("DIRECTOR_STATES poisoned");
    states
        .entry(session_id.to_string())
        .or_insert_with(|| DirectorStateMachine {
            session_id: session_id.to_string(),
            state: DirectorState::Idle,
            plan: None,
            script: None,
            analysis: None,
            style: ScriptStylePreset::Conversational,
            error: None,
            created_at: unix_timestamp(),
            updated_at: unix_timestamp(),
        })
        .clone()
}

/// Persist a modified DirectorStateMachine back to the global table
pub fn update_state_from(session_id: &str, machine: DirectorStateMachine) {
    let mut states = DIRECTOR_STATES.lock().expect("DIRECTOR_STATES poisoned");
    states.insert(session_id.to_string(), machine);
}

/// Update Director state
pub fn update_state(session_id: &str, new_state: DirectorState) {
    let mut states = DIRECTOR_STATES.lock().expect("DIRECTOR_STATES poisoned");
    if let Some(machine) = states.get_mut(session_id) {
        machine.state = new_state;
        machine.updated_at = unix_timestamp();
    }
}

/// Clear Director state
pub fn clear_state(session_id: &str) {
    let mut states = DIRECTOR_STATES.lock().expect("DIRECTOR_STATES poisoned");
    states.remove(session_id);
}

fn unix_timestamp() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

/// Helper: default voice for a given style
pub fn default_voice_for_style(style: ScriptStylePreset) -> String {
    match style {
        ScriptStylePreset::Humorous => "zh-CN-XiaoxiaoNeural".to_string(),
        ScriptStylePreset::Serious => "zh-CN-YunxiNeural".to_string(),
        ScriptStylePreset::Conversational => "zh-CN-YunyangNeural".to_string(),
        ScriptStylePreset::Suspense => "zh-CN-XiaoyiNeural".to_string(),
        ScriptStylePreset::Warm => "zh-CN-XiaoxiaoNeural".to_string(),
    }
}

pub fn uuid_simple() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    format!("plan_{}", now)
}
