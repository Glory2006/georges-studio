// ════════════════════════════════════════════════════════════════
// 🎯 LOGIQUE D'AVAILABILITY - Frontend
// ════════════════════════════════════════════════════════════════
// Ce fichier contient la logique côté frontend pour gérer :
// - Les créneaux passés (non sélectionnables)
// - Les créneaux en attente (grisés mais affichés)
// - Les créneaux réservés (non sélectionnables)
// ════════════════════════════════════════════════════════════════

/**
 * 🕐 Déterminer si une heure est passée pour le jour actuel
 * @param {string} dateStr - Format YYYY-MM-DD
 * @param {string} timeStr - Format HH:MM ou HH:MM:SS
 * @returns {boolean} true si l'heure est passée
 */
export function isTimePassed(dateStr, timeStr) {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Si la date est dans le passé
    if (dateStr < today) {
      return true;
    }

    // Si c'est aujourd'hui, vérifier l'heure
    if (dateStr === today) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      return slotTime <= now;
    }

    return false;
  } catch (err) {
    console.error('Erreur isTimePassed:', err);
    return false;
  }
}

/**
 * 📍 Récupérer le statut d'un créneau
 * Statuts : 'available' | 'pending' | 'booked' | 'passed'
 * @param {Object} slot - Créneau { date_dispo, heure_debut, ... }
 * @param {Array} blockedBookings - Réservations actives
 * @returns {string} Statut du créneau
 */
export function getSlotStatus(slot, blockedBookings = []) {
  // 1. Vérifier si l'heure est passée
  const startTime = slot.heure_debut || slot.start;
  if (isTimePassed(slot.date_dispo || slot.date, startTime.substring(0, 5))) {
    return 'passed';
  }

  // 2. Vérifier si le créneau est en attente ou réservé
  const bookingOnSlot = blockedBookings.find(b => {
    // Si disponibilite_id existe, matcher directement
    if (slot.id && b.disponibilite_id === slot.id) return true;

    // Sinon, matcher par date et heure
    if (b.date_seance === (slot.date_dispo || slot.date)) {
      const [bHour, bMin] = b.heure_seance.split(':').map(Number);
      const [sStartHour, sStartMin] = (slot.heure_debut || slot.start).split(':').map(Number);
      const [sEndHour, sEndMin] = (slot.heure_fin || slot.end).split(':').map(Number);

      const bTime = bHour * 60 + bMin;
      const sStartTime = sStartHour * 60 + sStartMin;
      const sEndTime = sEndHour * 60 + sEndMin;

      return bTime >= sStartTime && bTime < sEndTime;
    }

    return false;
  });

  if (bookingOnSlot) {
    return bookingOnSlot.statut === 'accepte' ? 'booked' : 'pending';
  }

  return 'available';
}

/**
 * 📋 Filtrer les créneaux disponibles pour un jour donné
 * Exclut : créneaux passés, en attente, réservés
 * @param {Array} slots - Créneaux disponibles
 * @param {string} dateStr - Date YYYY-MM-DD
 * @param {Array} blockedBookings - Réservations actives
 * @returns {Array} Créneaux sélectionnables
 */
export function getAvailableSlotsForDay(slots, dateStr, blockedBookings = []) {
  return slots
    .filter(slot => slot.date_dispo === dateStr)
    .filter(slot => {
      const status = getSlotStatus(slot, blockedBookings);
      return status === 'available'; // Seulement les disponibles
    });
}

/**
 * 🎯 Récupérer tous les créneaux (y compris passed/pending/booked) pour affichage
 * @param {Array} slots - Créneaux disponibles
 * @param {string} dateStr - Date YYYY-MM-DD
 * @param {Array} blockedBookings - Réservations actives
 * @returns {Array} Créneaux avec statut
 */
export function getAllSlotsForDayWithStatus(slots, dateStr, blockedBookings = []) {
  return slots
    .filter(slot => slot.date_dispo === dateStr)
    .map(slot => ({
      ...slot,
      status: getSlotStatus(slot, blockedBookings)
    }))
    .sort((a, b) => {
      const aTime = a.heure_debut || a.start;
      const bTime = b.heure_debut || b.start;
      return aTime.localeCompare(bTime);
    });
}

/**
 * 🕰️ Obtenir les créneaux passés pour un jour
 * @param {Array} slots - Créneaux disponibles
 * @param {string} dateStr - Date YYYY-MM-DD
 * @returns {Array} Créneaux passés
 */
export function getPassedSlotsForDay(slots, dateStr) {
  return slots
    .filter(slot => slot.date_dispo === dateStr)
    .filter(slot => isTimePassed(slot.date_dispo, slot.heure_debut || slot.start));
}

/**
 * 🚫 Vérifier si un jour entier est bloqué
 * @param {Array} slots - Créneaux
 * @param {string} dateStr - Date YYYY-MM-DD
 * @param {Array} blockedBookings - Réservations actives
 * @returns {boolean} true si aucun créneau disponible
 */
export function isDayFullyBooked(slots, dateStr, blockedBookings = []) {
  const slotsForDay = slots.filter(s => s.date_dispo === dateStr);
  if (slotsForDay.length === 0) return false;

  // Vérifier s'il y a au moins un créneau disponible
  const availableSlots = slotsForDay.filter(s => getSlotStatus(s, blockedBookings) === 'available');
  return availableSlots.length === 0;
}

/**
 * 🎨 Déterminer les classes CSS pour un créneau
 * @param {string} status - 'available' | 'pending' | 'booked' | 'passed'
 * @returns {Object} { bgClass, textClass, disabled }
 */
export function getSlotStyleClasses(status) {
  switch (status) {
    case 'available':
      return {
        bgClass: 'bg-emerald-500/20 hover:bg-emerald-500/30 cursor-pointer',
        textClass: 'text-emerald-400',
        disabled: false
      };
    case 'pending':
      return {
        bgClass: 'bg-yellow-500/20 cursor-not-allowed opacity-60',
        textClass: 'text-yellow-400',
        disabled: true
      };
    case 'booked':
      return {
        bgClass: 'bg-red-500/20 cursor-not-allowed opacity-60',
        textClass: 'text-red-400',
        disabled: true
      };
    case 'passed':
      return {
        bgClass: 'bg-gray-500/20 cursor-not-allowed opacity-50',
        textClass: 'text-gray-400',
        disabled: true
      };
    default:
      return {
        bgClass: 'bg-gray-500/20',
        textClass: 'text-gray-400',
        disabled: true
      };
  }
}

/**
 * ⏰ Formater l'heure pour affichage
 * HH:MM:SS → HH:MM
 * @param {string} timeStr - Heure à formatter
 * @returns {string} Heure au format HH:MM
 */
export function formatTime(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : timeStr;
}

/**
 * 📊 Obtenir un label descriptif pour le statut
 * @param {string} status - Statut du créneau
 * @returns {string} Label en français
 */
export function getStatusLabel(status) {
  const labels = {
    'available': 'Disponible',
    'pending': 'En attente',
    'booked': 'Réservé',
    'passed': 'Passé'
  };
  return labels[status] || 'Unknown';
}
