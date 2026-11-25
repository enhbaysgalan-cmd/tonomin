/* Bonjour Nomin: date invite */
(function () {
    'use strict';

    const SONG_ID = 'NYNfaQb_T3w'; // The Compass - Chamaig anh
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => Array.from(document.querySelectorAll(s));

    const answers = { day: null, food: [], when: null };

    /* ---------------- screens ---------------- */
    function show(id) {
        $$('.screen').forEach((s) => s.classList.remove('active'));
        $('#' + id).classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // put the "no" button back if we leave the question screen
        if (id !== 'screen-ask') noBtn.style.display = 'none';
    }
    $$('[data-next]').forEach((b) => b.addEventListener('click', () => show(b.dataset.next)));

    /* ---------------- floating hearts ---------------- */
    const heartsBg = $('#heartsBg');
    const HEARTS = ['💖', '💕', '💗', '💘', '❤️', '🌸', '✨'];
    function spawnHeart() {
        const h = document.createElement('span');
        h.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
        h.style.left = Math.random() * 100 + 'vw';
        h.style.fontSize = 12 + Math.random() * 22 + 'px';
        h.style.animationDuration = 7 + Math.random() * 7 + 's';
        heartsBg.appendChild(h);
        setTimeout(() => h.remove(), 15000);
    }
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        for (let i = 0; i < 6; i++) setTimeout(spawnHeart, i * 300);
        setInterval(spawnHeart, 800);
    }

    /* ---------------- music (YouTube) ---------------- */
    let player = null, playerReady = false, wantMusic = false, muted = false;
    const musicBtn = $('#musicBtn');

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = function () {
        player = new YT.Player('ytPlayer', {
            width: 1, height: 1, videoId: SONG_ID,
            playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: SONG_ID, playsinline: 1, rel: 0 },
            events: {
                onReady: () => { playerReady = true; if (wantMusic) startMusic(); },
                onStateChange: (e) => {
                    const playing = e.data === YT.PlayerState.PLAYING;
                    musicBtn.classList.toggle('playing', playing && !muted);
                    if (e.data === YT.PlayerState.ENDED) player.playVideo();
                }
            }
        });
    };

    function startMusic() {
        wantMusic = true;
        musicBtn.classList.add('show');
        if (!playerReady) return;
        try { player.unMute(); player.setVolume(70); player.playVideo(); } catch (_) {}
    }

    musicBtn.addEventListener('click', () => {
        if (!playerReady) return;
        const state = player.getPlayerState();
        if (state !== YT.PlayerState.PLAYING) { muted = false; startMusic(); }
        else { muted = !muted; muted ? player.pauseVideo() : player.playVideo(); }
        musicBtn.classList.toggle('muted', muted);
    });

    /* ---------------- intro envelope ---------------- */
    $('#envelope').addEventListener('click', function () {
        if (this.classList.contains('open')) return;
        this.classList.add('open');
        startMusic(); // tapping is the user gesture browsers need to allow sound
        setTimeout(() => show('screen-ask'), 1100);
    });

    /* ---------------- yes / no ---------------- */
    const yesBtn = $('#yesBtn');
    const noBtn = $('#noBtn');
    const NO_TEXTS = ['no', 'are you sure?', 'pls 🥺', 'nope', 'too slow 😜', 'think again', 'wrong button', 'hehe', 'nice try'];
    let dodges = 0, moving = false, lastPointer = { x: -9999, y: -9999 };

    function dodge(px, py) {
        if (px === undefined) { px = lastPointer.x; py = lastPointer.y; }
        const r = noBtn.getBoundingClientRect();
        if (!noBtn.classList.contains('free')) {
            // lift it out of the layout at its current spot, then glide away
            noBtn.style.left = r.left + 'px';
            noBtn.style.top = r.top + 'px';
            noBtn.classList.add('free');
            void noBtn.offsetWidth;
        }
        const vw = window.innerWidth, vh = window.innerHeight, m = 16;
        const yr = yesBtn.getBoundingClientRect();
        let best = null, bestScore = -1;
        for (let i = 0; i < 24; i++) {
            const x = m + Math.random() * (vw - r.width - m * 2);
            const y = 70 + Math.random() * (vh - r.height - 70 - m);
            const cx = x + r.width / 2, cy = y + r.height / 2;
            const overlapsYes = x < yr.right + 10 && x + r.width > yr.left - 10 && y < yr.bottom + 10 && y + r.height > yr.top - 10;
            if (overlapsYes) continue;
            const fromPointer = Math.hypot(cx - px, cy - py);
            const fromHere = Math.hypot(x - r.left, y - r.top);
            // far from the finger/cursor, but not a crazy teleport
            const score = Math.min(fromPointer, 420) - Math.max(0, fromHere - 380) * 0.5;
            if (score > bestScore) { bestScore = score; best = { x, y }; }
        }
        if (!best) return;
        noBtn.style.left = best.x + 'px';
        noBtn.style.top = best.y + 'px';

        dodges++;
        noBtn.textContent = NO_TEXTS[dodges % NO_TEXTS.length];
        const s = Math.min(1 + dodges * 0.07, 1.6);
        yesBtn.style.setProperty('--yes-scale', s);
        moving = true;
        setTimeout(() => { moving = false; }, 650);
    }

    // mouse: drift away when the cursor gets close
    document.addEventListener('pointermove', (e) => {
        lastPointer = { x: e.clientX, y: e.clientY };
        if (e.pointerType !== 'mouse' || moving) return;
        if (!$('#screen-ask').classList.contains('active')) return;
        const r = noBtn.getBoundingClientRect();
        const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        if (d < 85) dodge(e.clientX, e.clientY);
    });
    // touch / any press: it slips away instead of being pressed
    noBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); dodge(e.clientX, e.clientY); });
    noBtn.addEventListener('click', (e) => { e.preventDefault(); dodge(); });
    noBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dodge(); } });
    window.addEventListener('resize', () => { if (noBtn.classList.contains('free')) dodge(); });

    yesBtn.addEventListener('click', (e) => {
        const r = yesBtn.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, 40);
        noBtn.style.display = 'none';
        if (wantMusic && playerReady && player.getPlayerState() !== YT.PlayerState.PLAYING && !muted) startMusic();
        setTimeout(() => show('screen-yay'), 500);
    });

    function burst(x, y, n) {
        const items = ['💖', '💕', '🎉', '✨', '💗', '🌹', '🥰'];
        for (let i = 0; i < n; i++) {
            const el = document.createElement('span');
            el.className = 'burst';
            el.textContent = items[i % items.length];
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            document.body.appendChild(el);
            const ang = Math.random() * Math.PI * 2;
            const dist = 120 + Math.random() * 260;
            el.animate([
                { transform: 'translate(-50%,-50%) scale(.4)', opacity: 1 },
                { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(1.2) rotate(${Math.random() * 360}deg)`, opacity: 0 }
            ], { duration: 1100 + Math.random() * 700, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => el.remove();
        }
    }

    /* ---------------- choices ---------------- */
    $$('.choices').forEach((group) => {
        const name = group.dataset.group;
        const multi = group.dataset.multi === 'true';
        group.querySelectorAll('.choice').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (multi) {
                    btn.classList.toggle('selected');
                    answers[name] = Array.from(group.querySelectorAll('.selected')).map((b) => b.dataset.value);
                } else {
                    group.querySelectorAll('.choice').forEach((b) => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    answers[name] = btn.dataset.value;
                }
                updateButtons();
            });
        });
    });
    const otherFood = $('#otherFood');
    otherFood.addEventListener('input', updateButtons);

    function foods() {
        const list = answers.food.slice();
        const extra = otherFood.value.trim();
        if (extra) list.push(extra);
        return list;
    }
    function updateButtons() {
        $('#toFood').disabled = !answers.day;
        $('#finishBtn').disabled = !(answers.when && foods().length);
    }

    /* ---------------- final ---------------- */
    function summaryText() {
        return 'Nomin said YES! 💖\n' +
            '🎷 Quincy Jones Tribute Concert, Nov ' + answers.day + ' at 19:00\n' +
            '🍽️ Food: ' + foods().join(', ') + '\n' +
            '🕖 Eat: ' + answers.when;
    }

    $('#finishBtn').addEventListener('click', () => {
        $('#finalText').textContent = 'See you on ' + answers.day + ', huurhun huhde 💕';
        const sum = $('#summary');
        sum.innerHTML = '';
        [['Date', 'Nov ' + answers.day + ', 19:00'], ['Food', foods().join(', ')], ['Eat', answers.when]].forEach(([k, v]) => {
            const row = document.createElement('div');
            const b = document.createElement('b'); b.textContent = k;
            const s = document.createElement('span'); s.textContent = v;
            row.append(b, s); sum.appendChild(row);
        });
        show('screen-final');
        setTimeout(() => burst(window.innerWidth / 2, window.innerHeight / 3, 36), 300);
    });

    $('#sendBtn').addEventListener('click', async () => {
        const text = summaryText();
        const hint = $('#sendHint');
        if (navigator.share) {
            try { await navigator.share({ text }); hint.textContent = 'Sent 💌'; return; }
            catch (err) { if (err && err.name === 'AbortError') return; }
        }
        try {
            await navigator.clipboard.writeText(text);
            hint.textContent = 'Copied! Paste it to me in a message 💌';
        } catch (_) {
            hint.textContent = text;
        }
    });
})();
