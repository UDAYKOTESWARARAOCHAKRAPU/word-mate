import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  PanResponder,
  Dimensions,
  StatusBar,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import words from '../data/words.json';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

// Reference dimensions for scaling (iPhone 8)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 667;

// Scale functions
const scale = (size) => (width / guidelineBaseWidth) * size;
const verticalScale = (size) => (height / guidelineBaseHeight) * size;

// Animated Button Component
const AnimatedButton = ({ style, onPress, iconName, iconSize, iconColor }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        <Ionicons name={iconName} size={iconSize} color={iconColor} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const FlashcardsScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [totalCards] = useState(words.length);
  const [knownWords, setKnownWords] = useState(0);
  
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp'
  });
  
  const rotateAndTranslate = {
    transform: [
      { rotate },
      ...position.getTranslateTransform()
    ]
  };
  
  const likeOpacity = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp'
  });
  
  const dislikeOpacity = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [1, 0, 0],
    extrapolate: 'clamp'
  });
  
  const nextCardOpacity = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [1, 0, 1],
    extrapolate: 'clamp'
  });
  
  const nextCardScale = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [1, 0.8, 1],
    extrapolate: 'clamp'
  });
  
  const flipAnimation = useRef(new Animated.Value(0)).current;
  
  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg']
  });
  
  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg']
  });
  
  const frontOpacity = flipAnimation.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0]
  });
  
  const backOpacity = flipAnimation.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1]
  });

  // Calculate card dimensions
  const cardWidth = Math.min(width * 0.9, 400);
  const cardHeight = cardWidth * (3 / 2);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!flipped) {
          position.setValue({ x: gestureState.dx, y: gestureState.dy });
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          swipeRight(gestureState);
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          swipeLeft(gestureState);
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: true
          }).start();
        }
      }
    })
  ).current;

  const swipeRight = async (gestureState) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.log('Haptics not available');
    }

    try {
      const learnedWords = await AsyncStorage.getItem('wordsLearned');
      let learnedList = learnedWords ? JSON.parse(learnedWords) : [];
      const currentWord = words[currentIndex].word;

      if (!learnedList.includes(currentWord)) {
        learnedList.push(currentWord);
        await AsyncStorage.setItem('wordsLearned', JSON.stringify(learnedList));
      }
    } catch (error) {
      console.error('Error saving known word:', error);
    }

    setKnownWords(prevCount => prevCount + 1);
    Animated.timing(position, {
      toValue: { x: width + 100, y: gestureState.dy },
      duration: 300,
      useNativeDriver: true
    }).start(transitionNext);
  };

  const swipeLeft = async (gestureState) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.log('Haptics not available');
    }

    Animated.timing(position, {
      toValue: { x: -width - 100, y: gestureState.dy },
      duration: 300,
      useNativeDriver: true
    }).start(transitionNext);
  };

  const transitionNext = async () => {
    position.setValue({ x: 0, y: 0 });
    setFlipped(false);
    flipAnimation.setValue(0);

    if (currentIndex === totalCards - 1) {
      try {
        const successRate = Math.round((knownWords / totalCards) * 100);
        await AsyncStorage.setItem('flashcardsSuccessRate', successRate.toString());
      } catch (error) {
        console.error('Error saving flashcards success rate:', error);
      }
      setCompleted(true);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const flipCard = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.log('Haptics not available');
    }

    if (flipped) {
      Animated.spring(flipAnimation, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true
      }).start();
    } else {
      Animated.spring(flipAnimation, {
        toValue: 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true
      }).start();
    }
    setFlipped(!flipped);
  };

  const resetSession = async () => {
    try {
      await AsyncStorage.setItem('flashcardsSuccessRate', '0');
    } catch (error) {
      console.error('Error resetting flashcards success rate:', error);
    }
    setCurrentIndex(0);
    setCompleted(false);
    setKnownWords(0);
  };

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
    opacity: frontOpacity
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
    opacity: backOpacity
  };

  if (completed) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#121212', '#1a1a1a']}
          style={styles.background}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.completedContainer}>
              <Ionicons name="checkmark-circle" size={scale(80)} color="#4CAF50" />
              <Text style={styles.completedTitle}>Great job!</Text>
              <Text style={styles.completedText}>
                You've completed all {totalCards} flashcards
              </Text>
              <View style={styles.statsCard}>
                <Text style={styles.statsText}>Words you know: {knownWords}</Text>
                <Text style={styles.statsText}>
                  Success rate: {Math.round((knownWords / totalCards) * 100)}%
                </Text>
              </View>
              <TouchableOpacity style={styles.resetButton} onPress={resetSession}>
                <LinearGradient
                  colors={['#4158D0', '#C850C0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.resetGradient}
                >
                  <Text style={styles.resetText}>Start Again</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.backButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#121212', '#1a1a1a']}
        style={styles.background}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <TouchableOpacity 
                style={styles.backIcon}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={scale(24)} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerText}>Flashcards</Text>
            </View>
            <Text style={styles.progressText}>
              {currentIndex + 1}/{totalCards}
            </Text>
          </View>
          
          <View style={styles.cardsContainer}>
            {currentIndex < totalCards - 1 && (
              <Animated.View
                style={[
                  styles.card,
                  {
                    opacity: nextCardOpacity,
                    transform: [{ scale: nextCardScale }],
                    zIndex: -1
                  }
                ]}
              >
                <LinearGradient
                  colors={['#344a6d', '#263c59']}
                  style={styles.cardGradient}
                >
                  <Text style={styles.wordText}>{words[currentIndex + 1].word}</Text>
                  <Text style={styles.hintText}>Tap to flip</Text>
                </LinearGradient>
              </Animated.View>
            )}
            
            <Animated.View
              {...panResponder.panHandlers}
              style={[styles.card, rotateAndTranslate]}
            >
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={flipCard} 
                style={styles.cardTouchable}
              >
                <Animated.View style={[styles.cardFace, frontAnimatedStyle]}>
                  <LinearGradient
                    colors={['#394989', '#3b5ba5']}
                    style={styles.cardGradient}
                  >
                    <Text style={styles.wordText}>{words[currentIndex].word}</Text>
                    <View style={styles.partOfSpeechContainer}>
                      <Text style={styles.partOfSpeechText}>
                        {words[currentIndex].partOfSpeech}
                      </Text>
                    </View>
                    <Text style={styles.hintText}>Tap to see meaning</Text>
                  </LinearGradient>
                </Animated.View>
                
                <Animated.View style={[styles.cardFace, styles.cardBack, backAnimatedStyle]}>
                  <LinearGradient
                    colors={['#4158D0', '#3c4fa8']}
                    style={styles.cardGradient}
                  >
                    <Text style={styles.meaningTitle}>Meaning:</Text>
                    <Text style={styles.meaningText}>
                      {words[currentIndex].meaning}
                    </Text>
                    
                    {words[currentIndex].example && (
                      <View style={styles.exampleContainer}>
                        <Text style={styles.exampleTitle}>Example:</Text>
                        <Text style={styles.exampleText}>
                          "{words[currentIndex].example}"
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View
              style={[
                styles.overlay,
                styles.likeOverlay,
                { opacity: likeOpacity }
              ]}
            >
              <Text style={styles.overlayText}>KNOW IT</Text>
            </Animated.View>
            
            <Animated.View
              style={[
                styles.overlay,
                styles.dislikeOverlay,
                { opacity: dislikeOpacity }
              ]}
            >
              <Text style={styles.overlayText}>DON'T KNOW</Text>
            </Animated.View>
            
            <View style={[styles.buttonsContainer, { marginTop: cardHeight + scale(20) }]}>
              <AnimatedButton
                style={[styles.button, styles.dislikeButton]}
                onPress={() => swipeLeft({ dx: -SWIPE_THRESHOLD - 1, dy: 0 })}
                iconName="close"
                iconSize={scale(30)}
                iconColor="white"
              />
              
              <AnimatedButton
                style={[styles.button, styles.flipButton]}
                onPress={flipCard}
                iconName="repeat"
                iconSize={scale(26)}
                iconColor="white"
              />
              
              <AnimatedButton
                style={[styles.button, styles.likeButton]}
                onPress={() => swipeRight({ dx: SWIPE_THRESHOLD + 1, dy: 0 })}
                iconName="checkmark"
                iconSize={scale(30)}
                iconColor="white"
              />
            </View>
          </View>
          
          <View style={styles.tipContainer}>
            <Text style={styles.tipText}>
              Click green button if you know the word, Red button if you don't, or tap the card to see the meaning
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: scale(40),
    alignItems: 'center',
  },
  header: {
    padding: scale(15),
    paddingBottom: scale(10),
    width: '100%',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(5),
  },
  backIcon: {
    marginRight: scale(10),
  },
  headerText: {
    color: 'white',
    fontSize: scale(24),
    fontWeight: 'bold',
  },
  progressText: {
    color: '#bbb',
    fontSize: scale(14),
  },
  cardsContainer: {
    alignItems: 'center',
    paddingBottom: scale(20),
    marginTop: scale(30),
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    position: 'absolute',
    width: Math.min(width * 0.9, 400),
    height: Math.min(width * 0.9, 400) * (3 / 2),
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
  cardTouchable: {
    flex: 1,
  },
  cardGradient: {
    flex: 1,
    padding: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFace: {
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    position: 'absolute',
  },
  cardBack: {
    transform: [{ rotateY: '180deg' }],
  },
  wordText: {
    color: 'white',
    fontSize: scale(36),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: scale(15),
  },
  partOfSpeechContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: scale(12),
    paddingVertical: scale(4),
    borderRadius: 50,
    marginBottom: scale(20),
  },
  partOfSpeechText: {
    color: 'white',
    fontSize: scale(14),
    fontStyle: 'italic',
  },
  hintText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: scale(14),
    position: 'absolute',
    bottom: scale(15),
  },
  meaningTitle: {
    color: 'white',
    fontSize: scale(18),
    fontWeight: 'bold',
    marginBottom: scale(10),
    alignSelf: 'flex-start',
  },
  meaningText: {
    color: 'white',
    fontSize: scale(18),
    textAlign: 'center',
    lineHeight: scale(28),
    marginBottom: scale(20),
  },
  exampleContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: scale(12),
    borderRadius: 10,
    alignSelf: 'stretch',
  },
  exampleTitle: {
    color: 'white',
    fontSize: scale(14),
    fontWeight: 'bold',
    marginBottom: scale(5),
  },
  exampleText: {
    color: 'white',
    fontSize: scale(14),
    fontStyle: 'italic',
    lineHeight: scale(20),
  },
  overlay: {
    position: 'absolute',
    padding: 10,
    borderWidth: 4,
    borderRadius: 10,
  },
  likeOverlay: {
    top: scale(40),
    right: scale(30),
    borderColor: '#4CAF50',
    transform: [{ rotate: '20deg' }],
  },
  dislikeOverlay: {
    top: scale(40),
    left: scale(30),
    borderColor: '#F44336',
    transform: [{ rotate: '-20deg' }],
  },
  overlayText: {
    fontSize: scale(24),
    fontWeight: 'bold',
    color: 'white',
  },
  button: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
    marginHorizontal: scale(12),
  },
  dislikeButton: {
    backgroundColor: '#F44336',
  },
  likeButton: {
    backgroundColor: '#4CAF50',
  },
  flipButton: {
    backgroundColor: '#3b5ba5',
  },
  tipContainer: {
    alignItems: 'center',
    paddingHorizontal: scale(40),
    paddingBottom: scale(20),
  },
  tipText: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    fontSize: scale(12),

    marginBottom: scale(15),
  },
  completedContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(25),
  },
  completedTitle: {
    color: 'white',
    fontSize: scale(28),
    fontWeight: 'bold',
    marginVertical: scale(15),
  },
  completedText: {
    color: '#ddd',
    fontSize: scale(16),
    textAlign: 'center',
    marginBottom: scale(25),
  },
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: scale(15),
    borderRadius: 10,
    width: '100%',
    marginBottom: scale(30),
  },
  statsText: {
    color: 'white',
    fontSize: scale(16),
    marginVertical: scale(5),
  },
  resetButton: {
    width: 100,
    borderRadius: 10,
    overflow: 'hidden',
    
  },
  resetGradient: {
    paddingVertical: scale(12),
    alignItems: 'center',
  },
  resetText: {
    color: 'white',
    fontSize: scale(16),
  },
  backButton: {
    marginTop: scale(10),
  },
  backButtonText: {
    color: '#bbb',
    fontSize: scale(14),
  },
});

export default FlashcardsScreen;