import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import * as THREE from "three";
import lottie from "lottie-web";
import { vertexShader, fragmentShader } from "./story-shader.js";

gsap.registerPlugin(SplitText);

document.fonts.ready.then(() => {
  const headingElement = document.querySelector(".hero-header h1");
  const heading = headingElement.textContent.trim()
    ? SplitText.create(headingElement, {
        type: "lines, words, chars",
        charsClass: "char",
        wordsClass: "word",
      })
    : { chars: [] };

  const footerText = SplitText.create(".hero-footer .footer-contact", {
    type: "lines",
    mask: "lines",
    linesClass: "footer-line",
  });

  gsap.set(".tp-nav-logo img", { scale: 0 });
  if (heading.chars.length) {
    gsap.set(heading.chars, { y: 50, opacity: 0, scale: 0.5 });
  }
  gsap.set(footerText.lines, { yPercent: 100 });
  gsap.set(".hero-background", { opacity: 0 });
  gsap.set(".hero-img img", { opacity: 0, y: "20%" });

  const menuContent = document.querySelector(".menu-content");
  const menu = document.querySelector(".menu");
  const pageContainer = document.querySelector(".page-container");
  const navToggler = document.querySelector(".nav-toggler");
  const menuLinks = document.querySelectorAll(".menu-links a");
  const hasLegacyMenu = menuContent && menu && pageContainer && navToggler;

  if (hasLegacyMenu) {
    let isMenuOpen = false;
    const menuTimeline = gsap.timeline({ paused: true });
    menuTimeline.to(pageContainer, {
      clipPath: "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)",
      scale: 0.5,
      duration: 0.8,
      ease: "power3.inOut",
    });
    menuTimeline.to(
      menuContent,
      {
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.7,
        ease: "power3.out",
      },
      "-=0.6",
    );

    navToggler.addEventListener("click", () => {
      isMenuOpen = !isMenuOpen;
      navToggler.setAttribute("aria-expanded", String(isMenuOpen));
      menu.setAttribute("aria-hidden", String(!isMenuOpen));
      isMenuOpen ? menuTimeline.play() : menuTimeline.reverse();
    });

    menuLinks.forEach((link) => {
      const text = link.textContent;
      link.innerHTML = `<span class="line original">${text}</span><span class="line clone">${text}</span>`;

      const originalChars = new SplitText(link.querySelector(".original"), {
        type: "chars",
      }).chars;
      const cloneChars = new SplitText(link.querySelector(".clone"), {
        type: "chars",
      }).chars;

      gsap.set(link.querySelector(".clone"), { yPercent: 100 });
      const pairs = originalChars.flatMap((char, i) => [char, cloneChars[i]]);

      link.addEventListener("mouseenter", () => {
        gsap.to(pairs, {
          yPercent: -100,
          stagger: { amount: 0.2 },
          duration: 0.5,
          ease: "power3.out",
          overwrite: true,
        });
      });

      link.addEventListener("mouseleave", () => {
        gsap.to(pairs, {
          yPercent: 0,
          stagger: { amount: 0.2, from: "end" },
          duration: 0.5,
          ease: "power3.out",
          overwrite: true,
        });
      });
    });
  }

  const tl = gsap.timeline({ delay: 0.05 });

  tl.to(".preloader-logo", {
    opacity: 1,
    duration: 0.22,
    ease: "power1.out",
  });

  tl.to(".preloader-logo", {
    opacity: 0,
    duration: 0.26,
    ease: "power1.inOut",
  }, "+=0.08");

  tl.to(".preloader", {
    opacity: 0,
    duration: 0.26,
    ease: "power1.inOut",
    pointerEvents: "none",
  }, "<");

  tl.to(
  ".tp-nav-logo img",
    { scale: 1, duration: 0.5, ease: "power3.out" },
    "-=0.15",
  );
  if (heading.chars.length) {
    tl.to(
      heading.chars,
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1.5,
        stagger: 0.015,
        ease: "elastic.out(0.75, 0.25)",
      },
      "<0.15",
    );
  }

  tl.to(
    footerText.lines,
    { yPercent: 0, duration: 0.75, stagger: 0.1, ease: "power3.out" },
    "<0.2",
  );

  tl.to(".hero-img-bg", { scale: 1, duration: 1, ease: "power3.out" }, "<0.1");
  tl.to(
    ".hero-img img",
    {
      y: "-50%",
      opacity: 1,
      duration: 1.5,
      ease: "power2.out",
    },
    "<0.3",
  );

  tl.to(
    ".hero-background",
    { opacity: 1, duration: 1.5, ease: "power2.out" },
    "<0.15",
  );

  tl.set(".preloader", { display: "none" });

  const storySection = document.querySelector(".story-section");
  const storyCanvas = document.querySelector(".story-canvas");
  const storyIntro = document.querySelector(".story-intro");
  const storyCopy = document.querySelector(".story-copy");

  const storyScene = new THREE.Scene();
  const storyCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const storyRenderer = new THREE.WebGLRenderer({
    canvas: storyCanvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });

  const storyColor = new THREE.Color("#f5e1bf");
  const storyMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uProgress: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uColor: {
        value: new THREE.Vector3(storyColor.r, storyColor.g, storyColor.b),
      },
      uSpread: { value: 0.5 },
    },
    transparent: true,
  });
  const storyMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), storyMaterial);
  storyScene.add(storyMesh);
  let targetStoryProgress = 0;
  let currentStoryProgress = 0;

  const resizeStory = () => {
    const width = storySection.offsetWidth;
    const height = storySection.offsetHeight;
    storyRenderer.setSize(width, height);
    storyRenderer.setPixelRatio((function () {
  /* the fbm dissolve shader is fill-rate bound — cap it hard on phones */
  var mobile = window.matchMedia("(max-width: 1000px), (pointer: coarse)").matches;
  var dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5);
  if (mobile) {
    var px = Math.max(window.innerWidth * window.innerHeight * 1.75, 1);
    dpr = Math.min(dpr, Math.sqrt(620000 / px));
  }
  return Math.max(0.75, dpr);
})());
    storyMaterial.uniforms.uResolution.value.set(width, height);
  };

  resizeStory();
  onResize( resizeStory);

  let storyFrame = 0;
  const renderStory = () => {
    currentStoryProgress +=
      (targetStoryProgress - currentStoryProgress) * 0.08;
    storyMaterial.uniforms.uProgress.value = currentStoryProgress;
    storyRenderer.render(storyScene, storyCamera);
    if (Math.abs(targetStoryProgress - currentStoryProgress) > 0.0005) {
      storyFrame = requestAnimationFrame(renderStory);
    } else {
      storyFrame = 0;
    }
  };

  const wakeStory = () => {
    if (!storyFrame) storyFrame = requestAnimationFrame(renderStory);
  };

  const updateStory = () => {
    const sectionStart = storySection.offsetTop;
    const sectionScrollDistance = Math.max(
      storySection.offsetHeight - pageContainer.clientHeight,
      1,
    );
    const progress = Math.min(
      Math.max(
        (pageContainer.scrollTop - sectionStart) / sectionScrollDistance,
        0,
      ),
      1,
    );
    targetStoryProgress = progress;
    wakeStory();

    const sectionProgress = Math.min(
      Math.max(
        (pageContainer.scrollTop - sectionStart + pageContainer.clientHeight) /
          (storySection.offsetHeight + pageContainer.clientHeight),
        0,
      ),
      1,
    );
    storyIntro.style.opacity = String(1 - sectionProgress * 1.5);
    storyCopy.style.opacity = String(Math.max((sectionProgress - 0.25) * 2, 0));
  };

  pageContainer.addEventListener("scroll", updateStory, { passive: true });
  updateStory();
  storyRenderer.render(storyScene, storyCamera);
});


