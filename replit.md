# Piano Tuner App

## Overview

A minimalist mobile piano tuning application built with React Native and Expo. The app provides real-time pitch detection via the device microphone, displaying a speedometer-style dial that shows how far a played note is from being perfectly in tune. The design follows a brutalist minimal aesthetic with a dark theme, inspired by professional audio equipment.

**Core Features:**
- Real-time pitch detection with 50 dB threshold
- Speedometer dial showing -50 to +50 cents deviation
- Automatic note switching when deviation exceeds ±50 cents
- Full piano range support (A0 to C8)
- Color-coded needle: red when off, green within ±5 cents
- Needle stays at last position when note stops
- Works completely offline

## Recent Changes
- **Jan 18, 2026**: Target note comparison feature
  - Tap any key on the virtual keyboard to set it as target note
  - Plays synthesized reference tone when key is tapped
  - Shows green marker on dial for target (perfect pitch at 0 cents)
  - Needle shows actual played note in red
  - Displays cents difference between target and actual note
  - Target key shown in green, actual played key in red on keyboard
  - Tap target key again or X button to clear

- **Jan 18, 2026**: Added piano keyboard visualization
  - Full 88-key scrollable piano keyboard below the dial
  - Keys highlight when matching note is played
  - Auto-scrolls to active key

- **Jan 18, 2026**: Initial v1 implementation complete
  - Built speedometer dial with 180° semicircle arc
  - Added number labels (-50, -25, 0, +25, +50) around dial
  - Needle defaults to 12 o'clock (straight up) at 0 cents
  - Implemented pitch detection using pitchy library with FFT
  - Dark theme with pale yellow (#F5E6A8) text on near-black (#0A0A0A) background

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation with native stack navigator (single-screen app)
- **State Management**: React hooks with React Native Reanimated for animated shared values
- **Audio Processing**: Web Audio API with the `pitchy` library for pitch detection using FFT analysis

### Key Design Patterns
- **Component Structure**: Functional components with TypeScript, organized in `client/components`
- **Theming**: Centralized theme constants in `client/constants/theme.ts` with dedicated `TunerColors` for the tuner-specific dark palette
- **Path Aliases**: `@/` maps to `./client`, `@shared/` maps to `./shared` for clean imports
- **Error Handling**: Class-based ErrorBoundary component wrapping the entire app

### Pitch Detection Flow
1. Microphone access via expo-av permissions
2. Audio analysis using Web Audio API's AnalyserNode
3. Pitch detection with `pitchy` library (FFT size 4096, 44.1kHz sample rate)
4. Frequency-to-note conversion with cents calculation in `client/lib/pitchDetection.ts`
5. Visual feedback through animated speedometer dial component

### Backend Architecture
- **Server**: Express.js running on Node with TypeScript (tsx for development)
- **API Structure**: Routes registered in `server/routes.ts`, prefixed with `/api`
- **Storage**: In-memory storage implementation with interface for future database swap
- **CORS**: Dynamic origin handling for Replit domains and localhost development

### Build System
- **Development**: Parallel Expo and Express servers with Replit-specific proxy configuration
- **Production**: esbuild for server bundling, Expo static build for mobile assets
- **Scripts**: `expo:dev` for mobile, `server:dev` for backend, `db:push` for Drizzle migrations

## External Dependencies

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `shared/schema.ts` with Zod validation via drizzle-zod
- **Migrations**: Managed via drizzle-kit, output to `./migrations`
- **Note**: Currently using in-memory storage; Postgres connection configured but optional

### Audio Processing
- **pitchy**: Pitch detection library for analyzing audio frequencies
- **expo-av**: Audio permissions and recording capabilities

### UI Libraries
- **react-native-reanimated**: Smooth animations for the speedometer needle
- **react-native-svg**: Drawing the semicircular dial and tick marks
- **react-native-gesture-handler**: Touch interactions
- **react-native-safe-area-context**: Safe area inset handling

### Fonts & Styling
- **@expo-google-fonts/nunito**: Custom typography
- **expo-blur**: iOS blur effects for headers
- **expo-glass-effect**: Liquid glass effects (iOS 26+)

### Development Tools
- **TypeScript**: Strict mode enabled
- **ESLint**: Expo config with Prettier integration
- **babel-preset-expo**: React Native transpilation with module resolver for path aliases