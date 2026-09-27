import { createSlice } from "@reduxjs/toolkit"

const conversationSlice = createSlice({
    name: "conversation",

    initialState: {
        conversations: [],
        selectedConversation: null
    },

    reducers: {
        setConversations: (state, action) => {
            state.conversations = action.payload
        },

        addConversation: (state, action) => {
            state.conversations.unshift(action.payload)
        },

        replaceConversation: (state, action) => {
            const { tempId, conversation } = action.payload

            const index = state.conversations.findIndex(
                (conv) => conv._id === tempId
            )

            if (index !== -1) {
                state.conversations[index] = conversation
            }

            // IMPORTANT:
            // Do NOT change selectedConversation here.
            //
            // The temporary conversation must remain selected
            // until the message request has completed.
        },

        clearJustCreated: (state, action) => {
            const conversationId = action.payload

            state.conversations = state.conversations.map((conv) =>
                conv._id === conversationId
                    ? { ...conv, justCreated: false }
                    : conv
            )

            if (
                state.selectedConversation?._id === conversationId
            ) {
                state.selectedConversation = {
                    ...state.selectedConversation,
                    justCreated: false
                }
            }
        },

        removeConversation: (state, action) => {
            const conversationId = action.payload

            state.conversations = state.conversations.filter(
                (conv) => conv._id !== conversationId
            )

            if (
                state.selectedConversation?._id === conversationId
            ) {
                state.selectedConversation = null
            }
        },

        setSelectedConversation: (state, action) => {
            state.selectedConversation = action.payload
        },

        setConvTitle: (state, action) => {
            const { title, conversationId } = action.payload

            state.conversations = state.conversations.map((conv) =>
                conv._id === conversationId
                    ? { ...conv, title }
                    : conv
            )

            if (
                state.selectedConversation?._id ===
                conversationId
            ) {
                state.selectedConversation = {
                    ...state.selectedConversation,
                    title
                }
            }
        }
    }
})

export const {
    setConversations,
    addConversation,
    replaceConversation,
    clearJustCreated,
    removeConversation,
    setSelectedConversation,
    setConvTitle
} = conversationSlice.actions

export default conversationSlice.reducer