import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { CURRENT_USER } from '../services/clubSyncService';
import { DigitalTicket, MY_TICKETS } from '../data/mockData';

export default function ProfileScreen() {
  const [ticketsList, setTicketsList] = useState<DigitalTicket[]>(MY_TICKETS);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<DigitalTicket | null>(null);

  const handleDownload = (type: string) => {
    Alert.alert('Download Complete', `${type} saved to your device with cryptographic signature.`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>PV</Text>
        </View>
        <Text style={styles.userName}>{CURRENT_USER.name}</Text>
        <Text style={styles.userEmail}>{CURRENT_USER.email}</Text>
        <Text style={styles.userSub}>{CURRENT_USER.branch} · {CURRENT_USER.year}</Text>

        <View style={styles.collegeBadge}>
          <Ionicons name="school" size={13} color="#fff" />
          <Text style={styles.collegeBadgeText}>{CURRENT_USER.collegeName}</Text>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Student Passport Card */}
        <View style={styles.passportCard}>
          <View style={styles.passportTop}>
            <Text style={styles.passportTitle}>CLUBSYNC STUDENT PASSPORT</Text>
            <View style={styles.verifiedTag}>
              <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
              <Text style={styles.verifiedText}>VIT VERIFIED</Text>
            </View>
          </View>

          <View style={styles.passportGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>PRN / Roll No</Text>
              <Text style={styles.gridValue}>{CURRENT_USER.prn}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Academic Year</Text>
              <Text style={styles.gridValue}>2026–27</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Cumulative CGPA</Text>
              <Text style={[styles.gridValue, { color: '#16a34a' }]}>{CURRENT_USER.cgpa} / 10.0</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Core Committee</Text>
              <Text style={[styles.gridValue, { color: '#0C447C' }]}>Eligible (≥ 7.0 ✓)</Text>
            </View>
          </View>
        </View>

        {/* Engagement Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{ticketsList.length}</Text>
            <Text style={styles.statLabel}>Active Passes</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#D97706' }]}>1</Text>
            <Text style={styles.statLabel}>Trophies Won</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#0C447C' }]}>2</Text>
            <Text style={styles.statLabel}>Club Roles</Text>
          </View>
        </View>

        {/* Digital Event Passes Wallet */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.menuHeading}>My Digital Passes & Gate Tickets</Text>
          <Text style={styles.badgeCounter}>{ticketsList.length} Active</Text>
        </View>

        <View style={styles.ticketsWalletContainer}>
          {ticketsList.map((ticket) => (
            <TouchableOpacity 
              key={ticket.id} 
              style={styles.ticketWalletCard}
              onPress={() => setSelectedTicket(ticket)}
              activeOpacity={0.8}
            >
              <View style={styles.ticketLeft}>
                <View style={styles.qrMiniBox}>
                  <Ionicons name="qr-code-outline" size={24} color="#0C447C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ticketEventTitle} numberOfLines={1}>{ticket.eventTitle}</Text>
                  <Text style={styles.ticketClubText}>{ticket.clubName}</Text>
                  <Text style={styles.ticketVenueText}>📍 {ticket.venue}</Text>
                  <Text style={styles.ticketDateText}>📅 {ticket.date} · {ticket.time}</Text>
                </View>
              </View>

              <View style={styles.viewPassBtn}>
                <Text style={styles.viewPassText}>Show Pass ➔</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Menu */}
        <Text style={[styles.menuHeading, { marginTop: 16 }]}>Verified Student Credentials</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowCertificate(true)}>
            <View style={styles.menuIconBox}>
              <Ionicons name="ribbon-outline" size={18} color="#0C447C" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Digital Certificates & Merits</Text>
              <Text style={styles.menuDesc}>View and download verified event certificates</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowTranscript(true)}>
            <View style={styles.menuIconBox}>
              <Ionicons name="document-text-outline" size={18} color="#0C447C" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Annual Activity Transcript</Text>
              <Text style={styles.menuDesc}>Generate verified portfolio for NAAC & Placements</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* DYNAMIC QR GATE PASS MODAL */}
      {selectedTicket && (
        <Modal visible={true} transparent={true} animationType="slide" onRequestClose={() => setSelectedTicket(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.ticketModal}>
              <View style={styles.ticketHeader}>
                <View>
                  <Text style={styles.ticketHeaderEvent}>{selectedTicket.eventTitle}</Text>
                  <Text style={styles.ticketHeaderClub}>{selectedTicket.clubName}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTicket(null)}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.qrContainer}>
                <QRCode
                  value={selectedTicket.qrCodeString}
                  size={190}
                  color="#0C447C"
                  backgroundColor="#fff"
                />
                <Text style={styles.qrScanInstruction}>Present this QR Code at the Venue Gate</Text>
                <Text style={styles.qrSecurityCode}>TOKEN: {selectedTicket.qrCodeString}</Text>
              </View>

              <View style={styles.ticketDetailsBox}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Attendee Name</Text>
                  <Text style={styles.detailValue}>{selectedTicket.attendeeName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>PRN / Roll No</Text>
                  <Text style={styles.detailValue}>{selectedTicket.prn}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Venue</Text>
                  <Text style={styles.detailValue}>{selectedTicket.venue}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <Text style={styles.detailValue}>{selectedTicket.date} · {selectedTicket.time}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pass Tier</Text>
                  <Text style={[styles.detailValue, { color: '#16A34A', fontWeight: '800' }]}>{selectedTicket.ticketTier}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.ticketDoneBtn} onPress={() => setSelectedTicket(null)}>
                <Text style={styles.ticketDoneText}>Close Pass</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* DIGITAL CERTIFICATE MODAL */}
      {showCertificate && (
        <Modal visible={true} transparent={true} animationType="fade" onRequestClose={() => setShowCertificate(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.certCard}>
              <View style={styles.certBorder}>
                <View style={styles.certHeader}>
                  <Text style={styles.certInstitute}>VISHWAKARMA INSTITUTE OF TECHNOLOGY, PUNE</Text>
                  <Text style={styles.certHeading}>CERTIFICATE OF MERIT</Text>
                  <Text style={styles.certSub}>This is proudly presented to</Text>
                </View>

                <Text style={styles.certName}>{CURRENT_USER.name}</Text>
                <Text style={styles.certPrn}>PRN: {CURRENT_USER.prn} · Third Year Computer Engineering</Text>

                <Text style={styles.certBody}>
                  for outstanding performance & securing 1st Place (Championship Trophy) at the Pune TechFest Grand Hackathon 2026 organized by GedIT Technical Club.
                </Text>

                <View style={styles.certFooter}>
                  <View style={styles.certSign}>
                    <Text style={styles.signName}>Prof. Pankaj Kunekar</Text>
                    <Text style={styles.signRole}>Faculty Mentor, GedIT</Text>
                  </View>

                  <View style={styles.certSeal}>
                    <Ionicons name="shield-checkmark" size={28} color="#D97706" />
                    <Text style={styles.sealText}>VIT SEAL</Text>
                  </View>

                  <View style={styles.certSign}>
                    <Text style={styles.signName}>Dr. S. Kulkarni</Text>
                    <Text style={styles.signRole}>Dean Student Affairs</Text>
                  </View>
                </View>

                <Text style={styles.certCode}>Verification Code: CERT-VIT-2026-99182 · Tamper Proof</Text>
              </View>

              <View style={styles.certActionRow}>
                <TouchableOpacity style={styles.certCloseBtn} onPress={() => setShowCertificate(false)}>
                  <Text style={styles.certCloseText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.certDownloadBtn} onPress={() => handleDownload('Official Certificate PDF')}>
                  <Ionicons name="download-outline" size={16} color="#fff" />
                  <Text style={styles.certDownloadText}>Download Certificate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ACTIVITY TRANSCRIPT MODAL */}
      {showTranscript && (
        <Modal visible={true} transparent={true} animationType="slide" onRequestClose={() => setShowTranscript(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.transcriptCard}>
              <View style={styles.transcriptTop}>
                <View>
                  <Text style={styles.transcriptTitle}>Co-Curricular Activity Transcript</Text>
                  <Text style={styles.transcriptSub}>AY 2025–26 & 2026–27 · NAAC Criterion 5.3</Text>
                </View>
                <TouchableOpacity onPress={() => setShowTranscript(false)}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
                <View style={styles.transcriptRow}>
                  <Text style={styles.transcriptYear}>2026</Text>
                  <View style={styles.transcriptInfo}>
                    <Text style={styles.transcriptEvent}>Pune TechFest Grand Hackathon</Text>
                    <Text style={styles.transcriptRole}>1st Place Winner · ₹1,00,000 Prize Pool</Text>
                  </View>
                  <Text style={styles.transcriptBadge}>Winner 🥇</Text>
                </View>

                <View style={styles.transcriptRow}>
                  <Text style={styles.transcriptYear}>2026</Text>
                  <View style={styles.transcriptInfo}>
                    <Text style={styles.transcriptEvent}>Earn & Sell 2026 (EDC)</Text>
                    <Text style={styles.transcriptRole}>Student Entrepreneur Participant</Text>
                  </View>
                  <Text style={styles.transcriptBadge}>Registered ✓</Text>
                </View>

                <View style={styles.transcriptRow}>
                  <Text style={styles.transcriptYear}>2025</Text>
                  <View style={styles.transcriptInfo}>
                    <Text style={styles.transcriptEvent}>Autonomous Rover Challenge</Text>
                    <Text style={styles.transcriptRole}>The Robotics Forum (TRF) Attendee</Text>
                  </View>
                  <Text style={styles.transcriptBadge}>Completed</Text>
                </View>
              </ScrollView>

              <TouchableOpacity style={styles.certDownloadBtn} onPress={() => handleDownload('NAAC Activity Transcript PDF')}>
                <Ionicons name="download-outline" size={16} color="#fff" />
                <Text style={styles.certDownloadText}>Export Verified Transcript PDF</Text>
              </TouchableOpacity>
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
    paddingTop: 16,
    paddingBottom: 22,
    alignItems: 'center',
  },
  avatarLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#378ADD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 1,
  },
  userEmail: {
    color: '#B5D4F4',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  userSub: {
    color: '#E0E7FF',
    fontSize: 12,
    marginBottom: 8,
  },
  collegeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  collegeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    padding: 14,
  },
  passportCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  passportTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 12,
  },
  passportTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0C447C',
    letterSpacing: 0.8,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  passportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '46%',
  },
  gridLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  badgeCounter: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0C447C',
    backgroundColor: '#E6F1FB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ticketsWalletContainer: {
    gap: 8,
    marginBottom: 14,
  },
  ticketWalletCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  qrMiniBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#E6F1FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketEventTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  ticketClubText: {
    fontSize: 10.5,
    color: '#0C447C',
    fontWeight: '600',
  },
  ticketVenueText: {
    fontSize: 10,
    color: '#64748B',
  },
  ticketDateText: {
    fontSize: 9.5,
    color: '#94A3B8',
  },
  viewPassBtn: {
    backgroundColor: '#0C447C',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  viewPassText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#fff',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E6F1FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 1,
  },
  menuDesc: {
    fontSize: 11,
    color: '#64748b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  ticketModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    width: '100%',
    maxWidth: 380,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 14,
  },
  ticketHeaderEvent: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  ticketHeaderClub: {
    fontSize: 11,
    color: '#0C447C',
    fontWeight: '600',
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  qrScanInstruction: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 10,
  },
  qrSecurityCode: {
    fontSize: 8.5,
    fontFamily: 'monospace',
    color: '#94A3B8',
    marginTop: 2,
  },
  ticketDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  ticketDoneBtn: {
    backgroundColor: '#0C447C',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  ticketDoneText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  certCard: {
    backgroundColor: '#FFFDF7',
    borderRadius: 18,
    padding: 14,
    width: '100%',
    maxWidth: 380,
    borderWidth: 2,
    borderColor: '#D97706',
  },
  certBorder: {
    borderWidth: 1,
    borderColor: '#FBBF24',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  certHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  certInstitute: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0C447C',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  certHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: '#D97706',
    letterSpacing: 1,
    marginTop: 4,
  },
  certSub: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 2,
  },
  certName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  certPrn: {
    fontSize: 10,
    color: '#185FA5',
    fontWeight: '600',
    marginBottom: 10,
  },
  certBody: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  certFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    marginBottom: 8,
  },
  certSign: {
    alignItems: 'center',
  },
  signName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  signRole: {
    fontSize: 8.5,
    color: '#64748B',
  },
  certSeal: {
    alignItems: 'center',
  },
  sealText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#D97706',
  },
  certCode: {
    fontSize: 8.5,
    color: '#94A3B8',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  certActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  certCloseBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  certCloseText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  certDownloadBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0C447C',
    paddingVertical: 10,
    borderRadius: 8,
  },
  certDownloadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  transcriptCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    width: '100%',
    maxWidth: 380,
  },
  transcriptTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 12,
  },
  transcriptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  transcriptSub: {
    fontSize: 10.5,
    color: '#64748B',
  },
  transcriptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  transcriptYear: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0C447C',
    backgroundColor: '#E6F1FB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  transcriptInfo: {
    flex: 1,
  },
  transcriptEvent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  transcriptRole: {
    fontSize: 10.5,
    color: '#64748B',
  },
  transcriptBadge: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
