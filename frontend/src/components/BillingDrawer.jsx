import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Crown, X } from "lucide-react";

import { setUserdata } from "../redux/userSlice";
import { createOrder } from "../features/createOrder";
import { verifyPayment } from "../features/verifyPayment";

import { useDispatch, useSelector } from "react-redux";

function BillingDrawer({ open, onClose }) {
    const { userData } = useSelector(
        (state) => state.user
    );

    const dispatch = useDispatch();

    // Prevent background scrolling while drawer is open
    useEffect(() => {
        if (!open) {
            return;
        }

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow =
                previousOverflow;
        };
    }, [open]);

    // Close with Escape
    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [open, onClose]);

    const handleUpgrade = async (plan) => {
        try {
            const data = await createOrder(plan);

            if (!data?.order?.id) {
                console.error(
                    "Invalid order response:",
                    data
                );

                alert(
                    "Unable to create payment order."
                );

                return;
            }

            if (!window.Razorpay) {
                console.error(
                    "Razorpay SDK is not loaded."
                );

                alert(
                    "Payment gateway is not available. Please refresh the page."
                );

                return;
            }

            const options = {
                key: import.meta.env
                    .VITE_RAZORPAY_KEY_ID,

                amount: data.order.amount,

                currency: data.order.currency,

                name: "SynoraAI",

                description:
                    `${data.plan?.name || plan} Plan`,

                order_id: data.order.id,

                handler: async (response) => {
                    try {
                        console.log(
                            "Razorpay response:",
                            response
                        );

                        const verificationData =
                            await verifyPayment(
                                response
                            );

                        console.log(
                            "Payment verification response:",
                            verificationData
                        );

                        if (
                            verificationData?.success !==
                            false
                        ) {
                            dispatch(
                                setUserdata(
                                    verificationData.user
                                )
                            );

                            alert(
                                "Payment successful!"
                            );

                            onClose();

                            window.location.reload();
                        } else {
                            alert(
                                "Payment verification failed."
                            );
                        }
                    } catch (error) {
                        console.error(
                            "Payment verification error:",
                            error
                        );

                        alert(
                            "Payment was completed, but verification failed. Please contact support."
                        );
                    }
                },

                modal: {
                    ondismiss: () => {
                        console.log(
                            "Razorpay checkout closed."
                        );
                    }
                },

                theme: {
                    color: "#18181b"
                }
            };

            const razorpay =
                new window.Razorpay(options);

            razorpay.on(
                "payment.failed",
                (response) => {
                    console.error(
                        "Payment failed:",
                        response?.error
                    );

                    alert(
                        response?.error?.description ||
                        "Payment failed. Please try again."
                    );
                }
            );

            razorpay.open();
        } catch (error) {
            console.error(
                "Upgrade error:",
                error
            );

            alert(
                "Something went wrong while creating the payment."
            );
        }
    };

    const credits =
        userData?.credits || 0;

    const totalCredits =
        userData?.totalCredits || 100;

    const creditPercentage =
        Math.min(
            (credits / totalCredits) * 100,
            100
        );

    if (
        typeof document === "undefined"
    ) {
        return null;
    }

    return createPortal(
        <AnimatePresence>
            {open && (
                <>
                    {/* BACKDROP */}

                    <motion.div
                        initial={{
                            opacity: 0
                        }}
                        animate={{
                            opacity: 1
                        }}
                        exit={{
                            opacity: 0
                        }}
                        transition={{
                            duration: 0.2
                        }}
                        onClick={onClose}
                        className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-[3px]"
                    />

                    {/* DRAWER */}

                    <motion.div
                        initial={{
                            x: "100%"
                        }}
                        animate={{
                            x: 0
                        }}
                        exit={{
                            x: "100%"
                        }}
                        transition={{
                            duration: 0.22,
                            ease: "easeOut"
                        }}
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                        className="
                            fixed
                            z-[1000]
                            top-2
                            right-2
                            bottom-2
                            w-[calc(100vw-16px)]
                            max-w-[390px]

                            sm:top-4
                            sm:right-4
                            sm:bottom-4
                            sm:w-[390px]

                            overflow-hidden
                            rounded-2xl
                            border
                            border-white/[0.08]
                            bg-[#0b0d10]
                            shadow-[0_24px_80px_rgba(0,0,0,0.55)]

                            flex
                            flex-col
                        "
                    >
                        {/* HEADER */}

                        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-white/[0.06] shrink-0">

                            <div className="min-w-0">
                                <h2 className="text-[15px] font-semibold text-slate-100">
                                    Billing
                                </h2>

                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Manage your plan and credits
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close billing"
                                className="
                                    flex
                                    items-center
                                    justify-center
                                    w-8
                                    h-8
                                    rounded-lg
                                    text-slate-500
                                    hover:text-slate-200
                                    hover:bg-white/[0.06]
                                    transition-all
                                    duration-150
                                    active:scale-[0.94]
                                    cursor-pointer
                                    shrink-0
                                "
                            >
                                <X size={17} />
                            </button>

                        </div>

                        {/* CONTENT */}

                        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">

                            {/* CURRENT PLAN */}

                            <div className="px-4 sm:px-5 pt-4">

                                <div className="
                                    rounded-xl
                                    border
                                    border-white/[0.07]
                                    bg-white/[0.025]
                                    p-4
                                ">

                                    <div className="flex items-center justify-between gap-3">

                                        <div className="min-w-0">

                                            <p className="text-[11px] text-slate-500 uppercase tracking-wide">
                                                Current plan
                                            </p>

                                            <h3 className="text-[18px] font-semibold text-slate-100 capitalize mt-1">
                                                {userData?.plan ||
                                                    "free"}
                                            </h3>

                                        </div>

                                        <div className="
                                            flex
                                            items-center
                                            justify-center
                                            w-9
                                            h-9
                                            rounded-lg
                                            bg-white/[0.05]
                                            border
                                            border-white/[0.06]
                                            shrink-0
                                        ">
                                            <Crown
                                                size={17}
                                                className="text-slate-300"
                                            />
                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* CREDITS */}

                            <div className="px-4 sm:px-5 pt-3">

                                <div className="
                                    rounded-xl
                                    border
                                    border-white/[0.07]
                                    bg-white/[0.025]
                                    p-4
                                ">

                                    <div className="flex items-center justify-between mb-2">

                                        <span className="text-[12px] text-slate-500">
                                            Credits
                                        </span>

                                        <span className="text-[12px] text-slate-300">
                                            {credits} /{" "}
                                            {totalCredits}
                                        </span>

                                    </div>

                                    <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">

                                        <div
                                            className="
                                                h-full
                                                rounded-full
                                                bg-slate-300
                                                transition-all
                                                duration-500
                                            "
                                            style={{
                                                width: `${creditPercentage}%`
                                            }}
                                        />

                                    </div>

                                </div>

                            </div>

                            {/* PLANS */}

                            <div className="px-4 sm:px-5 py-4">

                                <p className="text-[11px] uppercase tracking-wide text-slate-600 mb-3">
                                    Available plans
                                </p>

                                <div className="space-y-3">

                                    {/* STARTER */}

                                    <div className="
                                        rounded-xl
                                        border
                                        border-white/[0.07]
                                        bg-white/[0.02]
                                        p-4
                                        hover:bg-white/[0.035]
                                        transition-colors
                                        duration-150
                                    ">

                                        <div className="flex items-start justify-between gap-4">

                                            <div>
                                                <h3 className="text-[14px] font-semibold text-slate-100">
                                                    Starter
                                                </h3>

                                                <p className="text-[11px] text-slate-500 mt-1">
                                                    500 credits
                                                </p>
                                            </div>

                                            <p className="text-[18px] font-semibold text-slate-100">
                                                ₹199
                                            </p>

                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleUpgrade(
                                                    "starter"
                                                )
                                            }
                                            className="
                                                w-full
                                                mt-4
                                                py-2.5
                                                rounded-lg
                                                bg-white/[0.07]
                                                border
                                                border-white/[0.08]
                                                text-[12px]
                                                font-medium
                                                text-slate-200
                                                hover:bg-white/[0.11]
                                                hover:border-white/[0.12]
                                                transition-all
                                                duration-150
                                                active:scale-[0.98]
                                                cursor-pointer
                                            "
                                        >
                                            Upgrade
                                        </button>

                                    </div>

                                    {/* PRO */}

                                    <div className="
                                        rounded-xl
                                        border
                                        border-white/[0.10]
                                        bg-white/[0.035]
                                        p-4
                                        hover:bg-white/[0.05]
                                        transition-colors
                                        duration-150
                                    ">

                                        <div className="flex items-start justify-between gap-4">

                                            <div>
                                                <div className="flex items-center gap-2">

                                                    <h3 className="text-[14px] font-semibold text-slate-100">
                                                        Pro
                                                    </h3>

                                                    <span className="
                                                        text-[9px]
                                                        font-medium
                                                        text-slate-400
                                                        bg-white/[0.05]
                                                        border
                                                        border-white/[0.07]
                                                        px-1.5
                                                        py-0.5
                                                        rounded-full
                                                    ">
                                                        Popular
                                                    </span>

                                                </div>

                                                <p className="text-[11px] text-slate-500 mt-1">
                                                    1000 credits
                                                </p>
                                            </div>

                                            <p className="text-[18px] font-semibold text-slate-100">
                                                ₹499
                                            </p>

                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleUpgrade(
                                                    "pro"
                                                )
                                            }
                                            className="
                                                w-full
                                                mt-4
                                                py-2.5
                                                rounded-lg
                                                bg-white
                                                text-[#0b0d10]
                                                text-[12px]
                                                font-semibold
                                                hover:bg-slate-200
                                                transition-all
                                                duration-150
                                                active:scale-[0.98]
                                                cursor-pointer
                                            "
                                        >
                                            Upgrade
                                        </button>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}

export default BillingDrawer;