const startStopBtn = document.getElementById('sequencer-start-stop');
    const bpmSlider = document.getElementById('bpm-slider');
    const bpmDisplay = document.getElementById('bpm-display');
    const stepButtons = document.querySelectorAll('.step-button');

    let isSequencerPlaying = false;
    let currentStep = 0;
    let bpm = 120;
    let sequencerIntervalId = null;

    // --- ステップボタンのON/OFFを切り替える処理 ---
    stepButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.classList.toggle('active');
        });
    });

    // --- BPMスライダーを動かした時の処理 ---
    bpmSlider.addEventListener('input', (event) => {
        bpm = parseInt(event.target.value);
        bpmDisplay.textContent = bpm;
        // もし再生中なら、一度止めて新しいテンポで再開する
        if (isSequencerPlaying) {
            stopSequencer();
            startSequencer();
        }
    });

// --- シーケンサーのメインループ ---
    function sequencerLoop() {
        // 1. 前のステップのハイライトを消す
        const prevStep = (currentStep === 0) ? 15 : currentStep - 1;
        stepButtons[prevStep].classList.remove('playing');

        // 2. 現在のステップのボタンを取得し、ハイライトする
        const currentStepButton = stepButtons[currentStep];
        currentStepButton.classList.add('playing');

        // 3. 現在のステップがON（activeクラスを持つ）なら、音を鳴らす
        if (currentStepButton.classList.contains('active')) {
            // HITボタンのクリック処理をプログラム的に呼び出す
            hitButton.click();
        }

        // 4. 次のステップへ
        currentStep = (currentStep + 1) % 16;
    }

    // --- シーケンサーを開始する関数 ---
    function startSequencer() {
        // 1分あたりの拍数(BPM)から、16分音符1つあたりの時間を計算 (ミリ秒)
        const stepTime = 60000 / bpm / 4;
        
        sequencerIntervalId = setInterval(sequencerLoop, stepTime);
        startStopBtn.textContent = 'STOP';
        startStopBtn.style.backgroundColor = '#d9534f'; // 赤色に変更
        isSequencerPlaying = true;
    }

    // --- シーケンサーを停止する関数 ---
    function stopSequencer() {
        clearInterval(sequencerIntervalId);
        sequencerIntervalId = null;
        startStopBtn.textContent = 'START';
        startStopBtn.style.backgroundColor = '#4CAF50'; // 緑色に戻す
        isSequencerPlaying = false;
        currentStep = 0; // 停止したらステップをリセット

        // ★追加: 全てのステップのハイライトを消す
        stepButtons.forEach(button => button.classList.remove('playing'));
    }

// --- START/STOPボタンが押された時の処理 ---
    startStopBtn.addEventListener('click', () => {
        if (isSequencerPlaying) {
            stopSequencer();
        } else {
            // 電源がONの時だけシーケンサーを開始
            if (isPowerOn) {
                startSequencer();
            } else {
                showNotification('まず本体のPOWERをONにしてください。');
            }
        }
    });

    // ★★★ 新しい通知機能 ★★★

