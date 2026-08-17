export interface College {
  id: string;
  name: string;
  shortName: string;
  city: string;
}

export interface CoreLead {
  name: string;
  role: string;
  year: string;
  branch: string;
  avatarText: string;
  email?: string;
  phone?: string;
}

export interface ClubFlagshipEvent {
  id: string;
  title: string;
  tagline: string;
  timeline: string;
  footfall: string;
  description: string;
  highlights: string[];
  prizePool?: string;
}

export interface ClubAchievement {
  title: string;
  year: string;
  description: string;
  rankBadge: string;
}

export interface RecruitmentPosition {
  title: string;
  department: string;
  openings: number;
  skills: string[];
  description: string;
}

export interface ClubFAQ {
  question: string;
  answer: string;
}

export interface Club {
  id: string;
  clubNo: string;
  name: string;
  shortName: string;
  tagline?: string;
  collegeId: string;
  vertical: 'Technical' | 'Cultural' | 'Sports' | 'Social' | 'Entrepreneurship' | 'Literary' | 'Others';
  tier: 'Tier 1 (Flagship)' | 'Tier 2 (Departmental)' | 'Special Interest';
  campus: string;
  workshopOrRoom?: string;
  facultyMentor: string;
  facultyDesignation?: string;
  presidentName?: string;
  presidentContact?: string;
  establishedYear: number;
  description: string;
  vision?: string;
  mission?: string;
  websiteUrl?: string;
  instagram: string;
  linkedin?: string;
  discord?: string;
  whatsappGroup?: string;
  officialEmail?: string;
  membersCount: number;
  openRecruitment: boolean;
  recruitmentDeadline?: string;
  recruitmentRounds?: string[];
  recruitmentPositions?: RecruitmentPosition[];
  recruitmentRoles?: string[];
  coreCommittee?: CoreLead[];
  flagshipEvents?: ClubFlagshipEvent[];
  achievements?: ClubAchievement[];
  faqs?: ClubFAQ[];
  logoBg: string;
}

