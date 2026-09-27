import fs from "fs/promises";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { getModel } from "../config/llmModel.js";
import {
    HumanMessage,
    SystemMessage
} from "@langchain/core/messages";

import { getVectorStore } from "../config/vectorDb.js";
import { checkAgentLimit } from "../config/agentLimit.js";


export const pdfRag = async (state) => {

    let parser = null;

    try {

        // ========================================
        // 1. VALIDATE PDF
        // ========================================

        if (!state.file?.path) {

            throw new Error(
                "PDF file is missing."
            );
        }


        if (!state.prompt?.trim()) {

            throw new Error(
                "User prompt is missing."
            );
        }


        // ========================================
        // 2. CHECK PDF RATE LIMIT
        // ========================================

        await checkAgentLimit(
            state.userId,
            "pdf"
        );


        // ========================================
        // 3. READ UPLOADED PDF
        // ========================================

        const buffer =
            await fs.readFile(
                state.file.path
            );


        // ========================================
        // 4. PARSE PDF
        // ========================================

        parser = new PDFParse({
            data: buffer
        });


        const result =
            await parser.getText();


        const text =
            result.text || "";


        if (!text.trim()) {

            throw new Error(
                "No readable text found in the PDF."
            );
        }


        // ========================================
        // 5. SPLIT PDF INTO CHUNKS
        // ========================================

        const splitter =
            new RecursiveCharacterTextSplitter({

                chunkSize: 1000,

                chunkOverlap: 200

            });


        const docs =
            await splitter.createDocuments([
                text
            ]);


        // ========================================
        // 6. CREATE UNIQUE COLLECTION
        // ========================================

        const collectionName =
            `pdf-${Date.now()}`;


        // ========================================
        // 7. STORE CHUNKS IN QDRANT
        // ========================================

        const store =
            await getVectorStore(
                docs,
                collectionName
            );


        // ========================================
        // 8. SEARCH RELEVANT CHUNKS
        // ========================================

        const relevantDocs =
            await store.similaritySearch(
                state.prompt,
                5
            );


        // ========================================
        // 9. CREATE CONTEXT
        // ========================================

        const context =
            relevantDocs
                .map(
                    (doc) =>
                        doc.pageContent
                )
                .join("\n\n");


        // ========================================
        // 10. GET LLM
        // ========================================

        const llm =
            await getModel("pdf-rag");


        // ========================================
        // 11. BUILD MESSAGES
        // ========================================

        const messages = [

            new SystemMessage(`
You are CortexAI PDF Assistant.

Rules:

- Answer only using information from the uploaded PDF.
- Do not use outside knowledge.
- Do not invent or assume information.
- If the answer cannot be found in the provided context, say:

"I couldn't find this information in the uploaded PDF."

- Use Markdown formatting when useful.
            `),

            new HumanMessage(`
Context from the uploaded PDF:

${context}

User question:

${state.prompt}
            `)

        ];


        // ========================================
        // 12. ASK LLM
        // ========================================

        const response =
            await llm.invoke(
                messages
            );


        // ========================================
        // 13. RETURN RESPONSE
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
            "PDF RAG Error:",
            error
        );


        // IMPORTANT:
        // Throw the error so the controller
        // can properly handle rate-limit errors
        // and failed requests.

        throw error;


    } finally {

        // ========================================
        // 14. DESTROY PDF PARSER
        // ========================================

        if (parser) {

            try {

                await parser.destroy();

            } catch (error) {

                console.error(
                    "Failed to destroy PDF parser:",
                    error
                );

            }

        }


        // ========================================
        // 15. DELETE TEMPORARY PDF
        // ========================================

        if (state.file?.path) {

            try {

                await fs.unlink(
                    state.file.path
                );

                console.log(
                    "Temporary PDF deleted."
                );

            } catch (error) {

                console.error(
                    "Failed to delete temporary PDF:",
                    error
                );

            }

        }

    }
};