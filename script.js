// Difficulty settings
const difficultySelect = document.getElementById('difficulty-select');
let difficulty = 'normal';
let winGoal = 70; // percent needed to win
let spawnRate = 1200; // ms between contaminants
let timerSeconds = 30;

// Update difficulty when selected
// Update difficulty when selected
if (difficultySelect) {
  difficultySelect.addEventListener('change', () => {
    difficulty = difficultySelect.value;
    if (difficulty === 'easy') {
      winGoal = 60;
      spawnRate = 1600;
      timerSeconds = 20; // Easy: 20 seconds
    } else if (difficulty === 'normal') {
      winGoal = 70;
      spawnRate = 1200;
      timerSeconds = 30; // Normal: 30 seconds
    } else if (difficulty === 'hard') {
      winGoal = 80;
      spawnRate = 900;
      timerSeconds = 60; // Hard: 60 seconds
    }
  });
}
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
const contamStatus = document.getElementById('contam-status');
const gameContainer = document.getElementById('game-container');
const reticle = document.getElementById('reticle');
// Hide reticle on start screen
reticle.style.display = 'none';
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const timerDisplay = document.getElementById('timer');
const gameOverScreen = document.getElementById('game-over');
const finalScore = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const zapSound = document.getElementById('zap-sound');
const hitSound = document.getElementById('hit-sound');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const hud = document.getElementById('hud'); // Add this for HUD
const contaminationFill = document.getElementById('contamination-fill');
const contaminationMeter = document.getElementById('contamination-meter');

let reticleX = window.innerWidth / 2;
let reticleY = window.innerHeight / 2;
let contamination = 0;
let score = 0;
// Get high score from localStorage, or default to 0
let highScore = localStorage.getItem('jerryCanHighScore') ? parseInt(localStorage.getItem('jerryCanHighScore')) : 0;
highScoreDisplay.textContent = `High Score: ${highScore}`;
let timeLeft = 30; // Set timer to 30 seconds
let gameInterval, spawnInterval, timerInterval;
let gameActive = false;
let contaminationLevel = 0; // 0 (safe) to 100 (toxic)
let contaminationPercent = 100; // 100% safe

// Move reticle with arrow keys and fire laser with spacebar (only once per press)
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

  // Only fire once per spacebar press
  if (e.code === 'Space' && !e.repeat) {
    fireLaser();
  }
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
        // Update high score if needed
        if (score > highScore) {
          highScore = score;
          highScoreDisplay.textContent = `High Score: ${highScore}`;
          localStorage.setItem('jerryCanHighScore', highScore);
        }
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

// The horizon line Y position (pixels from top of game container)
// Adjust this value to visually match the straight base of the mountains in your SVG background (now in img folder)
const HORIZON_Y = 220; // Raised to visually match the straight base of the mountains in the SVG background

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
  // Spawn at the horizon line
  contaminant.style.top = `${HORIZON_Y}px`;

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
          // Update high score if needed
          if (score > highScore) {
            highScore = score;
            highScoreDisplay.textContent = `High Score: ${highScore}`;
            localStorage.setItem('jerryCanHighScore', highScore);
          }
          // Drop contamination percent
          if (contaminant.classList.contains('split')) {
            contaminationPercent -= 3;
          } else {
            contaminationPercent -= 5;
          }
          contaminationPercent = Math.max(0, contaminationPercent);
          // Change color and text based on contaminationPercent
          if (contaminationPercent >= 80) {
            contamStatus.textContent = `Water Purity Level: ${contaminationPercent}% Safe`;
            contamStatus.style.color = '#2ecc40'; // green
          } else if (contaminationPercent >= 70 && contaminationPercent < 80) {
            contamStatus.textContent = `Water Purity Level: ${contaminationPercent}% Danger`;
            contamStatus.style.color = '#ffe066'; // yellow
          } else {
            contamStatus.textContent = `Water Purity Level: ${contaminationPercent}% Toxic`;
            contamStatus.style.color = '#ff4136'; // red
          }
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
          // Update high score if needed
          if (score > highScore) {
            highScore = score;
            highScoreDisplay.textContent = `High Score: ${highScore}`;
            localStorage.setItem('jerryCanHighScore', highScore);
          }
          // Drop contamination percent for split piece
          contaminationPercent -= 3;
          contaminationPercent = Math.max(0, contaminationPercent);
          if (contaminationPercent >= 80) {
            contamStatus.textContent = `Water Purity Level: ${contaminationPercent}% Safe`;
            contamStatus.style.color = '#2ecc40';
          } else if (contaminationPercent >= 70 && contaminationPercent < 80) {
            contamStatus.textContent = `Water Purity Level: ${contaminationPercent}% Danger`;
            contamStatus.style.color = '#ffe066';
          } else {
            contamStatus.textContent = `Water Purity Level: ${contaminationPercent}% Toxic`;
            contamStatus.style.color = '#ff4136';
          }

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

