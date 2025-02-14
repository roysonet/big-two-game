// utils.js - Contains helper functions for the game logic

const SUITS = ['D', 'C', 'H', 'S']; // Diamonds, Clubs, Hearts, Spades
const RANKS = ['3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A', '2'];

export function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ suit, rank });
        }
    }
    return deck;
}

export function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// Get the numerical value of a card (for sorting and comparison)
function getCardValue(card) {
    let rankValue = RANKS.indexOf(card.rank);
    let suitValue = SUITS.indexOf(card.suit);
    return rankValue * 4 + suitValue;
}

// Sort a hand by card value (lowest to highest)
export function sortHand(hand) {
    hand.sort((a, b) => getCardValue(a) - getCardValue(b));
}

// Determine the type of a play (single, pair, three-of-a-kind, etc.)
export function getPlayType(cards) {
    if (cards.length === 1) {
        return 'single';
    }
    if (cards.length === 2 && cards[0].rank === cards[1].rank) {
        return 'pair';
    }
    if (cards.length === 3 && cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank) {
        return 'three-of-a-kind';
    }
    if (cards.length === 5) {
        // Check for straight, flush, full house, four-of-a-kind, straight flush
        const isFlush = cards.every(card => card.suit === cards[0].suit);
        const sortedRanks = cards.map(card => RANKS.indexOf(card.rank)).sort((a, b) => a - b);
        const isStraight = sortedRanks.every((rank, index) => index === 0 || rank === sortedRanks[index - 1] + 1);

        if (isStraight && isFlush) {
            return 'straight-flush';
        }
        if (sortedRanks[0] === sortedRanks[3] || sortedRanks[1] === sortedRanks[4]) {
            return 'four-of-a-kind';
        }
        if ((sortedRanks[0] === sortedRanks[2] && sortedRanks[3] === sortedRanks[4]) ||
            (sortedRanks[0] === sortedRanks[1] && sortedRanks[2] === sortedRanks[4])) {
            return 'full-house';
        }
        if (isFlush) {
            return 'flush';
        }
        if (isStraight) {
            return 'straight';
        }
    }
    return 'invalid'; // Not a valid play
}

// Get the numerical value of a play (for comparing plays of the same type)
export function getPlayValue(cards) {
     if (cards.length === 0) return 0;

    const type = getPlayType(cards);
    switch (type) {
        case 'single':
            return getCardValue(cards[0]);
        case 'pair':
        case 'three-of-a-kind':
            return getCardValue(cards[0]); // Value is based on the rank of the pair/three
        case 'straight':
        case 'flush':
        case 'full-house':
        case 'four-of-a-kind':
        case 'straight-flush':
            // For five-card hands, use the highest card in the hand
            return getCardValue(cards.sort((a,b) => getCardValue(b) - getCardValue(a))[0]);
        default:
            return 0;
    }
}

// Check if a play is valid (according to the rules of Big Two)
export function isValidPlay(cards) {
    return getPlayType(cards) !== 'invalid';
}

// Check if a play can be played on top of another play
export function canPlayOn(newCards, currentPlay) {
    if (!currentPlay || currentPlay.cards.length === 0) {
        return isValidPlay(newCards); // Any valid play can start a round
    }

    const newType = getPlayType(newCards);
    const currentType = currentPlay.type;

    if (newType !== currentType) {
        // Special case: straight flush beats four-of-a-kind, which beats full house, which beats flush, which beats straight
        if (newType === 'straight-flush' && (currentType === 'four-of-a-kind' || currentType === 'full-house' || currentType === 'flush' || currentType === 'straight')) return true;
        if (newType === 'four-of-a-kind' && (currentType === 'full-house' || currentType === 'flush' || currentType === 'straight')) return true;
        if (newType === 'full-house' && (currentType === 'flush' || currentType === 'straight')) return true;
        if (newType === 'flush' && currentType === 'straight') return true;
        return false;
    }

    if (newCards.length !== currentPlay.cards.length) {
        return false; // Must play the same number of cards
    }

    return getPlayValue(newCards) > getPlayValue(currentPlay.cards);
}

// Get the strongest card in a hand (for AI decision-making)
export function getStrongestCard(hand) {
    return hand.reduce((strongest, current) => getCardValue(current) > getCardValue(strongest) ? current : strongest, hand[0]);
}

// Find a valid play for the AI (very basic AI)
export function findValidPlay(hand, currentPlay) {
    if (!currentPlay) {
        // If AI starts, play the lowest single, pair, or triple, or five-card hand
        let lowestSingle = hand[0];
        let lowestPair = null;
        let lowestTriple = null;
        let lowestFiveCard = null;

        // Check for pairs
        for (let i = 0; i < hand.length - 1; i++) {
            if (hand[i].rank === hand[i + 1].rank) {
                lowestPair = [hand[i], hand[i + 1]];
                break;
            }
        }

        // Check for triples
        for (let i = 0; i < hand.length - 2; i++) {
            if (hand[i].rank === hand[i + 1].rank && hand[i + 1].rank === hand[i + 2].rank) {
                lowestTriple = [hand[i], hand[i + 1], hand[i + 2]];
                break;
            }
        }

        // Check for five card hands (simplified - just find any 5 consecutive cards)
        if (hand.length >= 5) {
            for(let i = 0; i <= hand.length-5; i++) {
                const fiveCards = hand.slice(i, i+5);
                if(isValidPlay(fiveCards)) {
                    lowestFiveCard = fiveCards;
                    break;
                }
            }
        }

        if (lowestFiveCard) return lowestFiveCard;
        if (lowestTriple) return lowestTriple;
        if (lowestPair) return lowestPair;
        return [lowestSingle];
    }

    // Try to beat the current play
    const currentType = currentPlay.type;
    const currentValue = getPlayValue(currentPlay.cards);

    switch (currentType) {
        case 'single':
            for (const card of hand) {
                if (getCardValue(card) > currentValue) {
                    return [card];
                }
            }
            break;
        case 'pair':
            for (let i = 0; i < hand.length - 1; i++) {
                if (hand[i].rank === hand[i + 1].rank && getCardValue(hand[i]) > currentValue) {
                    return [hand[i], hand[i + 1]];
                }
            }
            break;
        case 'three-of-a-kind':
            for (let i = 0; i < hand.length - 2; i++) {
                if (hand[i].rank === hand[i + 1].rank && hand[i + 1].rank === hand[i + 2].rank && getCardValue(hand[i]) > currentValue) {
                    return [hand[i], hand[i + 1], hand[i + 2]];
                }
            }
            break;
        case 'straight':
        case 'flush':
        case 'full-house':
        case 'four-of-a-kind':
        case 'straight-flush':
            if (hand.length >= 5) {
                for(let i = 0; i <= hand.length-5; i++) {
                    const fiveCards = hand.slice(i, i+5);
                    if(canPlayOn(fiveCards, currentPlay)) {
                        return fiveCards;
                    }
                }
            }
            break;
    }

    return null; // Can't beat the current play
}
