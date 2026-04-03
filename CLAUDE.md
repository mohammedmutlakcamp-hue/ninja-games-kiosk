# NinjaKiosk - Complete Project

## INIT COMMAND
When the user says "init", do ALL of these steps:

### 1. Install server dependencies (if missing)
```bash
cd "C:\Users\vip-2\Desktop\Ninja Kiosk Final\server"
npm install    # only if node_modules is missing
npm run build  # only if .next is missing
```

### 2. Start the LAN server
```bash
cd "C:\Users\vip-2\Desktop\Ninja Kiosk Final\server"
npx next start -H 0.0.0.0 -p 3000
```
Run this in background. Verify port 3000 is listening.

### 3. Show the user their LAN IP
Run `ipconfig | findstr "IPv4"` and show the kiosk URL: `http://{IP}:3000/kiosk`

### 4. Optionally launch the kiosk client
Ask the user if they want to launch NinjaKiosk.exe from `client/`.
**WARNING**: The kiosk locks the PC. Exit phrase: type `ghanemexit` on keyboard.

---

## PROJECT STRUCTURE

```
Ninja Kiosk Final/
├── server/                    # Next.js 14 LAN web server (port 3000)
│   ├── src/app/kiosk/         # Main kiosk UI page (login, register, welcome, dashboard)
│   ├── src/app/info/          # Info/linktree page
│   ├── src/app/reserve/       # Reservation page
│   ├── src/app/ghanimadmin/   # Admin panel
│   ├── src/app/api/           # API routes (game stats)
│   ├── src/components/        # React components
│   │   └── kiosk/
│   │       ├── KioskDashboard.tsx   # Main dashboard (sidebar, tabs, modals)
│   │       ├── RegisterScreen.tsx   # Player registration
│   │       ├── TopUpScreen.tsx      # Top-up when coins = 0
│   │       ├── ChatBubble.tsx       # Chat UI
│   │       ├── FriendNotification.tsx # Friend online/playing toasts
│   │       ├── MatchReportModal.tsx  # Match report modal
│   │       └── tabs/
│   │           ├── GamesTab.tsx     # Main games view (hero, suggested games carousel, sidebar, right panel)
│   │           ├── ChestsTab.tsx    # Chest opening/rewards
│   │           ├── FoodTab.tsx      # Food & drinks ordering
│   │           ├── ProfileTab.tsx   # Player profile & settings
│   │           ├── LeaderboardTab.tsx # Top players
│   │           ├── InventoryTab.tsx  # Player inventory
│   │           ├── TournamentTab.tsx # Tournaments
│   │           ├── MiniGamesTab.tsx  # Built-in mini games
│   │           ├── DailyTasksTab.tsx # Daily tasks/challenges
│   │           ├── FriendsTab.tsx    # Friends list & management
│   │           └── SoftwareTab.tsx   # Software/apps launcher
│   ├── src/lib/
│   │   ├── games-catalog.ts   # All game definitions (id, name, coverImage, bannerImage, exePath, genre, etc.)
│   │   ├── firebase.ts        # Firebase config
│   │   ├── constants.ts       # COINS_PER_MINUTE, etc.
│   │   ├── translations.ts    # AR/EN translations
│   │   ├── xp.ts              # XP & level calculations
│   │   └── daily-tasks.ts     # Daily task tracking
│   ├── public/
│   │   ├── img/               # UI images (logo, chest-*.png, pfp-*.png, banner.png)
│   │   └── games/             # Game images (47 games, each has card + banner)
│   │       ├── {id}.jpg       # Card images (400x550 portrait)
│   │       └── {id}-banner.jpg # Banner images (1920x600 landscape)
│   ├── package.json           # Next.js 14, React 18, Firebase, Tailwind, Framer Motion
│   ├── START-LAN-SERVER.bat   # One-click server start
│   └── .env.local             # Firebase config (DO NOT COMMIT)
│
├── client/                    # Compiled C# WPF kiosk app (.NET 8.0 self-contained)
│   ├── NinjaKiosk.exe         # Main executable
│   ├── START.bat              # Quick launcher
│   └── [runtime DLLs]        # .NET 8.0 + WebView2 runtime
│
├── kiosk-source/              # C# source code for the kiosk client
│   ├── NinjaKiosk/            # WPF project
│   │   ├── MainWindow.xaml.cs # Core logic (keyboard hooks, session, game launch, LAN scan)
│   │   ├── FirestoreService.cs# Firebase REST API integration
│   │   ├── SetupWindow.xaml.cs# PC name/ID setup dialog
│   │   └── NinjaKiosk.csproj  # .NET 8.0, WebView2 dependency
│   ├── installer.iss          # Inno Setup installer script
│   └── .git/                  # Full git history
│
├── NinjaKiosk-LAN-Setup.bat   # Run on SERVER PC (firewall rules for port 3000)
├── NinjaKiosk-Client-Setup.bat # Run on CLIENT PCs (firewall + WebView2 check)
├── START-KIOSK.bat            # Quick-launch the C# kiosk client
├── CLAUDE.md                  # THIS FILE - project context for Claude
└── README.md                  # Human-readable setup guide
```

