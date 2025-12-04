import { Injectable, Logger } from "@nestjs/common";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConfigService } from "@nestjs/config";

export interface ProductAnalysis {
  title: string;
  description: string;
  features: string[];
  category: string;
  suggestedTags: string[];
  confidence: number;
}

@Injectable()
export class AIVisionService {
  private readonly logger = new Logger(AIVisionService.name);
  private genAI: GoogleGenerativeAI;
  private model;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY");

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      this.logger.warn(
        "⚠️  Gemini API key not configured. AI Vision features will not work."
      );
      this.logger.warn(
        "Get your free API key at: https://aistudio.google.com/app/apikey"
      );
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Use gemini-pro-vision for image analysis in v1 API
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      this.logger.log("✅ AI Vision service initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize AI Vision:", error);
    }
  }

  async analyzeProductImage(
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<ProductAnalysis> {
    if (!this.model) {
      throw new Error(
        "AI Vision not configured. Please add GEMINI_API_KEY to .env file"
      );
    }

    try {
      this.logger.log("🔍 Analyzing product image with AI Vision...");

      // Convert buffer to base64
      const base64Image = imageBuffer.toString("base64");

      // Create detailed prompt for product analysis
      const prompt = `You are an expert e-commerce product analyst. Analyze this product image and provide detailed information in JSON format.

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks, no extra text.

Required JSON structure:
{
  "title": "SEO-friendly product title (max 60 characters, catchy and descriptive)",
  "description": "Detailed product description (2-3 paragraphs, 150-200 words, persuasive and highlight benefits)",
  "features": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5"],
  "category": "main product category",
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "confidence": 0.95
}

Guidelines:
1. Title should be catchy, include key product attributes (color, material, type)
2. Description should be persuasive, professional, and SEO-optimized
3. List 5-8 key features that are visible or implied from the image
4. Suggest 5-10 relevant searchable tags
5. Confidence score (0-1) based on image clarity and recognizability
6. Make it compelling for online shoppers

Return ONLY the JSON object, nothing else.`;

      // Generate content
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
      ]);

      const response = result.response.text();
      this.logger.log("✅ AI Vision response received");

      // Parse JSON response
      const cleanedResponse = this.cleanJsonResponse(response);
      const analysis = JSON.parse(cleanedResponse);

      this.logger.log(
        `📊 Analysis confidence: ${(analysis.confidence * 100).toFixed(0)}%`
      );
      this.logger.log(`📝 Generated title: ${analysis.title}`);

      return analysis;
    } catch (error) {
      this.logger.error("❌ Failed to analyze product image:", error);
      throw new Error(`AI Vision analysis failed: ${error.message}`);
    }
  }

  async analyzeMultipleImages(
    images: Array<{ buffer: Buffer; mimeType: string }>
  ): Promise<ProductAnalysis> {
    if (!this.model) {
      throw new Error("AI Vision not configured");
    }

    try {
      this.logger.log(`🔍 Analyzing ${images.length} product images...`);

      // For multiple images, analyze the first one in detail
      const mainImage = images[0];
      const analysis = await this.analyzeProductImage(
        mainImage.buffer,
        mainImage.mimeType
      );

      // Could enhance with additional images in the future
      if (images.length > 1) {
        this.logger.log(
          `ℹ️  Using first image as primary (${images.length} total images)`
        );
      }

      return analysis;
    } catch (error) {
      this.logger.error("Failed to analyze multiple images:", error);
      throw error;
    }
  }

  async generateAlternativeTitles(
    currentTitle: string,
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<string[]> {
    if (!this.model) {
      throw new Error("AI Vision not configured");
    }

    try {
      const base64Image = imageBuffer.toString("base64");

      const prompt = `Current product title: "${currentTitle}"

Based on this product image, generate 5 alternative SEO-friendly product titles. Each should:
- Be unique and catchy
- Include key product attributes
- Be 40-60 characters
- Be optimized for search engines

Return as JSON array: ["title1", "title2", "title3", "title4", "title5"]
Return ONLY the JSON array, no markdown, no extra text.`;

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
      ]);

      const response = this.cleanJsonResponse(result.response.text());
      return JSON.parse(response);
    } catch (error) {
      this.logger.error("Failed to generate alternative titles:", error);
      throw error;
    }
  }

  async enhanceDescription(
    currentDescription: string,
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<string> {
    if (!this.model) {
      throw new Error("AI Vision not configured");
    }

    try {
      const base64Image = imageBuffer.toString("base64");

      const prompt = `Current product description: "${currentDescription}"

Based on the product image, enhance this description to:
- Make it more persuasive and engaging
- Add sensory details visible in the image
- Highlight unique selling points
- Optimize for SEO
- Keep it 150-250 words
- Make it professional and compelling

Return only the enhanced description text, no extra formatting.`;

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
      ]);

      return result.response.text().trim();
    } catch (error) {
      this.logger.error("Failed to enhance description:", error);
      throw error;
    }
  }

  private cleanJsonResponse(response: string): string {
    // Remove markdown code blocks if present
    let cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();

    // Try to extract JSON if there's extra text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    return cleaned;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.model) {
      return {
        success: false,
        message: "AI Vision not configured. Add GEMINI_API_KEY to .env",
      };
    }

    try {
      const result = await this.model.generateContent([
        'Say "AI Vision is working!"',
      ]);
      const response = result.response.text();

      return {
        success: response.includes("working"),
        message: response.includes("working")
          ? "✅ AI Vision is working!"
          : "⚠️  AI Vision connection issue",
      };
    } catch (error) {
      this.logger.error("AI Vision test failed:", error);
      return {
        success: false,
        message: `❌ AI Vision test failed: ${error.message}`,
      };
    }
  }

  isConfigured(): boolean {
    return !!this.model;
  }
}
