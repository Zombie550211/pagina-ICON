// ==========================================================
//  Medición para Google Ads (y Google Analytics 4 opcional)
//  Se carga en el <head> de todas las páginas.
//
//  Qué rellenar (Google Ads → Objetivos → Conversiones):
//  - ADS_ID:            ID de la cuenta, formato 'AW-123456789'.
//  - LLAMADA_WEB:       acción «Llamadas desde el sitio web» (usa número de desvío de Google y
//                       cuenta las llamadas reales por duración). Formato 'AW-123456789/AbCdEf...'.
//  - CLIC_LLAMAR:       acción «Clics en el número de teléfono» (cuenta los toques en «Llamar»).
//                       Formato 'AW-123456789/XyZ...'.
//  - GA4_ID (opcional): Google Analytics 4, formato 'G-XXXXXXX'.
//  Mientras un valor contenga 'XXXX' no se usa: la página funciona igual y no se mide nada.
// ==========================================================
const ANALITICA = {
  ADS_ID: 'AW-XXXXXXXXXX',
  LLAMADA_WEB: 'AW-XXXXXXXXXX/XXXXXXXXXXXXXXXXXXX',
  CLIC_LLAMAR: 'AW-XXXXXXXXXX/XXXXXXXXXXXXXXXXXXX',
  GA4_ID: 'G-XXXXXXXXXX',
  TELEFONO_VISIBLE: '(239) 341-9024', // tal como se ve en la página (lo usa el número de desvío)
};

(() => {
  const listo = (v) => typeof v === 'string' && v && !v.includes('XXXX');
  const idPrincipal = listo(ANALITICA.ADS_ID) ? ANALITICA.ADS_ID : listo(ANALITICA.GA4_ID) ? ANALITICA.GA4_ID : null;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };

  if (idPrincipal) {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + idPrincipal;
    document.head.appendChild(s);

    gtag('js', new Date());
    if (listo(ANALITICA.ADS_ID)) gtag('config', ANALITICA.ADS_ID);
    if (listo(ANALITICA.GA4_ID)) gtag('config', ANALITICA.GA4_ID);
    // Llamadas desde el sitio web: Google cambia el número visible por uno de desvío y mide la llamada.
    if (listo(ANALITICA.LLAMADA_WEB)) {
      gtag('config', ANALITICA.LLAMADA_WEB, { phone_conversion_number: ANALITICA.TELEFONO_VISIBLE });
    }
  }

  // Cada toque en un enlace tel: cuenta como conversión «clic para llamar».
  // Escucha en el documento, así cubre también los botones que se crean con JS (planes).
  document.addEventListener('click', (e) => {
    const enlace = e.target.closest && e.target.closest('a[href^="tel:"]');
    if (!enlace) return;
    const donde = enlace.dataset.ubicacion || enlace.textContent.trim().replace(/\s+/g, ' ').slice(0, 60);
    if (listo(ANALITICA.CLIC_LLAMAR)) {
      gtag('event', 'conversion', { send_to: ANALITICA.CLIC_LLAMAR });
    }
    if (listo(ANALITICA.GA4_ID)) {
      gtag('event', 'clic_llamar', { ubicacion: donde, pagina: location.pathname });
    }
  }, { capture: true });
})();
