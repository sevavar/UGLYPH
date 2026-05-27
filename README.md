# UGLYPH

**v1.02** — A type mutation playground built with [p5.js](https://p5js.org).

Type a word or drop an SVG and watch it come alive. Letters are sampled into thousands of points that collide, drift, and respond to your cursor in real time.

![UGLYPH screenshot](assets/preview.png)

---

## What it does

- Converts text or SVG outlines into a mesh of up to **10,000 animated points**
- Points simulate physics — they move, bounce off canvas edges, and collide with each other
- Mouse interaction lets you attract or repel points within a configurable brush radius
- An **EXPLODE** burst sends all points outward with a single click
- Export the result as **PNG**, **SVG**, **GIF**, or **MP4**

---

## Getting started

No build step required. Open `index.html` in a browser.

```
open index.html
```

Fonts and libraries are bundled locally — no internet connection needed after the initial load of p5.js.

---

## Controls

### Sidebar

| Section | Controls |
|---|---|
| **TYPE** | Enter text — updates live as you type |
| **IMPORT** | Drag-and-drop or upload any SVG |
| **MUTATION** | RELOAD / STOP / PLAY-PAUSE; sliders for VERTEX COUNT, SCALE, MUTATION INTENSITY, COLLISION DISTANCE |
| **INTERACTION** | PUSH / PULL brush toggle; EXPLODE button; CURSOR RADIUS, CURSOR FORCE, EXPLOSION FORCE sliders |
| **APPEARANCE** | FILL MODE (FILLED / OUTLINE / DUAL), SHOW DOTS, RECOLOR, MONOCHROME, STROKE WIDTH |
| **EXPORT** | PNG, SVG, GIF, MP4; FRAME COUNT slider |

### Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | PLAY / PAUSE |
| `R` | RELOAD ORIGINAL SHAPE |
| `A` | TOGGLE ATTRACT / REPULSE MODE |
| `F` | CYCLE FILL MODE |
| `M` | TOGGLE MONOCHROME |
| `X` | EXPLODE |
| `G` | TOGGLE GRID |
| `S` | SAVE PNG |
| `V` | SAVE SVG |
| `H` | HIDE / SHOW UI |
| `I` | INVERT COLORS |
| `J` | RANDOMIZE COLORS |
| `Esc` | STOP RECORDING |

---

## Stack

- **p5.js** — canvas rendering and animation loop
- **opentype.js** — text-to-SVG-path conversion
- **p5.svg.js** — SVG export support
- **h264-mp4-encoder** — in-browser MP4 recording

---

## License

MIT
