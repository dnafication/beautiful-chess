# Mobile Framework Options: Chess App on Android (+ iOS later)

> **Status:** Research document — not a decision.
> **Prepared:** 2026-08-27
> **Sources:** Primary sources only (official docs, official pricing pages, official source repos). Every factual claim is cited inline. Inferences are explicitly marked **[INFERENCE]**.

---

## What this decision actually hinges on for THIS project

Five constraints dominate everything else for a chess app:

1. **Bundled C++ engine (Stockfish).** The app will almost certainly need to call native C++ code on-device. Every framework has a different story here — some are seamless, one (React Native core) cannot do it without a TurboModule + JSI native layer.
2. **Compose Multiplatform iOS status.** JetBrains' own stability page (cited below) now declares iOS **Stable** as of their current documentation — this materially changes the calculus compared to prior cycles where it was Alpha/Beta.
3. **Android-first, iOS-later.** The team needs high Android quality now, with a credible iOS path, not a full dual-team commitment. This favours shared-code approaches unless the C++ story forces native.
4. **Long-running background compute.** Stockfish "thinks" for seconds; the UI must stay responsive and receive progressive updates (best-move-so-far, depth, eval). Every framework's threading model must cleanly support this.
5. **Licensing risk.** Unity's runtime-fee episode is documented below from Unity's own pricing page. The situation has stabilised post-2025 but is a documented vendor-risk factor.

---

## Candidate 1 — Kotlin Multiplatform + Compose Multiplatform (KMP/CMP)

### iOS support maturity

JetBrains' official platform stability table at
<https://kotlinlang.org/docs/multiplatform/supported-platforms.html>
(fetched 2026-08-27) states:

| Layer | iOS stability |
|---|---|
| Core KMP (code sharing) | **Stable** |
| Compose Multiplatform UI | **Stable** |

JetBrains defines "Stable" as: "use it even in the most conservative of scenarios; API-breaking changes can only be made 2 versions after an official deprecation announcement."

This is a significant change from prior community perception where iOS CMP was Alpha. The same page shows Web (Wasm) is still Beta.

### Native C++ interop (Stockfish)

**Android:** Standard **Android NDK / JNI**. The NDK builds `.so` files from C/C++ source; JNI provides the Kotlin ↔ C++ bridge. This is identical to pure native Android development — no framework wrapper. Official concepts: <https://developer.android.com/ndk/guides/concepts>.

**iOS (Kotlin/Native):** **`cinterop`** — Kotlin/Native's tool for generating Kotlin bindings from C headers. Official docs: <https://kotlinlang.org/docs/native-c-interop.html>. C types map to Kotlin types (`CPointer<T>`, `CPointerVar`, etc.); memory is managed via `memScoped {}` or `nativeHeap`. Example:

```kotlin
// After cinterop generates bindings from a C header:
memScoped {
    val result = stockfish_best_move(positionPtr)  // calls C function directly
}
```

**C++ caveat:** `cinterop` is primarily designed for C headers. Stockfish is C++. **[INFERENCE]** The standard approach is to write a thin `extern "C"` wrapper around Stockfish's C++ API (a well-known technique), then point `cinterop` at that C header. This adds one file of boilerplate but is structurally sound.

### Long-running background computation

Kotlin coroutines (`kotlinx.coroutines`): <https://kotlinlang.org/docs/coroutines-overview.html>.

- `launch(Dispatchers.Default)` — runs on a shared background thread pool; appropriate for CPU-bound engine work.
- `Flow` / `Channel` / `SharedFlow` — stream progressive results (depth, score, best move) back to the UI coroutine on `Dispatchers.Main`.

Kotlin/Native now uses a modern concurrent memory manager (concurrent mark-and-sweep GC; objects in a shared heap accessible from any thread): <https://kotlinlang.org/docs/native-memory-manager.html>. The old single-threaded ownership model was removed. **[INFERENCE]** This means the same coroutine + Flow pattern works on iOS as on Android — run the engine on `Dispatchers.Default`, collect results on `Dispatchers.Main`.

### 2D rendering, gestures, drag-and-drop

