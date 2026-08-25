import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { CURRENT_USER, User, updateUserProfile, verifyGatePassToken, markAttendance } from '../services/clubSyncService';
import { DigitalTicket, MY_TICKETS, CLUBS, COLLEGES } from '../data/mockData';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [userProfile, setUserProfile] = useState<User>(CURRENT_USER);
  const [ticketsList, setTicketsList] = useState<DigitalTicket[]>(
    MY_TICKETS.map(t => ({ ...t, attendeeName: CURRENT_USER.name, prn: CURRENT_USER.prn, college: CURRENT_USER.collegeName }))
  );
  const [showCertificate, setShowCertificate] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<DigitalTicket | null>(null);

  // EDIT PROFILE STATE
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editEmail, setEditEmail] = useState(userProfile.email);
  const [editPrn, setEditPrn] = useState(userProfile.prn);
  const [editCollegeName, setEditCollegeName] = useState(userProfile.collegeName);
  const [editBranch, setEditBranch] = useState(userProfile.branch);
  const [editYear, setEditYear] = useState(userProfile.year);
  const [editCgpa, setEditCgpa] = useState(userProfile.cgpa.toString());
  const [editPhone, setEditPhone] = useState(userProfile.phone || '+91 98765 43210');
  const [editBio, setEditBio] = useState(userProfile.bio || 'Full Stack & AI Developer | Hackathon Enthusiast');
  const [editGithub, setEditGithub] = useState(userProfile.githubHandle || 'pranavvasu');
  const [editLinkedin, setEditLinkedin] = useState(userProfile.linkedinHandle || 'pranavvasu');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // GATE SCANNER STATE
  const [permission, requestPermission] = useCameraPermissions();
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResultData, setScanResultData] = useState<{ success: boolean; studentName?: string; prn?: string; eventTitle?: string; message: string } | null>(null);

  useEffect(() => {
    setUserProfile(CURRENT_USER);
  }, []);

  const handleOpenEditModal = () => {
    setEditName(userProfile.name);
    setEditEmail(userProfile.email);
    setEditPrn(userProfile.prn);
    setEditCollegeName(userProfile.collegeName);
    setEditBranch(userProfile.branch);
    setEditYear(userProfile.year);
    setEditCgpa(userProfile.cgpa.toString());
    setEditPhone(userProfile.phone || '');
    setEditBio(userProfile.bio || '');
    setEditGithub(userProfile.githubHandle || '');
    setEditLinkedin(userProfile.linkedinHandle || '');
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editPrn.trim()) {
      Alert.alert('Required Fields', 'Full Name and PRN/Roll Number cannot be empty.');
      return;
    }

    setIsSavingProfile(true);
    const parsedCgpa = parseFloat(editCgpa) || 8.5;

    const updated: Partial<User> = {
      name: editName.trim(),
      email: editEmail.trim(),
      prn: editPrn.trim(),
      collegeName: editCollegeName.trim(),
      branch: editBranch.trim(),
      year: editYear,
      cgpa: parsedCgpa,
      phone: editPhone.trim(),
      bio: editBio.trim(),
      githubHandle: editGithub.trim(),
      linkedinHandle: editLinkedin.trim(),
    };

    const res = await updateUserProfile(updated);
    setIsSavingProfile(false);
    setUserProfile(res.user);
    setShowEditModal(false);

    // Update tickets with new name
    setTicketsList(prev => prev.map(t => ({
      ...t,
      attendeeName: res.user.name,
      prn: res.user.prn,
      college: res.user.collegeName,
    })));

    Alert.alert('Profile Updated 🎉', 'Your Student Passport and Database records have been updated successfully.');
  };

  const handleDownload = (type: string) => {
    Alert.alert('Download Complete', `${type} saved to your device with cryptographic signature.`);
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (isScanning) return;
    setIsScanning(true);
    const res = await markAttendance(data);
    setScanResultData(res);
    
    // Auto-reset after 3 seconds
    setTimeout(() => {
      setScanResultData(null);
      setIsScanning(false);
    }, 3000);
  };

  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission required', 'We need camera access to scan QR codes.');
        return;
      }
    }
    setShowCameraScanner(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <View style={styles.headerTopActions}>
          <TouchableOpacity style={[styles.editProfileBtn, { backgroundColor: 'rgba(255, 255, 255, 0.18)' }]} onPress={toggleTheme}>
            <Ionicons name={isDarkMode ? "sunny" : "moon"} size={14} color="#fff" />
            <Text style={styles.editProfileBtnText}>{isDarkMode ? "Light Mode" : "Dark Mode"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.editProfileBtn} onPress={handleOpenEditModal}>
            <Ionicons name="create-outline" size={15} color="#fff" />
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>{userProfile.name.substring(0, 2).toUpperCase()}</Text>
        </View>
        <Text style={styles.userName}>{userProfile.name}</Text>
        <Text style={styles.userEmail}>{userProfile.email}</Text>
        <Text style={styles.userSub}>{userProfile.branch} · {userProfile.year}</Text>

        <View style={styles.collegeBadge}>
          <Ionicons name="school" size={13} color="#fff" />
          <Text style={styles.collegeBadgeText}>{userProfile.collegeName}</Text>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {userProfile.role === 'observer' ? (
          <View style={[styles.passportCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.passportTop, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.passportTitle, { color: isDarkMode ? theme.primary : '#0C447C' }]}>OBSERVER DASHBOARD</Text>
              <View style={styles.verifiedTag}>
                <Ionicons name="shield-checkmark" size={12} color="#16a34a" />
                <Text style={styles.verifiedText}>FACULTY / ADMIN</Text>
              </View>
            </View>

            <View style={styles.passportGrid}>
              <View style={styles.gridItem}>
                <Text style={[styles.gridLabel, { color: theme.textMuted }]}>Name</Text>
                <Text style={[styles.gridValue, { color: theme.text }]}>{userProfile.name}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={[styles.gridLabel, { color: theme.textMuted }]}>Designation</Text>
                <Text style={[styles.gridValue, { color: theme.text }]}>{userProfile.bio || 'Faculty In-Charge'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={[styles.gridLabel, { color: theme.textMuted }]}>Institution</Text>
                <Text style={[styles.gridValue, { color: theme.text }]}>{userProfile.collegeName}</Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            {/* Student Passport Card */}
            <View style={[styles.passportCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.passportTop, { borderBottomColor: theme.divider }]}>
                <Text style={[styles.passportTitle, { color: isDarkMode ? theme.primary : '#0C447C' }]}>CLUBSYNC STUDENT PASSPORT</Text>
                <View style={styles.verifiedTag}>
                  <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
                  <Text style={styles.verifiedText}>DB VERIFIED</Text>
                </View>
              </View>

              <View style={styles.passportGrid}>
                <View style={styles.gridItem}>
                  <Text style={[styles.gridLabel, { color: theme.textMuted }]}>PRN / Roll No</Text>
                  <Text style={[styles.gridValue, { color: theme.text }]}>{userProfile.prn}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={[styles.gridLabel, { color: theme.textMuted }]}>Academic Year</Text>
                  <Text style={[styles.gridValue, { color: theme.text }]}>{userProfile.year.includes('FY') ? '2026–27 (FY)' : userProfile.year.includes('SY') ? '2026–27 (SY)' : '2026–27 (TY)'}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={[styles.gridLabel, { color: theme.textMuted }]}>Cumulative CGPA</Text>
                  <Text style={[styles.gridValue, { color: '#16a34a' }]}>{userProfile.cgpa.toFixed(2)} / 10.0</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={[styles.gridLabel, { color: theme.textMuted }]}>Core Committee</Text>
                  <Text style={[styles.gridValue, { color: isDarkMode ? theme.primary : '#0C447C' }]}>{userProfile.cgpa >= 7.0 ? 'Eligible (≥ 7.0 ✓)' : 'Not Eligible (< 7.0)'}</Text>
                </View>
              </View>

              {userProfile.bio ? (
                <View style={[styles.bioBox, { borderTopColor: theme.divider }]}>
                  <Text style={[styles.bioText, { color: theme.textSecondary }]}>"{userProfile.bio}"</Text>
                </View>
              ) : null}
            </View>

            {/* Engagement Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.statNum, { color: theme.text }]}>{ticketsList.length}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Active Passes</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.statNum, { color: '#D97706' }]}>1</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Trophies Won</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.statNum, { color: isDarkMode ? theme.primary : '#0C447C' }]}>{CLUBS.filter(c => c.isFollowed).length}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Followed Clubs</Text>
              </View>
            </View>

            {/* Digital Event Passes Wallet */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.menuHeading, { color: theme.text }]}>My Digital Passes & Gate Tickets</Text>
              <Text style={[styles.badgeCounter, { backgroundColor: theme.badgeBg, color: theme.badgeText }]}>{ticketsList.length} Active</Text>
            </View>

            <View style={styles.ticketsWalletContainer}>
              {ticketsList.map((ticket) => (
                <TouchableOpacity 
                  key={ticket.id} 
                  style={[styles.ticketWalletCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={() => setSelectedTicket(ticket)}
                  activeOpacity={0.8}
                >
                  <View style={styles.ticketLeft}>
                    <View style={[styles.qrMiniBox, { backgroundColor: theme.badgeBg }]}>
                      <Ionicons name="qr-code-outline" size={24} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.ticketEventTitle, { color: theme.text }]} numberOfLines={1}>{ticket.eventTitle}</Text>
                      <Text style={[styles.ticketClubText, { color: theme.primary }]}>{ticket.clubName}</Text>
                      <Text style={[styles.ticketVenueText, { color: theme.textSecondary }]}>📍 {ticket.venue}</Text>
                      <Text style={[styles.ticketDateText, { color: theme.textMuted }]}>📅 {ticket.date} · {ticket.time}</Text>
                    </View>
                  </View>

                  <View style={[styles.viewPassBtn, { backgroundColor: isDarkMode ? theme.primary : '#0C447C' }]}>
                    <Text style={[styles.viewPassText, { color: isDarkMode ? '#0F172A' : '#fff' }]}>Show Pass ➔</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Preferences & Action Menu */}
        <Text style={[styles.menuHeading, { color: theme.text, marginTop: 16 }]}>Preferences & Appearance</Text>
        <View style={[styles.menuContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.divider }]} onPress={toggleTheme}>
            <View style={[styles.menuIconBox, { backgroundColor: theme.badgeBg }]}>
              <Ionicons name={isDarkMode ? "sunny" : "moon"} size={18} color={theme.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>App Theme (Dark Mode)</Text>
              <Text style={[styles.menuDesc, { color: theme.textSecondary }]}>{isDarkMode ? "Dark Theme Enabled (Tap to switch to Light)" : "Light Theme Enabled (Tap to switch to Dark)"}</Text>
            </View>
            <Ionicons name={isDarkMode ? "toggle" : "toggle-outline"} size={26} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.menuHeading, { color: theme.text, marginTop: 16 }]}>Activity & Credentials</Text>
        <View style={[styles.menuContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {userProfile.canScanQR === true && (
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.divider }]} onPress={handleOpenScanner}>
              <View style={[styles.menuIconBox, { backgroundColor: theme.badgeBg }]}>
                <Ionicons name="qr-code-outline" size={18} color={theme.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: theme.text }]}>Scan & Mark Attendance</Text>
                <Text style={[styles.menuDesc, { color: theme.textSecondary }]}>Scan attendee tickets at the gate</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.divider }]} onPress={() => setShowCertificate(true)}>
            <View style={[styles.menuIconBox, { backgroundColor: theme.badgeBg }]}>
              <Ionicons name="ribbon-outline" size={18} color={theme.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Digital Certificates & Merits</Text>
              <Text style={[styles.menuDesc, { color: theme.textSecondary }]}>View and download verified event certificates</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.divider }]} onPress={() => setShowTranscript(true)}>
            <View style={[styles.menuIconBox, { backgroundColor: theme.badgeBg }]}>
              <Ionicons name="document-text-outline" size={18} color={theme.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Annual Activity Transcript</Text>
              <Text style={[styles.menuDesc, { color: theme.textSecondary }]}>Generate verified portfolio for NAAC & Placements</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* FULL EDIT PROFILE MODAL */}
      {showEditModal && (
        <Modal visible={true} transparent={true} animationType="slide" onRequestClose={() => setShowEditModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.editProfileCard}>
              <View style={styles.editProfileHeader}>
                <Text style={styles.editProfileTitle}>Edit Student Profile</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <View style={styles.editFormGroup}>
                  <Text style={styles.editLabel}>Full Name *</Text>
                  <TextInput style={styles.editInput} value={editName} onChangeText={setEditName} />

                  <Text style={styles.editLabel}>PRN / Roll Number *</Text>
                  <TextInput style={styles.editInput} value={editPrn} onChangeText={setEditPrn} autoCapitalize="characters" />

                  <Text style={styles.editLabel}>College / Institute Name</Text>
                  <TextInput style={styles.editInput} value={editCollegeName} onChangeText={setEditCollegeName} />

                  <Text style={styles.editLabel}>Branch / Department</Text>
                  <TextInput style={styles.editInput} value={editBranch} onChangeText={setEditBranch} />

                  <Text style={styles.editLabel}>Cumulative CGPA (0.00 - 10.00)</Text>
                  <TextInput style={styles.editInput} value={editCgpa} onChangeText={setEditCgpa} keyboardType="numeric" />

                  <Text style={styles.editLabel}>Phone Number</Text>
                  <TextInput style={styles.editInput} value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" />

                  <Text style={styles.editLabel}>Bio / Headline</Text>
                  <TextInput style={[styles.editInput, { height: 60 }]} value={editBio} onChangeText={setEditBio} multiline />

                  <Text style={styles.editLabel}>GitHub Username</Text>
                  <TextInput style={styles.editInput} value={editGithub} onChangeText={setEditGithub} autoCapitalize="none" />

                  <Text style={styles.editLabel}>LinkedIn Username</Text>
                  <TextInput style={styles.editInput} value={editLinkedin} onChangeText={setEditLinkedin} autoCapitalize="none" />
                </View>
              </ScrollView>

              <View style={styles.editActionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={isSavingProfile}>
                  {isSavingProfile ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

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
                  size={180}
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

      {/* REAL CAMERA SCANNER MODAL */}
      {showCameraScanner && (
        <Modal visible={true} transparent={true} animationType="slide" onRequestClose={() => setShowCameraScanner(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.scannerModal, { padding: 0, overflow: 'hidden', height: '70%', width: '90%' }]}>
              <View style={[styles.ticketHeader, { padding: 16, backgroundColor: '#0F172A' }]}>
                <Text style={[styles.ticketHeaderEvent, { color: '#fff' }]}>Gatekeeper Check-in</Text>
                <TouchableOpacity onPress={() => setShowCameraScanner(false)}>
                  <Ionicons name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1, backgroundColor: '#000', position: 'relative' }}>
                <CameraView
                  style={StyleSheet.absoluteFillObject}
                  facing="back"
                  onBarcodeScanned={isScanning ? undefined : handleBarcodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                  }}
                />
                
                {/* Scanner Overlay UI */}
                <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} />
                  <View style={{ flexDirection: 'row', height: 250 }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} />
                    <View style={{ width: 250, borderColor: '#16A34A', borderWidth: 2, backgroundColor: 'transparent' }} />
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} />
                  </View>
                  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} />
                </View>

                {/* Scan Result Floating Card */}
                {scanResultData && (
                  <View style={{ position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 5, alignItems: 'center' }}>
                    {scanResultData.success ? (
                      <>
                        <Ionicons name="checkmark-circle" size={48} color="#16A34A" />
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 8 }}>{scanResultData.message}</Text>
                        <Text style={{ fontSize: 16, color: '#334155', marginTop: 4 }}>{scanResultData.studentName}</Text>
                        <Text style={{ fontSize: 14, color: '#64748B' }}>PRN: {scanResultData.prn}</Text>
                        <Text style={{ fontSize: 14, color: '#64748B', marginTop: 8 }}>{scanResultData.eventTitle}</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="close-circle" size={48} color="#DC2626" />
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#DC2626', marginTop: 8 }}>{scanResultData.message}</Text>
                      </>
                    )}
                  </View>
                )}
              </View>
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
                  <Text style={styles.certInstitute}>{userProfile.collegeName.toUpperCase()}</Text>
                  <Text style={styles.certHeading}>CERTIFICATE OF MERIT</Text>
                  <Text style={styles.certSub}>This is proudly presented to</Text>
                </View>

                <Text style={styles.certName}>{userProfile.name}</Text>
                <Text style={styles.certPrn}>PRN: {userProfile.prn} · {userProfile.year} {userProfile.branch}</Text>

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
    paddingTop: 12,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTopActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  editProfileBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#378ADD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  userName: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 1,
  },
  userEmail: {
    color: '#B5D4F4',
    fontSize: 11.5,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  userSub: {
    color: '#E0E7FF',
    fontSize: 11.5,
    marginBottom: 6,
  },
  collegeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
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
  bioBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  bioText: {
    fontSize: 11.5,
    fontStyle: 'italic',
    color: '#64748B',
    textAlign: 'center',
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
  editProfileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    width: '100%',
    maxWidth: 400,
  },
  editProfileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 12,
  },
  editProfileTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  editFormGroup: {
    gap: 10,
  },
  editLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: -4,
  },
  editInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  editActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#0C447C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
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
  scannerModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    width: '100%',
    maxWidth: 380,
  },
  scannerInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#0F172A',
    marginBottom: 10,
  },
  scanResultBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  scanSuccess: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  scanFail: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  scanResultText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
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
    fontSize: 8,
    fontFamily: 'monospace',
    color: '#94A3B8',
    marginTop: 6,
  },
  certActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  certCloseBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  certCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  certDownloadBtn: {
    flex: 2,
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
    padding: 16,
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
    fontWeight: '800',
    color: '#0F172A',
  },
  transcriptSub: {
    fontSize: 10,
    color: '#64748B',
  },
  transcriptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  transcriptRole: {
    fontSize: 10,
    color: '#64748B',
  },
  transcriptBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
});
