// HSK タイピングゲーム TypeScript

interface HskTypingWord {
    id: number;
    chinese: string;
    pinyin: string;
    pinyin_with_tone: string;
    japanese_meaning: string;
}

interface SkippedWord {
    chinese: string;
    pinyin: string;
    japanese_meaning: string;
    userInput: string;
}

interface ClickSounds {
    correct: HTMLAudioElement;
    incorrect: HTMLAudioElement;
    success: HTMLAudioElement;
}

class HSKTypingGame {
    private words: HskTypingWord[] = [];
    private currentWordIndex: number = 0;
    private currentWord: HskTypingWord | null = null;
    private typedPinyin: string = '';
    private correctCount: number = 0;
    private skippedWords: SkippedWord[] = [];
    private startTime: number | null = null;
    private timerInterval: ReturnType<typeof setInterval> | null = null;
    private gameActive: boolean = false;

    // 音声設定
    private soundEnabled: boolean;
    private chineseAudioEnabled: boolean = true;
    private pinyinDisplayMode: boolean = true;
    private clickSounds: ClickSounds | null = null;

    // ゲーム設定要素
    private hskLevelSelect!: HTMLSelectElement;
    private wordCountSelect!: HTMLSelectElement;
    private startGameBtn!: HTMLButtonElement;

    // ゲームエリア要素
    private gameArea!: HTMLElement;
    private progressBar!: HTMLElement;
    private currentWordSpan!: HTMLElement;
    private totalWordsSpan!: HTMLElement;
    private correctCountSpan!: HTMLElement;
    private timerSpan!: HTMLElement;

    // 単語表示要素
    private chineseWordDiv!: HTMLElement;
    private japaneseMeaningDiv!: HTMLElement;
    private completedPinyinSpan!: HTMLElement;
    private currentCharSpan!: HTMLElement;
    private remainingPinyinSpan!: HTMLElement;

    // 入力要素
    private pinyinInput!: HTMLInputElement;
    private skipWordBtn!: HTMLButtonElement;
    private endGameBtn!: HTMLButtonElement;

    // 結果エリア要素
    private resultArea!: HTMLElement;
    private resultTotal!: HTMLElement;
    private resultCorrect!: HTMLElement;
    private resultAccuracy!: HTMLElement;
    private resultTime!: HTMLElement;
    private wrongWordsDiv!: HTMLElement;
    private playAgainBtn!: HTMLButtonElement;

    // 音声切り替えボタン
    private soundToggleBtn!: HTMLButtonElement;
    // 中国語音声切り替えボタン
    private chineseAudioToggleBtn!: HTMLButtonElement;
    // ピンイン表示ボタン
    private pinyinDisplayBtn!: HTMLButtonElement;

    constructor() {
        // スマホやPC以外の環境ではデフォルトでタイプ音をOFFにする
        this.soundEnabled = this.isDesktopEnvironment();

        this.initializeElements();
        // UI のトグル表示を初期状態に合わせて更新
        if (this.soundToggleBtn) {
            this.soundToggleBtn.textContent = this.soundEnabled ? 'ON' : 'OFF';
            this.soundToggleBtn.className = this.soundEnabled ? 'btn-secondary' : 'btn-danger';
        }
        if (this.chineseAudioToggleBtn) {
            this.chineseAudioToggleBtn.textContent = this.chineseAudioEnabled ? 'ON' : 'OFF';
            this.chineseAudioToggleBtn.className = this.chineseAudioEnabled ? 'btn-secondary' : 'btn-danger';
        }
        if (this.pinyinDisplayBtn) {
            this.pinyinDisplayBtn.textContent = this.pinyinDisplayMode ? 'ON' : 'OFF';
            this.pinyinDisplayBtn.className = this.pinyinDisplayMode ? 'btn-secondary' : 'btn-danger';
        }

        this.setupEventListeners();
        this.initializeAudio();
    }

