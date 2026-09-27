import { getModel } from "../config/llmModel.js";

export const router = async (state) => {
  try {
    // If user manually selected an agent, don't route with the LLM
    if (state.agent && state.agent !== "auto") {
      return {
        ...state,
        agent: state.agent,
      };
    }
   if (state.file?.mimetype === "application/pdf") {
    return {
        ...state,
        agent: "pdfRag"
    };
}

if (state.file?.mimetype?.startsWith("image/")) {
    return {
        ...state,
        agent: "imageAnalyzer"
    };
}

    const prompt = `
You are an agent router.

Choose exactly ONE agent for the user's request.

Available agents:

- chat
- search
- coding
- pdf
- ppt
- vision

Rules:

chat:
- General conversation
- Explanations
- Learning questions
- Casual questions

search:
- Current events
- Latest information
- News
- Recent developments
- Internet lookup
- Weather or other live/current information

coding:
- Generate code
- Debug code
- Fix code
- Build software
- Programming questions
- API design
- System architecture

pdf:
- Generate a PDF
- Read, analyze, summarize, or work with PDF documents

ppt:
- Generate a PowerPoint
- Read, analyze, summarize, or work with PPT/PPTX files

vision:
- Generate an image
- Create an image
- Make an image
- Draw an image
- Create a picture
- Generate a picture
- Create artwork
- Generate artwork
- Generate a photo
- Create a photo
- Generate a wallpaper
- Image generation requests
- Analyze an existing image
- Understand visual content
- Image-related tasks

IMPORTANT:
Any request asking to create, generate, make, draw, or produce an image must be classified as vision.

Return ONLY one word from this list:

chat
search
coding
pdf
ppt
vision

User Query:
${state.prompt}
`;

    const llm = await getModel("router");
    const response = await llm.invoke(prompt);

    const agent = response.content
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, "");

    const validAgents = [
      "chat",
      "search",
      "coding",
      "pdf",
      "ppt",
      "vision",
    ];

    if (!validAgents.includes(agent)) {
      console.log("Invalid router response:", response.content);

      return {
        ...state,
        agent: "chat",
      };
    }

    console.log("Router selected:", agent);

    return {
      ...state,
      agent,
    };
  } catch (error) {
    console.error("Router Error:", error);

    return {
      ...state,
      agent: "chat",
    };
  }
};