export interface EventItem {
  id: string;
  title: string;
  clubName: string;
  collegeName: string;
  vertical: 'Technical' | 'Cultural' | 'Sports' | 'Social' | 'Entrepreneurship' | 'Literary' | 'Others';
  date: string;
  month: string;
  day: string;
  time: string;
  venue: string;
  isHackathon?: boolean;
  prizePool?: string;
  ticketPrice: number;
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
  // =========================================================================
  // 1. ENTREPRENEURSHIP DEVELOPMENT CELL (EDC / E-CELL VIT PUNE) — DEEP PROFILE
  // =========================================================================
  {
    id: 'VIT_EDC',
    clubNo: 'VIT/SA/25-26/O-005',
    name: 'Entrepreneurship Development Cell (EDC / E-Cell)',
    shortName: 'EDC / E-Cell',
    tagline: 'Fostering Innovation, Fueling Entrepreneurial Spirits',
    collegeId: 'VIT_PUNE',
    vertical: 'Entrepreneurship',
    tier: 'Tier 1 (Flagship)',
    campus: 'Bibwewadi Main Campus',
    workshopOrRoom: 'E-Cell Incubation Cabin 402, Building 3',
    facultyMentor: 'Prof. Gambhire & Prof. Vaishali Mishra',
    facultyDesignation: 'Head, Center for Innovation, Incubation & Enterprise',
    presidentName: 'Siddharth Deshmukh (B.E. Mechanical)',
    presidentContact: 'president.edc@vit.edu · +91 98230 44120',
    establishedYear: 2012,
    description: 'The premier student-run entrepreneurship body of VIT Pune dedicated to cultivating visionary founders, startup incubators, angel investment connect, and Maharashtra’s largest trade expo.',
    vision: 'To build a self-sustaining entrepreneurial ecosystem that converts innovative student ideas into commercially viable, high-growth startups contributing to national economic prosperity.',
    mission: 'Empowering aspiring student founders through structured startup cohorts, seed funding grants, industry mentorship, patent guidance, and hands-on business expos.',
    websiteUrl: 'https://ecellvitpune.in/',
    instagram: '@ecell_vit_pune',
    linkedin: 'https://linkedin.com/company/ecell-vit-pune',
    discord: 'https://discord.gg/ecell-vit',
    whatsappGroup: 'https://chat.whatsapp.com/EDC-VIT-Community-2026',
    officialEmail: 'ecell@vit.edu',
    membersCount: 230,
    openRecruitment: true,
    recruitmentDeadline: '25 Aug 2026, 11:59 PM',
    recruitmentRoles: ['Startup Incubation Associate', 'Corporate Sponsorship Lead', 'Earn & Sell Event Logistics', 'Creative Design & Branding', 'Public Relations & Media'],
    recruitmentRounds: [
      'Round 1: Online Application & SOP Submission (Eligibility check: CGPA ≥ 7.0)',
      'Round 2: Business Case Study & Problem Solving Challenge',
      'Round 3: Personal Interview with President & Faculty Mentors'
    ],
    recruitmentPositions: [
      {
        title: 'Startup Incubation Associate',
        department: 'Incubation & Mentorship',
        openings: 4,
        skills: ['Pitch Decks', 'Financial Modeling', 'Market Research', 'Startup Scouting'],
        description: 'Work directly with 15+ student startups in the college incubator, arranging VC demo days and angel investor meets.'
      },
      {
        title: 'Corporate Sponsorship Lead',
        department: 'Corporate Relations & Finance',
        openings: 3,
        skills: ['Negotiation', 'Cold Emailing', 'Brand Pitching', 'Contract Review'],
        description: 'Secure corporate sponsorships, brand partnerships, and cash prizes for E-Summit and Earn & Sell.'
      },
      {
        title: 'Earn & Sell Operations Head',
        department: 'Event Logistics',
        openings: 5,
        skills: ['Crowd Management', 'Vendor Coordination', 'Campus Logistics'],
        description: 'Coordinate stall allocations, electricity grids, and payment QR setups for over 600 student entrepreneurs.'
      },
      {
        title: 'Creative Media & Content Lead',
        department: 'Design & Marketing',
        openings: 4,
        skills: ['Figma', 'After Effects', 'Copywriting', 'Instagram Growth'],
        description: 'Design official campaigns, trailers, and brochures reaching over 25,000 students across Pune.'
      }
    ],
    coreCommittee: [
      { name: 'Siddharth Deshmukh', role: 'President', year: 'Final Year (B.E.)', branch: 'Mechanical Eng', avatarText: 'SD', email: 'siddharth.deshmukh@vit.edu' },
      { name: 'Ananya Joshi', role: 'Vice President', year: 'Third Year (T.Y.)', branch: 'Computer Eng', avatarText: 'AJ', email: 'ananya.joshi@vit.edu' },
      { name: 'Rohan Mehta', role: 'Head of Sponsorship', year: 'Third Year (T.Y.)', branch: 'Information Tech', avatarText: 'RM', email: 'rohan.mehta@vit.edu' },
      { name: 'Tanvi Kulkarni', role: 'Marketing & PR Lead', year: 'Third Year (T.Y.)', branch: 'AI & Data Science', avatarText: 'TK', email: 'tanvi.kulkarni@vit.edu' },
      { name: 'Aditya Patil', role: 'Operations & Stalls Head', year: 'Third Year (T.Y.)', branch: 'Production Eng', avatarText: 'AP', email: 'aditya.patil@vit.edu' },
    ],
    flagshipEvents: [
      {
        id: 'EDC_EVT_1',
        title: 'Earn & Sell 2026 — Flagship Trade Expo',
        tagline: 'Where Student Ideas Meet Real Campus Commerce',
        timeline: 'Annual 2-Day Mega Trade Fair (August)',
        footfall: '600+ Stalls · 8,000+ Footfall · ₹6.5 Lakhs Turnover',
        description: 'The landmark event of VIT Pune where student entrepreneurs set up live commercial ventures, food stalls, tech kiosks, and handmade brands to learn real revenue generation.',
        highlights: ['Live UPI payment system on every stall', 'Official seed grant vouchers for top revenue generators', 'Faculty & alumni jury evaluation'],
        prizePool: '₹50,000 Seed Capital'
      },
      {
        id: 'EDC_EVT_2',
        title: 'Vishwa E-Summit 2026',
        tagline: 'Annual National Entrepreneurship Conclave',
        timeline: 'National 3-Day Summit (January)',
        footfall: '2,500+ Attendees · 40+ Angel Investors & Shark Tank Founders',
        description: 'Flagship conclave featuring National Business Plan Competition, Startup Expo, Keynotes by Unicorn Founders, and Hack-a-Startup sprints.',
        highlights: ['Shark Tank style live pitching', 'Venture capital term-sheet deals', 'Networking dinner with alumni angel investors'],
        prizePool: '₹2,00,000 Grant Pool'
      },
      {
        id: 'EDC_EVT_3',
        title: 'Ideation 360 — 24hr Startup Ideathon',
        tagline: 'From Problem Statement to Pitch Deck in 24 Hours',
        timeline: 'Semester Sprint (October)',
        footfall: '120 Teams · 450 Participants',
        description: 'Fast-paced business ideation marathon solving sustainability, fintech, and AI problem statements with 1-on-1 VC mentorship.',
        highlights: ['Prototype validation clinic', 'Direct entry to VIT Incubator', 'Pitch deck teardowns'],
        prizePool: '₹40,000'
      }
    ],
    achievements: [
      { title: 'National Best E-Cell Award', year: '2025', description: 'Ranked amongst Top 3 Student Entrepreneurship Cells in India at National Entrepreneurship Summit (IIT Bombay).', rankBadge: '1st in State' },
      { title: '28+ Student Startups Incubated', year: '2024–2026', description: 'Graduated over 28 student ventures that raised cumulatively ₹18.5 Lakhs in angel and government grants.', rankBadge: 'Incubation Record' },
      { title: 'Highest Revenue Turnover in Maharashtra', year: '2025', description: 'Earn & Sell generated record single-day trade volume surpassing ₹5.2 Lakhs.', rankBadge: 'State Record' }
    ],
    faqs: [
      { question: 'Who is eligible to apply for EDC core committee?', answer: 'Second Year (S.Y.) and Third Year (T.Y.) students from any engineering branch with a minimum CGPA of 7.0 and passion for startups.' },
      { question: 'Do I need to have my own startup to join?', answer: 'No! We welcome students interested in management, corporate finance, marketing, public speaking, event production, and design.' },
      { question: 'How can student founders get incubation support?', answer: 'You can submit your pitch deck directly to the E-Cell Incubation Desk in Room 402 or apply during the annual Ideation 360 cohort.' }
    ],
    logoBg: '#854F0B',
  },

