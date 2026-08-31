import React from 'react';

type Status =
  | 'applied'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'selected'
  | 'waitlisted'
  | 'rejected'
  | 'onboarded'
  | 'draft'
  | 'open'
  | 'closed'
  | 'complete'
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | string;

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  applied:              { label: 'Applied',            bg: 'rgba(79,142,247,0.15)',   color: '#4F8EF7' },
  shortlisted:          { label: 'Shortlisted',        bg: 'rgba(251,191,36,0.15)',   color: '#FBBF24' },
  interview_scheduled:  { label: 'Interview Set',      bg: 'rgba(168,85,247,0.15)',   color: '#C084FC' },
  selected:             { label: 'Selected ✓',         bg: 'rgba(74,222,128,0.15)',   color: '#4ADE80' },
  waitlisted:           { label: 'Waitlisted',         bg: 'rgba(251,146,60,0.15)',   color: '#FB923C' },
  rejected:             { label: 'Rejected',           bg: 'rgba(248,113,113,0.15)',  color: '#F87171' },
  onboarded:            { label: 'Onboarded 🎉',       bg: 'rgba(34,211,238,0.15)',   color: '#22D3EE' },
  draft:                { label: 'Draft',              bg: 'rgba(148,163,184,0.15)',  color: '#94A3B8' },
  open:                 { label: 'Open',               bg: 'rgba(74,222,128,0.15)',   color: '#4ADE80' },
  closed:               { label: 'Closed',             bg: 'rgba(251,191,36,0.15)',   color: '#FBBF24' },
  complete:             { label: 'Complete',           bg: 'rgba(96,165,250,0.15)',   color: '#60A5FA' },
  scheduled:            { label: 'Scheduled',          bg: 'rgba(168,85,247,0.15)',   color: '#C084FC' },
  completed:            { label: 'Completed',          bg: 'rgba(74,222,128,0.15)',   color: '#4ADE80' },
  cancelled:            { label: 'Cancelled',          bg: 'rgba(248,113,113,0.15)',  color: '#F87171' },
};

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: 'rgba(148,163,184,0.15)', color: '#94A3B8' };
  const fontSize = size === 'sm' ? 10 : 11.5;
  const padding = size === 'sm' ? '2px 7px' : '3px 10px';

  return (
    <span style={{
      display: 'inline-block',
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.color}33`,
      borderRadius: 20,
      fontSize,
      fontWeight: 600,
      padding,
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
