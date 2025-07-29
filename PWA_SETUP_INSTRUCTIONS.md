# Installing Dependencies for Week 4 PWA Features

To complete the Week 4 PWA implementation, you need to install the required dependencies:

## Install PWA Dependencies

Run the following command in your project root:

```bash
npm install vite-plugin-pwa@^0.20.5 workbox-window@^7.0.0 --save-dev
```

## Verify Installation

After installation, your `package.json` should include these new dev dependencies:

```json
{
  "devDependencies": {
    "vite-plugin-pwa": "^0.20.5",
    "workbox-window": "^7.0.0"
  }
}
```

## Build and Test

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server with PWA features**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build:pwa
   ```

4. **Preview PWA build**:
   ```bash
   npm run preview:pwa
   ```

## Testing PWA Features

### In Development
- Open your browser to `http://localhost:5173`
- Open DevTools → Application → Service Workers to see registration
- Open DevTools → Application → Manifest to verify PWA manifest
- Test offline mode by going to DevTools → Network → "Offline"

### Installation Testing
1. **Chrome/Edge**: Look for install icon in address bar
2. **Mobile Safari**: Add to Home Screen option
3. **Firefox**: Install app option in address bar

### Offline Testing
1. Load the app while online
2. Disconnect from internet
3. Refresh the page - should still work
4. Make changes to race data
5. Reconnect - changes should sync

## File Structure Created

```
endurance-app/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── service-worker.js      # Service worker
│   ├── offline.html          # Offline fallback page
│   ├── icon-192.png         # App icon (192x192)
│   └── icon-512.png         # App icon (512x512)
├── src/
│   ├── hooks/
│   │   ├── usePWAInstall.ts    # PWA installation hook
│   │   ├── useOffline.ts       # Offline detection hook
│   │   ├── useServiceWorker.ts # Service worker management
│   │   ├── useAutoSave.ts      # Auto-save functionality
│   │   └── useDataPersistence.ts # Enhanced data persistence
│   └── components/
│       ├── PWAStatus.tsx       # PWA status indicator
│       ├── UpdateNotification.tsx # Update notification
│       └── RaceDataManager.tsx # Data management UI
└── vite.config.ts             # Updated with PWA plugin
```

## Features Now Available

✅ **Progressive Web App**
- Install app on desktop and mobile
- Standalone app experience
- App icons and splash screens

✅ **Offline Support**
- Full functionality without internet
- Automatic data syncing when online
- Offline fallback page

✅ **Auto-Save System**
- Saves every 30 seconds automatically
- Saves on page unload/backgrounding
- No data loss protection

✅ **Data Management**
- Save/load multiple races
- Export/import race data
- Local and cloud-ready storage

✅ **Update System**
- Automatic update detection
- User-controlled update installation
- Seamless app updates

## Production Deployment

When deploying to production:

1. Ensure HTTPS (required for PWA features)
2. Proper domain setup for service worker scope
3. Configure caching headers appropriately
4. Test on actual mobile devices

The app is now ready for Week 4 PWA functionality!
