import {
    Coins,
    LogOut,
    Menu,
    MessageSquare,
    PanelLeftIcon,
    PanelRight,
    PenSquare,
    Plus,
    User
} from "lucide-react";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { getConversations } from "../features/getConversations";

import {
    addConversation,
    setConversations,
    setSelectedConversation
} from "../redux/conversationSlice";

import { createConversation } from "../features/createConversation";
import logOut from "../features/logout";
import { setUserdata } from "../redux/userSlice";

import BillingDrawer from "./BillingDrawer";

function SideBar({
    mobileOpen = false,
    onMobileClose = () => {}
}) {
    const [collapsed, setCollapsed] = useState(false);

    const dispatch = useDispatch();

    const {
        conversations,
        selectedConversation
    } = useSelector(
        (state) => state.conversation
    );

    const { userData } = useSelector(
        (state) => state.user
    );

    const [imageError, setImageError] = useState(false);
    const [showBilling, setShowBilling] = useState(false);

    useEffect(() => {
        const getconv = async () => {
            const data = await getConversations();
            dispatch(setConversations(data));
        };

        getconv();
    }, [userData?._id, dispatch]);

    const handleCreateConversation = async () => {
        const data = await createConversation();

        dispatch(addConversation(data));
        dispatch(setSelectedConversation(data));

        onMobileClose();
    };

    const handleNewChat = () => {
        dispatch(setSelectedConversation(null));
        onMobileClose();
    };

    const handleSelectConversation = (conversation) => {
        dispatch(
            setSelectedConversation(conversation)
        );

        onMobileClose();
    };

    // =====================================================
    // COLLAPSED DESKTOP SIDEBAR
    // =====================================================

    if (collapsed) {
        return (
            <div className="hidden lg:flex flex-col items-center w-[56px] h-screen bg-[#0b0d10] border-r border-white/[0.06] py-4 gap-1 shrink-0">

                <button
                    type="button"
                    aria-label="Expand sidebar"
                    className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-all duration-150 cursor-pointer"
                    onClick={() =>
                        setCollapsed(false)
                    }
                >
                    <PanelRight size={18} />
                </button>

                <button
                    type="button"
                    aria-label="New chat"
                    className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-all duration-150 cursor-pointer"
                    onClick={handleNewChat}
                >
                    <Plus size={17} />
                </button>

                <div className="flex-1 overflow-y-auto px-2.5 pb-2 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                    {conversations.map((conv) => {

                        const isActive =
                            selectedConversation?._id ===
                            conv?._id;

                        return (
                            <div
                                key={conv._id}
                                onClick={() =>
                                    handleSelectConversation(
                                        conv
                                    )
                                }
                                className={`flex items-center justify-center cursor-pointer mb-1 px-2 py-2 rounded-lg border transition-all duration-150 ${
                                    isActive
                                        ? "bg-white/[0.06] border-white/[0.08]"
                                        : "bg-transparent border-transparent hover:bg-white/[0.035]"
                                }`}
                            >
                                <div
                                    className={`flex items-center justify-center shrink-0 w-[22px] h-[22px] rounded-md ${
                                        isActive
                                            ? "bg-white/[0.08] text-slate-200"
                                            : "bg-white/[0.04] text-slate-500"
                                    }`}
                                >
                                    <MessageSquare
                                        size={13}
                                    />
                                </div>
                            </div>
                        );
                    })}

                </div>

                <div className="relative shrink-0">

                    {userData?.avatar &&
                    !imageError ? (
                        <img
                            className="w-9 h-9 rounded-[10px] object-cover border border-white/[0.10]"
                            src={userData.avatar}
                            alt="profile"
                            onError={() =>
                                setImageError(true)
                            }
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-[10px] bg-white/[0.06] flex items-center justify-center">
                            <User
                                size={15}
                                className="text-slate-400"
                            />
                        </div>
                    )}

                </div>

            </div>
        );
    }

    return (
        <>
            {/* MOBILE BACKDROP */}

            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] lg:hidden"
                    onClick={onMobileClose}
                />
            )}

            {/* SIDEBAR */}

            <div
                className={`
                    fixed lg:static
                    inset-y-0 left-0
                    z-50
                    w-[270px]
                    h-screen
                    shrink-0
                    bg-[#0b0d10]
                    border-r border-white/[0.06]

                    transform
                    transition-transform
                    duration-200
                    ease-out

                    ${
                        mobileOpen
                            ? "translate-x-0"
                            : "-translate-x-full"
                    }

                    lg:translate-x-0
                `}
            >

                <div className="flex flex-col h-full">

                    {/* HEADER */}

                    <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.06]">

                        {/* DESKTOP COLLAPSE */}

                        <button
                            type="button"
                            aria-label="Collapse sidebar"
                            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-all duration-150 cursor-pointer"
                            onClick={() =>
                                setCollapsed(true)
                            }
                        >
                            <PanelLeftIcon
                                size={17}
                            />
                        </button>

                        {/* MOBILE CLOSE */}

                        <button
                            type="button"
                            aria-label="Close sidebar"
                            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all duration-150 cursor-pointer"
                            onClick={onMobileClose}
                        >
                            <Menu size={19} />
                        </button>

                        <span className="text-[16px] font-semibold text-slate-100 tracking-tight flex-1">
                            SynoraAI
                        </span>

                        {/* PLAN BADGE */}

                        <span className="text-[10px] font-medium text-slate-400 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-full tracking-wide">
                           {userData?.plan
                                            ? `${userData.plan.charAt(0).toUpperCase()}${userData.plan.slice(1)} Plan`
                                            : "Free"}
                        </span>

                        {/* NEW CHAT ICON */}

                        <button
                            type="button"
                            aria-label="New chat"
                            className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-all duration-150 cursor-pointer"
                            onClick={handleNewChat}
                        >
                            <PenSquare
                                size={14}
                            />
                        </button>

                    </div>

                    {/* NEW CHAT */}

                    <div className="px-4 pt-4 pb-1">

                        <button
                            type="button"
                            className="w-full flex items-center justify-center gap-2 text-sm font-medium text-slate-200 bg-white/[0.055] border border-white/[0.08] rounded-xl py-[10px] cursor-pointer hover:bg-white/[0.09] hover:border-white/[0.12] transition-all duration-150 active:scale-[0.98]"
                            onClick={handleNewChat}
                        >
                            <Plus size={15} />
                            New Chat
                        </button>

                    </div>

                    {/* RECENTS LABEL */}

                    {conversations.length === 0 ? (
                        <div className="px-5 pt-4 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-slate-600">
                            No Recent Conversations
                        </div>
                    ) : (
                        <div className="px-5 pt-4 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-slate-600">
                            Recents
                        </div>
                    )}

                    {/* CONVERSATIONS */}

                    <div className="flex-1 min-h-0 overflow-y-auto px-2.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                        {conversations.map((conv) => {

                            const isActive =
                                selectedConversation?._id ===
                                conv?._id;

                            return (
                                <div
                                    key={conv._id}
                                    onClick={() =>
                                        handleSelectConversation(
                                            conv
                                        )
                                    }
                                    className={`flex items-center gap-2.5 cursor-pointer mb-0.5 px-3 py-2.5 rounded-[10px] border transition-all duration-150 ${
                                        isActive
                                            ? "bg-white/[0.06] border-white/[0.08]"
                                            : "bg-transparent border-transparent hover:bg-white/[0.035]"
                                    }`}
                                >

                                    <div
                                        className={`flex items-center justify-center shrink-0 w-[28px] h-[28px] rounded-lg transition-all duration-150 ${
                                            isActive
                                                ? "bg-white/[0.08] text-slate-200"
                                                : "bg-white/[0.04] text-slate-500"
                                        }`}
                                    >
                                        <MessageSquare
                                            size={13}
                                        />
                                    </div>

                                    <span
                                        className={`text-[13px] font-medium truncate min-w-0 ${
                                            isActive
                                                ? "text-slate-100"
                                                : "text-slate-300"
                                        }`}
                                    >
                                        {conv?.title ||
                                            "New Chat"}
                                    </span>

                                </div>
                            );
                        })}

                    </div>

                    {/* DIVIDER */}

                    <div className="mx-2.5 h-px bg-white/[0.06]" />

                    {/* USER */}

                    <div className="px-3.5 py-3.5">

                        {userData ? (

                            <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 hover:bg-white/[0.05] transition-all duration-150">

                                <div className="relative shrink-0">

                                    {userData?.avatar &&
                                    !imageError ? (
                                        <img
                                            className="w-9 h-9 rounded-[10px] object-cover border border-white/[0.10]"
                                            src={
                                                userData.avatar
                                            }
                                            alt="profile"
                                            onError={() =>
                                                setImageError(
                                                    true
                                                )
                                            }
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-[10px] bg-white/[0.06] flex items-center justify-center">
                                            <User
                                                size={15}
                                                className="text-slate-400"
                                            />
                                        </div>
                                    )}

                                </div>

                                <div className="flex-1 min-w-0">

                                    <p className="text-[13.5px] font-semibold text-slate-100 truncate">
                                        {userData?.name ||
                                            "user"}
                                    </p>

                                    <p className="text-[11px] text-slate-600 mt-px">
                                        {userData?.plan
                                            ? `${userData.plan.charAt(0).toUpperCase()}${userData.plan.slice(1)} Plan`
                                            : "Free Plan"}
                                    </p>

                                </div>

                                <div className="flex gap-1">

                                    {/* BILLING */}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowBilling(
                                                true
                                            )
                                        }
                                        className="flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-slate-500 hover:bg-white/[0.08] hover:text-slate-200 transition-all duration-150 cursor-pointer"
                                    >
                                        <Coins
                                            size={16}
                                        />
                                    </button>

                                    {/* LOGOUT */}

                                    <button
                                        type="button"
                                        className="flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-slate-500 cursor-pointer hover:bg-white/[0.08] hover:text-slate-200 transition-all duration-150"
                                        onClick={() => {
                                            logOut();

                                            dispatch(
                                                setUserdata(
                                                    null
                                                )
                                            );

                                            onMobileClose();
                                        }}
                                    >
                                        <LogOut
                                            size={16}
                                        />
                                    </button>

                                </div>

                            </div>

                        ) : (
                            <button>
                                Login
                            </button>
                        )}

                    </div>

                </div>

                {/* BILLING DRAWER */}

                <BillingDrawer
                    open={showBilling}
                    onClose={() =>
                        setShowBilling(false)
                    }
                />

            </div>
        </>
    );
}

export default SideBar;