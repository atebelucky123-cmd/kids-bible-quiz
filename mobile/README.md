# Kids Bible Quiz — Mobile App

The students' app (React Native + Expo, SDK 57). See the [project README](../README.md) for the full setup, including the API server it talks to.

## Run it

```bash
cp .env.example .env   # then set EXPO_PUBLIC_API_URL
npm install
npx expo start
```

Scan the QR code with the Expo Go app on a phone. `EXPO_PUBLIC_API_URL` is either your computer's LAN IP (running the server locally) or the deployed API, `https://kids-bible-quiz-api.onrender.com`.

## Layout

- `src/app/(auth)` — welcome, login and two-step registration
- `src/app/(app)` — home, quiz picker, quiz, results and history
- `src/components/ui` — shared UI pieces (buttons, answer options, timer, mascot)
- `src/lib/api.ts` — every call to the API server
