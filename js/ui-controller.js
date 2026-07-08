powerSwitch.addEventListener('click', () => {
        if (!isPowerOn) {
            if (!audioContext) { setupAudio(); }
            audioContext.resume();
            isPowerOn = true;
            powerSwitch.textContent = 'POWER ON';
            powerSwitch.classList.add('on');
            // ビジュアライザーがON設定の時だけ描画を開始する
            if (isVisualizerOn) {
                drawWaveform();
            }
        } else {
            audioContext.suspend();
            isPowerOn = false;
            powerSwitch.textContent = 'POWER OFF';
            powerSwitch.classList.remove('on');
            cancelAnimationFrame(animationFrameId);
        }
    });

    volumeSlider.addEventListener('input', (event) => {
        if (gainNode) { gainNode.gain.value = parseFloat(event.target.value); }
    });

    // ★★★ ドライブ機能を完全に復活させた最終バージョン ★★★
    distortionSlider.addEventListener('input', (event) => {
        if (distortionNode && driveNode) {
            const amount = parseInt(event.target.value);
            
            // ドライブ（入力ゲイン）をスライダーと連動させる
            const driveValue = 1 + (amount / 1000) * 49;
            driveNode.gain.value = driveValue; 

            // 歪みのカーブを更新する
            distortionNode.curve = makeDistortionCurve(amount);
        }
    });

// ★★★ フィルターコントロールのイベントリスナー ★★★
    const frequencySlider = document.getElementById('frequency-slider');
    const qSlider = document.getElementById('q-slider');
    const filterButtons = document.querySelectorAll('.filter-type');

    frequencySlider.addEventListener('input', (event) => {
        if (filterNode) { 
            // 周波数は対数的な変化が自然なので、スライダーの値を変換して使う
            const minLog = Math.log(20);
            const maxLog = Math.log(20000);
            // スライダーの位置を0-1の範囲に正規化
            const range = maxLog - minLog;
            const logValue = parseFloat(event.target.value) / 20000;
            // 対数スケールに変換
            const freq = Math.exp(minLog + range * (parseFloat(event.target.value) / 20000));
            // filterNode.frequency.value = parseFloat(event.target.value); 
             filterNode.frequency.setTargetAtTime(parseFloat(event.target.value), audioContext.currentTime, 0.01);
        }
    });

    qSlider.addEventListener('input', (event) => {
        if (filterNode) { filterNode.Q.value = parseFloat(event.target.value); }
    });
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (filterNode) {
                // すべてのボタンから .active クラスを削除
                filterButtons.forEach(btn => btn.classList.remove('active'));
                // クリックされたボタンに .active クラスを追加
                button.classList.add('active');
                // フィルターのタイプを更新
                filterNode.type = button.dataset.type;
            }
        });
    });

    // ★★★ フィードバックコントロールのイベントリスナー ★★★
    const feedbackSlider = document.getElementById('feedback-slider');
    feedbackSlider.addEventListener('input', (event) => {
        if (feedbackGainNode) {
            feedbackGainNode.gain.value = parseFloat(event.target.value);
        }
    });

// ★★★ ノイズ種類切り替えのイベントリスナー ★★★
    const noiseButtons = document.querySelectorAll('.noise-type');
    noiseButtons.forEach(button => {
        button.addEventListener('click', () => {
            const newType = button.dataset.type;
            if (currentNoiseType === newType || !isPowerOn) return; // 同じタイプか電源OFFなら何もしない

            currentNoiseType = newType;

            // ボタンの見た目を更新
            noiseButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // ノイズの再生を入れ替える
            whiteNoiseNode.stop(); // 古いノイズを停止
            whiteNoiseNode = audioContext.createBufferSource(); // 新しいソースを作成
            whiteNoiseNode.buffer = noiseBuffers[currentNoiseType]; // 新しいバッファを設定
            whiteNoiseNode.loop = true;
            whiteNoiseNode.connect(driveNode); // ドライブに接続
            whiteNoiseNode.start(); // 新しいノイズを再生
        });
    });

    // ★★★ 種類の違うノイズを生成する専門の関数 ★★★
    
