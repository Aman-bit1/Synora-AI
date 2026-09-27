import {
    HumanMessage,
    SystemMessage
} from "@langchain/core/messages";

import { getModel } from "../config/llmModel.js";
import { checkAgentLimit } from "../config/agentLimit.js";

import fs from "fs/promises";


export const imageAnalyzer = async (state) => {

    try {

        // ========================================
        // 1. CHECK IMAGE RATE LIMIT
        // ========================================

        await checkAgentLimit(
            state.userId,
            "image"
        );


        // ========================================
        // 2. CHECK IMAGE FILE
        // ========================================

        if (!state.file?.path) {

            throw new Error(
                "Image file is missing."
            );
        }


        // ========================================
        // 3. CHECK IMAGE TYPE
        // ========================================

        if (
            !state.file?.mimetype?.startsWith(
                "image/"
            )
        ) {

            throw new Error(
                `Invalid image type: ${
                    state.file?.mimetype || "unknown"
                }`
            );
        }


        // ========================================
        // 4. GET IMAGE MODEL
        // ========================================

        const llm =
            await getModel(
                "imageAnalyzer"
            );


        // ========================================
        // 5. READ IMAGE
        // ========================================

        const imageBuffer =
            await fs.readFile(
                state.file.path
            );


        // ========================================
        // 6. CONVERT IMAGE TO BASE64
        // ========================================

        const base64Image =
            imageBuffer.toString(
                "base64"
            );


        // ========================================
        // 7. CREATE MESSAGES
        // ========================================

        const messages = [

            new SystemMessage(`
You are SynoraAI Image Analyzer Agent.

Rules:

- Analyze only the uploaded image.
- Answer the user's question accurately.
- If text exists in the image, extract it.
- If charts or tables exist, explain them clearly.
- If something is unclear, say so.
- Use Markdown when helpful.
- Do not hallucinate information that is not present in the image.
            `),

            new HumanMessage({

                content: [

                    {
                        type: "text",

                        text:
                            state.prompt ||
                            "Analyze this image."
                    },

                    {
                        type: "image_url",

                        image_url: {

                            url:
                                `data:${state.file.mimetype};base64,${base64Image}`

                        }
                    }

                ]

            })

        ];


        // ========================================
        // 8. CALL IMAGE MODEL
        // ========================================

        console.log(
            "Sending image to image model..."
        );


        const response =
            await llm.invoke(
                messages
            );


        console.log(
            "Image analysis completed successfully."
        );


        // ========================================
        // 9. RETURN RESPONSE
        // ========================================

        return {

            ...state,

            aiResponse:
                response.content

        };


    } catch (error) {

        // ========================================
        // ERROR HANDLING
        // ========================================

        console.error(
            "===== IMAGE ANALYZER ERROR ====="
        );

        console.error(error);

        console.error(
            "MESSAGE:",
            error.message
        );

        console.error(
            "STACK:",
            error.stack
        );


        // IMPORTANT:
        // Throw the error instead of returning
        // a normal successful state.
        //
        // This allows the controller to handle
        // the failed request correctly.

        throw error;


    } finally {

        // ========================================
        // 10. DELETE TEMPORARY IMAGE
        // ========================================

        if (state.file?.path) {

            try {

                await fs.unlink(
                    state.file.path
                );

                console.log(
                    "Temporary image deleted."
                );

            } catch (error) {

                console.error(
                    "Failed to delete temporary image:",
                    error
                );

            }

        }

    }

};