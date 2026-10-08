# Cliq

A campus social network for Lovely Professional University (LPU), limited to members verified with an institutional email.

Live: https://cliq-ruddy.vercel.app

## Features

- Communities: interest-based groups (tech, memes, sports and more)
- Private DMs: one-to-one chat between classmates
- Campus events: discover, RSVP and create events
- Official notices: verified college announcements
- Real-time feed for posts and reactions

## Stack

Next.js 16, React 19, TypeScript, Tailwind 4, Supabase (`@supabase/ssr`), Prisma, TanStack Query, Framer Motion, Web Push, and Capacitor (Android).

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Supabase and Prisma need their own environment variables, which this repo does not document yet. Never commit real keys.

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
```

## Author

Deepanshu Lathar - https://deepanshulathar.com - [@latharrr](https://github.com/latharrr)
