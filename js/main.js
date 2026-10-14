// ==========================================================
//  miconexionrapida.com — landing de internet residencial
//  Lo que se edita está arriba: TELEFONO y PLANES.
// ==========================================================

// ---------- Teléfono (único sitio donde cambiarlo) ----------
// `marcar` es el que usa el teléfono (con +1 de EE. UU.).
const TELEFONO = { mostrar: '(239) 341-9024', marcar: '+12393419024' };

// ---------- Planes ----------
// Cada uno: nombre, velocidad + unidad, precio al mes, nota (letra pequeña), lo que incluye y el texto del botón.
// `etiqueta` pone la cinta de arriba; `destacado: true` marca el recomendado (borde naranja y botón relleno).
const PLANES = [
  {
    nombre: 'Internet 300',
    velocidad: '300', unidad: 'Mbps',
    precio: '44.99',
    nota: '*Precio por 12 meses. Sin contratos a largo plazo.',
    incluye: ['WiFi para toda la casa incluido', 'Sin límite de datos', 'Sin contrato de permanencia', 'Instalación estándar gratis'],
    etiqueta: 'Más popular',
    boton: 'Contratar ahora',
  },
  {
    nombre: 'Internet + TV',
    velocidad: '500', unidad: 'Mbps + TV',
    precio: '139.99',
    nota: '*Precio especial para nuevos clientes. Sujeto a disponibilidad.',
    incluye: ['Internet de alta velocidad', 'Canales en español incluidos', 'Acceso a streaming', 'Atención prioritaria'],
    etiqueta: 'Recomendado',
    destacado: true,
    boton: 'Preguntar precio',
  },
  {
    nombre: 'TV + Internet + Línea',
    velocidad: '1G', unidad: '+ 200 canales',
    precio: '179.99',
    nota: '*Precio estimado. Varía según zona y promociones activas.',
    incluye: ['Más de 200 canales, incluidos en español', 'Fibra óptica hasta tu hogar', 'DVR incluido', 'Soporte técnico 24/7'],
    boton: 'Ver disponibilidad',
  },
];

// ---------- Teléfono en toda la página ----------
document.querySelectorAll('[data-tel]').forEach((a) => (a.href = 'tel:' + TELEFONO.marcar));
document.querySelectorAll('[data-tel-numero]').forEach((el) => (el.textContent = TELEFONO.mostrar));

