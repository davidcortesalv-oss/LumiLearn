
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { QuizQuestion, QuizType, LivingMapData, NodeQuiz, MapNode, QuizConfig, QuizAnalysis, Difficulty, QuizBadge, StudyPlanConfig, InfographicData, FlashcardDeck, Flashcard } from "../types";

// Helper to get a fresh instance
const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Webhook Chat Service ---
export const sendWebhookMessage = async (
  message: string,
  userId: string,
  subjectId: string,
  history: { role: string; parts: { text: string }[] }[] = []
): Promise<string> => {
  const webhookUrls: Record<string, string> = {
    // Default webhook for general AI routing if specific subject not found
    'default': "https://n8n.srv1005994.hstgr.cloud/webhook-test/489f214c-6dac-44f6-9f5e-310407a11cf5"
  };

  const webhookUrl = webhookUrls[subjectId] || webhookUrls['default'];

  const payload = {
    mensaje_usuario: message,
    usuario_id: userId,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Webhook Failed: HTTP ${response.status}`);

    const textResponse = await response.text();
    try {
      const jsonResponse = JSON.parse(textResponse);
      if (jsonResponse.output) return jsonResponse.output;
      if (jsonResponse.message) return jsonResponse.message;
      if (jsonResponse.respuesta) return jsonResponse.respuesta;
      if (jsonResponse.text) return jsonResponse.text;
      
      if (Array.isArray(jsonResponse) && jsonResponse.length > 0) {
         const firstItem = jsonResponse[0];
         if (firstItem.output) return firstItem.output;
         return JSON.stringify(firstItem);
      }
      return typeof jsonResponse === 'string' ? jsonResponse : JSON.stringify(jsonResponse);
    } catch (e) {
      return textResponse;
    }
  } catch (error) {
    console.warn(`Webhook fallback active for ${subjectId}`, error);
    try {
      const model = "gemini-2.5-flash";
      const ai = getAi();
      const chat = ai.chats.create({
        model: model,
        history: history,
        config: { systemInstruction: "Eres Lumi, un tutor IA amable. El servidor central no responde, así que responde tú brevemente." },
      });
      const result = await chat.sendMessage({ message });
      return result.text || "Error de conexión temporal.";
    } catch (fallbackError) {
      return "Error crítico de conexión.";
    }
  }
};

// --- STUDY PLAN WEBHOOK SERVICE ---
export const generateStudyPlanHtml = async (config: StudyPlanConfig): Promise<string> => {
  const webhookUrl = "https://n8n.srv1005994.hstgr.cloud/webhook-test/0c1a393c-300a-41e7-9423-67ff6fbcb93b";
  
  const payload = {
    subject: config.subject,
    exam_title: config.examTitle,
    exam_date: config.examDate,
    today_date: new Date().toISOString().split('T')[0],
    difficulty: config.difficulty,
    daily_available_minutes: config.dailyMinutes,
    language: 'es'
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Error al conectar con el planificador IA");
    
    const htmlResponse = await response.text();
    if (!htmlResponse || htmlResponse.trim().length === 0) {
        throw new Error("Respuesta vacía del planificador");
    }
    return htmlResponse;
  } catch (e) {
    console.error("Study Plan Error", e);
    return `
      <div style="font-family: sans-serif; padding: 40px; text-align: center; color: #374151;">
        <h2 style="color: #ec4899; margin-bottom: 20px;">¡Plan Generado! (Modo Fallback)</h2>
        <p>Hemos tenido un pequeño problema conectando con el servidor avanzado, pero aquí tienes una estructura base para tu estudio de <strong>${config.subject}</strong>:</p>
        
        <div style="background: #fdf2f8; padding: 20px; border-radius: 15px; margin: 30px 0; text-align: left;">
            <h3 style="color: #be185d;">Estrategia General</h3>
            <ul style="line-height: 1.8;">
                <li>Dedica <strong>${config.dailyMinutes} minutos</strong> diarios sin distracciones.</li>
                <li>Nivel de intensidad: <strong>${config.difficulty.toUpperCase()}</strong>.</li>
                <li>Divide el temario en bloques pequeños.</li>
            </ul>
        </div>
        <p style="font-size: 0.9em; color: #9ca3af;">Intenta generar de nuevo en unos minutos para el plan detallado completo.</p>
      </div>
    `;
  }
};

// --- NEW OPTIMIZATION: Extract text on upload to reuse later ---
export const extractTextFromMaterial = async (base64Data: string, mimeType: string): Promise<string> => {
    const ai = getAi();
    const model = "gemini-2.5-flash"; 
    
    try {
        const result = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Data } },
                    { text: "EXTRACCIÓN RÁPIDA: Devuelve TODO el texto legible de este documento o imagen. No resumas, solo extrae el contenido para procesarlo después. Si es una imagen sin texto, describe detalladamente lo que ves." }
                ]
            }
        });
        return result.text || "";
    } catch (e) {
        console.error("Quick Extraction Error", e);
        return "";
    }
};

export const analyzeStudyMaterial = async (base64Data: string, mimeType: string = "image/jpeg"): Promise<{subject: string, topics: string} | null> => {
    const ai = getAi();
    const model = "gemini-2.5-flash";
    
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            subject: { type: Type.STRING, description: "Nombre de la asignatura detectada (ej: Biología, Historia)" },
            topics: { type: Type.STRING, description: "Resumen breve de los temas principales para usar como título del examen" }
        },
        required: ["subject", "topics"]
    };

    try {
        const result = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Data } },
                    { text: "Analiza este documento educativo (apuntes, PDF o temario). Extrae el nombre de la asignatura y genera un título descriptivo que resuma los temas principales para crear un plan de estudio." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        
        return JSON.parse(result.text || "null");
    } catch (e) {
        console.error("Analysis Error", e);
        return null;
    }
};

// --- LIVING CONCEPT MAP SERVICE ---

const MAP_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
      nodes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            label: { type: Type.STRING, description: "Título muy corto (1-5 palabras)" },
            type: { type: Type.STRING, enum: ['Root', 'Concept', 'Definition', 'Process', 'Example', 'Event'] },
            description: { type: Type.STRING, description: "Explicación clara del nodo" },
            mastery: { type: Type.NUMBER, description: "Siempre 0 al inicio" },
            importance: { type: Type.NUMBER, description: "10 para Root, 8 para Concept, 4-6 resto" },
            parentId: { type: Type.STRING, nullable: true }
          },
          required: ["id", "label", "type", "description", "mastery", "importance"]
        }
      },
      links: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            source: { type: Type.STRING },
            target: { type: Type.STRING },
            relation: { type: Type.STRING, description: "Etiqueta de relación (ej: 'es un', 'causa')" }
          },
          required: ["source", "target", "relation"]
        }
      }
    },
    required: ["nodes", "links"]
};

export const generateLivingMap = async (content: string): Promise<LivingMapData | null> => {
  const ai = getAi();
  const model = "gemini-3-pro-preview";
  
  try {
    const result = await ai.models.generateContent({
      model: model,
      contents: `Analiza el siguiente contenido y genera un mapa mental EXHAUSTIVO y DENSO.
      
      Requisitos:
      1. Genera MÍNIMO 20-30 nodos. 
      2. No te quedes en la superficie: profundiza en sub-conceptos, ejemplos y detalles.
      3. Estructura jerárquica clara (Raíz -> Conceptos Principales -> Detalles -> Ejemplos).
      4. Usa IDs únicos.
      
      Contenido a analizar:
      "${content.substring(0, 30000)}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: MAP_SCHEMA,
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });

    const parsed = JSON.parse(result.text || "null");
    if (parsed && parsed.nodes) {
        parsed.nodes.forEach((n: any) => {
            if (n.type === 'Root') n.parentId = null; 
        });
    }
    return parsed;
  } catch (error) {
    console.error("Living Map Gen Error:", error);
    return null;
  }
};

