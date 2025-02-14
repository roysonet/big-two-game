import { createDeck, shuffleDeck, isValidPlay, getPlayType, getPlayValue, canPlayOn, sortHand, getStrongestCard, findValidPlay } from './utils.js';

let deck;
let playerHand;
let aiHands;
let currentPlay;
let currentPlayer; // 0 = player, 1-3 = AI
let lastPlayer;
let message;
let timerInterval;

function getCardImageUrl(card) {
    // Map our suit and rank to Deck of Cards API codes
    const suitMap = { 'D': 'D', 'C': 'C', 'H': 'H', 'S': 'S' };
    const rankMap = { 'T': '0', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9' };

    const code = `${rankMap[card.rank]}${suitMap[card.suit]}`;
    return `https://deckofcardsapi.com/static/img/${code}.png`;
}

function renderCard(card, container, isSelectable) {
    const cardElement = document.createElement('div');
    cardElement.classList.add('card');
    cardElement.style.backgroundImage = `url('${getCardImageUrl(card)}')`; // Use the API URL
    cardElement.dataset.suit = card.suit;
    cardElement.dataset.rank = card.rank;

    if (isSelectable) {
        cardElement.addEventListener('click', () => {
            cardElement.classList.toggle('selected');
        });
    }

    container.appendChild(cardElement);
}

function renderAIHand(hand, container) {
    container.innerHTML = ''; // Clear existing cards
    for (let i = 0; i < hand.length; i++) {
        const cardBack = document.createElement('div');
        cardBack.classList.add('ai-card-back');
        container.appendChild(cardBack);
    }
}

function renderHand(hand, container, isPlayer) {
  if (isPlayer) {
    container.innerHTML = ''; // Clear existing cards
    for (const card of hand) {
        renderCard(card, container, isPlayer);
    }
  } else {
    renderAIHand(hand, container);
  }
}

function renderTable() {
    const tableElement = document.getElementById('current-play-area');
    tableElement.innerHTML = ''; // Clear the table

    if (currentPlay && currentPlay.cards.length > 0) {
        for (const card of currentPlay.cards) {
            renderCard(card, tableElement, false); // Cards on the table are not selectable
        }
    }
}

function updateMessage(newMessage) {
    message = newMessage;
    const messageElement = document.getElementById('message');
    messageElement.textContent = message;

    // Show the message overlay
    const overlay = document.getElementById('message-overlay');
    overlay.classList.add('active');

    // Hide the message after 2 seconds
    setTimeout(() => {
        overlay.classList.remove('active');
    }, 2000);
}

function dealHands() {
    deck = createDeck();
    shuffleDeck(deck);
    playerHand = [];
    aiHands = [[], [], []];
    let playerIndex = 0;
    for (let i = 0; i < 52; i++) {
        if (playerIndex === 0) {
            playerHand.push(deck[i]);
        } else {
            aiHands[playerIndex - 1].push(deck[i]);
        }
        playerIndex = (playerIndex + 1) % 4;
    }
    sortHand(playerHand);
    aiHands.forEach(sortHand);
}

function getSelectedCards() {
    const selectedCards = [];
    const selectedElements = document.querySelectorAll('#player-hand .card.selected');
    selectedElements.forEach(el => {
        selectedCards.push({ suit: el.dataset.suit, rank: el.dataset.rank });
    });
    return selectedCards;
}

function playCards(cards) {
    // Remove played cards from player's hand
    for (const card of cards) {
        const index = playerHand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
        if (index > -1) {
            playerHand.splice(index, 1);
        }
    }
    currentPlay = { player: currentPlayer, cards: cards, type: getPlayType(cards) };
    lastPlayer = currentPlayer;
    currentPlayer = (currentPlayer + 1) % 4;
     clearSelectedCards();
}

function clearSelectedCards() {
    const selectedElements = document.querySelectorAll('#player-hand .card.selected');
    selectedElements.forEach(el => {
        el.classList.remove('selected');
    });
}

function aiTurn() {
    let played = false;
    const aiHand = aiHands[currentPlayer - 1];
    console.log(`AI ${currentPlayer} turn beginning. Hand:`, aiHand);
    console.log(`Current play:`, currentPlay);

    if (!aiHand || !Array.isArray(aiHand)) {
        console.error(`Invalid AI hand for player ${currentPlayer}. aiHands:`, aiHands);
        return;
    }

    if (currentPlay === null || currentPlay.player === currentPlayer) {
        // AI starts the round
        const play = findValidPlay(aiHand, null);
        if (play) {
            currentPlay = { player: currentPlayer, cards: play, type: getPlayType(play) };
            updateMessage(`AI ${currentPlayer} plays ${currentPlay.type}`);
            played = true;
        }
    } else {
        // AI needs to beat the current play
        const play = findValidPlay(aiHand, currentPlay);
        if (play) {
            currentPlay = { player: currentPlayer, cards: play, type: getPlayType(play) };
            updateMessage(`AI ${currentPlayer} plays ${currentPlay.type}`);
            played = true;
        }
    }

    if (played) {
        // Remove played cards from AI's hand
        for (const card of currentPlay.cards) {
            const index = aiHand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
            if (index > -1) {
                aiHand.splice(index, 1);
            }
        }
        lastPlayer = currentPlayer;
        currentPlayer = (currentPlayer + 1) % 4;
    } else {
        updateMessage(`AI ${currentPlayer} passes`);
        currentPlayer = (currentPlayer + 1) % 4;
    }

    // Validate AI hand after play
    console.log(`AI ${currentPlayer - 1} hand after play:`, aiHand);
    
    renderHands();
    renderTable();
    nextTurn();
}

function updatePlayerTurnHighlight() {
    const playerHandElement = document.getElementById('player-hand');
    playerHandElement.classList.remove('active-turn'); // Remove from everyone
    if (currentPlayer === 0) {
        playerHandElement.classList.add('active-turn');
    }
}

function startTimer() {
    clearInterval(timerInterval); // Clear any existing timer

    let timeLeft = 30; // Changed from 10 to 30 seconds
    updateMessage(`Time left: ${timeLeft}`);

    timerInterval = setInterval(() => {
        timeLeft--;
        updateMessage(`Time left: ${timeLeft}`);

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handlePassButtonClick(); // Auto-pass
        }
    }, 1000);
}

