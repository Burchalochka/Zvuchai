# Voice-to-Task AI Pipeline — Developer Guide

**Feature:** Create tasks, habits, and goals from natural voice input using Gemini AI.
**Status:** Prompt engineering phase — app integration not yet implemented.
**Primary language:** Ukrainian; English also supported.

---

## Pipeline Overview

```
User speaks
    │
    ▼
@react-native-voice/voice   ← STT module (already integrated in AddItemModal)
    │  raw transcription string
    ▼
Context block injection     ← "Today: YYYY-MM-DD (Weekday)"
    │
    ▼
Gemini 1.5 Flash API        ← system prompt + context + transcription
    │  JSON response
    ▼
Strip _meta block           ← keep _meta for UX logic (confirmation flags)
    │
    ▼
Factory function            ← createTask() / createHabit() / createGoal()
    │                          (src/utils/itemDefaults.js)
    ▼
TasksContext                ← addTask() / addHabit() / addGoal()
```

---

## Prompt File

**Location:** `src/prompts/gemini-voice-task-v1.md`

**Contents summary:**
- Role definition (extraction engine, JSON-only output, no prose)
- Full output JSON schema with field types and constraints
- 12 extraction rules covering: language detection, item type inference (with tiebreaker
  rules), date resolution, time derivation, priority/difficulty, reminders, tags,
  recurrence patterns, unintelligible input handling, title normalization, description
  population, and `_meta` population
- 6 few-shot examples in Ukrainian (task / task-with-reminder / task-with-times / habit / goal / unintelligible)

**Versioning convention:**
Each prompt revision creates a new file (`gemini-voice-task-v2.md`, etc.) rather than
overwriting. The active version used in the app is referenced in `src/api/gemini.js`
(not yet created). Never delete old versions — they serve as rollback points.

---

## Output JSON Schema

### Item data fields

These fields are passed to the factory function after stripping `_meta`.
The app's factory functions (`createTask`, `createHabit`, `createGoal`) in
`src/utils/itemDefaults.js` will fill in any remaining fields (`id`, `status`,
`createdAt`, `updatedAt`, `streak`, etc.) automatically.

| Field | Type | Notes |
|---|---|---|
| `type` | `"task" \| "habit" \| "goal"` | Required |
| `title` | `string` | Required, non-empty |
| `description` | `string` | Default `""` |
| `date` | `"YYYY-MM-DD"` | Resolved absolute date |
| `startTime` | `"HH:MM"` | 24-hour format |
| `endTime` | `"HH:MM" \| null` | null if not determinable |
| `priority` | `"low" \| "medium" \| "high" \| null` | null = not mentioned |
| `difficulty` | `"easy" \| "medium" \| "hard" \| null` | null = not mentioned |
| `estimatedDuration` | `number \| null` | Minutes |
| `dueDate` | `"YYYY-MM-DD" \| null` | |
| `tags` | `string[]` | Lowercase English; `[]` if unclear |
| `reminder` | object | See below |
| `recurrence` | object \| null | Habits only; null for task/goal |
| `target` | object \| null | Goals only; null for task/habit |

**`reminder` object:**
```json
{
  "enabled": false,
  "mode": "before_start | at_time",
  "minutesBefore": 10,
  "time": null,
  "recurrent": false
}
```

**`recurrence` object (habits):**
```json
{
  "type": "daily | weekly | custom",
  "days": [0, 1, 2, 3, 4, 5, 6]
}
```
Weekday indices: 0 = Sunday, 1 = Monday, ..., 6 = Saturday.

**`target` object (goals):**
```json
{
  "value": 20,
  "unit": "книжок",
  "targetDate": "2026-12-31"
}
```

### `_meta` block

The `_meta` block is **developer/app data**. It must be stripped before the item is
saved to the database. Its purpose is to drive UX decisions in the preview modal.

| Field | Type | Meaning |
|---|---|---|
| `confidence` | `number` (0.0–1.0) | Overall extraction quality |
| `fieldConfidence` | `object` | Per-field confidence score for any populated field |
| `defaultsUsed` | `string[]` | Fields where the model applied a default (no user cue) |
| `needsConfirmation` | `string[]` | Subset of `defaultsUsed` where default may be wrong |
| `derivedFields` | `string[]` | Fields calculated from other fields, not speech |
| `unintelligible` | `boolean` | True if no meaningful content could be extracted |

