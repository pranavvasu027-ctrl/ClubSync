export interface College {
  id: string;
  name: string;
  shortName: string;
  city: string;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  collegeId: string;
  vertical: 'Technical' | 'Cultural' | 'Sports' | 'Social' | 'Entrepreneurship' | 'Literary';
  campus: string;
  facultyMentor: string;
  establishedYear: number;
  description: string;
  membersCount: number;
  openRecruitment: boolean;
  recruitmentDeadline?: string;
  recruitmentRoles?: string[];
  instagram: string;
  logoBg: string;
}

export interface EventItem {
  id: string;
  title: string;
  clubName: string;
  collegeName: string;
  vertical: 'Technical' | 'Cultural' | 'Sports' | 'Social' | 'Entrepreneurship' | 'Literary';
  date: string;
  month: string;
  day: string;
  time: string;
  venue: string;
  isHackathon?: boolean;
  prizePool?: string;
  ticketPrice: number; // 0 for free
  scope: 'Intra-Collegiate' | 'Inter-Collegiate' | 'Pune-Wide';
  description: string;
  registeredCount: number;
  maxCapacity: number;
  isRegistered?: boolean;
  status: 'upcoming' | 'past' | 'live';
  winner?: string;
  winningCollege?: string;
}

export interface DigitalTicket {
  id: string;
  eventId: string;
  eventTitle: string;
  clubName: string;
  venue: string;
  date: string;
  time: string;
  attendeeName: string;
  prn: string;
  college: string;
  ticketTier: string;
  qrCodeString: string;
  checkInStatus: 'CONFIRMED' | 'ATTENDED';
}

export const COLLEGES: College[] = [
  { id: 'VIT_PUNE', name: 'Vishwakarma Institute of Technology', shortName: 'VIT Pune', city: 'Pune' },
  { id: 'COEP_TECH', name: 'COEP Technological University', shortName: 'COEP Tech', city: 'Pune' },
  { id: 'PICT_PUNE', name: 'Pune Institute of Computer Technology', shortName: 'PICT', city: 'Pune' },
  { id: 'MIT_WPU', name: 'MIT World Peace University', shortName: 'MIT-WPU', city: 'Pune' },
  { id: 'VIIT_PUNE', name: 'Vishwakarma Institute of Info Tech', shortName: 'VIIT', city: 'Pune' },
  { id: 'PCCOE_PUNE', name: 'Pimpri Chinchwad College of Eng', shortName: 'PCCOE', city: 'Pune' },
];

export const CLUBS: Club[] = [
  {
    id: 'VIT_GEDIT',
    name: 'GedIT Technical Club',
    shortName: 'GedIT',
    collegeId: 'VIT_PUNE',
    vertical: 'Technical',
    campus: 'Bibwewadi',
    facultyMentor: 'Dr. S. K. Kulkarni',
    establishedYear: 2018,
    description: 'Premier coding, AI, and open-source hackathon club of VIT Pune.',
    membersCount: 140,
    openRecruitment: true,
    recruitmentDeadline: 'Tonight, 11:59 PM',
    recruitmentRoles: ['Web Dev Lead', 'AI/ML Track Head', 'Competitive Programmer'],
    instagram: '@gedit_vit',
    logoBg: '#185FA5',
  },
  {
    id: 'VIT_EDC',
    name: 'Entrepreneurship Development Cell',
    shortName: 'EDC',
    collegeId: 'VIT_PUNE',
    vertical: 'Entrepreneurship',
    campus: 'Bibwewadi',
    facultyMentor: 'Prof. A. R. Patil',
    establishedYear: 2012,
    description: 'Fostering startup culture, business pitch competitions, and the flagship Earn & Sell expo.',
    membersCount: 180,
    openRecruitment: true,
    recruitmentDeadline: '25 Aug 2026',
    recruitmentRoles: ['Corporate Relations', 'Event Logistics', 'Marketing Lead'],
    instagram: '@edc_vit',
    logoBg: '#854F0B',
  },
  {
    id: 'VIT_SPEAKERS',
    name: 'Speakers Arena & Debating Society',
    shortName: 'Speakers Arena',
    collegeId: 'VIT_PUNE',
    vertical: 'Literary',
    campus: 'Bibwewadi',
    facultyMentor: 'Dr. V. Joshi',
    establishedYear: 2016,
    description: 'Hub for public speaking, parliamentary debate, model UN, and oratory excellence.',
    membersCount: 95,
    openRecruitment: false,
    instagram: '@speakersarena_vit',
    logoBg: '#534AB7',
  },
  {
    id: 'VIT_TRF',
    name: 'The Robotics Forum',
    shortName: 'TRF',
    collegeId: 'VIT_PUNE',
    vertical: 'Technical',
    campus: 'Bibwewadi',
    facultyMentor: 'Dr. M. S. Deshmukh',
    establishedYear: 2008,
    description: 'Robocon championship team, combat robotics, and autonomous hardware engineering.',
    membersCount: 120,
    openRecruitment: true,
    recruitmentDeadline: '30 Aug 2026',
    recruitmentRoles: ['Embedded Systems', 'Mechanical CAD', 'Control Systems'],
    instagram: '@trf_vit',
    logoBg: '#1E3A8A',
  },
  {
    id: 'VIT_MELANGE',
    name: 'Mélange Cultural Committee',
    shortName: 'Mélange',
    collegeId: 'VIT_PUNE',
    vertical: 'Cultural',
    campus: 'Bibwewadi',
    facultyMentor: 'Prof. K. N. Shinde',
    establishedYear: 2005,
    description: 'Organizer of the largest annual collegiate cultural festival in Pune.',
    membersCount: 220,
    openRecruitment: true,
    recruitmentDeadline: '28 Aug 2026',
    recruitmentRoles: ['Stage Management', 'Choreography Head', 'Sponsorship Head'],
    instagram: '@melange_vit',
    logoBg: '#BE185D',
  },
  {
    id: 'VIT_IEEE',
    name: 'IEEE Student Branch & CIS',
    shortName: 'IEEE',
    collegeId: 'VIT_PUNE',
    vertical: 'Technical',
    campus: 'Bibwewadi',
    facultyMentor: 'Dr. P. G. Gaikwad',
    establishedYear: 2010,
    description: 'Global technical community hosting IEEE conferences, workshops, and robotics leagues.',
    membersCount: 160,
    openRecruitment: true,
    recruitmentDeadline: '29 Aug 2026',
    recruitmentRoles: ['Research Lead', 'PR & Outreach', 'Tech Analyst'],
    instagram: '@ieee_vit',
    logoBg: '#0284C7',
  },
];

