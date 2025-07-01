# 🪐 Retro-Folio

A nostalgic 90s-style portfolio website with interactive 3D effects, fake Spotify player, and retro aesthetics.

![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)
![Vite](https://img.shields.io/badge/Vite-5.4.19-purple)
![Tests](https://img.shields.io/badge/tests-35%20passing-green)

## ✨ Features

- 🎨 **Authentic 90s Design** - Neon colors, retro fonts, and nostalgic UI elements
- 🪐 **3D Saturn Cursor** - Interactive 3D planet that follows your mouse
- 🎵 **Fake Spotify Player** - Demo music player with Darude - Sandstorm
- 📖 **Interactive Guestbook** - Leave messages with retro emoji moods
- 🎮 **Smooth Scroll Navigation** - Section-based navigation with keyboard support
- 🛡️ **Security First** - Input validation, XSS protection, and error boundaries
- 📱 **Fully Responsive** - Works on all devices
- ♿ **Accessible** - Keyboard navigation and screen reader friendly

## 🚀 Quick Start

```bash
# Clone the repository
git clone git@gitlab.com:eof3/retro-folio.git
cd retro-folio

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, CSS Modules
- **3D Graphics**: Three.js, React Three Fiber
- **Animations**: Framer Motion
- **Testing**: Jest, React Testing Library
- **Linting**: ESLint, TypeScript ESLint

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── __tests__/   # Component tests
│   ├── ErrorBoundary.tsx
│   ├── SpotifyPlayer.tsx
│   └── ...
├── pages/           # Page components
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
└── App.tsx          # Main app component
```

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 🔒 Security Features

- ✅ Input validation and sanitization
- ✅ XSS protection
- ✅ No exposed API credentials
- ✅ Error boundaries for graceful error handling
- ✅ Content Security Policy ready

## 📝 Notable Components

### Fake Spotify Player
A demo music player that simulates Spotify functionality without requiring API credentials. Plays local MP3 files with full UI controls.

### 3D Saturn Cursor
An interactive 3D planet that follows your cursor, built with Three.js and React Three Fiber.

### Retro Guestbook
A nostalgic guestbook with localStorage persistence, emoji moods, and star ratings.

### Admin Panel
Content management system for portfolio projects, timeline events, and experiments.

## 🎨 Design Philosophy

The design embraces the aesthetic of 90s web design with:
- Neon color schemes
- Pixel fonts and retro typography
- Animated GIF-style effects
- Blink animations and marquee-like scrolling
- Outset/inset borders for that classic Windows 95 feel

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a personal portfolio project. Feel free to fork and adapt for your own use!

---

Built with 💜 and nostalgia for the golden age of the internet.