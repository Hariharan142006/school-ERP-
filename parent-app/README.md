# Parent Mobile App (`parent-app/`)

A cross-platform React Native mobile application designed specifically for parents of **Aathithiya School ERP**. Parents can monitor their children's real-time attendance, review homework assignments, view timetable and exam schedules, check fee balances, apply for leave, and track school bus transport.

---

## 🛠️ Technology Stack

- **Framework:** React Native 0.72.6
- **Language:** TypeScript 4.8.4
- **React:** 18.2.0
- **Navigation:** `@react-navigation/native` & `@react-navigation/bottom-tabs` 6.x
- **Network & State:** Axios 1.5, `@react-native-async-storage/async-storage` 1.19
- **Real-Time Client:** Socket.io-client 4.8.4
- **Vector Graphics:** React Native SVG 13.13
- **Bundler:** Metro Bundler

---

## 📁 Directory Structure

```
parent-app/
├── android/                    # Native Android project files & Gradle build scripts
├── src/
│   ├── config/
│   │   └── api.ts              # Axios instance & BASE_URL configuration
│   ├── context/
│   │   ├── AuthContext.tsx     # Session management & AsyncStorage token handling
│   │   └── SocketContext.tsx   # Live Socket.io connection for parent alerts
│   ├── navigation/
│   │   └── RootNavigator.tsx   # Stack & Bottom Tab Navigation controllers
│   ├── screens/                # Mobile View Screens
│   │   ├── LoginScreen.tsx     # Parent authentication screen
│   │   ├── DashboardScreen.tsx # High-level child summary, recent notices & alerts
│   │   ├── AttendanceScreen.tsx# Monthly calendar of present/absent dates
│   │   ├── AcademicScreen.tsx  # Subjects & syllabus overview
│   │   ├── TimetableScreen.tsx # Daily period schedule
│   │   ├── HomeworkScreen.tsx  # Pending & completed homework assignments
│   │   ├── FeesScreen.tsx      # Fee breakdown, paid receipts, and balance due
│   │   ├── LeaveScreen.tsx     # Student leave application submission & status
│   │   ├── TransportScreen.tsx # Bus route, pickup/drop timings & tracking
│   │   ├── AnnouncementsScreen.tsx # School circulars and notices
│   │   └── ProfileScreen.tsx   # Student information & parent settings
│   └── App.tsx                 # Application root component with providers
├── babel.config.js             # Babel compiler presets
├── index.js                    # Entry point registered with AppRegistry
├── metro.config.js             # Metro configuration
├── package.json                # Dependencies and build scripts
└── tsconfig.json               # TypeScript configuration
```

---

## ⚙️ Configuration

The mobile API connection is configured in `src/config/api.ts`:

```typescript
// For local testing on an Android Emulator:
export const BASE_URL = 'http://10.0.2.2:5000';

// For local testing on a Physical Device via Wi-Fi:
// export const BASE_URL = 'http://<YOUR_LOCAL_IP>:5000';

// For production cloud backend:
// export const BASE_URL = 'https://your-backend-domain.com';
```

---

## 🚀 Getting Started & Build Instructions

### Prerequisites
1. **Node.js:** v18 LTS
2. **Java Development Kit (JDK):** OpenJDK 17
3. **Android Studio:** Android SDK Platform 33+, Android SDK Build-Tools, and an Android Emulator configured.

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Metro Bundler
```bash
npm start
```

### 3. Run on Android Device / Emulator
In a separate terminal:
```bash
npm run android
```

### 4. Run on iOS (macOS only)
```bash
cd ios && pod install && cd ..
npm run ios
```

---

## 📱 Navigation & User Flows

1. **Unauthenticated Flow:**
   - Launches `LoginScreen` allowing parents to enter credentials.
   - Upon successful login, the JWT is stored in `AsyncStorage` under the key `'parent_token'`.
2. **Authenticated Flow:**
   - Loads the bottom navigation tab bar:
     - 🏠 **Home / Dashboard**: Quick stats, attendance summary, emergency circulars.
     - 📅 **Attendance**: Monthly calendar highlighting presence and absences.
     - 📚 **Academics**: Timetable, subject breakdown, and homework assignments.
     - 💳 **Fees**: Upcoming dues, past payment receipts, and balance.
     - 👤 **Profile**: Student demographic info, bus route info, and account logout.
