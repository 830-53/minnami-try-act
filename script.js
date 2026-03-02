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
