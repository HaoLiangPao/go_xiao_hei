# Project workflow

- Use Chinese for explanations and PR descriptions unless asked otherwise.
- Implement one coherent feature per branch and pull request. Target `main`; use `feat/`, `fix/`, or `docs/` branch prefixes.
- Include the observable behavior, validation performed, and material limitations in each PR description. Distinguish DOM/model tests from real-browser checks.
- For UI changes, embed screenshots of desktop and mobile views and the main states directly in the PR description. Include route details, gameplay, and progress changes where relevant; do not limit the description to two screenshots and send the reviewer to another document for the rest.
- Prepare a PR after every feature. Include the desktop web experience and the mobile experience in the implementation, screenshots, and acceptance checks.
- If remote PR creation is blocked, leave a verified feature commit bundle, PR body, and a ready-to-run desktop command that pushes the branch and creates the PR.
- Open the PR for the user to review. Do not merge it, enable auto-merge, or push directly to `main` without explicit instructions.
- Preserve the user's working changes. Use an isolated checkout or staging directory when needed.
- Keep the browser prototype runnable offline without a build step. Retain existing saves unless the feature requires a documented migration.
- Keep poster collections, archives, experimental/generated audio sources, and model weights out of feature commits. Preserve local original assets. User-approved runtime images and synthesized clips may be committed under web/public with a checked resource manifest so clean previews and builds have media available.
- Run `node tests/scene-model.test.cjs` and syntax checks for changed scripts. When changing interactions, also run the DOM checks if jsdom is available, and perform real-browser checks when permitted.
- Do not claim animation, touch input, drag-and-drop, or visual layout passed browser testing based only on jsdom.

## Character artwork review

- 新增或修改角色模型、角色绘图、Live2D或像素精灵时，使用仓库内 `.agents/skills/character-art-review/SKILL.md` 做独立视觉审核；有独立Agent环境时交由未参与制作的审阅者执行。
- 在PR里分别记录功能验证与美术结论，并提供相同视角的原作参考、改前/改后以及电脑和手机画面。证据不足或审美未通过时保留对应结论，交由用户审核，不以构建/测试成功替代原作还原度。
