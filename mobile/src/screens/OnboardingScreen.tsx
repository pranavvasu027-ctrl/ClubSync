import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLLEGES } from '../data/mockData';
import { User, setCurrentUser, updateUserProfile } from '../services/clubSyncService';
import { signInWithGoogle } from '../services/authService';

interface OnboardingProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Form State
  const [selectedCollegeId, setSelectedCollegeId] = useState('VIT_PUNE');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [prn, setPrn] = useState('');
  const [branch, setBranch] = useState('Computer Engineering');
  const [year, setYear] = useState('Third Year (TY)');
  const [cgpa, setCgpa] = useState('8.85');

  // Interests State
  const [interests, setInterests] = useState<{ [key: string]: boolean }>({
    tech: true,
    ent: true,
  });
  
  const interestOptions = [
    { id: 'tech', label: '💻 Tech & Hackathons' },
    { id: 'cult', label: '🎭 Cultural & Arts' },
    { id: 'sports', label: '🏆 Sports & Athletics' },
    { id: 'ent', label: '💼 Entrepreneurship' },
    { id: 'social', label: '🤝 Social Impact' },
    { id: 'lit', label: '📚 Literary & Debate' },
  ];

  const filteredColleges = COLLEGES.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    const res = await signInWithGoogle();
    setIsAuthenticating(false);

    if (res.success) {
      // Auto populate with demo Google authenticated account
      setName('Pranav Vasu');
      setEmail('pranav.1251070582@vit.edu');
      setPrn('1251070582');
      setSelectedCollegeId('VIT_PUNE');
      setBranch('Computer Engineering');
      setYear('Third Year (TY)');
      setCgpa('8.85');

      const user: User = {
        name: 'Pranav Vasu',
        email: 'pranav.1251070582@vit.edu',
        prn: '1251070582',
        collegeId: 'VIT_PUNE',
        collegeName: 'Vishwakarma Institute of Technology, Pune',
        branch: 'Computer Engineering',
        year: 'Third Year (TY)',
        cgpa: 8.85,
        skills: ['TypeScript', 'React Native', 'Node.js', 'PostgreSQL', 'AI/LLMs'],
        interests: ['Tech & Hackathons', 'Entrepreneurship'],
      };

      await updateUserProfile(user);
      Alert.alert('Google Sign-In Successful', 'Logged in as Pranav Vasu (Google Account: pranav.1251070582@vit.edu)');
      onComplete();
    }
  };

  const handleObserverSignIn = async () => {
    setIsAuthenticating(true);
    // Simulate Observer login (e.g. Faculty, DSA Head)
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsAuthenticating(false);

    const observerUser: User = {
      name: 'Dr. Faculty Admin',
      email: 'admin@vit.edu',
      prn: 'EMP-001',
      collegeId: 'VIT_PUNE',
      collegeName: 'Vishwakarma Institute of Technology, Pune',
      branch: 'Administration',
      year: 'Faculty',
      cgpa: 0,
      role: 'observer',
      canScanQR: true,
      bio: 'Dean of Student Affairs',
    };

    await updateUserProfile(observerUser);
    Alert.alert('Observer Login Successful', 'Logged in as Faculty Administrator.');
    onComplete();
  };

  const handleCollegeSelect = (id: string) => {
    setSelectedCollegeId(id);
    setStep(2);
  };

  const handleIdentitySubmit = () => {
    if (!name || !email || !prn) {
      Alert.alert('Missing Fields', 'Please fill in all required fields to proceed.');
      return;
    }
    setStep(3);
  };

  const toggleInterest = (id: string) => {
    setInterests(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleComplete = async () => {
    const selectedCount = Object.values(interests).filter(Boolean).length;
    if (selectedCount === 0) {
      Alert.alert('Select Interests', 'Please select at least one interest to personalize your feed.');
      return;
    }

    const college = COLLEGES.find(c => c.id === selectedCollegeId);
    
    // Create the user profile
    const newUser: User = {
      name: name,
      email: email,
      prn: prn,
      collegeId: selectedCollegeId,
      collegeName: college ? college.name : 'Vishwakarma Institute of Technology, Pune',
      branch: branch,
      year: year,
      cgpa: parseFloat(cgpa) || 8.50,
      interests: Object.keys(interests).filter(k => interests[k]),
    };
    
    await updateUserProfile(newUser);
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>CS</Text>
          </View>
          <Text style={styles.brandTitle}>ClubSync National</Text>
        </View>

        {/* STEP 1: SELECT COLLEGE OR GOOGLE SIGN IN */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Find your college</Text>
            <Text style={styles.stepSub}>Join 45,000+ students & clubs across India.</Text>

            {/* Google OAuth Quick Action */}
            <TouchableOpacity 
              style={styles.googleBtn} 
              onPress={handleGoogleSignIn}
              disabled={isAuthenticating}
              activeOpacity={0.8}
            >
              {isAuthenticating ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#EA4335" />
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Observer Demo Login */}
            <TouchableOpacity 
              style={[styles.googleBtn, { marginTop: 12, backgroundColor: '#0F172A' }]} 
              onPress={handleObserverSignIn}
              disabled={isAuthenticating}
              activeOpacity={0.8}
            >
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
              <Text style={[styles.googleBtnText, { color: '#fff', marginLeft: 8 }]}>Continue as Observer (Demo)</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or select your institute</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#64748B" />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search VIT Pune, IIT Bombay, COEP..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView style={styles.collegeList} showsVerticalScrollIndicator={false}>
              {filteredColleges.map((c) => (
                <TouchableOpacity 
                  key={c.id} 
                  style={styles.collegeCard}
                  onPress={() => handleCollegeSelect(c.id)}
                >
                  <View style={styles.collegeIcon}>
                    <Ionicons name="business-outline" size={20} color="#0C447C" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.collegeShortName}>{c.shortName} · {c.city}</Text>
                    <Text style={styles.collegeFullName} numberOfLines={1}>{c.name}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        )}

        {/* STEP 2: STUDENT IDENTITY */}
        {step === 2 && (
          <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
              <Ionicons name="arrow-back" size={20} color="#0C447C" />
              <Text style={styles.backText}>Change College</Text>
            </TouchableOpacity>

            <Text style={styles.stepTitle}>Create your passport</Text>
            <Text style={styles.stepSub}>This verifies your student identity for gate passes & certificates.</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Pranav Vasu" value={name} onChangeText={setName} />

              <Text style={styles.label}>College Email</Text>
              <TextInput style={styles.input} placeholder="pranav.1251070582@vit.edu" keyboardType="email-address" value={email} onChangeText={setEmail} autoCapitalize="none" />

              <Text style={styles.label}>Student ID / PRN / Roll No</Text>
              <TextInput style={styles.input} placeholder="e.g. 1251070582" value={prn} onChangeText={setPrn} autoCapitalize="characters" />
              
              <Text style={styles.label}>Branch / Department</Text>
              <TextInput style={styles.input} placeholder="e.g. Computer Engineering" value={branch} onChangeText={setBranch} />

              <Text style={styles.label}>Cumulative CGPA (0.00 - 10.00)</Text>
              <TextInput style={styles.input} placeholder="e.g. 8.85" keyboardType="numeric" value={cgpa} onChangeText={setCgpa} />

              <Text style={styles.label}>Academic Year</Text>
              <View style={styles.yearChips}>
                {['First Year (FY)', 'Second Year (SY)', 'Third Year (TY)', 'Final Year (B.Tech)'].map(y => (
                  <TouchableOpacity 
                    key={y} 
                    style={[styles.yearChip, year === y && styles.yearChipActive]}
                    onPress={() => setYear(y)}
                  >
                    <Text style={[styles.yearChipText, year === y && styles.yearChipTextActive]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleIdentitySubmit}>
              <Text style={styles.primaryBtnText}>Continue ➔</Text>
            </TouchableOpacity>
            <View style={{ height: 60 }} />
          </ScrollView>
        )}

        {/* STEP 3: INTERESTS */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
              <Ionicons name="arrow-back" size={20} color="#0C447C" />
              <Text style={styles.backText}>Edit Profile</Text>
            </TouchableOpacity>

            <Text style={styles.stepTitle}>What are you into?</Text>
            <Text style={styles.stepSub}>We'll personalize your home feed with relevant clubs and events.</Text>

            <View style={styles.interestsGrid}>
              {interestOptions.map(opt => (
                <TouchableOpacity 
                  key={opt.id}
                  style={[styles.interestCard, interests[opt.id] && styles.interestCardActive]}
                  onPress={() => toggleInterest(opt.id)}
                >
                  <Text style={[styles.interestText, interests[opt.id] && styles.interestTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleComplete}>
              <Text style={styles.primaryBtnText}>Launch ClubSync 🚀</Text>
            </TouchableOpacity>
          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  logoBadge: {
    backgroundColor: '#0C447C',
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  brandTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  stepContainer: {
    flex: 1,
    padding: 22,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  stepSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 18,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
  },
  dividerText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  collegeList: {
    flex: 1,
  },
  collegeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  collegeIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#E6F1FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collegeShortName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0C447C',
    marginBottom: 2,
  },
  collegeFullName: {
    fontSize: 11,
    color: '#64748B',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0C447C',
  },
  formGroup: {
    gap: 14,
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: -6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0F172A',
  },
  yearChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  yearChipActive: {
    backgroundColor: '#0C447C',
    borderColor: '#0C447C',
  },
  yearChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  yearChipTextActive: {
    color: '#fff',
  },
  primaryBtn: {
    backgroundColor: '#0C447C',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  interestCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interestCardActive: {
    borderColor: '#0C447C',
    backgroundColor: '#E6F1FB',
  },
  interestText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  interestTextActive: {
    color: '#0C447C',
  },
});
