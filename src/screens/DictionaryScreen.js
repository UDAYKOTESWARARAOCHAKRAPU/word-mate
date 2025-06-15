import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DictionaryScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredWords, setFilteredWords] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [stats, setStats] = useState({ wordsLearned: 0 });
  const [expandedCards, setExpandedCards] = useState({});
  const [bookmarkedWords, setBookmarkedWords] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Animations
  const searchBarOpacity = useState(new Animated.Value(0))[0];
  const resultsOpacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const initialize = async () => {
      try {
        // Load stats
        const learned = await AsyncStorage.getItem('wordsLearned');
        const learnedList = learned ? JSON.parse(learned) : [];
        setStats({
          wordsLearned: Array.isArray(learnedList) ? learnedList.length : 0,
        });

        // Load bookmarks
        const bookmarks = await AsyncStorage.getItem('bookmarks');
        const bookmarkList = bookmarks ? JSON.parse(bookmarks) : [];
        const bookmarkMap = {};
        bookmarkList.forEach((bookmark) => {
          bookmarkMap[bookmark.word] = true;
        });
        setBookmarkedWords(bookmarkMap);

        // Load search history
        const history = await AsyncStorage.getItem('searchHistory');
        const historyList = history ? JSON.parse(history) : [];
        setSearchHistory(historyList);
      } catch (error) {
        console.error('Error loading stats, bookmarks, or history:', error);
      }

      // Start animations
      Animated.parallel([
        Animated.timing(searchBarOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(resultsOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    };
    initialize();
  }, []);

  const fetchWordData = async (word) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (!response.ok) {
        throw new Error('Word not found');
      }
      const data = await response.json();
      // Map API response to match words.json structure
      const mappedWords = data.map((entry) => ({
        word: entry.word,
        partOfSpeech: entry.meanings[0]?.partOfSpeech || 'unknown',
        pronunciation: entry.phonetic || entry.phonetics[0]?.text || 'N/A',
        meaning: entry.meanings[0]?.definitions[0]?.definition || 'No definition available',
        example: entry.meanings[0]?.definitions[0]?.example || null,
      }));
      setFilteredWords(mappedWords);

      // Update search history
      try {
        const history = await AsyncStorage.getItem('searchHistory');
        let historyList = history ? JSON.parse(history) : [];
        const searchedWord = word.toLowerCase();
        if (!historyList.includes(searchedWord)) {
          historyList = [searchedWord, ...historyList].slice(0, 10); // Keep latest 10 entries
          await AsyncStorage.setItem('searchHistory', JSON.stringify(historyList));
          setSearchHistory(historyList);
        }
      } catch (error) {
        console.error('Error updating search history:', error);
      }
    } catch (err) {
      setError(err.message);
      setFilteredWords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch word data when search query changes
    if (searchQuery.trim() === '') {
      setFilteredWords([]);
      setError(null);
    } else {
      const timeoutId = setTimeout(() => {
        fetchWordData(searchQuery.trim());
      }, 500); // Debounce API calls
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery]);

  const speakWord = async (word) => {
    try {
      Speech.speak(word.word, { language: 'en-US' });

      // Update learned words
      const learnedWords = await AsyncStorage.getItem('wordsLearned');
      let learnedList = learnedWords ? JSON.parse(learnedWords) : [];

      if (!learnedList.includes(word.word)) {
        learnedList.push(word.word);
        await AsyncStorage.setItem('wordsLearned', JSON.stringify(learnedList));
        setStats((prevStats) => ({
          ...prevStats,
          wordsLearned: learnedList.length,
        }));
      }
    } catch (error) {
      console.error('Error with speech:', error);
      Alert.alert('Speech Error', 'Text-to-speech is not available on this device.');
    }
  };

  const toggleBookmark = async (word) => {
    try {
      const bookmarks = await AsyncStorage.getItem('bookmarks');
      let bookmarkList = bookmarks ? JSON.parse(bookmarks) : [];

      const isBookmarked = bookmarkList.some((b) => b.word === word.word);
      if (isBookmarked) {
        bookmarkList = bookmarkList.filter((b) => b.word !== word.word);
        setBookmarkedWords((prev) => ({ ...prev, [word.word]: false }));
      } else {
        bookmarkList.push(word);
        setBookmarkedWords((prev) => ({ ...prev, [word.word]: true }));
      }

      await AsyncStorage.setItem('bookmarks', JSON.stringify(bookmarkList));
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      Alert.alert('Error', 'Failed to toggle bookmark. Please try again.');
    }
  };

  const toggleCardExpansion = (index) => {
    setExpandedCards((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleHistoryPress = (word) => {
    setSearchQuery(word); // Set search query to the selected history item
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.searchContainer, { opacity: searchBarOpacity }]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a word..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        <Ionicons
          name="search"
          size={24}
          color="rgba(255,255,255,0.7)"
          style={styles.searchIcon}
        />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: resultsOpacity }}>
          {searchQuery.trim() === '' && searchHistory.length > 0 && (
            <View style={styles.historyContainer}>
              <Text style={styles.historyTitle}>Search History</Text>
              <View style={styles.historyList}>
                {searchHistory.map((word, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.historyItem}
                    onPress={() => handleHistoryPress(word)}
                  >
                    <Text style={styles.historyText}>{word}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {searchQuery.trim() === '' && searchHistory.length === 0 && (
            <Text style={styles.infoText}>Enter a word to search</Text>
          )}

          {isLoading && (
            <Text style={styles.infoText}>Loading...</Text>
          )}

          {error && (
            <Text style={styles.infoText}>{error}</Text>
          )}

          {filteredWords.map((word, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.9}
              onPress={() => toggleCardExpansion(index)}
              style={styles.cardWrapper}
            >
              <LinearGradient
                colors={['#4158D0', '#C850C0', '#FFCC70']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBorder}
              >
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.word}>{word.word}</Text>
                    <View style={styles.headerIcons}>
                      <TouchableOpacity
                        style={styles.speakerIcon}
                        onPress={() => speakWord(word)}
                      >
                        <Ionicons name="volume-medium" size={20} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.bookmarkIcon}
                        onPress={() => toggleBookmark(word)}
                      >
                        <Ionicons
                          name={bookmarkedWords[word.word] ? 'bookmark' : 'bookmark-outline'}
                          size={20}
                          color={bookmarkedWords[word.word] ? '#FFCC70' : '#fff'}
                        />
                      </TouchableOpacity>
                      <Ionicons
                        name={expandedCards[index] ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#fff"
                        style={styles.expandIcon}
                      />
                    </View>
                  </View>

                  {expandedCards[index] && (
                    <>
                      <View style={styles.detailsRow}>
                        <Text style={styles.partOfSpeech}>{word.partOfSpeech}</Text>
                        <Text style={styles.pronunciation}>/{word.pronunciation}/</Text>
                      </View>
                      <View style={styles.divider} />
                      <Text style={styles.meaning}>{word.meaning}</Text>
                      {word.example && (
                        <View style={styles.exampleContainer}>
                          <Text style={styles.exampleLabel}>EXAMPLE</Text>
                          <Text style={styles.example}>"{word.example}"</Text>
                        </View>
                      )}
                      <View style={styles.tagsContainer}>
                        <View style={styles.tag}>
                          <Text style={styles.tagText}>Advanced</Text>
                        </View>
                        <View style={styles.tag}>
                          <Text style={styles.tagText}>{word.partOfSpeech}</Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </Animated.View>
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  searchIcon: {
    marginLeft: 8,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  historyContainer: {
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  historyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  historyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  historyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  infoText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 24,
  },
  cardWrapper: {
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradientBorder: {
    borderRadius: 16,
    padding: 2,
  },
  card: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  word: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speakerIcon: {
    padding: 6,
    marginRight: 8,
  },
  bookmarkIcon: {
    padding: 6,
    marginRight: 8,
  },
  expandIcon: {
    padding: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  partOfSpeech: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#C850C0',
    marginRight: 8,
    fontWeight: '600',
  },
  pronunciation: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 12,
  },
  meaning: {
    fontSize: 16,
    lineHeight: 24,
    color: '#fff',
    fontWeight: '400',
    marginBottom: 12,
  },
  exampleContainer: {
    backgroundColor: 'rgba(65, 88, 208, 0.3)',
    padding: 16,
    borderRadius: 12,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 40,
  },
});

export default DictionaryScreen;