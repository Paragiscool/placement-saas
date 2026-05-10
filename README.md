# Placement SaaS Dashboard

A comprehensive, interactive dashboard for tracking and analyzing student placements. This platform provides real-time insights, customizable taxonomies for job roles, and a seamless experience for monitoring placement metrics.

## Features

- **Interactive Analytics Dashboard**: Visualizes placement statistics, job categories, and hiring trends.
- **Dynamic Job Categorization**: Advanced taxonomy system that classifies various job roles into specific sub-categories for detailed research.
- **Automated Data Pipeline**: Integrates with a FastAPI backend on Render for automated data ingestion and processing.
- **Secure Authentication**: Built with Supabase for robust user authentication and data security.
- **Responsive Design**: Modern, clean UI built with Tailwind CSS and Framer Motion for smooth animations.

## Technology Stack

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), React 18, TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Lucide React](https://lucide.dev/), [Recharts](https://recharts.org/), [Framer Motion](https://www.framer.com/motion/)
- **Backend/Database**: [Supabase](https://supabase.com/)
- **Deployment**: [Vercel](https://vercel.com/) (Frontend), Render (FastAPI Pipeline)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Paragiscool/placement-saas.git
cd placement-saas
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Deployment

This application is configured for seamless deployment on [Vercel](https://vercel.com/). 

Ensure that your environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are correctly set in the Vercel project settings before deploying.

## License

Private Project - All Rights Reserved.
