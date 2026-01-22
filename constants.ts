
import type { Voice } from './types';

export const MAX_CHARACTERS = 5000;

export const SAMPLE_TEXT = "Esta é uma amostra da minha voz. Use-a para decidir se eu sou a escolha certa para o seu texto.";

// Mapping user-friendly names to available Gemini prebuilt voices.
// These are chosen to represent a variety of tones.
export const VOICES: Voice[] = [
  {
    id: 'clara',
    name: 'Clara',
    description: 'Voz suave, tom médio, perfeita para narração calma.',
    apiName: 'Kore',
  },
  {
    id: 'isabela',
    name: 'Isabela',
    description: 'Voz energética, tom alto, perfeita para anúncios animados.',
    apiName: 'Luna', // Typically a more expressive voice
  },
  {
    id: 'mariana',
    name: 'Mariana',
    description: 'Voz acolhedora, tom médio-baixo, emocional e amigável.',
    apiName: 'Terra', // Often has a warmer, grounded tone
  },
  {
    id: 'laura',
    name: 'Laura',
    description: 'Voz firme e confiante, para instruções ou podcasts.',
    apiName: 'Aura', // Clear and authoritative
  },
  {
    id: 'sofia',
    name: 'Sofia',
    description: 'Voz jovem, tom animado, para tutoriais ou conteúdo descontraído.',
    apiName: 'Stella', // Often brighter and younger sounding
  },
  {
    id: 'camila',
    name: 'Camila',
    description: 'Voz doce e calma, tom baixo, para meditação ou storytelling.',
    apiName: 'Charon', // Typically a softer, lower-pitched female voice
  },
  {
    id: 'alice',
    name: 'Alice',
    description: 'Voz neutra e clara, tom médio, ideal para e-learning.',
    apiName: 'Zephyr', // Generally clear and neutral
  },
  {
    id: 'helena',
    name: 'Helena',
    description: 'Voz profunda e feminina, tom médio-baixo, para textos sérios.',
    apiName: 'Puck', // Can be deeper and more resonant
  },
  {
    id: 'juliana',
    name: 'Juliana',
    description: 'Voz alegre e rápida, tom alto, para vídeos curtos e dinâmicos.',
    apiName: 'Sol', // Bright and energetic connotation
  },
  {
    id: 'valentina',
    name: 'Valentina',
    description: 'Voz suave, tom médio, para audiobooks ou leituras longas.',
    apiName: 'Fenrir', // A smooth, consistent voice
  },
];
