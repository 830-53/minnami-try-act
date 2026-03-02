const ADMIN_PASSWORD = 'minami-try&act';

// ---- Video Player ----
(function () {
  const video = document.getElementById('main-video');
  if (!video) return;

  const playPauseBtn = document.getElementById('btn-play-pause');
  const rewindBtn = document.getElementById('btn-rewind');
  const forwardBtn = document.getElementById('btn-forward');
  const progressContainer = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress-bar');
  const timeDisplay = document.getElementById('time-display');

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function updateProgress() {
    if (!video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    progressBar.style.width = pct + '%';
    timeDisplay.textContent = formatTime(video.currentTime) + ' / ' + formatTime(video.duration);
  }

  function updatePlayPauseLabel() {
    playPauseBtn.textContent = video.paused ? '▶ 再生' : '⏸ 一時停止';
  }

  playPauseBtn.addEventListener('click', function () {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  });

  rewindBtn.addEventListener('click', function () {
    video.currentTime = Math.max(0, video.currentTime - 10);
  });

  forwardBtn.addEventListener('click', function () {
    video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
  });

  function seekByClientX(clientX) {
    const rect = progressContainer.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    video.currentTime = ratio * (video.duration || 0);
  }

  progressContainer.addEventListener('click', function (e) {
    seekByClientX(e.clientX);
  });

  let isSeeking = false;

  progressContainer.addEventListener('pointerdown', function (e) {
    isSeeking = true;
    seekByClientX(e.clientX);
    progressContainer.setPointerCapture(e.pointerId);
  });

  progressContainer.addEventListener('pointermove', function (e) {
    if (!isSeeking) return;
    seekByClientX(e.clientX);
  });

  progressContainer.addEventListener('pointerup', function () {
    isSeeking = false;
  });

  progressContainer.addEventListener('pointercancel', function () {
    isSeeking = false;
  });

  progressContainer.addEventListener('lostpointercapture', function () {
    isSeeking = false;
  });

  progressContainer.addEventListener(
    'touchstart',
    function (e) {
      if (!e.touches[0]) return;
      seekByClientX(e.touches[0].clientX);
    },
    { passive: true }
  );

  progressContainer.addEventListener(
    'touchmove',
    function (e) {
      if (!e.touches[0]) return;
      seekByClientX(e.touches[0].clientX);
    },
    { passive: true }
  );

  video.addEventListener('timeupdate', updateProgress);
  video.addEventListener('play', updatePlayPauseLabel);
  video.addEventListener('pause', updatePlayPauseLabel);
  video.addEventListener('loadedmetadata', function () {
    timeDisplay.textContent = '00:00 / ' + formatTime(video.duration);
  });
})();

// ---- Comment Form ----
(function () {
  const form = document.getElementById('comment-form');
  if (!form) return;

  const statusEl = document.getElementById('comment-status');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('comment-name').value.trim();
    const body = document.getElementById('comment-body').value.trim();
    if (!name || !body) return;

    const comments = JSON.parse(localStorage.getItem('video_comments') || '[]');
    comments.push({
      name: name,
      body: body,
      date: new Date().toLocaleString('ja-JP'),
    });
    localStorage.setItem('video_comments', JSON.stringify(comments));

    form.reset();
    statusEl.textContent = '感想を送信しました。ありがとうございます！';
    setTimeout(function () {
      statusEl.textContent = '';
    }, 4000);
  });
})();

// ---- Admin Login & Comments ----
(function () {
  const loginSection = document.getElementById('admin-login');
  const commentsSection = document.getElementById('admin-comments');
  if (!loginSection) return;

  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const commentsList = document.getElementById('comments-list');
  const logoutBtn = document.getElementById('btn-logout');

  function showComments() {
    loginSection.style.display = 'none';
    commentsSection.style.display = 'block';
    renderComments();
  }

  function renderComments() {
    const comments = JSON.parse(localStorage.getItem('video_comments') || '[]');
    if (comments.length === 0) {
      commentsList.innerHTML = '<p class="no-comments">まだ感想はありません。</p>';
      return;
    }
    commentsList.innerHTML = comments
      .slice()
      .reverse()
      .map(function (c) {
        return (
          '<div class="comment-card">' +
          '<div class="comment-name">' + escapeHtml(c.name) + '</div>' +
          '<div class="comment-date">' + escapeHtml(c.date) + '</div>' +
          '<div class="comment-body">' + escapeHtml(c.body) + '</div>' +
          '</div>'
        );
      })
      .join('');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const pw = document.getElementById('admin-password').value;
    if (pw === ADMIN_PASSWORD) {
      loginError.textContent = '';
      showComments();
    } else {
      loginError.textContent = 'パスワードが違います。';
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      commentsSection.style.display = 'none';
      loginSection.style.display = 'block';
      document.getElementById('admin-password').value = '';
    });
  }
})();
