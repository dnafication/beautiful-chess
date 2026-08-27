# React Native with Expo

Earlier research rated React Native the weakest of six candidate frameworks for this project, but that assessment was dominated by the need to bundle Stockfish — a C++ engine — which made RN's TurboModule/JSI interop the most complex path of any candidate. Dropping the computer opponent removed native interop from the requirements entirely, at which point the deciding factor became existing fluency, which is JavaScript/TypeScript. We are building with Expo-managed React Native rather than bare RN, because nothing in this app needs a native escape hatch and Expo removes the cost of hand-maintaining two native projects when iOS arrives.

## Considered Options

- **Kotlin Multiplatform + Compose Multiplatform** — technically the strongest fit (JetBrains declares iOS Stable, shared UI, native-grade Android), rejected only because the team does not work in Kotlin.
- **Flutter** — equally strong, rejected for the same reason.
- **Native Android** — best Android quality, rejected because it defers the entire iOS problem into a second codebase.
- **Unity / Godot** — over-fitted; a 2D board needs no game engine, and Unity additionally carries documented vendor-policy risk.

At this size, framework familiarity dominates every other factor. See `docs/research/mobile-framework-options.md`.
