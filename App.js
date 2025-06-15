import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import FlashcardsScreen from './src/screens/FlashcardsScreen';
import QuizScreen from './src/screens/QuizScreen';
import BookmarksScreen from './src/screens/BookmarksScreen';
import DictionaryScreen from './src/screens/DictionaryScreen'; // New import

const Tab = createBottomTabNavigator();

// Custom tab bar component with proper safe area handling
function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;

        const isFocused = state.index === index;

        let iconName;
        if (route.name === 'Home') {
          iconName = isFocused ? 'home' : 'home-outline';
        } else if (route.name === 'Flashcards') {
          iconName = isFocused ? 'card' : 'card-outline';
        } else if (route.name === 'Quiz') {
          iconName = isFocused ? 'help-circle' : 'help-circle-outline';
        } else if (route.name === 'Bookmarks') {
          iconName = isFocused ? 'bookmark' : 'bookmark-outline';
        } else if (route.name === 'Dictionary') {
          iconName = isFocused ? 'book' : 'book-outline'; // Icon for Dictionary
        }

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={index}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabButton}
          >
            <Ionicons
              name={iconName}
              size={24}
              color={isFocused ? '#fff' : 'rgba(255,255,255,0.6)'}
            />
            <Text style={isFocused ? styles.tabLabelActive : styles.tabLabel}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </SafeAreaView>
  );
}

// Wrapper component to handle status bar and screen padding
function ScreenWrapper({ children }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screenWrapper, { paddingTop: insets.top > 0 ? insets.top : 8 }]}>
      {children}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <NavigationContainer>
        <Tab.Navigator
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{
            headerShown: false,
          }}
          initialRouteName="Home"
          sceneContainerStyle={{ backgroundColor: 'transparent' }}
        >
          <Tab.Screen
            name="Home"
            options={{ tabBarLabel: 'Home' }}
          >
            {(props) => (
              <ScreenWrapper>
                <HomeScreen {...props} />
              </ScreenWrapper>
            )}
          </Tab.Screen>
          <Tab.Screen name="Flashcards">
            {(props) => (
              <ScreenWrapper>
                <FlashcardsScreen {...props} />
              </ScreenWrapper>
            )}
          </Tab.Screen>
          <Tab.Screen name="Quiz">
            {(props) => (
              <ScreenWrapper>
                <QuizScreen {...props} />
              </ScreenWrapper>
            )}
          </Tab.Screen>
          <Tab.Screen name="Bookmarks">
            {(props) => (
              <ScreenWrapper>
                <BookmarksScreen {...props} />
              </ScreenWrapper>
            )}
          </Tab.Screen>
          <Tab.Screen name="Dictionary" options={{ tabBarLabel: 'Dictionary' }}>
            {(props) => (
              <ScreenWrapper>
                <DictionaryScreen {...props} />
              </ScreenWrapper>
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#121212',
  },
  tabBarContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: 70,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  tabLabelActive: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
  },
});