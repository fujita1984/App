// HSK 4択クイズ TypeScript

interface HskWord {
    id: number;
    chinese: string;
    pinyin: string;
    pinyin_with_tone: string;
    japanese_meaning: string;
}

interface QuizChoice {
    text: string;
    isCorrect: boolean;
}

interface QuizQuestion {
    word: HskWord;
    mode: string;
    choices: QuizChoice[];
}

interface WrongAnswer {
    question: string;
    subtitle: string;
    correctAnswer: string;
    userAnswer: string;
    mode: string;
}

interface SkippedQuestion {
    question: string;
    correctAnswer: string;
}

class HSKQuizGame {
    private allWords: HskWord[] = [];
    private questions: QuizQuestion[] = [];
    private currentQuestionIndex: number = 0;
    private correctCount: number = 0;
    private wrongAnswers: WrongAnswer[] = [];
    private skippedQuestions: SkippedQuestion[] = [];
    private startTime: number | null = null;
    private quizActive: boolean = false;
    private chineseAudioEnabled: boolean = true;
    private successSound: HTMLAudioElement;

    // 設定要素
    private hskLevelSelect!: HTMLSelectElement;
    private questionCountSelect!: HTMLSelectElement;
    private quizModeSelect!: HTMLSelectElement;
    private startQuizBtn!: HTMLButtonElement;
    private chineseAudioToggleBtn!: HTMLButtonElement;
    private quizSettingsDiv!: HTMLElement;
    private spacebarInstructionDiv!: HTMLElement;

    // クイズエリア
    private quizArea!: HTMLElement;
    private currentQuestionSpan!: HTMLElement;
    private totalQuestionsSpan!: HTMLElement;
    private correctCountSpan!: HTMLElement;
    private questionText!: HTMLElement;
    private questionSubtitle!: HTMLElement;
    private choicesGrid!: HTMLElement;
    private skipQuestionBtn!: HTMLButtonElement;
    private endQuizBtn!: HTMLButtonElement;

    // 結果エリア
    private resultArea!: HTMLElement;
    private resultCorrect!: HTMLElement;
    private resultWrong!: HTMLElement;
    private resultSkipped!: HTMLElement;
    private resultAccuracy!: HTMLElement;
    private resultTime!: HTMLElement;
    private wrongAnswersDiv!: HTMLElement;
    private playAgainBtn!: HTMLButtonElement;

    constructor() {
        this.successSound = new Audio('/audio/success.wav');

        this.initializeElements();
        this.setupEventListeners();
    }

    private initializeElements(): void {
        // 設定要素
        this.hskLevelSelect = document.getElementById('hsk-level') as HTMLSelectElement;
        this.questionCountSelect = document.getElementById('question-count') as HTMLSelectElement;
        this.quizModeSelect = document.getElementById('quiz-mode') as HTMLSelectElement;
        this.startQuizBtn = document.getElementById('start-quiz') as HTMLButtonElement;
        this.chineseAudioToggleBtn = document.getElementById('chinese-audio-toggle') as HTMLButtonElement;
        this.quizSettingsDiv = document.getElementById('quiz-settings')!;
        this.spacebarInstructionDiv = document.getElementById('spacebar-instruction')!;

        // クイズエリア
        this.quizArea = document.getElementById('quiz-area')!;
        this.currentQuestionSpan = document.getElementById('current-question')!;
        this.totalQuestionsSpan = document.getElementById('total-questions')!;
        this.correctCountSpan = document.getElementById('correct-count')!;
        this.questionText = document.getElementById('question-text')!;
        this.questionSubtitle = document.getElementById('question-subtitle')!;
        this.choicesGrid = document.getElementById('choices-grid')!;
        this.skipQuestionBtn = document.getElementById('skip-question') as HTMLButtonElement;
        this.endQuizBtn = document.getElementById('end-quiz') as HTMLButtonElement;

        // 結果エリア
        this.resultArea = document.getElementById('result-area')!;
        this.resultCorrect = document.getElementById('result-correct')!;
        this.resultWrong = document.getElementById('result-wrong')!;
        this.resultSkipped = document.getElementById('result-skipped')!;
        this.resultAccuracy = document.getElementById('result-accuracy')!;
        this.resultTime = document.getElementById('result-time')!;
        this.wrongAnswersDiv = document.getElementById('wrong-answers')!;
        this.playAgainBtn = document.getElementById('play-again') as HTMLButtonElement;
    }

