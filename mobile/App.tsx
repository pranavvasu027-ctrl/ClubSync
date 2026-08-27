import React, { useState } from 'react';
import { StyleSheet, View, StatusBar, TouchableOpacity, Text, Platform, LayoutAnimation, UIManager } from 'react-native';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { EVENTS, EventItem } from './src/data/mockData';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import EventsScreen from './src/screens/EventsScreen';
import ClubsScreen from './src/screens/ClubsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ActivityIndicator } from 'react-native';

type TabType = 'home' | 'events' | 'clubs' | 'profile';

import { getEvents } from './src/services/clubSyncService';
import { registerForPushNotificationsAsync } from './src/services/notificationService';

function MainApp() {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedCollege, setSelectedCollege] = useState('VIT Pune');
  const [events, setEvents] = useState<EventItem[]>(EVENTS);
  const [sortHiringFirst, setSortHiringFirst] = useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    (async () => {
      try {
        const liveEvents = await getEvents();
        if (mounted) setEvents(liveEvents);
      } catch (err) {
        console.warn('Failed to load live events in App:', err);
      }
      
      // Setup Push Notifications when user logs in
      if (mounted) {
        try {
          await registerForPushNotificationsAsync();
        } catch (e) {
          console.warn('Push notification setup failed:', e);
        }
      }
    })();
    return () => { mounted = false; };
  }, [isAuthenticated]);

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

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.headerBg }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const switchTab = (tab: TabType) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  if (!isAuthenticated) {
    return <OnboardingScreen onComplete={() => {}} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        {activeTab === 'home' && (
          <HomeScreen
            selectedCollege={selectedCollege}
            onSelectCollege={setSelectedCollege}
            events={events}
            onRSVP={handleRSVP}
            onNavigateToEvents={() => switchTab('events')}
            onNavigateToClubs={handleNavigateToClubs}
            onNavigateToCompetitions={() => switchTab('events')}
            onNavigateToProfile={() => switchTab('profile')}
          />
        )}

        {activeTab === 'events' && (
          <EventsScreen 
            events={events} 
            onRSVP={handleRSVP} 
            onNavigateToTickets={() => switchTab('profile')}
          />
        )}

        {activeTab === 'clubs' && <ClubsScreen initialSortHiring={sortHiringFirst} />}

        {activeTab === 'profile' && <ProfileScreen />}
      </View>

      {/* BOTTOM NAVIGATION */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.navBorder, paddingBottom: insets.bottom || 10 }]}>
        {/* 1. Home Tab */}
        <TouchableOpacity style={styles.navItem} onPress={() => switchTab('home')}>
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={22}
            color={activeTab === 'home' ? (isDarkMode ? theme.primary : '#0C447C') : theme.textMuted}
          />
          <Text style={[styles.navText, { color: theme.textMuted }, activeTab === 'home' && [styles.navTextActive, { color: isDarkMode ? theme.primary : '#0C447C' }]]}>Home</Text>
        </TouchableOpacity>

        {/* 2. Events Tab */}
        <TouchableOpacity style={styles.navItem} onPress={() => switchTab('events')}>
          <MaterialCommunityIcons
            name={activeTab === 'events' ? 'calendar-month' : 'calendar-month-outline'}
            size={24}
            color={activeTab === 'events' ? (isDarkMode ? theme.primary : '#0C447C') : theme.textMuted}
          />
          <Text style={[styles.navText, { color: theme.textMuted }, activeTab === 'events' && [styles.navTextActive, { color: isDarkMode ? theme.primary : '#0C447C' }]]}>Events</Text>
        </TouchableOpacity>

        {/* 3. Clubs Tab */}
        <TouchableOpacity style={styles.navItem} onPress={() => switchTab('clubs')}>
          <MaterialCommunityIcons
            name={activeTab === 'clubs' ? 'account-group' : 'account-group-outline'}
            size={24}
            color={activeTab === 'clubs' ? (isDarkMode ? theme.primary : '#0C447C') : theme.textMuted}
          />
          <Text style={[styles.navText, { color: theme.textMuted }, activeTab === 'clubs' && [styles.navTextActive, { color: isDarkMode ? theme.primary : '#0C447C' }]]}>Clubs</Text>
        </TouchableOpacity>

        {/* 4. Profile Tab */}
        <TouchableOpacity style={styles.navItem} onPress={() => switchTab('profile')}>
          <Ionicons
            name={activeTab === 'profile' ? 'person' : 'person-outline'}
            size={22}
            color={activeTab === 'profile' ? (isDarkMode ? theme.primary : '#0C447C') : theme.textMuted}
          />
          <Text style={[styles.navText, { color: theme.textMuted }, activeTab === 'profile' && [styles.navTextActive, { color: isDarkMode ? theme.primary : '#0C447C' }]]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
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
