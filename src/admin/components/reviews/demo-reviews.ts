import type { Review } from '@/lib/types'

/** Avis fictifs de l'aperçu, tant qu'aucune synchronisation n'a réussi. */
export const DEMO_REVIEWS: Review[] = [
  {
    author_name: 'Marie Dubois',
    profile_photo_url: 'https://i.pravatar.cc/64?img=47',
    rating: 5,
    text: 'Service exceptionnel, équipe à l\'écoute et très professionnelle. Le résultat dépasse mes attentes, je recommande vivement !',
    relative_time_description: 'il y a 2 semaines',
    time: Date.now() / 1000,
  },
  {
    author_name: 'Thomas Laurent',
    profile_photo_url: 'https://i.pravatar.cc/64?img=12',
    rating: 5,
    text: 'Travail impeccable, livré dans les temps. Communication fluide du début à la fin. Je referai appel à eux sans hésiter.',
    relative_time_description: 'il y a 1 mois',
    time: Date.now() / 1000,
  },
  {
    author_name: 'Sophie Martin',
    profile_photo_url: 'https://i.pravatar.cc/64?img=32',
    rating: 4,
    text: 'Très bonne expérience globale. Quelques petits ajustements ont été nécessaires mais l\'équipe a été très réactive.',
    relative_time_description: 'il y a 3 mois',
    time: Date.now() / 1000,
  },
  {
    author_name: 'Antoine Garcia',
    rating: 5,
    text: 'Une prestation de qualité, avec un excellent rapport qualité/prix. Je suis ravi du résultat final.',
    relative_time_description: 'il y a 5 mois',
    time: Date.now() / 1000,
  },
  {
    author_name: 'Camille Roux',
    profile_photo_url: 'https://i.pravatar.cc/64?img=20',
    rating: 5,
    text: 'Bravo pour le sérieux et le professionnalisme. Tout a été parfait, du premier contact à la livraison.',
    relative_time_description: 'il y a 6 mois',
    time: Date.now() / 1000,
  },
]
