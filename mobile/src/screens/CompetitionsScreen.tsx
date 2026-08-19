import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CompetitionItem, COMPETITIONS, EventItem } from '../data/mockData';
import { CURRENT_USER, registerCompetitionTeam, publishWinners } from '../services/clubSyncService';
import { useTheme } from '../context/ThemeContext';

type CategoryFilter = 'All' | 'Hackathons' | 'B-Plan & Case Studies' | 'Quizzes & CTFs' | 'Cultural & Sports' | 'Events & Workshops';

interface CompetitionsScreenProps {
  events: EventItem[];
}

export default function CompetitionsScreen({ events }: CompetitionsScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const [mainTab, setMainTab] = useState<'Discover' | 'Applied' | 'Watchlist' | 'Past'>('Discover');

  // Map external college events into CompetitionItem format
  const externalEventsAsCompetitions: CompetitionItem[] = events
    .filter(evt => evt.collegeName !== CURRENT_USER.collegeName)
    .map(evt => ({
      id: evt.id,
      title: evt.title,
      organizer: evt.clubName,
      organizerLogoBg: evt.vertical === 'Technical' ? '#185FA5' : '#D946EF',
      collegeName: evt.collegeName,
      category: 'Events & Workshops',
      mode: 'Offline On-Campus',
      location: evt.venue,
      teamSize: 'Individual Participation',
      minTeam: 1,
      maxTeam: 1,
      tags: [evt.vertical, evt.scope],
      daysLeft: evt.status === 'past' ? 'Ended' : 'Soon',
      deadlineDate: evt.date,
      prizePool: evt.prizePool || 'Certificate',
      entryFee: evt.ticketPrice,
      registeredCount: evt.registeredCount,
      description: evt.description,
      eligibility: 'Open to all students globally.',
      isRegistered: evt.isRegistered,
      status: evt.status === 'past' ? 'past' : 'upcoming',
      winner: evt.winner,
      winningCollege: evt.winningCollege,
    }));

  const [competitionsList, setCompetitionsList] = useState<CompetitionItem[]>([...COMPETITIONS, ...externalEventsAsCompetitions]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [teamSizeFilter, setTeamSizeFilter] = useState<'all' | 'solo' | 'team'>('all');
  const [freeOnlyFilter, setFreeOnlyFilter] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<{ [id: string]: boolean }>({});

  // Registration Modal State
  const [selectedComp, setSelectedComp] = useState<CompetitionItem | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teammate1PRN, setTeammate1PRN] = useState('');
  const [teammate2PRN, setTeammate2PRN] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // POST COMPETITION MODAL STATE
  const [showHostModal, setShowHostModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postOrganizer, setPostOrganizer] = useState('Techfest IIT Bombay');
  const [postCollege, setPostCollege] = useState('IIT Bombay');
  const [postCategory, setPostCategory] = useState<CategoryFilter>('Hackathons');
  const [postLocation, setPostLocation] = useState('Online Pan-India');
  const [postPrize, setPostPrize] = useState('₹1,50,000');
  const [postDeadline, setPostDeadline] = useState('20 Sep 2026');
  const [postDesc, setPostDesc] = useState('');

  // PUBLISH WINNER (HALL OF FAME) MODAL STATE
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winnerCompId, setWinnerCompId] = useState<string | null>(null);
  const [winnerName, setWinnerName] = useState('Team CodeCraft');
  const [winningCollege, setWinningCollege] = useState('VIT Pune');
  const [winnerPrize, setWinnerPrize] = useState('₹1,00,000');

  const categories = [
    { label: 'All', count: competitionsList.length, icon: 'trophy-outline' },
    { label: 'Hackathons', count: competitionsList.filter(c => c.category === 'Hackathons').length, icon: 'code-slash-outline' },
    { label: 'Events & Workshops', count: competitionsList.filter(c => c.category === 'Events & Workshops').length, icon: 'calendar-outline' },
    { label: 'B-Plan & Case Studies', count: competitionsList.filter(c => c.category === 'B-Plan & Case Studies').length, icon: 'briefcase-outline' },
    { label: 'Quizzes & CTFs', count: competitionsList.filter(c => c.category === 'Quizzes & CTFs').length, icon: 'help-circle-outline' },
    { label: 'Cultural & Sports', count: competitionsList.filter(c => c.category === 'Cultural & Sports').length, icon: 'musical-notes-outline' },
  ];

  // Sorting State
  type SortOption = 'closing' | 'prize' | 'registrations' | 'free';
  const [sortBy, setSortBy] = useState<SortOption>('closing');
  const [showSortModal, setShowSortModal] = useState(false);

  const sortLabels: Record<SortOption, string> = {
    closing: '⏳ Closing Soon',
    prize: '🏆 Highest Prize Pool',
    registrations: '🔥 Most Registrations',
    free: '🆓 Free Events First'
  };

  // Filtering & Sorting
  const filteredCompetitions = competitionsList.filter((comp) => {
    const isPast = comp.status === 'past' || comp.daysLeft === 'Ended';
    
    if (mainTab === 'Past' && !isPast) return false;
    if (mainTab !== 'Past' && isPast) return false;

    if (mainTab === 'Applied' && !comp.isRegistered) return false;
    if (mainTab === 'Watchlist' && !bookmarkedIds[comp.id]) return false;
    if (mainTab === 'Discover' && comp.isRegistered) return false;

    if (selectedCategory !== 'All' && comp.category !== selectedCategory) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        comp.title.toLowerCase().includes(q) ||
        comp.organizer.toLowerCase().includes(q) ||
        comp.description.toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'registrations') {
      return b.registeredCount - a.registeredCount;
    }
    if (sortBy === 'prize') {
      const parsePrize = (str: string = '') => parseInt(str.replace(/\D/g, '')) || 0;
      return parsePrize(b.prizePool) - parsePrize(a.prizePool);
    }
    if (sortBy === 'free') {
      if (a.entryFee === 0 && b.entryFee > 0) return -1;
      if (a.entryFee > 0 && b.entryFee === 0) return 1;
      return 0; 
    }
    const daysA = parseInt(a.daysLeft.replace(/\D/g, '')) || 999;
    const daysB = parseInt(b.daysLeft.replace(/\D/g, '')) || 999;
    return daysA - daysB;
  });

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenRegister = (comp: CompetitionItem) => {
    setSelectedComp(comp);
    setTeamName(`${CURRENT_USER.name.split(' ')[0]}'s Team`);
    setTeammate1PRN('');
    setTeammate2PRN('');
  };

  const handleConfirmTeamRegistration = async () => {
    if (!selectedComp) return;
    setIsRegistering(true);

    const teammatePrns = [teammate1PRN, teammate2PRN].filter(p => p.trim() !== '');
    const res = await registerCompetitionTeam(selectedComp.id, teamName, teammatePrns);

    setTimeout(() => {
      setIsRegistering(false);
      setCompetitionsList(prev => prev.map(c => c.id === selectedComp.id ? { ...c, isRegistered: true, registeredCount: c.registeredCount + 1 } : c));
      setSelectedComp(null);
      Alert.alert('Team Registration Confirmed! 🏆', res.message);
      setMainTab('Applied');
    }, 600);
  };

  const handleSavePostCompetition = () => {
    if (!postTitle.trim()) {
      Alert.alert('Missing Field', 'Please enter a competition title.');
      return;
    }

    const newComp: CompetitionItem = {
      id: `COMP_${Date.now()}`,
      title: postTitle.trim(),
      organizer: postOrganizer,
      organizerLogoBg: '#185FA5',
      collegeName: postCollege,
      category: postCategory === 'All' ? 'Hackathons' : postCategory,
      mode: 'Offline On-Campus',
      location: postLocation,
      teamSize: '1 - 4 Members',
      minTeam: 1,
      maxTeam: 4,
      tags: ['National', 'Live Contest'],
      daysLeft: '14 Days',
      deadlineDate: postDeadline,
      prizePool: postPrize,
      entryFee: 0,
      registeredCount: 1,
      description: postDesc || 'National inter-collegiate competition open to all students.',
      eligibility: 'Open to verified college students pan-India.',
      isRegistered: false,
      status: 'upcoming',
    };

    setCompetitionsList(prev => [newComp, ...prev]);
    setShowHostModal(false);
    Alert.alert('Competition Published 🚀', `"${newComp.title}" is now open for national student registrations.`);
  };

  const handleOpenPublishWinner = (comp: CompetitionItem) => {
    setWinnerCompId(comp.id);
    setWinnerPrize(comp.prizePool);
    setShowWinnerModal(true);
  };

  const handleConfirmPublishWinner = async () => {
    if (!winnerCompId) return;

    await publishWinners(winnerCompId, winnerName, winningCollege, winnerPrize);
    setCompetitionsList(prev => prev.map(c => 
      c.id === winnerCompId 
        ? { ...c, status: 'past', daysLeft: 'Ended', winner: winnerName, winningCollege: winningCollege }
        : c
    ));

    setShowWinnerModal(false);
    Alert.alert('Winner Published to Hall of Fame 🥇', `"${winnerName}" awarded 1st Place. Digital cryptographic certificate generated.`);
  };

  return (
    <View style={styles.container}>
      {/* SORT MODAL */}
      {showSortModal && (
        <Modal visible={true} transparent={true} animationType="fade" onRequestClose={() => setShowSortModal(false)}>
          <View style={styles.sortModalOverlay}>
            <View style={styles.sortModalBox}>
              <View style={styles.sortModalTop}>
                <Text style={styles.sortModalHeadline}>Sort Competitions By</Text>
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

      {/* POST COMPETITION MODAL */}
      {showHostModal && (
        <Modal visible={true} transparent={true} animationType="slide" onRequestClose={() => setShowHostModal(false)}>
          <View style={styles.sortModalOverlay}>
            <View style={styles.hostModalBox}>
              <View style={styles.sortModalTop}>
                <Text style={styles.sortModalHeadline}>Host National Competition</Text>
                <TouchableOpacity onPress={() => setShowHostModal(false)}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Competition / Hackathon Title *</Text>
                  <TextInput style={styles.formInput} placeholder="e.g. National Web3 AI Sprint" value={postTitle} onChangeText={setPostTitle} />

                  <Text style={styles.formLabel}>Organizer / Club Name</Text>
                  <TextInput style={styles.formInput} value={postOrganizer} onChangeText={setPostOrganizer} />

                  <Text style={styles.formLabel}>Host College / Institute</Text>
                  <TextInput style={styles.formInput} value={postCollege} onChangeText={setPostCollege} />

                  <Text style={styles.formLabel}>Prize Pool</Text>
                  <TextInput style={styles.formInput} placeholder="e.g. ₹2,00,000" value={postPrize} onChangeText={setPostPrize} />

                  <Text style={styles.formLabel}>Deadline Date</Text>
                  <TextInput style={styles.formInput} placeholder="e.g. 25 Sep 2026" value={postDeadline} onChangeText={setPostDeadline} />

                  <Text style={styles.formLabel}>Location / Venue</Text>
                  <TextInput style={styles.formInput} placeholder="e.g. Online Pan-India or Main Auditorium" value={postLocation} onChangeText={setPostLocation} />

                  <Text style={styles.formLabel}>Description</Text>
                  <TextInput style={[styles.formInput, { height: 60 }]} placeholder="Problem statement and tracks..." multiline value={postDesc} onChangeText={setPostDesc} />
                </View>
              </ScrollView>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowHostModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleSavePostCompetition}>
                  <Text style={styles.confirmBtnText}>Publish Live</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* PUBLISH WINNER (HALL OF FAME) MODAL */}
      {showWinnerModal && (
        <Modal visible={true} transparent={true} animationType="fade" onRequestClose={() => setShowWinnerModal(false)}>
          <View style={styles.sortModalOverlay}>
            <View style={styles.hostModalBox}>
              <View style={styles.sortModalTop}>
                <Text style={styles.sortModalHeadline}>Publish Podium Winner 🥇</Text>
                <TouchableOpacity onPress={() => setShowWinnerModal(false)}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Champion Team / Winner Name</Text>
                <TextInput style={styles.formInput} value={winnerName} onChangeText={setWinnerName} />

                <Text style={styles.formLabel}>Winning Institute / College</Text>
                <TextInput style={styles.formInput} value={winningCollege} onChangeText={setWinningCollege} />

                <Text style={styles.formLabel}>Prize Amount Awarded</Text>
                <TextInput style={styles.formInput} value={winnerPrize} onChangeText={setWinnerPrize} />
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowWinnerModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmPublishWinner}>
                  <Text style={styles.confirmBtnText}>Award Trophy & Cert ➔</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Global Competitions</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.hostCompBtn} onPress={() => setShowHostModal(true)}>
              <Ionicons name="add" size={15} color="#0C447C" />
              <Text style={styles.hostCompBtnText}>Host Contest</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sortIconBtn} onPress={() => setShowSortModal(true)}>
              <Ionicons name="filter" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.headerSub}>Compete in national hackathons, B-Plans & case studies</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#B5D4F4" />
          <TextInput 
            placeholder="Search Hackathons, B-Plans, CTFs..." 
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

      {/* Segmented Tabs */}
      <View style={styles.tabsRow}>
        {(['Discover', 'Applied', 'Watchlist', 'Past'] as const).map((tab) => (
          <TouchableOpacity 
            key={tab}
            style={[styles.tab, mainTab === tab && styles.tabActive]}
            onPress={() => setMainTab(tab)}
          >
            <Text style={[styles.tabText, mainTab === tab && styles.tabTextActive]}>
              {tab === 'Past' ? 'Hall of Fame' : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Filter Chips */}
      <View style={styles.chipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat.label}
              style={[styles.chip, selectedCategory === cat.label && styles.chipActive]}
              onPress={() => setSelectedCategory(cat.label as CategoryFilter)}
            >
              <Text style={[styles.chipText, selectedCategory === cat.label && styles.chipTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Competitions Feed */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filteredCompetitions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="trophy-broken" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No competitions found</Text>
            <Text style={styles.emptySub}>Try adjusting your filters or tap "+ Host Contest"</Text>
          </View>
        ) : (
          filteredCompetitions.map((comp) => (
            <View key={comp.id} style={styles.compCard}>
              <View style={styles.compHeader}>
                <View style={[styles.orgLogo, { backgroundColor: comp.organizerLogoBg }]}>
                  <Text style={styles.orgLogoText}>{comp.organizer.substring(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.compTitle}>{comp.title}</Text>
                  <Text style={styles.compOrg}>{comp.organizer} · {comp.collegeName}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleBookmark(comp.id)}>
                  <Ionicons 
                    name={bookmarkedIds[comp.id] ? "bookmark" : "bookmark-outline"} 
                    size={20} 
                    color={bookmarkedIds[comp.id] ? "#0C447C" : "#94A3B8"} 
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.compDesc} numberOfLines={2}>{comp.description}</Text>

              <View style={styles.compMetaRow}>
                <View style={styles.metaBadge}>
                  <Ionicons name="trophy" size={11} color="#D97706" />
                  <Text style={styles.metaBadgeText}>{comp.prizePool}</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Ionicons name="people" size={11} color="#0C447C" />
                  <Text style={styles.metaBadgeText}>{comp.teamSize}</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Ionicons name="time" size={11} color="#16A34A" />
                  <Text style={styles.metaBadgeText}>{comp.daysLeft}</Text>
                </View>
              </View>

              {comp.status === 'past' ? (
                <View style={styles.championBanner}>
                  <Ionicons name="ribbon" size={16} color="#B45309" />
                  <Text style={styles.championText}>
                    🥇 Winner: {comp.winner || 'Team HackElite'} ({comp.winningCollege || 'VIT Pune'})
                  </Text>
                </View>
              ) : (
                <View style={styles.cardFooter}>
                  <TouchableOpacity 
                    style={styles.awardWinnerBtn} 
                    onPress={() => handleOpenPublishWinner(comp)}
                  >
                    <Ionicons name="medal-outline" size={13} color="#64748B" />
                    <Text style={styles.awardWinnerText}>Publish Result</Text>
                  </TouchableOpacity>

                  {comp.isRegistered ? (
                    <View style={styles.appliedTag}>
                      <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                      <Text style={styles.appliedText}>Team Registered ✓</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.registerBtn}
                      onPress={() => handleOpenRegister(comp)}
                    >
                      <Text style={styles.registerBtnText}>Register Team ➔</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* TEAM REGISTRATION MODAL */}
      {selectedComp && (
        <Modal visible={true} transparent={true} animationType="slide" onRequestClose={() => setSelectedComp(null)}>
          <View style={styles.sortModalOverlay}>
            <View style={styles.teamModalBox}>
              <View style={styles.sortModalTop}>
                <Text style={styles.sortModalHeadline}>Register for {selectedComp.title}</Text>
                <TouchableOpacity onPress={() => setSelectedComp(null)}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Team Name *</Text>
                  <TextInput style={styles.formInput} value={teamName} onChangeText={setTeamName} />

                  <Text style={styles.formLabel}>Team Leader (You)</Text>
                  <View style={styles.readOnlyLeaderBox}>
                    <Text style={styles.leaderText}>{CURRENT_USER.name} ({CURRENT_USER.prn}) · {CURRENT_USER.collegeName}</Text>
                  </View>

                  <Text style={styles.formLabel}>Teammate 1 PRN / Student ID (Optional)</Text>
                  <TextInput style={styles.formInput} placeholder="e.g. 1251070583" value={teammate1PRN} onChangeText={setTeammate1PRN} />

                  <Text style={styles.formLabel}>Teammate 2 PRN / Student ID (Optional)</Text>
                  <TextInput style={styles.formInput} placeholder="e.g. 1251070584" value={teammate2PRN} onChangeText={setTeammate2PRN} />
                </View>
              </ScrollView>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedComp(null)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.confirmBtn} 
                  onPress={handleConfirmTeamRegistration}
                  disabled={isRegistering}
                >
                  {isRegistering ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.confirmBtnText}>Confirm Team Entry</Text>
                  )}
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
  hostCompBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  hostCompBtnText: {
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
  compCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  compHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  orgLogo: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgLogoText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  compTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  compOrg: {
    fontSize: 11,
    color: '#64748B',
  },
  compDesc: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 10,
  },
  compMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#334155',
  },
  championBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
  },
  championText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  awardWinnerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  awardWinnerText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  registerBtn: {
    backgroundColor: '#0C447C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  registerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  appliedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  appliedText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803D',
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
  hostModalBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    width: '100%',
    maxWidth: 380,
  },
  teamModalBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    width: '100%',
    maxWidth: 380,
  },
  formGroup: {
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
  readOnlyLeaderBox: {
    backgroundColor: '#E6F1FB',
    borderRadius: 8,
    padding: 10,
  },
  leaderText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0C447C',
  },
  actionRow: {
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
  confirmBtn: {
    flex: 1,
    backgroundColor: '#0C447C',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});
