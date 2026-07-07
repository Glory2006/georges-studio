# 🎯 TODO Frontend - Implémentation des Améliorations

## 📝 Liste des Tâches

### 1. Importer le Module d'Availability
**Fichier** : `src/App.tsx`
**Action** : Ajouter au début du fichier
```typescript
import { 
  isTimePassed, 
  getSlotStatus, 
  getSlotStyleClasses,
  getAllSlotsForDayWithStatus,
  formatTime 
} from './lib/availability';
```

### 2. Récupérer la Configuration du Studio
**Fichier** : `src/App.tsx`
**Action** : Ajouter une fonction de fetch
```typescript
// Dans useEffect pour charger la config
const fetchStudioConfig = async () => {
  try {
    const res = await fetch(`${API_URL}/config/studio`);
    const config = await res.json();
    // Sauvegarder dans l'état ou l'utiliser directement
    return config;
  } catch (err) {
    console.error('Config studio:', err);
    // Fallback aux valeurs par défaut
    return {
      opening_time: '09:00',
      closing_time: '20:00',
      default_slot_duration: 60
    };
  }
};
```

### 3. Améliorer l'Affichage du Calendrier
**Action** : Modifier la section affichage des heures (popover)
**Localisation** : Ligne ~888 (rechercher "Créneaux du")

**Avant** :
```jsx
{availabilities.map(a => (
  // ... affichage basique
))}
```

**Après** :
```jsx
{getAllSlotsForDayWithStatus(availabilities, selectedDayString, blockedBookings)
  .map(slot => {
    const styles = getSlotStyleClasses(slot.status);
    const timeLabel = `${formatTime(slot.heure_debut)} - ${formatTime(slot.heure_fin)}`;
    
    return (
      <button
        key={slot.id}
        disabled={styles.disabled}
        onClick={() => {
          setSelectedSlotId(slot.id);
          setSelectedCustomTime({ start: slot.heure_debut, end: slot.heure_fin });
          setShowHoursPopover(false);
        }}
        className={`px-4 py-2 rounded transition-colors ${styles.bgClass} ${styles.textClass}`}
        title={`${slot.status}: ${timeLabel}`}
      >
        {timeLabel}
      </button>
    );
  })}
```

### 4. Positionner le Calendrier EN HAUT
**Action** : Modifier le CSS du popover
**Rechercher** : `showHoursPopover &&` (ligne ~882)

**À faire** : Ajouter/modifier le style pour positionner en top
```jsx
<div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 
             bg-[#1A1A1A] border border-white/5 rounded-xl p-4 
             w-80 max-h-96 overflow-y-auto shadow-lg">
  {/* Contenu du popover */}
</div>
```

### 5. Améliorer la Validation avant Submission
**Fichier** : `src/App.tsx`
**Localisation** : Dans la fonction de submit de réservation (ligne ~420)

**Ajouter ces vérifications** :
```typescript
// Vérifier que l'heure n'est pas passée
if (selectedDayString && selectedCustomTime) {
  if (isTimePassed(selectedDayString, selectedCustomTime.start)) {
    setBookingError('L\'heure sélectionnée est passée. Choisissez une autre heure.');
    return;
  }
}

// Vérifier que les heures sont dans les limites du studio
if (selectedCustomTime) {
  const [slotHour, slotMin] = selectedCustomTime.start.split(':').map(Number);
  const [openHour, openMin] = openingTime.split(':').map(Number);
  const [closeHour, closeMin] = closingTime.split(':').map(Number);
  
  const slotMinutes = slotHour * 60 + slotMin;
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;
  
  if (slotMinutes < openMinutes || slotMinutes >= closeMinutes) {
    setBookingError(`L'heure doit être entre ${openingTime} et ${closingTime}`);
    return;
  }
}
```

### 6. Afficher les États de Créneaux Visuellement
**Action** : Ajouter une légende près du calendrier

```jsx
{selectedDayString && (
  <div className="text-xs text-gray-500 space-y-1 mt-3">
    <p className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
      Disponible
    </p>
    <p className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
      En attente
    </p>
    <p className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-red-400"></span>
      Réservé
    </p>
    <p className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
      Passé
    </p>
  </div>
)}
```

### 7. Tester l'Intégration
**À faire** :
- [ ] Ouvrir le navigateur et vérifier que le calendrier s'affiche EN HAUT
- [ ] Sélectionner aujourd'hui → vérifier que les heures passées sont grisées
- [ ] Sélectionner une heure passée → vérifier qu'elle est désactivée
- [ ] Vérifier les couleurs (vert/jaune/rouge/gris)
- [ ] Soumettre une réservation et vérifier l'erreur si heure passée
- [ ] Ouvrir Admin → vérifier que la réservation apparaît

## 🎨 Styles CSS à Appliquer

Les statuts retournés par `getSlotStyleClasses()` :

```javascript
// Disponible (VERT)
bgClass: 'bg-emerald-500/20 hover:bg-emerald-500/30 cursor-pointer'
textClass: 'text-emerald-400'

// En attente (JAUNE)
bgClass: 'bg-yellow-500/20 cursor-not-allowed opacity-60'
textClass: 'text-yellow-400'

// Réservé (ROUGE)
bgClass: 'bg-red-500/20 cursor-not-allowed opacity-60'
textClass: 'text-red-400'

// Passé (GRIS)
bgClass: 'bg-gray-500/20 cursor-not-allowed opacity-50'
textClass: 'text-gray-400'
```

## 🔍 Points d'Attention

⚠️ **Popover Position** : DOIT s'ouvrir EN HAUT, pas en bas
- Utiliser `position: fixed; top: 80px; left: 50%;`
- Ou utiliser une bilbliothèque de popover (Headless UI, etc.)

⚠️ **Statuts en Attente** : Vérifier que `blockedBookings` contient le statut
- Backend retourne : `{ blocked_bookings: [ { ..., statut: 'en_attente' } ] }`

⚠️ **Format Heure** : Attention à la conversion
- Backend : HH:MM:SS
- Frontend : HH:MM (on coupe les secondes)

⚠️ **Validation Double** : Frontend + Backend
- Frontend : pour UX immédiate
- Backend : pour sécurité

## ✅ Checklist Finale

- [ ] Module availability importé
- [ ] Config studio récupérée
- [ ] Heures passées grisées
- [ ] Créneaux en attente jaunes
- [ ] Créneaux réservés rouges
- [ ] Calendrier EN HAUT
- [ ] Validation avant submit
- [ ] Tests E2E complets
