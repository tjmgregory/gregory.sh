# Matrix Rain → Content Settle Effect

## The Vision

Page loads as pure matrix rain, then characters "settle" into their final positions to reveal actual page content. Page transitions trigger rain → settle animations.

**This effect does not exist in any library.** All existing Matrix rain implementations are "infinite rain" - no destination, no settling. This would be a custom build.

---

## Feasibility Assessment

### Is Monospace Required?

**Yes, essentially mandatory.**

Without monospace:
- Characters have variable widths (W vs i)
- No clean grid alignment
- "Settling" would look chaotic, not intentional
- Would need per-character position calculation (expensive)

With monospace:
- Perfect grid: `col * charWidth`, `row * charHeight`
- Rain columns align naturally with text columns
- Clean visual metaphor

**Good news:** gregory.sh already uses monospace (`'Courier New', Courier, monospace`).

### Dynamic Content Challenges

| Challenge | Difficulty | Solution |
|-----------|------------|----------|
| Variable text per page | Medium | Extract on each navigation |
| Responsive line breaks | Hard | Recalculate grid on resize |
| Links and interactivity | Medium | DOM-based approach preserves them |
| Images/non-text content | Medium | Exclude from effect, fade in separately |
| Accessibility | Medium | Respect reduced-motion, ensure final state is normal DOM |

### Verdict: Feasible but Complex

- Estimated effort: 2-4 weeks for polished implementation
- Performance: Achievable 60fps with correct approach
- Maintenance: Medium - resize handling is the tricky part

---

## Architecture Options

### Option A: Canvas Overlay → DOM Reveal

```
┌─────────────────────────────────┐
│  Canvas (rain animation)        │  ← Visible during animation
├─────────────────────────────────┤
│  Actual DOM (hidden)            │  ← Revealed after settle
└─────────────────────────────────┘
```

**How it works:**
1. Page loads with content hidden (`opacity: 0`)
2. Canvas overlay shows rain
3. Calculate target positions from hidden DOM
4. Animate rain settling to those positions
5. Crossfade: fade canvas out, fade DOM in

**Pros:**
- Rain phase is standard canvas (simple)
- DOM remains clean after animation

**Cons:**
- Font rendering differs between canvas and CSS
- Visible "jump" at crossfade moment
- Can't interact during animation

**Code sketch:**
```javascript
// Extract target grid from DOM
function extractGrid(container) {
  const style = getComputedStyle(container);
  const charWidth = measureCharWidth(style.fontFamily, style.fontSize);
  const charHeight = parseFloat(style.lineHeight);

  const grid = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node;
  let row = 0, col = 0;
  const maxCols = Math.floor(container.clientWidth / charWidth);

  while (node = walker.nextNode()) {
    for (const char of node.textContent) {
      if (char === '\n' || col >= maxCols) {
        row++;
        col = 0;
        if (char === '\n') continue;
      }
      if (char !== ' ' || grid.length > 0) { // Skip leading spaces
        grid.push({ char, row, col, x: col * charWidth, y: row * charHeight });
      }
      col++;
    }
  }
  return grid;
}
```

---

### Option B: Full Canvas Rendering (Not Recommended)

Render everything on canvas forever - never show DOM.

**Why not:**
- Lose text selection
- Lose native link handling
- Accessibility disaster
- Must re-implement scrolling, hover states, etc.

---

### Option C: DOM Character Wrapping (Recommended)

```
Before:
<p>Hello world</p>

After wrapping:
<p>
  <span class="char" style="--col:0;--row:0">H</span>
  <span class="char" style="--col:1;--row:0">e</span>
  <span class="char" style="--col:2;--row:0">l</span>
  ...
</p>
```

**How it works:**
1. Wrap every character in a `<span>` with grid position
2. Initial state: random Y offset, random character
3. Animate to final position with correct character
4. After animation: optionally unwrap for clean DOM

**Pros:**
- Links work throughout (wrap preserves parent `<a>`)
- Text selection works after animation
- No canvas/DOM mismatch
- GPU-accelerated via CSS transforms

**Cons:**
- Many DOM elements (but modern browsers handle thousands fine)
- Text wrapping is complex to calculate correctly

