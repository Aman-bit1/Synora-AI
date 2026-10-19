
import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddings } from "./embeddings.js";
import "dotenv/config";

const qdrantUrl = process.env.QDRANT_URL?.trim();
const qdrantApiKey = process.env.QDRANT_API_KEY?.trim();

if (!qdrantUrl || !qdrantApiKey) {
    throw new Error("Qdrant configuration is missing");
}

export const getVectorStore = async (docs, collectionName) => {

    // STEP 1: Check Qdrant connectivity
    try {
        console.log("[PDF] Connecting to Qdrant...");

        const response = await fetch(
            `${qdrantUrl.replace(/\/$/, "")}/collections`,
            {
                headers: {
                    "api-key": qdrantApiKey
                },
                signal: AbortSignal.timeout(15000)
            }
        );

        if (!response.ok) {
            throw new Error(
                `Qdrant returned HTTP ${response.status}`
            );
        }

        console.log("[PDF] QDRANT CONNECTION SUCCESS");

    } catch (error) {
        console.error("[PDF] QDRANT CONNECTION FAILED", {
            message: error.message,
            cause: error.cause?.message,
            code: error.cause?.code
        });

        throw error;
    }

    // STEP 2: Check embedding service
    try {
        console.log("[PDF] Testing embeddings...");

        const vector = await embeddings.embedQuery(
            "Connection test"
        );

        console.log(
            "[PDF] EMBEDDINGS SUCCESS:",
            vector.length
        );

    } catch (error) {
        console.error("[PDF] EMBEDDINGS FAILED", {
            message: error.message,
            cause: error.cause?.message,
            code: error.cause?.code
        });

        throw error;
    }

    // STEP 3: Create vector store
    try {
        console.log("[PDF] Creating vector store...");

        const store = await QdrantVectorStore.fromDocuments(
            docs,
            embeddings,
            {
                url: qdrantUrl,
                apiKey: qdrantApiKey,
                collectionName
            }
        );

        console.log("[PDF] VECTOR STORE SUCCESS");

        return store;

    } catch (error) {
        console.error("[PDF] VECTOR STORE FAILED", {
            message: error.message,
            cause: error.cause?.message,
            code: error.cause?.code,
            stack: error.stack
        });

        throw error;
    }
};
