# SpeakUp AI — Product Requirements Document

## Problem Statement

Improving communication and speaking skills requires consistent daily practice, but the biggest barrier isn't motivation — it's **friction**. Even when you know the types of drills that help (shadowing, impromptu speeches, filler elimination), you don't know *what exactly to say or do* in the moment. There's too much initial traction to get started: picking a topic, deciding which drill to do, figuring out how long to practice. This decision overhead kills the habit before it forms.

The result: you know *what* drills exist, but you never actually do them consistently because every session starts with a blank page.

## Solution

**SpeakUp AI** is a web application (laptop/desktop browser) that eliminates all friction from daily speaking practice. It generates a ready-to-go 10 or 15-minute drill session each morning — with AI-generated prompts, a live timer, speech transcription, and structured feedback — so the user can fire up the app and start speaking within 3 seconds.

The app provides:
- **Five drill types** targeting different communication skills (shadowing, impromptu speaking, technical vocabulary, audience-adaptive explanation, filler elimination)
- **AI-generated prompts** tailored to the user's chosen domains (technical or general)
- **Hybrid transcription** (live display + accurate post-drill Whisper transcript)
- **Automated metrics** (WPM, filler count) + **LLM-powered qualitative feedback**
- **Personal self-rating** system (Clarity / Confidence / Vocabulary out of 10)
- **Progress tracking** with Duolingo-style streaks and a 30-day calendar heatmap

## User Stories

1. As a user, I want to open the app and see my current streak and a "Start" button, so that I can begin practicing within 3 seconds with zero decision-making.
2. As a user, I want to select between a 10-minute or 15-minute session duration, so that I can fit practice into my morning routine regardless of time constraints.
3. As a user, I want the app to auto-generate a balanced session of 3-5 drills, so that I don't have to decide which drills to do each day.
4. As a user, I want to swap or skip individual drills in a generated session, so that I can focus on specific skills when I want to.
5. As a user, I want to choose between "Technical" and "General" mode, so that I can focus on either technical vocabulary or general communication on a given day.
6. As a user, I want to configure my technical topic list (e.g., ML, Distributed Systems, RAG), so that prompts are relevant to my actual domain expertise.
7. As a user, I want to configure my general topic list (e.g., leadership, philosophy, travel), so that general mode drills align with my interests.
8. As a user, I want to perform a **Shadow Drill** where a prompt sentence is displayed and I repeat/paraphrase it, so that I can practice fluent delivery and sentence structure.
9. As a user, I want to perform a **One-Minute Speech** drill where a word or sentence prompt is shown and I speak for 60 seconds about it, so that I can practice impromptu speaking and structuring thoughts on the fly.
10. As a user, I want to perform a **Rapid-Fire Keywords** drill where a technical topic is shown and I rattle off as many relevant technical terms as possible, so that I can improve my recall and use of precise domain vocabulary.
11. As a user, I want to perform a **Level Explain** drill where I explain a concept first to a high-school student and then to an expert, so that I can practice audience-adaptive communication.
12. As a user, I want to perform a **Filler Reset (Easy)** drill where I self-monitor for fillers and manually tap a reset button when I catch one, so that I can build filler awareness at my own pace.
13. As a user, I want to perform a **Filler Reset (Hard)** drill where the app auto-detects fillers via live speech recognition and resets my timer automatically, so that I get immediate behavioral feedback on filler usage.
14. As a user, I want to choose Filler Reset duration (30 seconds, 1 minute, or 2 minutes), so that I can progressively increase difficulty as I improve.
15. As a user, I want to see a live timer during each drill, so that I know how much time I have left.
16. As a user, I want to see live transcription of my speech as I speak, so that I get real-time visual feedback on what I'm saying.
17. As a user, I want a brief pause between drills with a "Next Drill" button, so that I can take a breath without drills auto-starting.
18. As a user, I want to see mini stats (WPM, filler count) between drills, so that I get quick feedback without breaking flow.
19. As a user, I want a full session summary after completing all drills showing all transcripts, metrics, and LLM-generated qualitative feedback, so that I can review my performance in detail.
20. As a user, I want to rate my session on three dimensions (Clarity, Confidence, Vocabulary) out of 10, so that I can track my subjective self-assessment over time.
21. As a user, I want to see a Duolingo-style daily streak counter on the landing page, so that I'm motivated to maintain consistency.
22. As a user, I want to see a 30-day calendar heatmap on the Progress tab, so that I can visualize my long-term practice consistency at a glance.
23. As a user, I want to see trend charts of my self-ratings (Clarity, Confidence, Vocabulary) over time, so that I can track subjective improvement.
24. As a user, I want to see trend charts of automated metrics (WPM, filler count) over time, so that I can track objective improvement.
25. As a user, I want to enter my Groq API key in a settings page, so that the app can generate prompts and evaluate my speech without hardcoding credentials.
26. As a user, I want my API key stored locally in the browser, so that I only need to enter it once.
27. As a user, I want all my session data auto-saved to browser storage after every session, so that I never lose progress.
28. As a user, I want a one-click "Export Data" button to download my progress as a JSON file, so that I have a backup in case I clear my browser data.
29. As a user, I want a one-click "Import Data" button to restore progress from a JSON file, so that I can recover from data loss.
30. As a user, I want the app to run smoothly in my laptop's Chrome browser, so that I can use it as part of my morning desktop routine.

