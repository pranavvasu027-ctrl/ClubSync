import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { College, EventItem, COLLEGES } from '../data/mockData';

interface HomeScreenProps {
  selectedCollege: string;
  onSelectCollege: (college: string) => void;
  events: EventItem[];
  onRSVP: (eventId: string) => void;
  onNavigateToEvents: () => void;
  onNavigateToTickets: () => void;
}

export default function HomeScreen({
  selectedCollege,
  onSelectCollege,
  events,
  onRSVP,
  onNavigateToEvents,
  onNavigateToTickets,
}: HomeScreenProps) {
  const upcomingEvents = events.filter(e => e.status === 'upcoming');

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>CS</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>ClubSync</Text>
              <View style={styles.collegePicker}>
                <Ionicons name="business" size={12} color="#85B7EB" />
                <Text style={styles.collegeText}>{selectedCollege}</Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              <View style={styles.notifBadge} />
            </TouchableOpacity>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>RS</Text>
            </View>
          </View>
        </View>

        <Text style={styles.greetingSub}>Good morning,</Text>
        <Text style={styles.greetingName}>Rohan Sharma</Text>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#B5D4F4" />
          <TextInput 
            placeholder="Search clubs, events, hackathons..." 
            placeholderTextColor="#B5D4F4"
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* College Switcher Chips */}
      <View style={styles.collegeSelectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {COLLEGES.map((c) => (
            <TouchableOpacity 
              key={c.id} 
              style={[styles.chip, selectedCollege === c.shortName && styles.chipActive]}
              onPress={() => onSelectCollege(c.shortName)}
            >
              <Text style={[styles.chipText, selectedCollege === c.shortName && styles.chipTextActive]}>{c.shortName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Feed */}
      <ScrollView style={styles.feed} showsVerticalScrollIndicator={false}>
        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Clubs</Text>
            <Text style={styles.statValue}>78</Text>
            <Text style={styles.statTrend}>+3 this semester</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Upcoming Events</Text>
            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statSub}>Next 30 days</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Open Recruitments</Text>
            <Text style={[styles.statValue, { color: '#0C447C' }]}>11</Text>
            <Text style={styles.statSub}>SY & TY eligible</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Prize Pool</Text>
            <Text style={[styles.statValue, { color: '#27500A' }]}>₹2.4L</Text>
            <Text style={styles.statSub}>In Hackathons</Text>
          </View>
        </View>

        {/* Inter-College Grand Hackathon Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerHeader}>
            <View style={styles.bannerTag}>
              <Ionicons name="trophy" size={13} color="#FBBF24" />
              <Text style={styles.bannerTagText}>Inter-College Grand Hackathon</Text>
            </View>
            <Text style={styles.bannerPrize}>₹1,00,000</Text>
          </View>
          <Text style={styles.bannerTitle}>Pune TechFest Hackathon 2026</Text>
          <Text style={styles.bannerSubtitle}>Organized by GedIT & IEEE · Open to all Pune Colleges</Text>
          <TouchableOpacity style={styles.bannerBtn} onPress={onNavigateToTickets}>
            <Text style={styles.bannerBtnText}>View My Digital Pass</Text>
            <Ionicons name="qr-code-outline" size={16} color="#0C447C" />
          </TouchableOpacity>
        </View>

        {/* Featured Events Section */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Featured Events</Text>
          <TouchableOpacity onPress={onNavigateToEvents}>
            <Text style={styles.seeAllText}>See all ({upcomingEvents.length})</Text>
          </TouchableOpacity>
        </View>

        {upcomingEvents.map((evt) => (
          <View key={evt.id} style={styles.eventCard}>
            <View style={[styles.dateBox, evt.vertical === 'Entrepreneurship' ? { backgroundColor: '#FAEEDA' } : evt.vertical === 'Literary' ? { backgroundColor: '#EEEDFE' } : null]}>
              <Text style={[styles.dateMonth, evt.vertical === 'Entrepreneurship' ? { color: '#854F0B' } : evt.vertical === 'Literary' ? { color: '#534AB7' } : null]}>{evt.month}</Text>
              <Text style={[styles.dateDay, evt.vertical === 'Entrepreneurship' ? { color: '#633806' } : evt.vertical === 'Literary' ? { color: '#26215C' } : null]}>{evt.day}</Text>
            </View>

            <View style={styles.eventInfo}>
              <View style={styles.badgeRow}>
                <Text style={styles.verticalBadge}>{evt.vertical}</Text>
                {evt.scope === 'Pune-Wide' && <Text style={styles.scopeBadge}>Pune-Wide</Text>}
              </View>
              <Text style={styles.eventTitle} numberOfLines={1}>{evt.title}</Text>
              <Text style={styles.eventDesc}>{evt.clubName}</Text>
              <View style={styles.locRow}>
                <Ionicons name="location-outline" size={12} color="#64748b" />
                <Text style={styles.locText} numberOfLines={1}>{evt.venue}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.ticketBtn, evt.isRegistered && styles.ticketBtnActive]}
              onPress={() => onRSVP(evt.id)}
            >
              <Text style={[styles.ticketBtnText, evt.isRegistered && styles.ticketBtnTextActive]}>
                {evt.isRegistered ? 'Going ✓' : 'RSVP'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#0C447C',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#185FA5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  brandTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  collegePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  collegeText: {
    color: '#85B7EB',
    fontSize: 12,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    position: 'relative',
    padding: 6,
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E24B4A',
    borderWidth: 1.5,
    borderColor: '#0C447C',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#378ADD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  greetingSub: {
    color: '#85B7EB',
    fontSize: 13,
    marginTop: 4,
  },
  greetingName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#185FA5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    padding: 0,
  },
  collegeSelectorContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  chipActive: {
    backgroundColor: '#0C447C',
  },
  chipText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  feed: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
  },
  statTrend: {
    fontSize: 10,
    color: '#16a34a',
    marginTop: 2,
    fontWeight: '600',
  },
  statSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  bannerCard: {
    backgroundColor: '#0C447C',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bannerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  bannerTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  bannerPrize: {
    color: '#FBBF24',
    fontWeight: '700',
    fontSize: 14,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: '#93C5FD',
    fontSize: 12,
    marginBottom: 12,
  },
  bannerBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bannerBtnText: {
    color: '#0C447C',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  seeAllText: {
    fontSize: 12,
    color: '#0C447C',
    fontWeight: '600',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  dateBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#E6F1FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: '#185FA5',
  },
  dateDay: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0C447C',
  },
  eventInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 2,
  },
  verticalBadge: {
    fontSize: 9,
    color: '#185FA5',
    backgroundColor: '#E6F1FB',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    fontWeight: '600',
  },
  scopeBadge: {
    fontSize: 9,
    color: '#854F0B',
    backgroundColor: '#FAEEDA',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 1,
  },
  eventDesc: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 3,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  ticketBtn: {
    borderWidth: 1,
    borderColor: '#0C447C',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  ticketBtnActive: {
    backgroundColor: '#0C447C',
  },
  ticketBtnText: {
    color: '#0C447C',
    fontSize: 12,
    fontWeight: '600',
  },
  ticketBtnTextActive: {
    color: '#fff',
  },
});
