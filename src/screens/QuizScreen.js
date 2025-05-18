
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  ScrollView,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import words from '../data/words.json';

const QuizScreen = ({ navigation }) => {
  const [quizWords, setQuizWords] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [animation] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [optionsAnim] = useState(new Animated.Value(0));
  
  useEffect(() => {
    // Generate 10 random quiz questions
    generateQuiz();
    
    // Start entrance animation
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(optionsAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  useEffect(() => {
    if (quizWords.length > 0) {
      // Generate answer options for current question
      generateOptions();
    }
  }, [currentQuestionIndex, quizWords]);
  
  const generateQuiz = () => {
    // Shuffle words array
    const shuffled = [...words].sort(() => 0.5 - Math.random());
    
    // Take first 10 words
    const selected = shuffled.slice(0, 10);
    
    setQuizWords(selected);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizCompleted(false);
    setSelectedAnswer(null);
  };
  
  const generateOptions = () => {
    if (!quizWords[currentQuestionIndex]) return;
    
    // Current word is the correct answer
    const correctAnswer = quizWords[currentQuestionIndex];
    
    // Get 3 random wrong answers
    let wrongAnswers = words
      .filter(word => word.id !== correctAnswer.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    // Combine correct and wrong answers, then shuffle
    const options = [correctAnswer, ...wrongAnswers].sort(() => 0.5 - Math.random());
    
    setShuffledOptions(options);
  };
  
  const handleSelectAnswer = (answer) => {
    setSelectedAnswer(answer);
    
    // Check if answer is correct
    const isCorrect = answer.id === quizWords[currentQuestionIndex].id;
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    // Animate progress bar
    Animated.timing(animation, {
      toValue: (currentQuestionIndex + 1) / quizWords.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    // Wait a moment before proceeding to next question
    setTimeout(async () => {
      if (currentQuestionIndex < quizWords.length - 1) {
        // Move to next question
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
      } else {
        // Quiz completed, save the score as a percentage
        const finalScore = score + (isCorrect ? 1 : 0);
        const percentage = Math.round((finalScore / quizWords.length) * 100);
        try {
          await AsyncStorage.setItem('quizScore', percentage.toString());
        } catch (error) {
          console.error('Error saving quiz score:', error);
        }
        setQuizCompleted(true);
      }
    }, 1500);
  };
  
  const restartQuiz = async () => {
    try {
      await AsyncStorage.setItem('quizScore', '0');
    } catch (error) {
      console.error('Error resetting quiz score:', error);
    }
    generateQuiz();
    animation.setValue(0);
  };
  
  if (quizCompleted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#121212', '#1e1e2a']}
          style={styles.background}
        >
          <View style={styles.completionContainer}>
            <Text style={styles.completionTitle}>Quiz Completed!</Text>
            
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>Your Score</Text>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreValue}>{score}</Text>
                <Text style={styles.scoreTotal}>/{quizWords.length}</Text>
              </View>
              <Text style={styles.scorePercentage}>
                {Math.round((score / quizWords.length) * 100)}%
              </Text>
            </View>
            
            <View style={styles.feedbackContainer}>
              {score === quizWords.length && (
                <View style={styles.feedbackBox}>
                  <Ionicons name="trophy" size={30} color="#FFD700" />
                  <Text style={styles.feedbackText}>Perfect score! Excellent job!</Text>
                </View>
              )}
              
              {score >= quizWords.length * 0.7 && score < quizWords.length && (
                <View style={styles.feedbackBox}>
                  <Ionicons name="thumbs-up" size={30} color="#4CAF50" />
                  <Text style={styles.feedbackText}>Great job! Keep it up!</Text>
                </View>
              )}
              
              {score < quizWords.length * 0.7 && (
                <View style={styles.feedbackBox}>
                  <Ionicons name="book" size={30} color="#2196F3" />
                  <Text style={styles.feedbackText}>Good effort! Practice more to improve.</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity style={styles.restartButton} onPress={restartQuiz}>
              <LinearGradient
                colors={['#4158D0', '#C850C0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.restartGradient}
              >
                <Text style={styles.restartText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.restartButton, styles.backButton]}
              onPress={() => navigation.navigate('Home')}
            >
              <LinearGradient
                colors={['#555', '#333']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.restartGradient}
              >
                <Text style={styles.restartText}>Back to Home</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#121212', '#1e1e2a']}
        style={styles.background}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              Question {currentQuestionIndex + 1} of {quizWords.length}
            </Text>
          </View>
          
          <Text style={styles.headerText}>Vocabulary Quiz</Text>
        </Animated.View>
        
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
            <Text style={styles.questionLabel}>What is the meaning of:</Text>
            <Text style={styles.questionWord}>
              {quizWords[currentQuestionIndex]?.word}
            </Text>
            <View style={styles.wordDetails}>
              <Text style={styles.wordType}>
                {quizWords[currentQuestionIndex]?.partOfSpeech}
              </Text>
              <Text style={styles.wordPronunciation}>
                /{quizWords[currentQuestionIndex]?.pronunciation}/
              </Text>
            </View>
          </Animated.View>
          
          <Animated.View style={{ opacity: optionsAnim }}>
            {shuffledOptions.map((option, index) => {
              const isSelected = selectedAnswer && selectedAnswer.id === option.id;
              const isCorrect = quizWords[currentQuestionIndex].id === option.id;
              
              let optionStyle = styles.optionButton;
              let gradientColors = ['#2a2a3a', '#1a1a2a'];
              
              if (isSelected) {
                if (isCorrect) {
                  gradientColors = ['#43A047', '#2E7D32'];
                  optionStyle = [styles.optionButton, styles.correctOption];
                } else {
                  gradientColors = ['#E53935', '#C62828'];
                  optionStyle = [styles.optionButton, styles.incorrectOption];
                }
              }
              
              if (selectedAnswer && isCorrect && !isSelected) {
                gradientColors = ['#43A047', '#2E7D32'];
                optionStyle = [styles.optionButton, styles.correctOption];
              }
              
              return (
                <TouchableOpacity
                  key={option.id}
                  style={optionStyle}
                  onPress={() => !selectedAnswer && handleSelectAnswer(option)}
                  disabled={selectedAnswer !== null}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={gradientColors}
                    style={styles.optionGradient}
                  >
                    <Text style={styles.optionText}>{option.meaning}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
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
  header: {
    padding: 20,
    paddingTop: 10,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#C850C0',
    borderRadius: 4,
  },
  progressText: {
    color: '#aaa',
    fontSize: 14,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 10,
  },
  questionContainer: {
    marginBottom: 30,
  },
  questionLabel: {
    fontSize: 16,
    color: '#bbb',
    marginBottom: 10,
  },
  questionWord: {
    fontSize: 38,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  wordDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordType: {
    fontSize: 16,
    color: '#C850C0',
    marginRight: 15,
    fontStyle: 'italic',
  },
  wordPronunciation: {
    fontSize: 16,
    color: '#999',
  },
  optionButton: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionGradient: {
    padding: 20,
  },
  optionText: {
    fontSize: 16,
    color: 'white',
    lineHeight: 24,
  },
  correctOption: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  incorrectOption: {
    borderWidth: 2,
    borderColor: '#F44336',
  },
  completionContainer: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 40,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  scoreText: {
    fontSize: 18,
    color: '#bbb',
    marginBottom: 15,
  },
  scoreCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(65, 88, 208, 0.2)',
    borderWidth: 5,
    borderColor: '#4158D0',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 15,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  scoreTotal: {
    fontSize: 24,
    color: '#bbb',
    alignSelf: 'flex-end',
    marginBottom: 5,
  },
  scorePercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  feedbackContainer: {
    width: '100%',
    marginBottom: 40,
  },
  feedbackBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 15,
    flex: 1,
  },
  restartButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  restartGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  restartText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 10,
  },
});

export default QuizScreen;