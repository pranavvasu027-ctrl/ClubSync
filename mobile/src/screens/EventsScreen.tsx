import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EventItem } from '../data/mockData';

interface EventsScreenProps {
  events: EventItem[];
  onRSVP: (eventId: string) => void;
}

export default function EventsScreen({ events, onRSVP }: EventsScreenProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'registered' | 'past'>('upcoming');
  const [selectedVertical, setSelectedVertical] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const verticals = ['All', 'Technical', 'Entrepreneurship', 'Literary', 'Cultural', 'Sports'];

  const filteredEvents = events.filter((evt) => {
    // Filter by tab
    if (activeTab === 'upcoming' && evt.status !== 'upcoming') return false;
    if (activeTab === 'registered' && !evt.isRegistered) return false;
    if (activeTab === 'past' && evt.status !== 'past') return false;

    // Filter by vertical
    if (selectedVertical !== 'All' && evt.vertical !== selectedVertical) return false;

    // Filter by search
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        evt.title.toLowerCase().includes(q) ||
        evt.clubName.toLowerCase().includes(q) ||
        evt.venue.toLowerCase().includes(q)
      );
    }

    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events & Hackathons</Text>
        <Text style={styles.headerSub}>Discover inter-college competitions across Pune</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#B5D4F4" />
          <TextInput 
            placeholder="Search events, workshops, fests..." 
            placeholderTextColor="#B5D4F4"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#B5D4F4" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>Upcoming</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'registered' && styles.tabActive]}
          onPress={() => setActiveTab('registered')}
        >
          <Text style={[styles.tabText, activeTab === 'registered' && styles.tabTextActive]}>Registered</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>Past Archives (2+ Yrs)</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.chipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {verticals.map((v) => (
            <TouchableOpacity 
              key={v}
              style={[styles.chip, selectedVertical === v && styles.chipActive]}
              onPress={() => setSelectedVertical(v)}
            >
              <Text style={[styles.chipText, selectedVertical === v && styles.chipTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Events List */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptySub}>Try adjusting your filters or search terms</Text>
          </View>
        ) : (
          filteredEvents.map((evt) => (
            <View key={evt.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.dateBox}>
                  <Text style={styles.dateMonth}>{evt.month}</Text>
                  <Text style={styles.dateDay}>{evt.day}</Text>
                </View>

                <View style={styles.cardHeaderInfo}>
                  <View style={styles.badgeRow}>
                    <Text style={styles.vertBadge}>{evt.vertical}</Text>
                    {evt.isHackathon && (
                      <View style={styles.hackathonBadge}>
                        <Ionicons name="trophy" size={10} color="#fff" />
                        <Text style={styles.hackathonText}>Hackathon</Text>
                      </View>
                    )}
                    {evt.prizePool && (
                      <Text style={styles.prizeBadge}>Prize: {evt.prizePool}</Text>
                    )}
                  </View>
                  <Text style={styles.cardTitle}>{evt.title}</Text>
                  <Text style={styles.cardClub}>{evt.clubName} · {evt.collegeName}</Text>
                </View>
              </View>

              <Text style={styles.cardDesc} numberOfLines={2}>{evt.description}</Text>

              {/* Past Winner Banner */}
              {evt.status === 'past' && evt.winner && (
                <View style={styles.winnerBox}>
                  <Ionicons name="ribbon" size={14} color="#B45309" />
                  <Text style={styles.winnerText}>
                    Winner: <Text style={{ fontWeight: '700' }}>{evt.winner}</Text> ({evt.winningCollege})
                  </Text>
                </View>
              )}

              <View style={styles.cardFooter}>
                <View style={styles.metaCol}>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={12} color="#64748b" />
                    <Text style={styles.metaText}>{evt.time}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={12} color="#64748b" />
                    <Text style={styles.metaText}>{evt.venue}</Text>
                  </View>
                </View>

                {evt.status !== 'past' && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, evt.isRegistered && styles.actionBtnRegistered]}
                    onPress={() => onRSVP(evt.id)}
                  >
                    <Text style={[styles.actionBtnText, evt.isRegistered && styles.actionBtnTextRegistered]}>
                      {evt.isRegistered ? 'Registered ✓' : evt.ticketPrice === 0 ? 'Free RSVP' : `Buy ₹${evt.ticketPrice}`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}

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
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSub: {
    color: '#B5D4F4',
    fontSize: 12,
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
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0C447C',
  },
  tabText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#0C447C',
    fontWeight: '700',
  },
  chipsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  chipActive: {
    backgroundColor: '#185FA5',
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
  list: {
    flex: 1,
    padding: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
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
  cardHeaderInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  vertBadge: {
    fontSize: 9,
    fontWeight: '600',
    color: '#185FA5',
    backgroundColor: '#E6F1FB',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  hackathonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#185FA5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hackathonText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  prizeBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#27500A',
    backgroundColor: '#EAF3DE',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 1,
  },
  cardClub: {
    fontSize: 11,
    color: '#64748b',
  },
  cardDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 10,
  },
  winnerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  winnerText: {
    fontSize: 11,
    color: '#92400E',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  metaCol: {
    gap: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
  },
  actionBtn: {
    backgroundColor: '#0C447C',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionBtnRegistered: {
    backgroundColor: '#16a34a',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnTextRegistered: {
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  emptySub: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
