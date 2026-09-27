import api from "../../utils/axios";

export const verifyPayment = async (payload) => {
    try {
        const { data } = await api.post(
            "/api/billing/verify",
            payload
        );

        console.log("VERIFY PAYMENT RESPONSE:", data);

        return data;
    } catch (error) {
        console.error(
            "VERIFY PAYMENT ERROR:",
            error.response?.status,
            error.response?.data || error.message
        );

        throw error;
    }
};