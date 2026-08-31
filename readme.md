# ⚡ cyberTRACK

> **Track your cybersecurity journey. Build consistency. See your progress.**

**cyberTRACK** is a personal cybersecurity progress platform that brings activity from different security and development platforms into one place.

Instead of checking GitHub, Hack The Box, and TryHackMe separately, cyberTRACK gives you a unified view of your learning, activity, streaks, statistics, and competitive progress.

---

## ✨ What is cyberTRACK?

Cybersecurity progress is scattered across different platforms.

You solve a machine on **Hack The Box**, complete a room on **TryHackMe**, push code to **GitHub**, and your progress ends up living in three different places.

**cyberTRACK brings it together.**

```text
              ┌─────────────────────┐
              │      cyberTRACK      │
              │   Your Cyber Journey │
              └──────────┬──────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      GitHub          HackTheBox      TryHackMe
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                 Unified Activity
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
            Stats      Streaks   Leaderboard
```

---

## 🚀 Features

### 📊 Personal Dashboard

Get a quick overview of your cybersecurity activity, progress, and recent events.

### 🔗 Platform Integrations

Connect your existing platforms and bring your activity into cyberTRACK.

* **GitHub** — development activity
* **Hack The Box** — cybersecurity practice
* **TryHackMe** — rooms and learning activity

### 🔥 Streak Tracking

Stay consistent and keep your cybersecurity learning streak alive.

### 📈 Statistics

Turn your activity into useful progress metrics so you can see how you're improving over time.

### 🏆 Leaderboards

Compare progress with other members and add a competitive element to learning.

### 👥 Groups

Create or join groups, invite other users, and track progress together.

### 📰 Activity Feed

See recent cybersecurity and development activity in one unified feed.

### 🔐 Authentication

User authentication and platform connections are handled with Supabase and GitHub OAuth.

---

## 🛠️ Tech Stack

| Layer           | Technology                          |
| --------------- | ----------------------------------- |
| Framework       | **Next.js 16**                      |
| Language        | **TypeScript**                      |
| UI              | **React 19**                        |
| Styling         | **Tailwind CSS 4**                  |
| Database        | **Supabase / PostgreSQL**           |
| Authentication  | **Supabase + GitHub OAuth**         |
| Integrations    | **GitHub, Hack The Box, TryHackMe** |
| Package Manager | npm                                 |

---

## 🧩 Project Structure

```text
cyber-tracker/
│
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── groups/
│   │   └── sync/
│   │
│   ├── dashboard/
│   ├── connections/
│   ├── login/
│   └── signup/
│
├── components/
│   ├── ActivityFeed.tsx
│   ├── Leaderboard.tsx
│   ├── StatsWidget.tsx
│   ├── streak-card.tsx
│   └── platform-status.tsx
│
├── lib/
│   └── integrations/
│       ├── github.ts
│       ├── hackthebox.ts
│       ├── tryhackme.ts
│       └── ingest.ts
│
└── supabase/
```

---

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/01AnshYadav/cyberTRACK.git
cd cyberTRACK/cyber-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

Add any additional integration credentials required by your Supabase and platform configuration.

### 4. Start the development server

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

## 🧪 Available Scripts

```bash
npm run dev
```

Start the development server.

```bash
npm run build
```

Create a production build.

```bash
npm run start
```

Start the production server.

```bash
npm run lint
```

Run ESLint.

---

## 🗺️ Roadmap

cyberTRACK is actively evolving.

### Current

* [x] Authentication
* [x] Dashboard
* [x] GitHub integration
* [x] Hack The Box integration
* [x] TryHackMe integration
* [x] Activity tracking
* [x] Statistics
* [x] Streak tracking
* [x] Groups
* [x] Leaderboards

### Next

* [ ] More cybersecurity platforms
* [ ] Better progress analytics
* [ ] Advanced activity history
* [ ] Custom goals
* [ ] Achievements / badges
* [ ] Improved social features
* [ ] More detailed cybersecurity skill tracking

---

## 🎯 Vision

cyberTRACK is being built around a simple idea:

> **Your cybersecurity journey should be measurable.**

Whether you're learning your first networking concept, solving CTFs, building security tools, or contributing to security projects, your work should form a visible record of your growth.

**One profile. One timeline. One place to track the journey.**

---

## 🤝 Contributing

Contributions, ideas, and feedback are welcome.

If you find a bug or have an idea for improving cyberTRACK, feel free to open an issue or submit a pull request.

---

## 📄 License

This project is currently under active development.

---

<div align="center">

### ⚡ cyberTRACK

**Track. Learn. Build. Repeat.**

Made with ❤️ for the cybersecurity community.

</div>