**This is the recommended approach.**

---

### Option D: Hybrid Canvas → DOM Morph

Best of both worlds but most complex:
1. Canvas for pure rain phase (fast, no DOM overhead)
2. When settling begins, spawn DOM spans at canvas positions
3. Animate DOM spans to final positions
4. Fade out canvas as DOM takes over

**Pros:**
- Best visual quality
- Smooth transition

**Cons:**
- Two rendering systems to synchronize
- Most complex implementation

---

## Recommended Implementation: Option C

### Step 1: Character Wrapping

```typescript
// lib/matrix/wrap-characters.ts

interface CharPosition {
  element: HTMLSpanElement;
  char: string;
  col: number;
  row: number;
  originalParent: Node;
}

export function wrapCharacters(root: HTMLElement): CharPosition[] {
  const positions: CharPosition[] = [];
  const charWidth = getCharWidth(root);
  const lineHeight = getLineHeight(root);
  const containerWidth = root.clientWidth;
  const charsPerLine = Math.floor(containerWidth / charWidth);

  let globalCol = 0;
  let globalRow = 0;

  // Walk all text nodes
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node: Text | null;
  while (node = walker.nextNode() as Text) {
    textNodes.push(node);
  }

  for (const textNode of textNodes) {
    const text = textNode.textContent || '';
    const parent = textNode.parentNode!;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // Handle newlines
      if (char === '\n') {
        globalRow++;
        globalCol = 0;
        fragment.appendChild(document.createTextNode('\n'));
        continue;
      }

      // Handle line wrap
      if (globalCol >= charsPerLine) {
        globalRow++;
        globalCol = 0;
      }

      // Create span for character
      const span = document.createElement('span');
      span.className = 'matrix-char';
      span.textContent = char;
      span.style.setProperty('--col', String(globalCol));
      span.style.setProperty('--row', String(globalRow));
      span.style.setProperty('--delay', String(Math.random()));

      fragment.appendChild(span);
      positions.push({
        element: span,
        char,
        col: globalCol,
        row: globalRow,
        originalParent: parent
      });

      globalCol++;
    }

    parent.replaceChild(fragment, textNode);
  }

  return positions;
}

function getCharWidth(element: HTMLElement): number {
  const span = document.createElement('span');
  span.style.fontFamily = getComputedStyle(element).fontFamily;
  span.style.fontSize = getComputedStyle(element).fontSize;
  span.style.visibility = 'hidden';
  span.style.position = 'absolute';
  span.textContent = 'M'; // Monospace - any char works
  document.body.appendChild(span);
  const width = span.offsetWidth;
  document.body.removeChild(span);
  return width;
}
```

### Step 2: CSS Animation System

```css
/* app.css */

.matrix-char {
  display: inline-block;
  position: relative;

  /* GPU acceleration */
  will-change: transform, opacity;

  /* Initial state: offset upward, invisible */
  --start-y: calc(-100vh - (var(--row) * 1.6em));
  transform: translateY(var(--start-y));
  opacity: 0;
}

.matrix-char.raining {
  opacity: 1;
  animation: matrix-fall 2s ease-out forwards;
  animation-delay: calc(var(--delay) * 1.5s + var(--col) * 0.05s);
}

@keyframes matrix-fall {
  0% {
    transform: translateY(var(--start-y));
    /* Random char handled by JS */
  }
  70% {
    transform: translateY(10px); /* Overshoot */
  }
  85% {
    transform: translateY(-5px); /* Bounce */
  }
  100% {
    transform: translateY(0);
  }
}

/* Settled state - remove all animation overhead */
.matrix-char.settled {
  transform: none;
  will-change: auto;
  animation: none;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .matrix-char {
    transform: none;
    opacity: 1;
    animation: none;
  }
}
```

### Step 3: Animation Controller