export const EVENTS: EventItem[] = [
  {
    id: 'EVT_01',
    title: 'Pune TechFest Grand Hackathon 2026',
    clubName: 'GedIT Technical Club',
    collegeName: 'VIT Pune',
    vertical: 'Technical',
    date: '2026-08-26',
    month: 'AUG',
    day: '26',
    time: '09:00 AM - 09:00 PM',
    venue: 'Sharad Arena & Computer Labs 1-4',
    isHackathon: true,
    prizePool: '₹1,00,000',
    ticketPrice: 0,
    scope: 'Pune-Wide',
    description: '36-Hour Hackathon with tracks in AI/ML, Web3, FinTech, and Smart Campus. Open to students across all Pune colleges.',
    registeredCount: 320,
    maxCapacity: 400,
    isRegistered: true,
    status: 'upcoming',
  },
  {
    id: 'EVT_02',
    title: 'Earn & Sell 2026 — Flagship Expo',
    clubName: 'Entrepreneurship Development Cell',
    collegeName: 'VIT Pune',
    vertical: 'Entrepreneurship',
    date: '2026-08-22',
    month: 'AUG',
    day: '22',
    time: '10:00 AM - 06:00 PM',
    venue: 'Bibwewadi Campus Main Ground',
    ticketPrice: 50,
    scope: 'Inter-Collegiate',
    description: 'Live business & startup stalls where student entrepreneurs put their selling, marketing, and business acumen to the test.',
    registeredCount: 450,
    maxCapacity: 600,
    isRegistered: true,
    status: 'upcoming',
  },
  {
    id: 'EVT_03',
    title: 'Inter-College Parliamentary Debate',
    clubName: 'Speakers Arena',
    collegeName: 'VIT Pune',
    vertical: 'Literary',
    date: '2026-08-28',
    month: 'AUG',
    day: '28',
    time: '02:00 PM - 07:00 PM',
    venue: 'Audi 1, Ground Floor',
    prizePool: '₹25,000',
    ticketPrice: 0,
    scope: 'Inter-Collegiate',
    description: '16 top debating teams from COEP, PICT, VIT, and MIT-WPU clash on economic and technological policies.',
    registeredCount: 95,
    maxCapacity: 120,
    isRegistered: false,
    status: 'upcoming',
  },
  {
    id: 'EVT_04',
    title: 'Autonomous Rover Challenge 2025 (Archive)',
    clubName: 'The Robotics Forum',
    collegeName: 'VIT Pune',
    vertical: 'Technical',
    date: '2025-10-15',
    month: 'OCT',
    day: '15',
    time: 'Completed',
    venue: 'Kondhwa Campus Arena',
    prizePool: '₹50,000',
    ticketPrice: 0,
    scope: 'Inter-Collegiate',
    description: 'Obstacle navigation and lidar mapping competition with 28 inter-college teams.',
    registeredCount: 140,
    maxCapacity: 140,
    status: 'past',
    winner: 'Team RoboSapiens (1st Place)',
    winningCollege: 'COEP Tech',
  },
];

export const MY_TICKETS: DigitalTicket[] = [
  {
    id: 'TCK_99182',
    eventId: 'EVT_01',
    eventTitle: 'Pune TechFest Grand Hackathon 2026',
    clubName: 'GedIT Technical Club',
    venue: 'Sharad Arena & Labs 1-4, VIT Pune',
    date: '26 Aug 2026',
    time: '09:00 AM IST',
    attendeeName: 'Rohan Sharma',
    prn: '12210892',
    college: 'VIT Pune',
    ticketTier: 'Hackathon All-Access Pass',
    qrCodeString: 'CLUBSYNC-TKT-EVT01-12210892-VALID',
    checkInStatus: 'CONFIRMED',
  },
  {
    id: 'TCK_88219',
    eventId: 'EVT_02',
    eventTitle: 'Earn & Sell 2026 — Flagship Expo',
    clubName: 'Entrepreneurship Development Cell',
    venue: 'Bibwewadi Main Ground, VIT Pune',
    date: '22 Aug 2026',
    time: '10:00 AM IST',
    attendeeName: 'Rohan Sharma',
    prn: '12210892',
    college: 'VIT Pune',
    ticketTier: 'Standard Entry Pass',
    qrCodeString: 'CLUBSYNC-TKT-EVT02-12210892-VALID',
    checkInStatus: 'CONFIRMED',
  },
];
