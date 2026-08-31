export interface ClubEvent {
  id: string;
  title: string;
  event_date: string;
  location: string;
  status: 'draft' | 'pending' | 'approved' | 'live' | 'completed';
  expected_users: number;
  budget_allocated: number;
}

export interface ClubLedgerTxn {
  id: string;
  type: 'in' | 'out';
  amount: number;
  description: string;
  txn_date: string;
}

export interface ClubApplicant {
  id: string;
  name: string;
  role: string;
  cgpa: number;
  stage: 'applied' | 'screening' | 'interview' | 'selected' | 'onboarded';
}

export interface ClubTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assignee_initials: string | null;
}
