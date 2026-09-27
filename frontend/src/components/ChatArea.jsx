import React, {
    useEffect,
    useState
} from "react";

import { Menu } from "lucide-react";

import Nav from "../components/Nav";
import MessageList from "../components/MessageList";
import ChatInput from "../components/ChatInput";

import {
    useDispatch,
    useSelector
} from "react-redux";

import getMessages from "../features/getMessages";

import {
    setArtifacts,
    setMessages
} from "../redux/messageSlice";

import {
    clearJustCreated
} from "../redux/conversationSlice";

const ChatArea = ({
    onOpenSidebar
}) => {

    const dispatch = useDispatch();

    const [
        isGenerating,
        setIsGenerating
    ] = useState(false);

    const selectedConversation =
        useSelector(
            (state) =>
                state.conversation
                    .selectedConversation
        );


    useEffect(() => {

        const conversationId =
            selectedConversation?._id;

        if (!conversationId) {

            dispatch(setMessages([]));
            dispatch(setArtifacts([]));

            return;
        }


        // Newly created conversation already
        // has its messages in Redux.
        if (
            selectedConversation?.justCreated
        ) {

            dispatch(
                clearJustCreated(
                    conversationId
                )
            );

            return;
        }


        // Temporary optimistic conversation
        if (
            selectedConversation?.pending
        ) {
            return;
        }


        if (
            selectedConversation.title ===
            "New Chat"
        ) {

            dispatch(setMessages([]));
            dispatch(setArtifacts([]));

            return;
        }


        let cancelled = false;


        const loadMessages = async () => {

            try {

                const data =
                    await getMessages(
                        conversationId
                    );


                if (!cancelled) {

                    dispatch(
                        setMessages(
                            data || []
                        )
                    );


                    // Find latest message
                    // containing artifacts
                    const latestArtifactMessage =
                        [...(data || [])]
                            .reverse()
                            .find(
                                (msg) =>
                                    Array.isArray(
                                        msg.artifacts
                                    ) &&
                                    msg.artifacts
                                        .length > 0
                            );


                    dispatch(
                        setArtifacts(
                            latestArtifactMessage
                                ?.artifacts || []
                        )
                    );
                }

            } catch (error) {

                if (!cancelled) {

                    console.error(
                        "Failed to load messages:",
                        error
                    );

                    dispatch(
                        setMessages([])
                    );

                    dispatch(
                        setArtifacts([])
                    );
                }
            }
        };


        loadMessages();


        return () => {
            cancelled = true;
        };

    }, [
        selectedConversation?._id,
        selectedConversation?.justCreated,
        selectedConversation?.pending,
        selectedConversation?.title,
        dispatch
    ]);


    return (
        <div className="flex flex-col h-full min-h-0 min-w-0 overflow-hidden">

            {/* =====================================================
                MOBILE HEADER
            ===================================================== */}

            <div className="lg:hidden shrink-0 h-12 flex items-center gap-3 px-3 border-b border-white/[0.06] bg-[#0b0d10]">

                <button
                    type="button"
                    aria-label="Open sidebar"
                    onClick={onOpenSidebar}
                    className="
                        flex
                        items-center
                        justify-center
                        w-9
                        h-9
                        rounded-lg
                        text-slate-400
                        hover:text-white
                        hover:bg-white/[0.06]
                        transition-all
                        duration-150
                        active:scale-[0.96]
                        cursor-pointer
                    "
                >
                    <Menu size={20} />
                </button>

                <span className="text-sm font-medium text-slate-200">
                    SynoraAI
                </span>

            </div>


            {/* =====================================================
                NAV
            ===================================================== */}

            <Nav />


            {/* =====================================================
                MESSAGE AREA
            ===================================================== */}

            <div className="flex-1 min-h-0 min-w-0 overflow-hidden">

                <MessageList
                    isGenerating={
                        isGenerating
                    }
                />

            </div>


            {/* =====================================================
                CHAT INPUT
            ===================================================== */}

            <div className="shrink-0 min-w-0">

                <ChatInput
                    onGeneratingChange={
                        setIsGenerating
                    }
                />

            </div>

        </div>
    );
};

export default ChatArea;