//! Commentary 子模块统一导出

pub use super::director::{
    create_director_session, get_director_status, start_director_analysis,
    generate_director_plan, approve_director_plan, revise_director_plan,
    complete_director_render, destroy_director_session,
    DirectorPlan, DirectorState, DirectorStatusResponse, PlanModifications,
    SegmentMode, ScriptStylePreset,
};
pub use super::script_generator::{
    generate_commentary_script, ScriptGeneratorInput, ScriptGeneratorOutput, ScriptSegment, ScriptStyle,
};
pub use super::commentary_synthesizer::{
    synthesize_commentary_audio, estimate_tts_duration, list_commentary_voices,
    CommentarySynthesizer, SynthesizeOptions, SynthesizeResult, VoiceInfo,
};