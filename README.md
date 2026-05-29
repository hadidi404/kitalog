# KitaLog

A repair shop management system for electronics and gadget repair businesses. Track jobs, manage customers, and monitor earnings — all in one place.

## Features

- **Job Tracking** — Create and manage repair jobs with status updates (Pending, In Progress, Done)
- **Customer Management** — Auto-aggregated customer records from job history
- **Analytics** — Revenue, expenses, and net income breakdowns with date-range filtering
- **Dashboard** — Monthly summary with recent job activity
- **Firebase Firestore** — Cloud-based storage, accessible from any device

## Tech Stack

- [Vue 3](https://vuejs.org/) — Composition API with `<script setup>`
- [Vite](https://vitejs.dev/) — Build tool
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first styling
- [Pinia](https://pinia.vuejs.org/) — State management
- [Firebase Firestore](https://firebase.google.com/docs/firestore) — Database
- [Chart.js](https://www.chartjs.org/) + [vue-chartjs](https://vue-chartjs.org/) — Analytics charts
- [Lucide](https://lucide.dev/) — Icons

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

Copy the example env file and fill in your Firebase project credentials:

```bash
cp .env.example .env
```

Then edit `.env` with your values from the [Firebase Console](https://console.firebase.google.com) → Project Settings → Your apps.

### 3. Run the development server

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
```

## Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore Database** in test mode
3. Register a web app and copy the config into `.env`

> **Note:** After 30 days, update your Firestore Security Rules to restrict public access.
