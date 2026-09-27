import axios from "axios";
import { graph } from "../graph/graph.js";
import { addMessage } from "../config/memory.js";
import { deductCredits } from "../utils/deductCredits.js";

export const agent = async (req, res) => {
    try {
        const {
            prompt,
            conversationId,
            agent
        } = req.body;

        const file = req.file;
        const userId = req.headers["x-user-id"];

        console.log("===== AGENT REQUEST =====");
        console.log("PROMPT:", prompt);
        console.log("CONVERSATION ID:", conversationId);
        console.log("REQUESTED AGENT:", agent);
        console.log("USER ID:", userId);

        console.log(
            "FILE:",
            file
                ? {
                    fieldname: file.fieldname,
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    path: file.path
                }
                : null
        );

        console.log("=========================");

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User ID missing"
            });
        }

        if (!conversationId) {
            return res.status(400).json({
                success: false,
                message: "Conversation ID missing"
            });
        }

        if (!prompt && !file) {
            return res.status(400).json({
                success: false,
                message: "Message or file is required"
            });
        }

        // Content that will be stored for the user message
        const userContent =
            prompt ||
            `Uploaded file: ${file?.originalname || "file"}`;

        // =====================================================
        // SAVE USER MESSAGE
        // =====================================================

        await addMessage(
            conversationId,
            "user",
            userContent
        );

        await axios.post(
            `${process.env.CHAT_SERVICE}/save-message`,
            {
                conversationId,
                role: "user",
                content: userContent
            }
        );

        console.log("USER MESSAGE SAVED");

        // =====================================================
        // RUN LANGGRAPH
        // =====================================================

        const result = await graph.invoke({
            prompt: prompt || "",
            conversationId,
            agent,
            userId,
            file
        });

        console.log("GRAPH RESULT:", result);
        console.log("GRAPH AGENT:", result?.agent);
        console.log("GRAPH RESPONSE:", result?.aiResponse);
        console.log("GRAPH IMAGES:", result?.images);

        const response = result?.aiResponse || "";
        const images = result?.images || [];

        // Agent actually used by LangGraph
        const usedAgent = result?.agent || agent;

        console.log("ACTUAL AGENT:", usedAgent);

        if (!usedAgent) {
            return res.status(500).json({
                success: false,
                message: "Unable to determine agent"
            });
        }

        // =====================================================
        // MAP INTERNAL AGENT -> CREDIT AGENT
        // =====================================================

        const creditAgentMap = {
            chat: "chat",
            search: "search",
            coding: "coding",
            pdf: "pdf",
            ppt: "ppt",
            vision: "vision",

            // Internal agents
            pdfRag: "pdf",
            imageAnalyzer: "vision"
        };

        const creditAgent = creditAgentMap[usedAgent];

        if (!creditAgent) {
            return res.status(500).json({
                success: false,
                message: `Unsupported credit agent: ${usedAgent}`
            });
        }

        console.log("CREDIT AGENT:", creditAgent);

        // =====================================================
        // DEDUCT CREDITS
        // =====================================================

        const creditResult = await deductCredits(
            userId,
            creditAgent
        );

        console.log(
            "CREDIT DEDUCTION RESULT:",
            creditResult
        );

        // =====================================================
        // SAVE AI MESSAGE
        // =====================================================

        await addMessage(
            conversationId,
            "assistant",
            response
        );

        await axios.post(
            `${process.env.CHAT_SERVICE}/save-message`,
            {
                conversationId,
                role: "assistant",
                content: response,
                images,
                artifacts: result?.artifacts || []
            }
        );

        console.log("AI MESSAGE SAVED");

        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({
            success: true,

            answer: response,

            images,

            artifacts: result?.artifacts || [],

            // Actual LangGraph agent
            agent: usedAgent,

            // Agent category used for billing
            creditAgent,

            deducted: creditResult?.deducted || 0,

            user: creditResult?.user || null
        });

    } catch (error) {
        console.error("===== AGENT ERROR =====");
        console.error(error);
        console.error("ERROR MESSAGE:", error.message);
        console.error("ERROR STACK:", error.stack);

        console.error(
            "ERROR RESPONSE:",
            error.response?.data
        );

        return res.status(500).json({
            success: false,
            message: "agent error",
            error: error.message
        });
    }
};