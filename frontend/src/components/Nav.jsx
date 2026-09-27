import { MessageSquare } from "lucide-react";
import React from "react";
import { useSelector } from "react-redux";

function Nav() {
    const { selectedConversation } = useSelector(
        (state) => state.conversation
    );

    const { messages } = useSelector(
        (state) => state.message
    );

    return (
        <>
            {selectedConversation && (
                <div className="h-14 shrink-0 flex items-center gap-2.5 px-3 sm:px-5 border-b border-white/[0.06] bg-[#0b0d10]">

                    {/* Conversation icon */}
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08]">
                        <MessageSquare
                            size={13}
                            className="text-slate-400"
                        />
                    </div>

                    {/* Title */}
                    <div className="min-w-0 text-[14px] font-semibold text-slate-100 tracking-tight truncate">
                        {selectedConversation?.title ||
                            "New Chat"}
                    </div>

                    {/* Message count */}
                    <div className="shrink-0 text-[10px] font-medium text-slate-500 bg-white/[0.035] border border-white/[0.06] px-2 py-0.5 rounded-full">
                        {messages?.length || 0} Messages
                    </div>

                </div>
            )}
        </>
    );
}

export default Nav;