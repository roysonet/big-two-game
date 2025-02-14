import './style.css'
import { setupGame, resetGame } from './game.js'; // Import resetGame

function startGame() {
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'grid';
    setupGame();
}

function goHome() {
    // Reload the page to reset everything
    location.reload();
}

function restartGame() {
    resetGame(); // Call the resetGame function from game.js
    setupGame(); // Then, set up the game again
}

document.querySelector('#app').innerHTML = `
  <div id="welcome-screen">
    <h1>Lao Er Dai</h1>
    <button id="start-button">Start Game</button>
  </div>
  <div id="game-container">
    <div id="top-buttons">
      <button id="home-button-ingame">Home</button>
      <button id="restart-button-ingame">Restart</button>
    </div>
    <div id="ai-1-area" class="ai-area">
      <div class="player-name">AI 1</div>
      <div id="ai-1" class="ai-hand"></div>
    </div>
    <div id="ai-2-area" class="ai-area">
      <div class="player-name">AI 2</div>
      <div id="ai-2" class="ai-hand ai-hand-vertical"></div>
    </div>
    <div id="table">
      <div id="current-play-area"></div>
    </div>
    <div id="ai-3-area" class="ai-area">
      <div class="player-name">AI 3</div>
      <div id="ai-3" class="ai-hand ai-hand-vertical"></div>
    </div>
    <div id="player-area">
      <div class="player-name">You</div>
      <div id="player-hand" class="hand"></div>
      <div id="controls">
        <button id="pass-button">Pass</button>
        <button id="clear-button">Clear</button>
        <button id="play-button">Submit</button>
      </div>
    </div>
    <div id="message-overlay">
      <div id="message"></div>
    </div>
  </div>
`;

// Event listeners
document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('home-button-ingame').addEventListener('click', goHome);
document.getElementById('restart-button-ingame').addEventListener('click', restartGame);
