import axios from "axios";

export const deductCredits = async (userId, agent) => {
    try {
        if (!userId) {
            throw new Error("userId is missing");
        }

        if (!agent) {
            throw new Error("agent is missing");
        }

        const url =
            `${process.env.AUTH_SERVICE}/deduct-credits`;

        console.log("=================================");
        console.log("DEDUCT CREDITS REQUEST");
        console.log("URL:", url);
        console.log("User ID:", userId);
        console.log("Agent:", agent);
        console.log("=================================");

        const { data } = await axios.post(
            url,
            {
                userId,
                agent
            },
            {
                timeout: 10000
            }
        );

        console.log(
            "CREDIT DEDUCTION RESPONSE:",
            data
        );

        return data;

    } catch (error) {
        console.error(
            "CREDIT DEDUCTION ERROR"
        );

        console.error(
            "Status:",
            error.response?.status
        );

        console.error(
            "Response:",
            error.response?.data
        );

        console.error(
            "Message:",
            error.message
        );

        throw error;
    }
};