export const generateMapFromFile = async (base64Data: string, mimeType: string = "application/pdf"): Promise<LivingMapData | null> => {
    const ai = getAi();
    const model = "gemini-3-pro-preview"; // Use Pro for better analysis of long docs

    try {
        const result = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Data } },
                    { text: `Analiza este documento completo y genera un MAPA MENTAL JERÁRQUICO Y DETALLADO.
                    
                    INSTRUCCIONES CRÍTICAS:
                    1. Identifica el tema central (Root).
                    2. Desglosa los conceptos principales, secundarios y detalles.
                    3. Genera MÍNIMO 25 nodos para cubrir el documento en profundidad.
                    4. Estructura 'parentId' correctamente para formar un árbol lógico.
                    
                    Devuelve JSON compatible con la estructura solicitada.` }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: MAP_SCHEMA,
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });

        const parsed = JSON.parse(result.text || "null");
        if (parsed && parsed.nodes) {
            parsed.nodes.forEach((n: any) => {
                if (n.type === 'Root') n.parentId = null; 
            });
        }
        return parsed;

    } catch (e) {
        console.error("File Map Gen Error", e);
        return null;
    }
};

export const explainNodeConcept = async (nodeLabel: string, nodeContext: string): Promise<string> => {
  const ai = getAi();
  const model = "gemini-2.5-flash"; 
  try {
     const result = await ai.models.generateContent({
       model: model,
       contents: `Explica el concepto "${nodeLabel}" de forma sencilla y educativa para un estudiante.
       Contexto del mapa: "${nodeContext}".
       Máximo 50 palabras. Usa 1 emoji relevante. Idioma: Español.`,
     });
     return result.text || "No disponible.";
  } catch (e) {
    return "Error de conexión.";
  }
};

