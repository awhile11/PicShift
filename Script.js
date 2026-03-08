// Game variables
let gridSize;
let imageURL;
let moves = 0;
let seconds = 0;
let timerInterval;
let draggedTile = null;
let gameStarted = false;
let currentPlayer = {
  name: 'User',
  id: null
};

// Timer functions
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  seconds = 0;
  document.getElementById("timer").innerText = seconds;
  
  timerInterval = setInterval(() => {
    seconds++;
    document.getElementById("timer").innerText = seconds;
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Name modal functions
function openNameModal() {
  document.getElementById('nameModal').style.display = 'flex';
  document.getElementById('playerName').value = currentPlayer.name === 'User' ? '' : currentPlayer.name;
  document.getElementById('playerName').focus();
}

function closeNameModal() {
  document.getElementById('nameModal').style.display = 'none';
}

function savePlayerName() {
  const name = document.getElementById('playerName').value.trim();
  if (name) {
    currentPlayer.name = name;
    document.getElementById('displayName').textContent = name;
    
    localStorage.setItem('pieShiftPlayer', JSON.stringify({
      name: name,
      id: currentPlayer.id || Date.now().toString()
    }));
  }
  closeNameModal();
}

function loadPlayer() {
  const saved = localStorage.getItem('pieShiftPlayer');
  if (saved) {
    try {
      const player = JSON.parse(saved);
      currentPlayer.name = player.name;
      currentPlayer.id = player.id;
      document.getElementById('displayName').textContent = player.name;
    } catch (e) {
      console.error('Error loading player:', e);
    }
  }
}

// Main game functions
function startGame() {
  const file = document.getElementById("upload").files[0];
  gridSize = parseInt(document.getElementById("difficulty").value);
  
  if (!file) {
    alert("Please choose an image first!");
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    imageURL = e.target.result;
    createPuzzle();
  };
  reader.readAsDataURL(file);
}

function finishGame() {
  // Clear the game state completely
  gameStarted = false;
  stopTimer();
  
  // Clear the puzzle grid
  document.getElementById('puzzle').innerHTML = '';
  
  // Reset stats
  moves = 0;
  seconds = 0;
  document.getElementById('moves').innerText = '0';
  document.getElementById('timer').innerText = '0';
  
  // Clear the image URL and file input
  imageURL = null;
  document.getElementById('upload').value = '';
  
  // Clear any share links
  document.getElementById('share').innerHTML = '';
  
  // Remove any background image styling
  const puzzle = document.getElementById('puzzle');
  puzzle.style.removeProperty('--bg-image');
  puzzle.classList.remove('has-correct-tiles', 'correct-progress-25', 'correct-progress-50', 'correct-progress-75', 'correct-progress-100');
  
  alert('Game finished! You can now choose a new image.');
}

function createPuzzle() {
  moves = 0;
  gameStarted = true;
  document.getElementById("moves").innerText = "0";
  document.getElementById("share").innerHTML = "";
  
  stopTimer();
  startTimer();
  
  const puzzle = document.getElementById("puzzle");
  puzzle.innerHTML = "";
  puzzle.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  
  // Set CSS variable for the background image
  puzzle.style.setProperty('--bg-image', `url(${imageURL})`);
  
  // Create array of piece indices
  let pieces = [];
  for (let i = 0; i < gridSize * gridSize; i++) {
    pieces.push(i);
  }
  
  shuffleArray(pieces);
  
  // Create tiles
  pieces.forEach((pieceIndex, positionIndex) => {
    createTileElement(pieceIndex, positionIndex);
  });
  
  // After all tiles are in the DOM, set their background based on current container size
  setTimeout(() => {
    updateAllTileBackgrounds();
    checkCorrectTiles();
  }, 100);
}

function createTileElement(pieceIndex, positionIndex) {
  const puzzle = document.getElementById("puzzle");
  const tile = document.createElement("div");
  tile.className = "tile";
  tile.dataset.pieceIndex = pieceIndex;
  tile.dataset.positionIndex = positionIndex;
  
  // Events
  tile.addEventListener("dragstart", dragStart);
  tile.addEventListener("dragend", dragEnd);
  tile.addEventListener("dragover", dragOver);
  tile.addEventListener("drop", dropTile);
  tile.addEventListener("touchstart", touchStart, { passive: false });
  tile.addEventListener("touchmove", touchMove, { passive: false });
  tile.addEventListener("touchend", touchEnd);
  
  tile.setAttribute('draggable', 'true');
  
  puzzle.appendChild(tile);
}

// Update all tiles' background positions and size based on current puzzle container width
function updateAllTileBackgrounds() {
  const puzzle = document.getElementById("puzzle");
  const containerWidth = puzzle.offsetWidth;
  if (containerWidth === 0) return;
  
  const tiles = document.querySelectorAll(".tile");
  tiles.forEach(tile => {
    const pieceIndex = parseInt(tile.dataset.pieceIndex);
    const tileSize = containerWidth / gridSize;
    const x = (pieceIndex % gridSize) * tileSize;
    const y = Math.floor(pieceIndex / gridSize) * tileSize;
    
    tile.style.backgroundImage = `url(${imageURL})`;
    tile.style.backgroundPosition = `-${x}px -${y}px`;
    tile.style.backgroundSize = `${containerWidth}px ${containerWidth}px`;
  });
}

// Check which tiles are in correct position and mark them
function checkCorrectTiles() {
  const tiles = document.querySelectorAll(".tile");
  let correctCount = 0;
  
  tiles.forEach((tile, index) => {
    const expectedPieceIndex = index;
    const actualPieceIndex = parseInt(tile.dataset.pieceIndex);
    
    if (actualPieceIndex === expectedPieceIndex) {
      tile.classList.add('correct');
      correctCount++;
    } else {
      tile.classList.remove('correct');
    }
  });
  
  // Update puzzle class to show background image progress
  const puzzle = document.getElementById("puzzle");
  const totalTiles = tiles.length;
  const correctPercentage = (correctCount / totalTiles) * 100;
  
  puzzle.classList.remove('correct-progress-25', 'correct-progress-50', 'correct-progress-75', 'correct-progress-100');
  
  if (correctPercentage >= 100) {
    puzzle.classList.add('correct-progress-100');
  } else if (correctPercentage >= 75) {
    puzzle.classList.add('correct-progress-75');
  } else if (correctPercentage >= 50) {
    puzzle.classList.add('correct-progress-50');
  } else if (correctPercentage >= 25) {
    puzzle.classList.add('correct-progress-25');
  }
  
  return correctCount === totalTiles;
}

// Drag and Drop handlers
function dragStart(e) {
  if (!gameStarted) {
    e.preventDefault();
    return;
  }
  if (this.classList.contains('correct')) {
    e.preventDefault();
    return;
  }
  draggedTile = this;
  this.classList.add("dragging");
  e.dataTransfer.setData("text/plain", this.dataset.pieceIndex);
  e.dataTransfer.effectAllowed = "move";
}

function dragEnd(e) {
  this.classList.remove("dragging");
  draggedTile = null;
}

function dragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function dropTile(e) {
  e.preventDefault();
  if (!gameStarted || !draggedTile || draggedTile === this) return;
  if (this.classList.contains('correct')) return;
  swapTiles(draggedTile, this);
}

// Touch handlers for mobile
let touchDraggedTile = null;
let touchStartPos = null;

function touchStart(e) {
  e.preventDefault();
  if (!gameStarted) return;
  if (this.classList.contains('correct')) return;
  
  touchDraggedTile = this;
  touchStartPos = {
    x: e.touches[0].clientX,
    y: e.touches[0].clientY
  };
  this.classList.add("dragging");
}

function touchMove(e) {
  e.preventDefault();
}

function touchEnd(e) {
  e.preventDefault();
  if (!touchDraggedTile || !gameStarted) {
    touchDraggedTile = null;
    return;
  }
  touchDraggedTile.classList.remove("dragging");
  
  const touch = e.changedTouches[0];
  const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
  const targetTile = elementUnderTouch?.closest(".tile");
  
  if (targetTile && targetTile !== touchDraggedTile && !targetTile.classList.contains('correct')) {
    swapTiles(touchDraggedTile, targetTile);
  }
  touchDraggedTile = null;
  touchStartPos = null;
}

// Swap tiles function
function swapTiles(tile1, tile2) {
  const tempIndex = tile1.dataset.pieceIndex;
  tile1.dataset.pieceIndex = tile2.dataset.pieceIndex;
  tile2.dataset.pieceIndex = tempIndex;
  
  updateTileBackground(tile1);
  updateTileBackground(tile2);
  
  moves++;
  document.getElementById("moves").innerText = moves;
  
  const allCorrect = checkCorrectTiles();
  
  if (allCorrect) {
    stopTimer();
    gameStarted = false;
    
    const difficultyNames = ['Easy', 'Medium', 'Hard'];
    const difficultyIndex = gridSize === 3 ? 0 : gridSize === 4 ? 1 : 2;
    
    alert(`🎉 Congratulations ${currentPlayer.name}!\nTime: ${seconds}s | Moves: ${moves}\nDifficulty: ${difficultyNames[difficultyIndex]}`);
    saveScore(seconds);
  }
}

function updateTileBackground(tile) {
  const puzzle = document.getElementById("puzzle");
  const containerWidth = puzzle.offsetWidth;
  if (containerWidth === 0) return;
  
  const pieceIndex = parseInt(tile.dataset.pieceIndex);
  const tileSize = containerWidth / gridSize;
  const x = (pieceIndex % gridSize) * tileSize;
  const y = Math.floor(pieceIndex / gridSize) * tileSize;
  
  tile.style.backgroundImage = `url(${imageURL})`;
  tile.style.backgroundPosition = `-${x}px -${y}px`;
  tile.style.backgroundSize = `${containerWidth}px ${containerWidth}px`;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  if (!isSolvable(array, gridSize) && array.length > 1) {
    [array[0], array[1]] = [array[1], array[0]];
  }
  return array;
}

function isSolvable(pieces, size) {
  let inversions = 0;
  for (let i = 0; i < pieces.length - 1; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      if (pieces[i] && pieces[j] && pieces[i] > pieces[j]) {
        inversions++;
      }
    }
  }
  if (size % 2 === 1) return inversions % 2 === 0;
  return inversions % 2 === 0;
}

// Save score to Firebase with difficulty
function saveScore(time) {
  if (!currentPlayer.name || currentPlayer.name === 'User') {
    openNameModal();
    // Save score after name is entered
    const checkNameAndSave = setInterval(() => {
      if (currentPlayer.name !== 'User') {
        clearInterval(checkNameAndSave);
        saveScoreToDB(time);
      }
    }, 100);
  } else {
    saveScoreToDB(time);
  }
}

function saveScoreToDB(time) {
  const difficultyNames = ['Easy', 'Medium', 'Hard'];
  const difficultyIndex = gridSize === 3 ? 0 : gridSize === 4 ? 1 : 2;
  const difficulty = difficultyNames[difficultyIndex];
  
  db.ref("scores").push({
    name: currentPlayer.name,
    time: time,
    moves: moves,
    difficulty: difficulty,
    gridSize: gridSize,
    timestamp: Date.now()
  }).then(() => {
    console.log("Score saved successfully!");
    // Leaderboard will update automatically via the Firebase listener
  }).catch(error => {
    console.error("Error saving score:", error);
    alert("Failed to save score. Please check your Firebase configuration.");
  });
}

// Create challenge link - FIXED to prevent freezing
function createChallenge() {
  if (!imageURL || !gridSize) {
    alert("Start a puzzle first!");
    return;
  }
  
  try {
    // Compress the image data by using a smaller version
    // For large images, we'll store just the essential info
    const puzzleData = {
      img: imageURL.length > 100000 ? 'large_image' : imageURL, // Flag for large images
      size: gridSize,
      timestamp: Date.now()
    };
    
    // If image is too large, store a message instead
    if (imageURL.length > 100000) {
      alert("Image is too large to share via link. The recipient will need to choose their own image.");
      puzzleData.img = null;
    }
    
    const encodedData = btoa(JSON.stringify(puzzleData));
    
    // Use history API to update URL without reload
    const newUrl = `${window.location.origin}${window.location.pathname}?puzzle=${encodedData}`;
    
    // Show the link in a safe way without freezing
    document.getElementById("share").innerHTML = `
      <strong>🎮 Challenge a Friend!</strong>
      <p style="margin:10px 0; color:white;">Copy this link and send it to your friend:</p>
      <div class="link-preview">
        ${newUrl.substring(0, 100)}...
      </div>
      <button class="btn" onclick="copySafeLink('${newUrl}')" style="margin-top:10px; width:100%;">📋 Copy Full Link</button>
      <p style="margin-top:10px; font-size:14px; color:#aaa;">Note: Very large images cannot be shared via link.</p>
    `;
  } catch (e) {
    console.error('Error creating challenge:', e);
    alert('Failed to create challenge link. The image might be too large.');
  }
}

// Safe copy function
function copySafeLink(text) {
  // Create a temporary textarea element
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  alert('✅ Link copied to clipboard!');
}

// Load shared puzzle from URL - FIXED to handle large images
window.onload = function() {
  loadPlayer();
  document.querySelector('.user-badge').addEventListener('click', openNameModal);
  
  const params = new URLSearchParams(location.search);
  const puzzleData = params.get("puzzle");
  
  if (puzzleData) {
    try {
      // Show loading indicator
      document.getElementById('puzzle').innerHTML = '<div class="loading">Loading shared puzzle...</div>';
      
      // Use setTimeout to prevent freezing
      setTimeout(() => {
        try {
          const data = JSON.parse(atob(puzzleData));
          
          if (data.img && data.img !== 'large_image' && data.img !== null) {
            imageURL = data.img;
            gridSize = data.size;
            document.getElementById("difficulty").value = gridSize;
            createPuzzle();
          } else {
            alert('Shared puzzle image could not be loaded. Please choose your own image.');
            document.getElementById('puzzle').innerHTML = '';
          }
        } catch (e) {
          console.error('Error parsing puzzle data:', e);
          alert('Invalid puzzle link. Please start a new game.');
          document.getElementById('puzzle').innerHTML = '';
        }
      }, 100);
      
    } catch (e) {
      console.error("Error loading shared puzzle:", e);
      document.getElementById('puzzle').innerHTML = '';
    }
  }
  
  // Set up leaderboard listener
  setupLeaderboardListener();
  
  window.addEventListener('resize', () => {
    if (gameStarted && imageURL) {
      updateAllTileBackgrounds();
      checkCorrectTiles();
    }
  });
};

// Set up Firebase listener for leaderboard updates
function setupLeaderboardListener() {
  console.log("Setting up leaderboard listener...");
  
  // Remove any existing listeners to prevent duplicates
  if (window.leaderboardRef) {
    window.leaderboardRef.off();
  }
  
  // Create a new listener
  window.leaderboardRef = db.ref("scores").orderByChild("time").limitToFirst(20);
  
  window.leaderboardRef.on("value", snapshot => {
    console.log("Leaderboard data received:", snapshot.val());
    updateLeaderboardDisplay(snapshot);
  }, error => {
    console.error("Firebase listener error:", error);
  });
}

// Update leaderboard display with data from Firebase
function updateLeaderboardDisplay(snapshot) {
  const list = document.getElementById("leaderboard");
  if (!list) return;
  
  list.innerHTML = "";
  
  let rank = 1;
  const scores = [];
  
  snapshot.forEach(score => {
    const data = score.val();
    scores.push(data);
  });
  
  // Sort by time (already sorted by Firebase, but just in case)
  scores.sort((a, b) => a.time - b.time);
  
  if (scores.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No scores yet. Be the first!";
    li.style.justifyContent = 'center';
    list.appendChild(li);
    return;
  }
  
  scores.forEach(data => {
    const li = document.createElement("li");
    if (data.name === currentPlayer.name) {
      li.classList.add('current-player');
    }
    
    // Determine difficulty class
    let difficultyClass = 'difficulty-easy';
    if (data.difficulty === 'Medium') difficultyClass = 'difficulty-medium';
    if (data.difficulty === 'Hard') difficultyClass = 'difficulty-hard';
    
    li.innerHTML = `
      <div class="player-info">
        <span class="difficulty-badge ${difficultyClass}">${data.difficulty || 'Easy'}</span>
        <span class="player-name">${rank}. ${data.name}</span>
      </div>
      <div class="score-info">
        <span class="score-time">${data.time}s</span>
        <span class="score-moves">${data.moves || '?'} moves</span>
      </div>
    `;
    list.appendChild(li);
    rank++;
  });
}

// Force refresh leaderboard manually
function refreshLeaderboard() {
  if (window.leaderboardRef) {
    window.leaderboardRef.once("value", snapshot => {
      updateLeaderboardDisplay(snapshot);
    });
  }
}

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeNameModal();
  }
});