/* Bonjour Nomin: date invite */
(function () {
    'use strict';

    const SONG_ID = 'NYNfaQb_T3w'; // The Compass - Chamaig anh
    const SONG_START = 10;         // seconds: start the song at 0:10
    // Her answers are emailed to you through FormSubmit (formsubmit.co).
    // Uses FormSubmit's private code instead of the email address.
    const FORM_ENDPOINT = 'https://formsubmit.co/ajax/4962c4c63c5e4d6ae3377f1c6c8b7717';
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => Array.from(document.querySelectorAll(s));

    const answers = { day: null, food: [], when: null };

    /* ---------------- open / YES alerts to your email ---------------- */
    // Open the site with ?me once on your own device and your visits stop sending alerts
    // (remembered on that device). Use ?me=off to turn alerts back on for that device.
    const IS_LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname); // local preview: log, don't send
    const params = new URLSearchParams(location.search);
    try {
        if (params.get('me') === 'off') localStorage.removeItem('tonomin-me');
        else if (params.has('me')) localStorage.setItem('tonomin-me', '1');
    } catch (_) {}
    let isMe = params.has('me') && params.get('me') !== 'off';
    try { isMe = isMe || localStorage.getItem('tonomin-me') === '1'; } catch (_) {}

    // device type, model (when the phone shares it), OS, app and screen size
    let deviceCache = null;
    async function deviceInfo() {
        if (deviceCache) return deviceCache;
        const ua = navigator.userAgent;
        const isIPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
        const type = isIPad || (/Android/.test(ua) && !/Mobile/.test(ua)) ? 'Tablet'
            : /iPhone|Android|Mobile/.test(ua) ? 'Phone' : 'Computer';

        let model = /iPhone/.test(ua) ? 'iPhone' : isIPad ? 'iPad' : '';
        const androidModel = ua.match(/Android [\d.]+; (?:[a-z]{2}-[a-z]{2}; )?([^;)]+?)(?: Build|\))/i);
        if (androidModel && androidModel[1] !== 'K') model = androidModel[1].trim();

        let os = 'Unknown';
        let m;
        if ((m = ua.match(/(?:iPhone|CPU) OS ([\d_]+)/))) os = (isIPad ? 'iPadOS ' : 'iOS ') + m[1].replace(/_/g, '.');
        else if ((m = ua.match(/Android ([\d.]+)/))) os = 'Android ' + m[1];
        else if (/Windows NT/.test(ua)) os = 'Windows';
        else if (/Mac OS X/.test(ua)) os = 'macOS';
        else if (/Linux/.test(ua)) os = 'Linux';

        // Chrome on Android hides the model in the UA string; ask for it if allowed
        try {
            if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
                const h = await navigator.userAgentData.getHighEntropyValues(['model', 'platformVersion']);
                if (h.model) model = h.model;
                if (h.platformVersion && /Android/.test(os) && os === 'Android 10') os = 'Android ' + h.platformVersion;
            }
        } catch (_) {}

        const app = /FBAN|FBAV|FB_IAB|Messenger/.test(ua) ? 'Facebook / Messenger app'
            : /Instagram/.test(ua) ? 'Instagram app' : /Line\//.test(ua) ? 'LINE app' : /Telegram/.test(ua) ? 'Telegram app'
            : /EdgA?\//.test(ua) ? 'Edge' : /SamsungBrowser/.test(ua) ? 'Samsung Internet'
            : /CriOS|Chrome/.test(ua) ? 'Chrome' : /FxiOS|Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Browser';

        deviceCache = {
            'Device type': type,
            'Device': model || (type === 'Computer' ? os + ' computer' : 'Unknown model'),
            'OS': os,
            'Opened in': app,
            'Screen': screen.width + '×' + screen.height
        };
        return deviceCache;
    }
    const sentEvents = new Set();
    async function alertMe(event, subject, extra) {
        if (isMe || sentEvents.has(event)) return;
        sentEvents.add(event);
        const payload = Object.assign({
            _subject: subject, _template: 'table', _captcha: 'false',
            Event: subject
        }, await deviceInfo(), {
            'Came from': document.referrer || '(direct link / app)',
            Time: new Date().toString()
        }, extra || {});
        if (IS_LOCAL) { console.log('[alert] ' + JSON.stringify(payload)); return; }
        fetch(FORM_ENDPOINT, {
            method: 'POST', keepalive: true,
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload)
        }).catch(() => {});
    }
    alertMe('opened', 'Nomin opened the invite');

    /* ---------------- screens ---------------- */
    function show(id) {
        $$('.screen').forEach((s) => s.classList.remove('active'));
        $('#' + id).classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // put the "no" button back if we leave the question screen
        if (id !== 'screen-ask') noBtn.style.display = 'none';
    }
    $$('[data-next]').forEach((b) => b.addEventListener('click', () => show(b.dataset.next)));

    /* ---------------- drifting sakura petals ---------------- */
    const petals = $('#petals');
    const PETAL_COLORS = ['#e8a79b', '#efc1b4', '#e39587'];
    function spawnPetal() {
        const p = document.createElement('span');
        p.className = 'petal';
        const size = 7 + Math.random() * 7;
        p.style.width = size + 'px';
        p.style.height = size * 0.8 + 'px';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.background = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
        p.style.setProperty('--drift', (Math.random() * 160 - 40) + 'px');
        const dur = 9 + Math.random() * 8;
        p.style.animationDuration = dur + 's';
        petals.appendChild(p);
        setTimeout(() => p.remove(), dur * 1000 + 200);
    }
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        for (let i = 0; i < 4; i++) setTimeout(spawnPetal, i * 500);
        setInterval(spawnPetal, 1400);
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
            playerVars: { autoplay: 0, controls: 0, start: SONG_START, playsinline: 1, rel: 0 },
            events: {
                onReady: () => { playerReady = true; if (wantMusic) startMusic(); },
                onStateChange: (e) => {
                    const playing = e.data === YT.PlayerState.PLAYING;
                    musicBtn.classList.toggle('playing', playing && !muted);
                    // loop back to 0:10, not to the very start
                    if (e.data === YT.PlayerState.ENDED) { player.seekTo(SONG_START, true); player.playVideo(); }
                }
            }
        });
    };

    function startMusic() {
        wantMusic = true;
        musicBtn.classList.add('show');
        if (!playerReady) return;
        try {
            player.unMute(); player.setVolume(70);
            if ((player.getCurrentTime() || 0) < SONG_START) player.seekTo(SONG_START, true);
            player.playVideo();
        } catch (_) {}
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
    let dodges = 0, moving = false, lastDodgeAt = 0, lastPointer = { x: -9999, y: -9999 };
    const TRAIL_COLORS = ['#e0442b', '#e9a93b', '#2f7f7a'];

    // little speed-line puffs left behind where the button was
    function puff(x, y, w, h, dx, dy) {
        const len = Math.hypot(dx, dy) || 1;
        for (let i = 0; i < 7; i++) {
            const d = document.createElement('span');
            d.className = 'puff';
            d.style.background = TRAIL_COLORS[i % TRAIL_COLORS.length];
            d.style.left = x + Math.random() * w + 'px';
            d.style.top = y + Math.random() * h + 'px';
            document.body.appendChild(d);
            const back = 18 + Math.random() * 26;
            d.animate([
                { transform: 'translate(-50%,-50%) scale(1)', opacity: 0.9 },
                { transform: `translate(calc(-50% - ${dx / len * back}px), calc(-50% - ${dy / len * back}px)) scale(0.2)`, opacity: 0 }
            ], { duration: 380 + Math.random() * 200, easing: 'ease-out' }).onfinish = () => d.remove();
        }
    }

    function dodge(px, py) {
        if (px === undefined) { px = lastPointer.x; py = lastPointer.y; }
        const r = noBtn.getBoundingClientRect();
        if (!noBtn.classList.contains('free')) {
            // leave an invisible stand-in so YES doesn't slide into the old spot
            const ghost = document.createElement('span');
            ghost.className = 'no-ghost';
            ghost.style.width = r.width + 'px';
            ghost.style.height = r.height + 'px';
            noBtn.after(ghost);
            noBtn.style.left = r.left + 'px';
            noBtn.style.top = r.top + 'px';
            noBtn.classList.add('free');
            void noBtn.offsetWidth;
        }
        const vw = window.innerWidth, vh = window.innerHeight, m = 12;
        const yr = yesBtn.getBoundingClientRect();
        const cx0 = r.left + r.width / 2, cy0 = r.top + r.height / 2;

        // short, quick hops (not teleports): 80–170px from where it is now
        let best = null, bestScore = -Infinity;
        for (let i = 0; i < 40; i++) {
            const ang = Math.random() * Math.PI * 2;
            const dist = 80 + Math.random() * 90;
            const x = Math.min(Math.max(cx0 + Math.cos(ang) * dist - r.width / 2, m), vw - r.width - m);
            const y = Math.min(Math.max(cy0 + Math.sin(ang) * dist - r.height / 2, 70), vh - r.height - m);
            const pad = 14;
            if (x < yr.right + pad && x + r.width > yr.left - pad && y < yr.bottom + pad && y + r.height > yr.top - pad) continue;
            const fromPointer = Math.hypot(x + r.width / 2 - px, y + r.height / 2 - py);
            const moved = Math.hypot(x - r.left, y - r.top);
            if (moved < 50) continue; // stuck against an edge: try another direction
            const score = Math.min(fromPointer, 260) + Math.random() * 20;
            if (score > bestScore) { bestScore = score; best = { x, y }; }
        }
        if (!best) best = { x: m + Math.random() * (vw - r.width - m * 2), y: 70 + Math.random() * (vh - r.height - 90) };

        puff(r.left, r.top, r.width, r.height, best.x - r.left, best.y - r.top);
        noBtn.style.left = best.x + 'px';
        noBtn.style.top = best.y + 'px';
        noBtn.classList.remove('zip');
        void noBtn.offsetWidth;
        noBtn.classList.add('zip');

        dodges++;
        noBtn.textContent = NO_TEXTS[dodges % NO_TEXTS.length];
        yesBtn.style.setProperty('--yes-scale', Math.min(1 + dodges * 0.06, 1.5));
        lastDodgeAt = Date.now();
        moving = true;
        setTimeout(() => { moving = false; }, 260);
    }

    // mouse: zip away when the cursor gets close
    document.addEventListener('pointermove', (e) => {
        lastPointer = { x: e.clientX, y: e.clientY };
        if (e.pointerType !== 'mouse' || moving) return;
        if (!$('#screen-ask').classList.contains('active')) return;
        const r = noBtn.getBoundingClientRect();
        const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        if (d < 80) dodge(e.clientX, e.clientY);
    });
    // phones: cancel the touch so no "click" is generated anywhere, then hop away
    noBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const t = e.touches[0];
        dodge(t.clientX, t.clientY);
    }, { passive: false });
    noBtn.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') return; // handled by touchstart
        e.preventDefault();
        dodge(e.clientX, e.clientY);
    });
    noBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); dodge(); });
    noBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dodge(); } });
    window.addEventListener('resize', () => { if (noBtn.classList.contains('free')) dodge(); });

    yesBtn.addEventListener('click', (e) => {
        // a tap meant for "no" must never count as "yes"
        if (Date.now() - lastDodgeAt < 500) return;
        const r = yesBtn.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, 40);
        alertMe('yes', 'Nomin clicked YES!', { 'Tried to press No': String(dodges) + ' times' });
        noBtn.style.display = 'none';
        if (wantMusic && playerReady && player.getPlayerState() !== YT.PlayerState.PLAYING && !muted) startMusic();
        setTimeout(() => show('screen-yay'), 500);
    });

    function burst(x, y, n) {
        const colors = ['#e0442b', '#e9a93b', '#2f7f7a', '#fbf5e6', '#1f2a44'];
        for (let i = 0; i < n; i++) {
            const el = document.createElement('span');
            el.className = 'confetti';
            el.style.background = colors[i % colors.length];
            if (i % 3 === 0) el.style.borderRadius = '50%';
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
        return 'Nomin said YES!\n' +
            '🎷 Quincy Jones Tribute Concert, Nov ' + answers.day + ' at 19:00\n' +
            '🍽️ Food: ' + foods().join(', ') + '\n' +
            '🕖 Eat: ' + answers.when;
    }

    $('#finishBtn').addEventListener('click', () => {
        $('#finalText').textContent = 'See you on ' + answers.day + ', huurhun huhde';
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
        emailAnswers();
    });

    // quietly email her answers to you (retries once if the network hiccups)
    let emailed = false;
    async function emailAnswers(attempt = 1) {
        if (emailed || isMe) return;
        const payload = {
            _subject: 'Nomin said YES! Concert on Nov ' + answers.day,
            _template: 'table',
            _captcha: 'false',
            Answer: 'YES',
            Date: 'Nov ' + answers.day + ', 19:00 (Quincy Jones Tribute Concert)',
            Food: foods().join(', '),
            Eat: answers.when,
            'No button dodges': String(dodges),
            'Sent at': new Date().toString()
        };
        Object.assign(payload, await deviceInfo());
        if (IS_LOCAL) { console.log('[answers] ' + JSON.stringify(payload)); emailed = true; return; }
        try {
            const res = await fetch(FORM_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            emailed = true;
        } catch (err) {
            if (attempt < 2) setTimeout(() => emailAnswers(attempt + 1), 3000);
        }
    }

    $('#sendBtn').addEventListener('click', async () => {
        const text = summaryText();
        const hint = $('#sendHint');
        if (navigator.share) {
            try { await navigator.share({ text }); hint.textContent = 'Sent!'; return; }
            catch (err) { if (err && err.name === 'AbortError') return; }
        }
        try {
            await navigator.clipboard.writeText(text);
            hint.textContent = 'Copied! Paste it to me in a message.';
        } catch (_) {
            hint.textContent = text;
        }
    });
})();