    // ブラウザ環境からデスクトップ判定を行う（簡易）
    private isDesktopEnvironment(): boolean {
        try {
            const ua = navigator.userAgent || '';
            const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(ua);
            const isDesktop = /Windows NT|Macintosh|Linux x86_64|Linux/i.test(ua) && !isMobile;
            return !!isDesktop;
        } catch (e) {
            return false;
        }
    }

//////////////////////////////////////////////////////////
//コンストラクタ内の初期化関数
    private initializeElements(): void {
        // ゲーム設定要素
        this.hskLevelSelect = document.getElementById('hsk-level') as HTMLSelectElement;
        this.wordCountSelect = document.getElementById('word-count') as HTMLSelectElement;
        this.startGameBtn = document.getElementById('start-game') as HTMLButtonElement;

        // ゲームエリア要素
        this.gameArea = document.getElementById('game-area')!;
        this.progressBar = document.getElementById('progress')!;
        this.currentWordSpan = document.getElementById('current-word')!;
        this.totalWordsSpan = document.getElementById('total-words')!;
        this.correctCountSpan = document.getElementById('correct-count')!;
        this.timerSpan = document.getElementById('timer')!;

        // 単語表示要素
        this.chineseWordDiv = document.getElementById('chinese-word')!;
        this.japaneseMeaningDiv = document.getElementById('japanese-meaning')!;
        this.completedPinyinSpan = document.getElementById('completed-pinyin')!;
        this.currentCharSpan = document.getElementById('current-char')!;
        this.remainingPinyinSpan = document.getElementById('remaining-pinyin')!;

        // 入力要素
        this.pinyinInput = document.getElementById('pinyin-input') as HTMLInputElement;
        this.skipWordBtn = document.getElementById('skip-word') as HTMLButtonElement;
        this.endGameBtn = document.getElementById('end-game') as HTMLButtonElement;

        // 結果エリア要素
        this.resultArea = document.getElementById('result-area')!;
        this.resultTotal = document.getElementById('result-total')!;
        this.resultCorrect = document.getElementById('result-correct')!;
        this.resultAccuracy = document.getElementById('result-accuracy')!;
        this.resultTime = document.getElementById('result-time')!;
        this.wrongWordsDiv = document.getElementById('wrong-words')!;
        this.playAgainBtn = document.getElementById('play-again') as HTMLButtonElement;

        // 音声切り替えボタン
        this.soundToggleBtn = document.getElementById('sound-toggle') as HTMLButtonElement;

        // 中国語音声切り替えボタン
        this.chineseAudioToggleBtn = document.getElementById('chinese-audio-toggle') as HTMLButtonElement;

        // ピンイン表示ボタン
        this.pinyinDisplayBtn = document.getElementById('expert-mode') as HTMLButtonElement;
    }

    private setupEventListeners(): void {
        this.startGameBtn.addEventListener('click', () => this.startGame());
        this.pinyinInput.addEventListener('input', (e: Event) => this.handleInput(e));
        this.pinyinInput.addEventListener('keydown', (e: KeyboardEvent) => this.handleKeydown(e));
        this.skipWordBtn.addEventListener('click', () => this.skipCurrentWord());
        this.endGameBtn.addEventListener('click', () => this.endGame());
        this.playAgainBtn.addEventListener('click', () => this.resetGame());
        this.soundToggleBtn.addEventListener('click', () => this.toggleSound());
        this.chineseAudioToggleBtn.addEventListener('click', () => this.toggleChineseAudio());
        this.pinyinDisplayBtn.addEventListener('click', () => this.togglePinyinDisplay());

        // スペースキーでゲーム開始
        document.addEventListener('keydown', (e: KeyboardEvent) => this.handleGlobalKeydown(e));
    }

