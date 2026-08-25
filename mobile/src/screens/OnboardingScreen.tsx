import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLLEGES } from '../data/mockData';
import { User, setCurrentUser, updateUserProfile } from '../services/clubSyncService';
import { MULTI_COLLEGE_ENABLED } from '../config/featureFlags';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } from '../services/authService';

interface OnboardingProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Auth State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Form State
  const [selectedCollegeId, setSelectedCollegeId] = useState('VIT_PUNE');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [prn, setPrn] = useState('');
  const [branch, setBranch] = useState('Computer Engineering');
  const [year, setYear] = useState('Third Year (TY)');
  const [cgpa, setCgpa] = useState('8.85');

  // ... (keep interests state and handle methods unchanged, we'll insert a handleEmailSignIn method)

  const handleEmailSignIn = async () => {
    if (!authEmail || !authPassword) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    
    setIsAuthenticating(true);
    const res = await signInWithEmail(authEmail, authPassword);
    setIsAuthenticating(false);

    if (res.success) {
      Alert.alert('Login Successful', 'Welcome back to ClubSync!');
      onComplete();
    } else {
      Alert.alert('Login Failed', res.error || 'Invalid credentials. If you are new, please sign up instead.');
    }
  };

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

    if (!res.success) {
      Alert.alert('Google Sign-In Failed', res.error || 'Something went wrong. Please try again.');
      return;
    }

    if (res.isNewUser) {
      // New user — send them to onboarding Step 2 to fill in PRN, Branch, etc.
      // Pre-fill what we can from the Google account
      const { getActiveSession } = require('../services/authService');
      const session = await getActiveSession();
      if (session?.user) {
        setName(session.user.user_metadata?.full_name || '');
        setEmail(session.user.email || '');
      }
      setSelectedCollegeId('VIT_PUNE');
      setStep(2);
    } else {
      // Returning user — skip onboarding, go straight to app
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
    if (!name || !email || !prn || !password) {
      Alert.alert('Missing Fields', 'Please fill in all required fields including a password to proceed.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    setStep(3);
  };

  const toggleInterest = (id: string) => {
    setInterests(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [password, setPassword] = useState('');

  const handleForgotPassword = async () => {
    if (!authEmail) {
      Alert.alert('Missing Email', 'Please enter your email address first so we know where to send the reset link.');
      return;
    }
    
    Alert.alert(
      'Reset Password',
      `Send a password reset link to ${authEmail}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Link', 
          onPress: async () => {
            setIsAuthenticating(true);
            const res = await resetPassword(authEmail);
            setIsAuthenticating(false);
            if (res.success) {
              Alert.alert('Email Sent!', 'Check your inbox for the password reset link.');
            } else {
              Alert.alert('Error', res.error || 'Failed to send reset link.');
            }
          }
        }
      ]
    );
  };

  const handleComplete = async () => {
    const selectedCount = Object.values(interests).filter(Boolean).length;
    if (selectedCount === 0) {
      Alert.alert('Select Interests', 'Please select at least one interest to personalize your feed.');
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert('Invalid Password', 'Please enter a password of at least 6 characters in the previous step.');
      setStep(2);
      return;
    }

    setIsAuthenticating(true);
    
    const college = COLLEGES.find(c => c.id === selectedCollegeId);
    
    const profile = {
      name,
      prn,
      collegeId: selectedCollegeId,
      collegeName: college ? college.name : 'Vishwakarma Institute of Technology, Pune',
      branch,
      year,
    };

    const res = await signUpWithEmail(email, password, profile);
    setIsAuthenticating(false);

    if (res.success && res.user) {
      // Add interests and CGPA manually since signup doesn't cover them directly
      await updateUserProfile({ ...res.user, interests: Object.keys(interests).filter(k => interests[k]), cgpa: parseFloat(cgpa) || 8.50 });
      
      // Tell user to verify email before completing
      Alert.alert(
        'Verify Your Email',
        'We have sent a verification link to your email. You must click it before you can log in!',
        [{ text: 'Got it!', onPress: () => setStep(1) }] // Send back to login step
      );
    } else {
      Alert.alert('Sign Up Failed', res.error || 'Failed to create account. Email may already be in use.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>CS</Text>
          </View>
          <Text style={styles.brandTitle}>{MULTI_COLLEGE_ENABLED ? 'ClubSync National' : 'ClubSync VIT'}</Text>
        </View>

        {/* STEP 1: SELECT COLLEGE OR GOOGLE SIGN IN */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{MULTI_COLLEGE_ENABLED ? 'Find your college' : 'Welcome to ClubSync'}</Text>
            <Text style={styles.stepSub}>{MULTI_COLLEGE_ENABLED ? 'Join 45,000+ students & clubs across India.' : 'Your VIT Pune campus companion.'}</Text>

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

            {MULTI_COLLEGE_ENABLED ? (
              <>
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
              </>
            ) : (
              <>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or sign in with email</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={{ marginTop: 12 }}>
                  <TextInput 
                    style={[styles.input, { marginBottom: 12 }]} 
                    placeholder="Email Address (@vit.edu)" 
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={authEmail}
                    onChangeText={setAuthEmail}
                  />
                  <TextInput 
                    style={[styles.input, { marginBottom: 16 }]} 
                    placeholder="Password" 
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    value={authPassword}
                    onChangeText={setAuthPassword}
                  />
                  
                  <TouchableOpacity 
                    style={styles.primaryBtn} 
                    onPress={handleEmailSignIn}
                    disabled={isAuthenticating}
                  >
                    {isAuthenticating ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Sign In</Text>
                    )}
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                    <TouchableOpacity onPress={handleForgotPassword}>
                      <Text style={{ color: '#64748B', fontWeight: '500', fontSize: 13 }}>Forgot Password?</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => handleCollegeSelect('VIT_PUNE')}>
                      <Text style={{ color: '#0C447C', fontWeight: '600', fontSize: 14 }}>Create Account</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
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

              <Text style={styles.label}>Create Password</Text>
              <TextInput style={styles.input} placeholder="Must be at least 6 characters" secureTextEntry value={password} onChangeText={setPassword} />

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