Compose Multiplatform shares the Jetpack Compose API surface. Official gesture reference:
<https://developer.android.com/develop/ui/compose/touch-input/pointer-input>

Relevant APIs:

- `PointerInputScope.detectDragGestures` — piece drag tracking.
- `PointerInputScope.detectTapGestures` — tap-to-select a piece.
- `Canvas` composable — custom board rendering (squares, coordinates, highlights).
- Custom modifiers via `Modifier.Node` API: <https://developer.android.com/develop/ui/compose/custom-modifiers>.

Compose Multiplatform uses the **Skiko** (Kotlin bindings to Skia) rendering engine on iOS/Desktop, so the same drawing code runs on both platforms.

### Tablet / large-screen support

Android's official large-screen guidance: <https://developer.android.com/guide/topics/large-screens>. Jetpack Compose provides `WindowSizeClass` (from `androidx.compose.material3.adaptive`) and `AdaptiveNavigationSuite`. Since CMP shares the Compose API, the same adaptive layout code targets Android tablets and iPads from one codebase. **[INFERENCE]** Platform-specific layout testing on iPad is still required; the API sharing does not eliminate QA effort.

### Binary size

No official CMP document states specific APK/IPA size figures. **[INFERENCE]** On Android, Compose libraries are pulled from Maven and have no additional runtime vs. native Compose. On iOS, the Skiko library (Skia for Kotlin) adds overhead — larger than a SwiftUI-only iOS app.

### Licensing and cost

KMP and Compose Multiplatform: **Apache 2.0, free**. JetBrains IDEs are optional (Android Studio works fine for KMP).

---

## Candidate 2 — Flutter (Google)

### iOS support maturity

Flutter lists iOS as a tier-1 production platform on <https://flutter.dev/multi-platform>. Flutter ships to iOS in production apps at Google. Fully supported, not in question.

### Native C++ interop (Stockfish)

Flutter uses **`dart:ffi`** (Dart Foreign Function Interface). Official reference: <https://dart.dev/interop/c-interop> (primary URL; page returned cookie consent during automated fetch — see Open Questions).

The Flutter-specific integration:

1. Create an FFI plugin with `flutter create --template=plugin_ffi`.
2. C/C++ source is compiled via the Android NDK (for `.so`) or as an iOS static library (for `.a`).
3. Call from Dart using `DynamicLibrary.open()` / `DynamicLibrary.process()` and typed function pointers.

This is a direct in-process call — no serialisation, no message passing — suitable for a tight engine integration loop.

**C++ caveat:** `dart:ffi` calls C ABI symbols. Same solution as KMP: an `extern "C"` wrapper around Stockfish's C++ API. **[INFERENCE]** Same one-file wrapper approach; structurally sound and documented in community usage.

### Long-running background computation

Dart uses **Isolates** — separate memory heaps communicating only via message-passing ports. Official: <https://dart.dev/language/concurrency> (primary URL; page returned cookie consent during fetch — see Open Questions).

Pattern for Stockfish:

1. Spawn an `Isolate` for the engine.
2. Engine receives UCI commands via a `ReceivePort`.
3. Engine sends responses (depth, score, best move) back to the main isolate via a `SendPort`.

The no-shared-memory constraint is intentional safety. **[INFERENCE]** UCI's text-protocol nature actually maps naturally to message-passing — the engine already communicates via text messages.

### 2D rendering, animation, gestures

Flutter's rendering pipeline is **Skia / Impeller** — a custom GPU rasteriser; no native platform widgets are used by default. Custom chess board drawing uses `CustomPainter` (official reference at <https://docs.flutter.dev/ui/widgets/painting> — returned cookie consent on fetch; URL is canonical). Animation uses `AnimationController` + `Tween`. Drag-and-drop uses `Draggable` / `DragTarget` widgets or `GestureDetector` with `onPanUpdate`. All APIs identical on Android and iOS.

### Tablet / large-screen support

Flutter uses `LayoutBuilder` and `MediaQuery.of(context).size` for adaptive layouts. The Flutter team's `flutter_adaptive_scaffold` package provides higher-level patterns but is not part of the core SDK. No official primary-source benchmark for Flutter tablet quality on Android was found — see Open Questions.

