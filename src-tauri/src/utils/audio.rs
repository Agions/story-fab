//! Audio/PCM processing utilities

/// Convert s16le PCM bytes to normalized f32 samples.
/// Skips the standard 44-byte WAV header before reading PCM samples.
/// Uses `chunks(2)` (not `_exact`) to safely drop any trailing partial chunk.
pub fn pcm_samples_from_wav(pcm_data: &[u8]) -> Vec<f32> {
    // Standard WAV header is 44 bytes (RIFF + fmt + data chunk header)
    let header_size = 44;
    let data = if pcm_data.len() > header_size {
        &pcm_data[header_size..]
    } else {
        pcm_data
    };

    data.chunks(2)
        .filter(|chunk| chunk.len() == 2)
        .map(|chunk| {
            let s16 = i16::from_le_bytes([chunk[0], chunk[1]]);
            s16 as f32 / 32768.0
        })
        .collect()
}