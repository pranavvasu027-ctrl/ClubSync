# ClubSync

A mobile-first platform for managing college clubs, events, and student engagement. Built with React Native (Expo) and Supabase.

## 📁 Project Structure

```
Clubsync/
├── mobile/           → 📱 React Native mobile app (Expo SDK 54)
├── web/              → 🌐 Web dashboard prototypes (HTML/CSS)
├── database/         → 🗄️ PostgreSQL schema & Supabase config
└── docs/             → 📄 Documentation, plans & research
```

## 🚀 Quick Start

```bash
cd mobile
npm install
npx expo start
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native + Expo |
| Backend | Supabase (PostgreSQL + Auth) |
| Auth | Email/Password + Google OAuth |
| Web Dashboard | Next.js (planned) |

## 📱 Current Status: V1 (VIT Pune Only)

The app is scoped for an exclusive launch at Vishwakarma Institute of Technology (VIT), Pune. Multi-college features are hidden behind feature flags for future expansion.

See [project_progress.md](project_progress.md) for the full changelog.

## 🤝 Collaborator Setup

If you are joining this project to collaborate, follow these steps:

1. **Clone the repository:**
   `ash
   git clone https://github.com/pranavvasu027-ctrl/ClubSync.git
   cd ClubSync
   `
2. **Install dependencies:**
   Double-click the setup.bat file in the root directory (or run it in the terminal) to install all dependencies for both the web and mobile apps.
3. **Environment Variables:**
   Ask the repository owner for the .env file contents for both the mobile and web directories.

