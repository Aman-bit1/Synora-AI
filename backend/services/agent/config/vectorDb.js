import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddings } from "./embeddings.js";
import dotenv from "dotenv";

dotenv.config();

const qdrantUrl = process.env.QDRANT_URL;
const qdrantApiKey = process.env.QDRANT_API_KEY;

if (!qdrantUrl) {
    throw new Error("QDRANT_URL is missing from .env");
}

if (!qdrantApiKey) {
    throw new Error("QDRANT_API_KEY is missing from .env");
}

export const getVectorStore = async (docs, collectionName) => {
    return await QdrantVectorStore.fromDocuments(
        docs,
        embeddings,
        {
            url: qdrantUrl,
            apiKey: qdrantApiKey,
            collectionName
        }
    );
};