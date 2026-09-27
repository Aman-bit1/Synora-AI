import {
    Code2,
    Copy,
    PanelRightClose,
    PanelRightOpen,
} from "lucide-react";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";

function Artifact() {
    const [collapsed, setCollapsed] = useState(false);
    const [tab, setTab] = useState("code");
    const [activeFile, setActiveFile] = useState(0);

    const { artifacts } = useSelector(
        (state) => state.message
    );

    /*
     * Do not render anything when there is no artifact.
     * This removes the empty black right panel completely.
     */
    if (!artifacts || artifacts.length === 0) {
        return null;
    }

    const files = artifacts[0]?.files || [];

    if (files.length === 0) {
        return null;
    }

    /*
     * Make sure activeFile never points to a file
     * that does not exist after a new artifact arrives.
     */
    useEffect(() => {
        if (activeFile >= files.length) {
            setActiveFile(0);
        }
    }, [files.length, activeFile]);

    const currentFile =
        files[activeFile]?.content || "";

    const htmlFile = files.find(
        (file) => file.name === "index.html"
    );

    const cssFile = files.find(
        (file) => file.name === "style.css"
    );

    const jsFile = files.find(
        (file) => file.name === "script.js"
    );

    const previewDoc = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    />

    <style>
        ${cssFile?.content || ""}
    </style>
</head>

<body>
    ${htmlFile?.content || ""}

    <script>
        ${jsFile?.content || ""}
    <\/script>
</body>
</html>
`;

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(
                currentFile
            );
        } catch (error) {
            console.error(
                "Failed to copy code:",
                error
            );
        }
    };

    return (
        <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{
                width: collapsed ? 52 : 420,
                opacity: 1,
            }}
            transition={{
                duration: 0.25,
                ease: "easeInOut",
            }}
            className="hidden lg:flex h-full border-l border-white/[0.06] bg-[#0d0f14] flex-col overflow-hidden shrink-0"
        >
            {collapsed ? (
                /*
                 * COLLAPSED STATE
                 */
                <div className="h-full w-[52px] flex flex-col items-center pt-4">
                    <button
                        type="button"
                        onClick={() =>
                            setCollapsed(false)
                        }
                        title="Open artifact panel"
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
                    >
                        <PanelRightOpen size={17} />
                    </button>
                </div>
            ) : (
                /*
                 * EXPANDED STATE
                 */
                <>
                    {/* HEADER */}
                    <div className="h-14 px-4 border-b border-white/[0.06] flex items-center gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={() =>
                                setCollapsed(true)
                            }
                            title="Collapse artifact panel"
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
                        >
                            <PanelRightClose size={17} />
                        </button>

                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                                <Code2
                                    size={13}
                                    className="text-indigo-400"
                                />
                            </div>

                            <div className="text-[13px] font-medium text-slate-200 truncate">
                                {artifacts[0]?.type ||
                                    "Project"}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={copyCode}
                            title="Copy current file"
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
                        >
                            <Copy size={14} />
                        </button>
                    </div>

                    {/* CODE / PREVIEW */}
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] shrink-0">
                        <button
                            type="button"
                            onClick={() =>
                                setTab("code")
                            }
                            className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
                                tab === "code"
                                    ? "bg-indigo-500 text-white"
                                    : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]"
                            }`}
                        >
                            Code
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setTab("preview")
                            }
                            disabled={!htmlFile}
                            className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
                                tab === "preview"
                                    ? "bg-indigo-500 text-white"
                                    : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]"
                            } ${
                                !htmlFile
                                    ? "opacity-40 cursor-not-allowed"
                                    : ""
                            }`}
                        >
                            Preview
                        </button>
                    </div>

                    {/* FILE TABS */}
                    {tab === "code" && (
                        <div className="flex border-b border-white/[0.06] overflow-x-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {files.map(
                                (file, index) => (
                                    <button
                                        type="button"
                                        key={
                                            file.name ||
                                            index
                                        }
                                        onClick={() =>
                                            setActiveFile(
                                                index
                                            )
                                        }
                                        className={`relative px-4 py-3 text-[11px] font-medium whitespace-nowrap border-r border-white/[0.05] transition-colors ${
                                            activeFile ===
                                            index
                                                ? "text-indigo-400 bg-indigo-500/[0.06]"
                                                : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
                                        }`}
                                    >
                                        {file.name}

                                        {activeFile ===
                                            index && (
                                            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500" />
                                        )}
                                    </button>
                                )
                            )}
                        </div>
                    )}

                    {/* CONTENT */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                        {tab === "code" ? (
                            <motion.div
                                key="code"
                                initial={{
                                    opacity: 0,
                                }}
                                animate={{
                                    opacity: 1,
                                }}
                                transition={{
                                    duration: 0.15,
                                }}
                                className="w-full h-full overflow-auto"
                            >
                                <pre className="m-0 p-5 text-[12px] leading-6 text-slate-300 font-mono whitespace-pre overflow-auto">
                                    {currentFile}
                                </pre>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="preview"
                                initial={{
                                    opacity: 0,
                                }}
                                animate={{
                                    opacity: 1,
                                }}
                                transition={{
                                    duration: 0.15,
                                }}
                                className="w-full h-full bg-white overflow-hidden"
                            >
                                <iframe
                                    title="Generated project preview"
                                    srcDoc={previewDoc}
                                    sandbox="allow-scripts"
                                    className="block w-full h-full border-0"
                                />
                            </motion.div>
                        )}
                    </div>
                </>
            )}
        </motion.div>
    );
}

export default Artifact;