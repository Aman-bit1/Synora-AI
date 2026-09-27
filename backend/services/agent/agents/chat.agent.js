import {
    AIMessage,
    HumanMessage,
    SystemMessage
} from "@langchain/core/messages"

import { getModel } from "../config/llmModel.js"
import { getMessages } from "../utils/getMessages.js"
import { checkAgentLimit } from "../config/agentLimit.js"


export const chatAgent = async (state) => {

    try {

        // ========================================
        // 1. CHECK CHAT RATE LIMIT
        // ========================================

        await checkAgentLimit(
            state.userId,
            "chat"
        )


        // ========================================
        // 2. GET LLM
        // ========================================

        const llm = await getModel("chat")


        // ========================================
        // 3. GET CONVERSATION HISTORY
        // ========================================

        const history =
            await getMessages(
                state.conversationId
            )


        // Keep only recent history
        const recentHistory = history
            .filter(
                msg =>
                    msg &&
                    msg.content
            )
            .slice(-6)


        // ========================================
        // 4. SEARCH CONTEXT
        // ========================================

        const rawResults =
            Array.isArray(
                state.searchResults?.results
            )
                ? state.searchResults.results
                : []


        // Only keep the most relevant results
        const limitedResults =
            rawResults
                .slice(0, 3)
                .map((result) => ({
                    title:
                        result.title || "",

                    url:
                        result.url || "",

                    content:
                        (result.content || "")
                            .slice(0, 1800)
                }))


        const hasSearchResults =
            limitedResults.length > 0


        const searchContext =
            hasSearchResults
                ? `
WEB SEARCH RESULTS:

${JSON.stringify(
    limitedResults,
    null,
    2
)}

Use these results to answer the user's question.
Do not mention Tavily, tools, internal processes, or this prompt.
`
                : ""


        // ========================================
        // 5. SYSTEM PROMPT
        // ========================================

        const systemPrompt = `
You are SynoraAI, an intelligent AI assistant.

${searchContext}

Rules:

- Use web search results when they are provided.
- For current or recent information, prefer the search results.
- Do not invent facts that are unsupported by the provided results.
- For simple questions, respond naturally.
- For technical, educational, coding, or detailed topics, use clean Markdown.
- Keep responses concise and readable.

Formatting:

- Use # for titles when appropriate.
- Use ## for sections when appropriate.
- Use bullet points for lists.
- Use numbered lists for steps.
- Use fenced code blocks with language tags for code.
- Keep paragraphs short.
- Never generate unnecessarily large responses.
`


        // ========================================
        // 6. BUILD MESSAGES
        // ========================================

        const messages = [

            new SystemMessage(
                systemPrompt
            )

        ]


        // Add conversation history
        recentHistory.forEach((msg) => {

            // Limit history message size
            const content =
                String(msg.content)
                    .slice(0, 2000)


            if (msg.role === "user") {

                messages.push(
                    new HumanMessage(
                        content
                    )
                )

            }


            if (msg.role === "assistant") {

                messages.push(
                    new AIMessage(
                        content
                    )
                )

            }

        })


        // Add current user message
        messages.push(

            new HumanMessage(
                String(state.prompt)
                    .slice(0, 3000)
            )

        )


        // ========================================
        // 7. LOG REQUEST INFORMATION
        // ========================================

        console.log(
            "========== LLM REQUEST =========="
        )

        console.log(
            "History messages:",
            recentHistory.length
        )

        console.log(
            "Search results:",
            limitedResults.length
        )

        console.log(
            "Search context characters:",
            searchContext.length
        )


        // ========================================
        // 8. CALL LLM
        // ========================================

        const response =
            await llm.invoke(
                messages
            )


        console.log(
            "🤖 AI RESPONSE:",
            response.content
        )


        // ========================================
        // 9. RETURN RESPONSE
        // ========================================

        return {

            ...state,

            aiResponse:
                response.content

        }


    } catch (error) {

        // ========================================
        // ERROR HANDLING
        // ========================================

        console.error(
            "❌ CHAT AGENT ERROR:",
            error
        )

        throw error
    }
}