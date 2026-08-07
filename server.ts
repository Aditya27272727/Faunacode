import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase body parser limit for audio/image base64 payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Helper function to lazily initialize Gemini AI client
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "FaunaDecode AI" });
});

app.post("/api/analyze-fauna", async (req, res) => {
  try {
    const {
      promptText,
      imageFile, // { mimeType, data (base64) }
      audioFile, // { mimeType, data (base64) }
      speciesHint,
      locationContext,
      observationNotes,
    } = req.body;

    const ai = getGenAIClient();

    const parts: any[] = [];

    // System instruction prompt reinforcing FaunaDecode AI prompt parameters
    const systemInstruction = `You are FaunaDecode AI, an expert multimodal artificial intelligence specialized in bioacoustics, animal pose analysis, and wildlife behavior interpretation.

Your goal is to analyze user-provided video descriptions, audio transcripts, images, audio recordings, or observations of wild animals and provide a detailed behavioral, emotional, and communication breakdown.

YOUR RESPONSIBILITIES:
1. Identify the species and context of the interaction whenever possible.
2. Analyze vocalizations (e.g., pitch, duration, acoustic type like alarm call, mating call, grunt, or growl).
3. Analyze body language and kinematics (e.g., ear posture, tail position, stance, gait, micro-expressions).
4. Synthesize both visual and acoustic cues to infer the animal's affective state (e.g., Stressed, Relaxed, Threatening, Injured, Playful).
5. Highlight potential risks (e.g., risk of human-wildlife conflict or need for veterinary attention).

OUTPUT FORMAT SPECIFICATION:
You must provide your response in TWO formats:
1. Markdown section: Must include the exact section structure:
---
## 🐾 Species & Context Identification
* **Detected Animal:** [Species Name]
* **Environment/Context:** [Brief description of environment or interaction]

## 🔊 Acoustic & Visual Signal Breakdown
* **Vocalization Signal:** [Analysis of sound type and pitch pattern]
* **Body Language & Posture:** [Key pose elements: ears, tail, stance, movement]

## 🧠 Behavioral & Emotional State
* **Primary State:** [e.g., Territorially Aggressive / High Distress / Calm]
* **Confidence Level:** [e.g., High / Medium / Low]
* **Communication Intent:** [What the animal is communicating to others around it]

## ⚠️ Ranger & Conservation Action Plan
* **Human Safety / Conflict Risk:** [Low / Moderate / High]
* **Recommended Action:** [Actionable steps for rangers, researchers, or eco-volunteers]
---

2. At the very end of your response, output a single JSON codeblock wrapped in \`\`\`json ... \`\`\` containing key metrics:
{
  "detectedAnimal": "...",
  "scientificName": "...",
  "environmentContext": "...",
  "vocalizationType": "...",
  "estimatedPitchHz": "...",
  "bodyLanguageSummary": "...",
  "primaryState": "...",
  "affectiveCategory": "Stressed" | "Relaxed" | "Threatening" | "Injured" | "Playful" | "Alert",
  "confidenceLevel": "High" | "Medium" | "Low",
  "confidenceScore": 85,
  "communicationIntent": "...",
  "conflictRisk": "Low" | "Moderate" | "High",
  "recommendedAction": "...",
  "keyPointAnnotations": [
    { "part": "Ears", "observation": "Flattened back" },
    { "part": "Tail", "observation": "Stiff and raised" }
  ]
}

Maintain a scientific, precise, yet accessible tone suitable for field researchers, rangers, and conservationists.`;

    let contentPrompt = `Analyze the provided wildlife observation/media.`;
    if (speciesHint) {
      contentPrompt += ` Possible species hint: ${speciesHint}.`;
    }
    if (locationContext) {
      contentPrompt += ` Location/Environment context: ${locationContext}.`;
    }
    if (observationNotes) {
      contentPrompt += ` Field observation notes & transcripts: ${observationNotes}.`;
    }
    if (promptText) {
      contentPrompt += ` User query/details: ${promptText}.`;
    }

    // Attach text part
    parts.push({ text: contentPrompt });

    // Attach Image if provided
    if (imageFile && imageFile.data && imageFile.mimeType) {
      parts.push({
        inlineData: {
          mimeType: imageFile.mimeType,
          data: imageFile.data,
        },
      });
    }

    // Attach Audio if provided
    if (audioFile && audioFile.data && audioFile.mimeType) {
      parts.push({
        inlineData: {
          mimeType: audioFile.mimeType,
          data: audioFile.data,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const markdownText = response.text || "";

    // Extract JSON from output if available
    let parsedMetrics = null;
    const jsonMatch = markdownText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        parsedMetrics = JSON.parse(jsonMatch[1]);
      } catch (err) {
        console.warn("Could not parse metrics JSON from model output", err);
      }
    }

    // Clean text by stripping out the trailing JSON block for clean raw markdown display if needed
    const cleanedMarkdown = markdownText.replace(/```json\s*[\s\S]*?\s*```/, "").trim();

    res.json({
      success: true,
      rawMarkdown: cleanedMarkdown,
      fullOutput: markdownText,
      metrics: parsedMetrics,
    });
  } catch (error: any) {
    console.error("Error in /api/analyze-fauna:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze wildlife observation.",
    });
  }
});

// Endpoint for Offline Edge Engine (Zero Connectivity On-Device Engine)
app.post("/api/offline-edge-engine", (req, res) => {
  try {
    const {
      speciesDetected,
      localAudioClassification,
      localPoseMetrics,
      gpsCoordinates,
    } = req.body;

    const species = speciesDetected || "African Elephant (Loxodonta africana)";
    const audioClass = localAudioClassification || "Low-Frequency Infrasonic Rumble / Warning Trumpet";
    const pose = localPoseMetrics || "Ears Pinned, Flapped Outward, Head Raised, Charging Stance";
    const gps = gpsCoordinates || [-2.3333, 34.8333]; // e.g. Serengeti NP coordinates

    const timestamp = Date.now();
    const eventId = `LOC_${timestamp}`;

    // On-device rapid risk assessment logic
    const isAggressive =
      /pinned|charge|charging|low stance|teeth|bare|canines|snarl|growl|warning|attack|roar|high-frequency alarm/i.test(
        pose + " " + audioClass
      );
    const isDistressed = /distress|groan|screaming|limp|pain|injured|whine/i.test(
      pose + " " + audioClass
    );

    let riskLevel = "LOW";
    let syncPriority = "NORMAL";
    let affectiveState = "Relaxed / Foraging";
    let rangerAction = "Maintain safe observation distance (50m+) and monitor herd movement.";
    let confidence = "0.92";

    if (isAggressive) {
      riskLevel = "HIGH";
      syncPriority = "URGENT";
      affectiveState = "Territorially Aggressive / Impending Charge";
      rangerAction = "IMMEDIATE ACTION REQUIRED: Slowly retreat 100m, raise jacket to appear larger, do not run, seek vehicle cover.";
      confidence = "0.95";
    } else if (isDistressed) {
      riskLevel = "MEDIUM";
      syncPriority = "URGENT";
      affectiveState = "Distressed / Possible Traumatic Injury";
      rangerAction = "Dispatch veterinary unit, log GPS location, and maintain non-threatening perimeter.";
      confidence = "0.88";
    }

    const outputJson = {
      offline_event_id: eventId,
      behavioral_summary: {
        species,
        affective_state: affectiveState,
        confidence_score: confidence,
      },
      field_alert: {
        risk_level: riskLevel,
        immediate_ranger_action: rangerAction,
      },
      sync_payload: {
        store_locally: true,
        sync_priority: syncPriority,
        gps_coordinates: gps,
        timestamp_iso: new Date(timestamp).toISOString(),
        sensory_inputs: {
          audio_classification: audioClass,
          visual_pose_metrics: pose,
        },
      },
    };

    res.json(outputJson);
  } catch (error: any) {
    console.error("Error in /api/offline-edge-engine:", error);
    res.status(500).json({
      error: error.message || "Failed to run Offline Edge Engine",
    });
  }
});

// Endpoint to generate documentary scripts and shot lists for wildlife experts
app.post("/api/generate-documentary-script", async (req, res) => {
  try {
    const { title, logline, style, animals, customInstructions } = req.body;

    const ai = getGenAIClient();

    const systemInstruction = `You are a world-class Wildlife Documentary Director & Narrative Scriptwriter (in the style of BBC Natural History Unit and National Geographic).

Your task is to take a set of detailed wildlife animal records (species, behavior, vocalizations, habitat, field observations) and generate a compelling, cinematic documentary project script.

OUTPUT FORMAT:
Return a JSON block wrapped in \`\`\`json ... \`\`\` with the following structure:
{
  "logline": "Updated refined logline...",
  "episodesOrScenes": [
    {
      "sceneNumber": 1,
      "title": "Scene title...",
      "settingLocation": "Location & lighting...",
      "timeOfDay": "Golden Hour / Night / Dawn...",
      "featuredAnimalNames": ["Animal 1"],
      "shotType": "Ultra-Wide Drone" | "Macro Eye Close-up" | "Slow-Mo Kinematics" | "Thermal Night Cam" | "Acoustic Spectrogram Motion",
      "narrationScript": "Full cinematic voiceover script written in ${style || "David Attenborough style"}. Emphasize real behavioral and acoustic observations provided.",
      "audioCues": "Acoustic sound design cues (e.g. low 20Hz rumble, rustling acacia foliage, dramatic orchestral surge)",
      "directorNotes": "Cinematography and camera movement notes for wildlife camera crew"
    }
  ],
  "productionTips": "Field advice for filming these specific species and capturing authentic bioacoustics."
}`;

    const prompt = `Create a 3-4 scene documentary script titled "${title || "Wildlife Chronicles"}".
Style: ${style || "BBC Earth David Attenborough Style"}.
Logline context: ${logline || "Exploring rare wildlife behaviors"}.
Custom Focus: ${customInstructions || "Focus on acoustic signals and kinematic posture"}.

ANIMAL RECORDS PROVIDED:
${JSON.stringify(animals, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const outputText = response.text || "";
    let scriptData = null;

    const jsonMatch = outputText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        scriptData = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.warn("Could not parse JSON script output", e);
      }
    }

    res.json({
      success: true,
      script: scriptData,
      rawOutput: outputText,
    });
  } catch (error: any) {
    console.error("Error in /api/generate-documentary-script:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate documentary script.",
    });
  }
});

// Endpoint for Wikipedia Animal Information & Chatbot
app.post("/api/wiki-chat", async (req, res) => {
  try {
    const { query, conversationHistory } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, error: "Query parameter is required." });
    }

    // Step 1: Query Wikipedia API to fetch real context
    let wikiSources: Array<{ title: string; extract: string; url: string; thumbnail?: string }> = [];

    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        query
      )}&utf8=&format=json&origin=*`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      const searchResults = searchData?.query?.search || [];

      // Fetch summaries for top 2-3 search results
      for (const item of searchResults.slice(0, 3)) {
        try {
          const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
            item.title.replace(/ /g, "_")
          )}`;
          const summaryRes = await fetch(summaryUrl);
          if (summaryRes.ok) {
            const summaryData = await summaryRes.json();
            if (summaryData.extract) {
              wikiSources.push({
                title: summaryData.title,
                extract: summaryData.extract,
                url: summaryData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
                thumbnail: summaryData.thumbnail?.source,
              });
            }
          }
        } catch (err) {
          console.warn("Error fetching Wikipedia page summary for:", item.title, err);
        }
      }
    } catch (wikiErr) {
      console.warn("Failed to fetch from Wikipedia API:", wikiErr);
    }

    // Step 2: Use Gemini to answer the query using Wikipedia context
    const ai = getGenAIClient();

    const systemInstruction = `You are the Wildlife Wikipedia AI Assistant (FaunaWiki Expert).
Your mission is to provide accurate, engaging, and scientifically grounded information about animals, including:
1. Where they live (habitats, biomes, geographic ranges, countries, climate zones).
2. Their endangerment / conservation status (IUCN status: Critically Endangered, Endangered, Vulnerable, Near Threatened, Least Concern, Extinct in the Wild) and why they are threatened (poaching, habitat loss, climate change).
3. Their physical traits, behaviors, vocalizations, diet, and predators.
4. Documentary and filming facts for wildlife filmmakers and experts.

Always cite the Wikipedia source articles provided in your context.
Keep your tone informative, authoritative yet accessible, suitable for field researchers, rangers, and documentary directors.
Include Markdown formatting (bolding key terms, bullet points, headers) for clean readability.`;

    const contextBlock = wikiSources.length > 0
      ? `REAL WIKIPEDIA CONTEXT FETCHED FOR QUERY:\n` +
        wikiSources
          .map((s) => `--- ARTICLE: ${s.title} ---\nLink: ${s.url}\nSummary: ${s.extract}`)
          .join("\n\n")
      : "No direct Wikipedia API results found for exact query; use built-in biological knowledge and clarify.";

    const prompt = `${contextBlock}

USER QUERY: ${query}

CONVERSATION HISTORY:
${JSON.stringify(conversationHistory || [], null, 2)}

Provide a detailed, helpful answer explaining where the animal lives, its endangered status, and key wildlife facts.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });

    res.json({
      success: true,
      reply: response.text || "No response generated.",
      sources: wikiSources,
    });
  } catch (error: any) {
    console.error("Error in /api/wiki-chat:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process Wikipedia AI query.",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FaunaDecode AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
