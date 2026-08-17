import React, { useState } from 'react';
import { StyleSheet, View, StatusBar, TouchableOpacity, Text, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { EVENTS, EventItem } from './src/data/mockData';
import HomeScreen from './src/screens/HomeScreen';
import EventsScreen from './src/screens/EventsScreen';
import CompetitionsScreen from './src/screens/CompetitionsScreen';
import ClubsScreen from './src/screens/ClubsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

type TabType = 'home' | 'events' | 'competitions' | 'clubs' | 'profile';

function MainApp() {
  const insets = useSafeAreaInsets();
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

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0C447C" translucent={false} />

      {/* Dynamic Screen Content */}
      <View style={styles.content}>
        {activeTab === 'home' && (
          <HomeScreen
            selectedCollege={selectedCollege}
            onSelectCollege={setSelectedCollege}
            events={events}
            onRSVP={handleRSVP}
            onNavigateToEvents={() => setActiveTab('events')}
            onNavigateToClubs={handleNavigateToClubs}
            onNavigateToCompetitions={() => setActiveTab('competitions')}
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

        {activeTab === 'competitions' && <CompetitionsScreen />}

        {activeTab === 'clubs' && <ClubsScreen initialSortHiring={sortHiringFirst} />}

        {activeTab === 'profile' && <ProfileScreen />}
      </View>

      {/* Persistent Bottom Tab Bar (Home | Events | Competitions | Clubs | Profile) */}
      <View style={styles.bottomNav}>
        {/* 1. Home Tab */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('home')}
        >
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={22}
            color={activeTab === 'home' ? '#0C447C' : '#94a3b8'}
          />
          <Text
            style={[
              styles.navText,
              activeTab === 'home' && styles.navTextActive,
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
            color={activeTab === 'events' ? '#0C447C' : '#94a3b8'}
          />
          <Text
            style={[
              styles.navText,
              activeTab === 'events' && styles.navTextActive,
            ]}
          >
            Events
          </Text>
        </TouchableOpacity>

        {/* 3. Competitions Tab (Unstop Style) */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('competitions')}
        >
          <Ionicons
            name={activeTab === 'competitions' ? 'trophy' : 'trophy-outline'}
            size={22}
            color={activeTab === 'competitions' ? '#0C447C' : '#94a3b8'}
          />
          <Text
            style={[
              styles.navText,
              activeTab === 'competitions' && styles.navTextActive,
            ]}
          >
            Competitions
          </Text>
        </TouchableOpacity>

        {/* 4. Clubs Tab */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setSortHiringFirst(false);
            setActiveTab('clubs');
          }}
        >
          <Ionicons
            name={activeTab === 'clubs' ? 'people' : 'people-outline'}
            size={22}
            color={activeTab === 'clubs' ? '#0C447C' : '#94a3b8'}
          />
          <Text
            style={[
              styles.navText,
              activeTab === 'clubs' && styles.navTextActive,
            ]}
          >
            Clubs
          </Text>
        </TouchableOpacity>

        {/* 5. Profile & Passes Tab */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('profile')}
        >
          <Ionicons
            name={activeTab === 'profile' ? 'person' : 'person-outline'}
            size={22}
            color={activeTab === 'profile' ? '#0C447C' : '#94a3b8'}
          />
          <Text
            style={[
              styles.navText,
              activeTab === 'profile' && styles.navTextActive,
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
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C447C',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
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
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#0C447C',
    fontWeight: '700',
  },
});
