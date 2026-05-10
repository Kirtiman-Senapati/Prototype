// Central sound utility using Web Audio API to prevent duplicate plays and bypass file asset requirements.

let lastNotificationTime = 0;
let lastChatTime = 0;

// Dual-tone high-fidelity professional chime
export const playNotificationSound = () => {
    const nowTime = Date.now();
    // Cooldown of 500ms to prevent duplicate triggers from multiple mounted components
    if (nowTime - lastNotificationTime < 500) return;
    lastNotificationTime = nowTime;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const now = ctx.currentTime;

        // Sound node 1 (Primary lower tone)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        gain1.gain.setValueAtTime(0.06, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);

        // Sound node 2 (Harmonic higher tone, slightly offset)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880.00, now + 0.08); // A5
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.setValueAtTime(0.08, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        // Execute synthesizer
        osc1.start(now);
        osc1.stop(now + 0.2);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.4);
    } catch (e) {
        console.warn("AudioContext playback prevented by browser restriction or missing API.", e);
    }
};

// Messaging-app popping high-fidelity chime
export const playChatSound = () => {
    const nowTime = Date.now();
    // Cooldown of 300ms to prevent double trigger on multi-device echo or socket double emits
    if (nowTime - lastChatTime < 300) return;
    lastChatTime = nowTime;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.08); // C6 sweep

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
    } catch (e) {
        console.warn("AudioContext chat playback prevented.", e);
    }
};
