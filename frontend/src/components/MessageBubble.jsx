import React, { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

function normalizeContent(content) {
    if (
        content === null ||
        content === undefined
    ) {
        return "";
    }

    if (typeof content === "string") {
        return content;
    }

    if (
        typeof content === "number" ||
        typeof content === "boolean"
    ) {
        return String(content);
    }

    if (Array.isArray(content)) {
        return content
            .map((item) =>
                normalizeContent(item)
            )
            .filter(Boolean)
            .join("\n");
    }

    if (typeof content === "object") {
        if (
            typeof content.content ===
            "string"
        ) {
            return content.content;
        }

        if (
            typeof content.response ===
            "string"
        ) {
            return content.response;
        }

        if (
            typeof content.text ===
            "string"
        ) {
            return content.text;
        }

        if (
            typeof content.message ===
            "string"
        ) {
            return content.message;
        }

        if (
            typeof content.answer ===
            "string"
        ) {
            return content.answer;
        }

        return "";
    }

    return "";
}
function SearchImage({ src, index }) {
    const [failed, setFailed] = useState(false);

    if (
        !src ||
        typeof src !== "string" ||
        failed
    ) {
        return null;
    }

    return (
        <div className="w-[130px] h-[130px] sm:w-[190px] sm:h-[190px] rounded-xl overflow-hidden border border-white/[0.08] bg-[#202428] flex-shrink-0">
            <img
                src={src}
                alt={`Search result ${index + 1}`}
                loading="lazy"
                referrerPolicy="no-referrer"
                onLoad={() => {
                    console.log(
                        "✅ IMAGE LOADED:",
                        src
                    );
                }}
                onError={() => {
                    console.log(
                        "❌ IMAGE FAILED:",
                        src
                    );
                    setFailed(true);
                }}
                className="w-full h-full object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
            />
        </div>
    );
}

function MessageBubble({
    role,
    content,
    images = []
}) {
    const isUser = role === "user";

    const messageText =
        normalizeContent(content);

const safeImages = Array.isArray(images)
    ? images
          .map((img) => {
              if (
                  typeof img === "string" &&
                  img.trim().length > 0
              ) {
                  return img;
              }

              if (
                  img &&
                  typeof img === "object"
              ) {
                  return (
                      img.url ||
                      img.image_url ||
                      img.imageUrl ||
                      img.src ||
                      null
                  );
              }

              return null;
          })
          .filter(Boolean)
    : [];
    if (!isUser) {
        console.log(
            "🖼️ MESSAGE BUBBLE IMAGES:",
            safeImages
        );
    }

    return (
        <div className="w-full min-w-0">

            {isUser ? (
                <div className="flex justify-end min-w-0">

                    <div className="max-w-[90%] sm:max-w-[55%] rounded-2xl bg-[#292d32] px-3.5 sm:px-4 py-3 text-[14px] leading-6 text-[#f3f4f6] border border-white/[0.04] break-words">
                        <p className="whitespace-pre-wrap break-words">
                            {messageText}
                        </p>
                    </div>

                </div>
            ) : (
                <div className="flex justify-start min-w-0">

                    <div className="w-full max-w-full sm:max-w-[720px] min-w-0 overflow-hidden rounded-[14px] bg-[#16191c] border border-white/[0.06] border-l-2 border-l-[#3b4148] px-3.5 sm:px-5 py-4 shadow-[0_4px_18px_rgba(0,0,0,0.12)]">

                        {/* SEARCH IMAGES */}
 {safeImages.length > 0 && (
    <div className="flex flex-wrap gap-2 mb-5 max-w-full items-start">
        {safeImages.map((img, index) => (
            <SearchImage
                key={`${img}-${index}`}
                src={img}
                index={index}
            />
        ))}
    </div>
)}

                        {/* MARKDOWN RESPONSE */}
                        <div className="break-words overflow-hidden text-[14px] leading-7 text-[#d4d7db]">

                            <Markdown
                                remarkPlugins={[
                                    remarkGfm
                                ]}
                                components={{
                                    h1: ({
                                        children
                                    }) => (
                                        <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 break-words">
                                            {
                                                children
                                            }
                                        </h1>
                                    ),

                                    h2: ({
                                        children
                                    }) => (
                                        <h2 className="text-lg sm:text-xl font-semibold text-white mt-6 mb-3 break-words">
                                            {
                                                children
                                            }
                                        </h2>
                                    ),

                                    h3: ({
                                        children
                                    }) => (
                                        <h3 className="text-base sm:text-lg font-semibold text-white mt-5 mb-2 break-words">
                                            {
                                                children
                                            }
                                        </h3>
                                    ),

                                    p: ({
                                        children
                                    }) => (
                                        <p className="mb-4 last:mb-0 break-words">
                                            {
                                                children
                                            }
                                        </p>
                                    ),

                                    ul: ({
                                        children
                                    }) => (
                                        <ul className="list-disc ml-4 sm:ml-6 mb-4 space-y-1">
                                            {
                                                children
                                            }
                                        </ul>
                                    ),

                                    ol: ({
                                        children
                                    }) => (
                                        <ol className="list-decimal ml-4 sm:ml-6 mb-4 space-y-1">
                                            {
                                                children
                                            }
                                        </ol>
                                    ),

                                    li: ({
                                        children
                                    }) => (
                                        <li className="pl-1 break-words">
                                            {
                                                children
                                            }
                                        </li>
                                    ),

                                    table: ({
                                        children
                                    }) => (
                                        <div className="overflow-x-auto max-w-full my-5">
                                            <table className="w-full min-w-[520px] border-collapse text-xs sm:text-sm">
                                                {
                                                    children
                                                }
                                            </table>
                                        </div>
                                    ),

                                    thead: ({
                                        children
                                    }) => (
                                        <thead className="bg-[#24282d]">
                                            {
                                                children
                                            }
                                        </thead>
                                    ),

                                    th: ({
                                        children
                                    }) => (
                                        <th className="border border-[#3a3f45] px-2 sm:px-4 py-2 text-left font-semibold text-white">
                                            {
                                                children
                                            }
                                        </th>
                                    ),

                                    td: ({
                                        children
                                    }) => (
                                        <td className="border border-[#3a3f45] px-2 sm:px-4 py-2 text-[#d4d7db]">
                                            {
                                                children
                                            }
                                        </td>
                                    ),

                                    blockquote: ({
                                        children
                                    }) => (
                                        <blockquote className="border-l-4 border-[#555b63] pl-3 sm:pl-4 my-4 text-[#aeb4bb] break-words">
                                            {
                                                children
                                            }
                                        </blockquote>
                                    ),

                                    code({
                                        className,
                                        children,
                                        ...props
                                    }) {
                                        return (
                                            <code
                                                className={`rounded bg-[#25292e] px-1.5 py-0.5 text-[#e5e7eb] break-words ${
                                                    className ||
                                                    ""
                                                }`}
                                                {...props}
                                            >
                                                {
                                                    children
                                                }
                                            </code>
                                        );
                                    },

                                    pre: ({
                                        children
                                    }) => (
                                        <pre className="max-w-full overflow-x-auto rounded-xl bg-[#0d0f11] border border-white/[0.06] p-3 sm:p-4 my-5 text-[12px] sm:text-[13px] leading-6">
                                            {
                                                children
                                            }
                                        </pre>
                                    ),

                                    hr: () => (
                                        <hr className="my-6 border-[#30353b]" />
                                    )
                                }}
                            >
                                {messageText}
                            </Markdown>

                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}

export default MessageBubble;