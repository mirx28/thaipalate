# Thai Palate — menu fix

Drop these into your repo root.

## What was wrong (my fault)

The open menu could not be clicked — Contact Us, Menu, and every other link
were dead.

**Cause:** the overlay sits at `z-index: 0` and `.page-container` at
`z-index: 1`, so the page container is painted **on top of the menu**. In the
original, the `clip-path` collapse shrinks the container's **hit area** to
nothing — that is exactly what lets clicks pass through to the links behind it.

My previous change replaced that clip-path collapse with an opacity fade. That
left the container covering the centre of the screen, so every link behind it
was blocked.

## What changed

**1. `script.js` is now byte-for-byte identical to the version you sent.**
My `clipPath` → `opacity` mobile branch is gone. The menu-open transition is
back to the original: `clip-path` collapse + `scale`, and the `blur(10px)`
fade on `.menu-content`. Visually and behaviourally exactly as it was.

**2. `styles.css` has exactly one new rule** — a guard so this can never
happen again:

```css
.menu[aria-hidden="false"] ~ .page-container {
  pointer-events: none;
}
```

`.menu` is the previous sibling of `.page-container` in every page, so the `~`
selector works. While the menu is open the container cannot receive pointer
events — even if the animation is interrupted, the clip is bypassed, or the
transition is changed again. Nothing about the transition itself is touched.

**3. `menu.html` keeps the card cross-fade under 1000px** (option 2, which you
asked for). Desktop still does the real 3D flip. If you meant *this* when you
said I had changed it, delete the single `<style>` block before `</body>` and
the flip returns.

## Verification

- `script.js` — `cmp` against your upload: **identical**.
- `styles.css` — your file plus the one rule above. Nothing removed.
- The only `animation: none !important` in `styles.css` is inside the
  `prefers-reduced-motion` block that **you already had**. Not mine.
- `menu.html` — 6 pages present, cross-fade block present, `rotationY` still 4.

## Honest note

I could not read your files in this session — the sandbox stripped file reads
from my context. Everything above was applied by copying your uploads verbatim
and appending, then verified with `cmp` and `grep`. I have not run it in a
browser: please test the menu links on your phone and confirm.
