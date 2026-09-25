const page = document.body;
const toggle = document.querySelector(".tp-nav-toggler");
const menu = document.querySelector(".tp-menu");
const transition = document.createElement("div");
transition.className = "tp-page-transition";
transition.setAttribute("aria-hidden", "true");
document.body.append(transition);

requestAnimationFrame(() => {
  transition.classList.add("is-ready");
});

window.addEventListener("pageshow", () => {
  transition.classList.remove("is-leaving");
  transition.classList.add("is-ready");
});

const isInternalPageLink = (link) => {
  if (!link.href || link.target === "_blank") return false;
  const url = new URL(link.href, window.location.href);
  return url.origin === window.location.origin && url.pathname !== window.location.pathname;
};

document.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (link.classList.contains("card-cta")) return;
    if (!isInternalPageLink(link)) return;

    event.preventDefault();
    transition.classList.add("is-leaving");
    window.setTimeout(() => {
      window.location.href = link.href;
    }, 360);
  });
});

const routeFlippedCardCta = (event) => {
  if (event.target.closest?.(".card-cta")) return;

  const cta = [...document.querySelectorAll(".card.is-flipped .card-cta")].find(
    (link) => {
      const bounds = link.getBoundingClientRect();
      return (
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom
      );
    },
  );

  if (!cta) return;
  event.preventDefault();
  window.location.assign(cta.href);
};

document.addEventListener("pointerup", routeFlippedCardCta, true);
document.addEventListener("click", routeFlippedCardCta, true);

if (toggle && menu) {
  const setMenuState = (isOpen) => {
    page.classList.toggle("is-menu-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    menu.setAttribute("aria-hidden", String(!isOpen));
  };

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
