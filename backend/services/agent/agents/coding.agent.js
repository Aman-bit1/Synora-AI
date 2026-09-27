import { getModel } from "../config/llmModel.js";
import { checkAgentLimit } from "../config/agentLimit.js";


export const codingAgent = async (state) => {

    try {

        // ========================================
        // 1. CHECK CODING RATE LIMIT
        // ========================================

        await checkAgentLimit(
            state.userId,
            "coding"
        );


        // ========================================
        // 2. GET MODELS
        // ========================================

        const intentLlm = await getModel("intent");
        const llm = await getModel("coding");


        // ========================================
        // 3. DETECT USER INTENT
        // ========================================

        const intentRes = await intentLlm.invoke(`
You are an intent classifier.

Return ONLY one of these values.

CODE_GENERATION
CODE_REVIEW
CODE_EXPLANATION
DEBUGGING
OPTIMIZATION
CONVERSION
DOCUMENTATION

User Request:
${state.prompt}
`);


        const intent =
            intentRes.content
                .trim();


        // ========================================
        // 4. CODE GENERATION
        // ========================================

        if (intent === "CODE_GENERATION") {

            const prompt = `
You are CortexAI Coding Agent.

Generate the requested project.

Default stack:
- HTML
- CSS
- JavaScript

Use React / Next.js / Vue ONLY if explicitly requested.

Rules:

- Responsive
- Modern UI
- CSS Variables
- Flexbox/Grid
- Smooth Scroll
- Hover Effects
- Beautiful spacing
- Single page unless user asks otherwise.

Return ONLY valid JSON.

Schema:

{
    "files": [
        {
            "name": "index.html",
            "content": "..."
        },
        {
            "name": "style.css",
            "content": "..."
        },
        {
            "name": "script.js",
            "content": "..."
        }
    ]
}

Rules:

- Output must start with {
- Output must end with }
- No markdown
- No explanation
- No code fences
- No extra text
- Never mention intent

User Request:
${state.prompt}
`;


            // ========================================
            // 5. GENERATE CODE
            // ========================================

            const res =
                await llm.invoke(prompt);


            // ========================================
            // 6. CLEAN LLM RESPONSE
            // ========================================

            let content =
                res.content.trim();


            content = content
                .replace(
                    /^```json\s*/i,
                    ""
                )
                .replace(
                    /^```\s*/i,
                    ""
                )
                .replace(
                    /\s*```$/i,
                    ""
                )
                .trim();


            // ========================================
            // 7. FIND JSON
            // ========================================

            const jsonStart =
                content.indexOf("{");

            const jsonEnd =
                content.lastIndexOf("}");


            if (
                jsonStart === -1 ||
                jsonEnd === -1 ||
                jsonEnd <= jsonStart
            ) {

                throw new Error(
                    "Coding agent did not return valid JSON"
                );
            }


            // ========================================
            // 8. PARSE JSON
            // ========================================

            const data =
                JSON.parse(
                    content.slice(
                        jsonStart,
                        jsonEnd + 1
                    )
                );


            // ========================================
            // 9. RETURN GENERATED PROJECT
            // ========================================

            return {

                ...state,

                aiResponse:
                    "Code Generated Successfully.",

                artifacts: [
                    {
                        id: Date.now(),
                        type: "Project",
                        files:
                            data.files || []
                    }
                ]

            };
        }


        // ========================================
        // 10. OTHER CODING TASKS
        // ========================================

        const res =
            await llm.invoke(`
The user's request is:

${state.prompt}

The detected intent is:

${intent}

Return Markdown only.

Never generate project files.

Use headings like:

# Overview

## Explanation

## Problems

## Improvements

## Best Practices

## Optimized Code (if needed)

User Request:

${state.prompt}
`);


        const data =
            res.content;


        // ========================================
        // 11. RETURN CODING RESPONSE
        // ========================================

        return {

            ...state,

            aiResponse: data,

            artifacts: []

        };


    } catch (error) {

        // ========================================
        // ERROR HANDLING
        // ========================================

        console.error(
            "❌ CODING AGENT ERROR:",
            error
        );


        throw error;
    }
};