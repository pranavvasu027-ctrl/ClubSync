export interface ExecTask {
  id: string;
  title: string;
  dueDate: string;
  assignee: string;
  priority: 'low' | 'mid' | 'high';
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
}

export interface ExecAnnouncement {
  id: string;
  title: string;
  audience: string;
  sentDate: string;
  delivered: number;
  read: number;
  openRate: string;
}

export interface ExecEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  registrations: number;
  capacity: number;
  role: string;
  countdown: string;
  colors: string[]; // for the gradient accent
}

export interface ExecTeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  status: 'on' | 'off';
  task: string;
  color: string;
}

export interface ExecData {
  tasks: ExecTask[];
  announcements: ExecAnnouncement[];
  events: ExecEvent[];
  team: ExecTeamMember[];
}

export const initialExecData: ExecData = {
  tasks: [
    { id: 't1', title: 'Research sponsor options', dueDate: 'Marketing', assignee: 'RM', priority: 'mid', status: 'backlog' },
    { id: 't2', title: 'Draft social media calendar', dueDate: 'Content', assignee: 'PS', priority: 'low', status: 'backlog' },
    { id: 't3', title: 'Plan team outing', dueDate: 'Misc', assignee: 'AJ', priority: 'low', status: 'backlog' },
    { id: 't4', title: 'Design hackathon poster', dueDate: '24 Aug', assignee: 'SK', priority: 'high', status: 'todo' },
    { id: 't5', title: 'Setup registration portal', dueDate: '25 Aug', assignee: 'AJ', priority: 'high', status: 'todo' },
    { id: 't6', title: 'Book auditorium', dueDate: '26 Aug', assignee: 'SD', priority: 'mid', status: 'todo' },
    { id: 't7', title: 'Order merchandise', dueDate: '28 Aug', assignee: 'RK', priority: 'low', status: 'todo' },
    { id: 't8', title: 'Review poster designs', dueDate: 'Today', assignee: 'AJ', priority: 'high', status: 'in-progress' },
    { id: 't9', title: 'Update event page', dueDate: 'Tomorrow', assignee: 'AP', priority: 'mid', status: 'in-progress' },
    { id: 't10', title: 'Coordinate with sponsors', dueDate: '26 Aug', assignee: 'RM', priority: 'mid', status: 'in-progress' },
    { id: 't11', title: 'Final poster approval', dueDate: 'Today', assignee: 'AJ', priority: 'high', status: 'review' },
    { id: 't12', title: 'Budget spreadsheet review', dueDate: 'Tomorrow', assignee: 'VS', priority: 'mid', status: 'review' },
    { id: 't13', title: 'Venue confirmed', dueDate: 'Logistics', assignee: 'SD', priority: 'low', status: 'done' },
    { id: 't14', title: 'Team roles assigned', dueDate: 'Mgmt', assignee: 'AJ', priority: 'low', status: 'done' },
    { id: 't15', title: 'Social handles updated', dueDate: 'Content', assignee: 'PS', priority: 'low', status: 'done' },
  ],
  announcements: [
    { id: 'a1', title: 'Hackathon Registration Open!', audience: 'All Members', sentDate: '22 Aug', delivered: 180, read: 142, openRate: '78.9%' },
    { id: 'a2', title: 'Team Meeting This Friday', audience: 'Core Team', sentDate: '20 Aug', delivered: 42, read: 38, openRate: '90.5%' },
    { id: 'a3', title: 'Design Assets Update', audience: 'Coordinators', sentDate: '18 Aug', delivered: 25, read: 19, openRate: '76.0%' },
  ],
  events: [
    { id: 'e1', title: 'Pune TechFest Grand Hackathon', date: '28 Aug', location: 'Auditorium', registrations: 142, capacity: 200, role: 'Tech Coordinator', countdown: '4d 0h left', colors: ['var(--exec-lime)', 'var(--exec-sky)'] },
    { id: 'e2', title: 'Code Sprint Weekend', date: '05 Sep', location: 'Lab 401', registrations: 56, capacity: 80, role: 'Event Lead', countdown: '12d 0h left', colors: ['var(--exec-amber)', 'var(--exec-coral)'] },
    { id: 'e3', title: 'Web3 Workshop Series', date: '10 Sep', location: 'Seminar Hall', registrations: 80, capacity: 120, role: 'Speaker Coordinator', countdown: '17d 0h left', colors: ['var(--exec-sky)', 'var(--exec-lime)'] },
    { id: 'e4', title: 'AI/ML Bootcamp', date: '20 Sep', location: 'Auditorium', registrations: 120, capacity: 150, role: 'Logistics Lead', countdown: '27d 0h left', colors: ['var(--exec-coral)', 'var(--exec-amber)'] },
  ],
  team: [
    { id: 'tm1', name: 'Sneha Kulkarni', role: 'Design Lead', initials: 'SK', status: 'on', task: 'Working on poster designs', color: 'var(--exec-lime)' },
    { id: 'tm2', name: 'Rohan Mehta', role: 'Marketing Lead', initials: 'RM', status: 'on', task: 'Coordinating sponsors', color: 'var(--exec-sky)' },
    { id: 'tm3', name: 'Priya Sharma', role: 'Secretary', initials: 'PS', status: 'off', task: 'Updating social media', color: 'var(--exec-coral)' },
    { id: 'tm4', name: 'Sarthak Deshpande', role: 'Coordinator', initials: 'SD', status: 'on', task: 'Booking venues', color: 'var(--exec-amber)' },
  ]
};