```typescript
// lib/matrix/animation-controller.ts

const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ0123456789';

export class MatrixAnimationController {
  private positions: CharPosition[] = [];
  private rafId: number | null = null;
  private phase: 'idle' | 'raining' | 'settling' | 'settled' = 'idle';

  constructor(private root: HTMLElement) {}

  async start(): Promise<void> {
    // Wrap all characters
    this.positions = wrapCharacters(this.root);

    // Start with random characters
    this.positions.forEach(pos => {
      pos.element.dataset.originalChar = pos.char;
      pos.element.textContent = this.randomChar();
    });

    // Trigger rain animation
    this.phase = 'raining';
    this.positions.forEach(pos => pos.element.classList.add('raining'));

    // Cycle through random chars during fall
    this.startCharacterCycling();

    // Wait for animations to complete
    await this.waitForAnimations();

    // Settle: show correct characters
    this.phase = 'settling';
    this.stopCharacterCycling();
    await this.settleCharacters();

    this.phase = 'settled';
    this.positions.forEach(pos => {
      pos.element.classList.remove('raining');
      pos.element.classList.add('settled');
    });
  }

  private randomChar(): string {
    return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
  }

  private startCharacterCycling(): void {
    const cycle = () => {
      if (this.phase !== 'raining') return;

      // Only cycle ~10% of characters each frame for performance
      this.positions.forEach(pos => {
        if (Math.random() > 0.9) {
          pos.element.textContent = this.randomChar();
        }
      });

      this.rafId = requestAnimationFrame(cycle);
    };
    cycle();
  }

  private stopCharacterCycling(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private async settleCharacters(): Promise<void> {
    // Stagger the reveal of correct characters
    const staggerMs = 20;

    // Sort by row then col for wave effect
    const sorted = [...this.positions].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });

    for (let i = 0; i < sorted.length; i++) {
      const pos = sorted[i];
      pos.element.textContent = pos.element.dataset.originalChar!;

      // Batch updates for performance
      if (i % 10 === 0) {
        await new Promise(r => setTimeout(r, staggerMs));
      }
    }
  }

  private waitForAnimations(): Promise<void> {
    return new Promise(resolve => {
      const lastElement = this.positions[this.positions.length - 1]?.element;
      if (!lastElement) return resolve();

      // Wait for longest animation
      const maxDelay = Math.max(...this.positions.map(p =>
        parseFloat(getComputedStyle(p.element).animationDelay)
      ));
      const duration = parseFloat(getComputedStyle(lastElement).animationDuration);

      setTimeout(resolve, (maxDelay + duration) * 1000 + 100);
    });
  }

  // For page transitions - reverse animation
  async dissolve(): Promise<void> {
    this.phase = 'raining';
    this.positions.forEach(pos => {
      pos.element.classList.remove('settled');
      pos.element.classList.add('dissolving');
    });

    // Start cycling to random chars
    this.startCharacterCycling();

    // Wait then cleanup
    await new Promise(r => setTimeout(r, 1000));
    this.stopCharacterCycling();
  }
}
```

### Step 4: SvelteKit Integration

```svelte
<!-- routes/+layout.svelte -->
<script lang="ts">
  import { onNavigate } from '$app/navigation';
  import { onMount } from 'svelte';
  import { MatrixAnimationController } from '$lib/matrix/animation-controller';
  import { browser } from '$app/environment';

  let { children } = $props();
  let mainElement: HTMLElement;
  let controller: MatrixAnimationController | null = null;

  onMount(() => {
    if (browser && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      controller = new MatrixAnimationController(mainElement);
      controller.start();
    }
  });

  // Page transitions
  onNavigate(async (navigation) => {
    if (!controller) return;

    // Dissolve current content
    await controller.dissolve();

    // Navigation happens, new content loads
    // New controller will be created for new page
  });
</script>

<div class="container">
  <header class="site-header">
    <!-- Header excluded from effect, always visible -->
  </header>

  <main bind:this={mainElement}>
    {@render children()}
  </main>
</div>
```

### Step 5: Responsive Handling