    private initializeAudio(): void {
        // 音声ファイルをプリロード
        try {
            // サウンドが無効ならプリロードもスキップ
            if (!this.soundEnabled) {
                this.clickSounds = null;
                return;
            }

            const audioFiles: Record<string, string> = {
                correct: '/audio/click-correct.wav',
                incorrect: '/audio/click-incorrect.wav',
                success: '/audio/success.wav'
            };

            const sounds: Partial<ClickSounds> = {};

            (Object.keys(audioFiles) as Array<keyof ClickSounds>).forEach(key => {
                const audio = new Audio(audioFiles[key]);
                audio.volume = 0.3;
                audio.preload = 'auto';

                // 読み込み成功時
                audio.addEventListener('canplaythrough', () => {
                    console.log(`音声ファイル読み込み成功: ${key}`);
                });

                // エラーハンドリング
                audio.addEventListener('error', (e: Event) => {
                    console.error(`音声ファイル読み込みエラー: ${key}`, e);
                });

                sounds[key] = audio;
            });

            this.clickSounds = sounds as ClickSounds;

        } catch (e) {
            console.log('音声ファイルの初期化に失敗しました:', e);
            this.soundEnabled = false;
        }
    }

//////////////////////////////////////////////////////////
//ゲームのオプション設定

    private toggleSound(): void {
        this.soundEnabled = !this.soundEnabled;
        this.soundToggleBtn.textContent = this.soundEnabled ? 'ON' : 'OFF';
        this.soundToggleBtn.className = this.soundEnabled ? 'btn-secondary' : 'btn-danger';

        if (this.soundEnabled) {
            // 有効化された場合、まだ clickSounds が無ければ初期化（プリロード）を行う
            if (!this.clickSounds) {
                this.initializeAudio();
                console.log('サウンドを有効化し、プリロードを実行しました');
            }
        } else {
            // 無効化された場合は再生中の音を止めて参照をクリア
            if (this.clickSounds) {
                try {
                    Object.values(this.clickSounds).forEach((a: HTMLAudioElement) => {
                        if (a && typeof a.pause === 'function') {
                            a.pause();
                            try { a.currentTime = 0; } catch (e) { /* ignore */ }
                        }
                    });
                } catch (e) {
                    console.warn('サウンド停止時にエラー:', e);
                }
                this.clickSounds = null;
            }
        }
    }

    private togglePinyinDisplay(): void {
        this.pinyinDisplayMode = !this.pinyinDisplayMode;
        this.pinyinDisplayBtn.textContent = this.pinyinDisplayMode ? 'ON' : 'OFF';
        this.pinyinDisplayBtn.className = this.pinyinDisplayMode ? 'btn-secondary' : 'btn-danger';

        // スキップボタンの表示/非表示を更新
        this.updateSkipButtonVisibility();
    }

    private toggleChineseAudio(): void {
        this.chineseAudioEnabled = !this.chineseAudioEnabled;
        this.chineseAudioToggleBtn.textContent = this.chineseAudioEnabled ? 'ON' : 'OFF';
        this.chineseAudioToggleBtn.className = this.chineseAudioEnabled ? 'btn-secondary' : 'btn-danger';
    }

    private updateSkipButtonVisibility(): void {
        if (this.gameActive) {
            this.skipWordBtn.style.display = !this.pinyinDisplayMode ? 'inline-block' : 'none';
        }
    }

//////////////////////////////////////////////////////////

    private playTypingSound(isCorrect: boolean = true): void {
        if (!this.soundEnabled || !this.clickSounds) return;

        try {
            const soundType: keyof ClickSounds = isCorrect ? 'correct' : 'incorrect';
            const audio = this.clickSounds[soundType];

            if (audio && audio.readyState >= 2) { // HAVE_CURRENT_DATA以上
                audio.currentTime = 0;
                audio.play().catch(e => {
                    console.log('タイピング音再生エラー:', e);
                });
            } else {
                console.log(`音声ファイルが準備できていません: ${soundType}`);
            }

        } catch (e) {
            console.log('音声再生エラー:', e);
        }
    }

    private playSuccessSound(): void {
        if (!this.soundEnabled || !this.clickSounds) return;

        try {
            const audio = this.clickSounds.success;
            if (audio && audio.readyState >= 2) { // HAVE_CURRENT_DATA以上
                audio.currentTime = 0;
                audio.play().catch(e => {
                    console.log('成功音再生エラー:', e);
                });
            } else {
                console.log('成功音ファイルが準備できていません');
            }

        } catch (e) {
            console.log('成功音再生エラー:', e);
        }
    }

