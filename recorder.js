/* ============================================================
   recorder.js — Animating Canvas Recorder
   Records the canvas stream to WebM video using MediaRecorder API
   ============================================================ */

let mediaRecorder;
let recordedChunks = [];
let isRecording = false;

/**
 * Start recording the canvas stream
 * @param {HTMLCanvasElement} canvas The Three.js canvas element
 * @param {Function} onStop Callback when recording stops (updates UI)
 */
export function startRecording(canvas, onStop) {
    if (isRecording) return;

    // Capture stream at 60fps
    const stream = canvas.captureStream(60);

    // Prefer VP9 codec for better quality like standard web video, fallback to VP8
    const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
    ];

    let selectedType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';

    console.log(`Starting recording with mimeType: ${selectedType}`);

    try {
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: selectedType,
            videoBitsPerSecond: 5000000 // 5 Mbps quality
        });
    } catch (e) {
        console.error('MediaRecorder error:', e);
        alert('Browser error: Recording not supported or codec missing.');
        if (onStop) onStop();
        return;
    }

    recordedChunks = [];
    isRecording = true;

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        isRecording = false;
        saveVideo();
        if (onStop) onStop();
    };

    mediaRecorder.start();
}

/**
 * Stop recording and trigger download
 */
export function stopRecording() {
    if (!isRecording || !mediaRecorder) return;
    mediaRecorder.stop();
}

/**
 * Save the recorded chunks as a .webm file
 */
function saveVideo() {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `pattern_recording_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);

    console.log('Video saved!');
}

/**
 * Check if currently recording
 */
export function getIsRecording() {
    return isRecording;
}
