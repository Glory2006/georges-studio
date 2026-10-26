// Configuration de l'application Georges Studio
export const STUDIO_NAME = 'Georges Studio';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Numéro WhatsApp du photographe au format international (sans + ni 00).
export const WHATSAPP_NUMBER = '22961972480';

// Message de contact par défaut
export const getWhatsAppMessage = (categoryName?: string) => {
  if (categoryName) {
    return `Bonjour, je vous contacte depuis le site Georges Studio. Je serais intéressé par une séance photo de type "${categoryName}".`;
  }
  return `Bonjour, je vous contacte depuis le site Georges Studio. J'aimerais échanger avec vous à propos de vos prestations.`;
};
