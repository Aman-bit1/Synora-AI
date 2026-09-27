import api from "../../utils/axios";

export const createOrder = async (plan) => {
    try {
        const { data } = await api.post(
            "/api/billing/create",
            { plan }
        );

        console.log("CREATE ORDER RESPONSE:", data);

        return data;
    } catch (error) {
        console.error(
            "CREATE ORDER ERROR:",
            error.response?.status,
            error.response?.data || error.message
        );

        throw error;
    }
};