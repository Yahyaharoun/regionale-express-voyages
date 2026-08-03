import { MapPin, Briefcase, Users, Package, Star } from "lucide-react";

export const landingConfig = {
  // Programme de régularité
  fidelite: {
    whatsappUrl: "https://wa.me/237694328584?text=Bonjour,%20je%20souhaite%20rejoindre%20le%20Carnet%20de%20Régularité",
  },
  
  // Section Contact
  contact: {
    phone: "+237 694 32 85 84",
    email: "contact@regionalexpressvoyages.com",
    address: "Mbalmayo, Cameroun",
    hours: "Ouvert 7 jours / 7 de 04h00 à 00h00",
    whatsappUrl: "https://wa.me/237694328584",
    facebookUrl: "https://facebook.com/regionalexpressvoyagessarl",
    twitterUrl: "https://twitter.com/regionalexpressvoyagessarl",
  },

  // Agences
  agencies: [
    {
      name: "Yaoundé Mimboman",
      phone: "+237 698 55 28 04 / 692 86 62 25",
      hours: "04h00 - 00h00",
      googleMapsUrl: "https://maps.google.com/?q=Yaounde+Mimboman",
    },
    {
      name: "Mbalmayo",
      phone: "+237 696 40 29 83 / 655 84 79 90",
      hours: "04h00 - 00h00",
      googleMapsUrl: "https://maps.google.com/?q=Mbalmayo",
    },
    {
      name: "Yaoundé Mvan",
      phone: "+237 659 15 75 75 / 696 43 17 63",
      hours: "04h00 - 00h00",
      googleMapsUrl: "https://maps.google.com/?q=Yaounde+Mvan",
    },
    {
      name: "Ayos",
      phone: "Bientôt disponible",
      hours: "04h00 - 00h00",
      googleMapsUrl: "https://maps.google.com/?q=Ayos",
    },
    {
      name: "Akonolinga",
      phone: "Bientôt disponible",
      hours: "04h00 - 00h00",
      googleMapsUrl: "https://maps.google.com/?q=Akonolinga",
    }
  ],

  // Services
  services: [
    {
      title: "Transport interurbain de personnes",
      desc: "Voyages Classiques et VIP.",
      icon: MapPin,
    },
    {
      title: "Location de véhicules",
      desc: "Location courte et longue durée.",
      icon: Briefcase,
    },
    {
      title: "Transport de groupes",
      desc: "Entreprises, Associations, Écoles, Administrations, Évènements.",
      icon: Users,
    },
    {
      title: "Services de messagerie et de colis",
      desc: "Transport rapide, fiable et sécurisé sur tout le réseau REGIONALE EXPRESS VOYAGES SARL.",
      icon: Package,
    },
  ],
};
