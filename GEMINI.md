# Project: The Imposter (Support App)
## Status: Day 1 - Core Implementation Complete

### **Implemented Features:**
- **Framework:** React Native / Expo (Dark/Neon Aesthetic).
- **Languages:** English, Spanish, Catalan, Dutch.
- **Game Logic:** 
  - Dynamic role assignment (Civilians vs lone-wolf Imposters).
  - "The Bug" (+1 Imposter after game 3).
  - "Chaos Mode" (All Imposters after game 5).
- **Interaction:**
  - Sequential secret reveal with "paper lift" animation.
  - Sequential secret voting or public agreement choice.
  - "Unanimous - 1" threshold logic with "Simple Majority" fallback.
- **Persistence:** Zustand + AsyncStorage for session recovery.

### **Pending Fixes & Next Steps (For Tomorrow):**
- **UI/UX Refinement:** User reported "many issues to fix" and "designs to change."
- **Web Support:** Current interactive issues on web (touch targets, gesture behavior).
- **Word Lists:** Expand from ~100 to the goal of 777 unique subtle entries per language.
- **Splash Screen:** Verify visibility on physical devices (currently configured but browser-limited).
- **Haptics:** Add tactile feedback for reveal/vote events.

### **How to Resume:**
1. Run `npm install`.
2. Run `npx expo start` to test the current build.
3. Review the `GEMINI.md` for context.