function drawWaveform() {
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteTimeDomainData(dataArray);
        canvasCtx.fillStyle = '#000000';
        canvasCtx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = '#00ff00';
        canvasCtx.beginPath();
        const sliceWidth = visualizerCanvas.width * 1.0 / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * visualizerCanvas.height / 2;
            if (i === 0) { canvasCtx.moveTo(x, y); } else { canvasCtx.lineTo(x, y); }
            x += sliceWidth;
        }
        canvasCtx.lineTo(visualizerCanvas.width, visualizerCanvas.height / 2);
        canvasCtx.stroke();

        // 自身を再度呼び出すことでループを継続する
        animationFrameId = requestAnimationFrame(drawWaveform);
    }

    // ★★★ 歪みの方式をtanh関数に戻す ★★★
    
const oscPowerSwitch = document.getElementById('osc-power-switch');
    const oscControls = document.getElementById('osc-controls');
    const oscTypeButtons = document.querySelectorAll('.osc-type');
    const oscFrequencySlider = document.getElementById('osc-frequency-slider');
    const oscVolumeSlider = document.getElementById('osc-volume-slider');

    oscPowerSwitch.addEventListener('click', () => {
        // メイン電源がONの時だけ動作
        if (!isPowerOn) return;

        isOscOn = !isOscOn;
        if (isOscOn) {
            oscPowerSwitch.textContent = 'OSC ON';
            oscPowerSwitch.classList.add('on'); // メイン電源と同じスタイルを適用
            oscControls.style.display = 'block';
            // ONにした瞬間のボリュームをスライダーの値に設定
            oscillatorGainNode.gain.setTargetAtTime(parseFloat(oscVolumeSlider.value), audioContext.currentTime, 0.01);
        } else {
            oscPowerSwitch.textContent = 'OSC OFF';
            oscPowerSwitch.classList.remove('on');
            oscControls.style.display = 'none';
            // OFFにしたら音量を0にする
            oscillatorGainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.01);
        }
    });

    // オシレーター波形タイプの切り替え
    oscTypeButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (oscillatorNode && isOscOn) {
                oscTypeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                oscillatorNode.type = button.dataset.type;
            }
        });
    });

    // オシレーター周波数の変更
    oscFrequencySlider.addEventListener('input', (e) => {
        if (oscillatorNode) {
            oscillatorNode.frequency.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01);
        }
    });

    // オシレーター音量の変更
    oscVolumeSlider.addEventListener('input', (e) => {
        // オシレーターがONの時だけボリューム変更を適用
        if (oscillatorNode && isOscOn) {
            oscillatorGainNode.gain.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01);
        }
    });

    // ★★★ LFOコントロールのイベントリスナー ★★★
    const lfoRateSlider = document.getElementById('lfo-rate-slider');
    const lfoDepthSlider = document.getElementById('lfo-depth-slider');
    const lfoTypeButtons = document.querySelectorAll('.lfo-type');
    const lfoTargetButtons = document.querySelectorAll('.lfo-target');

    // LFOの速さ(Rate)を変更
    lfoRateSlider.addEventListener('input', (e) => {
        if (lfoNode) {
            lfoNode.frequency.value = parseFloat(e.target.value);
        }
    });

    // LFOの深さ(Depth)を変更
    lfoDepthSlider.addEventListener('input', (e) => {
        if (lfoDepthNode) {
            lfoDepthNode.gain.value = parseFloat(e.target.value);
        }
    });

    // LFOの波形タイプを変更
    lfoTypeButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (lfoNode) {
                lfoTypeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                lfoNode.type = button.dataset.type;
            }
        });
    });

    // LFOのターゲットを変更
    lfoTargetButtons.forEach(button => {
        button.addEventListener('click', () => {
            // メイン電源が入っていない場合は何もしない
            if (!isPowerOn || !lfoDepthNode) return;

            // まず、すべての接続を解除
            lfoDepthNode.disconnect();

            // ターゲットボタンの見た目を更新
            lfoTargetButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const newTarget = button.dataset.target;
            currentLfoTarget = newTarget;

            // ターゲットに応じて接続先を切り替え
            if (newTarget === 'filterFrequency') {
                lfoDepthNode.connect(filterNode.frequency);
                lfoDepthSlider.max = 5000; // Depthスライダーの最大値を調整
            } else if (newTarget === 'oscFrequency') {
                lfoDepthNode.connect(oscillatorNode.frequency);
                lfoDepthSlider.max = 1000; // Depthスライダーの最大値を調整
            } else {
                // 'none' の場合はDepthを0にしておく
                lfoDepthSlider.value = 0;
                lfoDepthNode.gain.value = 0;
            }
        });
    });

