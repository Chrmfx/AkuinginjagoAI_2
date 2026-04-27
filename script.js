const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const restartBtn = document.getElementById("restartBtn");
const startMicBtn = document.getElementById("startMicBtn");

// ===== RESPONSIVE =====
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = 300;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ===== GAME STATE =====
let player, gaps, speed, score, gameOver;

function initGame() {
  player = {
    x: 100,
    y: 200,
    vy: 0,
    gravity: 0.6,
    jumpPower: -12,
    grounded: true
  };

  gaps = [
    { x: 400, width: 80 },
    { x: 700, width: 100 }
  ];

  speed = 3;
  score = 0;
  gameOver = false;
}
initGame();

// ===== DRAW =====
function drawPlayer() {
  ctx.beginPath();
  ctx.arc(player.x, player.y - 15, 5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(player.x, player.y - 10);
  ctx.lineTo(player.x, player.y + 10);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x - 5, player.y + 10);
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + 5, player.y + 10);
  ctx.stroke();
}

function drawGround() {
  ctx.fillStyle = "black";
  let prevX = 0;

  gaps.forEach(gap => {
    ctx.fillRect(prevX, 220, gap.x - prevX, 80);
    prevX = gap.x + gap.width;
  });

  ctx.fillRect(prevX, 220, canvas.width - prevX, 80);
}

function drawScore() {
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(200,0,0,0.4)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "red";
  ctx.font = "40px Arial";
  ctx.fillText("YOU ARE DEAD", canvas.width / 2 - 120, 150);
}

// ===== GAME LOOP =====
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameOver) {
    score++;

    gaps.forEach(gap => gap.x -= speed);

    if (gaps[0].x + gaps[0].width < 0) {
      gaps.shift();
      gaps.push({
        x: canvas.width + Math.random() * 200,
        width: 60 + Math.random() * 60
      });
    }

    player.vy += player.gravity;
    player.y += player.vy;

    let overGap = false;
    gaps.forEach(gap => {
      if (player.x > gap.x && player.x < gap.x + gap.width) {
        overGap = true;
      }
    });

    if (!overGap && player.y >= 200) {
      player.y = 200;
      player.vy = 0;
      player.grounded = true;
    } else {
      player.grounded = false;
    }

    if (overGap && player.y > 230) {
      gameOver = true;
    }
  }

  drawGround();
  drawPlayer();
  drawScore();

  if (gameOver) drawGameOver();

  requestAnimationFrame(update);
}

// ===== CONTROL (TAP fallback) =====
function jump() {
  if (player.grounded && !gameOver) {
    player.vy = player.jumpPower;
    player.grounded = false;
  }
}

canvas.addEventListener("touchstart", jump);
canvas.addEventListener("mousedown", jump);

// ===== VOICE (HP OPTIMIZED) =====
let audioContext, analyser, dataArray;
let micActive = false;
let lastJumpTime = 0;

async function startMic() {
  if (micActive) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();

    analyser.fftSize = 512;
    dataArray = new Uint8Array(analyser.fftSize);

    source.connect(analyser);

    micActive = true;
    startMicBtn.innerText = "MIC ON";

    detectSound();

  } catch (err) {
    alert("Mic gagal diaktifkan");
    console.error(err);
  }
}

// 🔥 RMS detection (lebih stabil untuk HP)
function getVolume() {
  analyser.getByteTimeDomainData(dataArray);

  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    let val = (dataArray[i] - 128) / 128;
    sum += val * val;
  }
  return Math.sqrt(sum / dataArray.length);
}

function detectSound() {
  if (!micActive || gameOver) return;

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  let volume = getVolume();

  // 🔥 threshold HP (adjustable)
  let threshold = 0.08;

  // 🔥 cooldown biar ga spam
  let now = Date.now();

  if (volume > threshold && now - lastJumpTime > 300) {
    jump();
    lastJumpTime = now;
  }

  requestAnimationFrame(detectSound);
}

// BUTTON
startMicBtn.addEventListener("click", startMic);
restartBtn.addEventListener("click", initGame);

// START LOOP
update();
