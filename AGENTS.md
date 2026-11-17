# Project workflow

- Use Chinese for explanations and PR descriptions unless asked otherwise.
- Implement one coherent feature per branch and pull request. Target `main`; use `feat/`, `fix/`, or `docs/` branch prefixes.
- Include the observable behavior, validation performed, and material limitations in each PR description. Distinguish DOM/model tests from real-browser checks.
- Open the PR for the user to review. Do not merge it, enable auto-merge, or push directly to `main` without explicit instructions.
- Preserve the user's working changes. Use an isolated checkout or staging directory when needed.
- Keep the browser prototype runnable offline without a build step. Retain existing saves unless the feature requires a documented migration.
- Keep poster collections, archives, generated audio, and model weights out of feature commits. Preserve local original assets.
- Run `node tests/scene-model.test.cjs` and syntax checks for changed scripts. When changing interactions, also run the DOM checks if jsdom is available, and perform real-browser checks when permitted.
- Do not claim animation, touch input, drag-and-drop, or visual layout passed browser testing based only on jsdom.
