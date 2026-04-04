<div align="center">
  <img src="public/favicon.svg" alt="LazyTube Logo" width="80" height="80">
  <h1>LazyTube</h1>
  <p>A professionally designed, highly responsive SPA for discovering random YouTube videos based on granular parameter filtering.</p>
</div>

---

## Overview

LazyTube is a front-end React application with a Node.js/Express proxy backend designed to solve the problem of content discovery. It interfaces securely with the YouTube Data v3 API to surface completely random, embeddable YouTube videos and Shorts tailored to user-defined filters.

The application allows users to sort by geographical region, content category, duration, and even specific search queries, wrapping complex API interactions in a sleek, user-friendly interface.

## Core Features

- **Granular Filtering Engine**: Filter results by geographical region (20+ ISO 3166-1 alpha-2 country codes supported), YouTube Category (News, Gaming, Music, etc.), and text queries.
- **Dedicated Shorts Mode**: Utilizes duration heuristics (≤ 60 seconds) combined with batch API checking to successfully filter for YouTube Shorts, providing a focused short-form experience.
- **Smart TV Mode (Auto-Roll)**: Integrates the YouTube IFrame Player API to accurately detect when a video concludes, presenting an automated countdown before seamlessly queuing and autoplaying the next randomized video.
- **Custom Local Presets**: Users can take snapshots of their current complex filter configurations and save them as named presets. These are persisted locally via the browser's `localStorage` and navigated via a custom carousel.
- **Keyboard Navigation**: Implements an accessibility-friendly keyboard shortcut system for power users (e.g., Space to roll a new video, 'A' to toggle TV mode, 'T' to toggle themes).
- **Secure Architecture**: All YouTube API requests are routed through a Node.js/Express proxy server, protecting the API key from public exposure and stripping sensitive error messages.
- **Rate-Limiting Protection**: The backend utilizes an IP-based rate-limiting middleware (max 15 requests per minute per IP) to prevent API abuse and protect backend quotas.
- **Client-Side Caching**: Uses deterministic hashing to cache API responses in `localStorage`. If a user requests a random video with the exact same parameters within a session, LazyTube serves a new, unplayed video from the cached response pool before making another expensive network request.

## Technical Stack

### Frontend
- **Framework**: React.js 18 (Vite build system)
- **Styling**: Component-scoped Vanilla CSS design system with CSS Variables for theming.
- **Animation**: Framer Motion for complex layout transitions, staggered entrances, and AnimatePresence overlay unmounting.
- **Player API**: `react-youtube` for precise iframe state management.
- **Storage**: Client-side `localStorage` used for cache arrays, user watch history, and custom preset objects.

### Backend
- **Environment**: Node.js with Express.js
- **Security**: Environment variables (`dotenv`), `express-rate-limit` for traffic control.
- **Routing**: Specialized endpoint proxies for YouTube Data API `search.list`, `videoCategories.list`, and `videos.list`.

---

## Project Structure

```text
LazyTube/
 ├── server/
 │   └── server.js           # Express Backend API, rate limiters, proxy
 ├── src/
 │   ├── components/         # React UI Components and Modals
 │   ├── hooks/              # Custom Hooks (usePresets, useHistory, useTheme, etc.)
 │   ├── services/           # Caching Logic and API Fetchers
 │   ├── styles/             # Modular CSS Architecture
 │   ├── App.jsx             # Main Orchestration Layer
 │   └── main.jsx            # React Initialization
 └── package.json            # Scripts & Dependencies
```

## API Quota Management & Optimizations

The YouTube Data API strictly limits daily request quotas. LazyTube incorporates multiple strategies to optimize network operations and protect usage pools:

- **Server-side Defensive Programming**: Unnecessary YouTube API metadata requests are stripped. Error payloads from external endpoints are sanitized before transmission back to the client.
- **Batch Processing**: When filtering for Shorts, initial standard queries are aggregated and their resource IDs are sent in batches to the `videos.list` endpoint to ascertain precise duration metadata at a fraction of the quota cost.
- **Zero-Latency Repeat Fetching**: The local caching algorithm retains 50 items per search payload. Hitting "Roll the Dice" again with unchanged parameters incurs a quota cost of zero until the cached pool is exhausted.
