// Modellerna går att byta här utan att något annat skrivs om (PLAN.md avsnitt 2).
// Perplexity söker själv och tar inte emot verktyg.
export const TJANSTER = {
  chatgpt: {
    namn: "ChatGPT",
    modellnamn: "GPT-6 Luna",
    modell: "openai/gpt-6-luna",
    sok: true,
  },
  gemini: {
    namn: "Gemini",
    modellnamn: "Gemini 3.1 Flash Lite",
    modell: "google/gemini-3.1-flash-lite",
    sok: true,
  },
  claude: {
    namn: "Claude",
    modellnamn: "Claude Haiku 5.5",
    modell: "anthropic/claude-haiku-5.5",
    sok: true,
  },
  perplexity: {
    namn: "Perplexity",
    modellnamn: "Sonar",
    modell: "perplexity/sonar",
    sok: false,
  },
} as const;

export type Tjanst = keyof typeof TJANSTER;

export const TJANST_ORDNING = Object.keys(TJANSTER) as Tjanst[];
