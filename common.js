/* ⭐ STAR학생단 공통 스크립트 (학생/교사 페이지 공용) */
(function () {
  const LS_API = 'star_api_url';
  const STAR = (window.STAR = {});

  STAR.apiUrl = () => (((window.STAR_CONFIG && window.STAR_CONFIG.API_URL) || localStorage.getItem(LS_API) || '') + '').trim();
  STAR.setApiUrl = (u) => localStorage.setItem(LS_API, String(u).trim());

  STAR.call = async (action, payload = {}, token) => {
    const url = STAR.apiUrl();
    if (!url) throw Object.assign(new Error('API 주소가 설정되지 않았어요.'), { code: 'NOAPI' });
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(Object.assign({ action, token }, payload)),
        redirect: 'follow',
      });
    } catch (e) {
      throw Object.assign(new Error('서버에 연결할 수 없어요. 인터넷 연결이나 API 주소를 확인해 주세요.'), { code: 'NET' });
    }
    let data;
    try { data = await res.json(); }
    catch (e) {
      throw Object.assign(new Error('서버 응답을 읽을 수 없어요. Apps Script 배포 설정(액세스: 모든 사용자)을 확인해 주세요.'), { code: 'NET' });
    }
    if (!data.ok) throw Object.assign(new Error(data.error || '알 수 없는 오류가 났어요.'), { code: data.code });
    return data;
  };

  STAR.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  STAR.linkify = (s) => STAR.esc(s).replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)\]])/g,
    (u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);

  const pad = (n) => String(n).padStart(2, '0');
  const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  STAR.time = (ts) => {
    const d = new Date(Number(ts)), n = new Date();
    const hm = `${d.getHours() < 12 ? '오전' : '오후'} ${((d.getHours() + 11) % 12) + 1}:${pad(d.getMinutes())}`;
    return d.toDateString() === n.toDateString() ? hm : `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
  };
  STAR.dateLabel = (ts) => {
    const d = new Date(Number(ts));
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS[d.getDay()]})`;
  };
  STAR.ago = (ts) => {
    const s = Math.floor((Date.now() - Number(ts)) / 1000);
    if (s < 60) return '방금';
    if (s < 3600) return Math.floor(s / 60) + '분 전';
    if (s < 86400) return Math.floor(s / 3600) + '시간 전';
    return STAR.time(ts);
  };

  STAR.fmtSize = (b) => (b < 1024 ? b + 'B' : b < 1048576 ? (b / 1024).toFixed(0) + 'KB' : (b / 1048576).toFixed(1) + 'MB');
  STAR.driveId = (url) => { const m = String(url || '').match(/\/d\/([\w-]+)/) || String(url || '').match(/[?&]id=([\w-]+)/); return m ? m[1] : ''; };
  STAR.thumb = (id, w = 640) => `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${w}`;
  STAR.isImage = (name, mime) => /^image\//.test(mime || '') || /\.(png|jpe?g|gif|webp|bmp|heic)$/i.test(name || '');
  STAR.fileIcon = (name) => {
    const ext = (String(name).split('.').pop() || '').toLowerCase();
    if (/^(png|jpe?g|gif|webp|bmp|heic|svg)$/.test(ext)) return '🖼️';
    if (/^(pdf)$/.test(ext)) return '📕';
    if (/^(pptx?|key|odp)$/.test(ext)) return '📊';
    if (/^(xlsx?|csv|ods)$/.test(ext)) return '📗';
    if (/^(docx?|hwpx?|txt|odt|rtf)$/.test(ext)) return '📘';
    if (/^(mp4|mov|avi|webm|mkv)$/.test(ext)) return '🎬';
    if (/^(mp3|wav|m4a|ogg)$/.test(ext)) return '🎵';
    if (/^(zip|7z|rar)$/.test(ext)) return '🗜️';
    return '📄';
  };
  STAR.domain = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };

  STAR.fileToBase64 = (file) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(new Error('파일을 읽지 못했어요.'));
    r.readAsDataURL(file);
  });

  STAR.avatar = (nick, color, cls = '') =>
    `<span class="avatar ${cls}" style="--c:${STAR.esc(color || '#a5b4fc')}">${STAR.esc(Array.from(String(nick || '?'))[0] || '?')}</span>`;

  STAR.starSvg = (size = 28) => `<svg class="logo-star" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
    <defs><linearGradient id="lg${size}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset="1" stop-color="#ffb703"/></linearGradient></defs>
    <path fill="url(#lg${size})" d="M12 1.8l2.9 6.4 7 .7-5.3 4.7 1.6 6.9L12 16.9l-6.2 3.6 1.6-6.9L2.1 8.9l7-.7z"/></svg>`;

  STAR.toast = (msg, type = '') => {
    let box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => t.classList.add('out'), 3200);
    setTimeout(() => t.remove(), 3700);
  };

  // 범용 입력/확인 대화상자
  STAR.ask = ({ title, desc = '', fields = [], ok = '확인', danger = false }) => new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = `<form class="modal-card glass small">
      <h3>${STAR.esc(title)}</h3>${desc ? `<p class="muted">${STAR.esc(desc)}</p>` : ''}
      ${fields.map((f) => f.type === 'select'
        ? `<label class="field"><span>${STAR.esc(f.label)}</span><select name="${f.name}">${f.options.map((o) => `<option ${o === f.value ? 'selected' : ''}>${STAR.esc(o)}</option>`).join('')}</select></label>`
        : f.type === 'textarea'
        ? `<label class="field"><span>${STAR.esc(f.label)}</span><textarea name="${f.name}" rows="4">${STAR.esc(f.value || '')}</textarea></label>`
        : `<label class="field"><span>${STAR.esc(f.label)}</span><input name="${f.name}" type="${f.type || 'text'}" value="${STAR.esc(f.value || '')}" placeholder="${STAR.esc(f.placeholder || '')}" autocomplete="off"></label>`).join('')}
      <div class="modal-actions"><button type="button" class="btn ghost" data-x>취소</button><button class="btn ${danger ? 'danger' : 'primary'}">${STAR.esc(ok)}</button></div>
    </form>`;
    document.body.appendChild(wrap);
    const form = wrap.querySelector('form');
    const close = (v) => { wrap.remove(); resolve(v); };
    wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(null); });
    form.querySelector('[data-x]').onclick = () => close(null);
    form.onsubmit = (e) => { e.preventDefault(); close(Object.fromEntries(new FormData(form))); };
    setTimeout(() => (form.querySelector('input,textarea,select') || form.querySelector('.btn.primary,.btn.danger')).focus(), 30);
  });

  // 반짝이는 밤하늘 배경
  STAR.starfield = (cv) => {
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w, h, stars = [], shoot = null;
    function resize() {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      cv.width = w * d; cv.height = h * d; cv.style.width = w + 'px'; cv.style.height = h + 'px';
      ctx.setTransform(d, 0, 0, d, 0, 0);
      const n = Math.min(320, Math.round((w * h) / 5200));
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.3 + 0.2,
        p: Math.random() * 6.28, s: 0.4 + Math.random() * 1.4, g: Math.random() < 0.14,
      }));
    }
    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(s.p + (t / 1000) * s.s * 0.6));
        ctx.fillStyle = s.g ? '#ffe7a0' : '#dfe6ff';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      }
      if (!shoot && Math.random() < 0.0035) shoot = { x: w * (0.3 + Math.random() * 0.7), y: Math.random() * h * 0.35, l: 0 };
      if (shoot) {
        shoot.l++;
        const x = shoot.x - shoot.l * 7, y = shoot.y + shoot.l * 3.2, len = 90;
        const g = ctx.createLinearGradient(x, y, x + len, y - len * 0.45);
        g.addColorStop(0, 'rgba(255,240,200,.95)'); g.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.globalAlpha = Math.max(0, 1 - shoot.l / 55);
        ctx.strokeStyle = g; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y - len * 0.45); ctx.stroke();
        if (shoot.l > 55) shoot = null;
      }
      ctx.globalAlpha = 1;
      if (!reduce) requestAnimationFrame(frame);
    }
    addEventListener('resize', resize);
    resize();
    requestAnimationFrame(frame);
  };

  // API 주소 입력 화면 (config.js가 비어 있을 때)
  STAR.setupScreen = (el, onDone) => {
    el.innerHTML = `<div class="auth-card glass">
      <div class="brand-big">${STAR.starSvg(54)}<h1>처음 설정</h1><p>Apps Script 웹 앱 주소를 입력해 주세요.</p></div>
      <form id="apiForm"><label class="field"><span>웹 앱 URL</span><input name="u" placeholder="https://script.google.com/macros/s/…/exec" required></label>
      <button class="btn primary block">저장하고 시작하기</button>
      <p class="hint">💡 매번 입력하지 않으려면 GitHub의 <b>config.js</b>에 주소를 넣어 두세요.</p></form></div>`;
    el.querySelector('#apiForm').onsubmit = (e) => {
      e.preventDefault();
      const u = new FormData(e.target).get('u').trim();
      if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(u)) return STAR.toast('script.google.com 으로 시작하는 주소를 넣어 주세요.', 'err');
      STAR.setApiUrl(u); onDone();
    };
  };
})();
