// Menú, carrusel de la portada y galería ampliada
document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Menú ---------- */
  const btn = document.querySelector(".menu-btn");
  const menu = document.getElementById("menu");
  if (btn && menu) {
    const setOpen = (open) => {
      btn.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
    };
    btn.addEventListener("click", () => setOpen(btn.getAttribute("aria-expanded") !== "true"));
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("is-open")) { setOpen(false); btn.focus(); }
    });
    window.matchMedia("(min-width: 861px)").addEventListener("change", (e) => { if (e.matches) setOpen(false); });
  }

  /* ---------- Carrusel ---------- */
  const reel = document.querySelector(".reel");
  if (reel) {
    const track = reel.querySelector(".reel__track");
    const items = [...reel.querySelectorAll(".reel__item")];
    const caption = reel.querySelector(".reel__caption");
    const dotsBox = reel.querySelector(".reel__dots");
    let active = -1;
    let timer = null;

    const dots = items.map((item, i) => {
      const d = document.createElement("button");
      d.type = "button";
      d.className = "reel__dot";
      d.setAttribute("role", "tab");
      d.setAttribute("aria-label", item.dataset.caption);
      d.addEventListener("click", () => { stop(); go(i); });
      dotsBox.appendChild(d);
      return d;
    });

    const go = (i, smooth = true) => {
      const n = (i + items.length) % items.length;
      const item = items[n];
      const left = item.offsetLeft - (track.clientWidth - item.offsetWidth) / 2;
      track.scrollTo({ left, behavior: smooth && !reduceMotion ? "smooth" : "auto" });
    };

    const paint = () => {
      const center = track.scrollLeft + track.clientWidth / 2;
      let best = 0, bestDist = Infinity;
      items.forEach((item, i) => {
        const mid = item.offsetLeft + item.offsetWidth / 2;
        const d = (mid - center) / item.offsetWidth;          // distancia en "móviles"
        const a = Math.min(Math.abs(d), 2.5);
        const phone = item.firstElementChild;
        phone.style.transform =
          `perspective(1200px) translateZ(${-a * 90}px) rotateY(${Math.max(-1, Math.min(1, d)) * -22}deg) scale(${1 - a * 0.07})`;
        phone.style.opacity = String(1 - Math.min(a, 2) * 0.32);
        phone.style.filter = a > 0.5 ? `saturate(${1 - Math.min(a, 2) * 0.25})` : "";
        if (Math.abs(d) < bestDist) { bestDist = Math.abs(d); best = i; }
      });
      if (best !== active) {
        active = best;
        caption.textContent = items[best].dataset.caption;
        dots.forEach((d, i) => d.setAttribute("aria-selected", String(i === best)));
        items.forEach((it, i) => it.classList.toggle("is-active", i === best));
      }
    };

    let raf = null;
    track.addEventListener("scroll", () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = null; paint(); });
    }, { passive: true });
    window.addEventListener("resize", () => { paint(); go(active, false); });

    reel.querySelector(".reel__arrow--prev").addEventListener("click", () => { stop(); go(active - 1); });
    reel.querySelector(".reel__arrow--next").addEventListener("click", () => { stop(); go(active + 1); });
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); stop(); go(active - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); stop(); go(active + 1); }
    });
    items.forEach((item, i) => item.addEventListener("click", () => { if (i !== active) { stop(); go(i); } }));

    // Arrastrar con el ratón en ordenador
    let dragX = null, dragLeft = 0, moved = false;
    track.addEventListener("pointerdown", (e) => {
      stop();
      if (e.pointerType !== "mouse") return;
      dragX = e.clientX; dragLeft = track.scrollLeft; moved = false;
      track.classList.add("is-dragging");
    });
    window.addEventListener("pointermove", (e) => {
      if (dragX === null) return;
      const dx = e.clientX - dragX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = dragLeft - dx;
    });
    window.addEventListener("pointerup", () => {
      if (dragX === null) return;
      dragX = null;
      track.classList.remove("is-dragging");
      go(active);
    });
    track.addEventListener("click", (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);

    // Avance automático suave; se para en cuanto la persona toca el carrusel
    const start = () => {
      if (reduceMotion || timer) return;
      timer = setInterval(() => go(active + 1), 4500);
    };
    function stop() { clearInterval(timer); timer = null; }
    track.addEventListener("touchstart", stop, { passive: true });
    track.addEventListener("wheel", stop, { passive: true });
    reel.addEventListener("focusin", stop);
    document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });

    paint();
    go(0, false);
    paint();
    start();
  }

  /* ---------- Galería ---------- */
  const box = document.querySelector(".lightbox");
  const shots = [...document.querySelectorAll(".shot")];
  if (!box || !shots.length) return;

  const img = box.querySelector("img");
  const cap = box.querySelector("figcaption");
  let current = 0;

  const show = (i) => {
    current = (i + shots.length) % shots.length;
    const src = shots[current].querySelector("img");
    img.src = src.src;
    img.alt = src.alt;
    cap.textContent = `${src.alt} (${current + 1} de ${shots.length})`;
  };

  shots.forEach((s, i) => s.addEventListener("click", () => { show(i); box.showModal(); }));
  box.querySelector(".lightbox__close").addEventListener("click", () => box.close());
  box.querySelector(".lightbox__nav--prev").addEventListener("click", () => show(current - 1));
  box.querySelector(".lightbox__nav--next").addEventListener("click", () => show(current + 1));
  box.addEventListener("click", (e) => { if (e.target === box) box.close(); });
  box.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });

  let startX = null;
  box.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    startX = null;
  });
});
