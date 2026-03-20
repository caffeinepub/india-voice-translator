import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeftRight,
  ChevronDown,
  Globe,
  Headphones,
  Languages,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "\u0939\u093f\u0928\u094d\u0926\u0940" },
  { code: "bn", name: "Bengali", native: "\u09ac\u09be\u0982\u09b2\u09be" },
  {
    code: "te",
    name: "Telugu",
    native: "\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41",
  },
  { code: "mr", name: "Marathi", native: "\u092e\u0930\u093e\u0920\u0940" },
  { code: "ta", name: "Tamil", native: "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd" },
  { code: "ur", name: "Urdu", native: "\u0627\u0631\u062f\u0648" },
  {
    code: "gu",
    name: "Gujarati",
    native: "\u0a97\u0ac1\u0a9c\u0ab0\u0abe\u0aa4\u0ac0",
  },
  { code: "kn", name: "Kannada", native: "\u0c95\u0ca8\u0ccd\u0ca8\u0ca1" },
  { code: "or", name: "Odia", native: "\u0b13\u0b21\u0b3c\u0b3f\u0b06" },
  {
    code: "pa",
    name: "Punjabi",
    native: "\u0a2a\u0a70\u0a1c\u0a3e\u0a2c\u0a40",
  },
  {
    code: "ml",
    name: "Malayalam",
    native: "\u0d2e\u0d32\u0d2f\u0d3e\u0d33\u0d02",
  },
  {
    code: "as",
    name: "Assamese",
    native: "\u0985\u09b8\u09ae\u09c0\u09af\u09bc\u09be",
  },
  {
    code: "mai",
    name: "Maithili",
    native: "\u092e\u0948\u0925\u093f\u0932\u0940",
  },
  {
    code: "sa",
    name: "Sanskrit",
    native: "\u0938\u0902\u0938\u094d\u0915\u0943\u0924\u092e\u094d",
  },
  {
    code: "kok",
    name: "Konkani",
    native: "\u0915\u094b\u0902\u0915\u0923\u0940",
  },
  { code: "sd", name: "Sindhi", native: "\u0633\u0646\u068c\u064a" },
  {
    code: "ne",
    name: "Nepali",
    native: "\u0928\u0947\u092a\u093e\u0932\u0940",
  },
  { code: "si", name: "Sinhala", native: "\u0dc3\u0dd2\u0d82\u0dc4\u0dbd" },
  { code: "doi", name: "Dogri", native: "\u0921\u094b\u0917\u0930\u0940" },
];

type SpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (e: SpeechRecognitionEvent) => void;
  onerror: () => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

const hasSpeechRecognition =
  typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

const hasSpeechSynthesis =
  typeof window !== "undefined" && "speechSynthesis" in window;

