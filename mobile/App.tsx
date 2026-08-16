import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, TouchableOpacity, Text } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { EVENTS, EventItem } from './src/data/mockData';
import HomeScreen from './src/screens/HomeScreen';
import EventsScreen from './src/screens/EventsScreen';
import ClubsScreen from './src/screens/ClubsScreen';
import TicketsScreen from './src/screens/TicketsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

type TabType = 'home' | 'events' | 'clubs' | 'tickets' | 'profile';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedCollege, setSelectedCollege] = useState('VIT Pune');
  const [events, setEvents] = useState<EventItem[]>(EVENTS);

  const handleRSVP = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, isRegistered: !e.isRegistered } : e
      )
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C447C" />

      {/* Dynamic Screen Content */}
      <View style={styles.content}>
        {activeTab === 'home' && (
          <HomeScreen
            selectedCollege={selectedCollege}
            onSelectCollege={setSelectedCollege}
            events={events}
            onRSVP={handleRSVP}
            onNavigateToEvents={() => setActiveTab('events')}
            onNavigateToTickets={() => setActiveTab('tickets')}
          />
        )}

        {activeTab === 'events' && (
          <EventsScreen events={events} onRSVP={handleRSVP} />
        )}

        {activeTab === 'clubs' && <ClubsScreen />}

        {activeTab === 'tickets' && <TicketsScreen />}

        {activeTab === 'profile' && <ProfileScreen />}
      </View>

      {/* Persistent Bottom Tab Bar */}
      <View style={styles.bottomNav}>
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

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('clubs')}
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

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('tickets')}
        >
          <MaterialCommunityIcons
            name={activeTab === 'tickets' ? 'ticket' : 'ticket-outline'}
            size={22}
            color={activeTab === 'tickets' ? '#0C447C' : '#94a3b8'}
          />
          <Text
            style={[
              styles.navText,
              activeTab === 'tickets' && styles.navTextActive,
            ]}
          >
            Tickets
          </Text>
        </TouchableOpacity>

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
    </SafeAreaView>
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
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navItem: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 12,
  },
  navText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  navTextActive: {
    color: '#0C447C',
    fontWeight: '700',
  },
});
