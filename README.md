# KitaLog

A repair shop management system for electronics and gadget repair businesses. Track jobs, manage customers, and monitor earnings — all in one place.

## Features

- **Job Tracking** — Create and manage repair jobs with real-time status updates
- **Customer Management** — Auto-aggregated customer records from job history
- **Analytics** — Revenue, expenses, and net income breakdowns with date-range filtering
- **Dashboard** — Monthly summary with recent job activity
- **Cloud Storage** — Data persists across devices and sessions

## Tech Stack

- [Vue 3](https://vuejs.org/) — Composition API
- [Vite](https://vitejs.dev/) — Build tool
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Pinia](https://pinia.vuejs.org/) — State management
- [Chart.js](https://www.chartjs.org/) + [vue-chartjs](https://vue-chartjs.org/) — Charts
- [Lucide](https://lucide.dev/) — Icons

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in the required values in `.env`.

### 3. Run the development server

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
```