## Implementation Decisions

### Architecture

- **Platform**: Web application — laptop/desktop browser (Chrome primary target). PWA/mobile is future work
- **Frontend**: Vite + React (single-page application)
- **Backend**: None — fully client-side. All API calls (Groq) made directly from the browser
- **Data persistence**: LocalStorage / IndexedDB — no server, no database
- **LLM Provider**: Groq API (free tier) for both prompt generation and post-drill evaluation
- **Speech-to-Text**: Hybrid — Web Speech API for live display, Groq Whisper for accurate evaluation transcripts
- **Environment**: Separate `speakup_ai` conda environment

### Core Modules

#### 1. Session Engine
Generates a balanced drill session given:
- Duration (10 or 15 minutes)
- Mode (Technical / General)
- Available drill types

Uses random balanced selection (no repeats within a session). Allocates approximate time budgets per drill type. Exposes a simple interface: `generateSession(duration, mode) → DrillSession`.

#### 2. Drill Framework
Base abstraction defining the drill lifecycle: `prepare → active → recording → complete`. Each drill type implements this interface with its own prompt format, timer behavior, and completion criteria.

Five implementations:
- **ShadowDrill**: Displays a full sentence/paragraph prompt
- **OneMinuteSpeechDrill**: Displays a word or sentence, fixed 60s timer
- **RapidFireKeywordsDrill**: Displays a technical topic, fixed 60s timer
- **LevelExplainDrill**: Displays a concept, two phases (high-school → expert)
- **FillerResetDrill**: Easy (manual reset button) / Hard (auto-detection via Web Speech API). Configurable duration: 30s / 60s / 120s

#### 3. Audio Pipeline
Encapsulates all audio concerns:
- **Recording**: MediaRecorder API to capture audio blobs during drills
- **Live transcription**: Web Speech API for real-time word display (cosmetic, best-effort)
- **Accurate transcription**: Groq Whisper API endpoint — audio blob → transcript (source of truth for evaluation)

Live and accurate transcription are fully decoupled — live display can be removed without affecting evaluation.

#### 4. Prompt Generator
Interfaces with Groq LLM API to generate drill-specific prompts:
- Takes: drill type + mode (Technical/General) + user's topic list
- Returns: structured prompt appropriate for the drill type
- Uses system prompts tailored per drill type to ensure appropriate output format

#### 5. Evaluation Engine
Two layers:
- **Metrics (local)**: WPM calculation, filler word detection (from predefined list scanned against Whisper transcript), keyword extraction/count for Rapid-Fire drills. Pure functions, no API calls.
- **Qualitative feedback (Groq)**: Sends transcript + drill type + metrics to Groq LLM for structured feedback (what went well, what to improve, specific observations).

#### 6. Progress Store
LocalStorage-based persistence layer:
- Session history (date, drills, metrics, self-ratings, LLM feedback)
- Streak tracking (current streak, longest streak)
- Aggregated metrics over time
- JSON export/import for backup
- Simple key-value interface with typed accessors

#### 7. Settings Manager
Manages user configuration in LocalStorage:
- Groq API key
- Technical topic list
- General topic list
- Default session duration preference
- Filler Reset difficulty/duration preferences

#### 8. UI Layer
React component hierarchy:
- **Landing Page**: Streak display, mode selector (Technical/General), duration selector (10/15 min), "Start Session" button
- **Drill Screen**: Active drill with prompt, timer, live transcript, recording indicator
- **Mini Stats Screen**: Between-drill pause with WPM + filler count + "Next Drill" button
- **Session Summary**: All transcripts, all metrics, LLM feedback, self-rating form (Clarity/Confidence/Vocabulary sliders)
- **Progress Dashboard**: Streak, 30-day heatmap, self-rating trends chart, metrics trends chart
- **Settings Page**: API key input, topic list management, preferences

