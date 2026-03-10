# The Imposter (L'impostor)

A neon-themed, multi-language social deduction game built with React Native and Expo. Perfect for parties, "The Imposter" challenges players to identify the "lone wolf" among them using subtle clues and clever discussion.

## 🎮 How to Play

1.  **Setup:** 3 or more players enter their names and select a Game Mode (Adults +18 or Kids).
2.  **The Secret:** Each player swiped up to reveal their identity.
    *   **Civilians:** Receive a secret word (e.g., "Coffee").
    *   **Imposter(s):** Receive a subtle clue related to the word (e.g., "Breakfast drink").
3.  **The Discussion:** Players take turns saying one word related to their secret. Civilians try to find the Imposter, while the Imposter tries to blend in by guessing the secret word from others' clues.
4.  **The Verdict:** After two rounds, players must vote.
    *   **Public Agreement:** Everyone agrees on a suspect.
    *   **Secret Vote:** Players pass the phone to vote privately.
5.  **Winning:**
    *   The Civilians win if they catch the Imposter.
    *   The Imposter wins if they remain undetected or successfully guess the secret word.

## ✨ Features

*   **Neon Aesthetic:** Modern, high-contrast dark theme with glowing UI elements.
*   **Dynamic Role Assignment:** Logic scales from single imposters to multiple suspects based on player count.
*   **Multi-language Support:** Play in English, Spanish, Catalan, or Dutch.
*   **Adaptive UI:** Secret words auto-scale their font size to fit any screen or word length.
*   **Tactile Feedback:** Full Haptic integration for an immersive physical experience.
*   **System "Bugs":** 
    *   **Extra Imposter:** A 20% chance of an additional imposter appearing after 5 consecutive games.
    *   **Chaos Mode:** A rare state where *everyone* might be an imposter.
*   **Persistence:** Session recovery ensures games aren't lost if the app closes.

## 🛠 Technical Stack

*   **Framework:** React Native / Expo (SDK 54).
*   **State Management:** Zustand with Persistence middleware.
*   **Navigation:** Expo Router (File-based routing).
*   **Gestures:** React Native Gesture Handler for "paper-lift" reveals.
*   **Storage:** AsyncStorage for saving game history and players.

## 🚀 Getting Started

### Prerequisites
*   Node.js (v20+)
*   npm
*   Android Studio (for local builds)

### Installation
1.  Clone the repository.
2.  Run `npm install`.
3.  Start the development server:
    ```bash
    npx expo start
    ```

### Building the APK (Local)
To generate an APK using your local Android SDK:
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export ANDROID_HOME=$HOME/Library/Android/sdk
npx eas-cli build --platform android --profile preview --local
```

## 📝 License
Proprietary / Private. Created for Sergi Torralba.
