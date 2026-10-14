// ==========================================================
//  miconexionrapida.com — landing de internet residencial
//  Lo que se edita está arriba: TELEFONO. Los planes están en index.html (#planes).
// ==========================================================

// ---------- Teléfono (único sitio donde cambiarlo) ----------
// `marcar` es el que usa el teléfono (con +1 de EE. UU.).
const TELEFONO = { mostrar: '(239) 341-9024', marcar: '+12393419024' };

// ---------- Teléfono en toda la página ----------
document.querySelectorAll('[data-tel]').forEach((a) => (a.href = 'tel:' + TELEFONO.marcar));
document.querySelectorAll('[data-tel-numero]').forEach((el) => (el.textContent = TELEFONO.mostrar));

// ---------- Barra «Llama ahora» fija ----------
// Se oculta mientras el botón del hero está a la vista (escritorio) para no repetirlo.
// En el móvil el botón del hero no se muestra, así que la barra queda siempre visible.
const barraLlamar = document.querySelector('.footer__call');
const botonHero = document.querySelector('.hero__actions .btn--big');
if (barraLlamar && botonHero) {
  new IntersectionObserver(([e]) => barraLlamar.classList.toggle('is-oculta', e.isIntersecting)).observe(botonHero);
}

// ---------- Header on scroll ----------
const header = document.getElementById('header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

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

