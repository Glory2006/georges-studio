// ════════════════════════════════════════════════════════════════
// 📝 INTÉGRATION DU FRONTEND - Guide d'implémentation
// ════════════════════════════════════════════════════════════════
// Ce fichier documente comment intégrer la logique d'availability
// dans votre component App.tsx
// ════════════════════════════════════════════════════════════════

/**
 * ÉTAPES D'INTÉGRATION :
 * 
 * 1. Importer le module d'availability :
 *    import { getSlotStatus, formatTime, getSlotStyleClasses, isTimePassed } from './lib/availability';
 * 
 * 2. Ajouter une fonction pour récupérer la config du studio :
 * 
 *    async function fetchStudioConfig() {
 *      try {
 *        const res = await fetch(`${API_URL}/config/studio`);
 *        const config = await res.json();
 *        return config;
 *      } catch (err) {
 *        console.error('Erreur config studio:', err);
 *        return {
 *          opening_time: '09:00',
 *          closing_time: '20:00',
 *          default_slot_duration: 60
 *        };
 *      }
 *    }
 * 
 * 3. Générer les créneaux disponibles selon la config :
 * 
 *    function generateTimeSlots(config) {
 *      const slots = [];
 *      const [startHour, startMin] = config.opening_time.split(':').map(Number);
 *      const [endHour, endMin] = config.closing_time.split(':').map(Number);
 *      
 *      let current = new Date(0, 0, 0, startHour, startMin);
 *      const end = new Date(0, 0, 0, endHour, endMin);
 *      const duration = config.default_slot_duration || 60;
 *      
 *      while (current < end) {
 *        const start = current.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
 *        current.setMinutes(current.getMinutes() + duration);
 *        const finish = current.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
 *        
 *        if (current <= end) {
 *          slots.push({ start, finish, label: `${start} - ${finish}` });
 *        }
 *      }
 *      
 *      return slots;
 *    }
 * 
 * 4. Améliorer l'affichage du calendrier :
 * 
 *    - Le popover des heures DOIT s'ouvrir EN HAUT (position: 'top' ou similaire)
 *    - Les créneaux passés doivent être grisés et non-cliquables
 *    - Les créneaux en attente doivent être jaunes et non-cliquables
 *    - Les créneaux réservés (acceptés) doivent être rouges et non-cliquables
 *    - Les créneaux disponibles doivent être verts et cliquables
 * 
 * 5. Exemple de rendu pour les heures :
 * 
 *    {selectedDayString && showHoursPopover && (
 *      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 ...">
 *        {getHoursList().map(hour => {
 *          const status = getSlotStatus({
 *            date_dispo: selectedDayString,
 *            heure_debut: hour.start,
 *            heure_fin: hour.finish,
 *            id: hour.id
 *          }, blockedBookings);
 *          
 *          const styles = getSlotStyleClasses(status);
 *          const isDisabled = styles.disabled;
 *          
 *          return (
 *            <button
 *              key={hour.id}
 *              disabled={isDisabled}
 *              onClick={() => selectHour(hour)}
 *              className={`px-4 py-2 rounded transition-colors ${styles.bgClass} ${styles.textClass}`}
 *            >
 *              {hour.label}
 *            </button>
 *          );
 *        })}
 *      </div>
 *    )}
 * 
 * 6. Validation avant submission :
 * 
 *    const submitBooking = async () => {
 *      if (!selectedDayString || (!selectedSlotId && !selectedCustomTime)) {
 *        setBookingError('Veuillez sélectionner une date et une heure');
 *        return;
 *      }
 *      
 *      // Vérifier que l'heure n'est pas passée
 *      if (isTimePassed(selectedDayString, selectedCustomTime?.start || ...)) {
 *        setBookingError('L\'heure sélectionnée est passée');
 *        return;
 *      }
 *      
 *      // Procéder à la réservation...
 *    };
 */

/**
 * REMARQUES IMPORTANTES :
 * 
 * ✅ Créneaux PASSÉS :
 *    - Affichage : grisés (opacity-50, bg-gray-500/20)
 *    - Interaction : non-cliquables (cursor-not-allowed)
 *    - Ces créneaux doivent être grisés lors du rendu du calendrier
 * 
 * ✅ Créneaux EN ATTENTE (réservation en attente) :
 *    - Affichage : jaunes (bg-yellow-500/20, text-yellow-400)
 *    - Interaction : non-cliquables (cursor-not-allowed)
 *    - Statut envoyé depuis API dans blocked_bookings avec statut='en_attente'
 * 
 * ✅ Créneaux RÉSERVÉS (acceptés par admin) :
 *    - Affichage : rouges (bg-red-500/20, text-red-400)
 *    - Interaction : non-cliquables (cursor-not-allowed)
 *    - Statut envoyé depuis API avec statut='accepte' OU est_reserve=true
 * 
 * ✅ Créneaux DISPONIBLES :
 *    - Affichage : verts (bg-emerald-500/20, text-emerald-400)
 *    - Interaction : cliquables
 *    - L'heure sélectionnée doit être sauvegardée dans l'état
 * 
 * ⚠️ POSITIONNEMENT DU CALENDRIER :
 *    - Le popover DOIT s'ouvrir EN HAUT (top position)
 *    - Ne pas le mettre sous le bouton, le mettre au-dessus
 *    - Utiliser z-index suffisant pour passer par-dessus les autres éléments
 * 
 * 🔒 VALIDATION :
 *    - Vérifier que l'heure n'est pas passée avant POST
 *    - Vérifier que l'heure est dans les heures d'ouverture
 *    - Le backend fait la même vérification (double validation)
 */

export default {};
