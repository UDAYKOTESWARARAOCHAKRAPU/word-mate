import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const SettingsScreen = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [dailyNotification, setDailyNotification] = useState(true);
  const [quizReminder, setQuizReminder] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [notificationPermission, setNotificationPermission] = useState(null);

  useEffect(() => {
    // Load settings on mount
    loadSettings();

    // Request notification permissions on mount
    requestNotificationPermission();

    // Start fade animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const requestNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotificationPermission(status);
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Notifications are disabled. Please enable them in your device settings to receive Word of the Day and Quiz Reminders.'
      );
      setDailyNotification(false);
      setQuizReminder(false);
    }
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setDarkMode(settings.darkMode);
        setDailyNotification(settings.dailyNotification);
        setQuizReminder(settings.quizReminder);
        setSoundEffects(settings.soundEffects);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load settings. Using defaults.');
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        darkMode,
        dailyNotification,
        quizReminder,
        soundEffects,
      };

      await AsyncStorage.setItem('userSettings', JSON.stringify(settings));

      // Schedule or cancel notifications based on settings
      if (notificationPermission === 'granted') {
        // Cancel all existing notifications to avoid duplicates
        await Notifications.cancelAllScheduledNotificationsAsync();

        // Schedule Word of the Day notification (daily at 8:00 AM)
        if (dailyNotification) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Word of the Day',
              body: 'Discover a new word today with WordMate!',
            },
            trigger: {
              hour: 8,
              minute: 0,
              repeats: true,
            },
          });
        }

        // Schedule Quiz Reminder (weekly on Sundays at 10:00 AM)
        if (quizReminder) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Quiz Reminder',
              body: 'Test your vocabulary with a weekly quiz on WordMate!',
            },
            trigger: {
              weekday: 1, // Sunday (1 = Sunday, 2 = Monday, etc.)
              hour: 10,
              minute: 0,
              repeats: true,
            },
          });
        }
      }

      Alert.alert('Settings Saved', 'Your preferences have been updated.');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const resetProgress = async () => {
    Alert.alert(
      'Reset Progress',
      'This will reset all your learning progress, quiz scores, and streaks. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('wordsLearned');
              await AsyncStorage.removeItem('streak');
              await AsyncStorage.removeItem('lastStreakDate');
              await AsyncStorage.removeItem('quizScore');
              await AsyncStorage.removeItem('bookmarks');
              await AsyncStorage.removeItem('wordOfDay');
              await AsyncStorage.removeItem('wordDate');
              Alert.alert('Progress Reset', 'All progress has been reset.');
            } catch (error) {
              console.error('Error resetting progress:', error);
              Alert.alert('Error', 'Failed to reset progress. Please try again.');
            }
          },
        },
      ]
    );
  };

  const toggleDailyNotification = async (value) => {
    if (value && notificationPermission !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationPermission(status);
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Notifications are disabled. Please enable them in your device settings.'
        );
        setDailyNotification(false);
        return;
      }
    }
    setDailyNotification(value);
  };

  const toggleQuizReminder = async (value) => {
    if (value && notificationPermission !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationPermission(status);
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Notifications are disabled. Please enable them in your device settings.'
        );
        setQuizReminder(false);
        return;
      }
    }
    setQuizReminder(value);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#121212', '#1e1e2a']} style={styles.background}>
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your experience</Text>
        </Animated.View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <View style={styles.settingItem}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Dark Mode</Text>
                <Text style={styles.settingDescription}>
                  Use dark theme for the app
                </Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#767577', true: '#4158D0' }}
                thumbColor={darkMode ? '#C850C0' : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.settingItem}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Word of the Day</Text>
                <Text style={styles.settingDescription}>
                  Get daily word notifications at 8:00 AM
                </Text>
              </View>
              <Switch
                value={dailyNotification}
                onValueChange={toggleDailyNotification}
                trackColor={{ false: '#767577', true: '#4158D0' }}
                thumbColor={dailyNotification ? '#C850C0' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Quiz Reminders</Text>
                <Text style={styles.settingDescription}>
                  Remind me to take quizzes weekly on Sundays at 10:00 AM
                </Text>
              </View>
              <Switch
                value={quizReminder}
                onValueChange={toggleQuizReminder}
                trackColor={{ false: '#767577', true: '#4158D0' }}
                thumbColor={quizReminder ? '#C850C0' : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sound & Feedback</Text>
            <View style={styles.settingItem}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Sound Effects</Text>
                <Text style={styles.settingDescription}>
                  Play sounds for interactions
                </Text>
              </View>
              <Switch
                value={soundEffects}
                onValueChange={setSoundEffects}
                trackColor={{ false: '#767577', true: '#4158D0' }}
                thumbColor={soundEffects ? '#C850C0' : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>

            <TouchableOpacity style={styles.buttonItem} onPress={resetProgress}>
              <View style={styles.buttonContent}>
                <Ionicons name="refresh" size={24} color="#f44336" />
                <View style={styles.buttonTextContainer}>
                  <Text style={[styles.buttonTitle, { color: '#f44336' }]}>
                    Reset Progress
                  </Text>
                  <Text style={styles.buttonDescription}>
                    Clear all your learning data
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonItem}>
              <View style={styles.buttonContent}>
                <Ionicons name="cloud-download" size={24} color="#4CAF50" />
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonTitle}>Download Word Pack</Text>
                  <Text style={styles.buttonDescription}>
                    Get additional vocabulary sets
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>

            <TouchableOpacity style={styles.buttonItem}>
              <View style={styles.buttonContent}>
                <Ionicons name="help-circle" size={24} color="#2196F3" />
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonTitle}>Help & Feedback</Text>
                  <Text style={styles.buttonDescription}>
                    Get support or send feedback
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonItem}>
              <View style={styles.buttonContent}>
                <Ionicons name="information-circle" size={24} color="#9C27B0" />
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonTitle}>About WordMate</Text>
                  <Text style={styles.buttonDescription}>Version 1.0.0</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
            <LinearGradient
              colors={['#4158D0', '#C850C0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveGradient}
            >
              <Text style={styles.saveText}>Save Settings</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footerSpace} />
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
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#aaa',
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C850C0',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#aaa',
  },
  buttonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  buttonTextContainer: {
    marginLeft: 15,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  buttonDescription: {
    fontSize: 14,
    color: '#aaa',
  },
  saveButton: {
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  saveGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerSpace: {
    height: 40,
  },
});

export default SettingsScreen;