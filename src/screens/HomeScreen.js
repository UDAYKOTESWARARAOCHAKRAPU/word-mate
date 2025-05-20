import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  ImageBackground,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import words from '../data/words.json';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [wordOfTheDay, setWordOfTheDay] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [showFullMeaning, setShowFullMeaning] = useState(false);
  const [stats, setStats] = useState({
    wordsLearned: 0,
    streak: 0,
    quizScore: 0,
  });

  // Animations
  const cardScale = useState(new Animated.Value(0.95))[0];
  const cardOpacity = useState(new Animated.Value(0))[0];
  const titleOpacity = useState(new Animated.Value(0))[0];
  const statsOpacity = useState(new Animated.Value(0))[0];
  const actionsOpacity = useState(new Animated.Value(0))[0];
  const wordsLearnedScale = useState(new Animated.Value(1))[0];
  const streakScale = useState(new Animated.Value(1))[0];
  const quizScoreScale = useState(new Animated.Value(1))[0];

  const animateStat = (scaleAnim) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    const initialize = async () => {
      // Load stats
      try {
        const learned = await AsyncStorage.getItem('wordsLearned');
        const streak = await AsyncStorage.getItem('streak');
        const quizScore = await AsyncStorage.getItem('quizScore');
        const learnedList = learned ? JSON.parse(learned) : [];
        setStats({
          wordsLearned: Array.isArray(learnedList) ? learnedList.length : 0,
          streak: streak ? parseInt(streak) : 0,
          quizScore: quizScore ? parseInt(quizScore) : 0,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      }

      // Start animations
      Animated.sequence([
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(statsOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(actionsOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    };
    initialize();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const loadWordOfTheDay = async () => {
        try {
          // Select a new random word every time the screen is focused
          const randomWord = words[Math.floor(Math.random() * words.length)];
          setWordOfTheDay(randomWord);

          // Store the new word in AsyncStorage (optional, if you want to persist it during the session)
          await AsyncStorage.setItem('wordOfDay', JSON.stringify(randomWord));

          // Update streak
          const today = new Date().toDateString();
          const lastStreakDate = await AsyncStorage.getItem('lastStreakDate');
          const currentStreak = await AsyncStorage.getItem('streak');
          let streak = currentStreak ? parseInt(currentStreak) : 0;

          if (lastStreakDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastStreakDate === yesterday.toDateString()) {
              streak += 1;
            } else {
              streak = 1;
            }
            await AsyncStorage.setItem('streak', streak.toString());
            await AsyncStorage.setItem('lastStreakDate', today);
            setStats((prevStats) => ({
              ...prevStats,
              streak,
            }));
          }
        } catch (error) {
          console.error('Error loading word of day:', error);
          Alert.alert('Error', 'Failed to load Word of the Day. Please try again.');
        }
      };
      loadWordOfTheDay();
    }, [])
  );

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      try {
        const bookmarks = await AsyncStorage.getItem('bookmarks');
        const bookmarkList = bookmarks ? JSON.parse(bookmarks) : [];
        const isBookmarked = bookmarkList.some((b) => b.word === wordOfTheDay?.word);
        setBookmarked(isBookmarked);
      } catch (error) {
        console.error('Error checking bookmark status:', error);
      }
    };
    if (wordOfTheDay) checkBookmarkStatus();
  }, [wordOfTheDay]);

  useFocusEffect(
    React.useCallback(() => {
      const loadStats = async () => {
        try {
          const learned = await AsyncStorage.getItem('wordsLearned');
          const streak = await AsyncStorage.getItem('streak');
          const quizScore = await AsyncStorage.getItem('quizScore');
          const learnedList = learned ? JSON.parse(learned) : [];
          const newStats = {
            wordsLearned: Array.isArray(learnedList) ? learnedList.length : 0,
            streak: streak ? parseInt(streak) : 0,
            quizScore: quizScore ? parseInt(quizScore) : 0,
          };

          setStats((prevStats) => {
            if (prevStats.quizScore !== newStats.quizScore) {
              animateStat(quizScoreScale);
            }
            return newStats;
          });
        } catch (error) {
          console.error('Error loading stats on focus:', error);
        }
      };
      loadStats();
    }, [])
  );

  const toggleBookmark = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const bookmarks = await AsyncStorage.getItem('bookmarks');
      let bookmarkList = bookmarks ? JSON.parse(bookmarks) : [];

      if (bookmarked) {
        bookmarkList = bookmarkList.filter((b) => b.word !== wordOfTheDay.word);
      } else {
        bookmarkList.push(wordOfTheDay);
      }

      await AsyncStorage.setItem('bookmarks', JSON.stringify(bookmarkList));
      setBookmarked(!bookmarked);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      Alert.alert('Error', 'Failed to toggle bookmark. Please try again.');
    }
  };

  const handleActionPress = (screenName) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.log('Haptics not available');
    }
    navigation.navigate(screenName);
  };

  if (!wordOfTheDay) return <Text style={styles.errorText}>Loading...</Text>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ImageBackground
        source={{ uri: 'https://i.imgur.com/stWYOfE.jpg' }}
        style={styles.container}
        imageStyle={styles.backgroundImage}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
          style={styles.overlay}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: titleOpacity }}>
            <Text style={styles.title}>WordMate</Text>
            <Text style={styles.subtitle}>Expand Your Vocabulary</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.cardWrapper,
              {
                opacity: cardOpacity,
                transform: [{ scale: cardScale }],
              },
            ]}
          >
            <LinearGradient
              colors={['#4158D0', '#C850C0', '#FFCC70']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBorder}
            >
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>WORD OF THE DAY</Text>
                    <Text style={styles.word}>{wordOfTheDay.word}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.bookmarkButton}
                    onPress={toggleBookmark}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                      size={26}
                      color={bookmarked ? '#FFCC70' : '#fff'}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.pronounceRow}>
                  <Text style={styles.partOfSpeech}>{wordOfTheDay.partOfSpeech}</Text>
                  <Text style={styles.pronunciation}>/{wordOfTheDay.pronunciation}/</Text>
                  <TouchableOpacity
                    style={styles.speakerIcon}
                    onPress={async () => {
                      try {
                        Speech.speak(wordOfTheDay.word, { language: 'en-US' });

                        const learnedWords = await AsyncStorage.getItem('wordsLearned');
                        let learnedList = learnedWords ? JSON.parse(learnedWords) : [];

                        if (!learnedList.includes(wordOfTheDay.word)) {
                          learnedList.push(wordOfTheDay.word);
                          await AsyncStorage.setItem('wordsLearned', JSON.stringify(learnedList));

                          setStats((prevStats) => ({
                            ...prevStats,
                            wordsLearned: learnedList.length,
                          }));
                          animateStat(wordsLearnedScale);
                        }
                      } catch (error) {
                        console.error('Error with speech:', error);
                        Alert.alert('Speech Error', 'Text-to-speech is not available on this device.');
                      }
                    }}
                  >
                    <Ionicons name="volume-medium" size={18} color="#c4c4c4" />
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                <TouchableOpacity
                  onPress={() => {
                    setShowFullMeaning(!showFullMeaning);
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch (error) {
                      console.log('Haptics not available');
                    }
                  }}
                  activeOpacity={0.9}
                  style={styles.meaningContainer}
                >
                  <Text
                    style={styles.meaning}
                    numberOfLines={showFullMeaning ? 0 : 3}
                  >
                    {wordOfTheDay.meaning}
                  </Text>

                  {!showFullMeaning && wordOfTheDay.meaning.length > 120 && (
                    <Text style={styles.readMore}>Read more</Text>
                  )}
                </TouchableOpacity>

                {wordOfTheDay.example && (
                  <View style={styles.exampleContainer}>
                    <Text style={styles.exampleLabel}>EXAMPLE</Text>
                    <Text style={styles.example}>"{wordOfTheDay.example}"</Text>
                  </View>
                )}

                <View style={styles.tagsContainer}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>Advanced</Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{wordOfTheDay.partOfSpeech}</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View style={[styles.statsContainer, { opacity: statsOpacity }]}>
            <Text style={styles.statsTitle}>Your Progress</Text>
            <View style={styles.statsGrid}>
              <Animated.View
                style={[styles.statBox, { transform: [{ scale: wordsLearnedScale }] }]}
              >
                <Text style={styles.statNumber}>{stats.wordsLearned}</Text>
                <Text style={styles.statLabel}>Words Learned</Text>
              </Animated.View>
              <Animated.View
                style={[styles.statBox, { transform: [{ scale: streakScale }] }]}
              >
                <Text style={styles.statNumber}>{stats.streak}</Text>
                <Text style={styles.statLabel}>Days Streak</Text>
              </Animated.View>
              <Animated.View
                style={[styles.statBox, { transform: [{ scale: quizScoreScale }] }]}
              >
                <Text style={styles.statNumber}>
                  {stats.quizScore}
                  <Text style={styles.percentage}>%</Text>
                </Text>
                <Text style={styles.statLabel}>Quiz Score</Text>
              </Animated.View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.actionsContainer, { opacity: actionsOpacity }]}>
            <View style={styles.actionsTitleContainer}>
              <Text style={styles.actionsTitle}>Quick Actions</Text>
              <View style={styles.actionsTitleLine} />
            </View>

            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleActionPress('Flashcards')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4158D0', '#3672E0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionGradient}
                >
                  <Ionicons name="card-outline" size={28} color="#fff" />
                </LinearGradient>
                <Text style={styles.actionText}>Flashcards</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleActionPress('Quiz')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#C850C0', '#B84DB3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionGradient}
                >
                  <Ionicons name="help-circle-outline" size={28} color="#fff" />
                </LinearGradient>
                <Text style={styles.actionText}>Quiz</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleActionPress('Bookmarks')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FFCC70', '#FFC055']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionGradient}
                >
                  <Ionicons name="bookmark-outline" size={28} color="#fff" />
                </LinearGradient>
                <Text style={styles.actionText}>Bookmarks</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContent: {
    paddingTop: StatusBar.currentHeight + 30 || 60,
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  settingsButton: {
    position: 'absolute',
    top: StatusBar.currentHeight + 10 || 40,
    right: 20,
    zIndex: 100,
    elevation: 10,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  settingsGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 30,
  },
  cardWrapper: {
    borderRadius: 24,
    marginBottom: 25,
    shadowColor: '#6C63FF',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 13,
    elevation: 16,
  },
  gradientBorder: {
    borderRadius: 24,
    padding: 2,
  },
  card: {
    padding: 24,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#C850C0',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  word: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bookmarkButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  pronounceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  partOfSpeech: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#C850C0',
    marginRight: 12,
    fontWeight: '600',
  },
  pronunciation: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginRight: 8,
  },
  speakerIcon: {
    padding: 3,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 18,
  },
  meaningContainer: {
    marginBottom: 18,
  },
  meaning: {
    fontSize: 18,
    lineHeight: 28,
    color: '#fff',
    fontWeight: '400',
  },
  readMore: {
    color: '#C850C0',
    fontSize: 14,
    marginTop: 5,
    alignSelf: 'flex-end',
    fontWeight: '600',
  },
  exampleContainer: {
    backgroundColor: 'rgba(65, 88, 208, 0.3)',
    padding: 16,
    borderRadius: 12,
    marginTop: 5,
    marginBottom: 18,
    borderLeftWidth: 3,
    borderLeftColor: '#4158D0',
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  example: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#fff',
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 50,
    marginRight: 8,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '31%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  percentage: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 30,
  },
  actionsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginRight: 15,
  },
  actionsTitleLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    width: '48%',
    backgroundColor: 'rgba(30, 30, 40, 0.6)',
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  actionGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 40,
  },
});

export default HomeScreen;