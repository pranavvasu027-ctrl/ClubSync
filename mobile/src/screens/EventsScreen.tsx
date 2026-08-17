import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { EventItem } from '../data/mockData';
import { CURRENT_USER } from '../services/clubSyncService';

interface EventsScreenProps {
  events: EventItem[];
  onRSVP: (eventId: string) => void;
  onNavigateToTickets?: () => void;
}

export default function EventsScreen({ events, onRSVP, onNavigateToTickets }: EventsScreenProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'registered' | 'past'>('upcoming');
  const [selectedVertical, setSelectedVertical] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'gpay' | 'phonepe' | 'paytm' | 'upi'>('gpay');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const verticals = ['All', 'Technical', 'Entrepreneurship', 'Literary', 'Cultural', 'Sports'];

  const filteredEvents = events.filter((evt) => {
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
  });

  const handleOpenRegistration = (event: EventItem) => {
    setSelectedEvent(event);
    setShowCheckout(true);
    setPaymentSuccess(false);
  };

  const handleConfirmCheckout = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      if (selectedEvent) {
        onRSVP(selectedEvent.id);
      }
    }, 1200);
  };

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
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>Past Archives (2+ Yrs)</Text>
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
            <Text style={styles.emptySub}>Try selecting another filter or search term</Text>
          </View>
        ) : (
          filteredEvents.map((evt) => (
            <View key={evt.id} style={styles.eventCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.dateBox, evt.vertical === 'Technical' ? styles.techDateBox : styles.cultDateBox]}>
                  <Text style={styles.dateMon}>{evt.month}</Text>
                  <Text style={styles.dateDay}>{evt.day}</Text>
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
              </View>

              {evt.status === 'past' ? (
                <View style={styles.winnerCard}>
                  <Ionicons name="trophy" size={14} color="#D97706" />
                  <Text style={styles.winnerText}>🏆 Champion: <strong>{evt.winner}</strong> ({evt.winningCollege})</Text>
                </View>
              ) : (
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.priceLabel}>Entry Fee</Text>
                    <Text style={styles.priceValue}>{evt.ticketPrice === 0 ? 'FREE Entry' : `₹${evt.ticketPrice}`}</Text>
                  </View>

                  <TouchableOpacity 
                    style={[styles.rsvpBtn, evt.isRegistered && styles.rsvpBtnActive]}
                    onPress={() => handleOpenRegistration(evt)}
                  >
                    <Ionicons 
                      name={evt.isRegistered ? "checkmark-circle" : "ticket-outline"} 
                      size={14} 
                      color="#fff" 
                    />
                    <Text style={styles.rsvpBtnText}>
                      {evt.isRegistered ? "Registered ✓" : (evt.ticketPrice === 0 ? "RSVP Free Pass" : `Get Ticket · ₹${evt.ticketPrice}`)}
                    </Text>
                  </TouchableOpacity>
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
          <View style={styles.modalOverlay}>
            <View style={styles.checkoutModal}>
              {!paymentSuccess ? (
                <>
                  <View style={styles.modalTopRow}>
                    <div>
                      <Text style={styles.modalHeadline}>Event Pass Checkout</Text>
                      <Text style={styles.modalSub}>{selectedEvent.clubName}</Text>
                    </div>
                    <TouchableOpacity onPress={() => setShowCheckout(false)} style={styles.closeIcon}>
                      <Ionicons name="close" size={20} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  {/* Summary Box */}
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryTitle}>{selectedEvent.title}</Text>
                    <Text style={styles.summaryVenue}>📍 {selectedEvent.venue}</Text>
                    <Text style={styles.summaryDate}>📅 {selectedEvent.date} · {selectedEvent.time}</Text>

                    <View style={styles.attendeePill}>
                      <Text style={styles.attendeePillText}>👤 Attendee: {CURRENT_USER.name} (PRN: {CURRENT_USER.prn})</Text>
                    </View>
                  </View>

                  {/* Payment Selection (if paid) */}
                  {selectedEvent.ticketPrice > 0 && (
                    <View style={{ marginVertical: 12 }}>
                      <Text style={styles.sectionLabel}>Select UPI Payment Method:</Text>
                      <View style={styles.upiGrid}>
                        <TouchableOpacity 
                          style={[styles.upiOption, selectedPaymentMode === 'gpay' && styles.upiOptionActive]}
                          onPress={() => setSelectedPaymentMode('gpay')}
                        >
                          <Text style={[styles.upiText, selectedPaymentMode === 'gpay' && styles.upiTextActive]}>Google Pay</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[styles.upiOption, selectedPaymentMode === 'phonepe' && styles.upiOptionActive]}
                          onPress={() => setSelectedPaymentMode('phonepe')}
                        >
                          <Text style={[styles.upiText, selectedPaymentMode === 'phonepe' && styles.upiTextActive]}>PhonePe</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[styles.upiOption, selectedPaymentMode === 'paytm' && styles.upiOptionActive]}
                          onPress={() => setSelectedPaymentMode('paytm')}
                        >
                          <Text style={[styles.upiText, selectedPaymentMode === 'paytm' && styles.upiTextActive]}>Paytm / UPI</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Included Perks */}
                  <View style={styles.perksBox}>
                    <Text style={styles.perksTitle}>Included with this pass:</Text>
                    <Text style={styles.perkItem}>✓ Official College OD / Attendance Permission Slip</Text>
                    <Text style={styles.perkItem}>✓ Cryptographic Scannable QR Gate Pass</Text>
                    <Text style={styles.perkItem}>✓ Certificate of Participation (NAAC Verified)</Text>
                  </View>

                  {/* Action Button */}
                  <TouchableOpacity 
                    style={[styles.payBtn, isProcessingPayment && styles.payBtnDisabled]}
                    onPress={handleConfirmCheckout}
                    disabled={isProcessingPayment}
                  >
                    <Text style={styles.payBtnText}>
                      {isProcessingPayment ? "Securing Registration..." : (selectedEvent.ticketPrice === 0 ? "Confirm Free Registration" : `Pay ₹${selectedEvent.ticketPrice} & Get Pass`)}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                /* SUCCESS VIEW */
                <View style={styles.successContainer}>
                  <View style={styles.successIconBox}>
                    <Ionicons name="checkmark-circle" size={56} color="#16A34A" />
                  </View>
                  <Text style={styles.successHeadline}>Registration Confirmed!</Text>
                  <Text style={styles.successDesc}>
                    Your digital pass has been generated with your verified PRN: <strong>{CURRENT_USER.prn}</strong>
                  </Text>

                  <View style={styles.tokenBox}>
                    <Text style={styles.tokenLabel}>QR Security Token:</Text>
                    <Text style={styles.tokenValue}>CLUBSYNC-TKT-{selectedEvent.id}-{CURRENT_USER.prn}-VALID</Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.viewPassBtn}
                    onPress={() => {
                      setShowCheckout(false);
                      if (onNavigateToTickets) onNavigateToTickets();
                    }}
                  >
                    <Ionicons name="qr-code" size={16} color="#fff" />
                    <Text style={styles.viewPassBtnText}>View My Digital Pass in Wallet</Text>
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
    paddingVertical: 11,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0C447C',
  },
  tabText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
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
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  chipActive: {
    backgroundColor: '#185FA5',
  },
  chipText: {
    fontSize: 11.5,
    color: '#64748B',
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
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  dateBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  techDateBox: {
    backgroundColor: '#E6F1FB',
  },
  cultDateBox: {
    backgroundColor: '#FEF3C7',
  },
  dateMon: {
    fontSize: 9,
    fontWeight: '800',
    color: '#185FA5',
  },
  dateDay: {
    fontSize: 17,
    fontWeight: '800',
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
    flexWrap: 'wrap',
  },
  verticalBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#185FA5',
    backgroundColor: '#E6F1FB',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  scopeBadge: {
    fontSize: 9,
    fontWeight: '600',
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  hackathonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  hackathonText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
  },
  eventTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
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
    gap: 14,
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  detailText: {
    fontSize: 11,
    color: '#64748B',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  priceLabel: {
    fontSize: 9.5,
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0C447C',
  },
  rsvpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0C447C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rsvpBtnActive: {
    backgroundColor: '#16A34A',
  },
  rsvpBtnText: {
    color: '#fff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  winnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  winnerText: {
    fontSize: 11,
    color: '#92400E',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  emptySub: {
    fontSize: 11.5,
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  checkoutModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalHeadline: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#185FA5',
    fontWeight: '600',
  },
  closeIcon: {
    padding: 4,
  },
  summaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    gap: 4,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryVenue: {
    fontSize: 11.5,
    color: '#64748B',
  },
  summaryDate: {
    fontSize: 11.5,
    color: '#64748B',
  },
  attendeePill: {
    backgroundColor: '#E6F1FB',
    padding: 6,
    borderRadius: 6,
    marginTop: 6,
  },
  attendeePillText: {
    fontSize: 11,
    color: '#0C447C',
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  upiGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  upiOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  upiOptionActive: {
    borderColor: '#0C447C',
    backgroundColor: '#E6F1FB',
  },
  upiText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  upiTextActive: {
    color: '#0C447C',
    fontWeight: '700',
  },
  perksBox: {
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  perksTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 4,
  },
  perkItem: {
    fontSize: 10.5,
    color: '#166534',
    lineHeight: 16,
  },
  payBtn: {
    backgroundColor: '#0C447C',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  payBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  payBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIconBox: {
    marginBottom: 10,
  },
  successHeadline: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  successDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  tokenBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    marginBottom: 16,
  },
  tokenLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  tokenValue: {
    fontSize: 11,
    color: '#0C447C',
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  viewPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0C447C',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  viewPassBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
