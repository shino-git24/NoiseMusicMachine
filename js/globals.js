let audioContext, whiteNoiseNode, driveNode, distortionNode, filterNode, feedbackGainNode, delayNode, gainNode, limiterNode, analyserNode,
    oscillatorNode, oscillatorGainNode,
    lfoNode, lfoDepthNode,
    envelopeGainNode; // ★ エンベロープ用のGainNodeを追加
    let noiseBuffers = {};
    let currentNoiseType = 'white';
    let mediaRecorder, recorderDestinationNode, recordedChunks = [];
    let isRecording = false;
    let isOscOn = false;
    let currentLfoTarget = 'none';

    let isPowerOn = false;
    let isVisualizerOn = true; // ビジュアライザーのON/OFF状態
    let animationFrameId;

    const powerSwitch = document.getElementById('power-switch');
    const volumeSlider = document.getElementById('volume-slider');
    const distortionSlider = document.getElementById('distortion-slider');
    const visualizerCanvas = document.getElementById('visualizer');
    const canvasCtx = visualizerCanvas.getContext('2d');

    