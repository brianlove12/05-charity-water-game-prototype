// Log a message to the console to ensure the script is linked correctly
console.log('JavaScript file is linked correctly.');

// Pause menu logic
const pauseMenu = document.getElementById('pause-menu');
const pauseBtn = document.getElementById('pause-btn');
const continueBtn = document.getElementById('continue-btn');
const restartBtnPause = document.getElementById('restart-btn-pause');
let paused = false;
// Hide pause button on start screen
pauseBtn.style.display = 'none';

// Function to pause the game
function pauseGame() {
  // Only pause if not already paused
  if (paused) return;
  paused = true;
  pauseMenu.style.display = 'flex';
  // Stop intervals if they exist
  if (spawnInterval) clearInterval(spawnInterval);
  if (timerInterval) clearInterval(timerInterval);
}

// Function to continue the game
function continueGame() {
  if (!paused) return;
  paused = false;
  pauseMenu.style.display = 'none';
  // Resume intervals
  spawnInterval = setInterval(spawnContaminant, 1200);
  timerInterval = setInterval(() => {
    timerDisplay.textContent = `Time: ${timeLeft}`;
    if (timeLeft === 0) {
      clearInterval(timerInterval);
      endGame();
    }
    timeLeft--;
  }, 1000);
}

// Function to restart the game from pause menu
function restartGamePause() {
  location.reload();
}

// Pause button event
pauseBtn.addEventListener('click', pauseGame);
continueBtn.addEventListener('click', continueGame);
restartBtnPause.addEventListener('click', restartGamePause);

// Also allow pressing Escape to pause/continue
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!paused) {
      pauseGame();
    } else {
      continueGame();
    }
  }
});

// Get DOM elements
const gameContainer = document.getElementById('game-container');
const reticle = document.getElementById('reticle');
// Hide reticle on start screen
reticle.style.display = 'none';
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const gameOverScreen = document.getElementById('game-over');
const finalScore = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const zapSound = document.getElementById('zap-sound');
const hitSound = document.getElementById('hit-sound');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const hud = document.getElementById('hud'); // Add this for HUD

let reticleX = window.innerWidth / 2;
let reticleY = window.innerHeight / 2;
let contamination = 0;
let score = 0;
let timeLeft = 30; // Set timer to 30 seconds
let gameInterval, spawnInterval, timerInterval;
let gameActive = false;

// Move reticle with arrow keys
document.addEventListener('keydown', (e) => {
  if (!gameActive) return;
  const step = 20;
  if (e.key === 'ArrowUp') reticleY -= step;
  if (e.key === 'ArrowDown') reticleY += step;
  if (e.key === 'ArrowLeft') reticleX -= step;
  if (e.key === 'ArrowRight') reticleX += step;

  reticleX = Math.max(0, Math.min(window.innerWidth - 20, reticleX));
  reticleY = Math.max(50, Math.min(window.innerHeight - 50, reticleY));

  reticle.style.left = `${reticleX}px`;
  reticle.style.top = `${reticleY}px`;

  if (e.code === 'Space') fireLaser();
});

// Make reticle responsive to mouse/touchpad movement
gameContainer.addEventListener('mousemove', (e) => {
  if (!gameActive) return; // Only allow during gameplay
  // Get mouse position relative to game container
  const rect = gameContainer.getBoundingClientRect();
  reticleX = e.clientX - rect.left - reticle.offsetWidth / 2;
  reticleY = e.clientY - rect.top - reticle.offsetHeight / 2;

  // Keep reticle inside game area
  reticleX = Math.max(0, Math.min(gameContainer.offsetWidth - reticle.offsetWidth, reticleX));
  reticleY = Math.max(0, Math.min(gameContainer.offsetHeight - reticle.offsetHeight, reticleY));

  reticle.style.left = `${reticleX}px`;
  reticle.style.top = `${reticleY}px`;
});

// Fire laser
function fireLaser() {
  zapSound.currentTime = 0;
  zapSound.play();
  const laser = document.createElement('div');
  laser.classList.add('laser');
  laser.style.left = `${reticleX + 8}px`;
  laser.style.top = `${reticleY}px`;
  gameContainer.appendChild(laser);

  const move = setInterval(() => {
    const top = parseInt(laser.style.top);
    if (top < 0) {
      clearInterval(move);
      laser.remove();
    } else {
      laser.style.top = top - 10 + 'px';
      detectCollision(laser, move);
    }
  }, 20);
}

