const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const restartBtn = document.getElementById("restartBtn");

// RESPONSIVE CANVAS
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = 300;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

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

  restartBtn.style.display = "none";
}

initGame();

// DRAW PLAYER
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

// DRAW GROUND
function drawGround() {
  ctx.fillStyle = "black";
  let prevX = 0;

  gaps.forEach(gap => {
    ctx.fillRect(prevX, 220, gap.x - prevX, 80);
    prevX = gap.x + gap.width;
  });

  ctx.fillRect(prevX, 220, canvas.width - prevX, 80);
}

// DRAW SCORE
function drawScore() {
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
}

// GAME OVER
function drawGameOver() {
  ctx.fillStyle = "rgba(200,0,0,0.4)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "red";
  ctx.font = "40px Arial";
  ctx.fillText("YOU ARE DEAD", canvas.width / 2 - 120, 150);

  restartBtn.style.display = "block";
}

// GAME LOOP
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

    if (overGap && player.y > 220) {
      gameOver = true;
    }
  }

  drawGround();
  drawPlayer();
  drawScore();

  if (gameOver) drawGameOver();

  requestAnimationFrame(update);
}

// RESTART BUTTON
restartBtn.addEventListener("click", () => {
  initGame();
});

// TAP / CLICK (HP + PC)
function jump() {
  if (player.grounded && !gameOver) {
    player.vy = player.jumpPower;
    player.grounded = false;
  }
}

canvas.addEventListener("touchstart", jump);
canvas.addEventListener("mousedown", jump);

// VOICE CONTROL (OPTIONAL)
let audioContext;
let analyser;
let dataArray;
let micStarted = false;

async function startMic() {
  if (micStarted) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // 🔥 penting untuk HP
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();

    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    source.connect(analyser);

    micStarted = true;

    detectSound();

  } catch (err) {
    alert("Mic tidak bisa digunakan di HP ini / belum diizinkan");
    console.error(err);
  }
}

function detectSound() {
  if (!micStarted || gameOver) return;

  // 🔥 fix tambahan untuk HP (resume loop)
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  analyser.getByteFrequencyData(dataArray);

  let volume = dataArray.reduce((a, b) => a + b) / dataArray.length;

  // DEBUG (aktifkan kalau mau cek)
  // console.log(volume);

  // 🔥 threshold lebih rendah untuk HP
  if (volume > 45) {
    jump();
  }

  requestAnimationFrame(detectSound);
}

// 🔥 WAJIB: trigger dari user interaction
canvas.addEventListener("touchstart", startMic, { passive: true });
canvas.addEventListener("click", startMic);

update();
