const presetSelect = document.getElementById('preset-select');
    const presetLoadBtn = document.getElementById('preset-load');
    const presetSaveBtn = document.getElementById('preset-save');
    const presetDeleteBtn = document.getElementById('preset-delete');
    const PRESET_STORAGE_KEY = 'noiseMachinePresets';

    // --- 1. 保存されているプリセットを読み込んでドロップダウンを更新する関数 ---
    function updatePresetList() {
        const presets = JSON.parse(localStorage.getItem(PRESET_STORAGE_KEY)) || [];
        presetSelect.innerHTML = ''; // ドロップダウンを一旦空にする

        presets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.name;
            option.textContent = preset.name;
            presetSelect.appendChild(option);
        });
    }



    // --- 3. ページ読み込み時に一度リストを更新する ---
    updatePresetList();

    // ★★★ プリセット機能のロジック（LOAD & DELETE） ★★★

    // --- 4. プリセットを適用する中心的な関数 ---
    function applyPreset(settings) {
        if (!settings) return;

        // --- スライダーの値をUIとWeb Audio APIの両方に適用 ---
        const updateSlider = (sliderId, value, audioNode, paramName) => {
            const slider = document.getElementById(sliderId);
            if (slider) slider.value = value;
            if (audioNode) {
                // 'gain' や 'frequency' など、AudioParamオブジェクトのプロパティに値を設定
                if (audioNode[paramName]) {
                    audioNode[paramName].value = parseFloat(value);
                } else {
                    audioNode.value = parseFloat(value);
                }
            }
        };
        
        updateSlider('volume-slider', settings.volume, gainNode.gain);
        updateSlider('frequency-slider', settings.frequency, filterNode.frequency);
        updateSlider('q-slider', settings.resonance, filterNode.Q);
        updateSlider('feedback-slider', settings.feedback, feedbackGainNode.gain);
        updateSlider('distortion-slider', settings.distortion, null); // Distortionは特殊なので後で
        updateSlider('osc-frequency-slider', settings.oscFreq, oscillatorNode.frequency);
        updateSlider('osc-volume-slider', settings.oscVol, oscillatorGainNode.gain);
        updateSlider('lfo-rate-slider', settings.lfoRate, lfoNode.frequency);
        updateSlider('lfo-depth-slider', settings.lfoDepth, lfoDepthNode.gain);
        updateSlider('attack-slider', settings.attack, null);
        updateSlider('decay-slider', settings.decay, null);
        
        // Distortionスライダーの特殊処理
        const distortionSliderEl = document.getElementById('distortion-slider');
        if(distortionSliderEl) {
            distortionSliderEl.value = settings.distortion;
            // 既存のイベントリスナーを発火させてドライブとカーブを更新するのが最も確実
            distortionSliderEl.dispatchEvent(new Event('input'));
        }


        // --- ボタンが押されたかのように振る舞わせ、UIと処理を同時に更新 ---
        const updateButtons = (selector, savedType) => {
            if (!savedType) return;
            document.querySelectorAll(selector).forEach(btn => {
                if (btn.dataset.type === savedType) {
                    if (!btn.classList.contains('active')) btn.click();
                } else {
                    if (btn.classList.contains('active')) btn.click(); // NOTE: この方法は単純なトグルには不向きな場合がある
                }
            });
        };
        
        // NOTE: 上記のupdateButtonsは理想的ではないため、より確実な方法に変更します。
        const clickButton = (selector, savedType) => {
             if (!savedType) return;
             const targetButton = document.querySelector(`${selector}[data-type="${savedType}"]`);
             if (targetButton && !targetButton.classList.contains('active')) {
                 targetButton.click();
             }
        };
        
        clickButton('.noise-type', settings.noiseType);
        clickButton('.filter-type', settings.filterType);
        clickButton('.osc-type', settings.oscType);
        clickButton('.lfo-target', settings.lfoTarget);
        clickButton('.lfo-type', settings.lfoType);

        // ON/OFFスイッチの処理
        const oscSwitch = document.getElementById('osc-power-switch');
        if (oscSwitch && oscSwitch.classList.contains('on') !== settings.oscOn) {
            oscSwitch.click();
        }
    }

// --- 5. 「LOAD」ボタンが押された時の処理 ---
    presetLoadBtn.addEventListener('click', () => {
        const presetName = presetSelect.value;
        if (!presetName) {
            showNotification('読み込むプリセットが選択されていません。');
            return;
        }

        const presets = JSON.parse(localStorage.getItem(PRESET_STORAGE_KEY)) || [];
        const preset = presets.find(p => p.name === presetName);

        if (preset) {
            applyPreset(preset.values);
            showNotification(`「${presetName}」を読み込みました。`);
        } else {
            showNotification('エラー：プリセットが見つかりません。');
        }
    });

// --- 6. 「DELETE」ボタンが押された時の処理 ---
    presetDeleteBtn.addEventListener('click', () => {
        const presetName = presetSelect.value;
        if (!presetName) {
            showNotification('削除するプリセットが選択されていません。');
            return;
        }

        if (confirm(`本当に「${presetName}」を削除しますか？この操作は元に戻せません。`)) {
            let presets = JSON.parse(localStorage.getItem(PRESET_STORAGE_KEY)) || [];
            presets = presets.filter(p => p.name !== presetName);
            localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
            updatePresetList(); // リストを更新
            showNotification(`「${presetName}」を削除しました。`);
        }
    });

// ★★★ プリセット機能のロジック（EXPORT） ★★★
    const presetExportBtn = document.getElementById('preset-export');

