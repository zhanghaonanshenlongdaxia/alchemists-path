// ============ AUDIO SYSTEM ============
var AUDIO_VERSION = 'au-1.0.0';
let audioCtx = null;
function initAudio() {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { audioCtx = null; }
}

// ============ BGM SYSTEM ============
var bgmTracks = {
    lab:    'bgm_lab.mp3',
    forest: 'bgm_forest.mp3',
    cave:   'bgm_cave.mp3',
    swamp:  'bgm_swamp.mp3',
    boss:   'bgm_boss.mp3'
};
var bgmCurrent = null;   // current track key
var bgmAudio = null;     // HTMLAudioElement
var bgmVolume = 0.35;    // default volume
var bgmFading = false;

function playBGM(trackKey) {
    if (bgmCurrent === trackKey && bgmAudio && !bgmAudio.paused) return;
    var src = bgmTracks[trackKey];
    if (!src) return;
    // Fade out current, then switch
    if (bgmAudio && !bgmAudio.paused) {
        bgmFading = true;
        var old = bgmAudio;
        var fadeOut = setInterval(function() {
            old.volume = Math.max(0, old.volume - 0.02);
            if (old.volume <= 0.01) {
                clearInterval(fadeOut);
                old.pause();
                old.src = '';
                bgmFading = false;
                _startBGM(src, trackKey);
            }
        }, 30);
    } else {
        _startBGM(src, trackKey);
    }
}

function _startBGM(src, trackKey) {
    bgmAudio = new Audio(src);
    bgmAudio.loop = true;
    bgmAudio.volume = 0;
    bgmCurrent = trackKey;
    var playPromise = bgmAudio.play();
    if (playPromise) {
        playPromise.then(function() {
            // Fade in
            var fadeIn = setInterval(function() {
                if (!bgmAudio) { clearInterval(fadeIn); return; }
                bgmAudio.volume = Math.min(bgmVolume, bgmAudio.volume + 0.02);
                if (bgmAudio.volume >= bgmVolume - 0.01) { bgmAudio.volume = bgmVolume; clearInterval(fadeIn); }
            }, 30);
        }).catch(function() {});
    }
}

function stopBGM() {
    if (bgmAudio) {
        var old = bgmAudio;
        var fadeOut = setInterval(function() {
            old.volume = Math.max(0, old.volume - 0.03);
            if (old.volume <= 0.01) { clearInterval(fadeOut); old.pause(); old.src = ''; }
        }, 30);
    }
    bgmAudio = null;
    bgmCurrent = null;
}
function playSound(type) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    try {
        if (type === 'hit') synthNote(200, 0.12, 'sawtooth', 0.2);
        else if (type === 'pickup') synthPickup();
        else if (type === 'craft') synthCraft();
        else if (type === 'drink') synthDrink();
        else if (type === 'swing') synthNote(400, 0.08, 'square', 0.12);
        else if (type === 'enemyHit') synthNote(150, 0.1, 'sawtooth', 0.15);
        else if (type === 'levelUp') synthLevelUp();
        else if (type === 'click') synthNote(800, 0.05, 'sine', 0.1);
        else if (type === 'error') synthNote(120, 0.2, 'square', 0.15);
    } catch(e) {}
}
function synthNote(freq, dur, wave, vol) {
    var sv = (typeof sfxVolume !== 'undefined') ? sfxVolume : 1;
    var t = audioCtx.currentTime, o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = wave; o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.3, t + dur);
    g.gain.setValueAtTime(vol * sv, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t + dur);
}
function synthPickup() {
    var sv = (typeof sfxVolume !== 'undefined') ? sfxVolume : 1;
    var t = audioCtx.currentTime, o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(500, t); o.frequency.exponentialRampToValueAtTime(1000, t+0.1);
    g.gain.setValueAtTime(0.15 * sv, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.15);
    o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t+0.15);
}
function synthCraft() {
    var sv = (typeof sfxVolume !== 'undefined') ? sfxVolume : 1;
    var t = audioCtx.currentTime;
    [400,600,800].forEach(function(f, i) {
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(f, t + i*0.08);
        g.gain.setValueAtTime(0.12 * sv, t + i*0.08); g.gain.exponentialRampToValueAtTime(0.001, t + i*0.08 + 0.15);
        o.connect(g); g.connect(audioCtx.destination); o.start(t + i*0.08); o.stop(t + i*0.08 + 0.15);
    });
}
function synthDrink() {
    var sv = (typeof sfxVolume !== 'undefined') ? sfxVolume : 1;
    var t = audioCtx.currentTime, o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(600, t+0.2);
    g.gain.setValueAtTime(0.15 * sv, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.25);
    o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t+0.25);
}
function synthLevelUp() {
    var sv = (typeof sfxVolume !== 'undefined') ? sfxVolume : 1;
    var t = audioCtx.currentTime;
    [500,700,900,1100].forEach(function(f, i) {
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(f, t + i*0.1);
        g.gain.setValueAtTime(0.12 * sv, t + i*0.1); g.gain.exponentialRampToValueAtTime(0.001, t + i*0.1 + 0.2);
        o.connect(g); g.connect(audioCtx.destination); o.start(t + i*0.1); o.stop(t + i*0.1 + 0.2);
    });
}
