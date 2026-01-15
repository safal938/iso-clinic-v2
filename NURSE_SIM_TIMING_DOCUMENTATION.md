# Nurse Simulation Timing & Synchronization Documentation

This document explains all the delays, waits, checks, and synchronization mechanisms used in the nurse simulation feature.

---

## Overview

The nurse simulation involves real-time WebSocket communication with a backend that sends:
- **Transcripts** (text of what nurse/patient says)
- **Audio** (PCM audio chunks for text-to-speech)
- **Clinical Data** (diagnoses, questions)
- **Turn Cycle Events** (signals when a conversation turn completes)

The frontend must synchronize these to create a natural conversation experience where text appears after audio finishes playing.

---

## 1. WebSocket Service Timing (`websocketService.ts`)

### 1.1 Audio-Text Synchronization

**Problem:** Transcripts and audio chunks arrive separately and may arrive out of order.

**Solution:** Queue system with AudioContext timing.

```
┌─────────────────────────────────────────────────────────────────┐
│                    MESSAGE ARRIVAL SCENARIOS                     │
├─────────────────────────────────────────────────────────────────┤
│ Scenario A: Transcript arrives BEFORE audio                      │
│   1. Store transcript in pendingTranscript                       │
│   2. Start 2-second fallback timeout                             │
│   3. When audio arrives, cancel timeout                          │
│   4. Queue transcript to show AFTER audio ends                   │
│                                                                  │
│ Scenario B: Audio arrives BEFORE transcript                      │
│   1. Store audio timing in pendingAudioById map                  │
│   2. When transcript arrives, look up timing                     │
│   3. Queue transcript to show AFTER audio ends                   │
│                                                                  │
│ Scenario C: No audio arrives within 2 seconds                    │
│   1. Fallback timeout fires                                      │
│   2. Show transcript immediately                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Timing Values:**
| Value | Duration | Purpose |
|-------|----------|---------|
| `pendingTimeout` | 2000ms | Fallback if no audio arrives for a transcript |
| `syncCheckInterval` | 30ms | How often to check if queued items should display |

### 1.2 Sequential Audio Playback

Audio chunks are scheduled sequentially using Web Audio API's precise timing:

```javascript
// Each audio chunk starts when the previous one ends
const startTime = Math.max(currentTime, this.lastAudioEndTime);
source.start(startTime);
const endTime = startTime + buffer.duration;
this.lastAudioEndTime = endTime;
```

### 1.3 Display Queue System

Transcripts are queued with a `showAtTime` timestamp (AudioContext time):

```javascript
this.displayQueue.push({
    type: 'transcript',
    speaker: msg.speaker,
    text: msg.text,
    showAtTime: audioEndTime  // Show AFTER audio finishes
});
```

The sync check interval (30ms) polls the queue and displays items when their time arrives.

### 1.4 Clinical Data Timing (Diagnoses & Questions)

**Problem:** Clinical data updates should appear after the conversation turn completes, not mid-audio.

**Solution:** Hold clinical data until turn cycle event, then delay until audio finishes.

```
┌─────────────────────────────────────────────────────────────────┐
│                 CLINICAL DATA FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│ 1. Diagnosis/Questions messages arrive                           │
│    → Store in pendingDiagnoses / pendingQuestions                │
│    → Do NOT apply to UI yet                                      │
│                                                                  │
│ 2. Turn cycle "finish cycle" event arrives                       │
│    → Calculate delay: (lastAudioEndTime - currentTime) * 1000    │
│    → Schedule setTimeout with that delay                         │
│                                                                  │
│ 3. After delay (audio finished)                                  │
│    → Apply pendingDiagnoses via onDiagnoses callback             │
│    → Apply pendingQuestions via onQuestions callback             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Clinical Dashboard Animation Timing (`ClinicalDashboard.tsx`)

### 2.1 Question Card Animations

When a question is answered, it moves from "New Inquiries" to "Answered Questions" column.

**Animation Sequence:**

