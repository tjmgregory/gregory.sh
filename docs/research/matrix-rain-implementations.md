# Matrix Rain Effect - Web Implementation Research

Research compiled for potential implementation on gregory.sh.

## Overview

The "Matrix digital rain" (also called "Matrix code" or "digital rain") is the iconic falling green character animation from The Matrix franchise. There are several approaches to implementing this on the web, each with different trade-offs.

---

## Implementation Approaches

### 1. Canvas 2D (Most Common)

The standard approach using HTML5 Canvas with JavaScript.

**How it works:**
- Create a `<canvas>` element sized to viewport
- Divide canvas into columns based on character width
- Track Y-position of each "raindrop" in an array
- On each frame:
  1. Draw semi-transparent black rectangle over entire canvas (creates fade/trail effect)
  2. Draw random character at each column's current Y position
  3. Increment Y positions, reset when off-screen

**Key technique - Trail effect:**
```javascript
// Instead of clearing canvas, overlay with transparent black
context.fillStyle = 'rgba(0, 0, 0, 0.05)';
context.fillRect(0, 0, canvas.width, canvas.height);
```

**Character sets typically used:**
- Katakana: ハミヒーウシナモニサワツオリアホテマケメエカキムユラセネスタヌヘ
- Latin: ABCDEFGHIJKLMNOPQRSTUVWXYZ
- Numbers: 0123456789

**Pros:** Simple, good browser support, decent performance
**Cons:** CPU-bound, can struggle with many columns on large screens

