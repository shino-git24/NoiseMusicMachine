function createNoiseBuffer(type) {
        const bufferSize = audioContext.sampleRate * 2; // 2秒間のバッファ
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        let i;

        if (type === 'white') {
            for (i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
        } else if (type === 'pink') {
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                data[i] *= 0.11; // ゲイン調整
                b6 = white * 0.115926;
            }
        } else if (type === 'brown') {
            let lastOut = 0.0;
            for (i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5; // ゲイン調整
            }
        }
        
        return buffer;
    }

function setupAudio() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        noiseBuffers.white = createNoiseBuffer('white');
        noiseBuffers.pink = createNoiseBuffer('pink');
        noiseBuffers.brown = createNoiseBuffer('brown');
        
        whiteNoiseNode = audioContext.createBufferSource();
        whiteNoiseNode.buffer = noiseBuffers[currentNoiseType];
        whiteNoiseNode.loop = true;

        driveNode = audioContext.createGain();
        driveNode.gain.value = 1;

        distortionNode = audioContext.createWaveShaper();
        distortionNode.oversample = '4x';
        distortionNode.curve = makeDistortionCurve(parseInt(distortionSlider.value));

        filterNode = audioContext.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.value = parseFloat(document.getElementById('frequency-slider').value);
        filterNode.Q.value = parseFloat(document.getElementById('q-slider').value);

        feedbackGainNode = audioContext.createGain();
        feedbackGainNode.gain.value = parseFloat(document.getElementById('feedback-slider').value);

        delayNode = audioContext.createDelay();
        delayNode.delayTime.value = 0.01;

        limiterNode = audioContext.createDynamicsCompressor();
        limiterNode.threshold.value = -3.0;
        limiterNode.knee.value = 0.0;
        limiterNode.ratio.value = 20.0;
        limiterNode.attack.value = 0.005;
        limiterNode.release.value = 0.05;

        gainNode = audioContext.createGain();
        gainNode.gain.value = parseFloat(volumeSlider.value);

        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 2048;

        recorderDestinationNode = audioContext.createMediaStreamDestination();

        oscillatorNode = audioContext.createOscillator();
        oscillatorNode.type = 'sawtooth';
        oscillatorNode.frequency.value = 440;
        
        oscillatorGainNode = audioContext.createGain();
        oscillatorGainNode.gain.value = 0;

        lfoNode = audioContext.createOscillator();
        lfoNode.type = 'sine';
        lfoNode.frequency.value = 5;

        lfoDepthNode = audioContext.createGain();
        lfoDepthNode.gain.value = 0;

        lfoNode.connect(lfoDepthNode);

        // --- ノードの接続 ---
        whiteNoiseNode.connect(driveNode);
        oscillatorNode.connect(oscillatorGainNode);
        oscillatorGainNode.connect(driveNode);

        driveNode.connect(distortionNode);
        distortionNode.connect(filterNode);
        filterNode.connect(gainNode);
        
        gainNode.connect(limiterNode);
        
        limiterNode.connect(analyserNode);
        analyserNode.connect(audioContext.destination);
        limiterNode.connect(recorderDestinationNode);

        filterNode.connect(feedbackGainNode);
        feedbackGainNode.connect(delayNode);
        delayNode.connect(driveNode);

        whiteNoiseNode.start();
        oscillatorNode.start();
        lfoNode.start();
    }
    
    
function makeDistortionCurve(amount) {
        if (amount === 0) { return null; }
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        
        // amountをkという名前にして、歪みの強さとして使う
        const k = amount / 10; // 少し調整して変化を滑らかに

        for (let i = 0; i < n_samples; ++i) {
            const x = i * 2 / n_samples - 1;
            // tanh関数を使って波形を変形させる
            curve[i] = Math.tanh(x * k);
        }
        return curve;
    }

// ★★★ オシレーターコントロールのイベントリスナー ★★★
    