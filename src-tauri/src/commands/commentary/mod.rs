//! Commentary 子模块统一导出

pub mod director;
pub mod script_generator;
pub mod commentary_synthesizer;

pub use crate::commands::commentary::director::commands::{
    create_director_session, get_director_status, start_director_analysis,
    generate_director_plan, approve_director_plan, revise_director_plan,
    complete_director_render, destroy_director_session,
};
pub use crate::commands::commentary::director::types::{
    DirectorPlan, DirectorState, DirectorStatusResponse, PlanModifications,
    SegmentMode, ScriptStylePreset, VideoAnalysisResult, VideoType,
    ContentRating, EmotionPoint, DirectorStateMachine,
};
pub use crate::commands::commentary::script_generator::{
    generate_commentary_script, ScriptGeneratorInput, ScriptGeneratorOutput,
    ScriptSegment, ScriptStyle,
};
pub use crate::commands::commentary::commentary_synthesizer::synthesizer::{
    CommentarySynthesizer, SynthesizeOptions, SynthesizeResult, VoiceInfo,
};
pub use crate::commands::commentary::commentary_synthesizer::synthesizer::commands::{
    synthesize_commentary_audio, estimate_tts_duration, list_commentary_voices,
};