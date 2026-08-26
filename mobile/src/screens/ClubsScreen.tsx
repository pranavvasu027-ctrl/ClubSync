import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, Modal, Linking, Alert, Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Club, CLUBS, CoreLead, ClubFlagshipEvent, ClubAchievement, RecruitmentPosition, COLLEGES } from '../data/mockData';
import { CURRENT_USER, updateClubDetails, toggleFollowClub, submitApplication, getClubs } from '../services/clubSyncService';
import { useTheme } from '../context/ThemeContext';
import { MULTI_COLLEGE_ENABLED } from '../config/featureFlags';

type SortOption = 'members' | 'hiring' | 'alphabetical' | 'year';
type ClubDetailTab = 'overview' | 'leadership' | 'events' | 'achievements' | 'recruitment' | 'faqs';

interface ClubsScreenProps {
  initialSortHiring?: boolean;
}

// ─── Vertical accent palette ────────────────────────────────────────────────
const VERTICAL_ACCENT: Record<string, string> = {
  Entrepreneurship: '#C47C2B',
  Technical:        '#1A6FB5',
  Cultural:         '#A84BA1',
  Sports:           '#2E7D32',
  Literary:         '#5C4E8B',
  Social:           '#C0392B',
  Others:           '#546E7A',
};
const VERTICAL_BG: Record<string, string> = {
  Entrepreneurship: '#FFF3E0',
  Technical:        '#E3F0FB',
  Cultural:         '#F9EEF9',
  Sports:           '#E8F5E9',
  Literary:         '#EDE7F6',
  Social:           '#FDECEA',
  Others:           '#ECEFF1',
};

// ─── Animated hiring pulse dot ──────────────────────────────────────────────
function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.55, duration: 700, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.hiringDot, { transform: [{ scale }] }]} />
  );
}

