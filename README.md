# BaitoAI Project Management System

A comprehensive project and workforce management system built with React, TypeScript, and Supabase.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone [your-repo-url]
cd project-10
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

> ⚠️ **SECURITY WARNING**: Never commit `.env` files to Git! API keys and secrets should never be pushed to public repositories. Always use `.env.example` as a template and add actual credentials locally only.

4. Start development server
```bash
npm run dev
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS, Shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: React Context + Hooks
- **Deployment**: Netlify/Vercel ready

## 📦 Key Features

- Project Management
- Candidate/Staff Management
- Expense Claims & Receipts
- Document Management
- Payroll Processing
- Real-time Updates
- Role-based Access Control

## 🚀 Deployment

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for detailed deployment instructions.

### Quick Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=your-repo-url)

### Environment Variables Required

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

## 📄 License

[Your License]

## 🤝 Contributing

[Your contribution guidelines]