const recordButton = document.getElementById('record-button');
    const resultsArea = document.getElementById('recording-results');

    recordButton.addEventListener('click', () => {
        if (!isPowerOn) return; // 電源が入っていないと録音しない

        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    });

    function startRecording() {
        isRecording = true;
        recordedChunks = []; // チャンクをリセット
        resultsArea.innerHTML = ''; // 前回の結果をクリア

        const options = { mimeType: 'audio/webm' };
        try {
            mediaRecorder = new MediaRecorder(recorderDestinationNode.stream, options);
        } catch (e) {
            console.error('Error creating MediaRecorder:', e);
            isRecording = false;
            return;
        }


        mediaRecorder.addEventListener('dataavailable', (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        });

            mediaRecorder.addEventListener('stop', () => {
            // ★ Blobのタイプとファイル名を .wav に変更
            const blob = new Blob(recordedChunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);

            const audio = document.createElement('audio');
            audio.controls = true;
            audio.src = url;
            
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            const now = new Date();
            const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
            downloadLink.download = `noise-recording-${timestamp}.webm`;
            downloadLink.innerText = 'Download Recording';

            resultsArea.appendChild(audio);
            resultsArea.appendChild(downloadLink);
        });

        mediaRecorder.start();
        recordButton.textContent = 'STOP RECORDING';
        recordButton.classList.add('recording');
    }

    function stopRecording() {
        if (mediaRecorder) {
            mediaRecorder.stop();
        }
        isRecording = false;
        recordButton.textContent = 'RECORD';
        recordButton.classList.remove('recording');
    }
    
    // ★★★ HITボタンのイベントリスナー (ピッチ調整機能付き) ★★★
    