/* ===== 音效与震动模块 ===== */
(function(global) {
    "use strict";

    let audioCtx = null;
    let audioUnlocked = false;
    let shutterBuffer = null;
    let shutterLoading = false;

    function unlockAudio() {
        if (audioUnlocked) return;
        try {
            const AC = global.AudioContext || global.webkitAudioContext;
            if (!AC) return;
            if (!audioCtx) audioCtx = new AC();
            if (audioCtx.state === "suspended") {
                audioCtx.resume().then(() => {
                    loadShutterSound();
                });
            } else {
                loadShutterSound();
            }
            audioUnlocked = true;
        } catch (e) {}
    }

    // ===== 加载快门音效文件 =====
    function loadShutterSound() {
        if (!audioCtx || shutterBuffer || shutterLoading) return;
        shutterLoading = true;
        fetch("assets/sounds/soundreality-camera-shutter-171782.mp3")
            .then((r) => {
                if (!r.ok) throw new Error("load failed");
                return r.arrayBuffer();
            })
            .then((buf) => audioCtx.decodeAudioData(buf))
            .then((decoded) => {
                shutterBuffer = decoded;
            })
            .catch(() => {
                shutterLoading = false;
            });
    }

    // ===== 快门音效 =====
    function playShutterSound() {
        if (!audioCtx) return;
        if (audioCtx.state === "suspended") {
            audioCtx.resume().catch(() => {});
        }
        if (!shutterBuffer) {
            loadShutterSound();
            return;
        }
        const src = audioCtx.createBufferSource();
        src.buffer = shutterBuffer;

        const g = audioCtx.createGain();
        g.gain.value = 1.2;

        src.connect(g);
        g.connect(audioCtx.destination);
        src.start();
    }

    // ===== 按钮点击音效 =====
    function playClickSound() {
        if (!audioCtx) return;
        if (audioCtx.state === "suspended") {
            audioCtx.resume().catch(() => {});
        }

        const t0 = audioCtx.currentTime;
        const out = audioCtx.createGain();
        out.gain.value = 1;
        out.connect(audioCtx.destination);

        function makeNoise(dur, curve) {
            const len = Math.floor(audioCtx.sampleRate * dur);
            const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < len; i++) {
                const p = i / len;
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - p, curve);
            }
            return buf;
        }

        function burst(startTime, dur, curve, freq, q, peak, type) {
            const src = audioCtx.createBufferSource();
            src.buffer = makeNoise(dur, curve);

            const flt = audioCtx.createBiquadFilter();
            flt.type = type || "bandpass";
            flt.frequency.value = freq;
            flt.Q.value = q;

            const g = audioCtx.createGain();
            g.gain.setValueAtTime(0.0001, startTime);
            g.gain.exponentialRampToValueAtTime(peak, startTime + 0.001);
            g.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

            src.connect(flt);
            flt.connect(g);
            g.connect(out);

            src.start(startTime);
            src.stop(startTime + dur);
        }

        function click(startTime, freq, dur, peak) {
            const osc = audioCtx.createOscillator();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, startTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.7, startTime + dur);

            const g = audioCtx.createGain();
            g.gain.setValueAtTime(0.0001, startTime);
            g.gain.exponentialRampToValueAtTime(peak, startTime + 0.001);
            g.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

            osc.connect(g);
            g.connect(out);
            osc.start(startTime);
            osc.stop(startTime + dur);
        }

        burst(t0, 0.02, 6, 2200, 1.0, 0.55, "bandpass");
        burst(t0, 0.015, 6, 3500, 1.5, 0.3, "highpass");
        click(t0, 900, 0.025, 0.4);
    }

    // ===== 震动 =====
    function vibrate(ms) {
        ms = ms || 10;
        if (navigator.vibrate) {
            try {
                navigator.vibrate(ms);
            } catch (e) {}
        }
    }

    // ===== 首次交互解锁音频 =====
    function bindFirstInteraction() {
        function onFirst() {
            unlockAudio();
            document.removeEventListener("pointerdown", onFirst);
            document.removeEventListener("touchstart", onFirst);
            document.removeEventListener("click", onFirst);
        }
        document.addEventListener("pointerdown", onFirst, {
            passive: true
        });
        document.addEventListener("touchstart", onFirst, {
            passive: true
        });
        document.addEventListener("click", onFirst);
    }

    // ===== 全局按钮震动 + 点击音 =====
    function bindButtonFeedback() {
        document.addEventListener(
            "click",
            (e) => {
                const btn = e.target.closest(
                    "button, .more-item, .gallery-item"
                );
                if (!btn) return;
                vibrate(10);
                if (btn.id !== "captureBtn") {
                    playClickSound();
                }
            },
            true
        );
    }

    function init() {
        bindFirstInteraction();
        bindButtonFeedback();
    }

    global.ETCardFX = {
        init,
        unlockAudio,
        playShutterSound,
        playClickSound,
        vibrate,
    };
})(window);