export const generatePresentationNarration = async (nodeLabel: string, nodeDescription: string): Promise<string> => {
    const ai = getAi();
    const model = "gemini-2.5-flash";
    try {
        const result = await ai.models.generateContent({
            model: model,
            contents: `Actúa como un presentador educativo. Estás mostrando la diapositiva: "${nodeLabel}".
            Descripción técnica: "${nodeDescription}".
            Genera un guion hablado muy breve (max 25 palabras) para introducir este punto al estudiante.
            Tono: Entusiasta y claro. Idioma: Español.`,
        });
        return result.text || nodeDescription;
    } catch (e) {
        return nodeDescription;
    }
}

export const generateNodePractice = async (nodeLabel: string, context: string): Promise<NodeQuiz | null> => {
  const ai = getAi();
  const model = "gemini-2.5-flash";
  const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        type: { type: Type.STRING, enum: ['multiple_choice', 'true_false', 'fill_in_the_blank'] },
        options: { type: Type.ARRAY, items: { type: Type.STRING } },
        correctAnswer: { type: Type.STRING },
        feedback: { type: Type.STRING, description: "Breve explicación de por qué es la correcta" }
      },
      required: ["question", "type", "correctAnswer", "feedback"]
  };

  try {
    const result = await ai.models.generateContent({
      model: model,
      contents: `Genera una pregunta de práctica rápida y específica sobre el concepto: "${nodeLabel}".
      Contexto: "${context}".
      La pregunta debe evaluar si el estudiante entendió la definición o relación.
      Idioma: Español.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    return JSON.parse(result.text || "null");
  } catch(e) {
    console.error("Quiz gen error", e);
    return null;
  }
}

// --- ADAPTIVE QUIZ SERVICES ---

const QUIZ_QUESTION_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        type: { type: Type.STRING, enum: ['multiple_choice', 'true_false'] },
        question: { type: Type.STRING },
        options: { type: Type.ARRAY, items: { type: Type.STRING } },
        correctAnswerStr: { type: Type.STRING },
        explanation: { type: Type.STRING },
        analogy: { type: Type.STRING, description: "Una analogía simple para entender el concepto" },
        distractorAnalysis: { type: Type.STRING, description: "Breve explicación de por qué las otras opciones son incorrectas" }
    },
    required: ["id", "type", "question", "options", "correctAnswerStr", "explanation"]
};

export const generateAdaptiveQuestion = async (topic: string, previousPerformance: 'correct' | 'incorrect' | 'start', difficulty: Difficulty): Promise<QuizQuestion | null> => {
    const ai = getAi();
    const model = "gemini-2.5-flash";
    
    let diffContext = difficulty;
    if (previousPerformance === 'correct') diffContext = Difficulty.ADVANCED; 
    if (previousPerformance === 'incorrect') diffContext = Difficulty.BEGINNER; 

    try {
        const result = await ai.models.generateContent({
            model: model,
            contents: `Genera 1 pregunta de quiz sobre: "${topic}".
            Estado previo del alumno: ${previousPerformance === 'start' ? 'Iniciando' : previousPerformance === 'correct' ? 'Acertó la anterior (subir nivel)' : 'Falló la anterior (reforzar base)'}.
            Nivel objetivo: ${diffContext}.
            Requisitos: Pregunta clara, incluye analogía y análisis de errores. Español.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: QUIZ_QUESTION_SCHEMA
            }
        });
        
        const q: any = JSON.parse(result.text || "null");
        if (!q) return null;

        return {
            id: Date.now().toString(),
            type: q.type,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswerStr,
            explanation: q.explanation,
            analogy: q.analogy,
            distractorAnalysis: q.distractorAnalysis
        } as QuizQuestion;

    } catch(e) {
        console.error("Adaptive Gen Error", e);
        return null;
    }
};

