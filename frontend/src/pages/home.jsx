import {
    signInWithPopup
} from "firebase/auth";

import React, {
    useEffect,
    useState
} from "react";

import {
    auth,
    googleprovider
} from "../../utils/firebase";

import api from "../../utils/axios";

import {
    useDispatch,
    useSelector
} from "react-redux";

import {
    setUserdata
} from "../redux/userSlice";

import ChatArea from "../components/ChatArea";
import Sidebar from "../components/sidebar";
import Artifact from "../components/Artifact";

const App = () => {

    const dispatch = useDispatch();

    const { userData } =
        useSelector(
            (state) => state.user
        );

    const { artifacts } =
        useSelector(
            (state) => state.message
        );

    const [
        googleLoading,
        setGoogleLoading
    ] = useState(false);

    // 🔴 CHANGED:
    // Mobile sidebar state
    const [
        mobileSidebarOpen,
        setMobileSidebarOpen
    ] = useState(false);

    // 🔴 CHANGED:
    // Lock page scrolling while mobile sidebar is open
    useEffect(() => {

        if (mobileSidebarOpen) {
            document.body.style.overflow =
                "hidden";
        } else {
            document.body.style.overflow =
                "";
        }

        return () => {
            document.body.style.overflow =
                "";
        };

    }, [mobileSidebarOpen]);


    const handlelogin = async (
        token
    ) => {
        try {

            const { data } =
                await api.post(
                    "/api/auth/login",
                    { token }
                );

            dispatch(
                setUserdata(data)
            );

        } catch (error) {

            console.error(
                "Backend login error:",
                error
            );

            throw error;
        }
    };


    const googlelogin = async () => {

        if (googleLoading) {
            return;
        }

        setGoogleLoading(true);

        try {

            const result =
                await signInWithPopup(
                    auth,
                    googleprovider
                );

            const token =
                await result.user.getIdToken();

            await handlelogin(token);

        } catch (error) {

            console.error(
                "Google login error:",
                error
            );

            if (
                error.code ===
                "auth/cancelled-popup-request"
            ) {
                console.log(
                    "A Google login popup was already active."
                );
            }

            if (
                error.code ===
                "auth/popup-blocked"
            ) {
                console.log(
                    "The browser blocked the Google login popup."
                );
            }

            if (
                error.code ===
                "auth/popup-closed-by-user"
            ) {
                console.log(
                    "The Google login popup was closed."
                );
            }

        } finally {

            setGoogleLoading(false);

        }
    };


    return (
        <div className="h-[100dvh] overflow-hidden bg-[#10191A]">

            {userData ? (

                <div className="flex h-full w-full overflow-hidden">

                    {/* SIDEBAR */}
                    <Sidebar
                        mobileOpen={
                            mobileSidebarOpen
                        }
                        onMobileClose={() =>
                            setMobileSidebarOpen(
                                false
                            )
                        }
                    />

                    {/* MAIN AREA */}
                    <div className="flex-1 min-w-0 flex h-full flex-col lg:flex-row">

                        {/* CHAT */}
                        <div className="flex-1 min-w-0 min-h-0 h-full">

                            <ChatArea
                                onOpenSidebar={() =>
                                    setMobileSidebarOpen(
                                        true
                                    )
                                }
                            />

                        </div>

                        {/* ARTIFACT */}
                        {artifacts?.length > 0 && (
                            <Artifact />
                        )}

                    </div>

                </div>

            ) : (

                <div className="min-h-[100dvh] flex items-center justify-center px-4">

                    <div className="w-full max-w-[360px]">

                        <div className="text-center mb-10">

                            <h1 className="font-serif text-[2rem] leading-none tracking-tight text-[#EDEAE2]">
                                Synora
                            </h1>

                            <p className="mt-3 text-sm text-[#EDEAE2]/50">
                                Sign in to continue
                            </p>

                        </div>

                        <button
                            type="button"
                            disabled={
                                googleLoading
                            }
                            onClick={
                                googlelogin
                            }
                            className={`
                                w-full
                                flex
                                items-center
                                justify-center
                                gap-3
                                rounded-full
                                bg-[#EDEAE2]
                                px-5
                                py-3.5
                                text-sm
                                font-medium
                                text-[#10191A]
                                transition
                                focus-visible:outline
                                focus-visible:outline-2
                                focus-visible:outline-offset-2
                                focus-visible:outline-[#C99B3D]

                                ${
                                    googleLoading
                                        ? "opacity-60 cursor-not-allowed"
                                        : "hover:bg-white active:scale-[0.99] cursor-pointer"
                                }
                            `}
                        >

                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <path
                                    d="M21.35 12.23c0-.79-.07-1.55-.23-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42Z"
                                    fill="#4285F4"
                                />

                                <path
                                    d="M12 21.75c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0 0 12 21.75Z"
                                    fill="#34A853"
                                />

                                <path
                                    d="M6.54 13.85A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.26.31-1.85V7.62H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.38l3.24-2.53Z"
                                    fill="#FBBC05"
                                />

                                <path
                                    d="M12 6.12c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.17 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.7 5.37l3.24 2.53C7.31 7.84 9.46 6.12 12 6.12Z"
                                    fill="#EA4335"
                                />
                            </svg>

                            {googleLoading
                                ? "Signing in..."
                                : "Continue with Google"
                            }

                        </button>

                        <p className="mt-8 text-center text-xs leading-5 text-[#EDEAE2]/35">
                            By continuing, you agree to Synora's
                            Terms of Service and Privacy Policy.
                        </p>

                        <p className="mt-16 text-center text-xs text-[#EDEAE2]/25">
                            © 2026 Synora
                        </p>

                    </div>

                </div>

            )}

        </div>
    );
};

export default App;