import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEMO_PROFILES } from '../context/AuthContext';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { loginAsDemoRole } = useAuth();

  const handleDemoSelect = (roleKey: string) => {
    loginAsDemoRole(roleKey);
    navigate(`/${roleKey.toLowerCase()}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Check if the entered email matches any demo role
    const matchedRole = Object.keys(DEMO_PROFILES).find(
      key => DEMO_PROFILES[key].email.toLowerCase() === email.trim().toLowerCase()
    );

    if (matchedRole) {
      loginAsDemoRole(matchedRole);
      navigate(`/${matchedRole}`);
      return;
    }

    if (isLogin) {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // If network / DNS fails, allow fallback to student or president demo
          if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Failed')) {
            console.warn('Network issue connecting to Supabase; logging in with local student role');
            loginAsDemoRole('student');
            navigate('/student');
            return;
          }
          setError(error.message);
          setLoading(false);
        } else {
          navigate('/');
        }
      } catch (err: any) {
        console.warn('Supabase offline fallback:', err);
        loginAsDemoRole('student');
        navigate('/student');
      }
    } else {
      // Sign Up
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        if (data.user) {
          const { error: profileError } = await supabase.from('users').insert({
            auth_user_id: data.user.id,
            name: name,
            email: email,
            user_type: 'STUDENT',
            college_id: 'VIT_PUNE'
          });

          if (profileError) {
            setError(profileError.message);
            setLoading(false);
          } else {
            navigate('/');
          }
        }
      } catch (err: any) {
        // Fallback for offline demo
        loginAsDemoRole('student');
        navigate('/student');
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <img src="/clubsync-logo.jpg" alt="ClubSync" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12 }} />
          </div>
          <h2 style={styles.title}>ClubSync Access</h2>
          <p style={styles.subtitle}>Unified College Club & Activities Platform</p>
        </div>

        {/* Instant Demo Role Launcher */}
        <div style={styles.demoSection}>
          <div style={styles.demoHeader}>
            <span style={styles.demoBadge}>⚡ 1-Click Working Demo</span>
            <span style={styles.demoSub}>Choose any role to test live:</span>
          </div>
          
          <div style={styles.demoGrid}>
            <button 
              type="button" 
              onClick={() => handleDemoSelect('president')} 
              style={{ ...styles.demoBtn, borderColor: '#DC2626', background: '#FEF2F2' }}
              title="Events Desk, Proposal Notes & Publishing"
            >
              👑 <strong>President</strong>
              <span style={styles.demoRoleSub}>president.csi@vit.edu</span>
            </button>

            <button 
              type="button" 
              onClick={() => handleDemoSelect('faculty')} 
              style={{ ...styles.demoBtn, borderColor: '#16A34A', background: '#F0FDF4' }}
              title="Approvals Queue & Sanction Sign-offs"
            >
              🎓 <strong>Faculty</strong>
              <span style={styles.demoRoleSub}>mentor@vit.edu</span>
            </button>

            <button 
              type="button" 
              onClick={() => handleDemoSelect('student')} 
              style={{ ...styles.demoBtn, borderColor: '#0891B2', background: '#ECFEFF' }}
              title="Discover Events, Register & QR Entry Passes"
            >
              🎒 <strong>Student</strong>
              <span style={styles.demoRoleSub}>rohit.sharma@vit.edu</span>
            </button>
          </div>
        </div>

        <div style={styles.divider}>
          <span style={styles.dividerText}>or sign in with credentials</span>
        </div>

        <div style={styles.tabs}>
          <button 
            style={isLogin ? styles.tabActive : styles.tab} 
            onClick={() => { setIsLogin(true); setError(null); }}
            type="button"
          >
            Sign In
          </button>
          <button 
            style={!isLogin ? styles.tabActive : styles.tab} 
            onClick={() => { setIsLogin(false); setError(null); }}
            type="button"
          >
            Sign Up
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                style={styles.input}
                placeholder="Rahul Sharma"
                required={!isLogin}
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
              placeholder="e.g. president.csi@vit.edu or student@vit.edu"
              required
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
              placeholder="•••••••• (any password for demo)"
              required
            />
          </div>
          
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: '24px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 16,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
    padding: 32,
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
    overflow: 'hidden',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    margin: 0,
  },
  demoSection: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: '14px',
    marginBottom: 20,
    border: '1px solid #E2E8F0',
  },
  demoHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  demoBadge: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0C447C',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  demoSub: {
    fontSize: 11,
    color: '#64748B',
  },
  demoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
  },
  demoBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '8px 12px',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
    fontSize: 13,
    color: '#1E293B',
  },
  demoRoleSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    margin: '18px 0',
    color: '#94A3B8',
    fontSize: 12,
  },
  dividerText: {
    flex: 1,
    borderBottom: '1px solid #E2E8F0',
    lineHeight: '0.1em',
    margin: '0 10px',
  },
  tabs: {
    display: 'flex',
    marginBottom: 18,
    borderBottom: '2px solid #E2E8F0',
  },
  tab: {
    flex: 1,
    padding: '10px 0',
    textAlign: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: 14,
    fontWeight: 600,
    color: '#64748B',
    cursor: 'pointer',
    marginBottom: '-2px',
  },
  tabActive: {
    flex: 1,
    padding: '10px 0',
    textAlign: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid #0C447C',
    fontSize: 14,
    fontWeight: 600,
    color: '#0C447C',
    cursor: 'pointer',
    marginBottom: '-2px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#334155',
  },
  input: {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    backgroundColor: '#0C447C',
    color: '#fff',
    border: 'none',
    padding: '12px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
  },
  error: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    padding: 10,
    borderRadius: 8,
    fontSize: 12,
    marginBottom: 14,
    textAlign: 'center',
  }
};
