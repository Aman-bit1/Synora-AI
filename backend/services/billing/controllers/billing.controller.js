import { PLANS } from "../config/Plans.js";
import razorpay from "../config/razorpay.js";
import Payment from "../models/payment.model.js";
import crypto from "crypto";
import axios from "axios";

export const createOrder = async (req, res) => {
    try {
        const { plan } = req.body;
        const userId = req.headers["x-user-id"];

        console.log("CREATE ORDER BODY:", req.body);
        console.log("USER ID:", userId);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User ID missing"
            });
        }

        const selectedPlan = PLANS[plan];

        if (!selectedPlan) {
            return res.status(404).json({
                success: false,
                message: "Plan not found",
                receivedPlan: plan,
                availablePlans: Object.keys(PLANS)
            });
        }

        if (selectedPlan.amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "This plan cannot be purchased"
            });
        }

        const order = await razorpay.orders.create({
            amount: selectedPlan.amount * 100,
            currency: "INR",
            receipt: `receipt-${Date.now()}`
        });

        await Payment.create({
            userId,
            orderId: order.id,
            amount: selectedPlan.amount,
            credits: selectedPlan.credits,
            plan: selectedPlan.id,
            currency: order.currency,
            status: "created"
        });

        return res.status(200).json({
            success: true,
            order,
            plan: selectedPlan
        });
    } catch (error) {
        console.error("CREATE ORDER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: `Create order error: ${error.message}`
        });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing Razorpay payment details"
            });
        }

        const generatedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(
                `${razorpay_order_id}|${razorpay_payment_id}`
            )
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed"
            });
        }

        const payment = await Payment.findOne({
            orderId: razorpay_order_id
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        /*
         * If the payment was already marked paid,
         * don't create another credit transaction.
         */
        if (payment.status === "paid") {
            return res.status(200).json({
                success: true,
                message: "Payment already verified"
            });
        }

        /*
         * Get the browser session cookie from the request.
         *
         * The request first goes:
         *
         * Browser → Gateway → Billing
         *
         * We need to forward that session ID to Auth Service.
         */
        const sessionCookie = req.headers.cookie || "";

        const sessionId = sessionCookie
            .split(";")
            .map((item) => item.trim())
            .find((item) => item.startsWith("session="))
            ?.split("=")[1];

        console.log("SESSION ID:", sessionId);

        /*
         * Tell Auth Service to update:
         * - plan
         * - credits
         * - Redis session
         */
        const authResponse = await axios.post(
            `${process.env.AUTH_SERVICE}/update-plan`,
            {
                userId: payment.userId,
                plan: payment.plan,
                credits: payment.credits,
                sessionId
            }
        );

        console.log(
            "AUTH UPDATE RESPONSE:",
            authResponse.data
        );

        /*
         * Only mark payment paid after Auth Service
         * successfully updates the user.
         */
        payment.status = "paid";
        payment.paymentId = razorpay_payment_id;

        await payment.save();

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully"
        });
    } catch (error) {
        console.error(
            "VERIFY PAYMENT ERROR:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            success: false,
            message:
                error.response?.data?.message ||
                `Payment verification error: ${error.message}`
        });
    }
};