  // =========================================================================
  // 2. COMPUTER SOCIETY OF INDIA — VIT CHAPTER (CSI VIT) — DEEP PROFILE
  // =========================================================================
  {
    id: 'VIT_CSI',
    clubNo: 'VIT/SA/25-26/T-006',
    name: 'Computer Society of India - VIT Chapter (CSI VIT)',
    shortName: 'CSI VIT',
    tagline: 'Innovate, Integrate, Inspire — Advancing Computing Excellence',
    collegeId: 'VIT_PUNE',
    vertical: 'Technical',
    tier: 'Tier 1 (Flagship)',
    campus: 'Bibwewadi Main Campus',
    workshopOrRoom: 'CSI Technical Laboratory 104, Computer Dept',
    facultyMentor: 'Prof. Ghadekar P.P.',
    facultyDesignation: 'Professor & Head, Computer Science & Engineering',
    presidentName: 'Prathamesh Kulkarni (B.E. Computer)',
    presidentContact: 'president.csi@vit.edu · +91 97654 88201',
    establishedYear: 2014,
    description: 'The largest and most decorated computer science chapter of VIT Pune, conducting national coding symposiums, full-stack dev workshops, Linux masterclasses, and competitive programming championships.',
    vision: 'To nurture world-class software engineers, algorithmists, and computer scientists who drive innovation in open computing and cutting-edge software architecture.',
    mission: 'Providing rigorous peer-to-peer technical training, algorithmic bootcamps, open-source hackathons, and corporate mentorship to bridge academia and global tech industry standards.',
    websiteUrl: 'https://share.google/xctUxpASfq4QzVfsp',
    instagram: '@csi_vitpune',
    linkedin: 'https://linkedin.com/company/csi-vit-pune',
    discord: 'https://discord.gg/csi-vit',
    whatsappGroup: 'https://chat.whatsapp.com/CSI-VIT-CodeHub-2026',
    officialEmail: 'csi@vit.edu',
    membersCount: 220,
    openRecruitment: true,
    recruitmentDeadline: '26 Aug 2026, 11:59 PM',
    recruitmentRoles: ['Competitive Programming Mentor', 'Full-Stack Web Architect', 'Cloud & DevOps Lead', 'Corporate Technical PR', 'UI/UX & Graphics Designer'],
    recruitmentRounds: [
      'Round 1: Online Technical Aptitude & Coding Round (DSA / Problem Solving)',
      'Round 2: Domain Project Review / Take-Home Practical Task',
      'Round 3: Technical Interview with President & Prof. Ghadekar P.P.'
    ],
    recruitmentPositions: [
      {
        title: 'Competitive Programming Head',
        department: 'Coding & Algorithms',
        openings: 4,
        skills: ['C++', 'Data Structures', 'Codeforces (1400+)', 'Dynamic Programming'],
        description: 'Design contest problem sets for CodeKaze, curate weekly CP contests, and mentor junior students.'
      },
      {
        title: 'Full-Stack Web Architect',
        department: 'Web & App Development',
        openings: 5,
        skills: ['Next.js', 'React Native', 'Node.js', 'PostgreSQL / Supabase'],
        description: 'Build and maintain full-scale web platforms for CSI fests, live leaderboards, and internal club portals.'
      },
      {
        title: 'Cloud & AI Track Lead',
        department: 'Cloud & Emerging Tech',
        openings: 3,
        skills: ['AWS / GCP', 'Docker', 'FastAPI', 'PyTorch'],
        description: 'Conduct hands-on weekend bootcamps in cloud microservices and generative AI integration.'
      },
      {
        title: 'Corporate Sponsorship Secretary',
        department: 'Corporate Outreach',
        openings: 3,
        skills: ['Tech Company Outreach', 'MoUs', 'Tech Sponsorships'],
        description: 'Partner with companies like Google, Microsoft, and Red Hat for symposium sponsorships and judge panels.'
      }
    ],
    coreCommittee: [
      { name: 'Prathamesh Kulkarni', role: 'President', year: 'Final Year (B.E.)', branch: 'Computer Eng', avatarText: 'PK', email: 'prathamesh.kulkarni@vit.edu' },
      { name: 'Shruti Gaikwad', role: 'Vice President', year: 'Third Year (T.Y.)', branch: 'Computer Eng', avatarText: 'SG', email: 'shruti.gaikwad@vit.edu' },
      { name: 'Aryan Sharma', role: 'Technical Head', year: 'Third Year (T.Y.)', branch: 'Computer Eng', avatarText: 'AS', email: 'aryan.sharma@vit.edu' },
      { name: 'Neha Deshmukh', role: 'Webmaster & DevOps', year: 'Third Year (T.Y.)', branch: 'Information Tech', avatarText: 'ND', email: 'neha.deshmukh@vit.edu' },
      { name: 'Atharva Joshi', role: 'Treasurer & Operations', year: 'Third Year (T.Y.)', branch: 'AI & Data Science', avatarText: 'AJ', email: 'atharva.joshi@vit.edu' },
    ],
    flagshipEvents: [
      {
        id: 'CSI_EVT_1',
        title: 'TechSymposium 2026 — Annual Tech Conclave',
        tagline: 'Maharashtra’s Largest Student Computer Science Festival',
        timeline: 'Annual 3-Day Technical Fest (September)',
        footfall: '3,000+ Participants from 40+ Colleges',
        description: 'CSI’s flagship multi-track symposium featuring national 24-hour hackathons, algorithmic speed coding, web-design sprint, and AI research tracks.',
        highlights: ['Over 120 live hackathon teams', 'Official CSI certificates & trophy podiums', 'Direct recruitment referral fast-tracks'],
        prizePool: '₹1,50,000'
      },
      {
        id: 'CSI_EVT_2',
        title: 'CodeKaze — Inter-College Algorithmic Clash',
        tagline: 'Speed, Logic, and Algorithms on the Clock',
        timeline: 'Bi-Annual Coding League',
        footfall: '800+ Competitive Coders Across Pune',
        description: 'High-octane algorithmic contest hosted on Codeforces/HackerEarth with difficulty scaling from beginner to Candidate Master.',
        highlights: ['Real-time dynamic scoreboard', 'Custom curated problem sets by ICPC regionalists', 'Cash prizes and certificates'],
        prizePool: '₹35,000'
      },
      {
        id: 'CSI_EVT_3',
        title: 'Linux Kernel & Cloud Infrastructure Masterclass',
        tagline: 'Mastering Open Source & Cloud Scale',
        timeline: 'Weekend Hands-on Workshop (October)',
        footfall: '250+ Engineering Students',
        description: 'End-to-end hands-on training on bash scripting, Docker containerization, Kubernetes clusters, and cloud deployments.',
        highlights: ['Free cloud credits provided to all attendees', 'Project building with mentor code reviews'],
        prizePool: 'Free Cloud Certifications'
      }
    ],
    achievements: [
      { title: 'Best Student Chapter Award', year: '2024 & 2025', description: 'Awarded Best CSI Student Chapter in Region VI (Maharashtra & Goa) by CSI National Council.', rankBadge: '1st in Region VI' },
      { title: 'National Smart India Hackathon Mentorship', year: '2025', description: 'CSI-mentored teams won 3 national 1st-place trophies at SIH finals.', rankBadge: '3 SIH Trophies' },
      { title: 'Over 1,200+ Students Certified', year: '2025–26', description: 'Conducted 14 technical workshops with 100% verified certification issuance.', rankBadge: 'Accredited Hub' }
    ],
    faqs: [
      { question: 'Do I need to be a CSI national member to join?', answer: 'No! All VIT Pune engineering students can apply for the core team. Selected members will receive official CSI national membership credentials.' },
      { question: 'What technical stack does CSI use?', answer: 'We build with modern full-stack web technologies (Next.js, TypeScript, PostgreSQL, Supabase, Docker, Python PyTorch, and C++ for competitive programming).' },
      { question: 'How can I participate in CodeKaze and workshops?', answer: 'All upcoming CSI events are published right here in ClubSync with instant 1-tap digital tickets and verified certificates.' }
    ],
    logoBg: '#0284C7',
  },