// NEW: Helper to generate a single question (used for regeneration/fix)
export const generateSingleQuizQuestion = async (config: QuizConfig): Promise<QuizQuestion | null> => {
    return await generateAdaptiveQuestion(config.topic, 'start', config.difficulty);
};

export const generateSmartQuiz = async (config: QuizConfig): Promise<QuizQuestion[]> => {
    const ai = getAi();
    const model = "gemini-3-pro-preview";
    
    const schema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['multiple_choice', 'true_false', 'ordering'] },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                items: { type: Type.ARRAY, items: { type: Type.STRING } },
                explanation: { type: Type.STRING },
                correctAnswerStr: { type: Type.STRING },
                analogy: { type: Type.STRING, description: "Analogía simple" },
                distractorAnalysis: { type: Type.STRING, description: "Por qué las otras están mal" }
            },
            required: ["id", "type", "question", "explanation", "correctAnswerStr"]
        }
    };

    const difficultyText = config.difficulty === Difficulty.ADAPTIVE ? "una mezcla de dificultades" : config.difficulty;

    try {
        const result = await ai.models.generateContent({
            model: model,
            contents: `Genera un Quiz Educativo de ${config.questionCount} preguntas sobre: "${config.topic}".
            Dificultad: ${difficultyText}.
            Idioma: ESPAÑOL.
            Formato de Salida JSON estricto.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                thinkingConfig: { thinkingBudget: 32768 } 
            }
        });

        const rawQuestions = JSON.parse(result.text || "[]");
        
        const validQuestions = rawQuestions.filter((q: any) => {
            // Strong validation to prevent blank questions
            return q && q.question && q.question.trim().length > 0 && q.correctAnswerStr;
        });

        return validQuestions.map((q: any) => {
            let parsedAnswer = q.correctAnswerStr;
            if (q.type === 'ordering') {
                parsedAnswer = q.correctAnswerStr.split('|').map((s: string) => s.trim());
            }

            return {
                id: q.id || Math.random().toString(),
                type: q.type,
                question: q.question,
                options: q.options,
                items: q.items,
                correctAnswer: parsedAnswer,
                explanation: q.explanation,
                analogy: q.analogy,
                distractorAnalysis: q.distractorAnalysis
            } as QuizQuestion;
        });

    } catch (e) {
        console.error("Smart Quiz Gen Error", e);
        return [];
    }
};

export const analyzeQuizPerformance = async (topic: string, results: {question: string, correct: boolean}[]): Promise<QuizAnalysis> => {
    const ai = getAi();
    const model = "gemini-3-pro-preview"; 
    
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            studySuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            motivationalMessage: { type: Type.STRING },
            badges: {
                 type: Type.ARRAY,
                 items: {
                     type: Type.OBJECT,
                     properties: {
                         id: {type: Type.STRING},
                         label: {type: Type.STRING},
                         icon: {type: Type.STRING},
                         description: {type: Type.STRING}
                     }
                 }
            }
        },
        required: ["strengths", "weaknesses", "studySuggestions", "motivationalMessage"]
    };

    const resultsSummary = results.map(r => `P: "${r.question.substring(0, 30)}..." - ${r.correct ? "CORRECTO" : "FALLO"}`).join("\n");
    const score = results.filter(r => r.correct).length;

    try {
        const result = await ai.models.generateContent({
            model: model,
            contents: `Analiza el rendimiento de un estudiante en un quiz sobre "${topic}".
            Resultados:
            ${resultsSummary}
            Genera un análisis pedagógico constructivo. Idioma: Español.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                thinkingConfig: { thinkingBudget: 16000 }
            }
        });
        
        const analysis = JSON.parse(result.text || "{}");
        const badges = (analysis.badges || []).map((b: any) => ({...b, unlocked: true}));

        return {
            score: score,
            strengths: analysis.strengths || [],
            weaknesses: analysis.weaknesses || [],
            studySuggestions: analysis.studySuggestions || [],
            xpEarned: score * 50,
            badgesEarned: badges
        } as QuizAnalysis;

    } catch (e) {
        return {
            score: score,
            strengths: [],
            weaknesses: [],
            studySuggestions: ["Sigue practicando"],
            xpEarned: score * 50,
            badgesEarned: []
        };
    }
};

