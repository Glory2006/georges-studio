import { useState, useEffect, useCallback } from 'react';
import { API_URL, WHATSAPP_NUMBER, getWhatsAppMessage } from './config';
import './App.css';

// ============================================================
// TYPES & INTERFACES
// ============================================================
interface TypePhoto {
  id: string;
  nom: string;
  description: string | null;
  slug: string;
  prix_indicatif: number | string | null;
  nbPhotos?: number;
}

interface Photo {
  id: string;
  type_id: string;
  url_image: string;
  legende: string | null;
  ordre: number;
}

interface Disponibilite {
  id: string;
  date_dispo: string; // YYYY-MM-DD
  heure_debut: string; // HH:MM:SS
  heure_fin: string; // HH:MM:SS
  est_reserve?: boolean;
}

interface BlockedBooking {
  disponibilite_id: string | null;
  date_seance: string; // YYYY-MM-DD
  heure_seance: string; // HH:MM:SS
  heure_seance_end?: string | null;
  statut?: 'en_attente' | 'accepte';
}

interface StudioConfig {
  opening_time: string;
  closing_time: string;
  default_slot_duration: number;
}
const MOCK_CATEGORIES: TypePhoto[] = [
  { id: 'cat-mariage', nom: 'Mariage', description: 'Immortalisez les émotions, la complicité et la splendeur du plus beau jour de votre vie avec un photoreportage complet et raffiné.', slug: 'mariage', prix_indicatif: '450000' },
  { id: 'cat-portrait', nom: 'Portrait & Profil', description: 'Séance photo personnalisée en extérieur ou en studio. Idéal pour vos profils professionnels, vos réseaux sociaux ou pour vous faire plaisir.', slug: 'portrait', prix_indicatif: '120000' },
  { id: 'cat-grossesse', nom: 'Maternité & Famille', description: 'Une séance douce pour capturer la magie de la grossesse, les premiers jours de votre bébé, ou des instants précieux en famille.', slug: 'grossesse', prix_indicatif: '180000' },
  { id: 'cat-corporate', nom: 'Entreprise & Corporate', description: 'Valorisez l\'image de votre marque, vos collaborateurs, vos locaux et vos événements professionnels avec des clichés haute définition.', slug: 'corporate', prix_indicatif: '250000' }
];
const MESSAGE_SUGGESTIONS: Record<string, string> = {
  mariage: "Je souhaite réserver une séance photo de mariage. Je reste ouvert(e) aux conseils du photographe sur le lieu et le style, et je me conformerai aux règles du studio.",
  portrait: "Je souhaite faire une séance portrait. Je peux toutefois ajuster le style ou le cadre sur place selon les suggestions du photographe, en respectant les règles du studio.",
  grossesse: "Je souhaite une séance photo de grossesse/famille. Je reste flexible sur les détails et me conformerai aux règles du studio.",
  corporate: "Je souhaite organiser une séance photo pour mon entreprise. Je peux ajuster certains aspects sur place selon les recommandations du photographe, dans le respect des règles du studio.",
};

const getDefaultSuggestion = (categoryNom: string) =>
  `Je souhaite faire une séance photo de type "${categoryNom}". Je reste ouvert(e) à changer de type sur place selon les conseils du photographe, en respectant les règles du studio.`;

