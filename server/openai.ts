import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface PlantIdentificationResult {
  scientificName: string;
  commonName: string;
  family: string;
  origin: string;
  lightRequirements: string;
  watering: string;
  specialFeatures: string;
  confidence: number;
}

export async function identifyPlantWithAI(imageData: string, aromaLevel?: number): Promise<PlantIdentificationResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional botanist, tree and plant identification expert. Analyze the leaf in the image and provide detailed information in JSON format of what plant, shrub or tree it belongs to. The image was taken in the UK. If you cannot identify it with reasonable confidence, still provide your best guess but lower the confidence score accordingly.

Response format:
{
  "scientificName": "Scientific name of the tree or plant",
  "commonName": "Common name of the tree or plant",
  "family": "tree or Plant family",
  "origin": "Geographic origin",
  "lightRequirements": "Light requirements description",
  "watering": "Watering instructions",
  "specialFeatures": "Notable characteristics or care tips",
  "confidence": number between 1-100
}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please identify this tree, shrub or plant and provide details about it.${aromaLevel !== undefined ? ` The user rated the leaf's aroma intensity as ${aromaLevel}/10 (where 0 is no smell and 10 is very strong). Consider this aroma information in your identification and include relevant scent-related details in the specialFeatures if applicable.` : ""}`
            },
            {
              type: "image_url",
              image_url: {
                url: imageData
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate and sanitize the response
    return {
      scientificName: result.scientificName || "Unknown species",
      commonName: result.commonName || "Unknown plant",
      family: result.family || "Unknown family",
      origin: result.origin || "Unknown origin",
      lightRequirements: result.lightRequirements || "Bright, indirect light",
      watering: result.watering || "Water when soil is dry",
      specialFeatures: result.specialFeatures || "No special features noted",
      confidence: Math.max(1, Math.min(100, result.confidence || 50))
    };
  } catch (error) {
    console.error("OpenAI plant identification error:", error);
    throw new Error("Failed to identify plant. Please try again.");
  }
}