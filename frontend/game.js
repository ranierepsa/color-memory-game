'use strict';

const COLORS = ['green', 'red', 'yellow', 'blue'];
const TONES = { green: 415, red: 310, yellow: 252, blue: 209 };
const FLASH_MS = 400;
const GAP_MS = 100;
const PLAYBACK_SPEED = 600;

let sequence = [];
let playerIndex = 0;
let accepting = false;
let audioCtx = null;

const statusEl   = document.getElementById('status');
const roundEl    = document.getElementById('round-display');
const startBtn   = document.getElementById('start-btn');
const gameoverEl = document.getElementById('gameover-panel');
const finalScore = document.getElementById('final-score');
const nameInput  = document.getElementById('player-name');
const saveBtn    = document.getElementById('save-btn');

function getAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

function playTone(color, durationMs) {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = TONES[color];
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationMs / 1000);
}

function flashButton(color, durationMs) {
    return new Promise(resolve => {
        const btn = document.getElementById('btn-' + color);
        btn.classList.add('active');
        playTone(color, durationMs);
        setTimeout(() => {
            btn.classList.remove('active');
            resolve();
        }, durationMs);
    });
}

async function playSequence() {
    accepting = false;
    setButtonsDisabled(true);
    statusEl.textContent = 'Watch…';
    for (const color of sequence) {
        await flashButton(color, FLASH_MS);
        await delay(GAP_MS);
    }
    accepting = true;
    setButtonsDisabled(false);
    statusEl.textContent = 'Your turn!';
}

function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function setButtonsDisabled(disabled) {
    document.querySelectorAll('.color-btn').forEach(b => b.disabled = disabled);
}

function nextRound() {
    sequence.push(COLORS[Math.floor(Math.random() * COLORS.length)]);
    playerIndex = 0;
    roundEl.textContent = 'Round ' + sequence.length;
    setTimeout(() => playSequence(), PLAYBACK_SPEED);
}

function startGame() {
    sequence = [];
    playerIndex = 0;
    accepting = false;
    gameoverEl.classList.add('hidden');
    startBtn.disabled = true;
    nextRound();
}

function playGameOverSound() {
    const ctx = getAudio();
    const now = ctx.currentTime;
    const notes = [220, 196, 174, 155];
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        const start = now + i * 0.18;
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.start(start);
        osc.stop(start + 0.35);
    });
}

function gameOver() {
    accepting = false;
    setButtonsDisabled(true);
    playGameOverSound();
    const score = sequence.length - 1;
    finalScore.textContent = score;
    statusEl.textContent = 'Game over!';
    roundEl.textContent = '';
    gameoverEl.classList.remove('hidden');
    startBtn.disabled = false;
}

document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!accepting) return;
        const color = btn.dataset.color;
        flashButton(color, FLASH_MS);
        if (color === sequence[playerIndex]) {
            playerIndex++;
            if (playerIndex === sequence.length) {
                accepting = false;
                setButtonsDisabled(true);
                statusEl.textContent = 'Correct!';
                setTimeout(() => nextRound(), 800);
            }
        } else {
            gameOver();
        }
    });
});

startBtn.addEventListener('click', startGame);

saveBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    if (!name) { nameInput.focus(); return; }
    const score = parseInt(finalScore.textContent, 10);
    saveBtn.disabled = true;
    try {
        await fetch('api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, score })
        });
        gameoverEl.classList.add('hidden');
        nameInput.value = '';
    } catch (e) {
        console.error('Failed to save score', e);
    } finally {
        saveBtn.disabled = false;
        loadLeaderboard();
    }
});

async function loadLeaderboard() {
    try {
        const res = await fetch('api/scores/top');
        const data = await res.json();
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = data.map((s, i) =>
            `<li><span><span class="rank">#${i + 1}</span>${s.name}</span><span class="pts">${s.score}</span></li>`
        ).join('');
    } catch (e) {
        console.error('Failed to load leaderboard', e);
    }
}

loadLeaderboard();
