// Game state
let targetWord = '';
let currentRow = 0;
let currentTile = 0;
let gameOver = false;
const maxGuesses = 6;
const wordLength = 5;

// Keyboard layout
const keys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
];

// Initialize the game
function init() {
    loadTargetWord();
    createBoard();
    createKeyboard();
    setupEventListeners();
}

// Load target word from localStorage or set default
function loadTargetWord() {
    const savedWord = localStorage.getItem('wordyTarget');
    if (savedWord) {
        targetWord = savedWord.toUpperCase();
    } else {
        // Default word
        targetWord = 'CRANE';
        localStorage.setItem('wordyTarget', targetWord);
    }
}

// Create game board
function createBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    
    for (let i = 0; i < maxGuesses; i++) {
        const row = document.createElement('div');
        row.classList.add('row');
        
        for (let j = 0; j < wordLength; j++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.setAttribute('data-row', i);
            tile.setAttribute('data-col', j);
            row.appendChild(tile);
        }
        
        board.appendChild(row);
    }
}

// Create keyboard
function createKeyboard() {
    const keyboard = document.getElementById('keyboard');
    keyboard.innerHTML = '';
    
    keys.forEach(row => {
        const keyboardRow = document.createElement('div');
        keyboardRow.classList.add('keyboard-row');
        
        row.forEach(key => {
            const keyButton = document.createElement('button');
            keyButton.classList.add('key');
            keyButton.textContent = key;
            keyButton.setAttribute('data-key', key);
            
            if (key === 'ENTER' || key === '⌫') {
                keyButton.classList.add('wide');
            }
            
            keyButton.addEventListener('click', () => handleKeyPress(key));
            keyboardRow.appendChild(keyButton);
        });
        
        keyboard.appendChild(keyboardRow);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Physical keyboard
    document.addEventListener('keydown', (e) => {
        if (gameOver) return;
        
        const key = e.key.toUpperCase();
        
        if (key === 'ENTER') {
            handleKeyPress('ENTER');
        } else if (key === 'BACKSPACE') {
            handleKeyPress('⌫');
        } else if (/^[A-Z]$/.test(key)) {
            handleKeyPress(key);
        }
    });
}

// Handle key press
function handleKeyPress(key) {
    if (gameOver) return;
    
    if (key === 'ENTER') {
        submitGuess();
    } else if (key === '⌫') {
        deleteLetter();
    } else if (currentTile < wordLength) {
        addLetter(key);
    }
}

// Add letter to current tile
function addLetter(letter) {
    if (currentTile < wordLength) {
        const tile = document.querySelector(`[data-row="${currentRow}"][data-col="${currentTile}"]`);
        tile.textContent = letter;
        tile.classList.add('filled');
        currentTile++;
    }
}

// Delete letter from current tile
function deleteLetter() {
    if (currentTile > 0) {
        currentTile--;
        const tile = document.querySelector(`[data-row="${currentRow}"][data-col="${currentTile}"]`);
        tile.textContent = '';
        tile.classList.remove('filled');
    }
}

// Submit guess
function submitGuess() {
    if (currentTile !== wordLength) {
        showMessage('Not enough letters', 1000);
        return;
    }
    
    const guess = getCurrentGuess();
    
    // Check if word is valid (you could add a dictionary check here)
    if (!isValidWord(guess)) {
        showMessage('Not in word list', 1000);
        shakeTiles();
        return;
    }
    
    // Flip tiles and check letters
    flipTiles(guess);
    
    // Check win condition
    if (guess === targetWord) {
        gameOver = true;
        setTimeout(() => {
            showMessage('Excellent! You won! 🎉', 5000, 'win');
        }, 1500);
        return;
    }
    
    // Move to next row
    currentRow++;
    currentTile = 0;
    
    // Check lose condition
    if (currentRow === maxGuesses) {
        gameOver = true;
        setTimeout(() => {
            showMessage(`Game Over! The word was ${targetWord}`, 5000, 'lose');
        }, 1500);
    }
}

// Get current guess
function getCurrentGuess() {
    let guess = '';
    for (let i = 0; i < wordLength; i++) {
        const tile = document.querySelector(`[data-row="${currentRow}"][data-col="${i}"]`);
        guess += tile.textContent;
    }
    return guess;
}

// Simple word validation (accepts any 5-letter combination for simplicity)
// You could replace this with a dictionary API or word list
function isValidWord(word) {
    return word.length === wordLength && /^[A-Z]+$/.test(word);
}

// Flip tiles with animation
function flipTiles(guess) {
    const letterCount = {};
    
    // Count letters in target word
    for (let letter of targetWord) {
        letterCount[letter] = (letterCount[letter] || 0) + 1;
    }
    
    const statuses = new Array(wordLength).fill('absent');
    
    // First pass: mark correct letters
    for (let i = 0; i < wordLength; i++) {
        if (guess[i] === targetWord[i]) {
            statuses[i] = 'correct';
            letterCount[guess[i]]--;
        }
    }
    
    // Second pass: mark present letters
    for (let i = 0; i < wordLength; i++) {
        if (statuses[i] === 'absent' && letterCount[guess[i]] > 0) {
            statuses[i] = 'present';
            letterCount[guess[i]]--;
        }
    }
    
    // Animate tiles
    for (let i = 0; i < wordLength; i++) {
        const tile = document.querySelector(`[data-row="${currentRow}"][data-col="${i}"]`);
        const letter = guess[i];
        const status = statuses[i];
        
        setTimeout(() => {
            tile.classList.add(status);
            updateKeyboard(letter, status);
        }, i * 300);
    }
}

// Update keyboard colors
function updateKeyboard(letter, status) {
    const key = document.querySelector(`[data-key="${letter}"]`);
    if (!key) return;
    
    const currentStatus = key.classList.contains('correct') ? 'correct' :
                         key.classList.contains('present') ? 'present' :
                         key.classList.contains('absent') ? 'absent' : '';
    
    // Priority: correct > present > absent
    if (currentStatus === 'correct') return;
    if (currentStatus === 'present' && status !== 'correct') return;
    
    key.classList.remove('correct', 'present', 'absent');
    key.classList.add(status);
}

// Shake tiles animation
function shakeTiles() {
    const tiles = document.querySelectorAll(`[data-row="${currentRow}"]`);
    tiles.forEach(tile => {
        tile.style.animation = 'shake 0.5s';
        setTimeout(() => {
            tile.style.animation = '';
        }, 500);
    });
}

// Show message
function showMessage(text, duration, type = '') {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = 'message show';
    
    if (type) {
        messageEl.classList.add(type);
    }
    
    setTimeout(() => {
        messageEl.classList.remove('show');
        setTimeout(() => {
            messageEl.className = 'message';
        }, 300);
    }, duration);
}

// Add shake animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Start the game
init();
