# Game Pulse Match Tracker

A mobile-first React + JavaScript web app for manually tracking local Cricket, Kabaddi and Football matches. No external sports APIs.

## Features

- Dashboard: Live, Upcoming, Completed matches
- Create Match: sport, teams, players, date, venue
- Live scorekeeper with large touch-friendly buttons
- Match History
- Final Scorecard
- Pause/Resume
- Undo Last Action
- Save match data using LocalStorage
- Fully responsive for mobile, tablet and desktop
- Half 1 / Half 2 timers for Kabaddi and Football with auto pause and auto finish
- Football 90-minute match stopwatch with pause/resume, yellow and red cards
- Smart Target & Win Probability panel
- Player-level performance stats in match history and final scorecards
- Shareable scorecard image (native share or download)
- Export / Import backup of match history (JSON)
- Dark and light mode

**Live app**: https://local-match-keeper.lovable.app

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/77a188a9-4661-4310-9254-3d6bf8ee80d2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Run it on your computer (VS Code)

### 1. Install Node.js (once)

Download the **LTS** version (22.x) from [nodejs.org](https://nodejs.org) and install it with the default settings.

### 2. Open the project in VS Code

1. Unzip this project anywhere (for example `Documents`).
2. Open VS Code → **File → Open Folder…** → select the `GamePulse` folder.

### 3. Install and run

Open a terminal inside VS Code (**View → Terminal**, or `` Ctrl+` `` / `Cmd+``) and run:

```sh
npm install
npm run dev
```

Your browser opens at [http://localhost:5173](http://localhost:5173). Any file you edit saves and reloads instantly (hot reload). Press `Ctrl+C` in the terminal to stop the server.

## Open it on your phone (same Wi-Fi)

1. Run the dev server with the host flag:

   ```sh
   npm run dev -- --host
   ```

2. The terminal prints a **Network** address like `http://192.168.x.x:5173`.
3. On your phone, connect to the **same Wi-Fi** and open that address in the browser.

If the page doesn't load, allow Node.js through your firewall on the first prompt (Windows) or make sure "Local Network" access is enabled.

## Moving matches between devices

Matches live in each browser's LocalStorage — they are saved per browser, per device. To move them across:

1. In the app, open **Match History** → **Export backup** (downloads a `.json` file).
2. On the other device, open **Match History** → **Import backup** and choose that file.

## Build for production

```sh
npm run build
npm run preview
```

## Development notes

- Source code is plain JavaScript (`.js` / `.jsx`); a few framework-entry files stay `.ts`.
- No external sports APIs — all scoring is manual.
- Data is stored in the browser (LocalStorage); no backend required.
