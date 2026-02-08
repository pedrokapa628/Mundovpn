
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, ConnectionStatus, Server } from "../types";

// Always use the named parameter for apiKey and fetch directly from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIResponse = async (
  prompt: string, 
  history: ChatMessage[], 
  vpnState: { status: ConnectionStatus, server: Server | null }
) => {
  try {
    // Using gemini-2.5-flash-lite-latest for low-latency responses
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite-latest",
      contents: [
        {
          parts: [{
            text: `You are Mundo VPN AI Assistant. 
            Help the user with security, privacy, and technical issues.
            Current VPN Status: ${vpnState.status}
            Selected Server: ${vpnState.server?.name || 'None'}
            User Question: ${prompt}`
          }]
        }
      ],
      config: {
        systemInstruction: "You are Mundo VPN's ultra-fast intelligent assistant. You provide immediate, concise, and expert advice on networking, privacy, and VPN optimization. Be extremely efficient and helpful.",
        temperature: 0.6,
        topP: 0.9,
        topK: 40,
      }
    });

    // Access the text property directly (do not call as a method)
    return response.text || "Desculpe, não consegui processar sua solicitação agora.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao conectar com a inteligência artificial. Verifique sua conexão.";
  }
};
