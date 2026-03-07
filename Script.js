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
    
    // Save to localStorage
    localStorage.setItem('pieShiftPlayer', JSON.stringify({
      name: name,
      id: currentPlayer.id || Date.now().toString()
    }));
  }
  closeNameModal();
}

// Load saved player
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
  // Clear the game state
  gameStarted = false;
  stopTimer();
  
  // Clear the puzzle grid
  document.getElementById('puzzle').innerHTML = '';
  
  // Reset stats
  moves = 0;
  seconds = 0;
  document.getElementById('moves').innerText = '0';
  document.getElementById('timer').innerText = '0';
  
  // Clear the image URL
  imageURL = null;
  
  // Clear the file input
  document.getElementById('upload').value = '';
  
  // Clear any share links
  document.getElementById('share').innerHTML = '';
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
  
  // Create array of piece indices
  let pieces = [];
  for (let i = 0; i < gridSize * gridSize; i++) {
    pieces.push(i);
  }
  
  // Shuffle pieces
  shuffleArray(pieces);
  
  // Create tiles
  pieces.forEach((pieceIndex, positionIndex) => {
    createTile(pieceIndex, positionIndex);
  });
}

function createTile(pieceIndex, positionIndex) {
  const puzzle = document.getElementById("puzzle");
  const tile = document.createElement("div");
  tile.className = "tile";
  tile.dataset.pieceIndex = pieceIndex;
  tile.dataset.positionIndex = positionIndex;
  
  // Calculate background position
  const tileSize = 400 / gridSize;
  const x = (pieceIndex % gridSize) * tileSize;
  const y = Math.floor(pieceIndex / gridSize) * tileSize;
  
  tile.style.backgroundImage = `url(${imageURL})`;
  tile.style.backgroundPosition = `-${x}px -${y}px`;
  tile.style.backgroundSize = `${400}px ${400}px`;
  
  // Drag and drop events
  tile.addEventListener("dragstart", dragStart);
  tile.addEventListener("dragend", dragEnd);
  tile.addEventListener("dragover", dragOver);
  tile.addEventListener("drop", dropTile);
  
  // Touch events for mobile
  tile.addEventListener("touchstart", touchStart, { passive: false });
  tile.addEventListener("touchmove", touchMove, { passive: false });
  tile.addEventListener("touchend", touchEnd);
  
  // Make tile draggable
  tile.setAttribute('draggable', 'true');
  
  puzzle.appendChild(tile);
}

// Drag and Drop handlers
function dragStart(e) {
  if (!gameStarted) {
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
  
  if (!gameStarted || !draggedTile || draggedTile === this) {
    return;
  }
  
  swapTiles(draggedTile, this);
}

// Touch handlers for mobile
let touchDraggedTile = null;
let touchStartPos = null;

function touchStart(e) {
  e.preventDefault();
  if (!gameStarted) return;
  
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
  
  if (targetTile && targetTile !== touchDraggedTile) {
    swapTiles(touchDraggedTile, targetTile);
  }
  
  touchDraggedTile = null;
  touchStartPos = null;
}

// Swap tiles function
function swapTiles(tile1, tile2) {
  // Swap background positions
  const tempPosition = tile1.style.backgroundPosition;
  const tempImage = tile1.style.backgroundImage;
  const tempPieceIndex = tile1.dataset.pieceIndex;
  
  tile1.style.backgroundPosition = tile2.style.backgroundPosition;
  tile1.style.backgroundImage = tile2.style.backgroundImage;
  tile1.dataset.pieceIndex = tile2.dataset.pieceIndex;
  
  tile2.style.backgroundPosition = tempPosition;
  tile2.style.backgroundImage = tempImage;
  tile2.dataset.pieceIndex = tempPieceIndex;
  
  // Increment moves
  moves++;
  document.getElementById("moves").innerText = moves;
  
  // Check win condition
  checkWin();
}

// Shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  
  // Ensure puzzle is solvable
  if (!isSolvable(array, gridSize) && array.length > 1) {
    [array[0], array[1]] = [array[1], array[0]];
  }
  
  return array;
}

