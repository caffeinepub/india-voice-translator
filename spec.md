# India Voice Translator

## Current State
New project — no existing application logic.

## Requested Changes (Diff)

### Add
- Language selector dropdowns (source + target) supporting 16+ Indian languages plus English, showing native script names
- Text input area for typing in source language
- Microphone/record button using browser Web Speech API (SpeechRecognition)
- Translation feature via backend HTTP outcall to MyMemory free translation API
- Translated text display area
- Text-to-speech playback button using browser SpeechSynthesis API
- Swap source/target language button
- Mobile-friendly, clean UI

### Modify
N/A — new project

### Remove
N/A

## Implementation Plan
1. Select `http-outcalls` component for backend translation API calls
2. Generate Motoko backend with `translate` query: accepts text, sourceLang code, targetLang code; calls MyMemory API (https://api.mymemory.translated.net/get?q=TEXT&langpair=SOURCE|TARGET); returns translated string
3. Frontend:
   - Language list with codes + native names (hi, bn, te, mr, ta, ur, gu, kn, or, pa, ml, as, mai, sa, en, etc.)
   - Two `<select>` dropdowns for source/target with native script labels
   - Textarea for source text input
   - Mic button: uses SpeechRecognition API (prefixed for Chrome), sets source text from speech
   - Translate button: calls backend translate actor
   - Display translated text in read-only area
   - Speaker button: calls SpeechSynthesis with target language to read out translated text
   - Swap button between language selectors
