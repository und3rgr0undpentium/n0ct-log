# Personal Cybersecurity / IT Blog — PRD

## Original Problem Statement
> "i want to my own blog website which consists of my journey, sharing knowledge on IT, cybersecurity. i stumble with this website that is amazing. when i open the website, it interface runs like terminal server that starting to boot, and after that it will show the main page."

## Vision
A personal blog with a signature **fake Linux boot sequence** intro. Once the "kernel" comes up, the reader lands on a matrix-inspired blog experience for cybersec / IT / journey content.

## Users
- **Owner (admin)**: writes markdown posts through a CMS, tags them, publishes/unpublishes.
- **Readers**: land on the boot animation, then browse posts, filter by tag, search, read markdown with syntax-highlighted code, and reveal an AI-generated TL;DR on each post.

## Core Requirements
1. Terminal boot animation on first visit per session (skippable).
2. Matrix-inspired UI: void black + hot magenta + cyan; Fira Code + IBM Plex Sans.
3. Blog listing with search + tag filter.
4. Blog detail with markdown + code syntax highlighting.
5. AI TL;DR (Claude Sonnet 5 via Emergent Universal Key) — cached in DB after first generation.
6. Admin CMS: JWT-auth, create/edit/delete posts.
7. About page.

## Architecture
- **Backend**: FastAPI + Motor (MongoDB), JWT + bcrypt auth. Emergentintegrations for Claude Sonnet 5.
- **Frontend**: React 19 + React Router 7 + Tailwind + react-markdown + react-syntax-highlighter + framer-motion (available).
- **DB collections**: `users`, `posts`, `site_config`.
- **Seeded on startup**: admin user (admin/admin123), 3 sample posts, site config.

## Implemented (2026-02)
- Backend REST API: `/api/auth/login`, `/api/auth/me`, `/api/site`, `/api/posts` (search + tag), `/api/posts/tags`, `/api/posts/{slug}`, `/api/posts/{id}/tldr`, `/api/admin/posts` (CRUD).
- Frontend routes: `/`, `/post/:slug`, `/about`, `/admin/login`, `/admin`, `/admin/new`, `/admin/edit/:id`.
- Boot sequence, code-rain hero, tag filter, search, TL;DR reveal, glitch hover, scanlines, CRT flicker.

## Backlog
- **P1**: Site config edit page (currently seeded defaults; API exists).
- **P1**: Image uploads for post covers.
- **P2**: RSS feed at `/api/feed.rss`.
- **P2**: Read-time indicator refinement, view counter.
- **P2**: Related posts by shared tag.
- **P3**: Comments (self-hosted or third-party).