// Detect hit
function detectCollision(laser, move) {
  const contaminants = document.querySelectorAll('.contaminant');
  contaminants.forEach(cont => {
    const lRect = laser.getBoundingClientRect();
    const cRect = cont.getBoundingClientRect();

    if (
      lRect.left < cRect.right &&
      lRect.right > cRect.left &&
      lRect.top < cRect.bottom &&
      lRect.bottom > cRect.top
    ) {
      hitSound.currentTime = 0;
      hitSound.play();

      // Only update score if the game is active
      if (gameActive) {
        score += parseInt(cont.dataset.points);
        scoreDisplay.textContent = `Score: ${score}`;
      }
      laser.remove();
      cont.classList.add('hit');
      clearInterval(move);

      // Only split if not already split and not already hit
      if (!cont.classList.contains('split') && !cont.classList.contains('already-split')) {
        cont.classList.add('already-split'); // Mark as split
        splitContaminant(cont);
      }

      setTimeout(() => cont.remove(), 200);
    }
  });
}

// Contaminant logic
let contaminants = [];

// Function to spawn a contaminant (called during gameplay)
function spawnContaminant() {
  if (!gameActive) return;

  // Create a new contaminant
  const contaminant = document.createElement('div');
  contaminant.classList.add('contaminant');
  contaminant.dataset.points = 50;

  // Set a random horizontal position
  const leftPosition = Math.random() * (gameContainer.offsetWidth - 40);
  contaminant.style.left = `${leftPosition}px`;
  contaminant.style.top = `0px`;

  gameContainer.appendChild(contaminant);
  contaminants.push(contaminant);

  // Move the contaminant down the screen
  let contaminantInterval = setInterval(() => {
    let currentTop = parseInt(contaminant.style.top);
    contaminant.style.top = `${currentTop + 3}px`;

    // Check if contaminant touches a Jerry Can
    const jerryCans = document.querySelectorAll('.jerry');
    let touchedJerry = false;

    jerryCans.forEach(jerry => {
      const cRect = contaminant.getBoundingClientRect();
      const jRect = jerry.getBoundingClientRect();

      // Check for collision
      if (
        cRect.left < jRect.right &&
        cRect.right > jRect.left &&
        cRect.bottom > jRect.top
      ) {
        touchedJerry = true;

        // If it's a split piece, reduce score by 50, else by 100
        let penalty = contaminant.classList.contains('split') ? 50 : 100;
        // Only update score if the game is active
        if (gameActive) {
          score -= penalty;
          scoreDisplay.textContent = `Score: ${score}`;
        }

        // Show "-100" or "-50" above the Jerry Can
        const minus = document.createElement('div');
        minus.textContent = `-${penalty}`;
        minus.style.position = 'absolute';
        minus.style.left = `${jRect.left + jRect.width / 2 - 20}px`;
        minus.style.top = `${jRect.top - 30}px`;
        minus.style.color = 'red';
        minus.style.fontSize = '1.5rem';
        minus.style.fontWeight = 'bold';
        minus.style.pointerEvents = 'none';
        minus.style.zIndex = '200';
        minus.style.transition = 'opacity 0.7s, top 0.7s';
        document.body.appendChild(minus);

        // Animate and remove "-100" or "-50" after 0.7 seconds
        setTimeout(() => {
          minus.style.opacity = '0';
          minus.style.top = `${jRect.top - 60}px`;
        }, 100);

        setTimeout(() => {
          minus.remove();
        }, 700);

        // Remove contaminant immediately
        contaminant.remove();
        clearInterval(contaminantInterval);
      }
    });

    // If contaminant reaches the bottom and didn't touch a Jerry Can, just remove it
    if (!touchedJerry && currentTop + 40 >= gameContainer.offsetHeight) {
      contaminant.remove();
      clearInterval(contaminantInterval);
    }
  }, 20);
}

