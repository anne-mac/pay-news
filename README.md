# PayNews

A real-time news aggregator focused on payments, fintech, and AI news. Built with React, TypeScript, and Vite.

## Features

- Real-time news fetching from Perplexity API
- Article filtering by relevance, companies, and topics
- Responsive design with modern UI
- Local storage for saved articles
- Supabase integration for data persistence

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express
- Database: Supabase
- API: Perplexity AI
- Styling: CSS Modules

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_PERPLEXITY_API_KEY=your_perplexity_api_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. In a separate terminal, start the backend server:
   ```bash
   node server.js
   ```

## Development

- Frontend runs on `http://localhost:5173`
- Backend runs on `http://localhost:3001`

## Deployment

The application is configured for deployment on Vercel. The frontend and backend are deployed separately:

- Frontend: Vercel
- Backend: Vercel Serverless Functions

## License

MIT
