# 🎯 Reva's Todo (Social Task Tracker)

A premium, social-first task management application designed with a sleek dark aesthetic (inspired by Notion, Linear, and Arc Browser). It enables users to organize tasks, set native reminders, build streak consistencies, and connect with friends to compare progress in real-time.

---

## ✨ Features

### 1. 📅 Daily Dashboard

- **Dynamic Time-Based Greetings**: Greets you with "Good morning", "Good afternoon", or "Good evening" depending on your local time.
- **Premium Theme**: Curated HSL dark mode colors, vibrant gradients, and ambient bottom-halo glow effects.
- **Inline Task Creator**: Add tasks quickly with specialized categories and color-coded selection pills.

### 2. ⚡ Social & Connections

- **Email-Only Connections**: Search and connect with friends securely using their exact email address.
- **Friends' Live Progress**: See what percentage of daily tasks your friends have checked off.
- **Fire Streaks**: Track daily completion streaks (🔥) to encourage consistency.

### 3. 🗓️ 7-Day Completion Log

- **Visual Status Indicators**: See checkmarks (completed), crosses (missed), or fast-forward arrows (skipped) for the past week.
- **Skip Days**: Double-tap any incomplete day column on mobile or desktop to toggle it as a "Skip Day". This preserves your streak from resetting on busy days!
- **Mobile Optimized**: Grid gaps and padding dynamically contract on phone viewports to prevent element overlapping.

### 4. ⏰ Smart Reminders & Rollover

- **Scroll-Snap Time Picker**: Custom Android-style drum-roll time picker (Hours, Minutes, AM/PM) for selecting reminder times.
- **Native Push Notifications**: Dispatches a native OS browser alert exactly 10 minutes before your task starts.
- **3:00 AM Rollover**: Day rollover occurs at 3 AM to accommodate night owls. Completed tasks disappear from the active dashboard the next day.
- **2-Day Data Retention**: Completed tasks are kept in the Firestore database for 2 days to support streak integrity, then automatically purged on day 3 to save storage.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Framer Motion (animations), Date-fns (date formatting)
- **Styling**: TailwindCSS
- **Backend**: Firebase Authentication (Google Account integration)
- **Database**: Cloud Firestore (Real-time NoSQL document sync)

---

## 🚀 Setup & Local Installation

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed.

### 1. Clone the repository

```bash
git clone https://github.com/revanth2931/reva-s-todo.git
cd reva-s-todo
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory and add your Firebase API configurations:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for production

```bash
npm run build
```