  // =========================================================================
  // 3. SAE TEAM GRIFFIN (FORMULA STUDENT RACING) — TIER 1 FLAGSHIP
  // =========================================================================
  {
    id: 'VIT_SAE_GRIFFIN',
    clubNo: 'VIT/SA/25-26/T-001',
    name: 'SAE TEAM GRIFFIN (Formula Student Racing)',
    shortName: 'Team Griffin',
    tagline: 'Precision Engineering at 140 km/h',
    collegeId: 'VIT_PUNE',
    vertical: 'Technical',
    tier: 'Tier 1 (Flagship)',
    campus: 'Bibwewadi Workshop Ground Floor',
    workshopOrRoom: 'Formula Racing R&D Workshop Bay 1',
    facultyMentor: 'Prof. Sachin Komble',
    facultyDesignation: 'Associate Professor, Mechanical Engineering',
    presidentName: 'Devendra Patil (B.E. Mechanical)',
    establishedYear: 2011,
    description: 'Premier Formula Student combustion & electric race car design and manufacturing team representing VIT Pune at Formula Bharat and Formula Student Germany.',
    websiteUrl: 'https://teamgriffin.in',
    instagram: '@teamgriffin_vit',
    membersCount: 85,
    openRecruitment: true,
    recruitmentDeadline: '30 Aug 2026',
    recruitmentRoles: ['Aerodynamics Engineer', 'Powertrain & Battery Lead', 'Telemetry & DAQ'],
    logoBg: '#DC2626',
  },

