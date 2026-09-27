import { checkAgentLimit } from "../config/agentLimit.js";
import { getModel } from "../config/llmModel.js";

import generatePpt from "../utils/generatePpt.js";
import { getFromS3 } from "../utils/getFromS3.js";
import { uploadToS3 } from "../utils/uploadToS3.js";


// Parse JSON returned by the LLM
const parseModelJson = (content) => {

  let text = "";

  if (typeof content === "string") {

    text = content;

  } else if (Array.isArray(content)) {

    text = content
      .map((item) => {

        if (typeof item === "string") {
          return item;
        }

        return item?.text || "";

      })
      .join("");

  } else {

    return content;
  }


  // Remove markdown code fences
  text = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();


  // Find JSON object
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");


  if (
    start === -1 ||
    end === -1 ||
    end <= start
  ) {

    throw new Error(
      "LLM did not return valid JSON."
    );
  }


  return JSON.parse(
    text.slice(start, end + 1)
  );
};


// PPT Agent
export const pptAgent = async (state) => {

  try {

    // ========================================
    // 1. CHECK PPT RATE LIMIT
    // ========================================

    await checkAgentLimit(
      state.userId,
      "ppt"
    );


    // ========================================
    // 2. GET LLM MODEL
    // ========================================

    let llm;

    try {

      llm = await getModel("ppt");

    } catch (error) {

      console.log(
        "PPT model unavailable, using chat model."
      );

      llm = await getModel("chat");
    }


    // ========================================
    // 3. VALIDATE LLM
    // ========================================

    if (
      !llm ||
      typeof llm.invoke !== "function"
    ) {

      throw new Error(
        "No valid LLM model available for PPT generation."
      );
    }


    // ========================================
    // 4. CREATE PROMPT
    // ========================================

    const prompt = `
You are an expert PowerPoint presentation designer and visual storyteller.

Create a professional, modern PowerPoint presentation.

Return ONLY valid JSON.
Do NOT return markdown.
Do NOT return explanations.

Use exactly this structure:

{
  "title": "",
  "subtitle": "",
  "author": "",
  "introduction": "",
  "agenda": [],
  "sections": [
    {
      "heading": "",
      "description": "",
      "points": []
    }
  ],
  "keyTakeaways": [],
  "thankYou": ""
}

Rules:

- Create a professional and concise title.
- Create a meaningful subtitle.
- introduction should be 2-4 concise sentences.
- agenda should contain 4-7 items.
- Generate 4-8 logical content sections.
- Every section must contain 3-6 points.
- Each point should be concise and presentation-friendly.
- Avoid large paragraphs.
- Avoid repetitive points.
- Organize the content in a logical progression.
- Use clear professional language.
- keyTakeaways should contain 3-5 important points.
- thankYou should be a short professional closing sentence.
- Do not use markdown inside JSON values.
- Return valid JSON only.

Topic:
${state.prompt}
`;


    // ========================================
    // 5. CALL LLM
    // ========================================

    const res = await llm.invoke(prompt);


    // ========================================
    // 6. PARSE LLM RESPONSE
    // ========================================

    const data = parseModelJson(
      res?.content
    );


    // ========================================
    // 7. VALIDATE PPT DATA
    // ========================================

    if (!data?.title) {

      throw new Error(
        "PPT data is missing a title."
      );
    }


    // ========================================
    // 8. GENERATE PPT BUFFER
    // ========================================

    const pptBuffer =
      await generatePpt(data);


    // ========================================
    // 9. CREATE FILE NAME
    // ========================================

    const filename =
      `ppt-${Date.now()}.pptx`;


    // ========================================
    // 10. UPLOAD PPT TO S3
    // ========================================

    await uploadToS3(
      filename,
      pptBuffer,
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );


    // ========================================
    // 11. CREATE PRESIGNED URL
    // ========================================

    const downloadUrl =
      await getFromS3(
        filename,
        10 * 60
      );


    // ========================================
    // 12. CREATE OFFICE ONLINE PREVIEW URL
    // ========================================

    const previewUrl =
      `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
        downloadUrl
      )}`;


    // ========================================
    // 13. RETURN SUCCESS
    // ========================================

    return {

      ...state,

      aiResponse: `# PPT Generated

**${data.title}**

👁️ [Preview PPT](${previewUrl})

⬇️ [Download PPT](${downloadUrl})

_Professional presentation generated by SynoraAI. Links expire in 10 minutes._`

    };


  } catch (error) {

    // ========================================
    // ERROR HANDLING
    // ========================================

    console.error(
      "PPT Agent Error:",
      error
    );


    return {

      ...state,

      aiResponse:
        error?.data?.message ||
        error?.message ||
        "Failed to generate PPT."

    };
  }
};