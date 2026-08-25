import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { EventItem, COMPETITIONS } from '../data/mockData';
import { CURRENT_USER, registerForEvent } from '../services/clubSyncService';
import { useTheme } from '../context/ThemeContext';

interface EventsScreenProps {
  events: EventItem[];
  onRSVP: (eventId: string) => void;
  onNavigateToTickets?: () => void;
}

type MainTab = 'Discover' | 'Applied' | 'Watchlist' | 'Past';
type CategoryFilter = 'All' | 'Hackathons' | 'Events & Workshops' | 'B-Plan & Case Studies' | 'Quizzes & CTFs' | 'Cultural & Sports';

export default function EventsScreen({ events: initialEvents, onRSVP, onNavigateToTickets }: EventsScreenProps) {
  const { theme, isDarkMode } = useTheme();

  const mergedEvents = useMemo(() => {
    const internal = initialEvents.map(e => ({
      ...e,
      category: e.vertical === 'Technical' ? 'Hackathons' : 'Events & Workshops'
    }));
    
    const external = COMPETITIONS.map(c => ({
      id: c.id,
      title: c.title,
      clubName: c.organizer,
      collegeName: c.collegeName,
      vertical: c.category,
      category: c.category,
      date: c.deadlineDate,
      month: c.deadlineDate.split(' ')[1] || 'TBD',
      day: c.deadlineDate.split(' ')[0] || 'TBD',
      time: '11:59 PM',
      venue: c.location,
      isHackathon: c.category === 'Hackathons',
      prizePool: c.prizePool,
      ticketPrice: c.entryFee,
      scope: 'National' as const,
      description: c.description,
      registeredCount: c.registeredCount,
      maxCapacity: 500,
      isRegistered: c.isRegistered,
      status: (c.status || 'upcoming') as 'upcoming'|'past',
      winner: c.winner,
      winningCollege: c.winningCollege,
    }));
    return [...internal, ...external];
  }, [initialEvents]);

  const [events, setEvents] = useState(mergedEvents);
  const [mainTab, setMainTab] = useState<MainTab>('Discover');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedIds, setBookmarkedIds] = useState<{ [id: string]: boolean }>({});
  
  const [selectedEvent, setSelectedEvent] = useState<typeof mergedEvents[0] | null>(null);

  // Sorting State
  type SortOption = 'closing' | 'prize' | 'registrations' | 'free';
  const [sortBy, setSortBy] = useState<SortOption>('closing');
  const [showSortModal, setShowSortModal] = useState(false);

  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const sortLabels: Record<SortOption, string> = {
    closing: '⏳ Closing Soon',
    prize: '🏆 Highest Prize Pool',
    registrations: '🔥 Most Registrations',
    free: '🆓 Free Events First'
  };

  const categories: CategoryFilter[] = [
    'All', 'Hackathons', 'Events & Workshops', 'B-Plan & Case Studies', 'Quizzes & CTFs', 'Cultural & Sports'
  ];

  const filteredEvents = events.filter((evt) => {
    if (CURRENT_USER.role !== 'observer') {
      if (evt.collegeName !== CURRENT_USER.collegeName && evt.scope !== 'National') return false;
    }

    if (mainTab === 'Discover' && evt.status === 'past') return false;
    if (mainTab === 'Applied' && !evt.isRegistered) return false;
    if (mainTab === 'Watchlist' && !bookmarkedIds[evt.id]) return false;
    if (mainTab === 'Past' && evt.status !== 'past') return false;

    if (selectedCategory !== 'All' && evt.category !== selectedCategory && evt.vertical !== selectedCategory) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        evt.title.toLowerCase().includes(q) ||
        evt.clubName.toLowerCase().includes(q) ||
        evt.venue.toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'registrations') return b.registeredCount - a.registeredCount;
    if (sortBy === 'prize') {
      const parsePrize = (str: string = '') => parseInt(str.replace(/\D/g, '')) || 0;
      return parsePrize(b.prizePool) - parsePrize(a.prizePool);
    }
    if (sortBy === 'free') {
      if (a.ticketPrice === 0 && b.ticketPrice > 0) return -1;
      if (a.ticketPrice > 0 && b.ticketPrice === 0) return 1;
      return 0;
    }
    return 0;
  });

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };



  const handleOpenRegistration = (event: typeof mergedEvents[0]) => {
    setSelectedEvent(event);
    setShowCheckout(true);
    setPaymentSuccess(false);
  };

  const handleConfirmCheckout = async () => {
    if (!selectedEvent) return;
    setIsProcessingPayment(true);

    const res = await registerForEvent(selectedEvent);

    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      onRSVP(selectedEvent.id);
      setEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, isRegistered: true, registeredCount: e.registeredCount + 1 } : e));
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* SORT MODAL */}
      {showSortModal && (
        <Modal visible={true} transparent={true} animationType="fade" onRequestClose={() => setShowSortModal(false)}>
          <View style={styles.sortModalOverlay}>
            <View style={styles.sortModalBox}>
              <View style={styles.sortModalTop}>
                <Text style={styles.sortModalHeadline}>Sort Events By</Text>
                <TouchableOpacity onPress={() => setShowSortModal(false)}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                <TouchableOpacity 
                  key={key} 
                  style={[styles.sortOptionRow, sortBy === key && styles.sortOptionRowActive]}
                  onPress={() => {
                    setSortBy(key);
                    setShowSortModal(false);
                  }}
                >
                  <Text style={[styles.sortOptionText, sortBy === key && styles.sortOptionTextActive]}>
                    {sortLabels[key]}
                  </Text>
                  {sortBy === key && <Ionicons name="checkmark-circle" size={18} color="#0C447C" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Campus Events</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.sortIconBtn} onPress={() => setShowSortModal(true)}>
              <Ionicons name="filter" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.headerSub}>Discover events hosted at {CURRENT_USER.collegeName}</Text>

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

      {/* Tabs (Unstop Style) */}
      <View style={styles.tabsRow}>
        {(['Discover', 'Applied', 'Watchlist', 'Past'] as MainTab[]).map(tab => (
          <TouchableOpacity 
            key={tab}
            style={[styles.tab, mainTab === tab && styles.tabActive]}
            onPress={() => setMainTab(tab)}
          >
            <Text style={[styles.tabText, mainTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Filter Chips */}
      <View style={styles.chipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {categories.map((c) => (
            <TouchableOpacity 
              key={c}
              style={[styles.chip, selectedCategory === c && styles.chipActive]}
              onPress={() => setSelectedCategory(c)}
            >
              <Text style={[styles.chipText, selectedCategory === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Events List */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptySub}>Try selecting another filter or tap "+ Host Event"</Text>
          </View>
        ) : (
          filteredEvents.map((evt) => (
            <View key={evt.id} style={styles.eventCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.dateBox, evt.vertical === 'Technical' ? styles.techDateBox : styles.cultDateBox]}>
                  <Text style={styles.dateMon}>{evt.month || 'AUG'}</Text>
                  <Text style={styles.dateDay}>{evt.day || '28'}</Text>
                </View>

                <View style={styles.headerInfo}>
                  <View style={styles.badgeRow}>
                    <Text style={styles.verticalBadge}>{evt.category || evt.vertical}</Text>
                    {evt.prizePool && evt.prizePool !== 'Certificate' && (
                      <View style={styles.hackathonBadge}>
                        <Ionicons name="trophy" size={10} color="#92400E" />
                        <Text style={styles.hackathonText}>{evt.prizePool}</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.eventTitle}>{evt.title}</Text>
                      <Text style={styles.clubName}>{evt.clubName} · {evt.collegeName}</Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleBookmark(evt.id)} style={{ paddingLeft: 8 }}>
                      <Ionicons name={bookmarkedIds[evt.id] ? "bookmark" : "bookmark-outline"} size={20} color={bookmarkedIds[evt.id] ? "#0C447C" : "#94A3B8"} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={styles.description} numberOfLines={2}>{evt.description}</Text>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={13} color="#64748B" />
                  <Text style={styles.detailText}>{evt.time}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={13} color="#64748B" />
                  <Text style={styles.detailText} numberOfLines={1}>{evt.venue}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="people-outline" size={13} color="#64748B" />
                  <Text style={styles.detailText}>{evt.registeredCount} going</Text>
                </View>
              </View>

              {evt.status === 'past' ? (
                <View style={styles.winnerCard}>
                  <Ionicons name="trophy" size={14} color="#D97706" />
                  <Text style={styles.winnerText}>🏆 Champion: {evt.winner || 'Team HackElite'} ({evt.winningCollege || 'VIT Pune'})</Text>
                </View>
              ) : (
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.priceLabel}>Entry Fee</Text>
                    <Text style={styles.priceValue}>{evt.ticketPrice === 0 ? 'FREE Entry' : `₹${evt.ticketPrice}`}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {evt.isRegistered ? (
                      <TouchableOpacity 
                        style={styles.registeredBtn}
                        onPress={() => onNavigateToTickets && onNavigateToTickets()}
                      >
                        <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                        <Text style={styles.registeredBtnText}>Pass Ready ➔</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={styles.rsvpBtn} 
                        onPress={() => handleOpenRegistration(evt)}
                      >
                        <Text style={styles.rsvpBtnText}>RSVP Now</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* CHECKOUT & TICKET CONFIRMATION MODAL */}
      {showCheckout && selectedEvent && (
        <Modal visible={true} transparent={true} animationType="slide" onRequestClose={() => setShowCheckout(false)}>
          <View style={styles.sortModalOverlay}>
            <View style={styles.checkoutModalBox}>
              <View style={styles.sortModalTop}>
                <Text style={styles.sortModalHeadline}>
                  {paymentSuccess ? 'Registration Confirmed 🎉' : 'Confirm Registration'}
                </Text>
                <TouchableOpacity onPress={() => setShowCheckout(false)}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {paymentSuccess ? (
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle" size={54} color="#16a34a" />
                  <Text style={styles.successTitle}>You are Registered!</Text>
                  <Text style={styles.successSub}>
                    Your Gate Pass QR code has been generated and saved to your Student Profile.
                  </Text>
                  <TouchableOpacity 
                    style={styles.viewPassActionBtn}
                    onPress={() => {
                      setShowCheckout(false);
                      if (onNavigateToTickets) onNavigateToTickets();
                    }}
                  >
                    <Text style={styles.viewPassActionText}>View Pass in Profile ➔</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <View style={styles.checkoutSummary}>
                    <Text style={styles.summaryEventTitle}>{selectedEvent.title}</Text>
                    <Text style={styles.summaryClubText}>{selectedEvent.clubName}</Text>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Venue</Text>
                      <Text style={styles.summaryValue}>{selectedEvent.venue}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Date & Time</Text>
                      <Text style={styles.summaryValue}>{selectedEvent.date} · {selectedEvent.time}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Attendee Name</Text>
                      <Text style={styles.summaryValue}>{CURRENT_USER.name} ({CURRENT_USER.prn})</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Amount Payable</Text>
                      <Text style={[styles.summaryValue, { color: '#0C447C', fontWeight: '800' }]}>
                        {selectedEvent.ticketPrice === 0 ? 'FREE' : `₹${selectedEvent.ticketPrice}`}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.payBtn} 
                    onPress={handleConfirmCheckout}
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.payBtnText}>
                        {selectedEvent.ticketPrice === 0 ? 'Generate Free Gate Pass ➔' : `Pay ₹${selectedEvent.ticketPrice} & Get Pass ➔`}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
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
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  headerSub: {
    fontSize: 11.5,
    color: '#B5D4F4',
    marginBottom: 12,
  },
  hostEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  hostEventBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0C447C',
  },
  sortIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
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
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0C447C',
    fontWeight: '700',
  },
  chipsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  chipsScroll: {
    paddingHorizontal: 14,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  chipActive: {
    backgroundColor: '#0C447C',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#fff',
  },
  list: {
    flex: 1,
    padding: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  dateBox: {
    width: 44,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  techDateBox: {
    backgroundColor: '#E6F1FB',
  },
  cultDateBox: {
    backgroundColor: '#FAF5FF',
  },
  dateMon: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0C447C',
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0C447C',
  },
  headerInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  verticalBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0C447C',
    backgroundColor: '#E6F1FB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scopeBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hackathonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hackathonText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  clubName: {
    fontSize: 11,
    color: '#64748B',
  },
  description: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 10.5,
    color: '#64748B',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceLabel: {
    fontSize: 9,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0C447C',
  },
  editEventMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editEventMiniText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  rsvpBtn: {
    backgroundColor: '#0C447C',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rsvpBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  registeredBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  registeredBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  winnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
  },
  winnerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  sortModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sortModalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 340,
  },
  sortModalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 10,
  },
  sortModalHeadline: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  sortOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  sortOptionRowActive: {
    backgroundColor: '#E6F1FB',
  },
  sortOptionText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  sortOptionTextActive: {
    color: '#0C447C',
    fontWeight: '700',
  },
  eventModalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    width: '100%',
    maxWidth: 400,
  },
  eventFormGroup: {
    gap: 10,
  },
  formLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: -4,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12.5,
    color: '#0F172A',
  },
  formChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  formChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  formChipActive: {
    backgroundColor: '#0C447C',
  },
  formChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  formChipTextActive: {
    color: '#fff',
  },
  eventModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#0C447C',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  checkoutModalBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    width: '100%',
    maxWidth: 360,
  },
  checkoutSummary: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  summaryEventTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryClubText: {
    fontSize: 11,
    color: '#0C447C',
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 10.5,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  payBtn: {
    backgroundColor: '#0C447C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  payBtnText: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  successSub: {
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  viewPassActionBtn: {
    backgroundColor: '#0C447C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewPassActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