### Session Flow

```
Landing Page
  ├─ Select Mode (Technical / General)
  ├─ Select Duration (10 / 15 min)
  └─ Click "Start Session"
       │
       ├─ Drill 1 → [Recording + Live Transcript] → Mini Stats → "Next Drill"
       ├─ Drill 2 → [Recording + Live Transcript] → Mini Stats → "Next Drill"
       ├─ Drill 3 → [Recording + Live Transcript] → Mini Stats → "Next Drill"
       ├─ ... (3-6 drills depending on duration)
       └─ Last Drill → [Recording + Live Transcript]
            │
            └─ Session Summary
                 ├─ Transcripts + Metrics + LLM Feedback per drill
                 ├─ Self-Rating (Clarity / Confidence / Vocabulary out of 10)
                 └─ "Done" → Back to Landing
```

### Topic Configuration

| Mode | Source | Prompt Style |
|---|---|---|
| Technical | User-defined topic list in Settings (e.g., "Machine Learning", "RAG", "System Design") | Domain-specific, focuses on precise vocabulary and technical explanation |
| General | User-defined topic list in Settings (e.g., "leadership", "philosophy", "daily life") | Storytelling, persuasion, narrative structure, general fluency |

### Filler Word Detection

- **Predefined filler list**: "um", "uh", "like", "you know", "basically", "sort of", "kind of", "I mean", "actually", "literally", "right", "so" (configurable)
- **Easy mode**: User self-monitors, taps "I used a filler" button to reset timer
- **Hard mode**: Web Speech API live transcript scanned against filler list in real-time; automatic timer reset on detection

## Testing Decisions

### Philosophy
- Test **external behavior**, not implementation details
- Focus on modules with **pure logic** that's critical to get right
- Browser-API-dependent modules are better verified manually or with integration tests later

### Modules to Test

#### Session Engine (unit tests)
- Generates correct number of drills for 10 and 15-minute sessions
- No drill type repeats within a session
- Handles edge cases (fewer drill types than slots)
- Time budget allocation is reasonable

#### Evaluation Engine — Metrics (unit tests)
- WPM calculation accuracy across various transcript lengths
- Filler word detection: catches exact matches, handles case insensitivity, doesn't false-positive on words containing filler substrings (e.g., "likewise" should not trigger "like")
- Keyword extraction and counting for Rapid-Fire drills

#### Progress Store (unit tests)
- Streak calculation (consecutive days, streak breaks, timezone handling)
- Session data serialization/deserialization
- JSON export produces valid, importable output
- Import correctly restores state

### Manual Verification
- Audio recording and playback
- Live transcription display
- Groq API integration (prompt generation + Whisper + evaluation)
- UI flow and drill transitions
- Desktop browser layout and usability (Chrome)
- Keyboard accessibility

## Out of Scope

The following are explicitly **not** part of this MVP:

- **User authentication / accounts** — Personal tool, no multi-user support
- **Backend server / database** — Fully client-side architecture
- **Advanced session composition** (weighted rotation based on history) — Random balanced is sufficient for MVP
- **Offline support** — Requires Groq API, so internet is assumed
- **Psychology-backed metric research** — Future work, user will research separately
- **Multiple language support** — English only for MVP
- **Social features** (leaderboards, sharing) — Personal practice tool
- **Voice quality analysis** (pitch, tone, pacing variation) — May be added later
- **Mobile app / PWA** — MVP targets laptop/desktop browser only. Mobile and PWA support is future work
- **Automated periodic JSON backups** — Manual export only (browser security limitation)
- **Past transcript re-reading** — Session summary is ephemeral; only metrics and ratings are persisted in Progress

## Further Notes

- **Groq API free tier** should be more than sufficient for personal daily use (~5-10 API calls per session)
- **Web Speech API** is Chrome/Edge-centric; Safari uses Apple's engine. Firefox has limited support. Primary target browser is **Chrome**
- The **live transcription is cosmetic only** — if it proves too flaky, it can be removed with zero impact on the evaluation pipeline
- **Self-rating dimensions** (Clarity, Confidence, Vocabulary) were chosen to map directly to the user's stated goals of comprehensivity, authority, and maturity in communication
- The app should be designed with **extensibility** in mind — new drill types can be added by implementing the drill framework interface
- **GitHub repo**: https://github.com/Vab-jain/speak-ai.git
- **Conda environment**: `speakup_ai`