// Check if puzzle is solvable
function isSolvable(pieces, size) {
  let inversions = 0;
  
  for (let i = 0; i < pieces.length - 1; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      if (pieces[i] && pieces[j] && pieces[i] > pieces[j]) {
        inversions++;
      }
    }
  }
  
  if (size % 2 === 1) {
    return inversions % 2 === 0;
  }
  
  return inversions % 2 === 0;
}

// Check win condition
function checkWin() {
  const tiles = document.querySelectorAll(".tile");
  let correct = true;
  
  tiles.forEach((tile, index) => {
    const tileSize = 400 / gridSize;
    const expectedX = (index % gridSize) * tileSize;
    const expectedY = Math.floor(index / gridSize) * tileSize;
    
    const currentX = Math.abs(parseInt(tile.style.backgroundPosition.split(" ")[0]) || 0);
    const currentY = Math.abs(parseInt(tile.style.backgroundPosition.split(" ")[1]) || 0);
    
    if (Math.abs(currentX - expectedX) > 1 || Math.abs(currentY - expectedY) > 1) {
      correct = false;
    }
  });
  
  if (correct) {
    stopTimer();
    gameStarted = false;
    
    // Show win message with player name
    alert(`🎉 Congratulations ${currentPlayer.name}!\nTime: ${seconds}s | Moves: ${moves}`);
    saveScore(seconds);
  }
}

// Save score to Firebase
function saveScore(time) {
  if (!currentPlayer.name || currentPlayer.name === 'User') {
    openNameModal();
    // Wait for name save then save score
    setTimeout(() => {
      if (currentPlayer.name !== 'User') {
        saveScoreToDB(time);
      }
    }, 500);
  } else {
    saveScoreToDB(time);
  }
}

function saveScoreToDB(time) {
  db.ref("scores").push({
    name: currentPlayer.name,
    time: time,
    moves: moves,
    timestamp: Date.now()
  }).catch(error => {
    console.error("Error saving score:", error);
  });
}

// Create challenge link
function createChallenge() {
  if (!imageURL || !gridSize) {
    alert("Start a puzzle first!");
    return;
  }
  
  const puzzleData = {
    img: imageURL,
    size: gridSize
  };
  
  const encodedData = btoa(JSON.stringify(puzzleData));
  const link = `${window.location.origin}${window.location.pathname}?puzzle=${encodedData}`;
  
  document.getElementById("share").innerHTML = `
    <strong>Share this puzzle with a friend:</strong>
    <input type="text" value="${link}" readonly onclick="this.select()">
    <button class="btn" onclick="copyToClipboard('${link}')" style="margin-top:8px; width:100%;">Copy Link</button>
  `;
}

// Copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("Link copied!");
  });
}

// Load shared puzzle from URL
window.onload = function() {
  // Load player
  loadPlayer();
  
  // Click on user badge to change name
  document.querySelector('.user-badge').addEventListener('click', openNameModal);
  
  // Load from URL
  const params = new URLSearchParams(location.search);
  const puzzleData = params.get("puzzle");
  
  if (puzzleData) {
    try {
      const data = JSON.parse(atob(puzzleData));
      imageURL = data.img;
      gridSize = data.size;
      document.getElementById("difficulty").value = gridSize;
      createPuzzle();
    } catch (e) {
      console.error("Error loading shared puzzle:", e);
    }
  }
  
  // Load leaderboard
  loadLeaderboard();
};

// Load leaderboard from Firebase
function loadLeaderboard() {
  db.ref("scores").orderByChild("time").limitToFirst(10).on("value", snapshot => {
    const list = document.getElementById("leaderboard");
    list.innerHTML = "";
    
    let rank = 1;
    snapshot.forEach(score => {
      const data = score.val();
      const li = document.createElement("li");
      
      // Highlight current player
      if (data.name === currentPlayer.name) {
        li.classList.add('current-player');
      }
      
      li.innerHTML = `
        <span>${rank}. ${data.name}</span>
        <span>${data.time}s (${data.moves || '?'} moves)</span>
      `;
      list.appendChild(li);
      rank++;
    });
    
    if (rank === 1) {
      const li = document.createElement("li");
      li.textContent = "No scores yet. Be the first!";
      list.appendChild(li);
    }
  });
}

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeNameModal();
  }
});