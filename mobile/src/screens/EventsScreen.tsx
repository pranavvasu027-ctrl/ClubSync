import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { EventItem } from '../data/mockData';
import { CURRENT_USER, registerForEvent, createEvent, updateEvent } from '../services/clubSyncService';
import { useTheme } from '../context/ThemeContext';

interface EventsScreenProps {
  events: EventItem[];
  onRSVP: (eventId: string) => void;
  onNavigateToTickets?: () => void;
}

export default function EventsScreen({ events: initialEvents, onRSVP, onNavigateToTickets }: EventsScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'registered' | 'past'>('upcoming');
  const [selectedVertical, setSelectedVertical] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  
  // Sorting State
  type SortOption = 'date' | 'popularity' | 'prize' | 'free';
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [showSortModal, setShowSortModal] = useState(false);

  // CREATE / EDIT EVENT MODAL STATE
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formClubName, setFormClubName] = useState('GedIT Technical Club');
  const [formVertical, setFormVertical] = useState<EventItem['vertical']>('Technical');
  const [formScope, setFormScope] = useState<EventItem['scope']>('Inter-Collegiate');
  const [formDate, setFormDate] = useState('02 Sep 2026');
  const [formTime, setFormTime] = useState('10:00 AM');
  const [formVenue, setFormVenue] = useState('Auditorium 1, Main Campus');
  const [formTicketPrice, setFormTicketPrice] = useState('0');
  const [formPrizePool, setFormPrizePool] = useState('₹50,000');
  const [formIsHackathon, setFormIsHackathon] = useState(false);
  const [formDesc, setFormDesc] = useState('');
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  // CHECKOUT MODAL STATE
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'gpay' | 'phonepe' | 'paytm' | 'upi'>('gpay');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const verticals = ['All', 'Technical', 'Entrepreneurship', 'Literary', 'Cultural', 'Sports'];

  const sortLabels: Record<SortOption, string> = {
    date: '📅 Nearest Date First',
    popularity: '🔥 Most Popular',
    prize: '🏆 Highest Prize Pool',
    free: '🆓 Free Events First'
  };

  const filteredEvents = events.filter((evt) => {
    // Show events for current college or national events
    if (evt.collegeName !== CURRENT_USER.collegeName && evt.scope !== 'National') return false;

    if (activeTab === 'upcoming' && evt.status !== 'upcoming') return false;
    if (activeTab === 'registered' && !evt.isRegistered) return false;
    if (activeTab === 'past' && evt.status !== 'past') return false;

    if (selectedVertical !== 'All' && evt.vertical !== selectedVertical) return false;

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
    if (sortBy === 'popularity') {
      return b.registeredCount - a.registeredCount;
    }
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

  const handleOpenCreateModal = () => {
    setEditingEventId(null);
    setFormTitle('');
    setFormClubName('GedIT Technical Club');
    setFormVertical('Technical');
    setFormScope('Inter-Collegiate');
    setFormDate('02 Sep 2026');
    setFormTime('10:00 AM');
    setFormVenue('Auditorium 1, Main Campus');
    setFormTicketPrice('0');
    setFormPrizePool('₹50,000');
    setFormIsHackathon(false);
    setFormDesc('Hands-on technical workshop and competition organized for engineering students.');
    setShowEventModal(true);
  };

  const handleOpenEditModal = (evt: EventItem) => {
    setEditingEventId(evt.id);
    setFormTitle(evt.title);
    setFormClubName(evt.clubName);
    setFormVertical(evt.vertical);
    setFormScope(evt.scope);
    setFormDate(evt.date);
    setFormTime(evt.time);
    setFormVenue(evt.venue);
    setFormTicketPrice(evt.ticketPrice.toString());
    setFormPrizePool(evt.prizePool || '');
    setFormIsHackathon(evt.isHackathon || false);
    setFormDesc(evt.description);
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    if (!formTitle.trim() || !formVenue.trim()) {
      Alert.alert('Missing Fields', 'Please fill in Event Title and Venue.');
      return;
    }

    setIsSavingEvent(true);
    const parsedPrice = parseFloat(formTicketPrice) || 0;

    if (editingEventId) {
      // Update
      const res = await updateEvent(editingEventId, {
        title: formTitle.trim(),
        clubName: formClubName,
        vertical: formVertical,
        scope: formScope,
        date: formDate,
        time: formTime,
        venue: formVenue,
        ticketPrice: parsedPrice,
        prizePool: formPrizePool,
        isHackathon: formIsHackathon,
        description: formDesc,
      });

      setEvents(prev => prev.map(e => e.id === editingEventId ? res.event : e));
      Alert.alert('Event Updated 🎉', 'The event has been updated and synced to the database.');
    } else {
      // Create New
      const res = await createEvent({
        title: formTitle.trim(),
        clubName: formClubName,
        collegeName: CURRENT_USER.collegeName,
        vertical: formVertical,
        scope: formScope,
        date: formDate,
        time: formTime,
        venue: formVenue,
        ticketPrice: parsedPrice,
        prizePool: formPrizePool,
        isHackathon: formIsHackathon,
        description: formDesc,
        registeredCount: 1,
        maxCapacity: 200,
        isRegistered: false,
        status: 'upcoming',
        month: formDate.split(' ')[1] || 'SEP',
        day: formDate.split(' ')[0] || '02',
      });

      setEvents(prev => [res.event, ...prev]);
      Alert.alert('Event Created 🚀', 'New campus event has been created and published live.');
    }

    setIsSavingEvent(false);
    setShowEventModal(false);
  };

  const handleOpenRegistration = (event: EventItem) => {
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

      {/* CREATE / EDIT EVENT MODAL */}
      {showEventModal && (
        <Modal visible={true} transparent={true} animationType="slide" onRequestClose={() => setShowEventModal(false)}>
          <View style={styles.sortModalOverlay}>
            <View style={styles.eventModalCard}>
              <View style={styles.sortModalTop}>
                <Text style={styles.sortModalHeadline}>{editingEventId ? 'Edit Campus Event' : 'Create New Event'}</Text>
                <TouchableOpacity onPress={() => setShowEventModal(false)}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <View style={styles.eventFormGroup}>
                  <Text style={styles.formLabel}>Event Title *</Text>
                  <TextInput style={styles.formInput} placeholder="e.g. AI Agents Bootcamp 2026" value={formTitle} onChangeText={setFormTitle} />

                  <Text style={styles.formLabel}>Host Club Name</Text>
                  <TextInput style={styles.formInput} value={formClubName} onChangeText={setFormClubName} />

                  <Text style={styles.formLabel}>Vertical</Text>
                  <View style={styles.formChipRow}>
                    {(['Technical', 'Entrepreneurship', 'Cultural', 'Sports', 'Literary'] as const).map(v => (
                      <TouchableOpacity 
                        key={v} 
                        style={[styles.formChip, formVertical === v && styles.formChipActive]}
                        onPress={() => setFormVertical(v)}
                      >
                        <Text style={[styles.formChipText, formVertical === v && styles.formChipTextActive]}>{v}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.formLabel}>Date & Time</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput style={[styles.formInput, { flex: 1 }]} placeholder="Date (e.g. 05 Sep 2026)" value={formDate} onChangeText={setFormDate} />
                    <TextInput style={[styles.formInput, { flex: 1 }]} placeholder="Time (e.g. 10:00 AM)" value={formTime} onChangeText={setFormTime} />
                  </View>

                  <Text style={styles.formLabel}>Venue / Location *</Text>
                  <TextInput style={styles.formInput} placeholder="e.g. Central Auditorium, Bibwewadi" value={formVenue} onChangeText={setFormVenue} />

                  <Text style={styles.formLabel}>Ticket Price (₹ 0 for Free)</Text>
                  <TextInput style={styles.formInput} placeholder="0" keyboardType="numeric" value={formTicketPrice} onChangeText={setFormTicketPrice} />

                  <Text style={styles.formLabel}>Prize Pool / Trophy</Text>
                  <TextInput style={styles.formInput} placeholder="e.g. ₹50,000" value={formPrizePool} onChangeText={setFormPrizePool} />

                  <Text style={styles.formLabel}>Description</Text>
                  <TextInput style={[styles.formInput, { height: 60 }]} placeholder="Event overview and guidelines..." multiline value={formDesc} onChangeText={setFormDesc} />
                </View>
              </ScrollView>

              <View style={styles.eventModalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEventModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEvent} disabled={isSavingEvent}>
                  {isSavingEvent ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>{editingEventId ? 'Update Event' : 'Publish Live'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Campus Events</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.hostEventBtn} onPress={handleOpenCreateModal}>
              <Ionicons name="add" size={16} color="#0C447C" />
              <Text style={styles.hostEventBtnText}>Host Event</Text>
            </TouchableOpacity>
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

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>Upcoming ({events.filter(e => e.status === 'upcoming').length})</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'registered' && styles.tabActive]}
          onPress={() => setActiveTab('registered')}
        >
          <Text style={[styles.tabText, activeTab === 'registered' && styles.tabTextActive]}>Registered ({events.filter(e => e.isRegistered).length})</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>Past Archives</Text>
        </TouchableOpacity>
      </View>

      {/* Vertical Filter Chips */}
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
                    <Text style={styles.verticalBadge}>{evt.vertical}</Text>
                    <Text style={styles.scopeBadge}>{evt.scope}</Text>
                    {evt.isHackathon && (
                      <View style={styles.hackathonBadge}>
                        <Ionicons name="trophy" size={10} color="#92400E" />
                        <Text style={styles.hackathonText}>{evt.prizePool || 'Hackathon'}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.eventTitle}>{evt.title}</Text>
                  <Text style={styles.clubName}>{evt.clubName} · {evt.collegeName}</Text>
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
                    <TouchableOpacity 
                      style={styles.editEventMiniBtn} 
                      onPress={() => handleOpenEditModal(evt)}
                    >
                      <Ionicons name="pencil" size={13} color="#64748B" />
                      <Text style={styles.editEventMiniText}>Edit</Text>
                    </TouchableOpacity>

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
