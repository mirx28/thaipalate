const page = document.body;
const root = document.documentElement;
const toggle = document.querySelector(".tp-nav-toggler");
const menu = document.querySelector(".tp-menu");

/* ---------- page transition veil ---------- */
const transition = document.createElement("div");
transition.className = "tp-page-transition";
transition.setAttribute("aria-hidden", "true");
document.body.append(transition);

requestAnimationFrame(() => transition.classList.add("is-ready"));

/* ---------- menu state ---------- */
const setMenuState = (isOpen) => {
  if (!toggle || !menu) return;
  page.classList.toggle("is-menu-open", isOpen);
  root.classList.toggle("is-menu-open", isOpen); // locks page scroll behind the menu
  toggle.setAttribute("aria-expanded", String(isOpen));
  menu.setAttribute("aria-hidden", String(!isOpen));
};

// Back/forward cache restore: reset the veil and close the menu.
window.addEventListener("pageshow", () => {
  transition.classList.remove("is-leaving");
  transition.classList.add("is-ready");
  setMenuState(false);
});

/* ---------- internal link transitions (one delegated listener) ---------- */
const isInternalPageLink = (link) => {
  if (!link.href || link.target === "_blank") return false;
  const url = new URL(link.href, window.location.href);
  return url.origin === window.location.origin && url.pathname !== window.location.pathname;
};

document.addEventListener("click", (event) => {
  const link = event.target.closest?.("a");
  if (!link || link.classList.contains("card-cta")) return;
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  if (!isInternalPageLink(link)) {
    // Same-page link inside the menu (e.g. "Menu" while on the menu page): just close it.
    if (link.closest(".tp-menu") && link.target !== "_blank") setMenuState(false);
    return;
  }

  event.preventDefault();
  transition.classList.remove("is-ready");
  transition.classList.add("is-leaving");
  window.setTimeout(() => {
    window.location.href = link.href;
  }, 360);
});

/* ---------- flipped-card CTA routing (only does work when a card is flipped) ---------- */
const routeFlippedCardCta = (event) => {
  if (event.target.closest?.(".card-cta")) return;

  const ctas = document.querySelectorAll(".card.is-flipped .card-cta");
  if (!ctas.length) return;

  const cta = [...ctas].find((link) => {
    const b = link.getBoundingClientRect();
    return event.clientX >= b.left && event.clientX <= b.right && event.clientY >= b.top && event.clientY <= b.bottom;
  });

  if (!cta) return;
  event.preventDefault();
  window.location.assign(cta.href);
};

document.addEventListener("pointerup", routeFlippedCardCta, true);
document.addEventListener("click", routeFlippedCardCta, true);

/* ---------- menu toggle ---------- */
if (toggle && menu) {
  toggle.addEventListener("click", () => {
    setMenuState(!page.classList.contains("is-menu-open"));
  });

  menu.addEventListener("click", (event) => {
    if (event.target === menu) setMenuState(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuState(false);
  });
}