export const improveNotes = async (base64Image: string): Promise<string> => {
    const ai = getAi();
    const model = "gemini-2.5-flash"; 
    try {
        const result = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: base64Image } },
                    { text: "Transcribe el texto de esta imagen educativa. Identifica el tema principal, los subtemas y las definiciones clave." }
                ]
            }
        });
        return result.text || "";
    } catch (e) {
        console.error("Vision Error", e);
        return "";
    }
}

export const editUploadedImage = async (base64Image: string, prompt: string): Promise<string | null> => {
  const ai = getAi();
  const model = "gemini-2.5-flash-image"; // Nano Banana

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          { text: prompt }
        ]
      }
    });

    // Check content parts for the image response
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          // Construct data URL
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (e) {
    console.error("Image Edit Error", e);
    return null;
  }
};

// --- NEW: INFOGRAPHIC PROMPT OPTIMIZER ---
export const createVisualPrompt = async (
    content: string,
    goal: string,
    orientation: string
): Promise<string> => {
    const ai = getAi();
    const model = "gemini-2.5-flash";
    
    // We want Gemini to act as a "Prompt Engineer" for Gemini Image Gen (Nano Banana)
    // It should translate the educational content into a VISUAL DESCRIPTION
    
    try {
        const result = await ai.models.generateContent({
            model: model,
            contents: `
              TASK: Create a detailed VISUAL DESCRIPTION for an educational infographic.
              
              INPUT CONTENT: "${content.substring(0, 5000)}"
              GOAL: "${goal}"
              FORMAT: ${orientation} (Vertical/Horizontal/Square)
              
              INSTRUCTIONS:
              - Output a DESCRIPTIVE VISUAL PROMPT describing:
                1. The Layout (e.g. timeline, comparison split, flowchart).
                2. The Icons & Graphics to use (e.g. "a central brain icon connecting to 3 lightbulbs").
                3. The Key Data Points to visualize.
                4. The Color Palette (Pastel: Pink, Blue, Mint).
              
              Keep the prompt focused on VISUALS and DATA STRUCTURE for visualization.
            `
        });
        return result.text || content;
    } catch (e) {
        console.error("Prompt Opt Error", e);
        return content;
    }
};