const MOCK_PHOTOS: Photo[] = [
  // Mariage
  { id: 'ph-m1', type_id: 'cat-mariage', url_image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80', legende: 'Cérémonie laïque sous l\'arche fleurie', ordre: 1 },
  { id: 'ph-m2', type_id: 'cat-mariage', url_image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=80', legende: 'Regard complice des mariés', ordre: 2 },
  { id: 'ph-m3', type_id: 'cat-mariage', url_image: 'https://images.unsplash.com/photo-1519225495810-7517c2440ed7?w=800&auto=format&fit=crop&q=80', legende: 'Échange des alliances au coucher de soleil', ordre: 3 },
  // Portrait
  { id: 'ph-p1', type_id: 'cat-portrait', url_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80', legende: 'Portrait naturel en lumière dorée', ordre: 1 },
  { id: 'ph-p2', type_id: 'cat-portrait', url_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80', legende: 'Portrait studio noir et blanc contrasté', ordre: 2 },
  { id: 'ph-p3', type_id: 'cat-portrait', url_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80', legende: 'Portrait corporate souriant en extérieur', ordre: 3 },
  // Grossesse
  { id: 'ph-g1', type_id: 'cat-grossesse', url_image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&auto=format&fit=crop&q=80', legende: 'Douce attente en nature', ordre: 1 },
  { id: 'ph-g2', type_id: 'cat-grossesse', url_image: 'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=800&auto=format&fit=crop&q=80', legende: 'Premiers pas de bébé en famille', ordre: 2 },
  // Corporate
  { id: 'ph-c1', type_id: 'cat-corporate', url_image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80', legende: 'Architecture de locaux modernes', ordre: 1 },
  { id: 'ph-c2', type_id: 'cat-corporate', url_image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80', legende: 'Collaboration active lors d\'un séminaire', ordre: 2 }
];

const DEFAULT_STUDIO_CONFIG: StudioConfig = {
  opening_time: '09:00',
  closing_time: '20:00',
  default_slot_duration: 60
};

function App() {
  // Navigation State
  const [currentPage, setCurrentPage] = useState<'home' | 'detail' | 'booking'>('home');
  const [selectedCategory, setSelectedCategory] = useState<TypePhoto | null>(null);

  // Global Data States
  const [categories, setCategories] = useState<TypePhoto[]>([]);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [usingMockData, setUsingMockData] = useState<boolean>(false);

  // Auto-cycling Cover Images State (every 30 seconds)
  const [coverIndices, setCoverIndices] = useState<Record<string, number>>({});

  // Category Details Slider Index
  const [detailSliderIndex, setDetailSliderIndex] = useState<number>(0);
  const [categoryPhotos, setCategoryPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState<boolean>(false);

  // Booking Page state
  const [availabilities, setAvailabilities] = useState<Disponibilite[]>([]);
  const [blockedBookings, setBlockedBookings] = useState<BlockedBooking[]>([]);
  const [loadingAvailabilities, setLoadingAvailabilities] = useState<boolean>(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [studioConfig, setStudioConfig] = useState<StudioConfig>(DEFAULT_STUDIO_CONFIG);
  
  // Slot selection state
  const [selectedDayString, setSelectedDayString] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedCustomTime, setSelectedCustomTime] = useState<{ start: string; end: string } | null>(null);
  const [showHoursPopover, setShowHoursPopover] = useState<boolean>(false);

  // Booking Form Fields
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientMessage, setClientMessage] = useState<string>('');

  // Form Submit States
  const [submittingBooking, setSubmittingBooking] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  const suggestMessage = () => {
    if (!selectedCategory) return;
    const suggestion = MESSAGE_SUGGESTIONS[selectedCategory.slug] || getDefaultSuggestion(selectedCategory.nom);
    setClientMessage(suggestion);
  };
   // ============================================================
   // INITIAL DATA FETCHING
   // ============================================================
   useEffect(() => {
     async function fetchData() {
       try {
         setLoading(true);
         // Fetch categories
         const catRes = await fetch(`${API_URL}/type-photos`);
         const catData = await catRes.json();
         
         // Fetch photos
         const photoRes = await fetch(`${API_URL}/photos`);
         const photoData = await photoRes.json();

         const configRes = await fetch(`${API_URL}/config/studio`);
         if (configRes.ok) {
           const configData = await configRes.json();
           setStudioConfig({
             opening_time: configData.opening_time || DEFAULT_STUDIO_CONFIG.opening_time,
             closing_time: configData.closing_time || DEFAULT_STUDIO_CONFIG.closing_time,
             default_slot_duration: Number(configData.default_slot_duration) || 60
           });
         }

         const fetchedCats = catData.type_photos || [];
         interface RawPhoto {
  id: string;
  type_id?: string;
  url_image: string;
  legende: string | null;
  ordre: number;
  type_photos?: { id: string };
}

const fetchedPhotos = (photoData.photos || []).map((p: RawPhoto) => ({
           ...p,
           type_id: p.type_id || p.type_photos?.id
         }));

         if (fetchedCats.length === 0) {
           console.warn("Utilisation des données fictives.");
           setCategories(MOCK_CATEGORIES);
           setAllPhotos(MOCK_PHOTOS);
           setUsingMockData(true);
         } else {
           setCategories(fetchedCats);
           setAllPhotos(fetchedPhotos);
           setUsingMockData(false);
         }

       } catch (err) {
         console.error("Erreur backend client API :", err);
         setCategories(MOCK_CATEGORIES);
         setAllPhotos(MOCK_PHOTOS);
         setUsingMockData(true);
       } finally {
         setLoading(false);
       }
     }

     fetchData();
   }, []);

  // Fetch photos for a specific category when detailed view is opened
  useEffect(() => {
    if (!selectedCategory) return;
    const activeCategory = selectedCategory;
    

    async function fetchCategoryPhotos() {
      setDetailSliderIndex(0);
      setLoadingPhotos(true);
      try {
        if (usingMockData) {
          const filtered = MOCK_PHOTOS.filter(p => p.type_id === activeCategory.id);
          setCategoryPhotos(filtered);
        } else {
          const res = await fetch(`${API_URL}/photos/par-categorie/${activeCategory.slug}`);
          if (res.ok) {
            const data = await res.json();
            setCategoryPhotos(data.photos || []);
          } else {
            const filtered = allPhotos.filter(p => p.type_id === activeCategory.id);
            setCategoryPhotos(filtered);
          }
        }
      } catch (err) {
        console.error("Erreur photos :", err);
        const filtered = allPhotos.filter(p => p.type_id === activeCategory.id);
        setCategoryPhotos(filtered);
      } finally {
        setLoadingPhotos(false);
      }
    }

    fetchCategoryPhotos();
  }, [selectedCategory, usingMockData, allPhotos]);

  // Fetch availabilities when booking page is opened
  useEffect(() => {
    if (currentPage !== 'booking') return;

    async function fetchAvailabilities() {
      setLoadingAvailabilities(true);
      try {
        if (usingMockData) {
          const now = new Date();
          const year = now.getFullYear();
          const month = now.getMonth();
          const generatedDispos: Disponibilite[] = [
            { id: 'slot-1', date_dispo: `${year}-${String(month + 1).padStart(2, '0')}-18`, heure_debut: '09:00:00', heure_fin: '10:00:00' },
            { id: 'slot-2', date_dispo: `${year}-${String(month + 1).padStart(2, '0')}-18`, heure_debut: '14:00:00', heure_fin: '15:00:00' },
            { id: 'slot-3', date_dispo: `${year}-${String(month + 1).padStart(2, '0')}-20`, heure_debut: '11:00:00', heure_fin: '12:00:00' }
          ];
          const generatedBlocked: BlockedBooking[] = [
            { disponibilite_id: null, date_seance: `${year}-${String(month + 1).padStart(2, '0')}-18`, heure_seance: '11:00:00', statut: 'en_attente' },
            { disponibilite_id: null, date_seance: `${year}-${String(month + 1).padStart(2, '0')}-22`, heure_seance: '00:00:00', statut: 'accepte' }
          ];
          setAvailabilities(generatedDispos);
          setBlockedBookings(generatedBlocked);
        } else {
          const res = await fetch(`${API_URL}/disponibilites`);
          const data = await res.json();
          setAvailabilities(data.disponibilites || []);
          setBlockedBookings(data.blocked_bookings || []);
        }
      } catch (err) {
        console.error("Erreur disponibilites :", err);
      } finally {
        setLoadingAvailabilities(false);
      }
    }

    fetchAvailabilities();
  }, [currentPage, usingMockData]);

  // ============================================================
  // AUTO-PLAY CAROUSEL COVERS (30s)
  // ============================================================
  useEffect(() => {
    const interval = setInterval(() => {
      setCoverIndices(prev => {
        const next = { ...prev };
        categories.forEach(cat => {
          const catPhotos = allPhotos.filter(p => p.type_id === cat.id);
          if (catPhotos.length > 1) {
            const currentIdx = prev[cat.id] || 0;
            next[cat.id] = (currentIdx + 1) % catPhotos.length;
          }
        });
        return next;
      });
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [categories, allPhotos]);
  // Placez ceci AVANT le useEffect du bookingSuccess (~ligne 268)
  const navigateToHome = useCallback(() => {
    setSelectedCategory(null);
    setCurrentPage('home');
    setBookingSuccess(null);
    setBookingError(null);
  }, []);
  // Auto-redirect après 5s quand réservation réussie
  // ============================================================
  // HELPERS
  // ============================================================
  // Retrieve the current cover photo for a category (takes automatic rotation index into account)
  const getCategoryCover = (categoryId: string) => {
    const catPhotos = allPhotos.filter(p => p.type_id === categoryId);
    if (catPhotos.length === 0) {
      return 'https://images.unsplash.com/photo-1452587925148-ce544e77e60d?w=800&auto=format&fit=crop&q=80';
    }
    const coverIdx = coverIndices[categoryId] || 0;
    const targetIdx = coverIdx % catPhotos.length;
    return catPhotos[targetIdx].url_image;
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeStr;
  };

  const timeToMinutes = (timeStr: string) => {
    const [hours = 0, minutes = 0] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
  };

  const getGeneratedStudioSlots = (dateString: string): Disponibilite[] => {
    const slots: Disponibilite[] = [];
    const duration = studioConfig.default_slot_duration || 60;
    const open = timeToMinutes(studioConfig.opening_time);
    const close = timeToMinutes(studioConfig.closing_time);

    for (let current = open; current + duration <= close; current += duration) {
      slots.push({
        id: `custom-${dateString}-${current}`,
        date_dispo: dateString,
        heure_debut: minutesToTime(current),
        heure_fin: minutesToTime(current + duration),
        est_reserve: false
      });
    }

    slots.push({
      id: `custom-${dateString}-full-day`,
      date_dispo: dateString,
      heure_debut: '00:00:00',
      heure_fin: '23:59:59',
      est_reserve: false
    });

    return slots;
  };

  const getSlotsForDay = (dateString: string) => {
    const officialSlots = availabilities.filter(a => a.date_dispo === dateString);
    return officialSlots.length > 0 ? officialSlots : getGeneratedStudioSlots(dateString);
  };

  const getSlotStatus = (slot: Disponibilite): 'available' | 'pending' | 'booked' | 'passed' => {
    if (slot.est_reserve) return 'booked';
    const isFullDaySlot = slot.heure_debut === '00:00:00' || slot.heure_debut === '00:00';
    if (!isFullDaySlot && isTimePassed(slot.date_dispo, slot.heure_debut)) return 'passed';
    if (isFullDaySlot && slot.date_dispo <= new Date().toISOString().split('T')[0]) return 'passed';

    const booking = blockedBookings.find(b => {
      if (b.disponibilite_id && b.disponibilite_id === slot.id) return true;
      if (b.date_seance !== slot.date_dispo) return false;
      const isFullDayBooking = b.heure_seance === '00:00:00' || b.heure_seance === '00:00';
      if (isFullDaySlot) return isFullDayBooking;
      if (isFullDayBooking) return true;
      const bookingTime = timeToMinutes(b.heure_seance);
      return bookingTime >= timeToMinutes(slot.heure_debut) && bookingTime < timeToMinutes(slot.heure_fin);
    });

    if (!booking) return 'available';
    return booking.statut === 'accepte' ? 'booked' : 'pending';
  };

  const getSlotStatusLabel = (status: ReturnType<typeof getSlotStatus>) => {
    if (status === 'pending') return 'En attente';
    if (status === 'booked') return 'Réservé';
    if (status === 'passed') return 'Passé';
    return 'Disponible';
  };

  const isTimePassed = (dateStr: string, timeStr: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    if (dateStr < today) return true;
    if (dateStr > today) return false;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    return slotTime <= now;
  };

  const formatDateFrench = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    return dateStr;
  };

  const navigateToBooking = () => {
    // If no category was selected, select the first one as default
    if (!selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0]);
    }
    setCurrentPage('booking');
    setBookingSuccess(null);
    setBookingError(null);
  };

  // WhatsApp redirection helper
  const handleWhatsAppRedirect = (category?: TypePhoto | null) => {
    const activeCatName = category ? category.nom : undefined;
    const encodedMsg = encodeURIComponent(getWhatsAppMessage(activeCatName));
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMsg}`;
    window.open(url, '_blank');
  };

  // ============================================================
  // CALENDAR GENERATION LOGIC
  // ============================================================
  const year = currentCalendarMonth.getFullYear();
  const month = currentCalendarMonth.getMonth(); // 0-indexed

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();

  // Offset so Monday is 0: (day + 6) % 7
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

  const calendarDays: { type: 'empty' | 'day'; dayNum?: number; dateString?: string }[] = [];

  // 1. Offset spaces
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push({ type: 'empty' });
  }

  // 2. Calendar Month Days
  const todayString = new Date().toISOString().split('T')[0];
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({
      type: 'day',
      dayNum: d,
      dateString
    });
  }

  const handlePrevMonth = () => {
    setCurrentCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDayString(null);
    setSelectedSlotId(null);
    setSelectedCustomTime(null);
  };

  const handleNextMonth = () => {
    setCurrentCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDayString(null);
    setSelectedSlotId(null);
    setSelectedCustomTime(null);
  };

  const selectDay = (dateString: string) => {
    setSelectedDayString(dateString);
    setSelectedSlotId(null); 
    setSelectedCustomTime(null);
    setShowHoursPopover(true);
  };

  // Check if a date string YYYY-MM-DD has an active full-day booking or if all slots are blocked
  const isDayFullyBlocked = (dateString: string) => {
    const hasFullDayBlock = blockedBookings.some(b => {
      if (b.date_seance !== dateString) return false;
      const isOldFullDay = b.heure_seance === '00:00:00' || b.heure_seance === '00:00';
      const isNewFullDay = b.heure_seance === `${studioConfig.opening_time}:00` 
        && b.heure_seance_end === `${studioConfig.closing_time}:00`;
      return isOldFullDay || isNewFullDay;
    });
    if (hasFullDayBlock) return true;

    const slotsForDay = getSlotsForDay(dateString);
    return slotsForDay.length > 0 && slotsForDay.every(slot => getSlotStatus(slot) !== 'available');
  };

  // Vérifier si le studio est fermé un jour donné (ex: dimanche)
  const isStudioClosedOnDay = (dateString: string): boolean => {
    const date = new Date(dateString + 'T00:00:00');
    const dayOfWeek = date.getDay(); // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
    
    // Pour l'instant, on suppose que le studio ferme les dimanches (dayOfWeek === 0)
    // À adapter selon ta politique de fermeture
    if (dayOfWeek === 0) return true; // Fermé le dimanche
    
    return false;
  };

  // ============================================================
  // BOOKING FORM SUBMISSION
  // ============================================================
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(null);
    setBookingError(null);

    // Validate inputs
    if (!clientName.trim() || !clientEmail.trim() || !clientPhone.trim()) {
      setBookingError("Veuillez remplir vos coordonnées (Nom, Email et Téléphone).");
      return;
    }

    if (!selectedCategory) {
      setBookingError("Veuillez sélectionner un type de séance.");
      return;
    }

    // A slot must be chosen
    if (!selectedDayString) {
      setBookingError("Veuillez choisir un jour dans le calendrier de réservation.");
      return;
    }

    const finalDate = selectedDayString;
    let finalTime!: string;
    let finalEndTime!: string; 
    let dispoId: string | null = null;

    if (selectedSlotId) {
      let activeSlot = availabilities.find(a => a.id === selectedSlotId);
      
      if (!activeSlot && selectedDayString) {
        const generatedSlots = getGeneratedStudioSlots(selectedDayString);
        activeSlot = generatedSlots.find(s => s.id === selectedSlotId);
      }
      
      if (!activeSlot) {
        setBookingError("Créneau choisi invalide.");
        return;
      }
      finalTime = activeSlot.heure_debut;
      finalEndTime = activeSlot.heure_fin;
      dispoId = selectedSlotId.startsWith('custom-') ? null : selectedSlotId;
  } else if (selectedCustomTime) {
  // Si "toute la journée" (00:00:00), utiliser l'heure d'ouverture du studio
  const isFullDay = selectedCustomTime.start === '00:00:00' || selectedCustomTime.start === '00:00';
  finalTime = isFullDay ? `${studioConfig.opening_time}:00` : selectedCustomTime.start;
  finalEndTime = isFullDay ? `${studioConfig.closing_time}:00` : selectedCustomTime.end;
} else {
      setBookingError("Veuillez choisir une heure ou toute la journée pour confirmer votre créneau.");
      return;
    }

    setSubmittingBooking(true);
    try {
      if (usingMockData) {
        setTimeout(() => {
          setBookingSuccess(`Votre demande de réservation a été pré-enregistrée ! (Mode Démo - Georges Studio. Séance: ${selectedCategory.nom}, Date: ${formatDateFrench(finalDate)}, Horaire: ${formatTime(finalTime)})`);
          setShowSuccessModal(true);     
          setTimeout(() => {
            navigateToHome();
            setShowSuccessModal(false);
            setBookingSuccess(null);
          }, 5000);  
          setSubmittingBooking(false);
          // Reset
          setClientName('');
          setClientEmail('');
          setClientPhone('');
          setClientMessage('');
          setSelectedSlotId(null);
          setSelectedCustomTime(null);
          setSelectedDayString(null);
        }, 1200);
      } else {
        const body = {
          type_photo_id: selectedCategory.id,
          disponibilite_id: dispoId,
          nom_client: clientName.trim(),
          telephone: clientPhone.trim(),
          email: clientEmail.trim(),
          date_seance: finalDate,
          heure_seance: finalTime,
          heure_seance_end: finalEndTime,
          message: clientMessage.trim()
        };
        console.log("Envoi de la réservation :", JSON.stringify(body, null, 2));
        const res = await fetch(`${API_URL}/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (res.ok) {
          setBookingSuccess(data.message || "Réservation soumise avec succès ! Georges Studio vous contactera sous peu.");
          setShowSuccessModal(true);          // ← ajout
          setTimeout(() => {
            navigateToHome();
            setShowSuccessModal(false);
            setBookingSuccess(null);
          }, 5000);                   
          setClientName('');
          setClientEmail('');
          setClientPhone('');
          setClientMessage('');
          setSelectedSlotId(null);
          setSelectedCustomTime(null);
          setSelectedDayString(null);

          // Proactively block the day/time slot client-side
          const newlyBlocked: BlockedBooking = {
            disponibilite_id: dispoId,
            date_seance: finalDate,
            heure_seance: finalTime,
            statut: 'en_attente'
          };
          setBlockedBookings(prev => [...prev, newlyBlocked]);
        } else {
          setBookingError(data.message || "Une erreur est survenue.");
        }
      }
    } catch (err) {
      console.error("Erreur booking :", err);
      setBookingError("Erreur de communication avec le serveur.");
    } finally {
      setSubmittingBooking(false);
    }
  };

  // ============================================================
  // RENDER INTERFACE
  // ============================================================
  return (
    <>
      {/* --- HEADER --- */}
      <header className="studio-header">
        <div className="studio-logo" onClick={navigateToHome}>
          <span>GEORGES</span> STUDIO
        </div>
        <div>
          <button onClick={navigateToBooking} className="btn-gold-outline">
            Prendre rendez-vous
          </button>
        </div>
      </header>

      <main>
        {/* --- HERO / INTRO SECTION --- */}
        {currentPage === 'home' && (
          <section className="hero-intro-section">
            <h1 className="hero-phrase">
              Chaque instant a son histoire. Donnons vie à vos projets photographiques sous l'oeil expert de <span>Georges</span>.
            </h1>
            <div className="hero-action-wrapper">
              <button 
                onClick={() => handleWhatsAppRedirect(null)} 
                className="btn-gold-solid"
              >
                Contacter
              </button>
            </div>
          </section>
        )}

        {/* ============================================================
           1. HOME VIEW (NAKED IMAGE GRID WITH AUTO-SLIDESHOW)
           ============================================================ */}
        {currentPage === 'home' && (
          <div className="home-view">
            {loading ? (
              <div className="categories-grid-naked">
                <div className="shimmer-card" style={{ height: '360px' }}></div>
                <div className="shimmer-card" style={{ height: '360px' }}></div>
                <div className="shimmer-card" style={{ height: '360px' }}></div>
              </div>
            ) : (
              <section className="categories-grid-naked">
                {categories.map((category) => {
                  const coverImage = getCategoryCover(category.id);
                  return (
                    <article 
                      className="category-naked-card"
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category);
                        setCurrentPage('detail');
                      }}
                    >
                      <img 
                        className="category-naked-image" 
                        src={coverImage} 
                        alt={category.nom}
                        loading="lazy"
                      />
                      <div className="hover-slide-panel">
                        <h2 className="slide-panel-title">{category.nom}</h2>
                        <p className="slide-panel-incitation">Découvrir la galerie &rarr;</p>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </div>
        )}

        {/* ============================================================
           2. DETAILED SPLIT CATEGORY VIEW (DISPLAY FLEX)
           ============================================================ */}
        {currentPage === 'detail' && selectedCategory && (
          <div className="detail-view-split">
            <button className="back-button" onClick={navigateToHome}>
              &larr; Retour
            </button>

            <div className="details-split-container">
              {/* Left Column: Local Slideshow Carousel */}
              <div className="details-carousel-wrapper">
                {loadingPhotos ? (
                  <div className="shimmer-card" style={{ width: '100%', height: '100%', borderRadius: 0 }}></div>
                ) : categoryPhotos.length === 0 ? (
                  <div className="empty-gallery" style={{ height: '100%', boxSizing: 'border-box' }}>
                    <div className="empty-gallery-icon">🖼️</div>
                    <p>Aucune photo disponible</p>
                  </div>
                ) : (
                  <>
                    <img 
                      className="details-carousel-img"
                      src={categoryPhotos[detailSliderIndex]?.url_image} 
                      alt={categoryPhotos[detailSliderIndex]?.legende || selectedCategory.nom}
                    />

                    {categoryPhotos.length > 1 && (
                      <>
                        <button 
                          className="carousel-arrow carousel-arrow-left"
                          onClick={() => setDetailSliderIndex(prev => (prev === 0 ? categoryPhotos.length - 1 : prev - 1))}
                        >
                          &#10094;
                        </button>
                        <button 
                          className="carousel-arrow carousel-arrow-right"
                          onClick={() => setDetailSliderIndex(prev => (prev === categoryPhotos.length - 1 ? 0 : prev + 1))}
                        >
                          &#10095;
                        </button>

                        <div className="carousel-dots">
                          {categoryPhotos.map((_, idx) => (
                            <span 
                              key={`dot-${idx}`}
                              className={`carousel-dot ${idx === detailSliderIndex ? 'active' : ''}`}
                              onClick={() => setDetailSliderIndex(idx)}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Right Column: Category details text & actions */}
              <div className="details-info-panel">
                <h1 className="details-category-name">{selectedCategory.nom}</h1>
                <p className="details-category-desc">
                  {selectedCategory.description || "Prestation photo haut de gamme réalisée par Georges Studio."}
                </p>
                <div className="details-category-price">
                  {selectedCategory.prix_indicatif 
                    ? `Tarif indicatif : ${parseFloat(String(selectedCategory.prix_indicatif)).toLocaleString('fr-FR')} FCFA`
                    : 'Tarif personnalisé sur devis'}
                </div>

                <div className="details-actions-row">
                  <button 
                    onClick={() => handleWhatsAppRedirect(selectedCategory)} 
                    className="btn-gold-solid"
                  >
                    Contacter
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentPage('booking');
                      setBookingSuccess(null);
                      setBookingError(null);
                    }} 
                    className="btn-gray-solid"
                  >
                    Prendre rendez-vous
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
           3. DEDICATED RESERVATION VIEW (GEORGES STUDIO)
           ============================================================ */}
        {currentPage === 'booking' && (
          <div className="booking-view-georges">
            <button className="back-button" onClick={navigateToHome}>
              &larr; Retour aux projets
            </button>

            <section className="client-hero" style={{ textAlign: 'left', marginBottom: '40px' }}>
              <h1 className="font-garamond text-gold" style={{ fontSize: '40px', fontWeight: 300, margin: '0 0 10px 0' }}>
                Réserver votre séance
              </h1>
              <p style={{ color: 'var(--text-gray)', margin: 0 }}>
                Remplissez les informations ci-dessous et sélectionnez votre créneau dans le calendrier Georges Studio.
              </p>
            </section>

            {showSuccessModal && bookingSuccess && (
              <>
                <div className="success-modal-backdrop" onClick={navigateToHome} />
                <div className="success-modal-content">
                  <div className="success-modal-icon">✓</div>
                  <h2 className="font-garamond" style={{ fontSize: '28px', margin: '20px 0 15px 0', fontWeight: 400, color: 'var(--text-white)'}}>
                    Réservation enregistrée !
                  </h2>
                  <p style={{ color: 'var(--text-gray)', margin: '0 0 20px 0', lineHeight: '1.6' }}>
                    {bookingSuccess}
                  </p>
                  <p style={{ fontSize: '14px', color: 'var(--text-gray-light)', margin: 0 }}>
                    Redirection en cours... 
                  </p>
                </div>
              </>
            )}

            {!showSuccessModal && (
              <form onSubmit={handleSubmitBooking} className="booking-georges-layout">
                {/* COLUMN 1: FORM FIELDS */}
                <div className="booking-form-georges">
                  {bookingError && (
                    <div className="status-alert status-alert-error" style={{ marginBottom: '20px' }}>
                      <p style={{ margin: 0 }}>{bookingError}</p>
                    </div>
                  )}

                  {/* VISUAL CATEGORY SELECTOR */}
                  <div className="visual-category-selector">
                    <label className="visual-category-label">Type de séance *</label>
                    <div className="visual-category-grid">
                      {categories.map((cat) => {
                        const coverImg = getCategoryCover(cat.id);
                        const isSelected = selectedCategory?.id === cat.id;
                        return (
                          <div 
                            key={cat.id} 
                            className={`visual-category-option ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                          >
                            <img src={coverImg} alt={cat.nom} />
                            <div className="visual-category-name">
                              {cat.nom}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-group-georges">
                    <label className="form-label-georges" htmlFor="fullname">Nom complet *</label>
                    <input 
                      id="fullname"
                      type="text" 
                      className="form-input-georges" 
                      placeholder="Jean Dupont"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </div>

                  <div className="form-group-georges">
                    <label className="form-label-georges" htmlFor="emailaddr">Adresse e-mail *</label>
                    <input 
                      id="emailaddr"
                      type="email" 
                      className="form-input-georges" 
                      placeholder="jean.dupont@example.com"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group-georges">
                    <label className="form-label-georges" htmlFor="phonenum">Téléphone *</label>
                    <input 
                      id="phonenum"
                      type="tel" 
                      className="form-input-georges" 
                      placeholder="+33 6 12 34 56 78"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-group-georges">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label-georges" htmlFor="notes">Notes & attentes de séance</label>
                      <button
                        type="button"
                        onClick={suggestMessage}
                        disabled={!selectedCategory}
                        style={{ fontSize: '11px', color: 'var(--accent-gold)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        ✨ Suggérer un texte
                      </button>
                    </div>
                    <textarea
                      id="notes"
                      className="form-input-georges"
                      placeholder="Détaillez votre projet (lieu, style recherché...)"
                      value={clientMessage}
                      onChange={(e) => setClientMessage(e.target.value)}
                    />
                  </div>

                  <div className="form-group-georges" style={{ marginTop: '30px' }}>
                    <button 
                      type="submit" 
                      className="btn-gold-solid" 
                      style={{ width: '100%', padding: '16px' }}
                      disabled={submittingBooking || !selectedDayString || (!selectedSlotId && !selectedCustomTime)}
                    >
                      {submittingBooking ? 'Traitement...' : 'Envoyer ma demande de réservation'}
                    </button>
                    {!selectedDayString ? (
                      <p style={{ color: 'var(--accent-gold)', fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>
                        * Veuillez sélectionner une date sur le calendrier pour activer la soumission.
                      </p>
                    ) : (!selectedSlotId && !selectedCustomTime) ? (
                      <p style={{ color: 'var(--accent-gold)', fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>
                        * Veuillez sélectionner un horaire de séance pour activer la soumission.
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* COLUMN 2: CUSTOM CALENDAR BLOCKER */}
                <div className="calendar-georges">
                  <h2 className="booking-title" style={{ fontFamily: 'Cormorant Garamond', fontSize: '24px', fontWeight: 300, border: 'none', padding: 0, margin: '0 0 24px' }}>
                    Sélectionner un créneau
                  </h2>

                  <div className="calendar-header-georges">
                    <button 
                      type="button" 
                      className="calendar-nav-btn"
                      onClick={handlePrevMonth}
                      disabled={month === new Date().getMonth() && year === new Date().getFullYear()}
                    >
                      &larr;
                    </button>
                    <span className="calendar-title-georges">
                      {currentCalendarMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </span>
                    <button 
                      type="button" 
                      className="calendar-nav-btn"
                      onClick={handleNextMonth}
                    >
                      &rarr;
                    </button>
                  </div>

                  <div className="calendar-grid-georges">
                    {/* Headers */}
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(w => (
                      <div className="calendar-weekday-georges" key={w}>{w}</div>
                    ))}

                    {/* Days */}
                    {calendarDays.map((dayItem, idx) => {
                      if (dayItem.type === 'empty') {
                        return <div className="calendar-day-georges empty" key={`empty-${idx}`} />;
                      }

                      const dString = dayItem.dateString!;
                      const isPast = dString < todayString;
                      const isFullyBlocked = isDayFullyBlocked(dString);
                      const isClosed = isStudioClosedOnDay(dString);
                      const isSelected = selectedDayString === dString;
                      const isToday = dString === todayString;

                      // Block state
                      const isBlocked = isPast || isFullyBlocked || isClosed;

                      return (
                        <button
                          key={dString}
                          type="button"
                          className={`calendar-day-georges available-day
                            ${isBlocked ? 'blocked-day' : ''}
                            ${isClosed ? 'closed-day' : ''}
                            ${isSelected ? 'selected-day' : ''}
                            ${isToday ? 'today-day' : ''}
                          `}
                          onClick={() => selectDay(dString)}
                          disabled={isBlocked}
                        >
                          {dayItem.dayNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* HOURS SELECTION PANEL */}
                  {selectedDayString && showHoursPopover && (
                    <div className="hours-popover-georges">
                        <div className="hours-popover-header">
                          <h3 className="hours-popover-title">
                            Créneaux du {formatDateFrench(selectedDayString)}
                          </h3>
                          <button 
                            type="button" 
                            className="hours-popover-close-btn" 
                            onClick={() => setShowHoursPopover(false)}
                          >
                            &times;
                          </button>
                        </div>

                        <div className="hours-popover-body">
                          {(() => {
                            const hasOfficialSlots = availabilities.some(a => a.date_dispo === selectedDayString);
                            const slotsForDay = getSlotsForDay(selectedDayString);

                            if (slotsForDay.length === 0) {
                              return (
                                <div className="hours-popover-empty" style={{ color: 'var(--text-gray)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                                  Le studio est fermé pour ce jour.
                                </div>
                              );
                            }

                            return (
                              <div>
                                {!hasOfficialSlots && (
                                  <p style={{ fontSize: '13px', color: 'var(--text-gray)', margin: '0 0 16px 0', textAlign: 'left' }}>
                                    Créneaux d'une heure selon les horaires du studio : {studioConfig.opening_time} - {studioConfig.closing_time}.
                                  </p>
                                )}
                                <div className="hours-grid-georges">
                                  {slotsForDay.map(slot => {
                                    const isOfficial = !slot.id.startsWith('custom-');
                                    const status = getSlotStatus(slot);
                                    const isSelected = isOfficial ? selectedSlotId === slot.id : selectedCustomTime?.start === slot.heure_debut;
                                    const disabled = status !== 'available';
                                    return (
                                      <button
                                        key={slot.id}
                                        type="button"
                                        className={`hour-chip-georges ${status} ${isSelected ? 'selected' : ''}`}
                                        disabled={disabled}
                                        title={getSlotStatusLabel(status)}
                                        onClick={() => {
                                          if (disabled) return;
                                          if (isOfficial) {
                                            setSelectedSlotId(slot.id);
                                            setSelectedCustomTime(null);
                                          } else {
                                            setSelectedSlotId(null);
                                            setSelectedCustomTime({ start: slot.heure_debut, end: slot.heure_fin });
                                          }
                                          setShowHoursPopover(false);
                                        }}
                                      >
                                        <span>
                                          {slot.heure_debut === '00:00:00'
                                            ? 'Toute la journée'
                                            : `${formatTime(slot.heure_debut)} - ${formatTime(slot.heure_fin)}`}
                                        </span>
                                        {status !== 'available' && <small>{getSlotStatusLabel(status)}</small>}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                  )}

                  {/* SELECTED SLOT SUMMARY */}
                  {selectedDayString && (selectedSlotId || selectedCustomTime) && !showHoursPopover && (
                    <div className="selected-slot-summary" style={{ marginTop: '24px', padding: '16px', background: 'rgba(201, 169, 110, 0.08)', border: '1px solid var(--accent-gold)', borderRadius: '4px' }}>
                      <p style={{ margin: 0, color: 'var(--text-white)', fontSize: '14px' }}>
                        ✨ <strong>Créneau sélectionné :</strong> {formatDateFrench(selectedDayString)} à {' '}
                        {selectedSlotId ? (() => {
                          const slot = availabilities.find(a => a.id === selectedSlotId);
                          return slot ? `${formatTime(slot.heure_debut)} - ${formatTime(slot.heure_fin)}` : '';
                        })() : selectedCustomTime ? (
                          selectedCustomTime.start === '00:00:00'
                            ? 'Toute la journée'
                            : `${formatTime(selectedCustomTime.start)} - ${formatTime(selectedCustomTime.end)}`
                        ) : ''}
                      </p>
                      <button 
                        type="button" 
                        className="btn-gold-outline"
                        style={{ marginTop: '12px', padding: '6px 12px', fontSize: '11px', textTransform: 'none' }}
                        onClick={() => setShowHoursPopover(true)}
                      >
                        Modifier l'horaire
                      </button>
                    </div>
                  )}

                  {loadingAvailabilities && (
                    <div style={{ textAlign: 'center', marginTop: '16px', color: 'var(--accent-gold)', fontSize: '13px' }}>
                      Chargement des créneaux...
                    </div>
                  )}
                </div>
              </form>
            )}
          </div>
        )}
      </main>

      {/* --- FOOTER (COMPACT LAYOUT) --- */}
      <footer className="studio-footer">
        <div className="footer-left">
          <div className="footer-logo">GEORGES STUDIO</div>
          <div className="footer-location">📍 Place du Trocadéro, 75116 Paris</div>
        </div>
        <div className="footer-actions">
          <button onClick={() => handleWhatsAppRedirect(selectedCategory)} className="footer-btn">
            Contacter
          </button>
          <button onClick={navigateToBooking} className="footer-btn footer-btn-primary">
            Prendre rendez-vous
          </button>
        </div>
      </footer>
    </>
  );
}

export default App;
