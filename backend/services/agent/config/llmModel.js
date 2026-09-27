import "dotenv/config"

import { ChatGroq } from "@langchain/groq"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatOpenRouter } from "@langchain/openrouter";
const groq = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2
})

const gemini = new ChatGoogleGenerativeAI({
    model: "gemini-3.1-flash-lite",
    temperature: 0,
    maxRetries: 2
})


const openrouter = new ChatOpenRouter({
  model: "deepseek/deepseek-chat",
  temperature: 0,
  maxTokens: 2500,
  // other params...
});

export const getModel = (agent) => {
    switch (agent) {
        case "chat":
            return groq

        case "search":
            return groq

        case "coding":
            return openrouter
        case "imageAnalyzer":
            return gemini
        default:
            return groq
    }
}
