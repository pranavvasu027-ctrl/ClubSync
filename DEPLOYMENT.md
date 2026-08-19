# 🚀 ClubSync Team Deployment & Live Testing Guide (For 30-Person Team)

This guide provides **4 instant ways** to test and deploy ClubSync with your 30-person team in real life:

---

## ⚡ Option 1: Instant Free Cloud Web App (Recommended - Zero Installation)

Your production web build is compiled in [`mobile/dist`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/mobile/dist).

### 1-Click Netlify Drop (Takes 30 Seconds):
1. Open [**https://app.netlify.com/drop**](https://app.netlify.com/drop) in your browser.
2. Drag and drop the `mobile/dist` folder directly onto the webpage.
3. Netlify will instantly give you a free live URL (e.g. `https://clubsync-demo.netlify.app`).
4. **Share this link with all 30 team members**. They can open it on their iPhone (Safari) or Android (Chrome) and test everything in real life with live Supabase database sync!

### Or via Terminal (Vercel / Netlify CLI):
```bash
# In project root:
cd mobile
npx vercel --prod dist
# OR
npx netlify deploy --prod --dir=dist
```

---

## 📱 Option 2: Live Native Mobile App via Expo Go (iOS & Android)

Let your team test the real native React Native mobile app directly on their physical phones:

1. Ask your 30 team members to install the free **Expo Go** app from:
   - [**Google Play Store (Android)**](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [**Apple App Store (iOS)**](https://apps.apple.com/app/expo-go/id982107779)
2. In your terminal inside `mobile/`, run:
   ```bash
   npx expo start --tunnel
   ```
3. A large QR code and URL (e.g., `exp://...`) will appear in your terminal.
4. **Android users**: Open Expo Go and tap **"Scan QR code"**.
5. **iPhone users**: Open the native **Camera** app, point at the QR code, and tap **"Open in Expo Go"**.
6. The app will launch natively on all 30 phones with real-time updates!

---

## 🏢 Option 3: Local Campus / Office Wi-Fi Sharing

If all 30 team members are on the same Wi-Fi network (or campus network):

1. Run the local production server:
   ```bash
   npx serve mobile/dist -l 3000
   ```
2. Find your local IP address (e.g. `192.168.1.15`).
3. Share the URL `http://192.168.1.15:3000` with your team.
4. Everyone on the Wi-Fi can open it immediately on their phones and laptops.

---

## 📦 Option 4: Direct Downloadable Android APK (EAS Build)

To generate a standalone `.apk` file that Android users can install like a normal app:

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Log in and build:
   ```bash
   cd mobile
   npx eas login
   npx eas build -p android --profile preview
   ```
3. EAS will build your APK in the cloud and give you a direct download link (e.g., `https://expo.dev/artifacts/eas/...apk`) to send via WhatsApp or email to your team.

---

## 🧪 Recommended Real-Life Team Testing Workflow for 30 Members

1. **Member 1 to 20 (General Students)**:
   - Log in using Google or enter their college PRN/Email.
   - Edit their Student Profile (Passport, CGPA, skills).
   - RSVP for campus events and open their dynamic QR Gate Pass.
   - Form teams and register for national hackathons in the Competitions tab.
2. **Member 21 to 25 (Club Leads & Presidents)**:
   - Switch to **"President Mode"** in the Clubs tab.
   - Edit their club's tagline, vision, mentor, and hiring status.
   - Host a new event and publish results in the Hall of Fame.
   - Use the **Gatekeeper QR Scanner Tester** in Profile to verify other students' QR gate passes!
3. **Member 26 to 30 (Core Committee Hiring & Review)**:
   - Submit hiring applications for club roles.
   - Review incoming applications and update their status live.
