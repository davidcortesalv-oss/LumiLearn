
import { GoogleGenAI } from "@google/genai";
import { GeneratedVideo, VideoMetadata, VideoScene } from '../types';

// Helper to get a fresh instance with the current API key
const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- ELEVENLABS TTS SERVICE ---
export const generateAudioFromText = async (text: string): Promise<string | null> => {
  const ELEVEN_API_KEY = ""; // API Key removed
  const ELEVEN_VOICE_ID = "sDuUJMeNJR828mXTRrDh";

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVEN_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v2", // Better for longer texts and languages
          voice_settings: {
            stability: 0.40,
            similarity_boost: 0.75
          }
        })
      }
    );

    if (!response.ok) {
        throw new Error(`ElevenLabs API Error: ${response.statusText}`);
    }

    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

// --- IMAGE GENERATION SERVICE (OPENAI DALL-E 3 - For Story Mode Sketches) ---
const OPENAI_API_KEY = ""; // API Key removed

export const generateIllustration = async (prompt: string): Promise<string | null> => {
  // STYLE DEFINITION: Strict "Notebook/Sketch" style
  const stylePrompt = `
    I need a specific style of illustration: A HAND-DRAWN SKETCH on WHITE PAPER.
    
    VISUAL REQUIREMENTS:
    1. Background: Pure WHITE paper texture. No dark backgrounds.
    2. Line Art: Use rough, organic pencil or ink lines (sketch style).
    3. Color: Use WATERCOLOR fills. Only soft PASTEL colors (Teal, Soft Pink, Lemon Yellow, Light Blue).
    4. Composition: Minimalist, centered, educational diagram style.
    5. Content: ${prompt}
    
    CRITICAL: Do NOT include any text, letters, or numbers in the drawing.
  `;

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: stylePrompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
        quality: "standard", 
        style: "natural"
      })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI Error Details:", errorData);
        return null;
    }

    const data = await response.json();
    const base64Data = data.data[0].b64_json;
    return `data:image/png;base64,${base64Data}`;
    
  } catch (error) {
    console.error("Image Generation Error (OpenAI):", error);
    return null;
  }
};

// --- INFOGRAPHIC GENERATION (SVG CODE) ---
export const generateInfographic = async (
    visualDescription: string, 
    orientation: 'vertical' | 'horizontal' | 'cuadrada'
): Promise<string | null> => {
    
    const ai = getAi();
    // Switched to a text-based model to generate Code (SVG)
    const model = 'gemini-2.5-flash'; 

    let width = 800;
    let height = 1200;
    if (orientation === 'horizontal') { width = 1200; height = 800; }
    if (orientation === 'cuadrada') { width = 1000; height = 1000; }

    const prompt = `
      You are an expert Data Visualization Designer.
      Create a PROFESSIONAL EDUCATIONAL INFOGRAPHIC in raw SVG format.
      
      REQUIREMENTS:
      1. Format: Return ONLY valid <svg> code. No markdown blocks, no explanations.
      2. Dimensions: width="${width}" height="${height}" viewBox="0 0 ${width} ${height}".
      3. Style: Modern, Clean, Vector Art.
      4. Palette: Background #f8fafc. Accents: Pastel Pink (#f472b6), Sky Blue (#38bdf8), Mint (#4ade80), Lilac (#a78bfa). Text: Slate-800.
      5. Fonts: Use system fonts (sans-serif).
      
      CONTENT TO VISUALIZE:
      ${visualDescription}
      
      SVG STRUCTURE:
      - Use <rect> for backgrounds and sections.
      - Use <text> for titles (bold, large) and body (clean).
      - Draw simple icons using <path> or <circle> (e.g. arrows, checkmarks, simple symbols relevant to topic).
      - Ensure text is readable and wrapped (simulated with multiple tspan or separate text elements).
      
      Return the full <svg>...</svg> string.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt
        });

        const text = response.text || "";
        // Clean up markdown code blocks if present
        const cleanedSvg = text.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();
        
        if (cleanedSvg.startsWith('<svg')) {
            return cleanedSvg;
        }
        return null;

    } catch (error) {
        console.error("Infographic Gen Error (Gemini SVG):", error);
        return null;
    }
};

// --- VEO VIDEO GENERATION SERVICE (BACKGROUND ONLY) ---
export const generateVeoVideo = async (topic: string, visualStyle: string): Promise<string | null> => {
  const ai = getAi();
  // Prompt optimized to be a subtle background for sketches
  const prompt = `Abstract white paper texture background with very slow moving watercolor stains in pastel colors. High key lighting, clean, cinematic, 4k.`;
  
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: '16:9'
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("No video URI returned");

    const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Veo Generation Error (using fallback):", error);
    // Fallback: A clean white paper texture video URL
    return "https://cdn.pixabay.com/video/2020/08/19/47690-452395353_large.mp4";
  }
};

// --- CONTENT GENERATION SERVICE (SCRIPT) ---
export const generateLongVideoContent = async (topic: string): Promise<{metadata: VideoMetadata, scenes: VideoScene[], visualPrompt: string, srt: string} | null> => {
  const ai = getAi();
  const model = "gemini-2.5-flash"; 

  // STRICT JSON STRUCTURE without complex tools to avoid API errors
  const systemInstruction = `
  You are an expert educational content creator.
  Create a video script about: "${topic}".
  
  STRUCTURE:
  - Generate exactly 8 SCENES.
  - Scene 1: Introduction / Title.
  - Scene 2-7: Explain concepts step-by-step.
  - Scene 8: Conclusion.
  
  STYLE:
  - Narration: Friendly, clear, like a good teacher.
  - Images: Describe "Hand-drawn sketches" or "Notebook doodles" for DALL-E.
  
  OUTPUT FORMAT (JSON ONLY):
  {
    "metadata": {
      "title": "Video Title",
      "topic": "${topic}",
      "totalDurationSeconds": 120,
      "summary": "Short summary"
    },
    "scenes": [
      {
        "title": "Scene Title",
        "narration": "Script to be spoken...",
        "imagePrompt": "A pencil sketch of [specific object], watercolor style...",
        "screenText": "Key Concept"
      }
    ],
    "visualPrompt": "Abstract background description",
    "srt": "SRT formatted subtitles"
  }
  `;

  try {
    const result = await ai.models.generateContent({
      model: model,
      contents: systemInstruction,
      config: {
        responseMimeType: "application/json", 
        // Removing tools/googleSearch to prevent "failed to call Gemini API" errors
      }
    });

    let text = result.text;
    if (!text) return null;
    
    // Clean markdown
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(text);
    
    // Ensure we have scenes even if AI malformed slightly
    if (!parsed.scenes || parsed.scenes.length === 0) throw new Error("No scenes generated");

    return parsed;
  } catch (error) {
    console.error("Content Gen Error:", error);
    return null;
  }
};