    private playChineseAudio(): void {
        if (!this.currentWord || !this.chineseAudioEnabled) return;

        try {
            const audioPath = `/audio/hsk/${this.currentWord.id}.mp3`;
            const audio = new Audio(audioPath);

            // 音量を調整
            audio.volume = 0.8;

            // 問題表示後少し遅延してから再生（読みやすくするため）
            const wordId = this.currentWord.id;
            setTimeout(() => {
                audio.play().catch(e => {
                    console.log(`中国語音声再生エラー (ID: ${wordId}):`, e);
                });
            }, 500); // 500ms後に再生

        } catch (e) {
            console.log('中国語音声再生エラー:', e);
        }
    }

    private handleGlobalKeydown(e: KeyboardEvent): void {
        // ゲーム設定画面でスペースキーが押された場合
        const gameSettings = document.querySelector('.game-settings') as HTMLElement | null;
        if (e.code === 'Space' && !this.gameActive &&
            gameSettings && gameSettings.style.display !== 'none') {
            e.preventDefault(); // デフォルトのスペースキー動作を防ぐ
            this.startGame();
        }
    }

    // 配列をランダムにシャッフルする関数（Fisher-Yatesアルゴリズム）
    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array]; // 配列のコピーを作成
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    private async startGame(): Promise<void> {
        const level = parseInt(this.hskLevelSelect.value);
        const count = this.wordCountSelect.value;

        try {
            // 「全て」が選択された場合はlimitパラメータを省略
            const url = count === 'all'
                ? `/Api/HskWords?level=${level}`
                : `/Api/HskWords?level=${level}&limit=${parseInt(count)}`;

            const response = await fetch(url);
            const data: HskTypingWord[] | { error: string } = await response.json();

            if ('error' in data) {
                alert('エラー: ' + data.error);
                return;
            }

            // 単語をランダムにシャッフル
            this.words = this.shuffleArray(data);
            this.currentWordIndex = 0;
            this.correctCount = 0;
            this.skippedWords = [];
            this.gameActive = true;

            // UI更新
            const gameSettings = document.querySelector('.game-settings') as HTMLElement;
            const spacebarInstruction = document.querySelector('.spacebar-instruction') as HTMLElement;
            gameSettings.style.display = 'none';
            spacebarInstruction.style.display = 'none';
            this.startGameBtn.style.display = 'none';
            this.gameArea.style.display = 'block';
            this.resultArea.style.display = 'none';

            this.totalWordsSpan.textContent = String(this.words.length);
            this.pinyinInput.disabled = false;
            this.pinyinInput.focus();

            // スキップボタンの表示をピンイン表示モードで制御
            this.updateSkipButtonVisibility();

            // タイマー開始
            this.startTime = Date.now();
            this.timerInterval = setInterval(() => this.updateTimer(), 1000);

            this.showCurrentWord();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            alert('データの取得に失敗しました: ' + message);
        }
    }

    private showCurrentWord(): void {
        if (this.currentWordIndex >= this.words.length) {
            this.endGame();
            return;
        }

        this.currentWord = this.words[this.currentWordIndex];
        this.typedPinyin = '';

        // 単語情報を表示
        this.chineseWordDiv.textContent = this.currentWord.chinese;
        this.japaneseMeaningDiv.textContent = this.currentWord.japanese_meaning;

        // 入力フィールドをクリアして状態をリセット
        this.pinyinInput.value = '';
        this.pinyinInput.className = '';

        // ピンイン表示を更新
        this.updatePinyinDisplay();

        //進行状況を更新
        this.currentWordSpan.textContent = String(this.currentWordIndex + 1);
        this.correctCountSpan.textContent = String(this.correctCount);

        // プログレスバーを更新
        const progress = (this.currentWordIndex / this.words.length) * 100;
        this.progressBar.style.width = progress + '%';

        // 新しい単語が表示された時に中国語音声を再生
        this.playChineseAudio();

        // 次の単語の音声ファイルをプリロード（スムーズな再生のため）
        this.preloadNextAudio();
    }

    private preloadNextAudio(): void {
        if (this.currentWordIndex + 1 < this.words.length) {
            const nextWord = this.words[this.currentWordIndex + 1];
            try {
                const audioPath = `/audio/hsk/${nextWord.id}.mp3`;
                const audio = new Audio();
                audio.preload = 'metadata';
                audio.src = audioPath;
            } catch (e) {
                console.log('次の音声プリロードエラー:', e);
            }
        }
    }

    private updatePinyinDisplay(): void {
        if (!this.currentWord) return;

        const targetPinyin = this.currentWord.pinyin.toLowerCase();
        const input = this.pinyinInput.value.toLowerCase().trim();

        // ピンイン非表示モードの場合はピンインを表示しない
        if (!this.pinyinDisplayMode) {
            this.completedPinyinSpan.textContent = '';
            this.currentCharSpan.textContent = '';
            this.remainingPinyinSpan.textContent = '';
            return;
        }

        // 正しく入力された文字数を計算
        let correctLength = 0;
        for (let i = 0; i < Math.min(input.length, targetPinyin.length); i++) {
            if (input[i] === targetPinyin[i]) {
                correctLength++;
            } else {
                break; // 間違った文字が見つかったら停止
            }
        }

        const completed = targetPinyin.substring(0, correctLength);
        const current = correctLength < targetPinyin.length ?
                       targetPinyin.charAt(correctLength) : '';
        const remaining = targetPinyin.substring(correctLength + 1);

        this.completedPinyinSpan.textContent = completed;
        this.currentCharSpan.textContent = current;
        this.remainingPinyinSpan.textContent = remaining;
    }

    private handleInput(e: Event): void {
        if (!this.gameActive || !this.currentWord) return;

        const target = e.target as HTMLInputElement;
        const input = target.value.toLowerCase().trim();
        const targetPinyin = this.currentWord.pinyin.toLowerCase();
        const previousLength = this.typedPinyin.length;

        this.typedPinyin = input;

        // 文字が追加された場合にのみ音を再生
        if (input.length > previousLength) {
            // 正しく入力された部分の長さを確認
            let correctLength = 0;
            for (let i = 0; i < Math.min(input.length, targetPinyin.length); i++) {
                if (input[i] === targetPinyin[i]) {
                    correctLength++;
                } else {
                    break;
                }
            }

            // 新しく入力された文字が正しいかどうかを判定
            const isCorrect = correctLength >= previousLength + 1;
            this.playTypingSound(isCorrect);
        }

        // ピンイン表示を更新
        this.updatePinyinDisplay();

        // 入力チェック
        if (input === targetPinyin) {
            // 正解
            this.pinyinInput.className = 'correct';
            this.correctCount++;
            this.playSuccessSound(); // 正解時の特別な音
            this.nextWord();
        } else if (targetPinyin.startsWith(input)) {
            // 途中まで正解
            this.pinyinInput.className = '';
        } else {
            // 間違い
            this.pinyinInput.className = 'incorrect';
        }
    }

    private handleKeydown(e: KeyboardEvent): void {
        if (!this.gameActive || !this.currentWord) return;

        if (e.key === 'Enter') {
            const target = e.target as HTMLInputElement;
            const input = target.value.toLowerCase().trim();
            const targetPinyin = this.currentWord.pinyin.toLowerCase();

            if (input === targetPinyin) {
                // 正解の場合は既にhandleInputで処理済み
                return;
            } else {
                // 不正解の場合
                // ピンイン非表示モード（旧上級者モード）の場合のみスキップとして記録
                if (!this.pinyinDisplayMode) {
                    this.skippedWords.push({
                        chinese: this.currentWord.chinese,
                        pinyin: this.currentWord.pinyin,
                        japanese_meaning: this.currentWord.japanese_meaning,
                        userInput: input || '未入力'
                    });
                }
                this.nextWord();
            }
        }
    }

    private nextWord(): void {
        this.currentWordIndex++;
        this.showCurrentWord();
    }

    private skipCurrentWord(): void {
        if (!this.gameActive || this.pinyinDisplayMode || !this.currentWord) return;

        this.skippedWords.push({
            chinese: this.currentWord.chinese,
            pinyin: this.currentWord.pinyin,
            japanese_meaning: this.currentWord.japanese_meaning,
            userInput: 'スキップ'
        });

        this.nextWord();
    }

    private endGame(): void {
        this.gameActive = false;

        // タイマー停止
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // 結果を表示
        this.showResults();
    }

    private showResults(): void {
        this.gameArea.style.display = 'none';
        this.resultArea.style.display = 'block';

        const skippedCount = this.skippedWords.length;
        // 実際にプレイした単語数 = 正解数 + スキップ数
        const actualPlayedWords = this.correctCount + skippedCount;
        const accuracy = actualPlayedWords > 0 ? Math.round((this.correctCount / actualPlayedWords) * 100) : 0;
        const totalTime = this.startTime ? Date.now() - this.startTime : 0;

        // 結果の値を設定
        this.resultCorrect.textContent = String(this.correctCount);
        const resultSkippedEl = document.getElementById('result-skipped');
        if (resultSkippedEl) {
            resultSkippedEl.textContent = String(skippedCount);
        }
        this.resultAccuracy.textContent = accuracy + '%';
        this.resultTime.textContent = this.formatTime(totalTime);
        this.resultTotal.textContent = String(actualPlayedWords);

        // 結果表示をピンイン表示モードと非表示モードで分ける
        const statItems = document.querySelectorAll<HTMLElement>('.stat-item');
        if (!this.pinyinDisplayMode) {
            // ピンイン非表示モード（旧上級者モード）: 全項目表示
            statItems.forEach(item => item.style.display = 'block');
        } else {
            // ピンイン表示モード（旧通常モード）: 総時間、総単語数のみ表示
            statItems.forEach((item, index) => {
                // index 0: 正解数, 1: スキップ数, 2: 正解率 → 非表示
                // index 3: 総時間, 4: 総単語数 → 表示
                item.style.display = index >= 3 ? 'block' : 'none';
            });
        }

        // スキップした単語を表示（ピンイン非表示モードのみ）
        if (!this.pinyinDisplayMode && this.skippedWords.length > 0) {
            const skippedWordsHTML = `
                <h3>スキップした単語 (${this.skippedWords.length}個)</h3>
                ${this.skippedWords.map(word => `
                    <div class="wrong-word-item">
                        <div class="wrong-word-chinese">${word.chinese}</div>
                        <div class="wrong-word-pinyin">正解: ${word.pinyin}${word.userInput !== 'スキップ' ? ` | 入力: ${word.userInput}` : ''}</div>
                        <div class="wrong-word-meaning">${word.japanese_meaning}</div>
                    </div>
                `).join('')}
            `;
            this.wrongWordsDiv.innerHTML = skippedWordsHTML;
        } else {
            this.wrongWordsDiv.innerHTML = '';
        }
    }

    private resetGame(): void {
        // ゲーム状態をリセット
        this.words = [];
        this.currentWordIndex = 0;
        this.currentWord = null;
        this.typedPinyin = '';
        this.correctCount = 0;
        this.skippedWords = [];
        this.startTime = null;
        this.gameActive = false;

        // タイマーを停止
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // UIをリセット
        this.resultArea.style.display = 'none';
        const gameSettings = document.querySelector('.game-settings') as HTMLElement;
        const spacebarInstruction = document.querySelector('.spacebar-instruction') as HTMLElement;
        gameSettings.style.display = 'flex';
        spacebarInstruction.style.display = 'block';
        this.startGameBtn.style.display = 'block';
        this.pinyinInput.disabled = true;
        this.pinyinInput.value = '';
        this.pinyinInput.className = '';

        // プログレスバーをリセット
        this.progressBar.style.width = '0%';
    }

    private updateTimer(): void {
        if (this.startTime) {
            const elapsed = Date.now() - this.startTime;
            this.timerSpan.textContent = this.formatTime(elapsed);
        }
    }

    private formatTime(milliseconds: number): string {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// ページ読み込み完了後にゲームを初期化
document.addEventListener('DOMContentLoaded', () => {
    new HSKTypingGame();
});