presetExportBtn.addEventListener('click', () => {
        const presetsJSON = localStorage.getItem(PRESET_STORAGE_KEY);
        const presets = JSON.parse(presetsJSON) || [];

        if (presets.length === 0) {
            showNotification('書き出すプリセットがありません。');
            return;
        }

        const blob = new Blob([presetsJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `noise-machine-presets-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

// ★★★ プリセット機能のロジック（IMPORT） ★★★
    const presetImportBtn = document.getElementById('preset-import');
    const presetFileInput = document.getElementById('preset-file-input');

    // 1. 「IMPORT」ボタンが押されたら、隠れているファイル選択ダイアログを開く
    presetImportBtn.addEventListener('click', () => {
        presetFileInput.click(); // ファイル入力をプログラム的にクリック
    });

 // 2. ファイルが選択された時の処理
    presetFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const importedPresets = JSON.parse(e.target.result);
                if (!Array.isArray(importedPresets)) {
                    throw new Error('プリセットファイルは期待された形式ではありません。');
                }
                let currentPresets = JSON.parse(localStorage.getItem(PRESET_STORAGE_KEY)) || [];
                let importedCount = 0;
                let overwrittenCount = 0;
                importedPresets.forEach(importedPreset => {
                    if (importedPreset && importedPreset.name && importedPreset.values) {
                        const existingIndex = currentPresets.findIndex(p => p.name === importedPreset.name);
                        if (existingIndex > -1) {
                            currentPresets[existingIndex] = importedPreset;
                            overwrittenCount++;
                        } else {
                            currentPresets.push(importedPreset);
                            importedCount++;
                        }
                    }
                });
                localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(currentPresets));
                updatePresetList();
                showNotification(`${importedCount}個のプリセットを新しく追加し、${overwrittenCount}個のプリセットを上書きしました。`);
            } catch (error) {
                showNotification('ファイルの読み込みに失敗しました。有効なプリセットファイルではありません。');
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    });

    // ★★★ スライダーの数値を表示する機能 ★★★
    //const pitchStartSlider = document.getElementById('pitch-start-slider');
    
presetSaveBtn.addEventListener('click', () => {
        const presetName = prompt('プリセット名を入力してください：', 'My Awesome Noise');
        if (!presetName) return;
        const settings = { noiseType: document.querySelector('.noise-type.active')?.dataset.type, volume: document.getElementById('volume-slider').value, oscOn: document.getElementById('osc-power-switch').classList.contains('on'), oscType: document.querySelector('.osc-type.active')?.dataset.type, oscFreq: document.getElementById('osc-frequency-slider').value, oscVol: document.getElementById('osc-volume-slider').value, filterType: document.querySelector('.filter-type.active')?.dataset.type, frequency: document.getElementById('frequency-slider').value, resonance: document.getElementById('q-slider').value, lfoTarget: document.querySelector('.lfo-target.active')?.dataset.type, lfoRate: document.getElementById('lfo-rate-slider').value, lfoDepth: document.getElementById('lfo-depth-slider').value, lfoType: document.querySelector('.lfo-type.active')?.dataset.type, feedback: document.getElementById('feedback-slider').value, distortion: document.getElementById('distortion-slider').value, attack: document.getElementById('attack-slider').value, decay: document.getElementById('decay-slider').value,pitchStart: document.getElementById('pitch-start-slider').value,
    pitchEnd: document.getElementById('pitch-end-slider').value,
    pitchDecay: document.getElementById('pitch-decay-slider').value };
        console.log(JSON.stringify(settings, null, 2)); // ★追加: 設定オブジェクトをコンソールに見やすく表示
        const newPreset = { name: presetName, values: settings };
        const presets = JSON.parse(localStorage.getItem(PRESET_STORAGE_KEY)) || [];
        const existingIndex = presets.findIndex(p => p.name === presetName);
        if (existingIndex > -1) {
            if (confirm(`「${presetName}」は既に存在します。上書きしますか？`)) {
                presets[existingIndex] = newPreset;
            } else {
                return;
            }
        } else {
            presets.push(newPreset);
        }
        localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
        updatePresetList();
        presetSelect.value = presetName;
        showNotification(`「${presetName}」を保存しました！`); // alertを置き換え
    });

    // --- 「LOAD」ボタンのイベントリスナーを上書き ---
    presetLoadBtn.addEventListener('click', () => {
        const presetName = presetSelect.value;
        if (!presetName) {
            showNotification('読み込むプリセットが選択されていません。'); // alertを置き換え
            return;
        }
        const presets = JSON.parse(localStorage.getItem(PRESET_STORAGE_KEY)) || [];
        const preset = presets.find(p => p.name === presetName);
        if (preset) {
            applyPreset(preset.values);
            showNotification(`「${presetName}」を読み込みました。`); // alertを置き換え
        } else {
            showNotification('エラー：プリセットが見つかりません。'); // alertを置き換え
        }
    });

    // --- 「DELETE」ボタンのイベントリスナーを上書き ---
    presetDeleteBtn.addEventListener('click', () => {
        const presetName = presetSelect.value;
        if (!presetName) {
            showNotification('削除するプリセットが選択されていません。'); // alertを置き換え
            return;
        }
        if (confirm(`本当に「${presetName}」を削除しますか？この操作は元に戻せません。`)) {
            let presets = JSON.parse(localStorage.getItem(PRESET_STORAGE_KEY)) || [];
            presets = presets.filter(p => p.name !== presetName);
            localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
            updatePresetList();
            showNotification(`「${presetName}」を削除しました。`); // alertを置き換え
        }
    });