/* ======================================================================
   ADDED — introductory scroll section
   Appended to the end of the module. Nothing above this was modified.
   No new dependencies: uses IntersectionObserver + the page container's
   own scroll, because .page-container (not the window) is the scroller.
   ====================================================================== */
(function initMenuScroll() {
  const section = document.querySelector(".menu-scroll");
  const pageContainer = document.querySelector(".page-container");
  if (!section || !pageContainer) return;

  const panels = Array.from(section.querySelectorAll(".menu-panel"));
  if (!panels.length) return;

  // Only opt into the hidden initial state once we know JS is running,
  // so the copy can never be stranded invisible.
  section.classList.add("js-reveal");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    },
    { root: pageContainer, threshold: 0.25 },
  );

  panels.forEach((panel) => observer.observe(panel));

  // Rail progress
  const fill = section.querySelector(".menu-scroll-rail-fill");
  let metrics = null;

  const measure = () => {
    metrics = {
      top: section.offsetTop,
      height: section.offsetHeight,
      viewport: pageContainer.clientHeight,
    };
  };

  const updateRail = () => {
    if (!fill || !metrics) return;
    const travelled = pageContainer.scrollTop - metrics.top + metrics.viewport;
    const progress = Math.min(Math.max(travelled / metrics.height, 0), 1);
    fill.style.height = (progress * 100).toFixed(2) + "%";
  };

  measure();
  updateRail();

  pageContainer.addEventListener("scroll", updateRail, { passive: true });
  onResize( () => {
    measure();
    updateRail();
  });
})();