**Resources:**
- [DEV.to Tutorial](https://dev.to/javascriptacademy/matrix-raining-code-effect-using-javascript-4hep)
- [Maarten Hus Blog](https://www.maartenhus.nl/blog/matrix-rain-effect/)
- [Rosetta Code](https://rosettacode.org/wiki/Matrix_digital_rain)

---

### 2. WebGL / GLSL Shaders (High Performance)

GPU-accelerated approach using fragment shaders.

**How it works:**
- Render glyphs as MSDF (multi-channel signed distance field) textures
- Compute raindrop positions on GPU via texture lookups
- Use fragment shader to determine which character/color to display at each pixel

**Notable implementation - Rezmason/matrix:**
- Uses REGL (functional WebGL wrapper)
- Glyphs as MSDF textures for crisp edges at any size
- GPU-computed particles stored in textures (not CPU objects)
- Per-frame CPU→GPU data transfer is "negligible"
- Supports WebGPU (beta)

**Customization parameters:**
- `numColumns`, `fallSpeed`, `cycleSpeed`
- `bloomSize`, `bloomStrength` (glow effects)
- `resolution` (render below native for performance)
- `slant` (fall angle), `glyphRotation`, `glyphFlip`
- Multiple palettes and effects (pride, mirror, image overlay)

**Pros:** Excellent performance, smooth 60fps even with thousands of glyphs
**Cons:** More complex, requires shader knowledge, larger bundle size

**Resources:**
- [Rezmason/matrix GitHub](https://github.com/Rezmason/matrix) - Most comprehensive WebGL implementation
- [Live Demo](https://rezmason.github.io/matrix/)
- [Shadertoy Examples](https://www.shadertoy.com/view/ldccW4)

---

### 3. Pure CSS (No JavaScript)

Uses CSS animations and counters to cycle through characters.

**How it works:**
- Animate a CSS custom property `--timer` from 1 to 26
- Use `counter()` with `lower-alpha` style to convert number to letter
- Multiple offset counters create staggered columns
- `writing-mode: vertical-rl` for vertical text flow

**Key technique:**
```css
@property --timer {
  syntax: '<integer>';
  initial-value: 1;
  inherits: false;
}

@keyframes tick {
  to { --timer: 26; }
}

.column {
  counter-reset: timer var(--timer);
  animation: tick 2s linear infinite;
}

.column::before {
  content: counter(timer, lower-alpha);
}
```

**Pros:** No JavaScript required, lightweight
**Cons:** Limited visual fidelity, no true randomness, limited character sets

**Resources:**
- [Pure CSS Matrix Effect](https://dev.to/tetragius/pure-css-matrix-code-effect-5b6k)
- [CodePen - CSS Only](https://codepen.io/freelesio/pen/MWQaGPb)

---

### 4. React Components

Pre-built components for React applications.

**react-mdr (npm):**
- Lightweight (<100 lines active code)
- Canvas-based rendering
- TypeScript support
- [GitHub](https://github.com/FullStackWithLawrence/react-mdr) | [npm](https://www.npmjs.com/package/react-mdr)

**shadcn Matrix Shader:**
- GPU fragment shader implementation
- Zero CPU animation overhead
- Procedural character generation
- Built for Next.js/TypeScript
- Install: `npx shadcn@latest add https://www.shadcn.io/r/matrix.json`
- [shadcn.io/shaders/matrix](https://www.shadcn.io/shaders/matrix)

**react-matrix-parallax:**
- Full-screen parallax code rain
- [GitHub](https://github.com/jeff-hykin/react-matrix-parallax)

---

## Performance Optimizations

### General Principles

1. **Use requestAnimationFrame** instead of setInterval for smoother animation
2. **OffscreenCanvas** - Render in worker thread to avoid blocking main thread
3. **Typed Arrays** - Use `Float32Array`/`Uint16Array` for column data instead of regular arrays
4. **Resolution scaling** - Render at lower resolution on high-DPI displays, scale up with CSS

### Canvas-Specific

- Don't clear entire canvas - use semi-transparent overlay for trail effect
- Batch draw calls where possible
- Consider reducing columns on mobile

### WebGL-Specific

- Store particle data in textures for GPU computation
- Use MSDF for resolution-independent glyph rendering
- Implement LOD (level of detail) for distant/small glyphs

---

## Accessibility Considerations

**CRITICAL: Respect `prefers-reduced-motion`**

Matrix rain effects can trigger vestibular disorders. Always check user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  .matrix-rain {
    animation: none;
    /* Show static or very slow animation instead */
  }
}
```

```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  // Disable or drastically slow animation
}
```

**Resources:**
- [W3C WCAG Technique C39](https://www.w3.org/WAI/WCAG21/Techniques/css/C39)
- [Josh Comeau - prefers-reduced-motion in React](https://www.joshwcomeau.com/react/prefers-reduced-motion/)
- [Smashing Magazine - Reduced Motion Design](https://www.smashingmagazine.com/2020/09/design-reduced-motion-sensitivities/)

---

## Premium/Paid Options

### Framer Components ($9 each)

Several premium Matrix rain components available on Framer Marketplace:

**Matrix Rain by Hamim Reza - $9**
- Full customization (font, color, speed, fade)
- Multiple character sets (binary, katakana, emoji, custom)
- Dynamic title overlay option
- [Framer Marketplace](https://www.framer.com/marketplace/components/matrix-rain/)

**Matrix Digital Rain by Studio SIFA - $9**
- Animated background component
- [Framer Marketplace](https://www.framer.com/marketplace/components/matrix-digital-rain/)

### Video Assets

**Envato Elements** (subscription required)
- Pre-rendered Matrix rain video loops
- Various colors and styles
- Useful for video backgrounds without code

---

## Recommended Approach for gregory.sh

Given the site's aesthetic (terminal/Matrix theme) and tech stack (SvelteKit):

**Option A: Canvas 2D (Simple)**
- Implement basic canvas animation
- Add `prefers-reduced-motion` support
- Good enough for background accent

**Option B: WebGL via Rezmason's approach (High Quality)**
- Fork/adapt Rezmason/matrix code
- Best visual fidelity
- More complex but excellent performance

**Option C: CSS-only for subtle effect**
- Minimal bundle impact
- Works as subtle accent, not full rain

### Key Considerations

1. **Performance budget** - Full-screen rain vs. contained section
2. **Mobile** - May want to disable or simplify on mobile
3. **Accessibility** - Must respect reduced motion preferences
4. **Bundle size** - WebGL adds weight, CSS is lightest

---

## Code Examples

### Minimal Canvas Implementation

```javascript
const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';
const fontSize = 16;
const columns = Math.floor(canvas.width / fontSize);
const drops = Array(columns).fill(1);

function draw() {
  // Trail effect
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#0f0';
  ctx.font = `${fontSize}px monospace`;

  for (let i = 0; i < drops.length; i++) {
    const char = chars[Math.floor(Math.random() * chars.length)];
    ctx.fillText(char, i * fontSize, drops[i] * fontSize);

    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  }
}

// Respect reduced motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReducedMotion) {
  setInterval(draw, 33); // ~30fps
}
```

---

## References

### Tutorials
- [DEV.to - Matrix Rain JavaScript](https://dev.to/javascriptacademy/matrix-raining-code-effect-using-javascript-4hep)
- [Maarten Hus Blog](https://www.maartenhus.nl/blog/matrix-rain-effect/)
- [Pure CSS Approach](https://dev.to/tetragius/pure-css-matrix-code-effect-5b6k)

### GitHub Repositories
- [Rezmason/matrix](https://github.com/Rezmason/matrix) - Definitive WebGL implementation
- [react-mdr](https://github.com/FullStackWithLawrence/react-mdr) - React component
- [sumitKcs/matrix-effect](https://github.com/sumitKcs/matrix-effect) - Simple Canvas

### Interactive Examples
- [Rezmason Live Demo](https://rezmason.github.io/matrix/)
- [Matrix Master Pro](https://matrix.logic-wire.de/) - Generator tool
- [CodePen Collection](https://codepen.io/yaclive/pen/EayLYO)
- [Shadertoy - Digital Rain](https://www.shadertoy.com/view/ldccW4)

### Accessibility
- [W3C WCAG C39](https://www.w3.org/WAI/WCAG21/Techniques/css/C39)
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