// --- FLASHCARD GENERATION SERVICE ---
export const generateFlashcardDeck = async (topic: string, amount: number = 10): Promise<FlashcardDeck | null> => {
    const ai = getAi();
    const model = "gemini-3-pro-preview"; // Using powerful model for intelligent extraction

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            deckTitle: { type: Type.STRING },
            theme: { type: Type.STRING, enum: ['candy', 'neon', 'ocean', 'forest'] },
            cards: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        front: { type: Type.STRING, description: "Question or Concept to define" },
                        back: { type: Type.STRING, description: "Clear, concise answer" },
                        difficulty: { type: Type.NUMBER, description: "Estimated difficulty 1-10" },
                        visualHook: { type: Type.STRING, description: "A strong visual metaphor description to help memory" },
                        memoryTip: { type: Type.STRING, description: "Mnemonic or quick tip" }
                    },
                    required: ["front", "back", "visualHook"]
                }
            }
        },
        required: ["deckTitle", "cards"]
    };

    try {
        const result = await ai.models.generateContent({
            model: model,
            contents: `Genera un mazo de FLASHCARDS Inteligentes sobre: "${topic}".
            Cantidad: ${amount} cartas.
            ESTILO: Educativo, divertido y memorable.
            OBJETIVO: Que el estudiante retenga la información a largo plazo usando ganchos visuales.
            IDIOMA: Español.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                thinkingConfig: { thinkingBudget: 16000 }
            }
        });

        const rawData = JSON.parse(result.text || "null");
        if (!rawData) return null;

        // Transform into internal FlashcardDeck structure
        const deck: FlashcardDeck = {
            id: Date.now().toString(),
            title: rawData.deckTitle,
            topic: topic,
            theme: rawData.theme || 'candy',
            createdAt: Date.now(),
            cards: rawData.cards.map((c: any, index: number) => ({
                id: `card-${Date.now()}-${index}`,
                front: c.front,
                back: c.back,
                visualHook: c.visualHook,
                memoryTip: c.memoryTip,
                difficulty: c.difficulty || 5,
                mastery: 'new',
                nextReview: Date.now(),
                interval: 0,
                easeFactor: 2.5,
                repetitions: 0
            }))
        };

        return deck;

    } catch (e) {
        console.error("Flashcard Gen Error", e);
        return null;
    }
};

// --- ASSISTANT / HOMEWORK HELPER SERVICE ---

export const generateStudyGuide = async (
  inputContent: { text?: string, fileBase64?: string, mimeType?: string }
): Promise<string> => {
  const ai = getAi();
  const model = "gemini-2.5-flash"; // Fast and capable for text processing

  // Construct parts based on what is available
  const parts: any[] = [];
  
  if (inputContent.fileBase64) {
      parts.push({
          inlineData: {
              mimeType: inputContent.mimeType || 'image/jpeg',
              data: inputContent.fileBase64
          }
      });
  }
  
  if (inputContent.text) {
      parts.push({ text: `CONTEXTO ADICIONAL / TEXTO: ${inputContent.text}` });
  }

  // System Prompt
  const prompt = `
    Eres un TUTOR EXPERTO. Tu misión es ayudar al estudiante a entender este material y hacer sus deberes.
    
    Analiza el contenido proporcionado (texto, imagen, audio o PDF) y genera una GUÍA DE ESTUDIO estructurada en HTML.
    
    ESTRUCTURA HTML REQUERIDA (Usa Tailwind CSS classes inline para estilo limpio):
    <div class="space-y-6">
       <!-- 1. Resumen Ejecutivo -->
       <div class="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
           <h2 class="text-xl font-bold text-indigo-800 mb-2">📌 Resumen</h2>
           <p>...</p>
       </div>
       
       <!-- 2. Conceptos Clave (Lista) -->
       <div>
           <h3 class="font-bold text-gray-800 mb-2">🔑 Conceptos Clave</h3>
           <ul class="list-disc pl-5 space-y-2">...</ul>
       </div>
       
       <!-- 3. Fórmulas / Fechas / Datos Importantes (Si aplica) -->
       <!-- Si no hay, omite esta sección -->
       
       <!-- 4. Preguntas de Práctica (5 preguntas con respuesta oculta o explicada) -->
       <div class="mt-8">
           <h3 class="font-bold text-gray-800 mb-4">🧠 Práctica Rápida</h3>
           <!-- Pregunta 1 -->
           <div class="mb-4">
              <p class="font-semibold">1. [Pregunta]</p>
              <p class="text-sm text-gray-500 italic mt-1">R: [Respuesta Breve]</p>
           </div>
           ...
       </div>
    </div>

    REGLAS:
    - NO uses markdown (ni \`\`\`). Devuelve SOLO el código HTML crudo dentro del div principal.
    - Sé conciso pero didáctico.
    - Idioma: Español.
  `;

  parts.push({ text: prompt });

  try {
      const result = await ai.models.generateContent({
          model: model,
          contents: { parts: parts }
      });
      
      let html = result.text || "<p>No se pudo generar la guía.</p>";
      // Cleanup cleanup
      html = html.replace(/```html/g, '').replace(/```/g, '');
      return html;

  } catch (e) {
      console.error("Assistant Error", e);
      return "<p>Error al procesar la solicitud. Intenta de nuevo.</p>";
  }
};