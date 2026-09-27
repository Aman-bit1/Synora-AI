import {
    Code2,
    FileText,
    Globe,
    ImageIcon,
    MessageSquare,
    Mic,
    Paperclip,
    Presentation,
    Send,
    Zap,
    X
} from "lucide-react";

import React, {
    useEffect,
    useRef,
    useState
} from "react";

import {
    useDispatch,
    useSelector
} from "react-redux";

import { setUserdata } from "../redux/userSlice";

import sendMessage from "../features/sendMessage";
import { createConversation } from "../features/createConversation";
import { updateConversation } from "../features/updateConversation";

import {
    addMessages,
    setArtifacts,
    setMessages
} from "../redux/messageSlice";

import {
    addConversation,
    replaceConversation,
    removeConversation,
    setConvTitle,
    setSelectedConversation
} from "../redux/conversationSlice";


function ChatInput({
    onGeneratingChange
}) {

    const [value, setValue] = useState("");

    const [sending, setSending] =
        useState(false);

    const [selectedAgent, setSelectedAgent] =
        useState("Auto");

    const [selectedFile, setSelectedFile] =
        useState(null);

    const [previewUrl, setPreviewUrl] =
        useState(null);

    const fileInputRef =
        useRef(null);


    const {
        selectedConversation
    } = useSelector(
        (state) => state.conversation
    );


    const userData = useSelector(
        (state) => state.user.userData
    );


    const dispatch = useDispatch();


    // =====================================================
    // IMAGE PREVIEW
    // =====================================================

    useEffect(() => {

        if (!selectedFile) {

            setPreviewUrl(null);

            return;
        }


        if (
            selectedFile.type.startsWith(
                "image/"
            )
        ) {

            const url =
                URL.createObjectURL(
                    selectedFile
                );

            setPreviewUrl(url);


            return () => {
                URL.revokeObjectURL(url);
            };
        }


        setPreviewUrl(null);

    }, [selectedFile]);


    // =====================================================
    // FILE SELECTION
    // =====================================================

    const handleFileChange = (
        event
    ) => {

        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }


        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            alert(
                "Only PDF and image files are allowed."
            );

            event.target.value = "";

            return;
        }


        const maxSize =
            20 * 1024 * 1024;


        if (file.size > maxSize) {

            alert(
                "File size must be less than 20 MB."
            );

            event.target.value = "";

            return;
        }


        setSelectedFile(file);
    };


    // =====================================================
    // REMOVE FILE
    // =====================================================

    const handleRemoveFile = () => {

        setSelectedFile(null);


        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };


    // =====================================================
    // CREATE PAYLOAD
    // =====================================================

    const createPayload = (
        prompt,
        conversationId
    ) => {

        if (!selectedFile) {

            return {
                prompt,
                conversationId,
                agent:
                    selectedAgent.toLowerCase()
            };
        }


        const formData =
            new FormData();


        formData.append(
            "prompt",
            prompt
        );

        formData.append(
            "conversationId",
            conversationId
        );

        formData.append(
            "agent",
            selectedAgent.toLowerCase()
        );

        formData.append(
            "file",
            selectedFile
        );


        return formData;
    };


    // =====================================================
    // SEND MESSAGE
    // =====================================================

    const handleSendMessage = async () => {

        const prompt =
            value.trim();


        if (
            (!prompt && !selectedFile) ||
            sending
        ) {
            return;
        }


        // 🔴 START LOADING
        onGeneratingChange?.(true);

        setSending(true);


        let tempId = null;


        try {

            // =====================================================
            // EXISTING CONVERSATION
            // =====================================================

            if (selectedConversation) {

                const title = (
                    prompt ||
                    selectedFile?.name ||
                    "New Chat"
                ).slice(0, 40);


                // Show user message immediately
                dispatch(
                    addMessages({
                        role: "user",
                        content:
                            prompt ||
                            `Uploaded ${selectedFile.name}`
                    })
                );


                // Clear text input
                setValue("");


                // Update title if first message
                if (
                    selectedConversation.title ===
                    "New Chat"
                ) {

                    updateConversation({
                        id:
                            selectedConversation._id,
                        title
                    })
                        .then(() => {

                            dispatch(
                                setConvTitle({
                                    conversationId:
                                        selectedConversation._id,
                                    title
                                })
                            );

                        })
                        .catch((error) => {

                            console.error(
                                "Failed to update conversation title:",
                                error
                            );

                        });
                }


                const payload =
                    createPayload(
                        prompt,
                        selectedConversation._id
                    );


                const data =
                    await sendMessage(
                        payload
                    );


                if (!data) {

                    throw new Error(
                        "Agent returned no response"
                    );
                }


                // Update credits
                if (data?.user) {

                    dispatch(
                        setUserdata({
                            ...userData,
                            ...data.user
                        })
                    );
                }


                dispatch(
                    setArtifacts(
                        data.artifacts || []
                    )
                );


                // Show AI response
                dispatch(
                    addMessages({
                        role: "assistant",
                        content:
                            data.answer,
                        images:
                            data.images
                    })
                );


                // Clear file
                handleRemoveFile();


                return;
            }


            // =====================================================
            // NEW CONVERSATION
            // =====================================================

            const title = (
                prompt ||
                selectedFile?.name ||
                "New Chat"
            ).slice(0, 40);


            tempId =
                `temp-${Date.now()}`;


            const optimisticConversation = {
                _id: tempId,
                title,
                pending: true
            };


            // Add temporary conversation
            dispatch(
                addConversation(
                    optimisticConversation
                )
            );


            // Select temporary conversation
            dispatch(
                setSelectedConversation(
                    optimisticConversation
                )
            );


            // Show user message immediately
            dispatch(
                setMessages([
                    {
                        role: "user",
                        content:
                            prompt ||
                            `Uploaded ${selectedFile.name}`
                    }
                ])
            );


            // Clear input
            setValue("");


            // =====================================================
            // CREATE REAL CONVERSATION
            // =====================================================

            let conversation =
                await createConversation();


            if (!conversation?._id) {

                throw new Error(
                    "Failed to create conversation"
                );
            }


            // Update title
            await updateConversation({
                id:
                    conversation._id,
                title
            });


            conversation = {
                ...conversation,
                title
            };


            // =====================================================
            // SEND MESSAGE
            // =====================================================

            const payload =
                createPayload(
                    prompt,
                    conversation._id
                );


            const data =
                await sendMessage(
                    payload
                );


            if (!data) {

                throw new Error(
                    "Agent returned no response"
                );
            }


            // Update credits
            if (data?.user) {

                dispatch(
                    setUserdata({
                        ...userData,
                        ...data.user
                    })
                );
            }


            // Store artifacts
            dispatch(
                setArtifacts(
                    data.artifacts || []
                )
            );


            // =====================================================
            // FINAL CONVERSATION
            // =====================================================

            const finalConversation = {
                ...conversation,
                justCreated: true
            };


            // Replace temp conversation
            dispatch(
                replaceConversation({
                    tempId,
                    conversation:
                        finalConversation
                })
            );


            // Set complete messages
            dispatch(
                setMessages([
                    {
                        role: "user",
                        content:
                            prompt ||
                            `Uploaded ${selectedFile.name}`
                    },
                    {
                        role: "assistant",
                        content:
                            data.answer,
                        images:
                            data.images || []
                    }
                ])
            );


            // Select real conversation
            dispatch(
                setSelectedConversation(
                    finalConversation
                )
            );


            // Store title
            dispatch(
                setConvTitle({
                    conversationId:
                        conversation._id,
                    title
                })
            );


            // Clear file
            handleRemoveFile();

        } catch (error) {

            console.error(
                "Send message failed:",
                error
            );


            if (tempId) {

                dispatch(
                    removeConversation(
                        tempId
                    )
                );
            }

        } finally {

            setSending(false);

            // 🔴 STOP LOADING
            onGeneratingChange?.(
                false
            );
        }
    };


    // =====================================================
    // AGENTS
    // =====================================================

    const agents = [
        {
            id: "auto",
            icon: Zap,
            label: "Auto"
        },
        {
            id: "chat",
            icon: MessageSquare,
            label: "Chat"
        },
        {
            id: "coding",
            icon: Code2,
            label: "Coding"
        },
        {
            id: "pdf",
            icon: FileText,
            label: "PDF"
        },
        {
            id: "ppt",
            icon: Presentation,
            label: "PPT"
        },
        {
            id: "vision",
            icon: ImageIcon,
            label: "vision"
        },
        {
            id: "search",
            icon: Globe,
            label: "Search"
        }
    ];


    return (
        <div className="
            w-full
            min-w-0
            overflow-hidden
            px-2.5
            sm:px-4
            md:px-6
            py-3
            sm:py-4
            border-t
            border-white/[0.06]
            bg-[#0d0f14]
        ">

            <div className="
                flex
                min-w-0
                flex-col
                gap-2
                bg-white/[0.025]
                border
                border-white/[0.08]
                rounded-xl
                px-3
                sm:px-4
                pt-3
                pb-2.5
                focus-within:border-white/[0.14]
                transition-colors
                duration-150
            ">


                {/* =====================================================
                    AGENTS
                ===================================================== */}

                <div className="
                    flex
                    w-full
                    gap-1.5
                    sm:gap-2
                    pr-1
                    flex-wrap
                ">

                    {agents.map(
                        (agent) => {

                            const isActive =
                                selectedAgent ===
                                agent.label;

                            const Icon =
                                agent.icon;


                            return (
                                <button
                                    type="button"
                                    key={
                                        agent.id
                                    }
                                    onClick={() =>
                                        setSelectedAgent(
                                            agent.label
                                        )
                                    }
                                    className={`
                                        flex-shrink-0
                                        inline-flex
                                        items-center
                                        gap-1.5
                                        px-2.5
                                        py-1.5
                                        sm:px-3
                                        sm:py-2
                                        rounded-full
                                        text-xs
                                        font-medium
                                        border
                                        transition-all
                                        duration-150
                                        cursor-pointer
                                        active:scale-[0.97]

                                        ${
                                            isActive
                                                ? "bg-white/[0.08] text-white border-white/[0.14] shadow-sm"
                                                : "bg-transparent text-slate-400 border-white/[0.06] hover:bg-white/[0.04] hover:text-slate-200 hover:border-white/[0.10]"
                                        }
                                    `}
                                >
                                    <Icon
                                        size={
                                            14
                                        }
                                        className={
                                            isActive
                                                ? "text-white"
                                                : "text-slate-500"
                                        }
                                    />

                                    {
                                        agent.label
                                    }

                                </button>
                            );
                        }
                    )}

                </div>


                {/* =====================================================
                    FILE INPUT
                ===================================================== */}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp,image/gif"
                    onChange={
                        handleFileChange
                    }
                    className="hidden"
                />


                {/* =====================================================
                    ATTACHMENT PREVIEW
                ===================================================== */}

                {selectedFile && (
                    <div className="
                        self-start
                        w-fit
                        max-w-full
                    ">

                        {selectedFile.type ===
                        "application/pdf" ? (

                            <div className="
                                flex
                                items-center
                                gap-3
                                w-[270px]
                                max-w-full
                                px-3
                                py-2.5
                                rounded-xl
                                border
                                border-white/[0.08]
                                bg-white/[0.035]
                            ">

                                <div className="
                                    flex
                                    items-center
                                    justify-center
                                    w-10
                                    h-10
                                    rounded-lg
                                    bg-red-500/[0.08]
                                    flex-shrink-0
                                ">
                                    <FileText
                                        size={19}
                                        className="text-red-400"
                                    />
                                </div>


                                <div className="
                                    min-w-0
                                    flex-1
                                ">

                                    <p className="
                                        text-[13px]
                                        font-medium
                                        text-slate-200
                                        truncate
                                    ">
                                        {
                                            selectedFile.name
                                        }
                                    </p>

                                    <p className="
                                        text-[11px]
                                        text-slate-500
                                        mt-0.5
                                    ">
                                        {(
                                            selectedFile.size /
                                            (
                                                1024 *
                                                1024
                                            )
                                        ).toFixed(
                                            2
                                        )}{" "}
                                        MB
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    onClick={
                                        handleRemoveFile
                                    }
                                    className="
                                        flex
                                        items-center
                                        justify-center
                                        w-7
                                        h-7
                                        rounded-md
                                        text-slate-500
                                        hover:text-slate-200
                                        hover:bg-white/[0.06]
                                        transition-all
                                        duration-150
                                        active:scale-[0.94]
                                        flex-shrink-0
                                        cursor-pointer
                                    "
                                >
                                    <X size={14} />
                                </button>

                            </div>

                        ) : (

                            <div className="
                                flex
                                items-center
                                gap-3
                                w-[280px]
                                max-w-full
                                p-2
                                rounded-xl
                                border
                                border-white/[0.08]
                                bg-white/[0.035]
                            ">

                                <div className="
                                    w-16
                                    h-16
                                    sm:w-[72px]
                                    sm:h-[72px]
                                    rounded-lg
                                    overflow-hidden
                                    bg-black/20
                                    flex-shrink-0
                                ">

                                    {previewUrl && (
                                        <img
                                            src={
                                                previewUrl
                                            }
                                            alt={
                                                selectedFile.name
                                            }
                                            className="w-full h-full object-cover"
                                        />
                                    )}

                                </div>


                                <div className="
                                    min-w-0
                                    flex-1
                                ">

                                    <p className="
                                        text-[13px]
                                        font-medium
                                        text-slate-200
                                        truncate
                                    ">
                                        {
                                            selectedFile.name
                                        }
                                    </p>

                                    <p className="
                                        text-[11px]
                                        text-slate-500
                                        mt-0.5
                                    ">
                                        {(
                                            selectedFile.size /
                                            (
                                                1024 *
                                                1024
                                            )
                                        ).toFixed(
                                            2
                                        )}{" "}
                                        MB
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    onClick={
                                        handleRemoveFile
                                    }
                                    className="
                                        flex
                                        items-center
                                        justify-center
                                        w-7
                                        h-7
                                        rounded-md
                                        text-slate-500
                                        hover:text-slate-200
                                        hover:bg-white/[0.06]
                                        transition-all
                                        duration-150
                                        active:scale-[0.94]
                                        flex-shrink-0
                                        cursor-pointer
                                    "
                                >
                                    <X size={14} />
                                </button>

                            </div>
                        )}

                    </div>
                )}


                {/* =====================================================
                    TEXTAREA
                ===================================================== */}

                <textarea
                    placeholder="Ask Anything..."
                    onChange={(e) =>
                        setValue(
                            e.target.value
                        )
                    }
                    value={value}
                    disabled={sending}
                    onKeyDown={(e) => {

                        if (
                            e.key === "Enter" &&
                            !e.shiftKey
                        ) {

                            e.preventDefault();

                            handleSendMessage();
                        }

                    }}
                    className="
                        w-full
                        min-w-0
                        bg-transparent
                        outline-none
                        resize-none
                        text-[14px]
                        text-slate-200
                        placeholder:text-slate-600
                        leading-relaxed
                        [scrollbar-width:none]
                        [&::-webkit-scrollbar]:hidden
                    "
                    rows={3}
                />


                {/* =====================================================
                    BOTTOM CONTROLS
                ===================================================== */}

                <div className="
                    flex
                    items-center
                    justify-between
                    gap-2
                ">

                    <div className="
                        flex
                        items-center
                        gap-1
                        min-w-0
                    ">

                        {/* PAPERCLIP */}

                        <button
                            type="button"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            disabled={sending}
                            className="
                                flex
                                items-center
                                justify-center
                                w-8
                                h-8
                                rounded-lg
                                text-slate-500
                                hover:text-slate-300
                                hover:bg-white/[0.05]
                                transition-all
                                duration-150
                                active:scale-[0.94]
                                bg-transparent
                                border-none
                                cursor-pointer
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                                flex-shrink-0
                            "
                        >
                            <Paperclip
                                size={16}
                            />
                        </button>


                        {/* MICROPHONE */}

                        <button
                            type="button"
                            className="
                                flex
                                items-center
                                justify-center
                                w-8
                                h-8
                                rounded-lg
                                text-slate-500
                                hover:text-slate-300
                                hover:bg-white/[0.05]
                                transition-all
                                duration-150
                                active:scale-[0.94]
                                bg-transparent
                                border-none
                                cursor-pointer
                                flex-shrink-0
                            "
                        >
                            <Mic size={16} />
                        </button>

                    </div>


                    {/* SEND */}

                    <button
                        type="button"
                        disabled={
                            (!value.trim() &&
                                !selectedFile) ||
                            sending
                        }
                        onClick={
                            handleSendMessage
                        }
                        className={`
                            flex
                            items-center
                            justify-center
                            w-8
                            h-8
                            rounded-lg
                            border-none
                            transition-all
                            duration-150
                            active:scale-[0.94]
                            flex-shrink-0

                            ${
                                (
                                    value.trim() ||
                                    selectedFile
                                ) &&
                                !sending
                                    ? "bg-white/[0.08] hover:bg-white/[0.13] text-slate-300 hover:text-white cursor-pointer"
                                    : "bg-white/[0.05] text-slate-600 cursor-not-allowed"
                            }
                        `}
                    >
                        <Send
                            size={15}
                        />
                    </button>

                </div>

            </div>

        </div>
    );
}


export default ChatInput;