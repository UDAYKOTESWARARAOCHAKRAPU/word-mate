import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BookmarksScreen = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    // Load bookmarks from AsyncStorage on mount
    loadBookmarks();

    // Start fade animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);
  // Reload bookmarks when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadBookmarks();
    }, [])
  );

  // Load bookmarks from AsyncStorage
  const loadBookmarks = async () => {
    try {
      const savedBookmarks = await AsyncStorage.getItem('bookmarks');
      const parsedBookmarks = savedBookmarks ? JSON.parse(savedBookmarks) : [];
      setBookmarks(parsedBookmarks);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      Alert.alert('Error', 'Failed to load bookmarks. Please try again.');
    }
  };

  // Remove a single bookmark
  const removeBookmark = (word) => {
    Alert.alert(
      'Remove Bookmark',
      'Are you sure you want to remove this word from your bookmarks?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedBookmarks = bookmarks.filter((item) => item.word !== word);
              setBookmarks(updatedBookmarks);
              await AsyncStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
            } catch (error) {
              console.error('Error removing bookmark:', error);
              Alert.alert('Error', 'Failed to remove bookmark. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Remove multiple selected bookmarks
  const removeSelectedItems = () => {
    if (selectedItems.length === 0) return;

    Alert.alert(
      'Remove Selected',
      `Are you sure you want to remove ${selectedItems.length} word(s) from your bookmarks?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedBookmarks = bookmarks.filter(
                (item) => !selectedItems.includes(item.word)
              );
              setBookmarks(updatedBookmarks);
              setSelectedItems([]);
              await AsyncStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
            } catch (error) {
              console.error('Error removing selected bookmarks:', error);
              Alert.alert('Error', 'Failed to remove bookmarks. Please try again.');
            }
          },
        },
      ]
    );
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    setSelectedItems([]);
  };

  const toggleItemSelection = (word) => {
    if (selectedItems.includes(word)) {
      setSelectedItems(selectedItems.filter((itemWord) => itemWord !== word));
    } else {
      setSelectedItems([...selectedItems, word]);
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedItems.includes(item.word);

    return (
      <Animated.View
        style={[styles.bookmarkItem, isSelected && styles.selectedItem]}
      >
        <TouchableOpacity
          style={styles.bookmarkContent}
          onPress={() => (isEditing ? toggleItemSelection(item.word) : null)}
          activeOpacity={0.8}
        >
          {isEditing && (
            <View style={styles.checkboxContainer}>
              <View
                style={[
                  styles.checkbox,
                  isSelected && styles.checkboxSelected,
                ]}
              >
                {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
            </View>
          )}

          <View style={styles.wordInfo}>
            <Text style={styles.wordText}>{item.word}</Text>
            <View style={styles.wordDetails}>
              <Text style={styles.partOfSpeech}>{item.partOfSpeech}</Text>
              <Text style={styles.pronunciation}>/{item.pronunciation}/</Text>
            </View>
            <Text style={styles.meaningText} numberOfLines={2}>
              {item.meaning}
            </Text>
          </View>

          {!isEditing && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeBookmark(item.word)}
            >
              <Ionicons name="close-circle" size={22} color="#ff6b6b" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#121212', '#1e1e2a']} style={styles.background}>
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Bookmarks</Text>
            <TouchableOpacity style={styles.editButton} onPress={toggleEditMode}>
              <Text style={styles.editButtonText}>
                {isEditing ? 'Done' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.headerDescription}>Your saved vocabulary words</Text>
        </Animated.View>

        {bookmarks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark" size={70} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>No bookmarks yet</Text>
            <Text style={styles.emptySubtext}>
              Bookmark words you want to remember for later
            </Text>
          </View>
        ) : (
          <FlatList
            data={bookmarks}
            renderItem={renderItem}
            keyExtractor={(item) => item.word}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {isEditing && selectedItems.length > 0 && (
          <View style={styles.actionBar}>
            <Text style={styles.selectedCount}>
              {selectedItems.length} selected
            </Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={removeSelectedItems}
            >
              <Ionicons name="trash-outline" size={24} color="#fff" />
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

// Styles remain the same as in your original code
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerDescription: {
    fontSize: 16,
    color: '#aaa',
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  bookmarkItem: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
  },
  selectedItem: {
    backgroundColor: 'rgba(65, 88, 208, 0.2)',
    borderWidth: 2,
    borderColor: '#4158D0',
  },
  bookmarkContent: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#aaa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4158D0',
    borderColor: '#4158D0',
  },
  wordInfo: {
    flex: 1,
  },
  wordText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  wordDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  partOfSpeech: {
    fontSize: 14,
    color: '#C850C0',
    marginRight: 12,
  },
  pronunciation: {
    fontSize: 14,
    color: '#aaa',
  },
  meaningText: {
    fontSize: 14,
    color: '#ddd',
    lineHeight: 20,
  },
  removeButton: {
    padding: 8,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  selectedCount: {
    color: '#fff',
    fontSize: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f44336',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default BookmarksScreen;