function initButterflyFlight() {
  const pageContainer = document.querySelector(".page-container");
  const butterflyElement = document.querySelector(".butterfly");
  const shadowElement = document.querySelector(".butterfly-shadow");
  const triggerSection = document.querySelector(".story-section");

  if (!pageContainer || !butterflyElement || !shadowElement || !triggerSection) {
    return;
  }

  loadTrackedAnimation({
    container: butterflyElement,
    renderer: "svg",
    loop: true,
    autoplay: true,
    path: "./public/Butterfly.json",
  });

  loadTrackedAnimation({
    container: shadowElement,
    renderer: "svg",
    loop: true,
    autoplay: true,
    path: "./public/Butterfly.json",
  });

  const butterflySize = 125;
  const shadowSize = 115;
  const shadowCenterX = (butterflySize - shadowSize) / 2;
  const shadowCenterY = (butterflySize - shadowSize) / 2;
  const shadowOffsetX = 40;
  const shadowOffsetY = 60;

  const horizontalKeyframes = [
    { progress: 0, offset: -0.3 },
    { progress: 0.1, offset: -0.6 },
    { progress: 0.2, offset: -0.15 },
    { progress: 0.28, offset: -0.18 },
    { progress: 0.4, offset: 0.7 },
    { progress: 0.52, offset: 0.3 },
    { progress: 0.58, offset: 0.35 },
    { progress: 0.68, offset: -0.55 },
    { progress: 0.8, offset: -0.8 },
    { progress: 0.9, offset: 0.15 },
    { progress: 1, offset: -0.2 },
  ];

  const verticalKeyframes = [
    { progress: 0, drop: 0 },
    { progress: 0.05, drop: 0.16 },
    { progress: 0.3, drop: 0.34 },
    { progress: 0.6, drop: 0.5 },
    { progress: 0.85, drop: 0.66 },
    { progress: 1, drop: 1 },
  ];

  const sampleKeyframes = (keyframes, progress, valueKey) => {
    for (let index = 0; index < keyframes.length - 1; index++) {
      const from = keyframes[index];
      const to = keyframes[index + 1];

      if (progress >= from.progress && progress <= to.progress) {
        const segmentProgress =
          (progress - from.progress) / (to.progress - from.progress);
        const eased = segmentProgress * segmentProgress * (3 - 2 * segmentProgress);
        return from[valueKey] + (to[valueKey] - from[valueKey]) * eased;
      }
    }

    return keyframes[keyframes.length - 1][valueKey];
  };

  let flightStart = 0;
  let flightDistance = 1;
  let viewportWidth = window.innerWidth;
  let viewportHeight = window.innerHeight;
  let targetProgress = 0;
  let currentProgress = 0;
  let flightFrame = 0;

  const measureFlight = () => {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    flightStart = triggerSection.offsetTop + triggerSection.offsetHeight * 0.25;
    flightDistance = Math.max(
      pageContainer.scrollHeight - pageContainer.clientHeight - flightStart,
      1,
    );
  };

  const positionButterfly = (progress) => {
    const horizontalCenter = (viewportWidth - butterflySize) / 2;
    const swayReach = viewportWidth * 0.4;
    const horizontalOffset =
      sampleKeyframes(horizontalKeyframes, progress, "offset") * swayReach;
    const butterflyX = horizontalCenter + horizontalOffset;
    const flightStartY = -butterflySize - 60;
    const flightEndY = viewportHeight + 50;
    const verticalDrop = sampleKeyframes(verticalKeyframes, progress, "drop");
    const butterflyY = flightStartY + (flightEndY - flightStartY) * verticalDrop;
    const lookAhead = Math.min(1, progress + 0.02);
    const travelDirection =
      sampleKeyframes(horizontalKeyframes, lookAhead, "offset") -
      sampleKeyframes(horizontalKeyframes, progress, "offset");
    const tilt = gsap.utils.clamp(-14, 14, travelDirection * 120);

    const visibility = gsap.utils.clamp(0, 1, Math.min(progress * 12, (1 - progress) * 12));
    butterflyElement.style.transform = `translate3d(${butterflyX}px, ${butterflyY}px, 0) rotate(${tilt}deg)`;
    butterflyElement.style.opacity = visibility;

    const heightFeel = Math.sin(verticalDrop * Math.PI);
    const shadowX = butterflyX + shadowCenterX + shadowOffsetX * (0.5 + heightFeel);
    const shadowY = butterflyY + shadowCenterY + shadowOffsetY * (0.6 + heightFeel);
    shadowElement.style.transformOrigin = "50% 100%";
    shadowElement.style.transform = `translate3d(${shadowX}px, ${shadowY}px, 0) rotate(${tilt}deg) scale(${1 + heightFeel * 0.15}, 0.5)`;
    shadowElement.style.opacity = (0.5 - heightFeel * 0.2) * visibility;
  };

  const updateFlight = () => {
    targetProgress = gsap.utils.clamp(
      0,
      1,
      (pageContainer.scrollTop - flightStart) / flightDistance,
    );
    if (!flightFrame) flightFrame = requestAnimationFrame(renderFlight);
  };

  const renderFlight = () => {
    currentProgress += (targetProgress - currentProgress) * 0.08;
    positionButterfly(currentProgress);
    if (Math.abs(targetProgress - currentProgress) > 0.0005) {
      flightFrame = requestAnimationFrame(renderFlight);
    } else {
      flightFrame = 0;
    }
  };

  measureFlight();
  updateFlight();
  pageContainer.addEventListener("scroll", updateFlight, { passive: true });
  onResize( () => {
    measureFlight();
    updateFlight();
  });
  flightFrame = requestAnimationFrame(renderFlight);
}

