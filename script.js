// Log a message to the console to ensure the script is linked correctly
console.log('JavaScript file is linked correctly.');

// Get DOM elements
const gameContainer = document.getElementById('game-container');
const reticle = document.getElementById('reticle');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const gameOverScreen = document.getElementById('game-over');
const finalScore = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const zapSound = document.getElementById('zap-sound');
const hitSound = document.getElementById('hit-sound');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');

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

      score += parseInt(cont.dataset.points);
      scoreDisplay.textContent = `Score: ${score}`;
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

  const contaminant = document.createElement('div');
  contaminant.classList.add('contaminant');
  contaminant.dataset.points = 50; // <-- Add this line

  // Set a random horizontal position
  const leftPosition = Math.random() * (gameContainer.offsetWidth - 40);
  contaminant.style.left = `${leftPosition}px`;

  // Start at the very top of the game area
  contaminant.style.top = `0px`;

  // Add contaminant to the game container
  gameContainer.appendChild(contaminant);

  // Add to our contaminants array
  contaminants.push(contaminant);

  // Move the contaminant down the screen
  let contaminantInterval = setInterval(() => {
    // Get current top position
    let currentTop = parseInt(contaminant.style.top);

    // Move down by 3 pixels each frame
    contaminant.style.top = `${currentTop + 3}px`;

    // If contaminant reaches the bottom, remove it
    if (currentTop + 40 >= gameContainer.offsetHeight) {
      contaminant.remove();
      clearInterval(contaminantInterval);
    }
  }, 20);
}

// Function to split a contaminant into two pieces after being hit
function splitContaminant(original) {
  // Only split if it's not already a split piece
  if (original.classList.contains('split')) return;

  // Loop to create two split pieces
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
      if (top > window.innerHeight - 60) {
        clearInterval(fall);
        mini.remove();
        contamination += 10;
        // if (contamination >= 100) endGame(); // <-- Remove or comment out this line
      } else {
        mini.style.top = top + speed + 'px';
      }
    }, 30);
  }
}

// Timer for 30 seconds (no red bar)
function startTimer() {
  let timeLeft = 30; // Start at 30 seconds

  // Show the initial time
  timerDisplay.textContent = `Time: ${timeLeft}`;

  timerInterval = setInterval(() => {
    // Update the timer display
    timerDisplay.textContent = `Time: ${timeLeft}`;

    // If timeLeft is 0, stop the timer and end the game
    if (timeLeft === 0) {
      clearInterval(timerInterval);
      endGame();
    }

    timeLeft--; // Subtract after displaying and checking
  }, 1000);
}

// End game
function endGame() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  gameOverScreen.style.display = 'block';
  finalScore.textContent = `Final Score: ${score}`;
}

restartBtn.addEventListener('click', () => {
  location.reload();
});

// Hide game elements at the beginning
gameContainer.querySelector('#hud').style.display = 'none';
reticle.style.display = 'none'; // Jerry cans stay visible

// Function to start the game
function startGame() {
  // Show HUD and reticle
  gameContainer.querySelector('#hud').style.display = '';
  reticle.style.display = '';
  // Hide start screen
  startScreen.style.display = 'none';
  // Set game as active
  gameActive = true;
  // Start spawning contaminants
  spawnInterval = setInterval(spawnContaminant, 1200);
  startTimer();
}

// Listen for start button click
startBtn.addEventListener('click', startGame);

// Mouse movement for reticle
gameContainer.addEventListener('mousemove', (e) => {
  if (!gameActive) return; // Only move reticle when game is active

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
