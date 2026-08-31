import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        navigate('/');
      }
    } else {
      // Sign Up
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
        // Insert custom user profile
        const { error: profileError } = await supabase.from('users').insert({
          auth_user_id: data.user.id,
          name: name,
          email: email,
          user_type: role,
          college_name: 'Default College'
        });

        if (profileError) {
          setError(profileError.message);
          setLoading(false);
        } else {
          // Success, should auto login
          navigate('/');
        }
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <Shield size={24} color="#fff" />
          </div>
          <h2 style={styles.title}>ClubSync Access</h2>
          <p style={styles.subtitle}>Sign in or create an account</p>
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
            <>
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
              <div style={styles.inputGroup}>
                <label style={styles.label}>Select Role</label>
                <select 
                  value={role} 
                  onChange={e => setRole(e.target.value)} 
                  style={styles.select}
                >
                  <option value="student">Student (Apply to clubs)</option>
                  <option value="recruiter">Recruiter (Review applications)</option>
                  <option value="admin">Admin (Manage recruitment cycles)</option>
                </select>
              </div>
            </>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
              placeholder="user@college.edu"
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
              placeholder="••••••••"
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
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    padding: 32,
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 48,
    height: 48,
    backgroundColor: '#0C447C',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    margin: 0,
  },
  tabs: {
    display: 'flex',
    marginBottom: 24,
    borderBottom: '2px solid #E2E8F0',
  },
  tab: {
    flex: 1,
    padding: '12px 0',
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
    padding: '12px 0',
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
    gap: 16,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#334155',
  },
  input: {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  select: {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    fontSize: 14,
    outline: 'none',
    backgroundColor: '#fff',
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
    marginTop: 8,
  },
  error: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    padding: 12,
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
  }
};
