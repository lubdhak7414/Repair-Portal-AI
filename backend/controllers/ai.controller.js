import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getDiagnosis = async (req, res) => {
  const concisePrompt = `
You are a professional repair technician.

Based on the issue described (and optionally images), provide a short but clear diagnosis response in the following structured JSON format:

{
  "diagnosis": "Short clear summary (1-2 sentences max)",
  "estimatedCost": {
    "range": "$50 - $100",
    "notes": "Short explanation (if needed)"
  },
  "urgency": "low | medium | high | emergency",
  "requiredItems": {
    "tools": ["tool1", "tool2"],
    "parts": ["part1", "part2"]
  },
  "difficulty": "DIY | Professional Required | Specialist Required",
  "estimatedTime": {
    "diy": "2 hours",
    "professional": "1 hour"
  },
  "safetyConcerns": ["Short bullet points (if any)"],
  "preventiveTips": ["One or two short tips"]
}

Respond only with valid JSON. No intro, no Markdown, no explanation.
`;

  try {
    const { description, images } = req.body;

    if (!description && (!images || images.length === 0)) {
      return res.status(400).json({
        message: "Please provide either a description or images for diagnosis"
      });
    }

    let model, contents;

    if (images && images.length > 0) {
      model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
      console.log('Using multimodal model: gemini-2.5-pro');

      const parts = [
        {
          text: `Problem Description: ${description || "N/A"}`
        },
        ...images.map(image => ({
          inline_data: {
            data: image.split(',')[1],
            mime_type: "image/jpeg"
          }
        })),
        { text: concisePrompt }
      ];

      contents = [{ role: "user", parts }];
    } else {
      model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      console.log('Using text-only model: gemini-2.5-flash');

      contents = [
        {
          role: "user",
          parts: [
            {
              text: `Problem Description: ${description}\n\n${concisePrompt}`
            }
          ]
        }
      ];
    }

    const result = await model.generateContent({ contents });

    if (!result?.response?.text) {
      throw new Error("Invalid response from AI model");
    }

    const rawText = result.response.text();

    let diagnosis;
    try {
      const jsonString = rawText.replace(/```json\s*|```\s*/g, '');
      diagnosis = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Raw response text:', rawText);

      diagnosis = {
        diagnosis: rawText.slice(0, 200),
        estimatedCost: {
          range: "Contact technician",
          notes: "Could not parse response"
        },
        urgency: "medium",
        requiredItems: {
          tools: [],
          parts: []
        },
        difficulty: "Professional Required",
        estimatedTime: {
          diy: "1-3 hours",
          professional: "1 hour"
        },
        safetyConcerns: [],
        preventiveTips: []
      };
    }

    res.status(200).json({
      message: "Diagnosis generated successfully",
      diagnosis
    });

  } catch (error) {
    console.error("AI Diagnosis Error:", error);
    res.status(500).json({
      message: "Failed to generate diagnosis. Please try again."
    });
  }
};