  // =========================================================================
  // 4. THE ROBOTICS FORUM (TRF) — TIER 1 FLAGSHIP
  // =========================================================================
  {
    id: 'VIT_TRF',
    clubNo: 'VIT/SA/25-26/T-034',
    name: 'The Robotics Forum (TRF)',
    shortName: 'TRF',
    tagline: 'Design, Build, Dominate — Robocon National Champions',
    collegeId: 'VIT_PUNE',
    vertical: 'Technical',
    tier: 'Tier 1 (Flagship)',
    campus: 'Bibwewadi Robotics Lab',
    workshopOrRoom: 'Advanced Robotics R&D Lab 002',
    facultyMentor: 'Prof. Kalpesh Joshi',
    facultyDesignation: 'Head, Center for Robotics & Autonomous Systems',
    presidentName: 'Atharva Mane (B.E. ENTC)',
    establishedYear: 2008,
    description: 'National Robocon champions, autonomous rovers, swarm robotics, computer vision, and combat robotics team of VIT Pune.',
    instagram: '@trf_vit',
    membersCount: 165,
    openRecruitment: true,
    recruitmentDeadline: '30 Aug 2026',
    recruitmentRoles: ['Embedded Systems Lead', 'Computer Vision / ROS', 'Hardware Mechanical CAD'],
    logoBg: '#1E3A8A',
  },

  // =========================================================================
  // 5. GEDIT TECHNICAL CLUB — TIER 1 FLAGSHIP
  // =========================================================================
  {
    id: 'VIT_GEDIT',
    clubNo: 'VIT/SA/25-26/T-035',
    name: 'GedIT Technical Club',
    shortName: 'GedIT',
    tagline: 'Code, Create, Deploy — Hackathon Powerhouse',
    collegeId: 'VIT_PUNE',
    vertical: 'Technical',
    tier: 'Tier 1 (Flagship)',
    campus: 'Bibwewadi CS Labs',
    workshopOrRoom: 'GedIT Software Studio Lab 304',
    facultyMentor: 'Prof. Pankaj Kunekar',
    facultyDesignation: 'Assistant Professor, Computer Engineering',
    presidentName: 'Rohan Sharma (B.E. Computer)',
    establishedYear: 2018,
    description: 'Flagship competitive programming, full-stack, Web3, and hackathon organization at VIT Pune.',
    instagram: '@gedit_vit',
    membersCount: 195,
    openRecruitment: true,
    recruitmentDeadline: 'Tonight, 11:59 PM',
    recruitmentRoles: ['Web Dev Lead', 'AI/ML Head', 'Competitive Programming Mentor'],
    logoBg: '#185FA5',
  },

