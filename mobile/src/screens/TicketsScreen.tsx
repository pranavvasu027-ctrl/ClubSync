import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { DigitalTicket } from '../data/mockData';
import { CURRENT_USER, getUserTickets } from '../services/clubSyncService';

export default function TicketsScreen() {
  const [tickets, setTickets] = useState<DigitalTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);

  useEffect(() => {
    const fetchTickets = async () => {
      const data = await getUserTickets(CURRENT_USER.prn);
      setTickets(data);
      setLoading(false);
    };
    fetchTickets();
  }, []);

  const activeTicket = tickets[selectedTicketIndex];

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0C447C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Digital Tickets</Text>
        <Text style={styles.headerSub}>Present this verified QR code at the event gate</Text>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Ticket Selector Tabs */}
        {tickets.length > 0 && (
          <View style={styles.ticketTabs}>
            {tickets.map((t, idx) => (
              <TouchableOpacity 
                key={t.id}
                style={[styles.tktTab, selectedTicketIndex === idx && styles.tktTabActive]}
                onPress={() => setSelectedTicketIndex(idx)}
              >
                <Text style={[styles.tktTabText, selectedTicketIndex === idx && styles.tktTabTextActive]} numberOfLines={1}>
                  {t.eventTitle.split('—')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {tickets.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
             <Ionicons name="ticket-outline" size={64} color="#CBD5E1" />
             <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '600', color: '#64748B' }}>No Tickets Found</Text>
             <Text style={{ marginTop: 8, fontSize: 14, color: '#94A3B8', textAlign: 'center' }}>You haven't registered for any events yet.</Text>
          </View>
        ) : activeTicket ? (
          <View style={styles.ticketCard}>
            {/* Ticket Header */}
            <View style={styles.ticketTop}>
              <View style={styles.ticketBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                <Text style={styles.ticketBadgeText}>{activeTicket.checkInStatus}</Text>
              </View>
              <Text style={styles.ticketId}>#{activeTicket.id}</Text>
            </View>

            <Text style={styles.eventTitle}>{activeTicket.eventTitle}</Text>
            <Text style={styles.clubName}>{activeTicket.clubName}</Text>

            {/* Event Time & Venue Details */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{activeTicket.date}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{activeTicket.time}</Text>
              </View>
              <View style={styles.detailItemFull}>
                <Text style={styles.detailLabel}>Venue</Text>
                <Text style={styles.detailValue}>{activeTicket.venue}</Text>
              </View>
            </View>

            {/* Perforated Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.cutoutLeft} />
              <View style={styles.dashedLine} />
              <View style={styles.cutoutRight} />
            </View>

            {/* High-Resolution Live QR Code */}
            <View style={styles.qrSection}>
              <View style={styles.qrBox}>
                <QRCode
                  value={activeTicket.qrCodeString}
                  size={150}
                  color="#0C447C"
                  backgroundColor="#FFFFFF"
                />
              </View>
              <Text style={styles.qrInstructions}>Scan on Event Day for Live Attendance</Text>
              <Text style={styles.qrToken}>{activeTicket.qrCodeString}</Text>
            </View>

            {/* Attendee Info Footer */}
            <View style={styles.attendeeFooter}>
              <View>
                <Text style={styles.attendeeLabel}>Attendee Name</Text>
                <Text style={styles.attendeeName}>{CURRENT_USER.name}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.attendeeLabel}>PRN / College</Text>
                <Text style={styles.attendeePRN}>{CURRENT_USER.prn} · VIT Pune</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="ticket-outline" size={60} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No active tickets</Text>
            <Text style={styles.emptySub}>RSVP to upcoming events to get digital passes</Text>
          </View>
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
  },
  body: {
    flex: 1,
    padding: 16,
  },
  ticketTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tktTab: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  tktTabActive: {
    backgroundColor: '#0C447C',
  },
  tktTabText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  tktTabTextActive: {
    color: '#fff',
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  ticketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  ticketBadgeText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
  },
  ticketId: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  clubName: {
    fontSize: 12,
    color: '#185FA5',
    fontWeight: '600',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  detailItem: {
    width: '45%',
  },
  detailItemFull: {
    width: '100%',
  },
  detailLabel: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  dividerContainer: {
    position: 'relative',
    height: 30,
    marginHorizontal: -20,
    justifyContent: 'center',
  },
  dashedLine: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  cutoutLeft: {
    position: 'absolute',
    left: 0,
    width: 16,
    height: 30,
    backgroundColor: '#F8FAFC',
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  cutoutRight: {
    position: 'absolute',
    right: 0,
    width: 16,
    height: 30,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  qrBox: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  qrInstructions: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0C447C',
    marginBottom: 4,
  },
  qrToken: {
    fontSize: 9.5,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  attendeeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
    marginTop: 10,
  },
  attendeeLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  attendeeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  attendeePRN: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
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
