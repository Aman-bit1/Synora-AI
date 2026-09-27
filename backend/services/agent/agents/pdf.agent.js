import { checkAgentLimit } from "../config/agentLimit.js";
import { getModel } from "../config/llmModel.js";

import generatePdf from "../utils/generatePdf.js";
import { getFromS3 } from "../utils/getFromS3.js";

import { uploadToS3 } from "../utils/uploadToS3.js";


export const pdfAgent = async (state) => {

  try {

    // ========================================
    // 1. CHECK PDF RATE LIMIT
    // ========================================

    await checkAgentLimit(
      state.userId,
      "pdf"
    );


    // ========================================
    // 2. GET LLM
    // ========================================

    const llm = await getModel("pdf");


    // ========================================
    // 3. CREATE PROMPT
    // ========================================

    const prompt = `
You are an expert document writer.

Return ONLY valid JSON.
Do NOT return markdown.
Do NOT return explanations.

Structure:

{
  "title": "",
  "subtitle": "",
  "sections": [
    {
      "heading": "",
      "points": []
    }
  ]
}

Generate 4-8 sections.
Each section should have 3-6 concise bullet points.

Topic:
${state.prompt}
`;


    // ========================================
    // 4. CALL LLM
    // ========================================

    const res = await llm.invoke(prompt);


    // ========================================
    // 5. PARSE LLM RESPONSE
    // ========================================

    const data =
      typeof res.content === "string"
        ? JSON.parse(res.content)
        : res.content;


    // ========================================
    // 6. GENERATE PDF
    // ========================================

    const pdfBuffer =
      await generatePdf(data);


    // ========================================
    // 7. CREATE FILE NAME
    // ========================================

    const filename =
      `pdf-${Date.now()}.pdf`;


    // ========================================
    // 8. UPLOAD TO S3
    // ========================================

    await uploadToS3(
      filename,
      pdfBuffer,
      "application/pdf"
    );


    // ========================================
    // 9. CREATE PRESIGNED URL
    // ========================================

    const downloadUrl =
      await getFromS3(
        filename,
        10 * 60
      );


    // ========================================
    // 10. RETURN SUCCESS
    // ========================================

    return {

      ...state,

      aiResponse: `# PDF Generated

**${data.title}**

📄 [Download PDF](${downloadUrl})

_Link expires in 10 minutes._`

    };


  } catch (error) {

    // ========================================
    // ERROR HANDLING
    // ========================================

    console.error(
      "PDF generation error:",
      error
    );


    return {

      ...state,

      aiResponse:
        error?.data?.message ||
        error?.message ||
        "Failed to generate PDF."

    };
  }
};