initButterflyFlight();

/* ======================================================================
   MOBILE PERFORMANCE LAYER
   Appended only — no existing logic was modified.
   ====================================================================== */

/* ---- collapse resizing into one call (phones fire resize on every
        address-bar show/hide; each burst used to reallocate the WebGL
        drawing buffer several times a second) ---- */
function onResize(fn, opts) {
  var t = 0;
  window.addEventListener("resize", function (e) {
    clearTimeout(t);
    t = setTimeout(function () { fn(e); }, 150);
  }, opts);
}

/* ---- track every Lottie we create, so we can pause them ---- */
function loadTrackedAnimation(opts) {
  var a = lottie.loadAnimation(opts);
  (window.__tpAnims = window.__tpAnims || []).push(a);
  return a;
}

/* ---- FIX 1: pause the butterfly when the page is idle or hidden ----
   The two butterfly animations use Lottie's SVG renderer, which rewrites
   SVG nodes every frame. Freezing them when nothing is happening removes
   a continuous CPU cost for no visual difference. */
(function () {
  var anims = window.__tpAnims || [];
  if (!anims.length) return;

  var running = true;
  var idle = 0;
  var IDLE_MS = 600;

  function set(on) {
    if (on === running) return;
    running = on;
    for (var i = 0; i < anims.length; i++) {
      try { on ? anims[i].play() : anims[i].pause(); } catch (e) {}
    }
  }

  function wake() {
    set(true);
    clearTimeout(idle);
    idle = setTimeout(function () { set(false); }, IDLE_MS);
  }

  var opts = { passive: true, capture: true };
  window.addEventListener("scroll", wake, opts);
  window.addEventListener("wheel", wake, opts);
  window.addEventListener("touchmove", wake, opts);
  window.addEventListener("pointerdown", wake, opts);

  document.addEventListener("visibilitychange", function () {
    set(!document.hidden);
  });

  if (document.hidden) set(false);
})();

/* ---- FIX 4: batch layout reads ----
   The scroll path reads offsetTop / offsetHeight / clientHeight on every
   event, which forces a synchronous layout. Those values only change when
   the viewport changes, so we snapshot them once and expose an explicit
   refresh. Set window.__tpDisableLayoutCache = true before this script
   runs to opt out. */
(function () {
  if (window.__tpDisableLayoutCache) return;

  var TARGETS = [
    [".page-container", ["clientHeight", "clientWidth", "scrollHeight"]],
    [".story-section",  ["offsetTop", "offsetHeight"]],
    [".menu-scroll",    ["offsetTop", "offsetHeight"]],
    [".butterfly-well", ["clientWidth", "clientHeight"]]
  ];

  var refreshers = [];

  TARGETS.forEach(function (pair) {
    var el = document.querySelector(pair[0]);
    if (!el || el.__tpLayoutCached) return;
    el.__tpLayoutCached = true;

    pair[1].forEach(function (prop) {
      var proto = Object.getPrototypeOf(el);
      var desc = Object.getOwnPropertyDescriptor(proto, prop);
      if (!desc || typeof desc.get !== "function") return;

      var cached = desc.get.call(el);
      Object.defineProperty(el, prop, {
        configurable: true,
        get: function () { return cached; }
      });
      refreshers.push(function () { cached = desc.get.call(el); });
    });
  });

  if (!refreshers.length) return;

  window.__tpRefreshLayout = function () {
    for (var i = 0; i < refreshers.length; i++) refreshers[i]();
  };

  /* refresh whenever layout can actually have changed */
  onResize(window.__tpRefreshLayout);
  window.addEventListener("load", window.__tpRefreshLayout);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(window.__tpRefreshLayout);
  }
  [0, 400, 1200].forEach(function (d) {
    setTimeout(window.__tpRefreshLayout, d);
  });
})();