    private setupEventListeners(): void {
        this.startQuizBtn.addEventListener('click', () => this.startQuiz());
        this.skipQuestionBtn.addEventListener('click', () => this.skipQuestion());
        this.endQuizBtn.addEventListener('click', () => this.endQuiz());
        this.playAgainBtn.addEventListener('click', () => this.resetQuiz());
        this.chineseAudioToggleBtn.addEventListener('click', () => this.toggleChineseAudio());

        // スペースキーでクイズ開始
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.code === 'Space' && !this.quizActive &&
                this.quizSettingsDiv.style.display !== 'none') {
                e.preventDefault();
                this.startQuiz();
            }
        });

        // キーボードショートカット（1-4で選択肢を選ぶ）
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (!this.quizActive) return;

            const keyNum = parseInt(e.key);
            if (keyNum >= 1 && keyNum <= 4) {
                const buttons = this.choicesGrid.querySelectorAll<HTMLButtonElement>('.choice-button:not(.disabled)');
                if (buttons[keyNum - 1]) {
                    buttons[keyNum - 1].click();
                }
            }
        });
    }

    private toggleChineseAudio(): void {
        this.chineseAudioEnabled = !this.chineseAudioEnabled;
        this.chineseAudioToggleBtn.textContent = this.chineseAudioEnabled ? 'ON' : 'OFF';
        this.chineseAudioToggleBtn.classList.toggle('active', this.chineseAudioEnabled);
    }

    private async startQuiz(): Promise<void> {
        const level = parseInt(this.hskLevelSelect.value);
        const questionCount = parseInt(this.questionCountSelect.value);
        const mode = this.quizModeSelect.value;

        try {
            // APIからすべての単語を取得
            const response = await fetch(`/Api/HskWords?level=${level}`);
            const data: HskWord[] | { error: string } = await response.json();

            if ('error' in data) {
                alert('エラー: ' + data.error);
                return;
            }

            this.allWords = data;

            if (this.allWords.length < 4) {
                alert('単語が4つ未満のため、クイズを開始できません。');
                return;
            }

            // 問題を生成
            this.generateQuestions(questionCount, mode);

            // ゲーム状態をリセット
            this.currentQuestionIndex = 0;
            this.correctCount = 0;
            this.wrongAnswers = [];
            this.skippedQuestions = [];
            this.quizActive = true;
            this.startTime = Date.now();

            // UI更新
            this.quizSettingsDiv.style.display = 'none';
            this.spacebarInstructionDiv.style.display = 'none';
            this.startQuizBtn.style.display = 'none';
            this.quizArea.style.display = 'block';
            this.resultArea.style.display = 'none';

            this.totalQuestionsSpan.textContent = String(this.questions.length);

            // 最初の問題を表示
            this.showCurrentQuestion();

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            alert('データの取得に失敗しました: ' + message);
        }
    }

    private generateQuestions(count: number, mode: string): void {
        // 単語をシャッフル
        const shuffled = [...this.allWords].sort(() => Math.random() - 0.5);

        // 問題数を調整（単語数が少ない場合）
        const actualCount = Math.min(count, shuffled.length);

        this.questions = shuffled.slice(0, actualCount).map(word => {
            // 出題モードを決定
            let questionMode = mode;
            if (mode === 'mixed') {
                const modes = ['chinese-to-japanese', 'japanese-to-chinese'];
                questionMode = modes[Math.floor(Math.random() * modes.length)];
            }

            // 不正解の選択肢を3つ生成
            const wrongChoices = this.generateWrongChoices(word, questionMode, 3);

            // 正解と不正解を混ぜてシャッフル
            const allChoices: QuizChoice[] = [
                { text: this.getAnswerText(word, questionMode), isCorrect: true },
                ...wrongChoices.map(text => ({ text, isCorrect: false }))
            ].sort(() => Math.random() - 0.5);

            return {
                word,
                mode: questionMode,
                choices: allChoices
            };
        });
    }

    private getQuestionText(word: HskWord, mode: string): string {
        switch (mode) {
            case 'chinese-to-japanese':
                return word.chinese;
            case 'japanese-to-chinese':
                return word.japanese_meaning;
            default:
                return word.chinese;
        }
    }

    private getQuestionSubtitle(word: HskWord, mode: string): string {
        switch (mode) {
            case 'chinese-to-japanese':
                return word.pinyin_with_tone;
            case 'japanese-to-chinese':
                return '';
            default:
                return '';
        }
    }

    private getAnswerText(word: HskWord, mode: string): string {
        switch (mode) {
            case 'chinese-to-japanese':
                return word.japanese_meaning;
            case 'japanese-to-chinese':
                return word.chinese;
            default:
                return word.japanese_meaning;
        }
    }

    private generateWrongChoices(correctWord: HskWord, mode: string, count: number): string[] {
        const wrongChoices: string[] = [];
        const correctAnswer = this.getAnswerText(correctWord, mode);

        // 正解と重複しない候補を探す
        const candidateWords = this.allWords.filter(w => {
            const answer = this.getAnswerText(w, mode);
            return w.id !== correctWord.id && answer !== correctAnswer;
        });

        // ランダムに選択
        const shuffled = [...candidateWords].sort(() => Math.random() - 0.5);

        // 重複しない選択肢を取得
        const usedAnswers = new Set<string>([correctAnswer]);
        for (const w of shuffled) {
            if (wrongChoices.length >= count) break;

            const answer = this.getAnswerText(w, mode);
            if (!usedAnswers.has(answer)) {
                wrongChoices.push(answer);
                usedAnswers.add(answer);
            }
        }

        return wrongChoices;
    }

    private showCurrentQuestion(): void {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.endQuiz();
            return;
        }

        const question = this.questions[this.currentQuestionIndex];

        // 問題テキストを表示
        this.questionText.textContent = this.getQuestionText(question.word, question.mode);
        this.questionSubtitle.textContent = this.getQuestionSubtitle(question.word, question.mode);

        // 進行状況を更新
        this.currentQuestionSpan.textContent = String(this.currentQuestionIndex + 1);
        this.correctCountSpan.textContent = String(this.correctCount);

        // 選択肢を表示
        this.choicesGrid.innerHTML = '';
        question.choices.forEach((choice) => {
            const button = document.createElement('button');
            button.className = 'choice-button';
            button.textContent = choice.text;
            button.dataset.isCorrect = String(choice.isCorrect);
            button.dataset.text = choice.text;
            button.addEventListener('click', () => this.selectChoice(choice.isCorrect, button, question));
            this.choicesGrid.appendChild(button);
        });

        // 中国語音声を再生（中国語→日本語モードの場合）
        if (question.mode === 'chinese-to-japanese') {
            this.playChineseAudio(question.word.id);
        }
    }

    private selectChoice(isCorrect: boolean, button: HTMLButtonElement, question: QuizQuestion): void {
        // すべての選択肢を無効化
        const allButtons = this.choicesGrid.querySelectorAll<HTMLButtonElement>('.choice-button');
        allButtons.forEach(btn => btn.classList.add('disabled'));

        if (isCorrect) {
            button.classList.add('correct');
            this.correctCount++;
            // 正解音を再生
            this.successSound.currentTime = 0;
            this.successSound.play().catch(e => console.log('正解音再生エラー:', e));
        } else {
            button.classList.add('incorrect');
            // 正解の選択肢をハイライト
            allButtons.forEach(btn => {
                if (btn.dataset.isCorrect === 'true') {
                    btn.classList.add('show-correct');
                }
            });

            // 間違えた問題を記録
            this.wrongAnswers.push({
                question: this.getQuestionText(question.word, question.mode),
                subtitle: this.getQuestionSubtitle(question.word, question.mode),
                correctAnswer: this.getAnswerText(question.word, question.mode),
                userAnswer: button.dataset.text || '',
                mode: question.mode
            });
        }

        // 次の問題へ（時間を短縮）
        setTimeout(() => {
            this.currentQuestionIndex++;
            this.showCurrentQuestion();
        }, 600);
    }

    private skipQuestion(): void {
        const question = this.questions[this.currentQuestionIndex];
        this.skippedQuestions.push({
            question: this.getQuestionText(question.word, question.mode),
            correctAnswer: this.getAnswerText(question.word, question.mode)
        });

        this.currentQuestionIndex++;
        this.showCurrentQuestion();
    }

    private playChineseAudio(wordId: number): void {
        if (!this.chineseAudioEnabled) return;

        try {
            const audioPath = `/audio/hsk/${wordId}.mp3`;
            const audio = new Audio(audioPath);
            audio.volume = 0.8;

            setTimeout(() => {
                audio.play().catch(e => {
                    console.log(`中国語音声再生エラー (ID: ${wordId}):`, e);
                });
            }, 300);

        } catch (e) {
            console.log('中国語音声再生エラー:', e);
        }
    }

    private endQuiz(): void {
        this.quizActive = false;
        this.showResults();
    }

    private showResults(): void {
        this.quizArea.style.display = 'none';
        this.resultArea.style.display = 'block';

        const totalTime = this.startTime ? Date.now() - this.startTime : 0;
        const totalAnswered = this.correctCount + this.wrongAnswers.length;
        const accuracy = totalAnswered > 0 ? Math.round((this.correctCount / totalAnswered) * 100) : 0;

        this.resultCorrect.textContent = String(this.correctCount);
        this.resultWrong.textContent = String(this.wrongAnswers.length);
        this.resultSkipped.textContent = String(this.skippedQuestions.length);
        this.resultAccuracy.textContent = accuracy + '%';
        this.resultTime.textContent = this.formatTime(totalTime);

        // 間違えた問題を表示
        if (this.wrongAnswers.length > 0) {
            const wrongHTML = `
                <h3>❌ 間違えた問題 (${this.wrongAnswers.length}問)</h3>
                ${this.wrongAnswers.map(item => `
                    <div class="wrong-answer-item">
                        <div class="wrong-answer-question">
                            問題: ${item.question}
                            ${item.subtitle ? `<span style="color: #6c757d; font-size: 0.9em;">(${item.subtitle})</span>` : ''}
                        </div>
                        <div class="wrong-answer-correct">✓ 正解: ${item.correctAnswer}</div>
                        <div class="wrong-answer-user">✗ あなたの回答: ${item.userAnswer}</div>
                    </div>
                `).join('')}
            `;
            this.wrongAnswersDiv.innerHTML = wrongHTML;
        }
    }

    private resetQuiz(): void {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.correctCount = 0;
        this.wrongAnswers = [];
        this.skippedQuestions = [];
        this.startTime = null;
        this.quizActive = false;

        this.resultArea.style.display = 'none';
        this.quizSettingsDiv.style.display = 'flex';
        this.spacebarInstructionDiv.style.display = 'block';
        this.startQuizBtn.style.display = 'block';
    }

    private formatTime(milliseconds: number): string {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// ページ読み込み完了後にクイズを初期化
document.addEventListener('DOMContentLoaded', () => {
    new HSKQuizGame();
});
