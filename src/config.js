export const CLINIC = {
  address: "أرض الحرية – برج الشيماء – الدور الرابع – أعلى كازيون – بني سويف",
  lat: 29.07912,
  lng: 31.10029,
  phones: ["01014310240", "01114445014"],
  email: "drkarim694@gmail.com",
  whatsappNumber: "201014310240",
  social: {
    facebook: "https://www.facebook.com/DrKareemEllithy",
    youtube:
      "https://www.youtube.com/@ClinicalNutritionandCertifiedHealthCoach",
    tiktok: "https://www.tiktok.com/@dr.karim.ellaithy",
  },
};

export const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${CLINIC.lat},${CLINIC.lng}`;
export const waUrl = `https://wa.me/${CLINIC.whatsappNumber}`;