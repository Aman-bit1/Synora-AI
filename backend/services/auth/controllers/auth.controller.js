import crypto from "crypto";
import { getAuth } from "firebase-admin/auth";
import { app } from "../config/firebase.js";
import User from "../models/user.model.js";
import redis from "../../../shared/redis/redis.js";

export const login = async (req, res) => {
    try {
        const {token} = req.body;

        const decoded = await getAuth(app).verifyIdToken(token);

        let user = await User.findOne({
            firebaseUid: decoded.uid
        });

        if (!user) {
            user = await User.create({
                firebaseUid: decoded.uid,
                name: decoded.name,
                email: decoded.email,
                avatar: decoded.picture
            });
        }

        const sessionId = crypto.randomUUID();
       await redis.set(`session-${sessionId}`,JSON.stringify({
            userId:user._id,
            name:user.name,
            email:user.email,
            avatar:user.avatar,
             plan: user.plan,
                credits: user.credits,
                totalCredits: user.totalCredits,
                planExpiresAt: user.planExpiresAt
        }),"EX",7*24*60*60)
        // NEW: user → session mapping
await redis.set(
    `user-session-${user._id}`,
    sessionId,
    "EX",
    7 * 24 * 60 * 60
);
        res.cookie("session", sessionId, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json(user);

    } catch (error) {
    console.log("LOGIN ERROR:", error);

    res.status(500).json({
        message: `login error: ${error.message}`
    });
}
};
export const logout = async (req, res) => {
    try {
        const sessionId = req.cookies.session;

      if (sessionId) {
    const session = await redis.get(
        `session-${sessionId}`
    );

    await redis.del(
        `session-${sessionId}`
    );

    if (session) {
        const parsedSession =
            JSON.parse(session);

        if (parsedSession?.userId) {
            await redis.del(
                `user-session-${parsedSession.userId}`
            );
        }
    }
}

        res.clearCookie("session", {
            httpOnly: true,
            secure: false,
            sameSite: "strict"
        });

        return res.status(200).json({
            message: "logout successfully"
        });

    } catch (error) {
        console.log("LOGOUT ERROR:", error);

        return res.status(500).json({
            message: "Logout failed"
        });
    }
};


export const updateUserPayment = async (req, res) => {
    try {
        const {
            plan,
            credits,
            userId,
            sessionId
        } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.plan = plan;

        user.credits += credits;
        user.totalCredits += credits;

        user.planExpiresAt = new Date(
            Date.now() +
                30 * 24 * 60 * 60 * 1000
        );

        await user.save();

        /*
         * Update the user's actual Redis session.
         *
         * IMPORTANT:
         * Billing Service explicitly sends sessionId.
         */
        if (sessionId) {
            await redis.set(
                `session-${sessionId}`,
                JSON.stringify({
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    plan: user.plan,
                    credits: user.credits,
                    totalCredits: user.totalCredits,
                    planExpiresAt: user.planExpiresAt
                }),
                "EX",
                7 * 24 * 60 * 60
            );
        } else {
            console.warn(
                "No sessionId received. Redis session was not updated."
            );
        }

        return res.status(200).json({
            success: true,
            message: "User payment updated",
            user: {
                userId: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                plan: user.plan,
                credits: user.credits,
                totalCredits: user.totalCredits,
                planExpiresAt: user.planExpiresAt
            }
        });
    } catch (error) {
        console.error("UPDATE USER PAYMENT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: `Update user payment error: ${error.message}`
        });
    }
};

export const deductCredits = async (req, res) => {
    try {
        const { userId, agent } = req.body;

        console.log("===== DEDUCT CREDITS START =====");
        console.log("USER ID:", userId);
        console.log("AGENT:", agent);

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        if (!agent) {
            return res.status(400).json({
                success: false,
                message: "Agent is required"
            });
        }

        const COST = {
            chat: 1,
            search: 5,
            coding: 10,
            pdf: 10,
            ppt: 10,
            vision: 10
        };

        const requiredCredits = COST[agent];

        if (requiredCredits === undefined) {
            return res.status(400).json({
                success: false,
                message: `Invalid agent: ${agent}`
            });
        }

        console.log("CREDIT COST:", requiredCredits);

        // ==========================================
        // FIND USER
        // ==========================================

        console.log("BEFORE User.findById()");

        const user = await User.findById(userId);

        console.log("AFTER User.findById()");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        console.log("CREDITS BEFORE:", user.credits);

        // ==========================================
        // CHECK CREDITS
        // ==========================================

        if (user.credits < requiredCredits) {
            return res.status(400).json({
                success: false,
                message: "Not enough credits.",
                requiredCredits,
                availableCredits: user.credits
            });
        }

        // ==========================================
        // DEDUCT CREDITS
        // ==========================================

        user.credits -= requiredCredits;

        console.log("BEFORE user.save()");

        await user.save();

        console.log("AFTER user.save()");
        console.log("CREDITS AFTER:", user.credits);

        // ==========================================
        // UPDATE REDIS SESSION
        // ==========================================

        let sessionId = null;

        try {
            console.log("BEFORE redis.get()");

            sessionId = await redis.get(
                `user-session-${user._id}`
            );

            console.log(
                "AFTER redis.get()"
            );

            console.log(
                "SESSION ID:",
                sessionId
            );

            if (sessionId) {

                console.log(
                    "BEFORE redis.set()"
                );

                await redis.set(
                    `session-${sessionId}`,
                    JSON.stringify({
                        userId: user._id,
                        name: user.name,
                        email: user.email,
                        avatar: user.avatar,
                        plan: user.plan,
                        credits: user.credits,
                        totalCredits: user.totalCredits,
                        planExpiresAt: user.planExpiresAt
                    }),
                    "EX",
                    7 * 24 * 60 * 60
                );

                console.log(
                    "AFTER redis.set()"
                );

                console.log(
                    "REDIS SESSION UPDATED"
                );

            } else {

                console.warn(
                    `No session mapping found for user ${user._id}`
                );

            }

        } catch (redisError) {

            // IMPORTANT:
            // MongoDB credit deduction already succeeded.
            // Do not turn this into a failed credit deduction.

            console.error(
                "REDIS UPDATE ERROR:",
                redisError.message
            );

        }

        // ==========================================
        // RESPONSE
        // ==========================================

        console.log(
            "===== DEDUCT CREDITS SUCCESS ====="
        );

        return res.status(200).json({
            success: true,
            message: "Credits deducted successfully",
            deducted: requiredCredits,
            agent,

            user: {
                userId: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                plan: user.plan,
                credits: user.credits,
                totalCredits: user.totalCredits,
                planExpiresAt: user.planExpiresAt
            }
        });

    } catch (error) {

        console.error(
            "===== DEDUCT CREDITS ERROR ====="
        );

        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                `Credit deduction failed: ${error.message}`
        });
    }
};