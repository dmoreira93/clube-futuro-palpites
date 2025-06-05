// src/utils/utils.ts ou src/lib/utils.ts

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Adicione esta parte:
const AI_IDENTIFIERS = ["IA Gemini", "IA Chat Gpt", "IA Deep Seek", "IA Copilot", "Gemini", "ChatGPT", "DeepSeek"];
// Adicione outros nomes ou usernames se necessário, ou use IDs se as IAs tiverem IDs específicos e conhecidos.

interface ParticipantLike {
  name: string;
  username: string;
  // Adicione outros campos se sua identificação de IA depender deles
}

export const isAIParticipant = (participant: ParticipantLike): boolean => {
  if (!participant || !participant.name || !participant.username) return false;
  const lowerName = participant.name.toLowerCase();
  const lowerUsername = participant.username.toLowerCase();
  return AI_IDENTIFIERS.some(aiKey =>
    lowerName.includes(aiKey.toLowerCase()) || lowerUsername.includes(aiKey.toLowerCase())
  );
};