// ---------- Header on scroll ----------
const header = document.getElementById('header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---------- Planes ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plansGrid = document.getElementById('plansGrid');
const listaPlanes = PLANES.length ? PLANES : [
  { nombre: 'Plan por definir', velocidad: '—', precio: '—', incluye: ['Detalles del plan'] },
  { nombre: 'Plan por definir', velocidad: '—', precio: '—', incluye: ['Detalles del plan'], destacado: true },
  { nombre: 'Plan por definir', velocidad: '—', precio: '—', incluye: ['Detalles del plan'] },
];
plansGrid.innerHTML = listaPlanes.map((p) => `
  <article class="plan${p.destacado ? ' plan--destacado' : ''} reveal">
    ${p.etiqueta || p.destacado ? `<span class="plan__tag${p.destacado ? '' : ' plan__tag--alt'}">${esc(p.etiqueta || 'Recomendado')}</span>` : ''}
    <h3 class="plan__nombre">${esc(p.nombre)}</h3>
    <p class="plan__velocidad"><strong>${esc(p.velocidad)}</strong> ${esc(p.unidad || 'Mbps')}</p>
    <p class="plan__precio"><strong>${p.precio === '—' ? '—' : '$' + esc(p.precio)}</strong><span> /mes</span></p>
    ${p.nota ? `<p class="plan__nota">${esc(p.nota)}</p>` : ''}
    <ul class="plan__incluye">${(p.incluye || []).map((x) => `<li><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check"/></svg>${esc(x)}</li>`).join('')}</ul>
    <a href="tel:${TELEFONO.marcar}" class="btn ${p.destacado ? 'btn--orange' : 'btn--outline'} plan__btn">
      <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-phone"/></svg>${esc(p.boton || 'Pedir este plan')}
    </a>
  </article>`).join('');

// ---------- Carruseles (móvil) ----------
// En el móvil, beneficios y planes se deslizan en horizontal y pasan solos cada CARRUSEL_MS,
// con puntos que indican cuál se ve y permiten saltar. La fila de usos es una cinta continua (abajo).
// Si la persona toca o desliza, el contador vuelve a empezar para no quitarle la tarjeta de las manos.
const CARRUSEL_MS = 10000;
const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll('.services__grid, .plans__grid').forEach((pista) => {
  const items = [...pista.children];
  const esCarrusel = () => pista.scrollWidth > pista.clientWidth + 4;
  const actual = () => {
    const izq = pista.getBoundingClientRect().left;
    let mejor = 0;
    items.forEach((it, i) => {
      if (Math.abs(it.getBoundingClientRect().left - izq - 16) < Math.abs(items[mejor].getBoundingClientRect().left - izq - 16)) mejor = i;
    });
    return mejor;
  };
  const ir = (i) => {
    const izq = pista.getBoundingClientRect().left;
    const destino = pista.scrollLeft + items[i].getBoundingClientRect().left - izq - 16;
    pista.scrollTo({ left: destino, behavior: sinMovimiento ? 'auto' : 'smooth' });
  };

  const puntos = document.createElement('div');
  puntos.className = 'carrusel-puntos';
  puntos.innerHTML = items.map((_, i) => `<button type="button" aria-label="Ver ${i + 1} de ${items.length}"></button>`).join('');
  pista.after(puntos);
  const botones = [...puntos.children];
  botones.forEach((b, i) => b.addEventListener('click', () => { ir(i); reiniciar(); }));
  const marcar = () => {
    const i = actual();
    botones.forEach((b, j) => b.setAttribute('aria-current', j === i));
  };
  pista.addEventListener('scroll', marcar, { passive: true });
  marcar();

  // Avance automático; al llegar al final vuelve al principio
  let timer;
  const siguiente = () => {
    if (!esCarrusel()) return;
    const alFinal = pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 4;
    ir(alFinal ? 0 : Math.min(actual() + 1, items.length - 1));
  };
  const reiniciar = () => { clearInterval(timer); timer = setInterval(siguiente, CARRUSEL_MS); };
  ['touchstart', 'pointerdown', 'wheel'].forEach((ev) => pista.addEventListener(ev, reiniciar, { passive: true }));
  reiniciar();
});

// ---------- Cinta de usos (móvil) ----------
// Se duplican los elementos para que la cinta se desplace sin fin; en escritorio se quitan las copias.
const cinta = document.querySelector('.partners__row');
const movil = window.matchMedia('(max-width: 860px)');
const ajustarCinta = () => {
  const activa = movil.matches && !sinMovimiento;
  cinta.querySelectorAll('[data-copia]').forEach((el) => el.remove());
  cinta.classList.toggle('is-marquee', activa);
  if (activa) {
    [...cinta.children].forEach((el) => {
      const copia = el.cloneNode(true);
      copia.dataset.copia = '';
      copia.setAttribute('aria-hidden', 'true');
      cinta.append(copia);
    });
  }
};
movil.addEventListener('change', ajustarCinta);
ajustarCinta();

// ---------- Reveal on scroll ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 90}ms`;
  io.observe(el);
});

// ---------- Prueba de velocidad (animación ilustrativa) ----------
const speedValue = document.getElementById('speedValue');
const speedBar = document.getElementById('speedBar');
const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const speedIo = new IntersectionObserver((entries) => {
  if (!entries[0].isIntersecting) return;
  speedIo.disconnect();
  const meta = 500, inicio = performance.now(), dur = reducir ? 0 : 1600;
  const paso = (t) => {
    const k = dur ? Math.min((t - inicio) / dur, 1) : 1;
    const v = Math.round(meta * (1 - Math.pow(1 - k, 3)));
    speedValue.textContent = v + ' Mbps';
    speedBar.style.width = (v / meta) * 92 + '%';
    if (k < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}, { threshold: 0.5 });
speedIo.observe(speedBar);