export default function ClubsScreen({ initialSortHiring }: ClubsScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const [clubsList, setClubsList] = useState<Club[]>(CLUBS);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>(initialSortHiring ? 'hiring' : 'members');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const liveClubs = await getClubs();
        if (mounted) setClubsList(liveClubs);
      } catch (err) {
        console.warn('Failed to fetch live clubs:', err);
      } finally {
        if (mounted) setIsLoadingClubs(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<ClubDetailTab>('overview');
  const [showSortModal, setShowSortModal] = useState(false);
  const [appliedRoles, setAppliedRoles] = useState<{ [key: string]: boolean }>({});

  // COLLEGE SELECTOR — defaults to the user's home college
  const [browsingCollegeId, setBrowsingCollegeId] = useState<string>(CURRENT_USER.collegeId);
  const isHomeCollege = browsingCollegeId === CURRENT_USER.collegeId;


  const handleFollow = async (clubId: string) => {
    const club = clubsList.find(c => c.id === clubId);
    const wasFollowing = club?.isFollowed;
    const isCrossCollege = club?.collegeId !== CURRENT_USER.collegeId;

    const res = await toggleFollowClub(clubId);

    setClubsList(prev => prev.map(c =>
      c.id === clubId
        ? { ...c, isFollowed: res.isFollowed, followersCount: res.followersCount }
        : c
    ));
    if (selectedClub && selectedClub.id === clubId) {
      setSelectedClub(prev => prev ? { ...prev, isFollowed: res.isFollowed, followersCount: res.followersCount } : prev);
    }
    const globalClub = CLUBS.find(c => c.id === clubId);
    if (globalClub) {
      globalClub.isFollowed = !globalClub.isFollowed;
      globalClub.followersCount = globalClub.isFollowed
        ? (globalClub.followersCount || 0) + 1
        : (globalClub.followersCount || 1) - 1;
    }

    if (!wasFollowing && isCrossCollege) {
      Alert.alert(
        'Following! 🌍',
        `You'll see ${club?.shortName}'s public events and achievements in your feed. Recruitment is only for their college students.`
      );
    }
  };

  // Clubs scoped to the college currently being browsed
  const collegeScopedClubs = clubsList.filter(c => c.collegeId === browsingCollegeId);

  const domainOptions = [
    { label: 'All',              count: collegeScopedClubs.length },
    { label: 'Following',        count: collegeScopedClubs.filter(c => c.isFollowed).length },
    { label: 'Entrepreneurship', count: collegeScopedClubs.filter(c => c.vertical === 'Entrepreneurship').length },
    { label: 'Technical',        count: collegeScopedClubs.filter(c => c.vertical === 'Technical').length },
    { label: 'Cultural',         count: collegeScopedClubs.filter(c => c.vertical === 'Cultural').length },
    { label: 'Sports',           count: collegeScopedClubs.filter(c => c.vertical === 'Sports').length },
    { label: 'Literary',         count: collegeScopedClubs.filter(c => c.vertical === 'Literary').length },
    { label: 'Social',           count: collegeScopedClubs.filter(c => c.vertical === 'Social').length },
    { label: 'Others',           count: collegeScopedClubs.filter(c => c.vertical === 'Others').length },
  ];

  const sortLabels: { [key in SortOption]: string } = {
    members:      'Most members',
    hiring:       'Hiring open first',
    alphabetical: 'A to Z',
    year:         'Established (heritage)',
  };

  let filteredClubs = collegeScopedClubs.filter((club) => {
    if (selectedDomain === 'Following' && !club.isFollowed) return false;
    if (selectedDomain !== 'All' && selectedDomain !== 'Following' && club.vertical !== selectedDomain) return false;
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

  filteredClubs.sort((a, b) => {
    if (sortBy === 'members')      return b.membersCount - a.membersCount;
    if (sortBy === 'hiring')       return a.openRecruitment === b.openRecruitment ? 0 : a.openRecruitment ? -1 : 1;
    if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
    if (sortBy === 'year')         return a.establishedYear - b.establishedYear;
    return 0;
  });

  const handleOpenClub = (club: Club) => {
    setSelectedClub(club);
    setActiveDetailTab('overview');
  };

  const handleApplyRole = async (roleTitle: string) => {
    if (!selectedClub || selectedClub.collegeId !== CURRENT_USER.collegeId) {
      Alert.alert('Not Available', 'Recruitment is exclusive to students of this college.');
      return;
    }
    setAppliedRoles(prev => ({ ...prev, [roleTitle]: true }));
    const res = await submitApplication(
      selectedClub.id, roleTitle,
      `Passionate applicant from ${CURRENT_USER.branch} (${CURRENT_USER.year}). CGPA: ${CURRENT_USER.cgpa}`
    );
    Alert.alert('Application Submitted! 🚀', res.message);
  };

  const openLink = (url?: string) => {
    if (url) Linking.openURL(url).catch(err => console.error("Couldn't open link", err));
  };
  const browsingCollege = COLLEGES.find(c => c.id === browsingCollegeId);

  return (
    <View style={styles.container}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerEyebrow}>Directory</Text>
            <Text style={styles.headerTitle}>Clubs & Chapters</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.5)" />
          <TextInput
            placeholder="Search clubs, mentors, focus areas…"
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={15} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── College Selector ────────────────────────────────────────────────── */}
      {MULTI_COLLEGE_ENABLED && (
        <View style={styles.collegeSelectorWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collegeSelectorScroll}>
            {COLLEGES.map((c) => {
              const active = browsingCollegeId === c.id;
              const isHome = c.id === CURRENT_USER.collegeId;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.collegeChip, active && styles.collegeChipActive]}
                  onPress={() => setBrowsingCollegeId(c.id)}
                >
                  {isHome && <View style={[styles.homeDot, active && styles.homeDotActive]} />}
                  <Text style={[styles.collegeChipText, active && styles.collegeChipTextActive]}>
                    {c.shortName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── Cross-college notice ─────────────────────────────────────────────── */}
      {MULTI_COLLEGE_ENABLED && !isHomeCollege && (
        <View style={styles.crossCollegeStrip}>
          <Ionicons name="eye-outline" size={13} color="#8A6D2F" />
          <Text style={styles.crossCollegeStripText}>
            Browsing {browsingCollege?.shortName} · Read-only. You can follow clubs, but recruitment is for their own students.
          </Text>
        </View>
      )}


      {/* ── Domain Chips ─────────────────────────────────────────────────────── */}
      <View style={styles.chipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {domainOptions.map((opt) => {
            const active = selectedDomain === opt.label;
            const accent = VERTICAL_ACCENT[opt.label];
            return (
              <TouchableOpacity
                key={opt.label}
                style={[
                  styles.chip,
                  active && styles.chipActive,
                  active && accent ? { backgroundColor: accent, borderColor: accent } : undefined,
                ]}
                onPress={() => setSelectedDomain(opt.label)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {opt.label} · {opt.count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Sort & Result Bar ────────────────────────────────────────────────── */}
      <View style={styles.sortBar}>
        <Text style={styles.resultCountText}>
          {filteredClubs.length} in {selectedDomain === 'All' ? (browsingCollege?.shortName || 'this college') : selectedDomain}
        </Text>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSortModal(true)}>
          <Ionicons name="swap-vertical" size={12} color={NAVY} />
          <Text style={styles.sortBtnText}>{sortLabels[sortBy]}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Clubs List ───────────────────────────────────────────────────────── */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {collegeScopedClubs.length === 0 ? (
          /* Empty state — college has no clubs yet */
          <View style={styles.emptyState}>
            <View style={styles.emptyIconRing}>
              <MaterialCommunityIcons name="domain" size={26} color="#B8A87A" />
            </View>
            <Text style={styles.emptyTitle}>No clubs listed yet for {browsingCollege?.shortName}</Text>
            <Text style={styles.emptySub}>
              We're rolling out ClubSync to more Pune colleges soon. Check back shortly, or switch back to your own college above.
            </Text>
            {!isHomeCollege && (
              <TouchableOpacity
                style={styles.emptyBackBtn}
                onPress={() => setBrowsingCollegeId(CURRENT_USER.collegeId)}
              >
                <Text style={styles.emptyBackBtnText}>
                  Back to {COLLEGES.find(c => c.id === CURRENT_USER.collegeId)?.shortName}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : filteredClubs.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconRing}>
              <Ionicons name="search-outline" size={24} color="#B8A87A" />
            </View>
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptySub}>Try a different search term or filter.</Text>
          </View>
        ) : (
          filteredClubs.map((club) => {
            const vAccent = VERTICAL_ACCENT[club.vertical] || NAVY;
            const vBg     = VERTICAL_BG[club.vertical]    || '#EDF2F7';
            return (
              <TouchableOpacity
                key={club.id}
                style={styles.clubCard}
                onPress={() => handleOpenClub(club)}
                activeOpacity={0.75}
              >
                {/* Left accent stripe keyed to vertical */}
                <View style={[styles.cardStripe, { backgroundColor: vAccent }]} />

                <View style={styles.cardInner}>
                  <View style={styles.clubCardTop}>
                    <View style={[styles.clubLogo, { backgroundColor: club.logoBg }]}>
                      <Text style={styles.clubLogoText}>{club.shortName.substring(0, 2).toUpperCase()}</Text>
                    </View>

                    <View style={styles.clubInfo}>
                      <View style={styles.badgeRow}>
                        <View style={[styles.verticalPill, { backgroundColor: vBg }]}>
                          <Text style={[styles.verticalBadge, { color: vAccent }]}>
                            {club.vertical.toUpperCase()}
                          </Text>
                        </View>
                        {club.openRecruitment && (
                          <View style={styles.hiringBadge}>
                            <PulseDot />
                            <Text style={styles.hiringText}>Hiring</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.clubName} numberOfLines={1}>{club.name}</Text>
                      {club.tagline ? (
                        <Text style={styles.taglineText} numberOfLines={1}>{club.tagline}</Text>
                      ) : null}
                    </View>

                    <TouchableOpacity
                      style={[styles.followBtn, club.isFollowed && styles.followBtnActive]}
                      onPress={(e) => { e.stopPropagation(); handleFollow(club.id); }}
                    >
                      {club.isFollowed && (
                        <Ionicons name="checkmark" size={11} color={INK_SOFT} style={{ marginRight: 2 }} />
                      )}
                      <Text style={[styles.followBtnText, club.isFollowed && styles.followBtnTextActive]}>
                        {club.isFollowed ? 'Following' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.clubDesc} numberOfLines={2}>{club.description}</Text>

                  <View style={styles.cardFootRow}>
                    <View style={styles.statItem}>
                      <Ionicons name="people-outline" size={12} color="#8A8371" />
                      <Text style={styles.statItemText}>{(club.followersCount || club.membersCount).toLocaleString()}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Ionicons name="location-outline" size={12} color="#8A8371" />
                      <Text style={styles.statItemText} numberOfLines={1}>{club.workshopOrRoom || club.campus}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <Text style={styles.mentorInline} numberOfLines={1}>{club.facultyMentor}</Text>
                    
                    {CURRENT_USER.role === 'observer' && (
                      <>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                          <Ionicons name="pulse" size={12} color={club.lastActivityDate ? "#16A34A" : "#D97706"} />
                          <Text style={[styles.statItemText, { color: club.lastActivityDate ? '#16A34A' : '#D97706' }]}>
                            {club.lastActivityDate ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SORT MODAL                                                            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showSortModal && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowSortModal(false)}>
          <View style={styles.sortModalOverlay}>
            <View style={styles.sortModalBox}>
              <View style={styles.sortModalTop}>
                <Text style={styles.sortModalHeadline}>Sort clubs by</Text>
                <TouchableOpacity onPress={() => setShowSortModal(false)}>
                  <Ionicons name="close" size={18} color="#8A8371" />
                </TouchableOpacity>
              </View>
              {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.sortOptionRow, sortBy === key && styles.sortOptionRowActive]}
                  onPress={() => { setSortBy(key); setShowSortModal(false); }}
                >
                  <Text style={[styles.sortOptionText, sortBy === key && styles.sortOptionTextActive]}>
                    {sortLabels[key]}
                  </Text>
                  {sortBy === key && <Ionicons name="checkmark" size={16} color={NAVY} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* FULL CLUB DETAIL MODAL                                                */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {selectedClub && (
        <Modal visible animationType="slide" transparent onRequestClose={() => setSelectedClub(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.fullClubModal}>
              <View style={styles.modalGrabber} />

              {/* Top bar */}
              <View style={styles.clubModalTopBar}>
                <View style={styles.clubModalTitleBox}>
                  <View style={[styles.modalLogo, { backgroundColor: selectedClub.logoBg }]}>
                    <Text style={styles.modalLogoText}>{selectedClub.shortName.substring(0, 2)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.modalBadgeLine}>
                      <Text style={styles.clubCodeBadge}>{selectedClub.clubNo}</Text>
                      <View style={[styles.verticalPill, { backgroundColor: VERTICAL_BG[selectedClub.vertical] || '#EDF2F7' }]}>
                        <Text style={[styles.verticalBadgeSmall, { color: VERTICAL_ACCENT[selectedClub.vertical] || NAVY }]}>
                          {selectedClub.vertical.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.modalClubTitle} numberOfLines={1}>{selectedClub.name}</Text>
                    {selectedClub.tagline && <Text style={styles.modalTagline}>{selectedClub.tagline}</Text>}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>

                  <TouchableOpacity onPress={() => setSelectedClub(null)} style={styles.closeBtn}>
                    <Ionicons name="close" size={20} color="#8A8371" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Cross-college banner */}
              {MULTI_COLLEGE_ENABLED && selectedClub.collegeId !== CURRENT_USER.collegeId && (
                <View style={styles.crossCollegeBanner}>
                  <Ionicons name="eye-outline" size={14} color="#8A6D2F" />
                  <Text style={styles.crossCollegeText}>
                    External club · Read-only. Follow for updates — recruitment is for{' '}
                    {COLLEGES.find(c => c.id === selectedClub.collegeId)?.shortName || 'their college'} students only.
                  </Text>
                </View>
              )}

              {/* Sub-tabs */}
              <View style={styles.subTabsRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabsScroll}>
                  {([
                    { key: 'overview',      label: 'Overview',                                          show: true },
                    { key: 'leadership',    label: 'Leadership',                                        show: selectedClub.collegeId === CURRENT_USER.collegeId || selectedClub.contentVisibility === 'public' },
                    { key: 'events',        label: `Events (${selectedClub.flagshipEvents?.length || 0})`, show: true },
                    { key: 'achievements',  label: `Trophies (${selectedClub.achievements?.length || 0})`, show: true },
                    { key: 'recruitment',   label: 'Recruitment',                                       show: selectedClub.collegeId === CURRENT_USER.collegeId },
                    { key: 'faqs',          label: 'FAQs',                                              show: selectedClub.collegeId === CURRENT_USER.collegeId || selectedClub.contentVisibility === 'public' },
                  ] as { key: ClubDetailTab; label: string; show: boolean }[])
                    .filter(t => t.show)
                    .map(t => (
                      <TouchableOpacity
                        key={t.key}
                        style={[styles.subTab, activeDetailTab === t.key && styles.subTabActive]}
                        onPress={() => setActiveDetailTab(t.key)}
                      >
                        <Text style={[styles.subTabText, activeDetailTab === t.key && styles.subTabTextActive]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>

              {/* Scrollable tab body */}
              <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>

                {/* ── OVERVIEW ── */}
                {activeDetailTab === 'overview' && (
                  <View style={styles.tabContent}>
                    <Text style={styles.sectionHeading}>About</Text>
                    <Text style={styles.bodyParagraph}>{selectedClub.description}</Text>

                    {selectedClub.vision && (
                      <View style={styles.visionCard}>
                        <Text style={styles.visionTitle}>Vision</Text>
                        <Text style={styles.visionText}>{selectedClub.vision}</Text>
                      </View>
                    )}
                    {selectedClub.mission && (
                      <View style={styles.missionCard}>
                        <Text style={[styles.visionTitle, { color: '#3D6B47' }]}>Mission</Text>
                        <Text style={styles.visionText}>{selectedClub.mission}</Text>
                      </View>
                    )}

                    <Text style={[styles.sectionHeading, { marginTop: 16 }]}>Club information</Text>
                    <View style={styles.infoGridBox}>
                      {([
                        ['Established',     String(selectedClub.establishedYear)],
                        ['Workshop / lab',  selectedClub.workshopOrRoom || selectedClub.campus],
                        ['Active strength', `${selectedClub.membersCount} students`],
                        ['Faculty mentor',  selectedClub.facultyMentor],
                        ['Email',           selectedClub.officialEmail || `${selectedClub.shortName.toLowerCase()}@vit.edu`],
                      ] as [string, string][]).map(([label, val], i) => (
                        <View key={i} style={[styles.infoGridRow, i > 0 && styles.infoGridRowBorder]}>
                          <Text style={styles.infoGridLabel}>{label}</Text>
                          <Text style={[styles.infoGridValue, i >= 3 && { color: NAVY }]}>{val}</Text>
                        </View>
                      ))}
                    </View>

                    <Text style={[styles.sectionHeading, { marginTop: 16 }]}>Connect</Text>
                    <View style={styles.communityGrid}>
                      {selectedClub.whatsappGroup && (
                        <TouchableOpacity style={styles.commBtn} onPress={() => openLink(selectedClub.whatsappGroup)}>
                          <Ionicons name="logo-whatsapp" size={16} color="#3D6B47" />
                          <Text style={styles.commBtnText}>WhatsApp community</Text>
                          <Ionicons name="open-outline" size={12} color="#8A8371" />
                        </TouchableOpacity>
                      )}
                      {selectedClub.discord && (
                        <TouchableOpacity style={styles.commBtn} onPress={() => openLink(selectedClub.discord)}>
                          <Ionicons name="logo-discord" size={16} color="#5865F2" />
                          <Text style={styles.commBtnText}>Discord</Text>
                          <Ionicons name="open-outline" size={12} color="#8A8371" />
                        </TouchableOpacity>
                      )}
                      {selectedClub.websiteUrl && (
                        <TouchableOpacity style={styles.commBtn} onPress={() => openLink(selectedClub.websiteUrl)}>
                          <Ionicons name="globe-outline" size={16} color={NAVY} />
                          <Text style={styles.commBtnText}>{selectedClub.websiteUrl.replace('https://', '')}</Text>
                          <Ionicons name="open-outline" size={12} color="#8A8371" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}

                {/* ── LEADERSHIP ── */}
                {activeDetailTab === 'leadership' && (
                  <View style={styles.tabContent}>
                    <Text style={styles.sectionHeading}>Faculty mentorship</Text>
                    <View style={styles.mentorBannerCard}>
                      <View style={styles.mentorAvatarBox}>
                        <Ionicons name="school-outline" size={20} color={NAVY} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mentorCardName}>{selectedClub.facultyMentor}</Text>
                        <Text style={styles.mentorCardDesig}>{selectedClub.facultyDesignation || 'Faculty in-charge'}</Text>
                      </View>
                    </View>

                    <Text style={[styles.sectionHeading, { marginTop: 16 }]}>Student leadership</Text>
                    <View style={styles.presidentCard}>
                      <View style={styles.presidentTop}>
                        <View style={styles.presAvatar}>
                          <Text style={styles.presAvatarText}>PR</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.presBadge}>PRESIDENT</Text>
                          <Text style={styles.presName}>{selectedClub.presidentName || 'President in-charge'}</Text>
                          <Text style={styles.presContact}>{selectedClub.presidentContact || 'Authorized representative'}</Text>
                        </View>
                      </View>
                    </View>

                    <Text style={[styles.sectionHeading, { marginTop: 14 }]}>
                      Core committee ({selectedClub.coreCommittee?.length || 0})
                    </Text>
                    {selectedClub.coreCommittee && selectedClub.coreCommittee.length > 0 ? (
                      selectedClub.coreCommittee.map((lead) => (
                        <View key={lead.name} style={styles.coreLeadCard}>
                          <View style={styles.leadAvatar}>
                            <Text style={styles.leadAvatarText}>{lead.avatarText}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.leadName}>{lead.name}</Text>
                            <Text style={styles.leadRole}>{lead.role}</Text>
                          </View>
                          {lead.email && (
                            <TouchableOpacity onPress={() => openLink(`mailto:${lead.email}`)}>
                              <Ionicons name="mail-outline" size={16} color={NAVY} />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noInfoText}>Core committee appointments verified by Dean Student Affairs.</Text>
                    )}
                  </View>
                )}

                {/* ── EVENTS ── */}
                {activeDetailTab === 'events' && (
                  <View style={styles.tabContent}>
                    <Text style={styles.sectionHeading}>Signature events</Text>
                    {selectedClub.flagshipEvents && selectedClub.flagshipEvents.length > 0 ? (
                      selectedClub.flagshipEvents.map((evt) => (
                        <View key={evt.id} style={styles.flagshipCard}>
                          <View style={styles.flagshipTop}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.flagshipTitle}>{evt.title}</Text>
                              <Text style={styles.flagshipTagline}>{evt.tagline}</Text>
                            </View>
                            {evt.prizePool && (
                              <View style={styles.prizeBadge}>
                                <Text style={styles.prizeBadgeText}>{evt.prizePool}</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.flagshipMetaRow}>
                            <Text style={styles.flagshipTimeline}>{evt.timeline}</Text>
                            <Text style={styles.flagshipFootfall}>{evt.footfall}</Text>
                          </View>
                          <Text style={styles.flagshipDesc}>{evt.description}</Text>
                          {evt.highlights.map((h, i) => (
                            <Text key={i} style={styles.highlightItem}>· {h}</Text>
                          ))}
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noInfoText}>Flagship events scheduled for AY 2026–27.</Text>
                    )}
                  </View>
                )}

                {/* ── ACHIEVEMENTS ── */}
                {activeDetailTab === 'achievements' && (
                  <View style={styles.tabContent}>
                    <Text style={styles.sectionHeading}>Awards & accolades</Text>
                    {selectedClub.achievements && selectedClub.achievements.length > 0 ? (
                      selectedClub.achievements.map((ach, idx) => (
                        <View key={idx} style={styles.achievementCard}>
                          <View style={styles.achieveIconBox}>
                            <Ionicons name="trophy-outline" size={20} color="#B8860B" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={styles.achieveTop}>
                              <Text style={styles.achieveTitle}>{ach.title}</Text>
                              <Text style={styles.achieveRank}>{ach.rankBadge}</Text>
                            </View>
                            <Text style={styles.achieveYear}>{ach.year}</Text>
                            <Text style={styles.achieveDesc}>{ach.description}</Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noInfoText}>Club achievements verified under institutional records.</Text>
                    )}
                  </View>
                )}

                {/* ── RECRUITMENT ── */}
                {activeDetailTab === 'recruitment' && (
                  <View style={styles.tabContent}>
                    <View style={styles.recruitBanner}>
                      <Text style={styles.recruitBannerTitle}>Core team recruitment · AY 2026–27</Text>
                      <Text style={styles.recruitBannerSub}>
                        Deadline: {selectedClub.recruitmentDeadline || 'Open'} · Min CGPA 7.0
                      </Text>
                    </View>

                    {selectedClub.recruitmentRounds && (
                      <>
                        <Text style={[styles.sectionHeading, { marginTop: 16 }]}>Selection process</Text>
                        {selectedClub.recruitmentRounds.map((rnd, i) => (
                          <View key={i} style={styles.roundCard}>
                            <View style={styles.roundNum}><Text style={styles.roundNumText}>{i + 1}</Text></View>
                            <Text style={styles.roundText}>{rnd}</Text>
                          </View>
                        ))}
                      </>
                    )}

                    <Text style={[styles.sectionHeading, { marginTop: 16 }]}>Open positions</Text>
                    {selectedClub.recruitmentPositions && selectedClub.recruitmentPositions.length > 0 ? (
                      selectedClub.recruitmentPositions.map((pos) => (
                        <View key={pos.title} style={styles.positionCard}>
                          <View style={styles.posTop}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.posTitle}>{pos.title}</Text>
                              <Text style={styles.posDept}>{pos.department} · {pos.openings} openings</Text>
                              {CURRENT_USER.role === 'observer' && (
                                <Text style={{ fontSize: 12, color: '#D97706', marginTop: 4, fontWeight: '600' }}>
                                  Applicants: {pos.applicantsCount || Math.floor(Math.random() * 50) + 10}
                                </Text>
                              )}
                            </View>
                            {CURRENT_USER.role !== 'observer' && (
                              <TouchableOpacity
                                style={[styles.applyPosBtn, appliedRoles[pos.title] && styles.applyPosBtnDone]}
                                onPress={() => handleApplyRole(pos.title)}
                                disabled={appliedRoles[pos.title]}
                              >
                                <Text style={styles.applyPosBtnText}>
                                  {appliedRoles[pos.title] ? 'Applied ✓' : 'Apply'}
                                </Text>
                              </TouchableOpacity>
                            )}
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
                          <View style={{ flex: 1 }}>
                             <Text style={styles.posTitle}>{r}</Text>
                             {CURRENT_USER.role === 'observer' && (
                                <Text style={{ fontSize: 12, color: '#D97706', marginTop: 4, fontWeight: '600' }}>
                                  Applicants: {Math.floor(Math.random() * 50) + 10}
                                </Text>
                              )}
                          </View>
                          {CURRENT_USER.role !== 'observer' && (
                            <TouchableOpacity
                              style={[styles.applyPosBtn, appliedRoles[r] && styles.applyPosBtnDone]}
                              onPress={() => handleApplyRole(r)}
                              disabled={appliedRoles[r]}
                            >
                              <Text style={styles.applyPosBtnText}>{appliedRoles[r] ? 'Applied ✓' : 'Apply'}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))
                    )}
                  </View>
                )}

                {/* ── FAQs ── */}
                {activeDetailTab === 'faqs' && (
                  <View style={styles.tabContent}>
                    <Text style={styles.sectionHeading}>Frequently asked</Text>
                    {selectedClub.faqs && selectedClub.faqs.length > 0 ? (
                      selectedClub.faqs.map((faq, idx) => (
                        <View key={idx} style={styles.faqCard}>
                          <Text style={styles.faqQ}>{faq.question}</Text>
                          <Text style={styles.faqA}>{faq.answer}</Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.faqCard}>
                        <Text style={styles.faqQ}>How can students get involved with {selectedClub.shortName}?</Text>
                        <Text style={styles.faqA}>
                          Register for any upcoming event, or apply during the open recruitment drive in the Recruitment tab.
                        </Text>
                      </View>
                    )}

                    <View style={styles.contactDeskBox}>
                      <Ionicons name="help-buoy-outline" size={20} color={NAVY} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.contactDeskTitle}>Need direct support?</Text>
                        <Text style={styles.contactDeskDesc}>
                          Reach {selectedClub.officialEmail || 'the club president'}
                        </Text>
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

    </View>
  );
}

// ─── Design tokens ──────────────────────────────────────────────────────────
const PAPER      = '#FAF8F3';
const PAPER_DEEP = '#F1EDE1';
const INK        = '#221F14';
const INK_SOFT   = '#6B6455';
const INK_FAINT  = '#A69E8A';
const RULE       = '#E6E0CE';
const NAVY       = '#0C447C';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAPER,
  },

  // ── Header
  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  roleSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    marginTop: 2,
  },
  roleSwitchBtnActive: {
    backgroundColor: '#3D6B47',
    borderColor: '#5B9166',
  },
  roleSwitchText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
  },
  roleSwitchTextActive: { color: '#fff' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    padding: 0,
  },

  // ── College selector
  collegeSelectorWrap: {
    backgroundColor: PAPER,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    paddingVertical: 10,
  },
  collegeSelectorScroll: {
    paddingHorizontal: 16,
    gap: 7,
  },
  collegeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: RULE,
  },
  collegeChipActive: {
    backgroundColor: INK,
    borderColor: INK,
  },
  homeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#3D6B47',
  },
  homeDotActive: { backgroundColor: '#8CF06E' },
  collegeChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: INK_SOFT,
  },
  collegeChipTextActive: { color: '#fff' },

  // ── Cross-college strip
  crossCollegeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FBF3DE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEDFAF',
  },
  crossCollegeStripText: {
    flex: 1,
    fontSize: 10.5,
    color: '#7A5E22',
    fontWeight: '500',
    lineHeight: 14,
  },

  // ── Domain chips
  chipsContainer: {
    backgroundColor: PAPER,
    paddingVertical: 8,
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 7,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: RULE,
  },
  chipActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  chipText: {
    fontSize: 11,
    color: INK_SOFT,
    fontWeight: '600',
  },
  chipTextActive: { color: '#fff' },

  // ── Sort bar
  sortBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  resultCountText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: INK_FAINT,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#8A6D2F',
  },

  // ── List
  list: {
    flex: 1,
    padding: 14,
  },

  // ── Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 24,
  },
  emptyIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PAPER_DEEP,
    borderWidth: 1,
    borderColor: RULE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: INK,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12.5,
    color: INK_SOFT,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyBackBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: NAVY,
  },
  emptyBackBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Club card — stripe layout
  clubCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: RULE,
    overflow: 'hidden',
  },
  cardStripe: {
    width: 4,
    alignSelf: 'stretch',
  },
  cardInner: {
    flex: 1,
    padding: 14,
  },
  clubCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    marginBottom: 9,
  },
  clubLogo: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubLogoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  clubInfo: {
    flex: 1,
    minWidth: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  verticalPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verticalBadge: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  hiringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hiringDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3D6B47',
  },
  hiringText: {
    color: '#3D6B47',
    fontSize: 9.5,
    fontWeight: '700',
  },
  clubName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: INK,
    marginBottom: 1,
  },
  taglineText: {
    fontSize: 11,
    color: INK_SOFT,
    fontStyle: 'italic',
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: NAVY,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followBtnActive: {
    backgroundColor: PAPER_DEEP,
    borderColor: RULE,
  },
  followBtnText: {
    color: NAVY,
    fontSize: 11,
    fontWeight: '700',
  },
  followBtnTextActive: { color: INK_SOFT },
  clubDesc: {
    fontSize: 11.5,
    color: INK_SOFT,
    lineHeight: 16,
    marginBottom: 10,
  },
  cardFootRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: '#F1EEE2',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statItemText: {
    fontSize: 10,
    color: '#8A8371',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 10,
    backgroundColor: RULE,
  },
  mentorInline: {
    fontSize: 10,
    color: '#8A8371',
    flex: 1,
  },

  // ── Modal shared
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20,18,10,0.55)',
    justifyContent: 'flex-end',
  },
  fullClubModal: {
    backgroundColor: PAPER,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    height: '92%',
    flexDirection: 'column',
  },
  modalGrabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: RULE,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  clubModalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  clubModalTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalLogo: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLogoText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  modalBadgeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  clubCodeBadge: {
    fontSize: 8.5,
    fontFamily: 'monospace',
    color: INK_FAINT,
  },
  verticalBadgeSmall: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  modalClubTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: INK,
  },
  modalTagline: {
    fontSize: 10.5,
    fontStyle: 'italic',
    color: INK_SOFT,
  },
  editClubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: NAVY,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editClubBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: { padding: 4 },

  crossCollegeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF3DE',
    padding: 11,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 10,
    gap: 8,
  },
  crossCollegeText: {
    flex: 1,
    fontSize: 11.5,
    color: '#7A5E22',
    fontWeight: '500',
    lineHeight: 16,
  },

  // ── Sub-tabs
  subTabsRow: {
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  subTabsScroll: {
    paddingHorizontal: 12,
    gap: 6,
    paddingVertical: 10,
  },
  subTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: RULE,
  },
  subTabActive: {
    backgroundColor: INK,
    borderColor: INK,
  },
  subTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: INK_SOFT,
  },
  subTabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  modalScrollBody: {
    flex: 1,
    padding: 16,
  },
  tabContent: { gap: 8 },

  sectionHeading: {
    fontSize: 11.5,
    fontWeight: '700',
    color: INK_FAINT,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  bodyParagraph: {
    fontSize: 13,
    color: '#40392A',
    lineHeight: 19,
    marginBottom: 8,
  },

  visionCard: {
    backgroundColor: '#EAF1F8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  missionCard: {
    backgroundColor: '#EBF3EB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  visionTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: NAVY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  visionText: {
    fontSize: 12,
    color: '#40392A',
    lineHeight: 17,
  },

  infoGridBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: RULE,
  },
  infoGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoGridRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1EEE2',
  },
  infoGridLabel: {
    fontSize: 11,
    color: INK_SOFT,
  },
  infoGridValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: INK,
    maxWidth: '60%',
    textAlign: 'right',
  },

  communityGrid: { gap: 8, marginTop: 2 },
  commBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: RULE,
    padding: 11,
    borderRadius: 10,
  },
  commBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: INK,
    flex: 1,
  },

  mentorBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: RULE,
  },
  mentorAvatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EAF1F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentorCardName: { fontSize: 13.5, fontWeight: '700', color: INK },
  mentorCardDesig: { fontSize: 11, color: NAVY, fontWeight: '600' },
  presidentCard: {
    backgroundColor: '#FBF6E9',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0E3BE',
  },
  presidentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  presAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#B8860B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presAvatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  presBadge: { fontSize: 8.5, fontWeight: '800', color: '#8A6D2F', letterSpacing: 0.6 },
  presName: { fontSize: 13, fontWeight: '700', color: INK },
  presContact: { fontSize: 10.5, color: INK_SOFT },
  coreLeadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: RULE,
    marginBottom: 6,
    gap: 10,
  },
  leadAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: PAPER_DEEP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadAvatarText: { fontSize: 10.5, fontWeight: '700', color: INK_SOFT },
  leadName: { fontSize: 12.5, fontWeight: '700', color: INK },
  leadRole: { fontSize: 10.5, fontWeight: '600', color: NAVY },

  flagshipCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: RULE,
    marginBottom: 10,
  },
  flagshipTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  flagshipTitle: { fontSize: 13.5, fontWeight: '700', color: INK },
  flagshipTagline: { fontSize: 10.5, fontStyle: 'italic', color: INK_SOFT },
  prizeBadge: {
    backgroundColor: '#FBF3DE',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  prizeBadgeText: { fontSize: 9.5, fontWeight: '700', color: '#8A6D2F' },
  flagshipMetaRow: { flexDirection: 'row', gap: 12, marginVertical: 4 },
  flagshipTimeline: { fontSize: 10.5, color: NAVY, fontWeight: '600' },
  flagshipFootfall: { fontSize: 10.5, color: '#3D6B47', fontWeight: '600' },
  flagshipDesc: { fontSize: 11.5, color: INK_SOFT, lineHeight: 16, marginVertical: 4 },
  highlightItem: { fontSize: 10.5, color: '#8A8371', lineHeight: 15 },

  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: RULE,
    marginBottom: 8,
    gap: 12,
  },
  achieveIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FBF3DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achieveTop: { flexDirection: 'row', justifyContent: 'space-between' },
  achieveTitle: { fontSize: 12.5, fontWeight: '700', color: INK, flex: 1, marginRight: 8 },
  achieveRank: { fontSize: 9, fontWeight: '700', color: '#3D6B47' },
  achieveYear: { fontSize: 10, color: '#8A6D2F', fontWeight: '700', marginBottom: 2 },
  achieveDesc: { fontSize: 11, color: INK_SOFT, lineHeight: 15 },

  recruitBanner: {
    backgroundColor: NAVY,
    borderRadius: 10,
    padding: 13,
  },
  recruitBannerTitle: { fontSize: 13, fontWeight: '700', color: '#fff' },
  recruitBannerSub: { fontSize: 10.5, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  roundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 9,
    borderWidth: 1,
    borderColor: RULE,
    marginBottom: 6,
    gap: 9,
  },
  roundNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundNumText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  roundText: { fontSize: 11, fontWeight: '600', color: '#40392A', flex: 1 },
  positionCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: RULE,
    marginBottom: 8,
  },
  posTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  posTitle: { fontSize: 12.5, fontWeight: '700', color: INK },
  posDept: { fontSize: 10, color: NAVY, fontWeight: '600' },
  posDesc: { fontSize: 11, color: INK_SOFT, lineHeight: 15, marginVertical: 4 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  skillChip: {
    fontSize: 9,
    color: NAVY,
    backgroundColor: '#EAF1F8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  applyPosBtn: {
    backgroundColor: NAVY,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
  },
  applyPosBtnDone: { backgroundColor: '#3D6B47' },
  applyPosBtnText: { color: '#fff', fontSize: 10.5, fontWeight: '700' },
  simpleRoleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: RULE,
    marginBottom: 6,
  },

  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 11,
    borderWidth: 1,
    borderColor: RULE,
    marginBottom: 8,
  },
  faqQ: { fontSize: 12, fontWeight: '700', color: INK, marginBottom: 3 },
  faqA: { fontSize: 11, color: INK_SOFT, lineHeight: 15 },
  contactDeskBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EAF1F8',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  contactDeskTitle: { fontSize: 12, fontWeight: '700', color: NAVY },
  contactDeskDesc: { fontSize: 10.5, color: '#3B6591' },
  noInfoText: { fontSize: 11, color: INK_FAINT, fontStyle: 'italic' },

  // ── Sort modal
  sortModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20,18,10,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sortModalBox: {
    backgroundColor: PAPER,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: RULE,
  },
  sortModalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    paddingBottom: 10,
    marginBottom: 8,
  },
  sortModalHeadline: { fontSize: 14.5, fontWeight: '700', color: INK },
  sortOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  sortOptionRowActive: { backgroundColor: '#EAF1F8' },
  sortOptionText: { fontSize: 12.5, fontWeight: '600', color: '#40392A' },
  sortOptionTextActive: { color: NAVY, fontWeight: '700' },

  // ── Edit modal
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20,18,10,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  editModalBox: {
    backgroundColor: PAPER,
    borderRadius: 18,
    padding: 18,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: RULE,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    paddingBottom: 10,
    marginBottom: 10,
  },
  editModalTitle: { fontSize: 15, fontWeight: '700', color: INK },
  editModalSub: { fontSize: 10.5, color: '#3D6B47', fontWeight: '600' },
  editInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: INK_SOFT,
    marginTop: 8,
    marginBottom: 3,
  },
  editInput: {
    borderWidth: 1,
    borderColor: RULE,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: INK,
    backgroundColor: '#fff',
  },
  editModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: RULE,
    paddingTop: 10,
  },
  cancelEditBtn: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: RULE,
  },
  cancelEditText: { fontSize: 12, fontWeight: '600', color: INK_SOFT },
  saveEditBtn: {
    backgroundColor: NAVY,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  saveEditText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});
