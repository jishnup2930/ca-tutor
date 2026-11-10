# My CA Diary

A personal, frontend-only CA Final preparation app built with React, Vite and TypeScript.

## Included

- Personal dashboard for Meghna with notes from Jishnu Pedengal, shown in order: the next one on every refresh and each new day (100 notes in `QUOTES` in `src/App.tsx`)
- Six CA Final paper areas (FR, AFM, Audit, DT, IDT and IBS)
- ICAI chapter list for all six papers preloaded (FR, AFM, Audit, DT, IDT; IBS case-study areas), plus your own topics
- Topic progress, difficulty, notes and resource links
- Learning workspace and personal notes library
- Practice: 650 original, exam-level MCQs (100+ per paper; IBS as 18 case studies). Wrong answers turn red and can be retried, right ones turn green with a one-line explanation; finished questions are skipped next time and Retest brings them back. Her own questions can still be added.
- Flashcards for active recall
- Revision planner with revision cycles
- Flexible study-time logging (manual duration, multiple sessions per day, several chapters per entry, no fixed daily target)
- Study timer: start, pause for breaks, switch paper, end; saves to the study log automatically, keeps running while the app is closed, and asks "Still studying?" after 5 hours
- Weekly, monthly and subject-wise analytics
- JSON backup and restore
- Responsive layout and installable web-app manifest

## Important content and accuracy notes

The app intentionally does not invent an ICAI chapter list, question bank, suggested answer or official study notes. CA Final applicability can change by exam attempt. Add/import the syllabus and questions after checking the official ICAI material applicable to the candidate's attempt.

Official resource starting points:
- ICAI Board of Studies: https://boslive.icai.org/
- ICAI main website: https://www.icai.org/

Use official links for ICAI PDFs and resources. Do not copy or redistribute ICAI copyrighted material without permission. The app stores links and the user's own notes; it does not download or rehost ICAI content.

## Run locally

Requirements: Node.js 20+ recommended.

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Build

```bash
npm run build
npm run preview
npm test   # run the test suite
```

## Deploy to GitHub Pages

1. Create a GitHub repository named `ca-final-study-companion` (or update the `base` value in `vite.config.ts` to match your repository name).
2. Push this project to the repository.
3. In GitHub, open **Settings → Pages** and select **GitHub Actions** as the build/deployment source.
4. Add this workflow as `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

5. If your repository name is not `ca-final-study-companion`, update the `base` setting in `vite.config.ts`.

## Data storage and privacy

- No backend, account system, API key or external AI call.
- Data is stored in browser `localStorage` on the current browser/device.
- Export a JSON backup regularly. Restore it in another browser to move the app data.
- Clearing browser storage can delete app data.
- Large personal PDF files are not uploaded or stored by this starter version. Use official resource links or keep files in your own device/cloud storage.

## Current scope / future enhancements

This is a complete working starter application with functional local CRUD and tracking flows. It ships with the ICAI chapter titles for each paper (`src/syllabus.ts`, sources listed there; re-check them against ICAI's applicability list for each attempt). It does not include copyrighted ICAI PDFs, a verified exam question bank, automatic PDF parsing, cross-device sync, notifications or timed mock-exam engine. Those should be added using verified source material and tested separately.
