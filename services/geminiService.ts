import { GoogleGenAI } from "@google/genai";
import { Flock, DailyRecord, Expense, Sale } from '../types';

export const getAIInsight = async (question: string, flocks: Flock[], records: DailyRecord[], expenses: Expense[], sales: Sale[]): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  if (!apiKey) {
    return "Chave de API não configurada. Por favor, configure a variável de ambiente VITE_GEMINI_API_KEY.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Você é um especialista em avicultura e consultor de gerenciamento de granjas de galinhas poedeiras.
      Analise os dados a seguir e responda à pergunta do usuário de forma clara, objetiva e fornecendo conselhos práticos.
      Use markdown para formatar sua resposta (negrito, listas, etc.). Forneça a resposta em português.

      **Dados da Granja:**

      **Lotes de Galinhas:**
      ${JSON.stringify(flocks, null, 2)}

      **Registros Diários (últimos 30 dias):**
      ${JSON.stringify(records.slice(-30), null, 2)}

      **Registros de Despesas (últimos 90 dias):**
      ${JSON.stringify(expenses.slice(-90), null, 2)}
      
      **Registros de Vendas (últimos 90 dias):**
      ${JSON.stringify(sales.slice(-90), null, 2)}

      **Pergunta do Usuário:**
      "${question}"
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Desculpe, não consegui processar sua solicitação no momento. Verifique sua conexão ou a chave de API e tente novamente mais tarde.";
  }
};