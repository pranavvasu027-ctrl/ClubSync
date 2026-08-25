import React, { useState } from 'react';
import { StyleSheet, View, StatusBar, TouchableOpacity, Text, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { EVENTS, EventItem } from './src/data/mockData';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import EventsScreen from './src/screens/EventsScreen';
import ClubsScreen from './src/screens/ClubsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

type TabType = 'home' | 'events' | 'clubs' | 'profile';

function MainApp() {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedCollege, setSelectedCollege] = useState('VIT Pune');
  const [events, setEvents] = useState<EventItem[]>(EVENTS);
  const [sortHiringFirst, setSortHiringFirst] = useState(false);

  const handleRSVP = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, isRegistered: !e.isRegistered } : e
      )
    );
  };

  const handleNavigateToClubs = (openHiring?: boolean) => {
    setSortHiringFirst(!!openHiring);
    setActiveTab('clubs');
  };

  if (!isAuthenticated) {
    return <OnboardingScreen onComplete={() => setIsAuthenticated(true)} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: theme.headerBg }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} translucent={false} />

      {/* Dynamic Screen Content */}
      <View style={[styles.content, { backgroundColor: theme.bg }]}>
        {activeTab === 'home' && (
          <HomeScreen
            selectedCollege={selectedCollege}
            onSelectCollege={setSelectedCollege}
            events={events}
            onRSVP={handleRSVP}
            onNavigateToEvents={() => setActiveTab('events')}
            onNavigateToClubs={handleNavigateToClubs}
            onNavigateToCompetitions={() => setActiveTab('events')}
            onNavigateToProfile={() => setActiveTab('profile')}
          />
        )}

        {activeTab === 'events' && (
          <EventsScreen 
            events={events} 
            onRSVP={handleRSVP} 
            onNavigateToTickets={() => setActiveTab('profile')}
          />
        )}

        {activeTab === 'clubs' && <ClubsScreen initialSortHiring={sortHiringFirst} />}

        {activeTab === 'profile' && <ProfileScreen />}
      </View>

      {/* Persistent Dynamic Bottom Tab Bar (Home | Events | Clubs | Profile) */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.navBorder }]}>
        {/* 1. Home Tab */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('home')}
        >
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={22}
            color={activeTab === 'home' ? (isDarkMode ? theme.primary : '#0C447C') : theme.textMuted}
          />
          <Text
            style={[
              styles.navText,
              { color: theme.textMuted },
              activeTab === 'home' && [styles.navTextActive, { color: isDarkMode ? theme.primary : '#0C447C' }],
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* 2. Events Tab */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('events')}
        >
          <Ionicons
            name={activeTab === 'events' ? 'calendar' : 'calendar-outline'}
            size={22}
            color={activeTab === 'events' ? (isDarkMode ? theme.primary : '#0C447C') : theme.textMuted}
          />
          <Text
            style={[
              styles.navText,
              { color: theme.textMuted },
              activeTab === 'events' && [styles.navTextActive, { color: isDarkMode ? theme.primary : '#0C447C' }],
            ]}
          >
            Events
          </Text>
        </TouchableOpacity>

        {/* 3. Clubs Tab */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('clubs')}
        >
          <MaterialCommunityIcons
            name={activeTab === 'clubs' ? 'account-group' : 'account-group-outline'}
            size={24}
            color={activeTab === 'clubs' ? (isDarkMode ? theme.primary : '#0C447C') : theme.textMuted}
          />
          <Text
            style={[
              styles.navText,
              { color: theme.textMuted },
              activeTab === 'clubs' && [styles.navTextActive, { color: isDarkMode ? theme.primary : '#0C447C' }],
            ]}
          >
            Clubs
          </Text>
        </TouchableOpacity>

        {/* 4. Profile Tab */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('profile')}
        >
          <Ionicons
            name={activeTab === 'profile' ? 'person' : 'person-outline'}
            size={22}
            color={activeTab === 'profile' ? (isDarkMode ? theme.primary : '#0C447C') : theme.textMuted}
          />
          <Text
            style={[
              styles.navText,
              { color: theme.textMuted },
              activeTab === 'profile' && [styles.navTextActive, { color: isDarkMode ? theme.primary : '#0C447C' }],
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  navTextActive: {
    fontWeight: '700',
  },
});