  // =========================================================================
  // 6. VICULP (MÉLANGE CULTURAL COMMITTEE) — TIER 1 FLAGSHIP
  // =========================================================================
  {
    id: 'VIT_MELANGE',
    clubNo: 'VIT/SA/25-26/C-001',
    name: 'VICULP (Mélange Cultural Committee)',
    shortName: 'Mélange',
    tagline: 'The Soul of Campus Culture & Celebration',
    collegeId: 'VIT_PUNE',
    vertical: 'Cultural',
    tier: 'Tier 1 (Flagship)',
    campus: 'Bibwewadi Main Campus',
    workshopOrRoom: 'Student Activities Council Room 101',
    facultyMentor: 'Prof. Deshpande D.R.',
    facultyDesignation: 'Dean Student Welfare',
    establishedYear: 2005,
    description: 'Organizer of the biggest annual inter-collegiate cultural festival in Maharashtra with celebrity concerts and 40+ events.',
    instagram: '@melange_vitpune',
    membersCount: 260,
    openRecruitment: true,
    recruitmentDeadline: '28 Aug 2026',
    recruitmentRoles: ['Concert Management', 'Celebrity PR', 'Sponsorship Secretary'],
    logoBg: '#BE185D',
  },

  // =========================================================================
  // 7. AAROH MUSIC CLUB — TIER 1 FLAGSHIP
  // =========================================================================
  {
    id: 'VIT_AAROH',
    clubNo: 'VIT/SA/25-26/C-006',
    name: 'Aaroh Music Club',
    shortName: 'Aaroh',
    tagline: 'Harmonizing Beats, Igniting Melodies',
    collegeId: 'VIT_PUNE',
    vertical: 'Cultural',
    tier: 'Tier 1 (Flagship)',
    campus: 'Bibwewadi Amphitheatre',
    facultyMentor: 'Prof. Kanjalkar Jyoti',
    establishedYear: 2013,
    description: 'Band performances, classical ensembles, acoustic open mics, and vocal music productions.',
    instagram: '@aaroh_vit',
    membersCount: 110,
    openRecruitment: true,
    recruitmentDeadline: '24 Aug 2026',
    recruitmentRoles: ['Lead Guitarist/Bassist', 'Vocalist (Western/Indian)', 'Sound Engineer'],
    logoBg: '#7C3AED',
  },

  // =========================================================================
  // 8. VIT SPORTS CLUB — TIER 1 FLAGSHIP
  // =========================================================================
  {
    id: 'VIT_SPORTS_CLUB',
    clubNo: 'VIT/SA/25-26/S-001',
    name: 'VIT Sports Club & Athletics Committee',
    shortName: 'Sports Club',
    tagline: 'Strength, Endurance, Glory on the Field',
    collegeId: 'VIT_PUNE',
    vertical: 'Sports',
    tier: 'Tier 1 (Flagship)',
    campus: 'Bibwewadi & Kondhwa Grounds',
    facultyMentor: 'Prof. Bhanuse, Phatangare and Patare',
    establishedYear: 1998,
    description: 'Inter-collegiate cricket, football, basketball, badminton, table tennis, athletics, and chess tournaments.',
    instagram: '@sports_vitpune',
    membersCount: 280,
    openRecruitment: true,
    recruitmentDeadline: '28 Aug 2026',
    recruitmentRoles: ['Cricket Captain', 'Football Coach', 'Table Tennis Lead'],
    logoBg: '#16A34A',
  },

  // =========================================================================
  // 9. THE SPEAKERS CLUB & SPEAKERS ARENA — TIER 1 FLAGSHIP
  // =========================================================================
  {
    id: 'VIT_SPEAKERS_CLUB',
    clubNo: 'VIT/SA/25-26/O-008',
    name: 'The Speakers Club & Speakers Arena',
    shortName: 'Speakers Arena',
    tagline: 'Art of Rhetoric, Mastery of Debate',
    collegeId: 'VIT_PUNE',
    vertical: 'Literary',
    tier: 'Tier 1 (Flagship)',
    campus: 'Bibwewadi Audi 1',
    facultyMentor: 'Prof. Vaishali Savale',
    establishedYear: 2016,
    description: 'Parliamentary debate, Model UN, public speaking, rhetoric, and national debating championships.',
    instagram: '@speakersarena_vit',
    membersCount: 115,
    openRecruitment: true,
    recruitmentDeadline: '28 Aug 2026',
    recruitmentRoles: ['Debate Adjudicator', 'Public Speaking Coach'],
    logoBg: '#534AB7',
  },

