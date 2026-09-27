import axios from "axios";

import { getModel } from "../config/llmModel.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { getFromS3 } from "../utils/getFromS3.js";
import { checkAgentLimit } from "../config/agentLimit.js";


export const visionAgent = async (state) => {

  try {

    // ========================================
    // 1. VALIDATE PROMPT
    // ========================================

    if (
      !state.prompt ||
      typeof state.prompt !== "string" ||
      !state.prompt.trim()
    ) {
      throw new Error(
        "Image generation prompt is missing."
      );
    }


    // ========================================
    // 2. CHECK IMAGE RATE LIMIT
    // ========================================

    await checkAgentLimit(
      state.userId,
      "image"
    );


    // ========================================
    // 3. GET IMAGE PROMPT MODEL
    // ========================================

    const llm =
      await getModel("image");


    // ========================================
    // 4. CREATE DETAILED IMAGE PROMPT
    // ========================================

    const res =
      await llm.invoke(`
You are an expert AI image prompt engineer.

Your job is to transform the user's simple image request into a highly
detailed, production-quality prompt for an AI image generation model.

User Request:
${state.prompt}

Create a visually rich prompt that clearly describes:

- Main subject and its appearance
- Environment and background
- Composition and framing
- Camera angle and perspective
- Lighting and shadows
- Mood and atmosphere
- Colors and visual style
- Important objects and details
- Depth and spatial relationships
- Realistic textures and materials
- Appropriate camera/lens characteristics when relevant

Quality requirements:
- Cinematic lighting
- Professional composition
- Ultra realistic
- Highly detailed
- Photorealistic when appropriate
- Natural colors
- Sharp subject focus
- Realistic textures
- Realistic shadows and reflections
- Depth of field
- Professional photography
- High dynamic range
- Visually balanced composition
- 8K-quality detail

Do not add explanations, headings, markdown, or commentary.

Return ONLY the final image-generation prompt.
`);


    // ========================================
    // 5. EXTRACT GENERATED PROMPT
    // ========================================

    const prompt =
      typeof res?.content === "string"
        ? res.content.trim()
        : "";


    if (!prompt) {

      throw new Error(
        "Image generation prompt could not be created."
      );

    }


    // ========================================
    // 6. CREATE IMAGE GENERATION URL
    // ========================================

    const imageUrl =
      `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}` +
      `?model=flux&width=1024&height=1024`;


    // ========================================
    // 7. GENERATE IMAGE
    // ========================================

    const imageRes =
      await axios.get(
        imageUrl,
        {
          responseType: "arraybuffer",

          timeout: 120000,

          headers: {
            Authorization:
              `Bearer ${process.env.POLLINATIONS_API_KEY}`,
          },
        }
      );


    if (!imageRes.data) {

      throw new Error(
        "Image generation returned empty data."
      );

    }


    // ========================================
    // 8. CONVERT RESPONSE TO BUFFER
    // ========================================

    const buffer =
      Buffer.from(
        imageRes.data
      );


    // ========================================
    // 9. CREATE FILE NAME
    // ========================================

    const filename =
      `image-${Date.now()}.png`;


    // ========================================
    // 10. UPLOAD TO S3
    // ========================================

    await uploadToS3(
      filename,
      buffer,
      "image/png"
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
    // 12. RETURN RESPONSE
    // ========================================

    return {

      ...state,

      // Frontend uses this to render image
      images: [
        downloadUrl
      ],

      // Keep image URL out of aiResponse
      aiResponse:
        `[Download Image](${downloadUrl})`

    };


  } catch (error) {

    // ========================================
    // ERROR HANDLING
    // ========================================

    console.error(
      "Vision Agent Error:",
      error.response?.data ||
      error.message ||
      error
    );


    // IMPORTANT:
    // Pass the error upward instead of converting
    // every failure into a normal successful state.

    throw error;

  }

};