# UGLYPH

**v1.02** — A type mutation playground built with [p5.js](https://p5js.org).

Type a word or drop an SVG and watch it come alive. Letters are sampled into thousands of points that collide, drift, and respond to your cursor in real time.

![UGLYPH screenshot](assets/preview.png)

---

## What it does

- Converts text or SVG outlines into a mesh of up to **10,000 animated points**
- Points simulate physics — they move, bounce off canvas edges, and collide with each other
- Mouse interaction lets you attract or repel points within a configurable brush radius
- An **Explode** burst sends all points outward with a single click
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
| **Type** | Enter text — updates live as you type |
| **Import** | Drag-and-drop or upload any SVG |
| **Mutation** | Reload / Stop / Play-Pause; sliders for vertex count, scale, mutation intensity, collision distance |
| **Interaction** | Push / Pull brush toggle; Explode button; cursor radius, cursor force, explosion force sliders |
| **Appearance** | Fill mode (filled / outline / dual), show dots, recolor, monochrome, stroke width |
| **Export** | PNG, SVG, GIF, MP4; frame count slider |

### Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | Play / Pause |
| `R` | Reload original shape |
| `A` | Toggle attract / repulse mode |
| `F` | Cycle fill mode |
| `M` | Toggle monochrome |
| `X` | Explode |
| `G` | Toggle grid |
| `S` | Save PNG |
| `V` | Save SVG |
| `H` | Hide / show UI |
| `I` | Invert colors |
| `J` | Randomize colors |
| `Esc` | Stop recording |

---

## Stack

- **p5.js** — canvas rendering and animation loop
- **opentype.js** — text-to-SVG-path conversion
- **p5.svg.js** — SVG export support
- **h264-mp4-encoder** — in-browser MP4 recording

---

## License

MIT