// Function to split a contaminant into two pieces after being hit
function splitContaminant(original) {
  // Only split if it's not already a split piece
  if (original.classList.contains('split')) return;

  // Create two split pieces
  for (let i = 0; i < 2; i++) {
    const mini = document.createElement('div');
    mini.classList.add('contaminant', 'split');
    mini.dataset.points = 25;

    // Position the split pieces next to the original
    mini.style.left = (parseInt(original.style.left) + (i * 15)) + 'px';
    mini.style.top = original.style.top;
    gameContainer.appendChild(mini);

    // Give each piece a random speed
    let speed = Math.random() * 4 + 3;
    const fall = setInterval(() => {
      if (!gameActive) clearInterval(fall);
      const top = parseInt(mini.style.top);
      mini.style.top = top + speed + 'px';

      // Check if split piece touches a Jerry Can
      const jerryCans = document.querySelectorAll('.jerry');
      let touchedJerry = false;

      jerryCans.forEach(jerry => {
        const mRect = mini.getBoundingClientRect();
        const jRect = jerry.getBoundingClientRect();

        if (
          mRect.left < jRect.right &&
          mRect.right > jRect.left &&
          mRect.bottom > jRect.top
        ) {
          touchedJerry = true;

          // Reduce score by 50 points for split pieces
          score -= 50;
          scoreDisplay.textContent = `Score: ${score}`;

          // Show "-50" above the Jerry Can
          const minus50 = document.createElement('div');
          minus50.textContent = '-50';
          minus50.style.position = 'absolute';
          minus50.style.left = `${jRect.left + jRect.width / 2 - 20}px`;
          minus50.style.top = `${jRect.top - 30}px`;
          minus50.style.color = 'red';
          minus50.style.fontSize = '1.5rem';
          minus50.style.fontWeight = 'bold';
          minus50.style.pointerEvents = 'none';
          minus50.style.zIndex = '200';
          minus50.style.transition = 'opacity 0.7s, top 0.7s';
          document.body.appendChild(minus50);

          setTimeout(() => {
            minus50.style.opacity = '0';
            minus50.style.top = `${jRect.top - 60}px`;
          }, 100);

          setTimeout(() => {
            minus50.remove();
          }, 700);

          // Remove split piece immediately
          mini.remove();
          clearInterval(fall);
        }
      });

      // If split piece reaches the bottom and didn't touch a Jerry Can, just remove it
      if (!touchedJerry && top + 15 >= gameContainer.offsetHeight) {
        mini.remove();
        clearInterval(fall);
      }
    }, 30);
  }
}

// Timer for 30 seconds (no red bar)
function startTimer() {
  timerDisplay.textContent = `Time: ${timeLeft}`;
  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `Time: ${timeLeft}`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

// Helper function to check if device is mobile
function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// On mobile, allow aiming and firing by tapping the screen
if (isMobile()) {
  gameContainer.addEventListener('touchstart', (e) => {
    if (!gameActive) return; // Only allow during gameplay

    // Get the first touch point
    const touch = e.touches[0];

    // Get tap position relative to game container
    const rect = gameContainer.getBoundingClientRect();
    reticleX = touch.clientX - rect.left - reticle.offsetWidth / 2;
    reticleY = touch.clientY - rect.top - reticle.offsetHeight / 2;

    // Keep reticle inside game area
    reticleX = Math.max(0, Math.min(gameContainer.offsetWidth - reticle.offsetWidth, reticleX));
    reticleY = Math.max(0, Math.min(gameContainer.offsetHeight - reticle.offsetHeight, reticleY));

    // Move reticle to tap position
    reticle.style.left = `${reticleX}px`;
    reticle.style.top = `${reticleY}px`;

    // Fire laser from tap position
    fireLaser();
  });
}

// Beginner-friendly: Show/hide How To Play box when button is pressed
const howToPlayBtn = document.getElementById('how-to-play-btn');
const howToPlayBox = document.getElementById('how-to-play');

// When the button is clicked, toggle the How To Play box
howToPlayBtn.addEventListener('click', () => {
  // If the box is hidden, show it. If shown, hide it.
  if (howToPlayBox.style.display === 'none') {
    howToPlayBox.style.display = 'block';
  } else {
    howToPlayBox.style.display = 'none';
  }
});

// Show game elements when game starts
startBtn.addEventListener('click', () => {
  // Hide start screen
  startScreen.style.display = 'none';
  // Show HUD, pause button, and reticle
  hud.style.display = 'flex';
  pauseBtn.style.display = 'inline-block'; // Show pause button when game starts
  reticle.style.display = 'block'; // Show reticle when game starts
  // Start game logic
  gameActive = true;
  score = 0;
  scoreDisplay.textContent = `Score: ${score}`;
  timeLeft = 30;
  timerDisplay.textContent = `Time: ${timeLeft}`;
  gameOverScreen.style.display = 'none';
  spawnInterval = setInterval(spawnContaminant, 1200);
  startTimer();
});

// Hide HUD, pause button, and reticle on game over
function endGame() {
  gameActive = false;
  hud.style.display = 'none';
  pauseBtn.style.display = 'none';
  reticle.style.display = 'none'; // Hide reticle on game over
  gameOverScreen.style.display = 'block';
  finalScore.textContent = `Final Score: ${score}`;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
}

// Hide HUD, pause button, and reticle on restart
restartBtn.addEventListener('click', () => {
  location.reload();
});