```
┌─────────────────────────────────────────────────────────────────┐
│              ANSWERED QUESTION ANIMATION SEQUENCE                │
├─────────────────────────────────────────────────────────────────┤
│ T+0ms:     Question marked as completed                          │
│            → Ghost card appears with "Answered" badge            │
│            → animate-move-to-answered CSS animation starts       │
│                                                                  │
│ T+800ms:   Answered card appears in right column                 │
│            → animate-in slide-in-from-left-4 fade-in             │
│            → animationDelay: 800ms                               │
│                                                                  │
│ T+1500ms:  Ghost card cleared                                    │
│            → setMovingItemId(null)                               │
│            → setMovingItemData(null)                             │
│            → Empty space collapses                               │
│                                                                  │
│ T+2500ms:  Re-ranking animation triggers                         │
│            → 1500ms (move) + 1000ms (pause) = 2500ms             │
│            → Remaining questions swap positions                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Timing Values:**
| Value | Duration | Purpose |
|-------|----------|---------|
| Ghost card visible | 1500ms | Shows answered question moving to other column |
| Answered card delay | 800ms | Delay before card appears in answered column |
| Re-ranking delay | 2500ms | Wait for move animation + 1s pause before swapping |
| Swap animation | 800ms | Duration of rank swap animation |

### 2.2 Rank Swap Animation

When question priorities change, cards animate to their new positions:

```css
/* Swap up animation (moving to higher priority) */
@keyframes swapUp {
  0%   { transform: translateY(0); }
  50%  { transform: translateY(-100%) scale(1.02); }
  100% { transform: translateY(0); }
}

/* Swap down animation (moving to lower priority) */
@keyframes swapDown {
  0%   { transform: translateY(0); }
  50%  { transform: translateY(100%) scale(0.98); }
  100% { transform: translateY(0); }
}
```

Duration: 600ms with `cubic-bezier(0.34, 1.56, 0.64, 1)` easing.

### 2.3 Diagnosis Display Delay

Diagnoses are hidden until turn 3 to allow initial information gathering:

```javascript
const MIN_TURNS_FOR_DIAGNOSIS = 3;
const showDiagnoses = turnCount >= MIN_TURNS_FOR_DIAGNOSIS;
```

---

## 3. Complete Message Flow Timeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE TURN CYCLE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Backend sends:                                                  │
│  ├── transcript (nurse)                                          │
│  ├── audio chunks (nurse voice)                                  │
│  ├── transcript (patient)                                        │
│  ├── audio chunks (patient voice)                                │
│  ├── diagnosis update                                            │
│  ├── questions update                                            │
│  └── turn: "finish cycle"                                        │
│                                                                  │
│  Frontend processing:                                            │
│  ├── Audio chunks scheduled sequentially                         │
│  ├── Transcripts queued to show after their audio                │
│  ├── Diagnosis/Questions stored (not applied)                    │
│  └── Turn cycle triggers delayed clinical update                 │
│                                                                  │
│  User sees:                                                      │
│  ├── T+0:      Audio starts playing                              │
│  ├── T+audio:  Nurse text appears (after nurse audio ends)       │
│  ├── T+audio:  Patient text appears (after patient audio ends)   │
│  └── T+audio:  Clinical dashboard updates                        │
│                                                                  │
│  If question answered:                                           │
│  ├── T+0:      Ghost card with "Answered" badge                  │
│  ├── T+800ms:  Card appears in answered column                   │
│  ├── T+1500ms: Ghost card disappears                             │
│  └── T+2500ms: Remaining questions re-rank with animation        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Summary of All Timing Constants

| Location | Constant | Value | Purpose |
|----------|----------|-------|---------|
| websocketService | Fallback timeout | 2000ms | Show transcript if no audio arrives |
| websocketService | Sync check interval | 30ms | Poll display queue |
| ClinicalDashboard | Ghost card duration | 1500ms | Answered question move animation |
| ClinicalDashboard | Answered card delay | 800ms | Delay before showing in answered column |
| ClinicalDashboard | Re-ranking delay | 2500ms | Wait before swapping remaining questions |
| ClinicalDashboard | Swap animation clear | 800ms | Clear swap animation classes |
| ClinicalDashboard | MIN_TURNS_FOR_DIAGNOSIS | 3 | Turns before showing diagnoses |
| CSS | swapUp/swapDown | 600ms | Rank swap animation duration |

---

## 5. State Variables for Timing

### WebSocket Service State
- `pendingTranscript` - Transcript waiting for audio
- `pendingTimeout` - Fallback timer reference
- `pendingAudioById` - Map of audio timing by transcript ID
- `pendingTranscriptData` - Transcript data waiting to be queued
- `pendingDiagnoses` - Diagnosis data waiting for turn cycle
- `pendingQuestions` - Questions data waiting for turn cycle
- `lastAudioEndTime` - When the last audio chunk will finish
- `displayQueue` - Queue of items waiting to display

### Clinical Dashboard State
- `movingItemId` - ID of question currently animating to answered
- `movingItemData` - Data of the ghost card being shown
- `movingItems` - Map of items currently swapping positions
- `prevChecklistRef` - Previous checklist for detecting changes