```typescript
// lib/matrix/responsive.ts

export function setupResizeHandler(
  controller: MatrixAnimationController,
  root: HTMLElement
): () => void {
  let resizeTimeout: number;
  let lastWidth = root.clientWidth;

  const handleResize = () => {
    const newWidth = root.clientWidth;

    // Only rewrap if width changed significantly (affects line breaks)
    if (Math.abs(newWidth - lastWidth) > 50) {
      clearTimeout(resizeTimeout);

      resizeTimeout = window.setTimeout(() => {
        // If mid-animation, let it finish
        if (controller.phase === 'settled') {
          // Unwrap and rewrap with new positions
          controller.rewrap();
        }
        lastWidth = newWidth;
      }, 250);
    }
  };

  const observer = new ResizeObserver(handleResize);
  observer.observe(root);

  return () => observer.disconnect();
}
```

---

## Comparison with Existing Solutions

| Feature | Standard Rain | This Effect |
|---------|--------------|-------------|
| Characters fall | ✅ Forever | ✅ Then stop |
| Random chars | ✅ Always | ✅ → Real text |
| Destination | ❌ None | ✅ Grid positions |
| Interactive | ❌ Canvas only | ✅ Full DOM |
| Responsive | ✅ Simple resize | ⚠️ Complex rewrap |
| Performance | ✅ Optimized | ⚠️ Many DOM nodes |

**What existing libraries provide:**
- Rezmason/matrix: Beautiful rain, but no settle capability
- react-mdr: Simple rain, canvas-only
- CSS-only: No JavaScript control for settling

**What this requires:**
- Custom character wrapping system
- Custom animation controller
- Grid calculation with line-break awareness
- Page transition integration

---

## Performance Considerations

### DOM Node Count

Typical page might have 2,000-5,000 characters.
- 5,000 spans is fine for modern browsers
- Use `will-change: transform` only during animation
- Remove after settling: `will-change: auto`

### Animation Performance

- CSS transforms are GPU-accelerated
- Avoid animating `left`/`top` (triggers layout)
- Batch character cycling updates
- Use `requestAnimationFrame` for JS-driven parts

### Memory

- Store minimal data per character
- Clean up after animation completes
- Consider unwrapping spans after settle for long sessions

---

## Edge Cases

### Images and Non-Text

```typescript
// Skip images, videos, etc.
function shouldWrap(node: Node): boolean {
  if (node.nodeType !== Node.TEXT_NODE) return false;

  const parent = node.parentElement;
  if (!parent) return false;

  // Skip these elements
  const skip = ['IMG', 'VIDEO', 'CANVAS', 'SVG', 'SCRIPT', 'STYLE'];
  return !skip.includes(parent.tagName);
}
```

Images could fade in separately after text settles.

### Empty/Whitespace

```typescript
// Don't wrap pure whitespace
if (char.trim() === '' && char !== ' ') continue;

// For spaces, still wrap but make invisible during rain
if (char === ' ') {
  span.classList.add('matrix-char-space');
}
```

### Very Long Pages

For pages with 10,000+ characters:
- Consider viewport-based activation (only animate visible portion)
- Or simplify: fade in below-fold content normally

---

## Accessibility

### prefers-reduced-motion

```typescript
// Check before any animation
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // Skip all animation, show content immediately
  return;
}
```

### Screen Readers

The DOM structure remains intact - screen readers will read the content normally. Animation is purely visual.

### Keyboard Navigation

Links remain focusable throughout. Tab order preserved.

---

## Timeline Estimate

| Phase | Effort |
|-------|--------|
| Character wrapping system | 2-3 days |
| CSS animation system | 1-2 days |
| Animation controller | 2-3 days |
| SvelteKit integration | 1 day |
| Responsive handling | 2-3 days |
| Page transitions | 1-2 days |
| Edge cases & polish | 2-3 days |
| **Total** | **11-17 days** |

---

## Recommendation

**This is achievable but significant.**

If pursuing this:
1. Start with Option C (DOM wrapping) - most maintainable
2. Build character wrapper first, test thoroughly
3. Add animation in phases: fall → settle → page transitions
4. Handle responsive as final polish

The effect would be unique and memorable, but weigh against:
- Development time
- Ongoing maintenance (resize bugs are likely)
- Mobile performance concerns
- Accessibility requirements

**Alternative: Simplified version**
- Rain effect on initial page load only (not every navigation)
- Hero section only, not full page
- Significantly reduces complexity