## HOW THE SYSTEM WORKS

1. **Server PC** runs the Next.js web server on port 3000 (serves the kiosk web UI)
2. **Client PCs** run NinjaKiosk.exe (C# WPF app with WebView2)
3. C# app auto-scans LAN subnet (.1-.50) for port 3000, verifies `/kiosk` endpoint
4. If LAN server found -> LAN mode (fast, works offline)
5. If not found -> falls back to cloud: `https://www.ninjagamesjo.com/kiosk`
6. Server IP cached in `%APPDATA%\ninja-games-kiosk\lan-config.json`

## WEB BRIDGE API
The kiosk web UI communicates with the C# app via `window.electronAPI`:
- `sessionLogin()` / `sessionLogout()` — Lock/unlock PC for customer
- `launchGame(gameId, exePath)` — Launch a game (Steam, Epic, Riot, Roblox, Battle.net, FiveM, direct .exe)
- `returnToKiosk()` — Bring kiosk to front
- `lockPC()` / `unlockPC()` — Manual lock/unlock
- `restartPC()` / `shutdownPC()` — System control
- `killSwitch()` — Exit kiosk entirely
- `playerLogin(data)` / `playerLogout()` — Player session tracking
- `getPcInfo()` / `onPcInfo()` — Get PC identity (name, docId)

## KEY FEATURES
- Chest reward system (bronze/silver/gold/legendary/ninja) with roulette spin animation
- Firebase Firestore backend (project: ninja-games-kiosk)
- Multi-language support (Arabic + English)
- Player coin system, XP, levels, daily tasks
- Game launching (Steam, Epic, Riot, Roblox, Battle.net, FiveM, direct exe)
- PC lockdown (keyboard hooks, taskbar hide, registry locks)
- Admin panel at /ghanimadmin
- Friends system with online status notifications
- Send coins between players
- Food & drinks ordering
- Match report system
- Inventory & gifting system

## GAMES TAB LAYOUT (GamesTab.tsx)
The main dashboard view when logged in:
- **Left sidebar**: Game list with search, software shortcuts
- **Center top**: Hero game banner (featured games rotate every 6s, or shows selected game)
- **Center bottom**: Suggested games carousel (5 visible cards, auto-scrolls in loop, freezes on user interaction, resumes when clicking elsewhere)
- **Right panel**: Friends list, Add Credit, Rewards buttons; Chest/rewards section below
- **DETAILS button**: Opens game info modal (genre, players, rating, play button)
- **No top banner**: Removed to give more space to the hero image
- Hero takes 55% height, suggested games take 45%

## GAME IMAGES
All 47 games have both card and banner images in `server/public/games/`:
- Card: `/games/{id}.jpg` (400x550 portrait) — used in game cards/sidebar
- Banner: `/games/{id}-banner.jpg` (1920x600 landscape) — used in hero section
- Defined in `src/lib/games-catalog.ts` with `coverImage` and `bannerImage` fields
- Chest image: `server/public/img/chest-ninja.png` (Ninja Games branded chest)

## BUILD COMMANDS

### Rebuild the Next.js server
```bash
cd server
rm -rf .next/cache    # clear image cache if images changed
npm install
npm run build
```

### Rebuild the C# kiosk client
```bash
cd kiosk-source
dotnet publish NinjaKiosk/NinjaKiosk.csproj -c Release -r win-x64 --self-contained true
```
Copy output from `kiosk-source/NinjaKiosk/bin/Release/net8.0-windows/win-x64/publish/` to `client/`

### Build installer (requires Inno Setup 6)
```bash
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" kiosk-source/installer.iss
```

## FOR NEW PCs / AFTER RESET
1. Install Node.js from nodejs.org
2. Install .NET 8.0 Runtime (if running C# source, not needed for compiled client)
3. Run `NinjaKiosk-LAN-Setup.bat` as admin on the server PC
4. Run `NinjaKiosk-Client-Setup.bat` as admin on client PCs
5. Say "init" to Claude to start everything

## IMPORTANT NOTES
- Exit phrase for kiosk: type `ghanemexit` on keyboard
- Admin phrase: type `ghanemadmin` on login screen to access admin login
- Cloud URL: `https://www.ninjagamesjo.com/kiosk`
- Firebase project: `ninja-games-kiosk`
- Kiosk scans LAN .1-.50 on port 3000
- Server must bind to `0.0.0.0` (not localhost) for LAN access
- Chest images are in `server/public/img/chest-*.png`
- When replacing images, ALWAYS clear `.next/cache` before rebuilding to avoid stale cached images
- Use `<img>` tag (not Next.js `Image`) for chest-ninja.png to avoid aggressive caching

## MOBILE PWA (iOS App)
- Route: `/app` — mobile-optimized PWA for iOS (Add to Home Screen)
- URL: `https://www.ninjagamesjo.com/app`
- Login screen with video background (`/img/login-bg.mp4`)
- Mobile dashboard with 5 tabs: Home, Chests, Friends, Tasks, Profile
- NO games tab (games are PC-only on the kiosk)
- Components in `src/components/mobile/`:
  - `MobileDashboard.tsx` — Main dashboard with bottom nav
  - `MobileRegister.tsx` — Mobile registration flow
- PWA manifest at `public/manifest.json`
- Service worker at `public/OneSignalSDKWorker.js`

## PUSH NOTIFICATIONS (OneSignal)
- OneSignal SDK integrated for web push (iOS PWA support)
- API key in `src/lib/onesignal.ts`
- REST API route: `/api/notifications` (POST)
- Notification triggers:
  - Friend comes online
  - Daily tasks reset
  - Coins received from another player
  - Chest/gift received
  - Admin custom notifications
- Admin panel: "Notifications" tab in admin dashboard
  - Send to all players or specific player
  - Quick templates for common notifications
  - History of sent notifications
- Players auto-register with OneSignal on login (external_id = Firestore UID)

## ADMIN ACCESS
- Player "مالبورو" has Admin Panel button in GamesTab sidebar
- Hidden phrase `ghanemadmin` still works on login screen for anyone
- Admin panel at `/ghanimadmin` (requires Firebase auth)
- Admin features: PCs, Players, Top Ups, Menu, Orders, Tournaments, Revenue, Notifications, Settings

## GITHUB & DEPLOYMENT
- GitHub repo: https://github.com/mohammedmutlakcamp-hue/ninja-games-kiosk
- Branch: master
- Deploy on Vercel connected to this repo
- Add `.env.local` variables in Vercel project settings (Firebase config)
- Add OneSignal app ID in OneSignal dashboard, set site URL to ninjagamesjo.com
- The `/app` route is the mobile PWA, `/kiosk` is the PC kiosk

## RECENT CHANGES (April 2026)
- Removed top "NINJA GAMES" banner from GamesTab to make hero image bigger
- Suggested games: changed from 6-card paginated to 5-card auto-scrolling carousel
- Auto-scroll: continuous loop, freezes on user scroll/touch, resumes on click elsewhere
- Scrollbar visible (thin green) so players can manually scroll
- Added DETAILS button functionality: opens game info modal (genre, players, rating)
- Added bannerImage to ALL games in catalog (was only on CS2, Valorant, Fortnite)
- Replaced all game card + banner images with proper ones from OpenClaw
- Fixed chest image caching issue (switched to plain `<img>` tag with cache-busting)
- Added iOS PWA at /app with mobile-optimized UI
- Added OneSignal push notifications
- Added admin Notifications panel
- Added Admin Panel button for player "مالبورو" in GamesTab
- Pushed to GitHub: mohammedmutlakcamp-hue/ninja-games-kiosk

## TODO / NEXT STEPS
- Add OneSignal app to OneSignal dashboard and configure for ninjagamesjo.com
- Add Firebase env vars to Vercel
- Generate PWA icons (icon-192.png, icon-512.png) and add to public/img/
- Test PWA "Add to Home Screen" on iOS Safari
- Test push notification permissions on iOS 16.4+
- Replace Fortnite banner image (user has a new one to provide)