function nextTurn() {
    if (currentPlayer === 0) {
        updateMessage("Your turn");
        // Re-enable player controls
        document.getElementById('play-button').disabled = false;
        document.getElementById('pass-button').disabled = false;
        document.getElementById('clear-button').disabled = false;
        startTimer(); // Start the timer for the player
    } else {
        // Disable player controls during AI turn
        document.getElementById('play-button').disabled = true;
        document.getElementById('pass-button').disabled = true;
        document.getElementById('clear-button').disabled = true;
        clearInterval(timerInterval);
        setTimeout(aiTurn, 1000); // Simulate AI thinking
    }
     if (playerHand.length === 0) {
        endGame(0);
        return;
    }
    for (let i = 0; i < 3; i++) {
        if (aiHands[i].length === 0) {
            endGame(i + 1);
            return;
        }
    }

    updatePlayerTurnHighlight();
}

function checkWinCondition() {
    if (playerHand.length === 0) {
        return 0; // Player wins
    }
    for (let i = 0; i < aiHands.length; i++) {
        if (aiHands[i].length === 0) {
            return i + 1; // AI i+1 wins
        }
    }
    return -1; // No winner yet
}

function endGame(winner) {
    if (winner === 0) {
        updateMessage("Congratulations! You win!");
    } else {
        updateMessage(`AI ${winner} wins!`);
    }
    // Disable buttons
    document.getElementById('play-button').disabled = true;
    document.getElementById('pass-button').disabled = true;
    document.getElementById('clear-button').disabled = true;
    clearInterval(timerInterval);

    // Optionally, offer a "Play Again" button here
}

function handlePlayButtonClick() {
    const selectedCards = getSelectedCards();

    if (selectedCards.length === 0) {
        updateMessage("Please select cards to play.");
        return;
    }

    if (currentPlay === null || currentPlay.player === 0) {
        // Player starts the round or continues after everyone passed
        if (isValidPlay(selectedCards)) {
            playCards(selectedCards);
            updateMessage("");
            renderHands();
            renderTable();
            nextTurn();
        } else {
            updateMessage("Invalid play. Please try again.");
        }
    } else {
        // Player needs to beat the current play
        if (canPlayOn(selectedCards, currentPlay)) {
            playCards(selectedCards);
            updateMessage("");
            renderHands();
            renderTable();
            nextTurn();
        } else {
            updateMessage("Invalid play. You must beat the current play.");
        }
    }
     clearInterval(timerInterval);
}

function handlePassButtonClick() {
    if (currentPlay === null || currentPlay.player === currentPlayer) {
        updateMessage("Cannot pass at the start of a round.");
        return;
    }
    updateMessage("You passed.");
    currentPlayer = (currentPlayer + 1) % 4;
    clearInterval(timerInterval);
    renderHands();
    renderTable();
    nextTurn();
}

function handleClearButtonClick() {
    clearSelectedCards();
}

function renderHands() {
    renderHand(playerHand, document.getElementById('player-hand'), true); // Player hand is selectable
    renderHand(aiHands[0], document.getElementById('ai-1'), false);
    renderHand(aiHands[1], document.getElementById('ai-2'), false);
    renderHand(aiHands[2], document.getElementById('ai-3'), false);
}

export function setupGame() {
    dealHands();
    // Find the player with the 3 of diamonds
    currentPlayer = playerHand.some(card => card.suit === 'D' && card.rank === '3') ? 0 :
                      aiHands[0].some(card => card.suit === 'D' && card.rank === '3') ? 1 :
                      aiHands[1].some(card => card.suit === 'D' && card.rank === '3') ? 2 : 3;

    lastPlayer = currentPlayer;
    currentPlay = null;
    updateMessage("");

    renderHands();
    renderTable();

    document.getElementById('play-button').addEventListener('click', handlePlayButtonClick);
    document.getElementById('pass-button').addEventListener('click', handlePassButtonClick);
    document.getElementById('clear-button').addEventListener('click', handleClearButtonClick);

    nextTurn();
}

export function resetGame() {
    // Reset all game variables to their initial state
    deck = null;
    playerHand = [];
    aiHands = [[], [], []];
    currentPlay = null;
    currentPlayer = null;
    lastPlayer = null;
    message = "";
    clearInterval(timerInterval); // Clear any running timer

    // Clear any displayed cards and messages
    document.getElementById('player-hand').innerHTML = '';
    document.getElementById('ai-1').innerHTML = '';
    document.getElementById('ai-2').innerHTML = '';
    document.getElementById('ai-3').innerHTML = '';
    document.getElementById('current-play-area').innerHTML = '';
    document.getElementById('message').textContent = '';

    // Re-enable buttons (in case they were disabled at the end of a game)
    document.getElementById('play-button').disabled = false;
    document.getElementById('pass-button').disabled = false;
    document.getElementById('clear-button').disabled = false;
}