// ★★★ ビジュアライザーON/OFFのイベントリスナー ★★★
    
const visualizerToggle = document.getElementById('visualizer-toggle');

    visualizerToggle.addEventListener('click', () => {
        isVisualizerOn = !isVisualizerOn;

        if (isVisualizerOn) {
            visualizerToggle.textContent = 'ON';
            visualizerToggle.classList.add('active');
            // 描画開始はメイン電源がONの時だけ
            if (isPowerOn) {
                drawWaveform();
            }
        } else {
            visualizerToggle.textContent = 'OFF';
            visualizerToggle.classList.remove('active');
            // 描画停止と画面クリアは、電源の状態に関係なく実行する
            cancelAnimationFrame(animationFrameId);
            setTimeout(() => {
                canvasCtx.fillStyle = '#000000';
                canvasCtx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
            }, 50);
        }
    });

    // ★★★ 録音機能のロジック ★★★
    
const hitButton = document.getElementById('hit-button');
    const attackSlider = document.getElementById('attack-slider');
    const decaySlider = document.getElementById('decay-slider');
    const pitchStartSlider = document.getElementById('pitch-start-slider');
    const pitchEndSlider = document.getElementById('pitch-end-slider');
    const pitchDecaySlider = document.getElementById('pitch-decay-slider');

    hitButton.addEventListener('click', () => {
        if (!isPowerOn || !audioContext) return;

        const now = audioContext.currentTime;
        const masterVolume = parseFloat(volumeSlider.value);

        const hitOsc = audioContext.createOscillator();
        hitOsc.type = 'sine';

        const hitEnvelope = audioContext.createGain();

        hitOsc.connect(hitEnvelope);
        hitEnvelope.connect(limiterNode);

        // 4. 音程の変化（ピッチエンベロープ）をスライダーの値から設定する
        const pitchStart = parseFloat(pitchStartSlider.value);
        const pitchEnd = parseFloat(pitchEndSlider.value);
        const pitchDecay = parseFloat(pitchDecaySlider.value);

        hitOsc.frequency.setValueAtTime(pitchStart, now);
        hitOsc.frequency.exponentialRampToValueAtTime(pitchEnd, now + pitchDecay);

        // 5. 音量の変化（アンプエンベロープ）を設定する
        const attackTime = parseFloat(attackSlider.value);
        const decayTime = parseFloat(decaySlider.value);
        hitEnvelope.gain.cancelScheduledValues(now);
        hitEnvelope.gain.setValueAtTime(0, now);
        hitEnvelope.gain.linearRampToValueAtTime(masterVolume, now + attackTime);
        hitEnvelope.gain.linearRampToValueAtTime(0, now + attackTime + decayTime);

        // 6. 発音をスケジュールする
        hitOsc.start(now);
        const stopTime = Math.max(pitchDecay, attackTime + decayTime) + 0.1; // ピッチと音量のエンベロープが長い方に合わせる
        hitOsc.stop(now + stopTime);
    });

    // ★★★ プリセット機能のロジック ★★★
    
const pitchStartDisplay = document.getElementById('pitch-start-display');

    pitchStartSlider.addEventListener('input', (event) => {
    pitchStartDisplay.textContent = event.target.value;
    });

    // ★★★ シーケンサー機能のロジック ★★★
    
function showNotification(message) {
        const notification = document.getElementById('notification');
        if (!notification) return; // もし要素がなければ何もしない

        // 以前のタイマーが残っていればクリア
        if (notification.timeoutId) {
            clearTimeout(notification.timeoutId);
        }

        notification.textContent = message;
        notification.classList.add('show');

        // 2秒後に通知を消すタイマーを設定
        notification.timeoutId = setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }

    // --- 「SAVE」ボタンのイベントリスナーを上書き ---
    