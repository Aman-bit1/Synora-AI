import React, {
    useEffect,
    useRef
} from "react";

import { useSelector } from "react-redux";

import MessageBubble from "./MessageBubble";

function MessageList({
    isGenerating = false
}) {
    const { selectedConversation } =
        useSelector(
            (state) => state.conversation
        );

    const { messages } =
        useSelector(
            (state) => state.message
        );

    const scrollRef = useRef(null);
    const lastUserMessageRef =
        useRef(null);

    /*
     * When generation starts, scroll to the latest
     * user prompt instead of blindly jumping to the
     * bottom of the conversation.
     */
    useEffect(() => {
        if (
            isGenerating &&
            lastUserMessageRef.current
        ) {
            lastUserMessageRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    }, [isGenerating]);

    return (
        <div
            ref={scrollRef}
            className="
                h-full
                min-h-0
                overflow-y-auto
                overflow-x-hidden
                px-3
                sm:px-6
                py-5
                sm:py-6
                [scrollbar-width:none]
                [&::-webkit-scrollbar]:hidden
            "
        >

            {messages.length === 0 ||
            !selectedConversation ? (

                <div className="h-full flex flex-col items-center justify-center gap-5 text-center px-4">

                    <div className="flex flex-col gap-2">

                        <h1 className="text-[22px] font-semibold text-slate-100 tracking-tight">
                            SynoraAI
                        </h1>

                        <p className="text-[15px] font-medium text-slate-400 tracking-tight">
                            How can I help you?
                        </p>

                        <p className="text-[13px] text-slate-500 leading-relaxed max-w-md">
                            Ask me anything - code, ideas, explanations, or just a quick question.
                        </p>

                    </div>


                </div>

            ) : (

                <div className="w-full flex flex-col gap-7 px-0 sm:px-1">

                    {messages.map(
                        (message, index) => {

                            const isLastUserMessage =
                                message.role === "user" &&
                                !messages
                                    .slice(index + 1)
                                    .some(
                                        (item) =>
                                            item.role === "user"
                                    );

                            return (
                                <div
                                    key={
                                        message._id ||
                                        `${message.role}-${index}`
                                    }
                                    ref={
                                        isLastUserMessage
                                            ? lastUserMessageRef
                                            : null
                                    }
                                >
                                    <MessageBubble
                                        role={
                                            message.role
                                        }
                                        content={
                                            message.content
                                        }
                                        images={
                                            message.images ||
                                            []
                                        }
                                    />
                                </div>
                            );
                        }
                    )}

                    {/* CHATGPT-STYLE LOADING */}
                    {isGenerating && (
                        <div className="w-full">

                            <div className="flex justify-start">

                                <div className="
                                    rounded-[14px]
                                    bg-[#16191c]
                                    border
                                    border-white/[0.06]
                                    border-l-2
                                    border-l-[#3b4148]
                                    px-4
                                    py-3
                                    shadow-[0_4px_18px_rgba(0,0,0,0.10)]
                                ">

                                    <div className="flex items-center gap-1.5">

                                        <span
                                            className="
                                                w-1.5
                                                h-1.5
                                                rounded-full
                                                bg-slate-400
                                                animate-bounce
                                            "
                                        />

                                        <span
                                            className="
                                                w-1.5
                                                h-1.5
                                                rounded-full
                                                bg-slate-400
                                                animate-bounce
                                            "
                                            style={{
                                                animationDelay:
                                                    "150ms"
                                            }}
                                        />

                                        <span
                                            className="
                                                w-1.5
                                                h-1.5
                                                rounded-full
                                                bg-slate-400
                                                animate-bounce
                                            "
                                            style={{
                                                animationDelay:
                                                    "300ms"
                                            }}
                                        />

                                    </div>

                                </div>

                            </div>

                        </div>
                    )}

                </div>
            )}

        </div>
    );
}

export default MessageList;