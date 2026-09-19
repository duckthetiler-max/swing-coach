# Vendored MediaPipe Tasks Vision 1.0.1

Copied from the npm package `@mediapipe/tasks-vision@1.0.1` (Apache 2.0) on 15 Sep 2026:
`vision_bundle.mjs` and `wasm/` (SIMD build plus the no-SIMD fallback). The `module` WASM
variant was dropped; `FilesetResolver.forVisionTasks('./vendor/tasks-vision/wasm')` uses the
default loader. Self-hosted so the app works at the range without a CDN.
