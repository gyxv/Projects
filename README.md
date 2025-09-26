# Modoru - Mobile Audio Recorder

A mobile-first web application for recording audio with a smart rolling buffer system. Designed for easy conversion to a native mobile app.

## Features

### Core Functionality
- **One-Touch Recording**: Start recording with a single button press
- **Rolling Audio Buffer**: Maintains a configurable buffer (default 20 minutes) of recent audio
- **Quick Save Presets**: Save the last 30s, 1m, 2m, 5m, or 10m of audio with preset buttons
- **Smart Storage**: Audio is only temporarily stored on client-side, never sent to servers
- **Auto-Generated Filenames**: Saves files with timestamp-based names

### Mobile-Optimized Design
- **Responsive UI**: Optimized for phone screens and touch interaction  
- **Touch-Friendly Controls**: Large buttons and intuitive gestures
- **Landscape Support**: Adapts layout for landscape phone orientation
- **PWA Ready**: Can be installed as an app on mobile devices

### Customizable Settings
- **Buffer Time**: Adjust buffer duration (5-120 minutes)
- **Preset Durations**: Customize quick save button durations
- **Persistent Settings**: Settings saved locally on device

## How It Works

1. **Press Record**: Start capturing audio to the rolling buffer
2. **Keep Recording**: The app maintains the last N minutes of audio (configurable)
3. **Save When Needed**: When something important happens, press a preset button to save that duration
4. **Auto-Cleanup**: Older audio is automatically discarded to save device storage

### Example Scenario
- You start recording for a 40-minute meeting
- Only the last 20 minutes are kept in the buffer (minutes 20-40)  
- During minute 35-40, an important decision is made
- You press "5m" to save minutes 35-40 to your device
- The rest of the buffer is discarded

## Technical Details

### Browser Support
- Requires modern browsers with MediaRecorder API support
- Works on Chrome, Firefox, Safari (iOS 14.3+)
- Microphone permissions required

### Audio Formats
- Automatically selects best supported format (WebM, MP4, MP3)
- Optimized settings: 128kbps audio bitrate
- Built-in echo cancellation and noise suppression

### Privacy & Security
- **No Server Storage**: All audio processing happens client-side
- **Temporary Storage**: Buffer audio is only in memory, not saved permanently
- **User Control**: Only saves audio when user explicitly chooses to

## Installation & Usage

### As a Web App
1. Open the app in any modern mobile browser
2. Allow microphone permissions when prompted
3. For best experience, add to home screen (PWA install)

### Controls
- **Tap Record Button**: Start/stop recording
- **Spacebar**: Toggle recording (keyboard shortcut)
- **Settings (⚙️)**: Customize buffer time and presets
- **Quick Save Buttons**: Save recent audio segments

## Future App Development

This web application is architected for easy conversion to a native mobile app:

### PWA Features Already Implemented
- Service worker for offline functionality
- Web app manifest for installation
- Responsive design optimized for mobile
- Touch-friendly interface

### Ready for App Store Conversion
- Modular code structure
- Clean separation of UI and audio logic
- Mobile-first design patterns
- Local storage management
- Cross-platform compatibility

## Development

### File Structure
```
/
├── index.html          # Main app interface
├── styles.css          # Mobile-responsive styling  
├── app.js              # Main application logic
├── audio-engine.js     # Audio recording & buffer management
├── manifest.json       # PWA manifest
├── service-worker.js   # Offline functionality
└── README.md          # This file
```

### Key Classes
- `AudioEngine`: Handles all audio recording, buffering, and saving
- `ModoruApp`: Main UI logic and user interaction handling

## Browser Permissions

The app requires:
- **Microphone Access**: For audio recording
- **Storage Access**: For saving audio files locally

## Troubleshooting

### Common Issues
1. **No microphone detected**: Check device permissions and hardware
2. **Can't save files**: Ensure browser allows downloads
3. **Poor audio quality**: Check microphone settings and environment

### Browser Compatibility
- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: iOS 14.3+ required for full functionality
- **Older browsers**: May have limited MediaRecorder support

---

*Modoru* means "to return" in Japanese - representing the ability to return to and save important moments from your audio buffer.