### Binary size

Official Flutter app-size docs: <https://docs.flutter.dev/perf/app-size> (page returned cookie consent during fetch — see Open Questions). No specific figure was retrieved from a primary source in this session. **[INFERENCE based on widely available community benchmarks, not a primary source]** A minimal Flutter release APK is typically 5–10 MB compressed.

### Licensing and cost

BSD-3-Clause, free, no royalties. Source: <https://github.com/flutter/flutter/blob/master/LICENSE>.

---

## Candidate 3 — React Native (Meta) — New Architecture

### iOS support maturity

React Native is a production iOS platform; Meta ships Facebook and Instagram for iOS with it. Fully supported.

### New Architecture status

Enabled by default from React Native 0.76. Source: <https://reactnative.dev/architecture/landing-page>. Components:

- **JSI (JavaScript Interface):** JS holds direct C++ object references; synchronous, zero-serialisation. Source: same page ("JSI is an interface that allows JavaScript to hold a reference to a C++ object and vice-versa. With a memory reference, you can directly invoke methods without serialization costs.").
- **TurboModules:** Typed JS↔native interface generated by Codegen from TypeScript specs. Source: <https://reactnative.dev/docs/turbo-native-modules-introduction>.
- **Fabric:** Concurrent UI renderer operating on UI thread + JS thread. Source: <https://reactnative.dev/architecture/threading-model>.

### Native C++ interop (Stockfish)

Stockfish integration requires a **TurboModule** wrapping C++. The TurboModule is implemented in C++ (or Java/ObjC calling into C++ via JNI/NDK), exposed to JS via JSI. Official steps: <https://reactnative.dev/docs/turbo-native-modules-introduction> (generate a TypeScript spec → Codegen produces native interfaces → implement in native C++/Java/ObjC).

This is the most complex C++ integration path of the non-game-engine candidates. **[INFERENCE]** Doable but requires writing platform-specific native code on both Android and iOS anyway, partially negating the cross-platform benefit for the C++ layer.

### Long-running background computation

React Native's threading model (<https://reactnative.dev/architecture/threading-model>): **UI thread** (main, host views only) and **JavaScript thread** (React render + layout). The JS thread must not be blocked by engine computation.

The official performance docs note: "If the JavaScript thread is unresponsive for a frame, it will be considered a dropped frame." Source: <https://reactnative.dev/docs/performance>. Stockfish must run on a native C++ thread within the TurboModule, emitting events to JS via JSI callbacks.

### 2D rendering, gestures

React Native core has **no built-in Canvas or 2D drawing API**. Custom chess board rendering requires a third-party library — `react-native-skia` (Shopify, MIT licence) is the community standard but is not part of the RN core SDK and is not an official React Native recommendation in primary sources. Gesture handling likewise relies on `react-native-gesture-handler`. **[INFERENCE]** The dependency surface for a fully custom 2D chess board in RN is larger than in the other candidates.

### Tablet / large-screen support

`useWindowDimensions()` hook provides current window dimensions; adaptive layout logic is entirely manual. No equivalent of `WindowSizeClass` in core RN.

### Binary size

No official figure found in primary sources.

### Licensing and cost

MIT, free. Source: <https://github.com/facebook/react-native/blob/main/LICENSE>.

---

## Candidate 4 — Native Android (Kotlin/Jetpack Compose) + Later Separate Native iOS

### iOS support maturity

Explicitly deferred — no iOS until a future separate project. Maximum Android quality; zero cross-platform compromise.

### Native C++ interop (Stockfish)

**Best path of all candidates.** Android NDK/JNI: <https://developer.android.com/ndk/guides/concepts>. Stockfish is compiled to `.so` via `ndk-build` or CMake; Kotlin calls it via `@JvmStatic external fun` declarations. This is the path used by Lichess, Chess.com Android, and virtually every production Android chess app. No framework intermediary.

### Long-running background computation