**App usage of `_meta`:**
- `unintelligible: true` → show error, prompt user to retry or open manual form
- `confidence < 0.7` → show warning banner in preview modal
- `needsConfirmation` → highlight those fields for user review in the preview
- `defaultsUsed` → optional: show subtle indicators on auto-filled fields
- Strip all `_meta` before calling factory function

---

## Gemini API Configuration

| Parameter | Value |
|---|---|
| Model | `gemini-1.5-flash` |
| Endpoint | `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent` |
| `responseMimeType` | `application/json` |
| `responseSchema` | Full item data schema (enforces field types at API level) |
| `temperature` | `0.1` |
| `maxOutputTokens` | `1024` |

**Why JSON mode?**
Using `responseMimeType: "application/json"` + `responseSchema` forces Gemini to return
only valid, schema-conformant JSON — no markdown fences, no prose, no explanation.
This virtually eliminates malformed output and removes the need for complex parsing logic.

---

## Context Injection

A single line is prepended to the user message (not the system prompt) before each API call:

```
Today: 2026-03-04 (Tuesday)
```

This provides the reference point for relative date resolution ("tomorrow", "next Friday",
"у п'ятницю"). Injecting it in the user message (not the system prompt) allows prompt
caching to work on the static system prompt while only the per-call context changes.

---

## How to Test a Prompt Version Manually

Before API integration in the app, test prompt versions directly in Google AI Studio:

1. Open [Google AI Studio](https://aistudio.google.com)
2. Create a new prompt → choose **Gemini 1.5 Flash**
3. Set temperature to `0.1`
4. Paste the contents of `src/prompts/gemini-voice-task-v1.md` into the **System instructions** field
5. Set output format to JSON (or use the structured output config)
6. In the user message field, type:
   ```
   Today: 2026-03-04 (Tuesday)
   [your test utterance here]
   ```
7. Run and inspect the JSON output against the expected schema

**Suggested test utterances to validate:**

| Utterance | What to verify |
|---|---|
| `"Купити молоко"` | Default date = today, default startTime, needsConfirmation includes date |
| `"Нагадай мені подзвонити мамі завтра о 18:00"` | reminder.enabled=true, date=tomorrow, mode=at_time |
| `"Зустріч з 10 до 11:30 у четвер"` | endTime derived duration=90, date resolved to next Thursday |
| `"Медитація щодня о 8 ранку"` | type=habit, recurrence.type=daily, days=[0..6] |
| `"Хочу схуднути на 5 кг до літа"` | type=goal, target.value=5, target.unit="кг", dueDate=June 1 |
| `"Buy milk"` (English) | Language auto-detected, correct output |
| `"um... uh..."` | unintelligible=true, confidence=0.0, title="" |

---

## Key Decisions and Rationale

| Decision | Choice | Rationale |
|---|---|---|
| Language detection | Model auto-detects | Avoids injecting language per call; Gemini 1.5 handles bilingual well |
| ThemeColor | Not in model output | App assigns by type; cleaner separation of concerns |
| Reminder default | `enabled: false` | Only populate on explicit user request; avoid unwanted notifications |
| Priority/difficulty when absent | `null` | Lets factory function apply app default without flagging as a user concern |
| Default date | Today (injected as context) | Most natural expectation; flagged in `needsConfirmation` for user review |
| Unintelligible input | `confidence: 0.0`, `unintelligible: true` | App can detect and gracefully fallback to manual form |
| Few-shot examples | 5 Ukrainian examples | Anchors model behavior on primary language; covers all 3 types + edge cases |
| JSON mode | `responseMimeType: application/json` + `responseSchema` | Eliminates malformed output without complex parsing |
| Temperature | `0.1` | Deterministic extraction — creativity is undesirable here |
| Prompt versioning | New file per version | Enables rollback and comparison across prompt iterations |

---

## Open Questions (to revisit before app integration)

- What `confidence` threshold triggers auto-save vs. requiring user confirmation?
- How should `needsConfirmation` fields be presented in the preview UI?
- When the user edits a field in the preview, should its entry in `needsConfirmation`
  be cleared silently?
- Should a golden test set be created before or after the first integration?
- When to escalate to `gemini-1.5-pro` if Ukrainian quality is insufficient?
- Production API key strategy: gitignored secrets file (dev) → backend proxy (prod)
