import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLLEGES, EventItem } from '../data/mockData';

interface HomeScreenProps {
  selectedCollege: string;
  onSelectCollege: (collegeName: string) => void;
  events: EventItem[];
  onRSVP: (eventId: string) => void;
  onNavigateToEvents: () => void;
  onNavigateToClubs: (openHiringFirst?: boolean) => void;
  onNavigateToCompetitions: () => void;
  onNavigateToProfile: () => void;
}

interface NotificationItem {
  id: string;
  type: 'event' | 'recruitment' | 'trophy' | 'notice';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

export default function HomeScreen({
  selectedCollege,
  onSelectCollege,
  events,
  onRSVP,
  onNavigateToEvents,
  onNavigateToClubs,
  onNavigateToCompetitions,
  onNavigateToProfile,
}: HomeScreenProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'event' | 'recruitment' | 'notice'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'N1',
      type: 'event',
      title: 'Hackathon Gate Pass Ready 🎟️',
      message: 'Your All-Access Pass for Pune TechFest Grand Hackathon 2026 is confirmed. Check the Profile tab for your QR code pass.',
      time: '10 mins ago',
      isRead: false,
    },
    {
      id: 'N2',
      type: 'recruitment',
      title: 'Interview Call: EDC Incubation Lead 👥',
      message: 'Congratulations Pranav! Your application has been shortlisted based on your verified 8.85 CGPA. Interview on 25 Aug.',
      time: '2 hours ago',
      isRead: false,
    },
    {
      id: 'N3',
      type: 'notice',
      title: 'Dean Student Affairs Notice 🏛️',
      message: 'Venue allocation for Earn & Sell 2026 at Bibwewadi Ground is officially approved. Core committee setup begins at 8 AM.',
      time: '1 day ago',
      isRead: true,
    },
    {
      id: 'N4',
      type: 'trophy',
      title: 'Inter-College Leaderboard Updated 🏆',
      message: 'VIT Pune holds #2 rank in Maharashtra with 12 championship trophies and ₹2.85 Lakhs won.',
      time: '2 days ago',
      isRead: true,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const filteredNotifs = notifications.filter(n => {
    if (notifFilter === 'all') return true;
    return n.type === notifFilter;
  });

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
            <TouchableOpacity style={styles.iconButton} onPress={() => setShowNotifications(true)}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              {unreadCount > 0 && <View style={styles.notifBadge} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatar} onPress={onNavigateToProfile}>
              <Text style={styles.avatarText}>PV</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.greetingSub}>Good morning,</Text>
        <Text style={styles.greetingName}>Pranav Vasu</Text>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#B5D4F4" />
          <TextInput 
            placeholder="Search clubs, hackathons, b-plans..." 
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
              <Text style={[styles.chipText, selectedCollege === c.shortName && styles.chipTextActive]}>
                {c.shortName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Quick Stats Grid — Clickable Navigation */}
        <View style={styles.statsGrid}>
          {/* Card 1: Approved Clubs -> Opens Clubs Tab */}
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => onNavigateToClubs(false)}
            activeOpacity={0.7}
          >
            <View style={styles.statCardTop}>
              <Text style={styles.statLabel}>Approved Clubs</Text>
              <Ionicons name="chevron-forward" size={12} color="#94a3b8" />
            </View>
            <Text style={styles.statNumber}>76</Text>
            <Text style={styles.statSubText}>Explore Directory ➔</Text>
          </TouchableOpacity>

          {/* Card 2: Upcoming Fests -> Opens Events Tab */}
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={onNavigateToEvents}
            activeOpacity={0.7}
          >
            <View style={styles.statCardTop}>
              <Text style={styles.statLabel}>Upcoming Fests</Text>
              <Ionicons name="chevron-forward" size={12} color="#94a3b8" />
            </View>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statSubText}>View Schedule ➔</Text>
          </TouchableOpacity>

          {/* Card 3: Open Recruitments -> Opens Clubs Tab with Hiring Open filter */}
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => onNavigateToClubs(true)}
            activeOpacity={0.7}
          >
            <View style={styles.statCardTop}>
              <Text style={styles.statLabel}>Open Hiring</Text>
              <Ionicons name="chevron-forward" size={12} color="#94a3b8" />
            </View>
            <Text style={[styles.statNumber, { color: '#16A34A' }]}>11</Text>
            <Text style={[styles.statSubText, { color: '#15803D' }]}>Apply for Core ➔</Text>
          </TouchableOpacity>

          {/* Card 4: Competitions & Prize Pools -> Opens Competitions Tab */}
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={onNavigateToCompetitions}
            activeOpacity={0.7}
          >
            <View style={styles.statCardTop}>
              <Text style={styles.statLabel}>Competitions</Text>
              <Ionicons name="chevron-forward" size={12} color="#94a3b8" />
            </View>
            <Text style={[styles.statNumber, { color: '#D97706' }]}>₹2.4L</Text>
            <Text style={[styles.statSubText, { color: '#B45309' }]}>Hackathons & Prizes ➔</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Hackathon Alert Banner */}
        <View style={styles.hackathonBanner}>
          <View style={styles.hackathonHeader}>
            <View style={styles.hackathonBadge}>
              <Ionicons name="trophy" size={12} color="#D97706" />
              <Text style={styles.hackathonBadgeText}>Inter-College Grand Hackathon</Text>
            </View>
            <Text style={styles.hackathonPrize}>₹1,00,000</Text>
          </View>
          <Text style={styles.hackathonTitle}>Pune TechFest Hackathon 2026</Text>
          <Text style={styles.hackathonSub}>Organized by GedIT & IEEE · Sharad Arena & CS Labs</Text>
          <TouchableOpacity style={styles.hackathonBtn} onPress={onNavigateToCompetitions}>
            <Text style={styles.hackathonBtnText}>Enter Competition ➔</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Events Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Events & Stalls</Text>
          <TouchableOpacity onPress={onNavigateToEvents}>
            <Text style={styles.seeAllText}>See all ({events.length})</Text>
          </TouchableOpacity>
        </View>

        {/* Event Cards */}
        {events.slice(0, 3).map((event) => (
          <View key={event.id} style={styles.eventCard}>
            <View style={styles.eventLeft}>
              <View style={[styles.dateBlock, event.vertical === 'Technical' ? styles.dateTech : styles.dateCult]}>
                <Text style={styles.dateMonth}>{event.month}</Text>
                <Text style={styles.dateDay}>{event.day}</Text>
              </View>
              <View style={styles.eventInfo}>
                <View style={styles.badgeRow}>
                  <Text style={styles.verticalTag}>{event.vertical}</Text>
                  <Text style={styles.scopeTag}>{event.scope}</Text>
                </View>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.clubName}>{event.clubName}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={12} color="#64748b" />
                  <Text style={styles.locationText} numberOfLines={1}>{event.venue}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.rsvpButton, event.isRegistered && styles.rsvpButtonActive]}
              onPress={() => onRSVP(event.id)}
            >
              <Text style={[styles.rsvpText, event.isRegistered && styles.rsvpTextActive]}>
                {event.isRegistered ? 'Going ✓' : 'RSVP'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* NOTIFICATIONS & ANNOUNCEMENTS CENTER MODAL */}
      {showNotifications && (
        <Modal visible={true} transparent={true} animationType="slide" onRequestClose={() => setShowNotifications(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.notifModal}>
              <View style={styles.notifHeader}>
                <View>
                  <Text style={styles.notifHeadline}>Announcements & Alerts</Text>
                  <Text style={styles.notifSub}>{unreadCount} unread notices for Pranav Vasu</Text>
                </View>
                <TouchableOpacity onPress={() => setShowNotifications(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Filter Row */}
              <View style={styles.notifFilterRow}>
                <TouchableOpacity 
                  style={[styles.notifFilterChip, notifFilter === 'all' && styles.notifFilterChipActive]}
                  onPress={() => setNotifFilter('all')}
                >
                  <Text style={[styles.notifFilterText, notifFilter === 'all' && styles.notifFilterTextActive]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.notifFilterChip, notifFilter === 'event' && styles.notifFilterChipActive]}
                  onPress={() => setNotifFilter('event')}
                >
                  <Text style={[styles.notifFilterText, notifFilter === 'event' && styles.notifFilterTextActive]}>Events</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.notifFilterChip, notifFilter === 'recruitment' && styles.notifFilterChipActive]}
                  onPress={() => setNotifFilter('recruitment')}
                >
                  <Text style={[styles.notifFilterText, notifFilter === 'recruitment' && styles.notifFilterTextActive]}>Recruitment</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.notifFilterChip, notifFilter === 'notice' && styles.notifFilterChipActive]}
                  onPress={() => setNotifFilter('notice')}
                >
                  <Text style={[styles.notifFilterText, notifFilter === 'notice' && styles.notifFilterTextActive]}>Notices</Text>
                </TouchableOpacity>
              </View>

              {/* Notifications List */}
              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                {filteredNotifs.map((n) => (
                  <View key={n.id} style={[styles.notifCard, !n.isRead && styles.notifCardUnread]}>
                    <View style={styles.notifTopRow}>
                      <View style={styles.notifTypeBox}>
                        <Ionicons 
                          name={n.type === 'event' ? 'ticket-outline' : n.type === 'recruitment' ? 'briefcase-outline' : n.type === 'trophy' ? 'trophy-outline' : 'notifications-outline'} 
                          size={14} 
                          color="#0C447C" 
                        />
                        <Text style={styles.notifItemTitle}>{n.title}</Text>
                      </View>
                      <Text style={styles.notifTime}>{n.time}</Text>
                    </View>
                    <Text style={styles.notifMessage}>{n.message}</Text>
                  </View>
                ))}
              </ScrollView>

              {unreadCount > 0 && (
                <TouchableOpacity style={styles.markReadBtn} onPress={markAllAsRead}>
                  <Ionicons name="checkmark-done" size={16} color="#0C447C" />
                  <Text style={styles.markReadText}>Mark all as read</Text>
                </TouchableOpacity>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    backgroundColor: '#185FA5',
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  brandTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  collegePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  collegeText: {
    color: '#85B7EB',
    fontSize: 11,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    position: 'relative',
    padding: 4,
  },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
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
    fontSize: 12,
    fontWeight: '700',
  },
  greetingSub: {
    color: '#85B7EB',
    fontSize: 12,
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
  body: {
    flex: 1,
    padding: 14,
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
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 1,
  },
  statSubText: {
    fontSize: 10,
    color: '#0C447C',
    fontWeight: '700',
  },
  hackathonBanner: {
    backgroundColor: '#0C447C',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  hackathonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  hackathonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  hackathonBadgeText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '700',
  },
  hackathonPrize: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '800',
  },
  hackathonTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  hackathonSub: {
    color: '#93C5FD',
    fontSize: 11,
    marginBottom: 12,
  },
  hackathonBtn: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  hackathonBtnText: {
    color: '#0C447C',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  seeAllText: {
    fontSize: 12,
    color: '#185FA5',
    fontWeight: '600',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventLeft: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  dateBlock: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dateTech: {
    backgroundColor: '#E6F1FB',
  },
  dateCult: {
    backgroundColor: '#FAEEDA',
  },
  dateMonth: {
    fontSize: 8.5,
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
  verticalTag: {
    fontSize: 8.5,
    color: '#185FA5',
    backgroundColor: '#E6F1FB',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    fontWeight: '600',
  },
  scopeTag: {
    fontSize: 8.5,
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 1,
  },
  clubName: {
    fontSize: 10.5,
    color: '#64748b',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 10,
    color: '#64748b',
  },
  rsvpButton: {
    borderWidth: 1,
    borderColor: '#0C447C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  rsvpButtonActive: {
    backgroundColor: '#0C447C',
  },
  rsvpText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0C447C',
  },
  rsvpTextActive: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  notifModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
    marginBottom: 10,
  },
  notifHeadline: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  notifSub: {
    fontSize: 11,
    color: '#64748B',
  },
  closeBtn: {
    padding: 4,
  },
  notifFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  notifFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  notifFilterChipActive: {
    backgroundColor: '#0C447C',
  },
  notifFilterText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  notifFilterTextActive: {
    color: '#fff',
  },
  notifCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifCardUnread: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTypeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notifItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  notifTime: {
    fontSize: 9.5,
    color: '#94A3B8',
  },
  notifMessage: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 6,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0C447C',
  },
});