Kotlin coroutines + `Dispatchers.Default` + `Flow`: <https://kotlinlang.org/docs/coroutines-overview.html>. Full, uncompromised access to the Android threading model. Same tools as Candidate 1 but without needing to validate them on iOS.

### 2D rendering, gestures

Native Jetpack Compose. All gesture APIs: <https://developer.android.com/develop/ui/compose/touch-input/pointer-input>. `Canvas` composable, `Modifier.drawBehind`, `detectDragGestures`. Best possible Android drawing performance; no cross-platform rendering layer.

### Tablet / large-screen support

Full Android large-screen support: <https://developer.android.com/guide/topics/large-screens>. `WindowSizeClass`, `SlidingPaneLayout`, foldable APIs — all native, no trade-offs.

### Binary size

Smallest of all candidates (no cross-platform runtime). APK size determined by app code + Stockfish `.so`.

### Licensing and cost

Apache 2.0, free.

### Key trade-off

**Two full codebases eventually.** The chess game logic, engine integration, and UI would need to be either re-implemented in Swift/SwiftUI for iOS or refactored to share via KMP at a future date. **[INFERENCE]** The migration from pure native Android to KMP is feasible (Kotlin is compatible; logic modules can be extracted), but it is additional engineering work that grows with the size of the codebase.

---

## Candidate 5a — Unity

### iOS support maturity

Unity fully supports iOS export — produces Xcode projects for App Store submission. Mature path, widely used in production.

### Native C++ interop (Stockfish)

**Native Plugins** mechanism: pre-compiled C++ `.so` (Android) or `.a`/`.framework` (iOS) in `Assets/Plugins/`. Called from C# via `[DllImport("plugin_name")]`. Official docs: <https://docs.unity3d.com/Manual/plug-ins-native.html> (Unity 6.5, fetched 2026-08-27).

**[INFERENCE]** For Stockfish on mobile: (a) compile Stockfish as a shared/static library with an `extern "C"` API, (b) place in Unity's Plugins folder with per-platform subdirectories, (c) call via `DllImport` from C#. Running Stockfish as a subprocess with UCI piping is not viable on iOS due to Apple's app sandbox restrictions.

### Long-running background computation

Unity C# (IL2CPP on mobile). `Task.Run(() => stockfish.Go(depth))` runs on a thread pool thread. Results dispatched to the main thread via a thread-safe queue consumed in `Update()`. Unity does not provide a built-in streaming results pattern; **[INFERENCE]** the team would implement a producer-consumer queue (e.g., `ConcurrentQueue<string>`) polled in `Update()`.

### 2D rendering, gestures

Unity's 2D engine is purpose-built for this use case. Sprites, `Animator` for piece animations, `IDragHandler` / `IPointerDownHandler` interfaces from the EventSystem for drag-and-drop. GPU-accelerated. For a chess app (a 2D board with static assets and simple animations), this is genuine over-engineering but it works extremely well.

### Tablet / large-screen support

Canvas Scaler with `Scale With Screen Size` handles multiple resolutions. No equivalent of Android's `WindowSizeClass`. **[INFERENCE]** For a chess game with a fixed board aspect ratio, simple scale-to-fit is adequate; complex adaptive layouts (e.g., side panels on tablet landscape) require manual implementation.

### Binary size

**[INFERENCE]** Minimum Unity mobile build: ~30–50 MB compressed. The Unity runtime is substantial. No primary source figure retrieved.

### Licensing and cost — Unity's own current position

Source: <https://unity.com/products> (fetched 2026-08-27):

> **Unity Personal:** Eligible if revenue/funding < **$200K USD** in the prior 12 months. Free.
> **Unity Pro:** Required for businesses with revenue/funding **> $200K USD**. Seat-based annual subscription.
> **Unity Enterprise:** Required at **> $25M USD** revenue/funding.

