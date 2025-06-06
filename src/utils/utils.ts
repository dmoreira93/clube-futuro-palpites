// src/lib/utils.ts

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Função 'cn' padrão do shadcn/ui que você já deve ter
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- INÍCIO DA CORREÇÃO ---

// 1. Defina a interface para garantir que o objeto participante tenha as propriedades necessárias
interface ParticipantLike {
  name: string;
  username: string;
}

// 2. Defina os identificadores das IAs
const AI_IDENTIFIERS = ["IA Gemini", "IA Chat Gpt", "IA Deep Seek", "IA Copilot", "Gemini", "ChatGPT", "DeepSeek"];

// 3. Crie e EXPORTE a função 'isAIParticipant'
export const isAIParticipant = (participant: ParticipantLike): boolean => {
  if (!participant || !participant.name || !participant.username) return false;
  
  const lowerName = participant.name.toLowerCase();
  const lowerUsername = participant.username.toLowerCase();

  return AI_IDENTIFIERS.some(aiKey =>
    lowerName.includes(aiKey.toLowerCase()) || lowerUsername.includes(aiKey.toLowerCase())
  );
};

// --- FIM DA CORREÇÃO ---