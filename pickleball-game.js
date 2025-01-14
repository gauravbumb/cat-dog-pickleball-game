// Game.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, Animated } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const PADDLE_HEIGHT = 60;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 15;
const PLAYER_TYPES = {
  CAT: 'CAT',
  DOG: 'DOG'
};

const Game = () => {
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState({ cat: 0, dog: 0 });
  const [winner, setWinner] = useState(null);
  
  // Animation values
  const ballPosition = {
    x: new Animated.Value(SCREEN_WIDTH / 2),
    y: new Animated.Value(SCREEN_HEIGHT / 2)
  };
  const [ballDirection, setBallDirection] = useState({ dx: 5, dy: 5 });
  const [catPosition, setCatPosition] = useState(SCREEN_HEIGHT / 2);
  const [dogPosition, setDogPosition] = useState(SCREEN_HEIGHT / 2);

  // Game loop
  useEffect(() => {
    if (gameStarted && !winner) {
      const gameLoop = setInterval(() => {
        updateGameState();
      }, 16); // ~60fps

      return () => clearInterval(gameLoop);
    }
  }, [gameStarted, winner]);

  const updateGameState = () => {
    // Update ball position
    const currentX = ballPosition.x._value;
    const currentY = ballPosition.y._value;
    
    // Check collisions with paddles
    if (checkPaddleCollision(currentX, currentY)) {
      setBallDirection(prev => ({ ...prev, dx: -prev.dx }));
    }
    
    // Check court boundaries
    if (currentY <= 0 || currentY >= SCREEN_HEIGHT) {
      setBallDirection(prev => ({ ...prev, dy: -prev.dy }));
    }
    
    // Score points
    if (currentX <= 0) {
      scorePoint(PLAYER_TYPES.CAT);
    } else if (currentX >= SCREEN_WIDTH) {
      scorePoint(PLAYER_TYPES.DOG);
    }
    
    // Move ball
    ballPosition.x.setValue(currentX + ballDirection.dx);
    ballPosition.y.setValue(currentY + ballDirection.dy);
  };

  const checkPaddleCollision = (x, y) => {
    // Check collision with dog's paddle
    if (x <= PADDLE_WIDTH && 
        y >= dogPosition - PADDLE_HEIGHT/2 && 
        y <= dogPosition + PADDLE_HEIGHT/2) {
      return true;
    }
    
    // Check collision with cat's paddle
    if (x >= SCREEN_WIDTH - PADDLE_WIDTH && 
        y >= catPosition - PADDLE_HEIGHT/2 && 
        y <= catPosition + PADDLE_HEIGHT/2) {
      return true;
    }
    
    return false;
  };

  const scorePoint = (player) => {
    setScore(prev => {
      const newScore = {
        ...prev,
        [player.toLowerCase()]: prev[player.toLowerCase()] + 1
      };
      
      // Check for winner
      if (newScore.cat >= 11 || newScore.dog >= 11) {
        setWinner(player);
        setGameStarted(false);
      }
      
      return newScore;
    });
    
    // Reset ball
    resetBall();
  };

  const resetBall = () => {
    ballPosition.x.setValue(SCREEN_WIDTH / 2);
    ballPosition.y.setValue(SCREEN_HEIGHT / 2);
    setBallDirection({ dx: 5 * (Math.random() > 0.5 ? 1 : -1), dy: 5 * (Math.random() > 0.5 ? 1 : -1) });
  };

  const movePaddle = (player, y) => {
    if (player === PLAYER_TYPES.CAT) {
      setCatPosition(y);
    } else {
      setDogPosition(y);
    }
  };

  const startNewGame = () => {
    setScore({ cat: 0, dog: 0 });
    setWinner(null);
    resetBall();
    setGameStarted(true);
  };

  return (
    <View style={styles.container}>
      {/* Score Display */}
      <View style={styles.scoreBoard}>
        <Text style={styles.scoreText}>Dog: {score.dog}</Text>
        <Text style={styles.scoreText}>Cat: {score.cat}</Text>
      </View>

      {/* Game Court */}
      <View style={styles.court}>
        {/* Dog Paddle */}
        <TouchableOpacity
          style={[styles.paddle, { left: 0, top: dogPosition - PADDLE_HEIGHT/2 }]}
          onPress={() => movePaddle(PLAYER_TYPES.DOG, dogPosition)}
        >
          <View style={styles.dogPaddle} />
        </TouchableOpacity>

        {/* Cat Paddle */}
        <TouchableOpacity
          style={[styles.paddle, { right: 0, top: catPosition - PADDLE_HEIGHT/2 }]}
          onPress={() => movePaddle(PLAYER_TYPES.CAT, catPosition)}
        >
          <View style={styles.catPaddle} />
        </TouchableOpacity>

        {/* Ball */}
        <Animated.View
          style={[
            styles.ball,
            {
              transform: [
                { translateX: ballPosition.x },
                { translateY: ballPosition.y }
              ]
            }
          ]}
        />
      </View>

      {/* Game Controls */}
      {!gameStarted && (
        <TouchableOpacity style={styles.startButton} onPress={startNewGame}>
          <Text style={styles.startButtonText}>
            {winner ? `${winner} Wins! Play Again` : 'Start Game'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a5d6a7',
  },
  court: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'white',
  },
  scoreBoard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  paddle: {
    position: 'absolute',
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dogPaddle: {
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    backgroundColor: '#8B4513',
    borderRadius: 5,
  },
  catPaddle: {
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    backgroundColor: '#808080',
    borderRadius: 5,
  },
  ball: {
    position: 'absolute',
    width: BALL_SIZE,
    height: BALL_SIZE,
    backgroundColor: '#ffeb3b',
    borderRadius: BALL_SIZE / 2,
  },
  startButton: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Game;
