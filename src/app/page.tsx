'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface CardType {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
  value: number;
}

interface Hand {
  cards: CardType[];
  score: number;
  bet: number;
  status: 'playing' | 'bust' | 'stand' | 'blackjack';
}

interface GameState {
  deck: CardType[];
  playerHands: Hand[];
  dealerHand: CardType[];
  gameStatus: 'betting' | 'playing' | 'player-bust' | 'dealer-bust' | 'player-win' | 'dealer-win' | 'push';
  dealerScore: number;
  dealerRevealed: boolean;
  currentHandIndex: number;
}

const suits: CardType['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const createDeck = (): CardType[] => {
  const deck: CardType[] = [];
  suits.forEach(suit => {
    ranks.forEach(rank => {
      let value = parseInt(rank);
      if (rank === 'J' || rank === 'Q' || rank === 'K') value = 10;
      if (rank === 'A') value = 11;
      deck.push({ suit, rank, value });
    });
  });
  return shuffleDeck(deck);
};

const shuffleDeck = (deck: CardType[]): CardType[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const calculateScore = (hand: CardType[]): number => {
  let score = hand.reduce((sum, card) => sum + card.value, 0);
  let aces = hand.filter(card => card.rank === 'A').length;
  
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  
  return score;
};

const getCardSymbol = (suit: CardType['suit']) => {
  switch (suit) {
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
    case 'spades': return '♠';
  }
};

const getCardColor = (suit: CardType['suit']) => {
  return suit === 'hearts' || suit === 'diamonds' ? 'text-red-600' : 'text-black';
};

export default function BlackjackGame() {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    playerHands: [{ cards: [], score: 0, bet: 0, status: 'playing' }],
    dealerHand: [],
    gameStatus: 'betting',
    dealerScore: 0,
    dealerRevealed: false,
    currentHandIndex: 0,
  });

  const [chips, setChips] = useState(1000);
  const [betAmount, setBetAmount] = useState(50);

  const startNewGame = () => {
    if (chips < betAmount) {
      alert('Not enough chips!');
      return;
    }

    const deck = createDeck();
    const playerHand = [deck.pop()!, deck.pop()!];
    const dealerHand = [deck.pop()!, deck.pop()!];
    
    const playerScore = calculateScore(playerHand);
    const dealerScore = calculateScore([dealerHand[0]]);
    
    let gameStatus: GameState['gameStatus'] = 'playing';
    
    // Check for blackjack
    if (playerScore === 21) {
      const dealerFullScore = calculateScore(dealerHand);
      if (dealerFullScore === 21) {
        gameStatus = 'push';
      } else {
        gameStatus = 'player-win';
        setChips(prev => prev + Math.floor(betAmount * 1.5));
      }
    }
    
    setGameState({
      deck,
      playerHands: [{ cards: playerHand, score: playerScore, bet: betAmount, status: playerScore === 21 ? 'blackjack' : 'playing' }],
      dealerHand,
      gameStatus,
      dealerScore,
      dealerRevealed: playerScore === 21,
      currentHandIndex: 0,
    });
  };

  const hit = () => {
    if (gameState.gameStatus !== 'playing') return;
    
    const currentHand = gameState.playerHands[gameState.currentHandIndex];
    if (currentHand.status !== 'playing') return;
    
    const newDeck = [...gameState.deck];
    const newPlayerHands = [...gameState.playerHands];
    const newCurrentHand = { ...currentHand, cards: [...currentHand.cards, newDeck.pop()!] };
    const newScore = calculateScore(newCurrentHand.cards);
    
    newCurrentHand.score = newScore;
    if (newScore > 21) {
      newCurrentHand.status = 'bust';
    }
    
    newPlayerHands[gameState.currentHandIndex] = newCurrentHand;
    
    // Check if all hands are finished
    const allHandsFinished = newPlayerHands.every(hand => hand.status !== 'playing');
    if (allHandsFinished) {
      stand();
    } else {
      // Move to next playing hand
      let nextIndex = gameState.currentHandIndex;
      do {
        nextIndex = (nextIndex + 1) % newPlayerHands.length;
      } while (newPlayerHands[nextIndex].status !== 'playing' && nextIndex !== gameState.currentHandIndex);
      
      setGameState(prev => ({
        ...prev,
        deck: newDeck,
        playerHands: newPlayerHands,
        currentHandIndex: nextIndex,
      }));
    }
  };

  const stand = () => {
    if (gameState.gameStatus !== 'playing') return;
    
    let newDeck = [...gameState.deck];
    let newDealerHand = [...gameState.dealerHand];
    let dealerScore = calculateScore(newDealerHand);
    
    // Dealer plays
    while (dealerScore < 17) {
      newDealerHand = [...newDealerHand, newDeck.pop()!];
      dealerScore = calculateScore(newDealerHand);
    }
    
    // Calculate results for each hand
    const newPlayerHands = [...gameState.playerHands];
    let totalWinnings = 0;
    
    newPlayerHands.forEach(hand => {
      if (hand.status === 'bust') {
        totalWinnings -= hand.bet;
      } else if (hand.status === 'blackjack') {
        if (dealerScore === 21) {
          // Push for blackjack vs blackjack
        } else {
          totalWinnings += Math.floor(hand.bet * 1.5);
        }
      } else {
        if (dealerScore > 21) {
          totalWinnings += hand.bet;
        } else if (hand.score > dealerScore) {
          totalWinnings += hand.bet;
        } else if (hand.score < dealerScore) {
          totalWinnings -= hand.bet;
        }
        // Push for tie
      }
    });
    
    setChips(prev => prev + totalWinnings);
    
    let gameStatus: GameState['gameStatus'] = 'playing';
    if (dealerScore > 21) {
      gameStatus = 'dealer-bust';
    } else if (totalWinnings > 0) {
      gameStatus = 'player-win';
    } else if (totalWinnings < 0) {
      gameStatus = 'dealer-win';
    } else {
      gameStatus = 'push';
    }
    
    setGameState(prev => ({
      ...prev,
      deck: newDeck,
      dealerHand: newDealerHand,
      dealerScore,
      gameStatus,
      dealerRevealed: true,
    }));
  };

  const split = () => {
    if (gameState.gameStatus !== 'playing') return;
    
    const currentHand = gameState.playerHands[gameState.currentHandIndex];
    if (currentHand.cards.length !== 2) return;
    if (currentHand.cards[0].rank !== currentHand.cards[1].rank) return;
    if (chips < currentHand.bet) return;
    
    // Special rule: Aces can only be split once and receive only one card each
    const isAces = currentHand.cards[0].rank === 'A';
    
    const newDeck = [...gameState.deck];
    const newPlayerHands = [...gameState.playerHands];
    
    // Remove current hand and create two new hands
    newPlayerHands.splice(gameState.currentHandIndex, 1);
    
    const card1 = currentHand.cards[0];
    const card2 = currentHand.cards[1];
    
    let hand1: Hand;
    let hand2: Hand;
    
    if (isAces) {
      // Aces get only one card each and automatically stand
      const newCard1 = newDeck.pop()!;
      const newCard2 = newDeck.pop()!;
      
      hand1 = {
        cards: [card1, newCard1],
        score: calculateScore([card1, newCard1]),
        bet: currentHand.bet,
        status: 'stand' // Aces automatically stand after split
      };
      
      hand2 = {
        cards: [card2, newCard2],
        score: calculateScore([card2, newCard2]),
        bet: currentHand.bet,
        status: 'stand' // Aces automatically stand after split
      };
    } else {
      // Other cards can be played normally
      const newCard1 = newDeck.pop()!;
      const newCard2 = newDeck.pop()!;
      
      hand1 = {
        cards: [card1, newCard1],
        score: calculateScore([card1, newCard1]),
        bet: currentHand.bet,
        status: calculateScore([card1, newCard1]) === 21 ? 'blackjack' : 'playing'
      };
      
      hand2 = {
        cards: [card2, newCard2],
        score: calculateScore([card2, newCard2]),
        bet: currentHand.bet,
        status: calculateScore([card2, newCard2]) === 21 ? 'blackjack' : 'playing'
      };
    }
    
    newPlayerHands.splice(gameState.currentHandIndex, 0, hand1, hand2);
    
    setChips(prev => prev - currentHand.bet);
    
    // Check if we need to end the game immediately (for Aces or double blackjacks)
    if (isAces) {
      // For split Aces, immediately go to dealer turn
      setTimeout(() => stand(), 1000); // Small delay to show the split hands
      return;
    }
    
    // Check if either hand got blackjack
    const hand1Blackjack = hand1.status === 'blackjack';
    const hand2Blackjack = hand2.status === 'blackjack';
    
    let nextGameStatus: GameState['gameStatus'] = 'playing';
    let nextIndex = gameState.currentHandIndex;
    
    // If both hands have blackjack, end the game immediately
    if (hand1Blackjack && hand2Blackjack) {
      // Calculate results for both blackjack hands
      const dealerFullScore = calculateScore(gameState.dealerHand);
      let totalWinnings = 0;
      
      if (dealerFullScore === 21) {
        // Both push
        totalWinnings = 0;
        nextGameStatus = 'push';
      } else {
        // Both win with 3:2 payout
        totalWinnings = Math.floor(hand1.bet * 1.5) + Math.floor(hand2.bet * 1.5);
        nextGameStatus = 'player-win';
      }
      
      setChips(prev => prev + totalWinnings);
      
      setGameState(prev => ({
        ...prev,
        deck: newDeck,
        playerHands: newPlayerHands,
        gameStatus: nextGameStatus,
        dealerRevealed: true,
        currentHandIndex: 0,
      }));
      return;
    }
    
    // If first hand has blackjack, move to second hand
    if (hand1Blackjack) {
      nextIndex = gameState.currentHandIndex + 1;
    }
    
    // If second hand has blackjack and first doesn't, stay on first hand
    if (hand2Blackjack && !hand1Blackjack) {
      nextIndex = gameState.currentHandIndex;
    }
    
    setGameState(prev => ({
      ...prev,
      deck: newDeck,
      playerHands: newPlayerHands,
      currentHandIndex: nextIndex,
    }));
  };

  const doubleDown = () => {
    if (gameState.gameStatus !== 'playing') return;
    
    const currentHand = gameState.playerHands[gameState.currentHandIndex];
    if (currentHand.cards.length !== 2) return;
    if (chips < currentHand.bet) return;
    
    const newDeck = [...gameState.deck];
    const newPlayerHands = [...gameState.playerHands];
    const newCurrentHand = { 
      ...currentHand, 
      cards: [...currentHand.cards, newDeck.pop()!],
      bet: currentHand.bet * 2
    };
    
    const newScore = calculateScore(newCurrentHand.cards);
    newCurrentHand.score = newScore;
    newCurrentHand.status = newScore > 21 ? 'bust' : 'stand';
    
    newPlayerHands[gameState.currentHandIndex] = newCurrentHand;
    
    setChips(prev => prev - currentHand.bet);
    
    // Check if all hands are finished
    const allHandsFinished = newPlayerHands.every(hand => hand.status !== 'playing');
    if (allHandsFinished) {
      stand();
    } else {
      // Move to next playing hand
      let nextIndex = gameState.currentHandIndex;
      do {
        nextIndex = (nextIndex + 1) % newPlayerHands.length;
      } while (newPlayerHands[nextIndex].status !== 'playing' && nextIndex !== gameState.currentHandIndex);
      
      setGameState(prev => ({
        ...prev,
        deck: newDeck,
        playerHands: newPlayerHands,
        currentHandIndex: nextIndex,
      }));
    }
  };

  const placeBet = (amount: number) => {
    if (amount <= chips && amount > 0) {
      setBetAmount(amount);
    }
  };

  const canSplit = () => {
    if (gameState.gameStatus !== 'playing') return { canSplit: false, reason: '' };
    const currentHand = gameState.playerHands[gameState.currentHandIndex];
    
    if (currentHand.cards.length !== 2) {
      return { canSplit: false, reason: 'Need exactly 2 cards to split' };
    }
    
    if (currentHand.cards[0].rank !== currentHand.cards[1].rank) {
      return { canSplit: false, reason: 'Cards must be the same rank to split' };
    }
    
    if (chips < currentHand.bet) {
      return { canSplit: false, reason: `Need $${currentHand.bet} more chips to split` };
    }
    
    const isAces = currentHand.cards[0].rank === 'A';
    if (isAces) {
      return { canSplit: true, reason: 'Aces: Split to get two hands with one card each' };
    }
    
    return { canSplit: true, reason: '' };
  };

  const canDoubleDown = () => {
    if (gameState.gameStatus !== 'playing') return false;
    const currentHand = gameState.playerHands[gameState.currentHandIndex];
    return currentHand.cards.length === 2 && chips >= currentHand.bet;
  };

  const getStatusMessage = () => {
    switch (gameState.gameStatus) {
      case 'player-bust': return 'Player Bust! You lose!';
      case 'dealer-bust': return 'Dealer Bust! You win!';
      case 'player-win': return 'You Win!';
      case 'dealer-win': return 'Dealer Wins!';
      case 'push': return 'Push! It\'s a tie!';
      default: return '';
    }
  };

  const getStatusColor = () => {
    switch (gameState.gameStatus) {
      case 'player-bust':
      case 'dealer-win': return 'bg-red-100 text-red-800';
      case 'dealer-bust':
      case 'player-win': return 'bg-green-100 text-green-800';
      case 'push': return 'bg-yellow-100 text-yellow-800';
      default: return '';
    }
  };

  const renderHand = (hand: Hand, index: number, isCurrent: boolean) => {
    const canSplitHand = hand.cards.length === 2 && 
                         hand.cards[0].rank === hand.cards[1].rank &&
                         gameState.gameStatus === 'playing' &&
                         isCurrent &&
                         chips >= hand.bet;
    
    const isAces = canSplitHand && hand.cards[0].rank === 'A';
    
    return (
      <Card className={`bg-white/95 backdrop-blur-sm ${isCurrent ? 'ring-2 ring-yellow-400' : ''} ${canSplitHand ? 'ring-2 ring-orange-400' : ''}`}>
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            Hand {index + 1}
            {hand.status === 'blackjack' && <Badge className="bg-purple-600">Blackjack!</Badge>}
            {hand.status === 'bust' && <Badge className="bg-red-600">Bust</Badge>}
            {hand.status === 'stand' && <Badge className="bg-blue-600">Stand</Badge>}
            {canSplitHand && (
              <Badge className={`${isAces ? 'bg-red-600' : 'bg-orange-600'} animate-pulse`}>
                {isAces ? 'Split Aces!' : 'Can Split!'}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-center">
            Score: {hand.score} | Bet: ${hand.bet}
            {canSplitHand && (
              <div className={`${isAces ? 'text-red-600' : 'text-orange-600'} text-xs mt-1`}>
                {isAces ? 'Split Aces: One card each, auto-stand' : `Split available: $${hand.bet} additional bet`}
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-2 flex-wrap">
            {hand.cards.map((card, cardIndex) => (
              <div
                key={cardIndex}
                className={`w-16 h-24 border-2 rounded-lg flex flex-col items-center justify-center font-bold text-lg shadow-md bg-white ${
                  canSplitHand ? `border-${isAces ? 'red' : 'orange'}-400` : 'border-gray-300'
                }`}
              >
                <div className={getCardColor(card.suit)}>
                  {card.rank}
                </div>
                <div className={getCardColor(card.suit)}>
                  {getCardSymbol(card.suit)}
                </div>
              </div>
            ))}
          </div>
          {canSplitHand && (
            <div className="text-center mt-2">
              <p className={`text-xs font-semibold ${isAces ? 'text-red-600' : 'text-orange-600'}`}>
                {isAces 
                  ? 'Split Aces get one card each and automatically stand!' 
                  : `Matching ${hand.cards[0].rank}s - Click Split to separate!`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Blackjack</h1>
          <div className="flex justify-center items-center gap-4 text-white">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <span className="font-semibold">Chips:</span> ${chips}
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <span className="font-semibold">Current Bet:</span> ${betAmount}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-center">Dealer</CardTitle>
              <CardDescription className="text-center">
                Score: {gameState.dealerRevealed ? gameState.dealerScore : gameState.dealerScore > 0 ? gameState.dealerScore : '?'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-2 flex-wrap">
                {gameState.dealerHand.map((card, index) => (
                  <div
                    key={index}
                    className={`w-16 h-24 border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center font-bold text-lg shadow-md ${
                      !gameState.dealerRevealed && index === 1 ? 'bg-blue-600' : 'bg-white'
                    }`}
                  >
                    {!gameState.dealerRevealed && index === 1 ? (
                      <div className="text-white">?</div>
                    ) : (
                      <>
                        <div className={getCardColor(card.suit)}>
                          {card.rank}
                        </div>
                        <div className={getCardColor(card.suit)}>
                          {getCardSymbol(card.suit)}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div>
            {gameState.playerHands.map((hand, index) => 
              renderHand(hand, index, index === gameState.currentHandIndex)
            )}
          </div>
        </div>

        {gameState.gameStatus !== 'betting' && gameState.gameStatus !== 'playing' && (
          <div className="text-center mt-6">
            <Badge className={`${getStatusColor()} text-lg px-4 py-2`}>
              {getStatusMessage()}
            </Badge>
          </div>
        )}

        {gameState.gameStatus === 'betting' && (
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <p className="text-white mb-4 font-semibold text-lg">Place Your Bet:</p>
              <div className="flex justify-center items-center gap-4 mb-4">
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(1, Math.min(chips, parseInt(e.target.value) || 1)))}
                  className="w-32 text-center"
                  min="1"
                  max={chips}
                />
                <Button onClick={() => setBetAmount(chips)} className="bg-orange-600 hover:bg-orange-700">
                  All In
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-md mx-auto">
                {[10, 25, 50, 100, 250, 500, 750, 1000].map((amount) => (
                  <Button
                    key={amount}
                    onClick={() => placeBet(amount)}
                    variant={betAmount === amount ? "default" : "outline"}
                    disabled={chips < amount}
                    className={betAmount === amount ? "bg-yellow-600 hover:bg-yellow-700" : "bg-white/90 hover:bg-white"}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>
            <div className="text-center">
              <Button onClick={startNewGame} className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3">
                Deal Cards
              </Button>
            </div>
          </div>
        )}

        {gameState.gameStatus === 'playing' && (
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <p className="text-white mb-2 font-semibold">
                {gameState.playerHands.length > 1 ? `Playing Hand ${gameState.currentHandIndex + 1}` : 'Your Turn'}
              </p>
              {gameState.playerHands.length === 1 && gameState.playerHands[0].cards.length === 2 && (
                <div className="text-sm text-white/80 mb-2">
                  {canSplit().canSplit ? (
                    <span className={`animate-pulse ${canSplit().reason.includes('Aces') ? 'text-red-300' : 'text-yellow-300'}`}>
                      ✓ {canSplit().reason || 'You can split these cards!'}
                    </span>
                  ) : canSplit().reason && (
                    <span className="text-gray-300">{canSplit().reason}</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-center gap-2 flex-wrap">
              <Button
                onClick={hit}
                disabled={gameState.playerHands[gameState.currentHandIndex].status !== 'playing'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Hit
              </Button>
              <Button
                onClick={stand}
                disabled={gameState.playerHands[gameState.currentHandIndex].status !== 'playing'}
                className="bg-red-600 hover:bg-red-700"
              >
                Stand
              </Button>
              <Button
                onClick={doubleDown}
                disabled={!canDoubleDown()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Double Down
              </Button>
              <Button
                onClick={split}
                disabled={!canSplit().canSplit}
                className={`${
                  canSplit().canSplit 
                    ? `${canSplit().reason.includes('Aces') ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'} animate-pulse` 
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                Split
              </Button>
            </div>
          </div>
        )}

        {gameState.gameStatus !== 'betting' && gameState.gameStatus !== 'playing' && (
          <div className="mt-8 text-center">
            <Button onClick={() => setGameState(prev => ({ ...prev, gameStatus: 'betting' }))} className="bg-green-600 hover:bg-green-700">
              New Game
            </Button>
          </div>
        )}

        <div className="mt-8 text-center text-white/80">
          <p className="text-sm mb-2">
            Get as close to 21 as possible without going over. Face cards count as 10, Aces count as 1 or 11.
          </p>
          <p className="text-xs">
            Split pairs when you have two cards of the same rank. Double down to double your bet and receive exactly one more card.
          </p>
        </div>
      </div>
    </div>
  );
}