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
  gameStarted = false;
  stopTimer();
  document.getElementById('puzzle').innerHTML = '';
  moves = 0;
  seconds = 0;
  document.getElementById('moves').innerText = '0';
  document.getElementById('timer').innerText = '0';
  imageURL = null;
  document.getElementById('upload').value = '';
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
  
  shuffleArray(pieces);
  
  // Create tiles (without setting background position yet)
  pieces.forEach((pieceIndex, positionIndex) => {
    createTileElement(pieceIndex, positionIndex);
  });
  
  // After all tiles are in the DOM, set their background based on current container size
  updateAllTileBackgrounds();
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
  const containerWidth = puzzle.offsetWidth; // actual pixel width (e.g., 400, 300, 260)
  if (containerWidth === 0) return; // not visible yet
  
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
  if (!gameStarted || !draggedTile || draggedTile === this) return;
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
  // Swap dataset pieceIndex
  const tempIndex = tile1.dataset.pieceIndex;
  tile1.dataset.pieceIndex = tile2.dataset.pieceIndex;
  tile2.dataset.pieceIndex = tempIndex;
  
  // Update their backgrounds based on new pieceIndex
  updateTileBackground(tile1);
  updateTileBackground(tile2);
  
  moves++;
  document.getElementById("moves").innerText = moves;
  checkWin();
}

// Update a single tile's background based on its dataset.pieceIndex and current container width
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

// Shuffle array
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

// Check win condition using current container size
function checkWin() {
  const tiles = document.querySelectorAll(".tile");
  const puzzle = document.getElementById("puzzle");
  const containerWidth = puzzle.offsetWidth;
  if (containerWidth === 0) return;
  
  let correct = true;
  tiles.forEach((tile, index) => {
    const expectedPieceIndex = index; // correct piece for this position
    const actualPieceIndex = parseInt(tile.dataset.pieceIndex);
    if (actualPieceIndex !== expectedPieceIndex) {
      correct = false;
    }
  });
  
  if (correct) {
    stopTimer();
    gameStarted = false;
    alert(`🎉 Congratulations ${currentPlayer.name}!\nTime: ${seconds}s | Moves: ${moves}`);
    saveScore(seconds);
  }
}

// Save score to Firebase
function saveScore(time) {
  if (!currentPlayer.name || currentPlayer.name === 'User') {
    openNameModal();
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

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("Link copied!");
  });
}

// Load shared puzzle from URL
window.onload = function() {
  loadPlayer();
  document.querySelector('.user-badge').addEventListener('click', openNameModal);
  
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
  
  loadLeaderboard();
  
  // Optional: update backgrounds if window resizes (e.g., orientation change)
  window.addEventListener('resize', () => {
    if (gameStarted && imageURL) {
      updateAllTileBackgrounds();
    }
  });
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