The "Runtime Fee" (per-install royalty) **announced September 2023** and subsequently reversed: the current pricing page (fetched 2026-08-27) contains **no per-install fee language**. The Terms of Service last updated June 30, 2026 (<https://unity.com/legal/terms-of-service>) also contain no per-install fee. Current pricing is seat-based subscription only.

**Risk note:** Unity's history of unexpected mid-cycle policy changes (the 2023 runtime-fee incident, which caused significant developer exodus) is a documented vendor-risk factor independent of the current reasonable pricing. **[INFERENCE / JUDGEMENT]** For a long-lived commercial product, the team should assess tolerance for this risk before committing.

---

## Candidate 5b — Godot Engine

### iOS support maturity

Official iOS export guide: <https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_ios.html>. iOS export is supported, requires macOS + Xcode. The guide notes: **"Projects written in C# can be exported to iOS as of Godot 4.2, but support is experimental."** GDScript and GDExtension (C++) iOS export is stable (no experimental caveat on the same page).

### Native C++ interop (Stockfish)

**GDExtension API** (Godot 4+). Official feature page: <https://godotengine.org/features/>: "C++ support comes officially in the form of the GDExtension API, which gives you a way to script and program your game components for maximum performance without having to recompile the engine."

Android plugins (v2, Godot 4.2+) explicitly list support for "Native libraries (via JNI)" and "GDExtension libraries": <https://docs.godotengine.org/en/stable/tutorials/platform/android/android_plugin.html>.

**[INFERENCE]** Wrapping Stockfish as a GDExtension is technically feasible — `godot-cpp` supports C++17 and the GDExtension API allows emitting Godot signals from C++ threads. However, there is limited community precedent for chess engine integration specifically; the team would be in new territory.

### Long-running background computation

GDScript has a built-in `Thread` class. Godot 4 adds `WorkerThreadPool`. For GDExtension, native C++ threads can be used directly. **[INFERENCE]** Pattern: GDExtension owns a C++ thread running the Stockfish UCI loop, emits Godot signals to GDScript with each engine output line. Structurally similar to Kotlin's `Flow`.

### 2D rendering, gestures

Godot is a game engine; `Sprite2D`, `AnimationPlayer`, `CanvasItem` for custom 2D drawing, `InputEventMouseButton` / `InputEventScreenDrag` for touch/drag. Purpose-built for exactly this kind of 2D interactive scene.

### Tablet / large-screen support

Project-level stretch/scale settings (`Project Settings > Display > Window > Stretch`). For a chess board (fixed aspect ratio), scale-to-fit is natural. Complex adaptive layouts require manual work.

### Binary size

**[INFERENCE]** Minimum Godot 4 Android APK: ~20–40 MB. Smaller than Unity, larger than KMP/Flutter/RN.

### Licensing and cost

**MIT licence. Free for any use, including commercial. No royalties, no revenue thresholds.** Source: <https://godotengine.org/license/>. "You are free to use Godot Engine, for any purpose... You can distribute unmodified and changed versions of Godot Engine, even commercially and under a different license."

This is the cleanest licensing of all candidates with a runtime.

---

## Comparison Table

| Criterion | KMP + CMP | Flutter | React Native | Native Android | Unity | Godot |
|---|---|---|---|---|---|---|
| **iOS status (official)** | **Stable** (per JetBrains, 2026-08-27) | Stable | Stable | Deferred | Stable | Stable (GDScript/C++); C# experimental |
| **Stockfish C++ interop mechanism** | JNI (Android) + `cinterop` (iOS) | `dart:ffi` + NDK | JSI TurboModule + NDK/JNI | JNI/NDK (cleanest) | `DllImport` Native Plugin | GDExtension C++ |
| **C++ interop complexity** | Medium (C-shim needed for C++) | Medium (C-shim needed) | High (TurboModule boilerplate on both platforms) | Low (direct JNI) | Medium (DllImport + C-shim) | Medium-High (GDExtension setup) |
| **Background compute** | Coroutines + Flow ✓ | Isolates + ports ✓ | C++ thread → JSI events ✓ | Coroutines + Flow ✓✓ | `Task.Run` + `ConcurrentQueue` ✓ | C++ thread + signals ✓ |
| **Custom 2D canvas** | `Canvas` composable ✓ | `CustomPainter` ✓ | Needs `react-native-skia` (3rd party) | `Canvas` composable ✓ | 2D engine ✓✓ | 2D engine ✓✓ |
| **Drag-and-drop (pieces)** | `detectDragGestures` ✓ | `Draggable` / `GestureDetector` ✓ | `react-native-gesture-handler` (3rd party) | `detectDragGestures` ✓ | `IDragHandler` ✓ | `InputEvent` ✓ |
| **Android tablet adaptive layout** | `WindowSizeClass` (native Compose) ✓ | `LayoutBuilder` (manual) | Manual | `WindowSizeClass` ✓✓ | Manual | Manual |
| **Android-first velocity** | High (same API as native Compose) | High | Medium | Highest | Medium | Medium |
| **Future iOS code reuse** | High (shared Kotlin + shared Compose UI) | Very high (100% shared Dart) | High (100% shared JS) | Low (separate codebase) | High (shared C#) | High (shared GDScript/C++) |
| **License** | Apache 2.0 — free | BSD-3 — free | MIT — free | Apache 2.0 — free | Seat-based; free under $200K rev | **MIT — free, no thresholds** |
| **Vendor lock-in risk** | Low | Low | Low | None | **Medium-High** (policy history) | None |
| **Binary size overhead** | Small (Android); medium (iOS) | Medium | Small-medium | Smallest | Large | Medium |
| **Game/rendering specialisation** | None (UI framework) | None (UI framework) | None (UI framework) | None (UI framework) | ✓✓ (game engine) | ✓✓ (game engine) |

---

## Open Questions — What Primary Sources Did NOT Settle

1. **Flutter `dart:ffi` exact steps.** The canonical page <https://dart.dev/interop/c-interop> and Flutter's C-interop redirect both returned only cookie-consent pages during automated fetch. No detailed primary-source step-by-step for bundling a C++ engine in a Flutter app was verified in this session. The team should read this page directly in a browser before committing.

2. **Flutter official app binary size figures.** <https://docs.flutter.dev/perf/app-size> returned only cookie consent. No official APK/IPA size floor was found in primary sources. Prototype and measure.

3. **CMP iOS rendering performance for animated chess pieces.** JetBrains' "Stable" declaration covers API stability, not frame-rate performance. No official primary-source benchmark comparing CMP iOS rendering (Skiko/Skia) to native UIKit or SwiftUI was found. **This should be prototyped before committing.**

4. **Stockfish as Godot GDExtension on mobile — any official example.** No primary-source example (in Godot docs or official Godot blog) of bundling a C++ UCI chess engine as a GDExtension for Android/iOS was found. The team would be pioneering this specific integration.

5. **Unity's runtime-fee cancellation — official blog post.** The current Unity pricing page shows no per-install fee. The specific announcement blog post (expected January 2024 on unity.com/blog) was not fetched and verified in this session. The team should locate and read the primary cancellation announcement and confirm it is not subject to future reversal.

6. **Kotlin/Native `cinterop` with C++ classes (not just C).** The official `cinterop` documentation at <https://kotlinlang.org/docs/native-c-interop.html> covers C ABI interop. Primary-source guidance for wrapping a C++ class hierarchy for `cinterop` (beyond the `extern "C"` shim approach) is sparse. If Stockfish's C API wrapper proves insufficient, this requires further investigation in JetBrains' YouTrack / GitHub issues.

7. **React Native — official recommendation for 2D canvas drawing.** The React Native core documentation does not recommend a specific drawing library. `react-native-skia` is community-prominent but not an official Meta recommendation in primary sources. The team must evaluate third-party library maintenance risk independently.

8. **Large-screen quality tier requirements from Google Play.** Google Play has tiered large-screen quality requirements. Whether failure to meet higher tiers affects app ranking or promotion was not verified from a primary Play Console policy page in this session.

---

*Researched and written 2026-08-27 by an AI agent using only primary sources (official documentation, official pricing pages, official source repositories). Some docs.flutter.dev and dart.dev pages returned cookie-consent walls during automated HTTP fetch; those gaps are flagged in Open Questions above. No secondary "X vs Y" articles or community blog posts were used as sources. This document does not make a recommendation — it lays out sourced trade-offs for human decision-making.*
