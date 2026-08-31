import React, { useState, useEffect, useRef } from 'react';
import { IconBell, IconCircleCheck, IconInfoCircle, IconAlertTriangle, IconX } from '@tabler/icons-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  is_read: boolean;
  created_at: string;
}

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    // Get the DB user id
    supabase.from('users').select('id').eq('auth_user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setDbUserId(data.id);
          fetchNotifications(data.id);
        }
      });
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async (uid: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!dbUserId) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', dbUserId);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const typeIcon = (type: string) => {
    if (type === 'success') return <IconCircleCheck size={14} />;
    if (type === 'warning') return <IconAlertTriangle size={14} />;
    return <IconInfoCircle size={14} />;
  };

  const typeColor = (type: string) => {
    if (type === 'success') return '#4ADE80';
    if (type === 'warning') return '#FBBF24';
    return '#60A5FA';
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => {
          setOpen(o => !o);
          if (!open && dbUserId) fetchNotifications(dbUserId);
        }}
        style={{
          position: 'relative',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: 8,
          color: '#8A8FA8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconBell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 2, right: 2,
            minWidth: 16, height: 16,
            background: '#F87171',
            borderRadius: 10,
            fontSize: 9,
            fontWeight: 700,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '110%',
          right: 0,
          width: 340,
          background: '#1A1A20',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          zIndex: 1000,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#E8EAF0' }}>
              Notifications {unreadCount > 0 && <span style={{ color: '#F87171', fontWeight: 600 }}>({unreadCount})</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ fontSize: 11, color: '#60A5FA', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52566A', display: 'flex' }}>
                <IconX size={16} />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#52566A', fontSize: 13 }}>
                <IconBell size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                <div>No notifications yet</div>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    background: n.is_read ? 'transparent' : 'rgba(79,142,247,0.04)',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ color: typeColor(n.type), marginTop: 2, flexShrink: 0 }}>
                      {typeIcon(n.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: n.is_read ? 500 : 700, color: '#E8EAF0', marginBottom: 2 }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#8A8FA8', lineHeight: 1.4 }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#52566A', marginTop: 4 }}>
                        {timeAgo(n.created_at)}
                      </div>
                    </div>
                    {!n.is_read && (
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4F8EF7', flexShrink: 0, marginTop: 4 }} />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
