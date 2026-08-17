import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Linking, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Club, CLUBS, CoreLead, ClubFlagshipEvent, ClubAchievement, RecruitmentPosition } from '../data/mockData';
import { CURRENT_USER } from '../services/clubSyncService';

type SortOption = 'members' | 'hiring' | 'alphabetical' | 'year';
type ClubDetailTab = 'overview' | 'leadership' | 'events' | 'achievements' | 'recruitment' | 'faqs';

interface ClubsScreenProps {
  initialSortHiring?: boolean;
}

export default function ClubsScreen({ initialSortHiring }: ClubsScreenProps) {
  const [clubsList, setClubsList] = useState<Club[]>(CLUBS);
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>(initialSortHiring ? 'hiring' : 'members');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<ClubDetailTab>('overview');
  const [showSortModal, setShowSortModal] = useState(false);
  const [appliedRoles, setAppliedRoles] = useState<{ [key: string]: boolean }>({});

  // PRESIDENT / FACULTY EDIT MODE STATE
  const [isPresidentMode, setIsPresidentMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTagline, setEditTagline] = useState('');
  const [editVision, setEditVision] = useState('');
  const [editMission, setEditMission] = useState('');
  const [editWorkshop, setEditWorkshop] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editDeadline, setEditDeadline] = useState('');

  const domainOptions = [
    { label: 'All', count: clubsList.length },
    { label: 'Entrepreneurship', count: clubsList.filter(c => c.vertical === 'Entrepreneurship').length },
    { label: 'Technical', count: clubsList.filter(c => c.vertical === 'Technical').length },
    { label: 'Cultural', count: clubsList.filter(c => c.vertical === 'Cultural').length },
    { label: 'Sports', count: clubsList.filter(c => c.vertical === 'Sports').length },
    { label: 'Literary', count: clubsList.filter(c => c.vertical === 'Literary').length },
    { label: 'Social', count: clubsList.filter(c => c.vertical === 'Social').length },
    { label: 'Others', count: clubsList.filter(c => c.vertical === 'Others').length },
  ];

  const sortLabels: { [key in SortOption]: string } = {
    members: '👥 Most Members (High to Low)',
    hiring: '🔥 Hiring Open First',
    alphabetical: '🔤 Alphabetical (A to Z)',
    year: '🏛️ Established (Heritage)',
  };

  // Filter by Domain & Search
  let filteredClubs = clubsList.filter((club) => {
    if (selectedDomain !== 'All' && club.vertical !== selectedDomain) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        club.name.toLowerCase().includes(q) ||
        club.shortName.toLowerCase().includes(q) ||
        club.facultyMentor.toLowerCase().includes(q) ||
        club.description.toLowerCase().includes(q) ||
        club.clubNo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sort
  filteredClubs.sort((a, b) => {
    if (sortBy === 'members') return b.membersCount - a.membersCount;
    if (sortBy === 'hiring') {
      if (a.openRecruitment === b.openRecruitment) return 0;
      return a.openRecruitment ? -1 : 1;
    }
    if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
    if (sortBy === 'year') return a.establishedYear - b.establishedYear;
    return 0;
  });

  const handleOpenClub = (club: Club) => {
    setSelectedClub(club);
    setActiveDetailTab('overview');
    setEditTagline(club.tagline || '');
    setEditVision(club.vision || '');
    setEditMission(club.mission || '');
    setEditWorkshop(club.workshopOrRoom || '');
    setEditWhatsapp(club.whatsappGroup || '');
    setEditDeadline(club.recruitmentDeadline || '');
  };

  const handleApplyRole = (roleTitle: string) => {
    setAppliedRoles(prev => ({ ...prev, [roleTitle]: true }));
    Alert.alert(
      'Application Submitted!',
      `Your application for "${roleTitle}" has been sent to the President & Faculty Mentor. CGPA (${CURRENT_USER.cgpa}) verified.`
    );
  };

  const openLink = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error("Couldn't open link", err));
    }
  };

  const handleSavePresidentEdits = () => {
    if (!selectedClub) return;
    const updated = {
      ...selectedClub,
      tagline: editTagline,
      vision: editVision,
      mission: editMission,
      workshopOrRoom: editWorkshop,
      whatsappGroup: editWhatsapp,
      recruitmentDeadline: editDeadline,
    };
    setSelectedClub(updated);
    setClubsList(prev => prev.map(c => c.id === updated.id ? updated : c));
    setShowEditModal(false);
    Alert.alert('Changes Published Live!', 'Club details have been updated and synced to all students in real time.');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>College Clubs & Chapters</Text>
            <Text style={styles.headerSub}>Explore all {clubsList.length} Approved Student Organizations</Text>
          </View>

          {/* Role Toggle: Student vs President / Authority */}
          <TouchableOpacity 
            style={[styles.roleSwitchBtn, isPresidentMode && styles.roleSwitchBtnActive]}
            onPress={() => setIsPresidentMode(!isPresidentMode)}
          >
            <Ionicons name={isPresidentMode ? "shield-checkmark" : "person-outline"} size={13} color={isPresidentMode ? "#fff" : "#B5D4F4"} />
            <Text style={[styles.roleSwitchText, isPresidentMode && styles.roleSwitchTextActive]}>
              {isPresidentMode ? "President Mode" : "Student View"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#B5D4F4" />
          <TextInput 
            placeholder="Search EDC, CSI, Formula Racing, Mentors..." 
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

      {/* Domain Category Filter Chips */}
      <View style={styles.chipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {domainOptions.map((opt) => (
            <TouchableOpacity 
              key={opt.label}
              style={[styles.chip, selectedDomain === opt.label && styles.chipActive]}
              onPress={() => setSelectedDomain(opt.label)}
            >
              <Text style={[styles.chipText, selectedDomain === opt.label && styles.chipTextActive]}>
                {opt.label} ({opt.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sort & Result Bar */}
      <View style={styles.sortBar}>
        <Text style={styles.resultCountText}>
          {filteredClubs.length} Clubs in {selectedDomain}
        </Text>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSortModal(true)}>
          <Ionicons name="swap-vertical" size={13} color="#0C447C" />
          <Text style={styles.sortBtnText}>{sortLabels[sortBy]}</Text>
        </TouchableOpacity>
      </View>

      {/* Clubs List */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filteredClubs.map((club) => (
          <TouchableOpacity 
            key={club.id} 
            style={styles.clubCard}
            onPress={() => handleOpenClub(club)}
            activeOpacity={0.8}
          >
            <View style={[styles.clubLogo, { backgroundColor: club.logoBg }]}>
              <Text style={styles.clubLogoText}>{club.shortName.substring(0, 2).toUpperCase()}</Text>
            </View>

            <View style={styles.clubInfo}>
              <View style={styles.badgeRow}>
                <Text style={styles.verticalBadge}>{club.vertical}</Text>
                {club.openRecruitment && (
                  <View style={styles.hiringBadge}>
                    <Text style={styles.hiringText}>Hiring Open</Text>
                  </View>
                )}
              </View>

              <Text style={styles.clubName}>{club.name}</Text>
              {club.tagline && <Text style={styles.taglineText} numberOfLines={1}>"{club.tagline}"</Text>}
              <Text style={styles.mentorText}>Mentor: {club.facultyMentor}</Text>
              <Text style={styles.clubDesc} numberOfLines={2}>{club.description}</Text>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="people-outline" size={12} color="#64748b" />
                  <Text style={styles.statItemText}>{club.membersCount} members</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="location-outline" size={12} color="#64748b" />
                  <Text style={styles.statItemText} numberOfLines={1}>{club.workshopOrRoom || club.campus}</Text>
                </View>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* SORT MODAL */}
      {showSortModal && (
        <Modal visible={true} transparent={true} animationType="fade" onRequestClose={() => setShowSortModal(false)}>
          <View style={styles.sortModalOverlay}>
            <View style={styles.sortModalBox}>
              <View style={styles.sortModalTop}>
                <Text style={styles.sortModalHeadline}>Sort Clubs By</Text>
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

      {/* ========================================================================= */}
      {/* 360-DEGREE FULL CLUB DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedClub && (
        <Modal visible={true} animationType="slide" transparent={true} onRequestClose={() => setSelectedClub(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.fullClubModal}>
              {/* Modal Top Bar */}
              <View style={styles.clubModalTopBar}>
                <View style={styles.clubModalTitleBox}>
                  <View style={[styles.modalLogo, { backgroundColor: selectedClub.logoBg }]}>
                    <Text style={styles.modalLogoText}>{selectedClub.shortName.substring(0, 2)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.modalBadgeLine}>
                      <Text style={styles.clubCodeBadge}>{selectedClub.clubNo}</Text>
                      <Text style={styles.verticalBadge}>{selectedClub.vertical}</Text>
                    </View>
                    <Text style={styles.modalClubTitle} numberOfLines={1}>{selectedClub.name}</Text>
                    {selectedClub.tagline && <Text style={styles.modalTagline}>"{selectedClub.tagline}"</Text>}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {isPresidentMode && (
                    <TouchableOpacity style={styles.editClubBtn} onPress={() => setShowEditModal(true)}>
                      <Ionicons name="pencil" size={14} color="#fff" />
                      <Text style={styles.editClubBtnText}>Edit Info</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => setSelectedClub(null)} style={styles.closeBtn}>
                    <Ionicons name="close" size={22} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sub-Navigation Tabs */}
              <View style={styles.subTabsRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabsScroll}>
                  <TouchableOpacity 
                    style={[styles.subTab, activeDetailTab === 'overview' && styles.subTabActive]}
                    onPress={() => setActiveDetailTab('overview')}
                  >
                    <Text style={[styles.subTabText, activeDetailTab === 'overview' && styles.subTabTextActive]}>Overview</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.subTab, activeDetailTab === 'leadership' && styles.subTabActive]}
                    onPress={() => setActiveDetailTab('leadership')}
                  >
                    <Text style={[styles.subTabText, activeDetailTab === 'leadership' && styles.subTabTextActive]}>Leadership & Mentors</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.subTab, activeDetailTab === 'events' && styles.subTabActive]}
                    onPress={() => setActiveDetailTab('events')}
                  >
                    <Text style={[styles.subTabText, activeDetailTab === 'events' && styles.subTabTextActive]}>
                      Flagship Events ({selectedClub.flagshipEvents?.length || 0})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.subTab, activeDetailTab === 'achievements' && styles.subTabActive]}
                    onPress={() => setActiveDetailTab('achievements')}
                  >
                    <Text style={[styles.subTabText, activeDetailTab === 'achievements' && styles.subTabTextActive]}>
                      Trophies & Merits ({selectedClub.achievements?.length || 0})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.subTab, activeDetailTab === 'recruitment' && styles.subTabActive]}
                    onPress={() => setActiveDetailTab('recruitment')}
                  >
                    <Text style={[styles.subTabText, activeDetailTab === 'recruitment' && styles.subTabTextActive]}>
                      Recruitment Desk 🔥
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.subTab, activeDetailTab === 'faqs' && styles.subTabActive]}
                    onPress={() => setActiveDetailTab('faqs')}
                  >
                    <Text style={[styles.subTabText, activeDetailTab === 'faqs' && styles.subTabTextActive]}>FAQs & Connect</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              {/* Scrollable Tab Body */}
              <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>

                {/* 1. OVERVIEW TAB */}
                {activeDetailTab === 'overview' && (
                  <View style={styles.tabContent}>
                    <Text style={styles.sectionHeading}>About the Organization</Text>
                    <Text style={styles.bodyParagraph}>{selectedClub.description}</Text>

                    {selectedClub.vision && (
                      <View style={styles.visionCard}>
                        <View style={styles.visionHeader}>
                          <Ionicons name="eye-outline" size={16} color="#0C447C" />
                          <Text style={styles.visionTitle}>Our Vision</Text>
                        </View>
                        <Text style={styles.visionText}>{selectedClub.vision}</Text>
                      </View>
                    )}

                    {selectedClub.mission && (
                      <View style={styles.missionCard}>
                        <View style={styles.visionHeader}>
                          <Ionicons name="rocket-outline" size={16} color="#16A34A" />
                          <Text style={[styles.visionTitle, { color: '#16A34A' }]}>Our Mission</Text>
                        </View>
                        <Text style={styles.visionText}>{selectedClub.mission}</Text>
                      </View>
                    )}

                    {/* Quick Info Grid */}
                    <Text style={[styles.sectionHeading, { marginTop: 14 }]}>Official Club Information</Text>
                    <View style={styles.infoGridBox}>
                      <View style={styles.infoGridRow}>
                        <Text style={styles.infoGridLabel}>Established Year</Text>
                        <Text style={styles.infoGridValue}>{selectedClub.establishedYear} (Heritage)</Text>
                      </View>
                      <View style={styles.infoGridRow}>
                        <Text style={styles.infoGridLabel}>Primary Workshop / Lab</Text>
                        <Text style={styles.infoGridValue}>{selectedClub.workshopOrRoom || selectedClub.campus}</Text>
                      </View>
                      <View style={styles.infoGridRow}>
                        <Text style={styles.infoGridLabel}>Total Active Strength</Text>
                        <Text style={styles.infoGridValue}>{selectedClub.membersCount} Verified Students</Text>
                      </View>
                      <View style={styles.infoGridRow}>
                        <Text style={styles.infoGridLabel}>Faculty Mentor</Text>
                        <Text style={[styles.infoGridValue, { color: '#0C447C' }]}>{selectedClub.facultyMentor}</Text>
                      </View>
                      <View style={styles.infoGridRow}>
                        <Text style={styles.infoGridLabel}>Official Email</Text>
                        <Text style={[styles.infoGridValue, { color: '#0C447C' }]}>{selectedClub.officialEmail || `${selectedClub.shortName.toLowerCase()}@vit.edu`}</Text>
                      </View>
                    </View>

                    {/* Direct Community Connect Buttons */}
                    <Text style={[styles.sectionHeading, { marginTop: 14 }]}>Direct In-App Channels (No External Site Needed)</Text>
                    <View style={styles.communityGrid}>
                      {selectedClub.whatsappGroup && (
                        <TouchableOpacity style={styles.commBtn} onPress={() => openLink(selectedClub.whatsappGroup)}>
                          <Ionicons name="logo-whatsapp" size={18} color="#16A34A" />
                          <Text style={styles.commBtnText}>WhatsApp Community</Text>
                        </TouchableOpacity>
                      )}

                      {selectedClub.discord && (
                        <TouchableOpacity style={styles.commBtn} onPress={() => openLink(selectedClub.discord)}>
                          <Ionicons name="logo-discord" size={18} color="#5865F2" />
                          <Text style={styles.commBtnText}>Official Discord</Text>
                        </TouchableOpacity>
                      )}

                      {selectedClub.websiteUrl && (
                        <TouchableOpacity style={styles.commBtn} onPress={() => openLink(selectedClub.websiteUrl)}>
                          <Ionicons name="globe-outline" size={18} color="#0C447C" />
                          <Text style={styles.commBtnText}>Website ({selectedClub.websiteUrl.replace('https://', '')})</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}

                {/* 2. LEADERSHIP TAB */}
                {activeDetailTab === 'leadership' && (
                  <View style={styles.tabContent}>
                    {/* Faculty Mentor Card */}
                    <Text style={styles.sectionHeading}>Institutional Faculty Mentorship</Text>
                    <View style={styles.mentorBannerCard}>
                      <View style={styles.mentorAvatarBox}>
                        <Ionicons name="school" size={24} color="#0C447C" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mentorCardName}>{selectedClub.facultyMentor}</Text>
                        <Text style={styles.mentorCardDesig}>{selectedClub.facultyDesignation || 'Professor & Faculty In-Charge'}</Text>
                        <Text style={styles.mentorCardInst}>Vishwakarma Institute of Technology, Pune</Text>
                      </View>
                    </View>

                    {/* President Card */}
                    <Text style={[styles.sectionHeading, { marginTop: 16 }]}>Student Executive Leadership (AY 2025–26)</Text>
                    <View style={styles.presidentCard}>
                      <View style={styles.presidentTop}>
                        <View style={styles.presAvatar}>
                          <Text style={styles.presAvatarText}>PR</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.presBadge}>CLUB PRESIDENT</Text>
                          <Text style={styles.presName}>{selectedClub.presidentName || 'President In-Charge'}</Text>
                          <Text style={styles.presContact}>{selectedClub.presidentContact || 'Authorized Representative'}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Core Committee Leads */}
                    <Text style={[styles.sectionHeading, { marginTop: 14 }]}>Official Core Committee Members ({selectedClub.coreCommittee?.length || 0})</Text>
                    {selectedClub.coreCommittee && selectedClub.coreCommittee.length > 0 ? (
                      selectedClub.coreCommittee.map((lead) => (
                        <View key={lead.name} style={styles.coreLeadCard}>
                          <View style={styles.leadAvatar}>
                            <Text style={styles.leadAvatarText}>{lead.avatarText}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.leadName}>{lead.name}</Text>
                            <Text style={styles.leadRole}>{lead.role}</Text>
                            {lead.branch && <Text style={styles.leadDept}>{lead.year ? `${lead.year} · ` : ''}{lead.branch}</Text>}
                          </View>
                          {lead.email && (
                            <TouchableOpacity onPress={() => openLink(`mailto:${lead.email}`)}>
                              <Ionicons name="mail-outline" size={18} color="#0C447C" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noInfoText}>Core committee appointments verified by Dean Student Affairs.</Text>
                    )}
                  </View>
                )}

                {/* 3. FLAGSHIP EVENTS TAB */}
                {activeDetailTab === 'events' && (
                  <View style={styles.tabContent}>
                    <Text style={styles.sectionHeading}>Annual Signature Festivals & Competitions</Text>
                    {selectedClub.flagshipEvents && selectedClub.flagshipEvents.length > 0 ? (
                      selectedClub.flagshipEvents.map((evt) => (
                        <View key={evt.id} style={styles.flagshipCard}>
                          <View style={styles.flagshipTop}>
                            <View>
                              <Text style={styles.flagshipTitle}>{evt.title}</Text>
                              <Text style={styles.flagshipTagline}>"{evt.tagline}"</Text>
                            </View>
                            {evt.prizePool && (
                              <View style={styles.prizeBadge}>
                                <Text style={styles.prizeBadgeText}>{evt.prizePool}</Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.flagshipMetaRow}>
                            <Text style={styles.flagshipTimeline}>📅 {evt.timeline}</Text>
                            <Text style={styles.flagshipFootfall}>👥 {evt.footfall}</Text>
                          </View>

                          <Text style={styles.flagshipDesc}>{evt.description}</Text>

                          <Text style={styles.highlightsHeader}>Key Event Highlights:</Text>
                          {evt.highlights.map((h, i) => (
                            <Text key={i} style={styles.highlightItem}>• {h}</Text>
                          ))}
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noInfoText}>Flagship events scheduled for AY 2026–27.</Text>
                    )}
                  </View>
                )}

                {/* 4. ACHIEVEMENTS & LEGACY TAB */}
                {activeDetailTab === 'achievements' && (
                  <View style={styles.tabContent}>
                    <Text style={styles.sectionHeading}>Awards, Trophies & National Accolades</Text>
                    {selectedClub.achievements && selectedClub.achievements.length > 0 ? (
                      selectedClub.achievements.map((ach, idx) => (
                        <View key={idx} style={styles.achievementCard}>
                          <View style={styles.achieveIconBox}>
                            <Ionicons name="trophy" size={24} color="#D97706" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={styles.achieveTop}>
                              <Text style={styles.achieveTitle}>{ach.title}</Text>
                              <Text style={styles.achieveRank}>{ach.rankBadge}</Text>
                            </View>
                            <Text style={styles.achieveYear}>Awarded: {ach.year}</Text>
                            <Text style={styles.achieveDesc}>{ach.description}</Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noInfoText}>Club achievements verified under Institutional NAAC records.</Text>
                    )}
                  </View>
                )}

                {/* 5. RECRUITMENT DESK TAB */}
                {activeDetailTab === 'recruitment' && (
                  <View style={styles.tabContent}>
                    <View style={styles.recruitBanner}>
                      <View style={styles.recruitBannerHeader}>
                        <Ionicons name="sparkles" size={18} color="#fff" />
                        <Text style={styles.recruitBannerTitle}>Core Team Recruitment AY 2026–27</Text>
                      </View>
                      <Text style={styles.recruitBannerSub}>Deadline: {selectedClub.recruitmentDeadline || 'Open'} · Min CGPA: 7.0 (Verified)</Text>
                    </View>

                    {/* Selection Process Pipeline */}
                    <Text style={[styles.sectionHeading, { marginTop: 14 }]}>Official 3-Stage Selection Process</Text>
                    {selectedClub.recruitmentRounds?.map((rnd, i) => (
                      <View key={i} style={styles.roundCard}>
                        <View style={styles.roundNum}><Text style={styles.roundNumText}>{i + 1}</Text></View>
                        <Text style={styles.roundText}>{rnd}</Text>
                      </View>
                    ))}

                    {/* Open Positions */}
                    <Text style={[styles.sectionHeading, { marginTop: 14 }]}>Open Executive Positions</Text>
                    {selectedClub.recruitmentPositions && selectedClub.recruitmentPositions.length > 0 ? (
                      selectedClub.recruitmentPositions.map((pos) => (
                        <View key={pos.title} style={styles.positionCard}>
                          <View style={styles.posTop}>
                            <View>
                              <Text style={styles.posTitle}>{pos.title}</Text>
                              <Text style={styles.posDept}>{pos.department} · {pos.openings} Openings</Text>
                            </View>
                            <TouchableOpacity 
                              style={[styles.applyPosBtn, appliedRoles[pos.title] && styles.applyPosBtnDone]}
                              onPress={() => handleApplyRole(pos.title)}
                              disabled={appliedRoles[pos.title]}
                            >
                              <Text style={styles.applyPosBtnText}>{appliedRoles[pos.title] ? 'Applied ✓' : 'Apply Now'}</Text>
                            </TouchableOpacity>
                          </View>

                          <Text style={styles.posDesc}>{pos.description}</Text>

                          <View style={styles.skillsRow}>
                            {pos.skills.map((s) => (
                              <Text key={s} style={styles.skillChip}>{s}</Text>
                            ))}
                          </View>
                        </View>
                      ))
                    ) : (
                      selectedClub.recruitmentRoles?.map((r) => (
                        <View key={r} style={styles.simpleRoleCard}>
                          <Text style={styles.posTitle}>{r}</Text>
                          <TouchableOpacity 
                            style={[styles.applyPosBtn, appliedRoles[r] && styles.applyPosBtnDone]}
                            onPress={() => handleApplyRole(r)}
                            disabled={appliedRoles[r]}
                          >
                            <Text style={styles.applyPosBtnText}>{appliedRoles[r] ? 'Applied ✓' : 'Apply'}</Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </View>
                )}

                {/* 6. FAQS TAB */}
                {activeDetailTab === 'faqs' && (
                  <View style={styles.tabContent}>
                    <Text style={styles.sectionHeading}>Frequently Asked Student Questions</Text>
                    {selectedClub.faqs && selectedClub.faqs.length > 0 ? (
                      selectedClub.faqs.map((faq, idx) => (
                        <View key={idx} style={styles.faqCard}>
                          <Text style={styles.faqQ}>Q: {faq.question}</Text>
                          <Text style={styles.faqA}>{faq.answer}</Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.faqCard}>
                        <Text style={styles.faqQ}>Q: How can students get involved with {selectedClub.shortName}?</Text>
                        <Text style={styles.faqA}>You can register for any upcoming event or apply during our open recruitment drive in the Recruitment tab.</Text>
                      </View>
                    )}

                    <View style={styles.contactDeskBox}>
                      <Ionicons name="help-buoy-outline" size={22} color="#0C447C" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.contactDeskTitle}>Need Direct Support?</Text>
                        <Text style={styles.contactDeskDesc}>Reach out directly to {selectedClub.officialEmail || 'the club president'}</Text>
                      </View>
                    </View>
                  </View>
                )}

                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* PRESIDENT / AUTHORITY EDIT MODAL */}
      {/* ========================================================================= */}
      {showEditModal && selectedClub && (
        <Modal visible={true} transparent={true} animationType="slide" onRequestClose={() => setShowEditModal(false)}>
          <View style={styles.editModalOverlay}>
            <View style={styles.editModalBox}>
              <View style={styles.editModalHeader}>
                <View>
                  <Text style={styles.editModalTitle}>Edit Club Profile & Recruitment</Text>
                  <Text style={styles.editModalSub}>Authorized: President · {selectedClub.name}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.editInputLabel}>Club Tagline / Motto</Text>
                <TextInput 
                  style={styles.editInput} 
                  value={editTagline} 
                  onChangeText={setEditTagline}
                  placeholder="e.g. Fostering Innovation, Fueling Startups"
                />

                <Text style={styles.editInputLabel}>Workshop / Room Location</Text>
                <TextInput 
                  style={styles.editInput} 
                  value={editWorkshop} 
                  onChangeText={setEditWorkshop}
                  placeholder="e.g. Incubation Cabin 402, Building 3"
                />

                <Text style={styles.editInputLabel}>Recruitment Deadline</Text>
                <TextInput 
                  style={styles.editInput} 
                  value={editDeadline} 
                  onChangeText={setEditDeadline}
                  placeholder="e.g. 25 Aug 2026, 11:59 PM"
                />

                <Text style={styles.editInputLabel}>Official WhatsApp Community Invite Link</Text>
                <TextInput 
                  style={styles.editInput} 
                  value={editWhatsapp} 
                  onChangeText={setEditWhatsapp}
                  placeholder="https://chat.whatsapp.com/..."
                />

                <Text style={styles.editInputLabel}>Vision Statement</Text>
                <TextInput 
                  style={[styles.editInput, { height: 60 }]} 
                  value={editVision} 
                  onChangeText={setEditVision}
                  multiline={true}
                />

                <Text style={styles.editInputLabel}>Mission Statement</Text>
                <TextInput 
                  style={[styles.editInput, { height: 60 }]} 
                  value={editMission} 
                  onChangeText={setEditMission}
                  multiline={true}
                />
              </ScrollView>

              <View style={styles.editModalFooter}>
                <TouchableOpacity style={styles.cancelEditBtn} onPress={() => setShowEditModal(false)}>
                  <Text style={styles.cancelEditText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveEditBtn} onPress={handleSavePresidentEdits}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.saveEditText}>Save & Publish Live</Text>
                </TouchableOpacity>
              </View>
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
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSub: {
    color: '#B5D4F4',
    fontSize: 11.5,
  },
  roleSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  roleSwitchBtnActive: {
    backgroundColor: '#16A34A',
    borderColor: '#86EFAC',
  },
  roleSwitchText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B5D4F4',
  },
  roleSwitchTextActive: {
    color: '#fff',
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
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  sortBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  resultCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F1FB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sortBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0C447C',
  },
  list: {
    flex: 1,
    padding: 14,
  },
  clubCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clubLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubLogoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  clubInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  verticalBadge: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#185FA5',
    backgroundColor: '#E6F1FB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hiringBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hiringText: {
    color: '#15803D',
    fontSize: 9.5,
    fontWeight: '700',
  },
  clubName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 1,
  },
  taglineText: {
    fontSize: 10.5,
    fontStyle: 'italic',
    color: '#D97706',
    marginBottom: 2,
  },
  mentorText: {
    fontSize: 11,
    color: '#0C447C',
    fontWeight: '500',
    marginBottom: 2,
  },
  clubDesc: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statItemText: {
    fontSize: 10,
    color: '#64748b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  fullClubModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    display: 'flex',
    flexDirection: 'column',
  },
  clubModalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  clubModalTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLogoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  modalBadgeLine: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 2,
  },
  clubCodeBadge: {
    fontSize: 8.5,
    fontFamily: 'monospace',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 4,
    borderRadius: 3,
    color: '#64748B',
  },
  modalClubTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalTagline: {
    fontSize: 10.5,
    fontStyle: 'italic',
    color: '#D97706',
  },
  editClubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0C447C',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  editClubBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  subTabsRow: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  subTabsScroll: {
    paddingHorizontal: 12,
    gap: 6,
    paddingVertical: 8,
  },
  subTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subTabActive: {
    backgroundColor: '#0C447C',
    borderColor: '#0C447C',
  },
  subTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  subTabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  modalScrollBody: {
    flex: 1,
    padding: 16,
  },
  tabContent: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  bodyParagraph: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  visionCard: {
    backgroundColor: '#E6F1FB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 8,
  },
  missionCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 8,
  },
  visionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  visionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0C447C',
  },
  visionText: {
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 16,
  },
  infoGridBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  infoGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoGridLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  infoGridValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  communityGrid: {
    gap: 8,
    marginTop: 4,
  },
  commBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    borderRadius: 10,
  },
  commBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  mentorBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mentorAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F1FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentorCardName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  mentorCardDesig: {
    fontSize: 11,
    color: '#0C447C',
    fontWeight: '600',
  },
  mentorCardInst: {
    fontSize: 10,
    color: '#64748B',
  },
  presidentCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  presidentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  presAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  presBadge: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  presName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  presContact: {
    fontSize: 10.5,
    color: '#78350F',
  },
  coreLeadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
    gap: 10,
  },
  leadAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadAvatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  leadName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  leadRole: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0C447C',
  },
  leadDept: {
    fontSize: 10,
    color: '#64748B',
  },
  flagshipCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  flagshipTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  flagshipTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  flagshipTagline: {
    fontSize: 10.5,
    fontStyle: 'italic',
    color: '#D97706',
  },
  prizeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  prizeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#92400E',
  },
  flagshipMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 4,
  },
  flagshipTimeline: {
    fontSize: 10.5,
    color: '#0C447C',
    fontWeight: '600',
  },
  flagshipFootfall: {
    fontSize: 10.5,
    color: '#16A34A',
    fontWeight: '600',
  },
  flagshipDesc: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
    marginVertical: 4,
  },
  highlightsHeader: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  highlightItem: {
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 15,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    gap: 12,
  },
  achieveIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achieveTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  achieveTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  achieveRank: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  achieveYear: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '700',
    marginBottom: 2,
  },
  achieveDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  recruitBanner: {
    backgroundColor: '#0C447C',
    borderRadius: 12,
    padding: 12,
  },
  recruitBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  recruitBannerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#fff',
  },
  recruitBannerSub: {
    fontSize: 10.5,
    color: '#B5D4F4',
  },
  roundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
    gap: 8,
  },
  roundNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0C447C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundNumText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  roundText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  positionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  posTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  posTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  posDept: {
    fontSize: 10,
    color: '#0C447C',
    fontWeight: '600',
  },
  posDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
    marginVertical: 4,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  skillChip: {
    fontSize: 9,
    color: '#1E40AF',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  applyPosBtn: {
    backgroundColor: '#0C447C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  applyPosBtnDone: {
    backgroundColor: '#16A34A',
  },
  applyPosBtnText: {
    color: '#fff',
    fontSize: 10.5,
    fontWeight: '700',
  },
  simpleRoleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  faqCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  faqQ: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  faqA: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  contactDeskBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#E6F1FB',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  contactDeskTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0C447C',
  },
  contactDeskDesc: {
    fontSize: 10.5,
    color: '#185FA5',
  },
  noInfoText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  sortModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sortModalBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    width: '100%',
    maxWidth: 340,
  },
  sortModalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  sortModalHeadline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sortOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  sortOptionRowActive: {
    backgroundColor: '#E6F1FB',
  },
  sortOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  sortOptionTextActive: {
    color: '#0C447C',
    fontWeight: '700',
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  editModalBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    width: '100%',
    maxWidth: 400,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  editModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  editModalSub: {
    fontSize: 10.5,
    color: '#16A34A',
    fontWeight: '600',
  },
  editInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
    marginBottom: 3,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  editModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  cancelEditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelEditText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  saveEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0C447C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveEditText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});