  // =========================================================================
  // 10. TEDX VIT PUNE — TIER 1 FLAGSHIP
  // =========================================================================
  {
    id: 'VIT_TEDX',
    clubNo: 'VIT/SA/25-26/O-002',
    name: 'TEDx VIT Pune',
    shortName: 'TEDx VIT',
    tagline: 'Ideas Worth Spreading',
    collegeId: 'VIT_PUNE',
    vertical: 'Literary',
    tier: 'Tier 1 (Flagship)',
    campus: 'Bibwewadi',
    facultyMentor: 'Prof. Jayashree Jankar',
    establishedYear: 2015,
    description: 'Independently organized TED event curating world-class thought leaders, innovators, and creators.',
    instagram: '@tedxvitpune',
    membersCount: 85,
    openRecruitment: true,
    recruitmentDeadline: 'Tonight, 11:59 PM',
    recruitmentRoles: ['Speaker Curation Head', 'Cinematography Lead', 'Design Head'],
    logoBg: '#E11D48',
  },

  // Remaining Approved Clubs (Departmental & Special Interest)
  {
    id: 'VIT_COMPSA',
    clubNo: 'VIT/SA/25-26/T-019',
    name: 'COMPSA - Comp Students Association',
    shortName: 'COMPSA',
    collegeId: 'VIT_PUNE',
    vertical: 'Technical',
    tier: 'Tier 2 (Departmental)',
    campus: 'Bibwewadi CS Dept',
    facultyMentor: 'Prof. Shaileja Uke',
    establishedYear: 2002,
    description: 'Official departmental body of Computer Engineering department managing technical symposiums.',
    instagram: '@compsa_vit',
    membersCount: 190,
    openRecruitment: true,
    recruitmentDeadline: '28 Aug 2026',
    recruitmentRoles: ['SY Department Representative', 'Event Lead'],
    logoBg: '#2563EB',
  },
  {
    id: 'VIT_AISA',
    clubNo: 'VIT/SA/25-26/T-020',
    name: 'AISA - AI Students Forum',
    shortName: 'AISA (AI Forum)',
    collegeId: 'VIT_PUNE',
    vertical: 'Technical',
    tier: 'Tier 2 (Departmental)',
    campus: 'Bibwewadi',
    facultyMentor: 'Prof. Sunil Sable',
    establishedYear: 2021,
    description: 'Student forum fostering machine learning research, neural networks, and Kaggle competitions.',
    instagram: '@aisa_vit',
    membersCount: 140,
    openRecruitment: true,
    recruitmentDeadline: '27 Aug 2026',
    recruitmentRoles: ['Kaggle Sprint Head', 'NLP Track Lead'],
    logoBg: '#059669',
  },
  {
    id: 'VIT_MESA',
    clubNo: 'VIT/SA/25-26/T-023',
    name: 'MESA - Mechanical Engg Students Association',
    shortName: 'MESA',
    collegeId: 'VIT_PUNE',
    vertical: 'Technical',
    tier: 'Tier 2 (Departmental)',
    campus: 'Bibwewadi Mechanical Dept',
    facultyMentor: 'Prof. Shinde S.S. & Prof. Shyamkuwar S.C.',
    establishedYear: 2000,
    description: 'Mechanical engineering body fostering thermal, design, manufacturing, and CAD modeling fests.',
    instagram: '@mesa_vit',
    membersCount: 165,
    openRecruitment: true,
    recruitmentDeadline: '30 Aug 2026',
    recruitmentRoles: ['CAD Sprint Coordinator', 'Industrial Visit Lead'],
    logoBg: '#475569',
  },
  {
    id: 'VIT_BYTEFORGE',
    clubNo: 'VIT/SA/25-26/T-018',
    name: 'ByteForge Club (ENTC Department)',
    shortName: 'ByteForge',
    collegeId: 'VIT_PUNE',
    vertical: 'Technical',
    tier: 'Tier 2 (Departmental)',
    campus: 'Bibwewadi ENTC Dept',
    facultyMentor: 'Prof. Jyoti Madake',
    establishedYear: 2020,
    description: 'Electronics & Telecommunication society specializing in VLSI, FPGA, embedded C, and signal processing.',
    instagram: '@byteforge_entc',
    membersCount: 95,
    openRecruitment: true,
    recruitmentDeadline: '28 Aug 2026',
    recruitmentRoles: ['VLSI Track Lead', 'IoT Hardware Head'],
    logoBg: '#0F766E',
  },
  {
    id: 'VIT_NSS',
    clubNo: 'VIT/SA/25-26/O-011',
    name: 'SWD - NSS (National Service Scheme)',
    shortName: 'NSS VIT Pune',
    collegeId: 'VIT_PUNE',
    vertical: 'Social',
    tier: 'Tier 1 (Flagship)',
    campus: 'Bibwewadi',
    facultyMentor: 'Prof. Gambhire',
    establishedYear: 2000,
    description: '7-day annual village adoption camps, blood donation mega camps, and social awareness drives.',
    instagram: '@nss_vitpune',
    membersCount: 210,
    openRecruitment: true,
    recruitmentDeadline: '27 Aug 2026',
    recruitmentRoles: ['Camp Coordinator', 'Health Drive Lead'],
    logoBg: '#166534',
  },
  {
    id: 'VIT_ANTARIKSH',
    clubNo: 'VIT/SA/25-26/O-017',
    name: 'Antariksh Astronomy & Space Club',
    shortName: 'Antariksh',
    collegeId: 'VIT_PUNE',
    vertical: 'Others',
    tier: 'Special Interest',
    campus: 'Bibwewadi',
    facultyMentor: 'Prof. Shital Powar & Prof. Milind Patil',
    establishedYear: 2016,
    description: 'Stargazing expeditions, telescope construction, astrophotography, and CanSat satellite engineering.',
    instagram: '@antariksh_vit',
    membersCount: 110,
    openRecruitment: true,
    recruitmentDeadline: '29 Aug 2026',
    recruitmentRoles: ['Observational Lead', 'Payload Engineer'],
    logoBg: '#312E81',
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
    venue: 'Sharad Arena Auditorium & CS Labs 1-4',
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
    title: 'Earn & Sell 2026 — Flagship Trade Expo',
    clubName: 'Entrepreneurship Development Cell (EDC)',
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
    title: 'Inter-College Parliamentary Debate Championship',
    clubName: 'The Speakers Club & Speakers Arena',
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
    title: 'Aaroh Acoustic Open Mic Night',
    clubName: 'Aaroh Music Club',
    collegeName: 'VIT Pune',
    vertical: 'Cultural',
    date: '2026-08-29',
    month: 'AUG',
    day: '29',
    time: '06:30 PM - 09:30 PM',
    venue: 'Campus Amphitheatre',
    ticketPrice: 0,
    scope: 'Intra-Collegiate',
    description: 'Under-the-stars musical acoustic jam session, original singer-songwriter showcases, and beatboxing.',
    registeredCount: 180,
    maxCapacity: 200,
    isRegistered: false,
    status: 'upcoming',
  },
  {
    id: 'EVT_05',
    title: 'TEDx VIT Pune Speaker Auditions',
    clubName: 'TEDx VIT Pune',
    collegeName: 'VIT Pune',
    vertical: 'Literary',
    date: '2026-08-30',
    month: 'AUG',
    day: '30',
    time: '02:00 PM - 05:30 PM',
    venue: 'AV Hall, Central Library Building',
    ticketPrice: 0,
    scope: 'Intra-Collegiate',
    description: 'Auditions for student speaker slot at TEDx VIT Pune 2026 flagship conference.',
    registeredCount: 65,
    maxCapacity: 80,
    isRegistered: false,
    status: 'upcoming',
  },
  {
    id: 'EVT_06',
    title: 'Smart India Hackathon (SIH) Internal Grand Screening',
    clubName: 'Hackathons@VIT & GedIT',
    collegeName: 'VIT Pune',
    vertical: 'Technical',
    date: '2026-09-02',
    month: 'SEP',
    day: '02',
    time: '09:00 AM - 06:00 PM',
    venue: 'Computer Labs 1-4, 3rd Floor',
    isHackathon: true,
    ticketPrice: 0,
    scope: 'Intra-Collegiate',
    description: 'Internal evaluation and team shortlisting for National Smart India Hackathon problem statements.',
    registeredCount: 210,
    maxCapacity: 250,
    isRegistered: false,
    status: 'upcoming',
  },
  {
    id: 'EVT_07',
    title: 'Autonomous Rover Challenge 2025 (Archive)',
    clubName: 'The Robotics Forum (TRF)',
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
    attendeeName: 'Pranav Vasu',
    prn: '1251070582',
    college: 'VIT Pune',
    ticketTier: 'Hackathon All-Access Pass',
    qrCodeString: 'CLUBSYNC-TKT-EVT01-1251070582-VALID',
    checkInStatus: 'CONFIRMED',
  },
  {
    id: 'TCK_88219',
    eventId: 'EVT_02',
    eventTitle: 'Earn & Sell 2026 — Flagship Trade Expo',
    clubName: 'Entrepreneurship Development Cell (EDC)',
    venue: 'Bibwewadi Main Ground, VIT Pune',
    date: '22 Aug 2026',
    time: '10:00 AM IST',
    attendeeName: 'Pranav Vasu',
    prn: '1251070582',
    college: 'VIT Pune',
    ticketTier: 'Standard Entry Pass',
    qrCodeString: 'CLUBSYNC-TKT-EVT02-1251070582-VALID',
    checkInStatus: 'CONFIRMED',
  },
];
