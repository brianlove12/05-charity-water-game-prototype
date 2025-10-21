// Log a message to the console to ensure the script is linked correctly
console.log('JavaScript file is linked correctly.');

const gameContainer = document.getElementById('game-container');
const reticle = document.getElementById('reticle');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const contaminationFill = document.getElementById('contamination-fill');
const gameOverScreen = document.getElementById('game-over');
const finalScore = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const zapSound = document.getElementById('zap-sound');
const hitSound = document.getElementById('hit-sound');

let reticleX = window.innerWidth / 2;
let reticleY = window.innerHeight / 2;
let contamination = 0;
let score = 0;
let timeLeft = 60;
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
      setTimeout(() => cont.remove(), 200);

      if (!cont.classList.contains('split')) splitContaminant(cont);
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

function splitContaminant(original) {
  for (let i = 0; i < 2; i++) {
    const mini = document.createElement('div');
    mini.classList.add('contaminant', 'split');
    mini.dataset.points = 25;
    mini.style.left = (parseInt(original.style.left) + (i * 15)) + 'px';
    mini.style.top = original.style.top;
    gameContainer.appendChild(mini);

    let speed = Math.random() * 4 + 3;
    const fall = setInterval(() => {
      if (!gameActive) clearInterval(fall);
      const top = parseInt(mini.style.top);
      if (top > window.innerHeight - 60) {
        clearInterval(fall);
        mini.remove();
        contamination += 10;
        contaminationFill.style.width = contamination + '%';
        if (contamination >= 100) endGame();
      } else {
        mini.style.top = top + speed + 'px';
      }
    }, 30);
  }
}

// Timer
function startTimer() {
  timerInterval = setInterval(() => {
    if (!gameActive) return;
    timeLeft--;
    timerDisplay.textContent = `Time: ${timeLeft}`;
    if (timeLeft <= 0) endGame();
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

// Start game
spawnInterval = setInterval(spawnContaminant, 1200);
startTimer();

// Get elements for start screen
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');

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
