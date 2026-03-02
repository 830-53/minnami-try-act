const ADMIN_PASSWORD = 'minami-try&act';
const FALLBACK_STORAGE_KEY = 'video_comments_fallback';

function getApiBase() {
  if (window.COMMENTS_API_BASE) {
    return String(window.COMMENTS_API_BASE).replace(/\/$/, '');
  }
  const meta = document.querySelector('meta[name="comments-api-base"]');
  if (!meta || !meta.content) return '';
  return String(meta.content).trim().replace(/\/$/, '');
}

function buildApiUrl(path) {
  const base = getApiBase();
  return base ? base + path : path;
}

function getFallbackComments() {
  try {
    const comments = JSON.parse(localStorage.getItem(FALLBACK_STORAGE_KEY) || '[]');
    return Array.isArray(comments) ? comments : [];
  } catch (error) {
    return [];
  }
}

function saveFallbackComment(name, body) {
  const comments = getFallbackComments();
  comments.push({
    name: name,
    body: body,
    createdAt: new Date().toISOString(),
    date: new Date().toLocaleString('ja-JP'),
  });
  localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(comments));
}

async function fetchComments() {
  const response = await fetch(buildApiUrl('/api/comments'), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('コメント取得エラー');
  }
  return response.json();
}

async function postComment(payload) {
  const response = await fetch(buildApiUrl('/api/comments'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('コメント送信エラー');
  }
  return response.json();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCommentDate(comment) {
  if (comment.date) return comment.date;
  if (!comment.createdAt) return '';
  return new Date(comment.createdAt).toLocaleString('ja-JP');
}

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

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const name = document.getElementById('comment-name').value.trim();
    const body = document.getElementById('comment-body').value.trim();
    if (!name || !body) return;

    const submitButton = form.querySelector('button[type="submit"]');
    try {
      if (submitButton) submitButton.disabled = true;
      await postComment({ name: name, body: body });
      form.reset();
      statusEl.textContent = '感想を送信しました。ありがとうございます！';
      setTimeout(function () {
        statusEl.textContent = '';
      }, 4000);
    } catch (error) {
      saveFallbackComment(name, body);
      form.reset();
      statusEl.textContent = '共有サーバーに接続できなかったため、この端末内に保存しました。';
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
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
  let refreshIntervalId = null;

  function showComments() {
    loginSection.style.display = 'none';
    commentsSection.style.display = 'block';
    renderComments();
    if (refreshIntervalId) {
      clearInterval(refreshIntervalId);
    }
    refreshIntervalId = window.setInterval(renderComments, 5000);
  }

  async function renderComments() {
    try {
      const comments = await fetchComments();
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
            '<div class="comment-date">' + escapeHtml(formatCommentDate(c)) + '</div>' +
            '<div class="comment-body">' + escapeHtml(c.body) + '</div>' +
            '</div>'
          );
        })
        .join('');
    } catch (error) {
      const localComments = getFallbackComments();
      if (localComments.length === 0) {
        commentsList.innerHTML = '<p class="no-comments">感想の取得に失敗しました。</p>';
        return;
      }
      commentsList.innerHTML =
        '<p class="no-comments">共有サーバーに接続できないため、この端末内の感想のみ表示しています。</p>' +
        localComments
          .slice()
          .reverse()
          .map(function (c) {
            return (
              '<div class="comment-card">' +
              '<div class="comment-name">' + escapeHtml(c.name) + '</div>' +
              '<div class="comment-date">' + escapeHtml(formatCommentDate(c)) + '</div>' +
              '<div class="comment-body">' + escapeHtml(c.body) + '</div>' +
              '</div>'
            );
          })
          .join('');
    }
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
      if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;
      }
    });
  }
})();
