import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase body limit for base64 image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initialize Gemini AI client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API endpoint to parse receipt images
app.post("/api/parse-receipt", async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image || !mimeType) {
      res.status(400).json({ error: "Missing image data or mimeType" });
      return;
    }

    // Clean base64 string from data URI prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const ai = getGeminiClient();

    // Use gemini-3.5-flash for super fast and highly accurate receipt understanding
    const model = "gemini-3.5-flash";

    const prompt = 
      "Analysez cette image de reçu ou ticket de caisse. Extrayez tous les articles avec leurs prix, la taxe et le pourboire. " +
      "S'il y a des sous-articles, regroupez-les ou représentez-les comme des lignes distinctes. " +
      "Fournissez une liste propre d'articles avec leur prix final absolu tel qu'il figure sur le reçu. " +
      "Trouvez également le montant total de la taxe et le montant total du pourboire (si le pourboire n'est pas écrit ou calculé, mettez 0 par défaut). Tout doit être formulé en français.";

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        prompt,
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              description: "List of items on the receipt",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Name or description of the item" },
                  price: { type: Type.NUMBER, description: "Total price of the item" },
                },
                required: ["name", "price"],
              },
            },
            tax: { type: Type.NUMBER, description: "Total tax amount listed on the receipt, default to 0" },
            tip: { type: Type.NUMBER, description: "Total tip amount listed or pre-calculated on the receipt, default to 0" },
          },
          required: ["items", "tax", "tip"],
        },
      },
    });

    const parsedText = response.text;
    if (!parsedText) {
      throw new Error("No response from parsing model");
    }

    const result = JSON.parse(parsedText);
    res.json(result);
  } catch (error: any) {
    console.error("Receipt parsing failed:", error);
    res.status(500).json({ error: error.message || "Failed to parse receipt" });
  }
});

// API endpoint for natural language smart chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, state } = req.body;
    if (!message || !state) {
      res.status(400).json({ error: "Missing message or state" });
      return;
    }

    const ai = getGeminiClient();
    
    // Use gemini-3.5-flash for super fast, smart processing of state changes
    const model = "gemini-3.5-flash";

    const systemInstruction = 
      "Vous êtes un assistant intelligent de partage d'addition pour une application avec écran partagé.\n" +
      "À gauche, l'utilisateur voit une liste d'articles du ticket et des personnes, avec qui est attribué à quel article.\n" +
      "À droite, ils discutent avec vous pour attribuer les coûts.\n\n" +
      "VOTRE RÔLE :\n" +
      "Recevez l'état actuel de l'addition (receipt state) et la demande en langage naturel de l'utilisateur (ex. 'Dhruv a pris les nachos', 'Sarah et Sue partagent la pizza').\n" +
      "Mettez à jour l'état de l'addition en conséquence, et rédigez un message amical EN FRANÇAIS expliquant les modifications apportées.\n\n" +
      "RÈGLES DE L'ÉTAT (STATE RULES) :\n" +
      "1. Si l'utilisateur mentionne une nouvelle personne (ex. 'Ajoute Dhruv', 'Dhruv a pris...', 'Sarah et Sue ont partagé...'), vérifiez si elle existe déjà dans la liste 'people'. Sinon, ajoutez-la avec un nouvel identifiant unique aléatoire et une couleur Tailwind appropriée (ex. 'bg-blue-100 text-blue-800 border-blue-300').\n" +
      "2. Pour attribuer un article à une personne, ajoutez l'ID de cette personne au tableau `assignedTo` de l'article. Si plusieurs personnes partagent/divisent un article, ajoutez tous leurs IDs au tableau `assignedTo`. Ne retirez personne d'autre à moins que la demande ne le spécifie ou l'implique.\n" +
      "3. Si un utilisateur dit 'Dhruv a pris les nachos', faites une correspondance approximative (fuzzy matching) pour trouver un article comme 'nachos' ou 'Nachos XL'. Remplacez ou ajoutez Dhruv dans la liste `assignedTo` de cet article. Si la commande implique que lui seul l'a pris, videz les autres affectations de cet article. S'il est dit 'Dhruv et Sarah ont partagé la pizza', ajoutez les deux IDs au tableau `assignedTo` de cet article.\n" +
      "4. Si l'on dit 'Dhruv n'a pas pris de nachos', supprimez son ID du tableau `assignedTo` de cet article.\n" +
      "5. Si l'on dit 'réinitialiser tout' ou 'effacer les attributions', videz le tableau `assignedTo` pour tous les articles.\n" +
      "6. S'ils demandent de modifier la taxe ou le pourboire, par exemple 'pourboire à 18%' ou 'ajoute 5$ de pourboire', analysez la valeur et mettez à jour `tip` et `tipType` ('percentage' ou 'fixed') en conséquence.\n" +
      "7. L'application supporte le Dollar ($ / USD) et le Franc Congolais (FC / CDF). Le taux de change est 1 USD = 2038 FC par défaut. L'état contient `currencyRate` (le taux, ex: 2038) et `primaryCurrency` ('USD' ou 'CDF'). Conservez ces valeurs à moins que l'utilisateur ne demande explicitement de changer le taux (ex: 'taux de change à 2050') ou de basculer la devise principale (ex: 'affiche en FC' ou 'passe en USD').\n" +
      "8. Veillez à renvoyer l'état complet mis à jour (updatedState), y compris les champs non modifiés. Ne modifiez pas les IDs, noms ou prix des articles à moins que l'utilisateur ne le demande explicitement.\n" +
      "9. Si l'utilisateur pose simplement une question, par exemple 'combien doit Dhruv ?' ou 'qui partage la pizza ?', ne modifiez pas l'état. Répondez précisément à sa question dans le texte en français, en affichant de préférence les montants dans la devise principale avec la conversion indicative dans l'autre.\n\n" +
      "Vous devez impérativement renvoyer un objet JSON correspondant au schéma 'responseSchema' fourni.";

    const contents = [
      {
        text: `Current Receipt State: ${JSON.stringify(state)}\n\nUser request: "${message}"`,
      },
    ];

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { 
              type: Type.STRING, 
              description: "A friendly, conversational explanation of what was changed, or the answer to the user's question. Be succinct and clear." 
            },
            updatedState: {
              type: Type.OBJECT,
              description: "The complete updated receipt state",
              properties: {
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      price: { type: Type.NUMBER },
                      assignedTo: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["id", "name", "price", "assignedTo"],
                  },
                },
                people: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      color: { type: Type.STRING },
                    },
                    required: ["id", "name", "color"],
                  },
                },
                tax: { type: Type.NUMBER },
                tip: { type: Type.NUMBER },
                tipType: { type: Type.STRING, description: "Must be 'percentage' or 'fixed'" },
                currencyRate: { type: Type.NUMBER, description: "Exchange rate of 1 USD to FC (e.g. 2038)" },
                primaryCurrency: { type: Type.STRING, description: "Must be 'USD' or 'CDF'" },
              },
              required: ["items", "people", "tax", "tip", "tipType", "currencyRate", "primaryCurrency"],
            },
          },
          required: ["text", "updatedState"],
        },
      },
    });

    const parsedText = response.text;
    if (!parsedText) {
      throw new Error("No response from chat model");
    }

    const result = JSON.parse(parsedText);
    res.json(result);
  } catch (error: any) {
    console.error("Chat agent failed:", error);
    res.status(500).json({ error: error.message || "Failed to process chat" });
  }
});

// Configure Vite or Static Asset Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
