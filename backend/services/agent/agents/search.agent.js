import { searchTool } from "../config/tavily.js";
import { checkAgentLimit } from "../config/agentLimit.js";


export const searchAgent = async (state) => {

    console.log("🚀 SEARCH AGENT STARTED");
    console.log("STATE:", state);
    console.log("QUERY:", state.prompt);

    try {

        // ========================================
        // 1. VALIDATE SEARCH QUERY
        // ========================================

        if (
            !state.prompt ||
            typeof state.prompt !== "string" ||
            !state.prompt.trim()
        ) {

            throw new Error(
                `Invalid search query: ${state.prompt}`
            );
        }


        // ========================================
        // 2. CHECK SEARCH RATE LIMIT
        // ========================================

        await checkAgentLimit(
            state.userId,
            "search"
        );


        // ========================================
        // 3. CALL TAVILY
        // ========================================

        const results =
            await searchTool.invoke({
                query: state.prompt.trim()
            });


        console.log(
            "🔥 TAVILY RESULTS:"
        );

        console.dir(
            results,
            { depth: null }
        );


        // ========================================
        // 4. RETURN SEARCH RESULTS
        // ========================================

        return {

            ...state,

            searchResults: results,

            searchContext: results,

            images:
                results?.images || []

        };


    } catch (error) {

        // ========================================
        // ERROR HANDLING
        // ========================================

        console.error(
            "❌ TAVILY SEARCH ERROR:"
        );

        console.error(error);


        // IMPORTANT:
        // Don't swallow rate-limit errors.
        // Pass them to the controller.

        throw error;
    }
};