function LanguageSelect({
  value,
  onChange,
  label,
  dataOcid,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  dataOcid: string;
}) {
  const selected = LANGUAGES.find((l) => l.code === value);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          data-ocid={dataOcid}
          className="bg-white border-teal-200 focus:ring-teal-500 h-11 text-sm font-medium"
        >
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <span className="text-base">{selected?.native}</span>
            <span className="text-muted-foreground text-xs hidden sm:inline">
              — {selected?.name}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="font-medium">{lang.native}</span>
              <span className="ml-2 text-muted-foreground text-xs">
                {lang.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function TranslatorCard() {
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("hi");
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const translate = useCallback(
    async (text: string, src: string, tgt: string) => {
      if (!text.trim()) {
        setTranslatedText("");
        return;
      }
      setIsTranslating(true);
      setError("");
      try {
        const res = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${src}|${tgt}`,
        );
        const data = await res.json();
        if (data.responseStatus === 200) {
          setTranslatedText(data.responseData.translatedText);
        } else {
          setError("Translation failed. Please try again.");
        }
      } catch {
        setError("Network error. Please check your connection.");
      } finally {
        setIsTranslating(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (inputText.trim()) {
      debounceRef.current = setTimeout(() => {
        translate(inputText, sourceLang, targetLang);
      }, 800);
    } else {
      setTranslatedText("");
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputText, sourceLang, targetLang, translate]);

  const handleSwap = () => {
    const prevSource = sourceLang;
    const prevTarget = targetLang;
    const prevInput = inputText;
    const prevTranslated = translatedText;
    setSourceLang(prevTarget);
    setTargetLang(prevSource);
    setInputText(prevTranslated);
    setTranslatedText(prevInput);
  };

  const handleMic = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = sourceLang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ");
      setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const handleSpeak = () => {
    if (!hasSpeechSynthesis || !translatedText) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(translatedText);
    utterance.lang = targetLang;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 md:p-8 w-full max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
        <div className="flex-1">
          <LanguageSelect
            value={sourceLang}
            onChange={setSourceLang}
            label="From"
            dataOcid="translator.select"
          />
        </div>
        <button
          type="button"
          data-ocid="translator.toggle"
          onClick={handleSwap}
          className="self-center p-2 rounded-full border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-600 transition-colors"
          aria-label="Swap languages"
        >
          <ArrowLeftRight className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <LanguageSelect
            value={targetLang}
            onChange={setTargetLang}
            label="To"
            dataOcid="translator.select"
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input panel */}
        <div className="relative rounded-xl border border-teal-100 bg-background p-4">
          <Textarea
            data-ocid="translator.textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or Speak\u2026"
            className="min-h-36 resize-none border-0 bg-transparent p-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
          />
          <div className="mt-3 flex items-center justify-between">
            {!hasSpeechRecognition ? (
              <span className="text-xs text-muted-foreground">
                Voice input not supported in this browser
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                {isRecording ? (
                  <span className="flex items-center gap-1 text-orange-500 font-medium">
                    <span className="inline-block h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                    Recording\u2026
                  </span>
                ) : (
                  "Tap to Speak"
                )}
              </span>
            )}
            <button
              type="button"
              data-ocid="translator.button"
              onClick={handleMic}
              disabled={!hasSpeechRecognition}
              className={`w-11 h-11 rounded-full flex items-center justify-center text-white transition-all btn-orange disabled:opacity-40 ${
                isRecording ? "pulse-mic" : ""
              }`}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Output panel */}
        <div className="relative rounded-xl bg-teal-50 border border-teal-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
              Translation:
            </span>
            {hasSpeechSynthesis && translatedText && (
              <button
                type="button"
                data-ocid="translator.secondary_button"
                onClick={handleSpeak}
                className={`p-1.5 rounded-full text-teal-600 hover:bg-teal-100 transition-colors ${
                  isSpeaking ? "bg-teal-100" : ""
                }`}
                aria-label="Read translation aloud"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="min-h-36 text-base">
            <AnimatePresence mode="wait">
              {isTranslating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  data-ocid="translator.loading_state"
                  className="flex items-center gap-2 text-teal-500 mt-4"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Translating\u2026</span>
                </motion.div>
              ) : error ? (
                <motion.p
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  data-ocid="translator.error_state"
                  className="text-destructive text-sm mt-2"
                >
                  {error}
                </motion.p>
              ) : translatedText ? (
                <motion.p
                  key="result"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-foreground leading-relaxed"
                >
                  {translatedText}
                </motion.p>
              ) : (
                <p className="text-muted-foreground/50 text-sm mt-2">
                  Translation will appear here\u2026
                </p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <Button
          data-ocid="translator.primary_button"
          onClick={() => translate(inputText, sourceLang, targetLang)}
          disabled={!inputText.trim() || isTranslating}
          className="btn-orange border-0 px-8 font-semibold"
        >
          {isTranslating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Translate Now
        </Button>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Mic,
    title: "Voice Input",
    description:
      "Speak directly in your language. Our app captures your voice and converts it to text instantly.",
  },
  {
    icon: Globe,
    title: "20+ Languages",
    description:
      "Supports all major Indian languages including Hindi, Tamil, Bengali, Telugu, Kannada, and more.",
  },
  {
    icon: Headphones,
    title: "Text-to-Speech",
    description:
      "Listen to translated text read aloud with natural pronunciation in the target language.",
  },
  {
    icon: Zap,
    title: "Instant Translation",
    description:
      "Get translations as you type with smart debouncing and lightning-fast API responses.",
  },
];

const TESTIMONIAL = {
  name: "Priya Sharma",
  role: "Teacher, Bengaluru",
  stars: 5,
  quote:
    "BhashaSetu has been a game-changer for my classroom. I can now communicate easily with students from different states. The voice input feature is incredibly accurate for Kannada!",
};

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-body">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-teal-100 shadow-xs">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
              <Languages className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-teal-700 tracking-tight">
              BhashaSetu
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-foreground/70">
            {["home", "translator", "features", "about"].map((id) => (
              <button
                type="button"
                key={id}
                data-ocid="nav.link"
                onClick={() => scrollTo(id)}
                className="capitalize hover:text-teal-600 transition-colors"
              >
                {id}
              </button>
            ))}
            <Button
              data-ocid="nav.primary_button"
              onClick={() => scrollTo("translator")}
              className="btn-orange border-0 font-semibold text-sm h-9 px-4"
            >
              Try Now
            </Button>
          </nav>

          <button
            type="button"
            data-ocid="nav.toggle"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-md text-teal-700"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-t border-teal-100 overflow-hidden"
            >
              <div className="flex flex-col p-4 gap-3 text-sm font-medium">
                {["home", "translator", "features", "about"].map((id) => (
                  <button
                    type="button"
                    key={id}
                    data-ocid="nav.link"
                    onClick={() => scrollTo(id)}
                    className="text-left capitalize hover:text-teal-600 transition-colors py-1"
                  >
                    {id}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section
          id="home"
          className="hero-gradient relative overflow-hidden py-16 md:py-24"
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-2/5 hidden lg:block"
            style={{
              background: "oklch(0.72 0.17 55)",
              clipPath: "polygon(18% 0, 100% 0, 100% 100%, 0% 100%)",
              opacity: 0.15,
            }}
          />
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="text-white"
              >
                <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                  <Languages className="h-4 w-4" />
                  20+ Indian Languages
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-5">
                  Break Language
                  <br />
                  <span style={{ color: "oklch(0.78 0.17 55)" }}>Barriers</span>
                </h1>
                <p className="text-white/80 text-lg mb-8 max-w-md leading-relaxed">
                  Speak, type, and translate across all major Indian languages
                  instantly. BhashaSetu bridges communication gaps with voice
                  input and text-to-speech.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    data-ocid="hero.primary_button"
                    onClick={() => scrollTo("translator")}
                    className="btn-orange border-0 font-bold h-12 px-8 text-base"
                  >
                    Start Translating
                  </Button>
                  <Button
                    data-ocid="hero.secondary_button"
                    onClick={() => scrollTo("features")}
                    variant="outline"
                    className="border-white/40 text-white bg-white/10 hover:bg-white/20 font-semibold h-12 px-6 text-base"
                  >
                    Learn More
                  </Button>
                </div>
                <div className="mt-10 flex flex-wrap gap-8">
                  {[
                    { num: "20+", label: "Languages" },
                    { num: "Free", label: "Forever" },
                    { num: "Voice", label: "Input" },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="text-2xl font-display font-bold text-white">
                        {s.num}
                      </div>
                      <div className="text-white/60 text-sm">{s.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
                className="flex justify-center lg:justify-end"
              >
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-3xl"
                    style={{
                      background:
                        "radial-gradient(ellipse at center, oklch(0.72 0.17 55 / 0.3) 0%, transparent 70%)",
                    }}
                  />
                  <img
                    src="/assets/generated/hero-people.dim_600x700.png"
                    alt="People using BhashaSetu on their phones"
                    className="relative w-72 md:w-96 object-cover rounded-2xl"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Translator */}
        <section id="translator" className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-10"
            >
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                Translator App Interface
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Select your languages, type or speak your text, and get an
                instant translation with audio playback.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <TranslatorCard />
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="py-16 md:py-20"
          style={{ background: "oklch(0.96 0.012 195)" }}
        >
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                Key Features
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Everything you need for seamless multilingual communication
              </p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  data-ocid={`features.card.${i + 1}`}
                  className="bg-white rounded-2xl p-6 shadow-xs hover:shadow-card transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4">
                    <f.icon className="h-6 w-6 text-teal-500" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-foreground mb-2">
                    {f.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {f.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                Why BhashaSetu?
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Real stories from people bridging language gaps across India
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div
                  className="rounded-2xl p-8 text-white text-center"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.42 0.09 193) 0%, oklch(0.54 0.092 191) 100%)",
                  }}
                >
                  <Languages className="h-16 w-16 mx-auto mb-4 opacity-80" />
                  <div className="font-display font-bold text-2xl mb-2">
                    India's Bridge
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Connecting 1.4 billion people across 22 official languages
                    and hundreds of dialects.
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {[
                      "\u0939\u093f\u0928\u094d\u0926\u0940",
                      "\u09ac\u09be\u0982\u09b2\u09be",
                      "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd",
                      "\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41",
                      "\u0a2a\u0a70\u0a1c\u0a3e\u0a2c\u0a40",
                      "\u0d2e\u0d32\u0d2f\u0d3e\u0d33\u0d02",
                    ].map((script) => (
                      <div
                        key={script}
                        className="bg-white/15 rounded-lg py-2 text-sm font-medium"
                      >
                        {script}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-2xl p-7 shadow-card"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from(
                    { length: TESTIMONIAL.stars },
                    (_, i) => i + 1,
                  ).map((starNum) => (
                    <svg
                      key={starNum}
                      className="h-5 w-5 fill-orange-500 text-orange-500"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-foreground text-base leading-relaxed mb-5 italic">
                  \u201c{TESTIMONIAL.quote}\u201d
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center font-bold text-teal-700">
                    {TESTIMONIAL.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">
                      {TESTIMONIAL.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {TESTIMONIAL.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer-bg text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
                  <Languages className="h-5 w-5 text-white" />
                </div>
                <span className="font-display font-bold text-lg">
                  BhashaSetu
                </span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                Bridging language barriers across India's diverse linguistic
                landscape.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-white/80 mb-4">
                Links
              </h4>
              <ul className="space-y-2 text-sm text-white/60">
                {["Home", "Translator", "Features", "About"].map((l) => (
                  <li key={l}>
                    <button
                      type="button"
                      data-ocid="footer.link"
                      onClick={() => scrollTo(l.toLowerCase())}
                      className="hover:text-white transition-colors"
                    >
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-white/80 mb-4">
                Languages
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGES.slice(0, 8).map((l) => (
                  <span
                    key={l.code}
                    className="text-xs bg-white/10 rounded-md px-2 py-1 text-white/70"
                  >
                    {l.native}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-white/80 mb-4">
                Contact
              </h4>
              <div className="space-y-2 text-sm text-white/60">
                <p>hello@bhashasetu.in</p>
                <p>Powered by MyMemory API</p>
                <p>Open Source \u2014 Free to Use</p>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
            <span>
              \u00a9 {new Date().getFullYear()} BhashaSetu. All rights reserved.
            </span>
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/70 transition-colors"
            >
              Built with \u2764\ufe0f using caffeine.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