// Array of milestone messages for beginners
const milestoneMessages = [
  { time: 15, message: "Halfway there! 15 seconds left!" }
];

// Function to show milestone message
function showMilestoneMessage(msg) {
  // Create a simple message box at the top center
  const milestoneBox = document.createElement('div');
  milestoneBox.textContent = msg;
  milestoneBox.style.position = 'absolute';
  milestoneBox.style.top = '60px';
  milestoneBox.style.left = '50%';
  milestoneBox.style.transform = 'translateX(-50%)';
  milestoneBox.style.background = '#ffe066';
  milestoneBox.style.color = '#543804';
  milestoneBox.style.fontSize = '1.3rem';
  milestoneBox.style.fontWeight = 'bold';
  milestoneBox.style.padding = '12px 32px';
  milestoneBox.style.borderRadius = '16px';
  milestoneBox.style.boxShadow = '0 2px 12px #54380433';
  milestoneBox.style.zIndex = '999';
  milestoneBox.style.textAlign = 'center';
  document.body.appendChild(milestoneBox);

  // Remove the message after 2 seconds
  setTimeout(() => {
    milestoneBox.remove();
  }, 2000);
}

// Timer for 30 seconds (no red bar)
function startTimer() {
  timerDisplay.textContent = `Time: ${timeLeft}`;
  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `Time: ${timeLeft}`;

    // Check for milestone messages
    milestoneMessages.forEach(milestone => {
      if (timeLeft === milestone.time) {
        showMilestoneMessage(milestone.message);
      }
    });

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

// Call this function whenever a Jerry Can is hit
function updateContamination(amount) {
  contaminationLevel += amount;
  contaminationLevel = Math.max(0, Math.min(100, contaminationLevel));
  contaminationFill.style.width = `${contaminationLevel}%`;
}

// Show game elements when game starts
startBtn.addEventListener('click', () => {
  // Set difficulty values
  if (difficultySelect) {
    difficulty = difficultySelect.value;
    if (difficulty === 'easy') {
      winGoal = 60;
      spawnRate = 1600;
      timerSeconds = 20; // Easy: 20 seconds
    } else if (difficulty === 'normal') {
      winGoal = 70;
      spawnRate = 1200;
      timerSeconds = 30; // Normal: 30 seconds
    } else if (difficulty === 'hard') {
      winGoal = 80;
      spawnRate = 900;
      timerSeconds = 60; // Hard: 60 seconds
    }
  }
  // Reset contamination percent
  contaminationPercent = 100;
  contamStatus.textContent = `Water Purity Level: 100% Safe`;
  contamStatus.style.color = '#2ecc40'; // green
  // Hide start screen
  startScreen.style.display = 'none';
  // Show HUD, pause button, reticle, and contamination meter
  hud.style.display = 'flex';
  pauseBtn.style.display = 'inline-block';
  reticle.style.display = 'block';
  contaminationMeter.style.display = 'flex'; // Show contamination bar
  // Start game logic
  gameActive = true;
  score = 0;
  scoreDisplay.textContent = `Score: ${score}`;
  // Show current high score
  highScoreDisplay.textContent = `High Score: ${highScore}`;
  timeLeft = timerSeconds;
  timerDisplay.textContent = `Time: ${timeLeft}`;
  gameOverScreen.style.display = 'none';
  spawnInterval = setInterval(spawnContaminant, spawnRate);
  startTimer();
});

// Hide HUD, pause button, reticle, and contamination meter on game over
function endGame() {
  gameActive = false;
  hud.style.display = 'none';
  pauseBtn.style.display = 'none';
  reticle.style.display = 'none';
  contaminationMeter.style.display = 'none';
  gameOverScreen.style.display = 'block';
  finalScore.textContent = `Final Score: ${score}`;

  // Show final Water Purity Level on Game Over screen
  let purityMsg = `Water Purity Level: ${contaminationPercent}%`;
  // Create or update the purity level element
  let purityElem = document.getElementById('final-purity');
  if (!purityElem) {
    purityElem = document.createElement('p');
    purityElem.id = 'final-purity';
    purityElem.style.fontSize = '1.3rem';
    purityElem.style.fontWeight = 'bold';
    purityElem.style.marginTop = '12px';
    purityElem.style.marginBottom = '8px';
    gameOverScreen.insertBefore(purityElem, finalScore.nextSibling);
  }
  purityElem.textContent = purityMsg;

  // Helper function for random animation
  function randomAnimation() {
    // Make the emoji animations last longer and repeat
    const animations = [
      'pop 5.5s ease-in-out infinite',
      'spin 5s linear infinite',
      'bounce 5.2s ease-in-out infinite',
      'wiggle 5.8s ease-in-out infinite'
    ];
    return animations[Math.floor(Math.random() * animations.length)];
  }

  // Add keyframes for emoji animations if not present
  if (!document.getElementById('emoji-anim-style')) {
    const style = document.createElement('style');
    style.id = 'emoji-anim-style';
    style.textContent = `
      @keyframes pop { 0% { transform: scale(0.5); opacity: 0.5; } 60% { transform: scale(1.3); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-24px); } }
      @keyframes wiggle { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } }
    `;
    document.head.appendChild(style);
  }

  // Difficulty win condition
  if (contaminationPercent >= winGoal) {
    if (contamStatus.textContent.includes('Safe')) {
      gameOverScreen.querySelector('h1').textContent = 'You Win! The Water Is Safe To Drink!';
    } else {
      gameOverScreen.querySelector('h1').textContent = 'You Win! The Water Is Drinkable, But Be Careful!';
    }
    // Confetti and happy faces
    let confettiContainer = document.getElementById('confetti-icons');
    if (!confettiContainer) {
      confettiContainer = document.createElement('div');
      confettiContainer.id = 'confetti-icons';
      confettiContainer.style.position = 'fixed';
      confettiContainer.style.top = '0';
      confettiContainer.style.left = '0';
      confettiContainer.style.width = '100vw';
      confettiContainer.style.height = '100vh';
      confettiContainer.style.pointerEvents = 'none';
      confettiContainer.style.zIndex = '1001';
      document.body.appendChild(confettiContainer);
    } else {
      confettiContainer.innerHTML = '';
    }
    for (let i = 0; i < 40; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'absolute';
      confetti.style.width = '28px';
      confetti.style.height = '28px';
      confetti.style.borderRadius = '50%';
      confetti.style.left = Math.random() * (window.innerWidth - 28) + 'px';
      confetti.style.top = Math.random() * (window.innerHeight - 28) + 'px';
      confetti.style.pointerEvents = 'none';
      const colors = ['#ffe066', '#2ecc40', '#00bfff', '#ff4136', '#ff69b4', '#ffd700'];
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.boxShadow = '0 0 12px 2px ' + confetti.style.background;
      confetti.style.animation = randomAnimation();
      confettiContainer.appendChild(confetti);
    }
    // Add happy face emojis (reduced amount)
    const happyEmojis = ['😄', '😊', '🥳', '😅', '💧', '💦', '😁', '😃'];
    for (let i = 0; i < 22; i++) {
      const happy = document.createElement('div');
      happy.innerHTML = happyEmojis[Math.floor(Math.random() * happyEmojis.length)];
      happy.style.position = 'absolute';
      happy.style.fontSize = '5rem';
      happy.style.left = Math.random() * (window.innerWidth - 60) + 'px';
      happy.style.top = Math.random() * (window.innerHeight - 120) + 'px';
      happy.style.pointerEvents = 'none';
      happy.style.color = '#ffe066';
      happy.style.animation = randomAnimation();
      confettiContainer.appendChild(happy);
    }
    // Animated water splashes for Safe
    if (contamStatus.textContent.includes('Safe')) {
      let splashContainer = document.getElementById('splash-icons');
      if (!splashContainer) {
        splashContainer = document.createElement('div');
        splashContainer.id = 'splash-icons';
        splashContainer.style.position = 'fixed';
        splashContainer.style.top = '0';
        splashContainer.style.left = '0';
        splashContainer.style.width = '100vw';
        splashContainer.style.height = '100vh';
        splashContainer.style.pointerEvents = 'none';
        splashContainer.style.zIndex = '1002';
        document.body.appendChild(splashContainer);
      } else {
        splashContainer.innerHTML = '';
      }
      for (let i = 0; i < 14; i++) {
        const splash = document.createElement('div');
        splash.style.position = 'absolute';
        splash.style.width = '44px';
        splash.style.height = '44px';
        splash.style.background = 'rgba(0,180,255,0.7)';
        splash.style.borderRadius = '50%';
        splash.style.left = Math.random() * (window.innerWidth - 44) + 'px';
        splash.style.top = Math.random() * (window.innerHeight - 120) + 'px';
        splash.style.pointerEvents = 'none';
        splash.style.boxShadow = '0 0 24px 8px #00bfff88';
        splash.style.animation = 'splash-pop 3.2s ease-out, bounce 3.1s ease';
        splashContainer.appendChild(splash);
      }
      if (!document.getElementById('splash-pop-style')) {
        const style = document.createElement('style');
        style.id = 'splash-pop-style';
        style.textContent = `@keyframes splash-pop { 0% { transform: scale(0.5); opacity: 0.7; } 60% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 0; } }`;
        document.head.appendChild(style);
      }
    }
  } else {
    gameOverScreen.querySelector('h1').textContent = 'You Lose! The Water Is Undrinkable!';
    const toxicEmojis = ['&#9760;', '🤮', '🪦', '😷', '☠️', '🤢', '🥴', '🤧', '😵'];
    let toxicContainer = document.getElementById('toxic-icons');
    if (!toxicContainer) {
      toxicContainer = document.createElement('div');
      toxicContainer.id = 'toxic-icons';
      toxicContainer.style.position = 'fixed';
      toxicContainer.style.top = '0';
      toxicContainer.style.left = '0';
      toxicContainer.style.width = '100vw';
      toxicContainer.style.height = '100vh';
      toxicContainer.style.pointerEvents = 'none';
      toxicContainer.style.zIndex = '1001';
      document.body.appendChild(toxicContainer);
    } else {
      toxicContainer.innerHTML = '';
    }
    for (let i = 0; i < 35; i++) {
      const toxic = document.createElement('div');
      toxic.innerHTML = toxicEmojis[Math.floor(Math.random() * toxicEmojis.length)];
      toxic.style.position = 'absolute';
      toxic.style.fontSize = '5rem';
      toxic.style.color = '#ff4136';
      toxic.style.left = Math.random() * (window.innerWidth - 60) + 'px';
      toxic.style.top = Math.random() * (window.innerHeight - 120) + 'px';
      toxic.style.pointerEvents = 'none';
      toxic.style.animation = randomAnimation();
      toxicContainer.appendChild(toxic);
    }
  }
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
}

// Hide HUD, pause button, reticle, and contamination meter on restart
restartBtn.addEventListener('click', () => {
  location.reload();
});
