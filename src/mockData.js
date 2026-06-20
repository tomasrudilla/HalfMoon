// src/mockData.js

export const leadDesigns = {
  "#1042": {
    clientName: "Martín Sejas",
    product: "Remera Blanca",
    visualDescription: "Remera blanca con logo HalfMoon centrado en el pecho (color negro)."
  },
  "#1041": {
    clientName: "Sofía Lencina",
    product: "Buzo Canguro Negro",
    visualDescription: "Buzo canguro negro con diseño 'ESTILO HALFMOON' en la espalda (color blanco)."
  }
};

export const canvasGallery = [
  { id: 3043, creator: "Martín Sejas", product: "Remera Oversize Blanca", bgColor: "#fff", comment: "Quiero el logo bien grande en la espalda, tipo 30x30cm si se puede." },
  { id: 3042, creator: "Sofía Lencina", product: "Buzo Canguro Negro", bgColor: "#111", textColor: "#fff", comment: "Hola! Quisiera saber si el logo puede ir bordado en vez de estampado." },
  { id: 3041, creator: "Lucas P.", product: "Remera Negra", bgColor: "#111", textColor: "#fff", comment: "Para un equipo de fútbol 5, necesitamos 10 de estas." },
];

// --- NUEVO: CATÁLOGO CENTRALIZADO ---
// Lo que edites acá, se reflejará automáticamente en el Admin y en la Landing
export const catalogItems = [
  { id: 1, title: "REMERA + ESTAMPADO", category: "Remeras", stock: "Alto", price: "$12.500", desc: "Prendas premium de excelente caída, listas con tu logo o diseño." },
  { id: 2, title: "BUZOS & CANGUROS", category: "Buzos", stock: "Medio (15)", price: "$35.000", desc: "Frisa invisible de primera calidad para el invierno." },
  { id: 3, title: "CAMPERAS", category: "Abrigos", stock: "Bajo", price: "$42.000", desc: "Personalización en frente y espalda para egresados o staff." },
  { id: 4, title: "COFIAS", category: "Accesorios", stock: "Alto", price: "$4.500", desc: "Ideales para gastronomía o sector salud, estampadas a medida." }
];