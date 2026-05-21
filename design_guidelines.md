# Piano Tuner App - Design Guidelines

## Brand Identity

**Purpose**: A precision tool for piano tuning with real-time pitch detection and visual feedback.

**Aesthetic Direction**: Brutally minimal - stark, essential, maximum focus on the tuning interface. The design is inspired by professional audio equipment: clean, dark, focused, with no distractions. Every element serves a functional purpose.

**Memorable Element**: The speedometer dial with intelligent auto-switching - it always shows the closest reference note, making it impossible to get lost while tuning across the entire piano range.

## Navigation Architecture

**Root Navigation**: Stack-Only (single-screen app)

**Screen List**:
1. **Tuner Screen** (Main/Home) - Real-time pitch detection and visual tuning feedback

## Screen Specifications

### Tuner Screen

**Purpose**: Detect piano notes via microphone and display tuning information with visual feedback.

**Layout**:
- **Header**: None - full-screen tuning interface
- **Main Content**: Non-scrollable, fixed layout
- **Safe Area Insets**: 
  - Top: insets.top + Spacing.xl
  - Bottom: insets.bottom + Spacing.xl

**Content Structure** (top to bottom):

1. **Information Display Bar** (top third of screen)
   - Horizontal layout with three equal-width sections
   - Left: Frequency in Hz (e.g., "440.2 Hz")
   - Center: Note + Octave (e.g., "A4")
   - Right: Cents deviation (e.g., "+5¢" or "-3¢")
   - Default state shows "--" in all three positions
   - All text in pale yellow

2. **Speedometer Dial** (bottom two-thirds of screen)
   - 180° semicircle gauge centered horizontally
   - Range: -50 cents (left) to +50 cents (right)
   - Grey arc border containing the dial
   - Grey tick marks evenly distributed around inner edge (aesthetic only, not labeled)
   - Needle pivots from center point:
     - Red when deviation > ±5 cents
     - Green when deviation ≤ ±5 cents
     - Stays at last position when sound stops
   - Red dot indicator at bottom center of dial when microphone detects signal above 50 dB threshold

**Behavior**:
- On launch: Shows dial with needle centered, "--" placeholders
- When note detected: Updates all values in real-time
- When deviation exceeds ±50 cents: Auto-switches to nearest semitone
- When sound stops: Needle freezes, values remain visible
- No microphone permission: Remains in default "--" state silently

## Color Palette

**Background**: 
- Primary: #0A0A0A (near black)
- Surface: #1A1A1A (dark grey)

**Text & UI**:
- Primary Text: #F5E6A8 (pale yellow)
- Dial Arc/Ticks: #4A4A4A (medium grey)
- Needle Red: #E63946 (bright red)
- Needle Green: #2A9D8F (muted green)
- Signal Indicator: #E63946 (bright red dot)

## Typography

**Font**: System font (San Francisco on iOS)

**Type Scale**:
- Frequency/Cents: 18pt Regular
- Note + Octave: 32pt Bold
- All text: #F5E6A8 (pale yellow)

## Visual Design

**Dial Specifications**:
- 180° semicircle arc
- Stroke width: 3px for outer grey border
- Tick marks: 1px width, 8px length, evenly spaced every ~5 degrees
- Needle: 2px width line extending from center to edge
- Red dot indicator: 8px diameter circle

**Spacing**:
- Top info bar: 60px from top safe area
- Info sections: 20px internal padding
- Dial: Centered with 40px margins on left/right
- Dial to top info: 80px vertical spacing

**Touchable Elements**: None - this is a passive display interface

## Assets to Generate

1. **icon.png**
   - Description: App icon featuring simplified speedometer dial with centered needle on dark background
   - Where used: Device home screen

2. **splash-icon.png**
   - Description: Simple speedometer dial silhouette in pale yellow on dark background
   - Where used: App launch screen

**Note**: All UI elements (dial, needle, tick marks) are rendered programmatically using React Native SVG for precision and performance. No illustration assets needed for the main interface.

## Implementation Notes

**Audio Processing**:
- Detection threshold: 50 dB minimum
- Analysis buffer: 100-200ms for accuracy priority
- Range: A0 (27.5 Hz) to C8 (4186 Hz) with buffer
- Auto-switch threshold: ±50 cents triggers semitone shift

**Offline Functionality**: App works completely offline with no internet required

**Platform**: iPhone portrait only, iOS optimized