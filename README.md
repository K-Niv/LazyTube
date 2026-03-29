<div align="center">
  <img src="public/favicon.svg" alt="LazyTube Logo" width="80" height="80">
  <h1>LazyTube</h1>
  <p>A beautifully designed, proxy-secured SPA for discovering random YouTube videos and Shorts based on your mood, category, and region.</p>
</div>

---

## 🎲 What is LazyTube?

Sometimes you don't know what you want to watch. **LazyTube** solves that by finding completely random, embeddable YouTube videos and Shorts tailored to your chosen preferences.

Select a country, pick a category (like Music, Gaming, or Documentaries), choose whether you want standard Videos or Shorts, and hit **Roll the Dice!**

## ✨ Features

- **🎯 Advanced Filtering**: Filter by Region (20+ countries supported), Category, Content Type (Videos vs. Shorts), and Max Duration (Short, Medium, Long).
- **⚡ Dedicated Shorts Mode**: Uses duration-based heuristics (≤ 60 seconds) to approximate YouTube Shorts, providing a focused short-form browsing experience.
- **🔍 Specific Text Queries**: Looking for something specific but random? Type a search query (e.g., "lo-fi beats"), and LazyTube will pick a random video matching that query.
- **🔒 Secure API Proxy**: Uses an Express.js backend proxy to handle all communication securely.
- **🌓 Dark / Light Themes**: Fully responsive UI with a beautifully crafted dark and light mode that respects system preferences.
- **💾 Smart Caching**: Implements parameter-based caching to reduce redundant API requests. Frequently repeated queries are served from cache, significantly improving performance and reducing API quota usage. Includes a "Used Videos" tracker to avoid duplicates.
- **📜 Watch History**: A sidebar that automatically tracks the last 100 videos you've discovered, allowing you to re-watch them instantly.

## 🛠️ Tech Stack

### Frontend
- **React.js 18** (Vite)
- Custom Vanilla CSS Design System (CSS Variables, Flexbox, Animations)
- Client-side LocalStorage for Cache & History Management

### Backend
- **Node.js** with **Express.js**
- Proxy implementation for YouTube Data API v3 endpoints (`search.list`, `videoCategories.list`, `videos.list`)
- In-memory Quota usage tracking

---

## 📂 Project Structure

```text
LazyTube/
 ├── server/
 │   └── server.js           # Express Backend API
 ├── src/
 │   ├── components/         # React UI Components
 │   ├── hooks/              # Custom Hooks
 │   ├── services/           # Cache Logic and API Fetchers
 │   ├── styles/             # Vanilla CSS Modules
 │   ├── App.jsx             # Main Orchestration
 │   └── main.jsx            # React Entry
 ├── .env                    # Environment Keys (Not committed)
 └── package.json            # Scripts & Dependencies
```

## 🛡️ API Quota Management

The YouTube Data API enforces a daily quota system. LazyTube minimizes usage through a combination of backend optimization and intelligent request handling:

- **Server-side Request Deduplication**: Identical queries are cached and reused to avoid redundant API calls.
- **Batch Processing**: Video metadata (e.g., duration) is fetched efficiently using grouped requests.
- **Selective Filtering**: Pre-filters results to reduce unnecessary follow-up requests.
- **Lightweight Client Caching**: Frequently repeated queries are cached on the client for improved responsiveness.

> Note: YouTube does not provide an official way to identify Shorts via API. LazyTube uses a heuristic approach based on video duration (≤ 60 seconds) to approximate Shorts detection.
