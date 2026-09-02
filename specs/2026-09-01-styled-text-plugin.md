# Styled Text Plugin

Create a KAPLAY plugin that provides a `styledText()` component for rendering text with visual styles (outline, shadow, gradient) using an offscreen HTML5 Canvas 2D context, then converting the result to a KAPLAY sprite.

## Approach

The plugin creates an offscreen `<canvas>` element, uses the native 2D context API (`strokeText`, `shadowBlur`, `createLinearGradient`, `fillText`) to render styled text, then converts the canvas to `SpriteData` via `SpriteData.fromImage()` and renders it in the component's `draw` method using `k.drawSprite()`.

## API

```typescript
// Plugin function
export function styledTextPlugin(k: KAPLAYCtx): {
  styledText: (txt?: string, opt?: StyledTextCompOpt) => StyledTextComp;
};

// Component options — follows KAPLAY naming convention (e.g. TextCompOpt, SpriteCompOpt)
interface StyledTextCompOpt {
  size?: number; // font size in px (default 48)
  font?: string; // CSS font family (defaults to kaplay() init font, then "monospace")
  fill?: Color; // fill color (default Color.WHITE) — uses KAPLAY Color type
  outline?: Outline; // text outline — reuses KAPLAY's Outline type ({ width?, color?, opacity? })
  shadow?: StyledTextShadow; // drop shadow
  gradient?: StyledTextGradient; // color gradient across text
  align?: TextAlign; // "left" | "center" | "right" (default "left") — reuses KAPLAY's TextAlign
  width?: number; // wrap width (optional)
  lineSpacing?: number; // gap between lines in px (default 0) — matches TextCompOpt.lineSpacing
}

// Shadow style
interface StyledTextShadow {
  color: Color; // KAPLAY Color type
  offsetX: number;
  offsetY: number;
  blur: number;
}

// Gradient style
interface StyledTextGradient {
  from: Color; // KAPLAY Color type
  to: Color; // KAPLAY Color type
  direction: 'horizontal' | 'vertical'; // default "horizontal"
}

// Component interface
interface StyledTextComp extends Comp {
  id: 'styledText';
  text: string; // get/set text, re-renders on change
  width: number; // rendered text width
  height: number; // rendered text height
  renderArea(): Rect; // required by KAPLAY's internal area computation
  setStyle(opt: Partial<StyledTextCompOpt>): void; // update styles, re-renders
  destroy(): void; // frees texture and clears canvas reference
}
```

### KAPLAY Convention Alignment

- **`Color` type** for all colors (`fill`, `outline.color`, `shadow.color`, `gradient.from/to`) — converted to CSS strings internally for canvas API
- **`Outline` type** reused for `outline` ({ width?, color?, opacity? }) — matches KAPLAY's `outline()` component
- **`TextAlign` type** reused for `align` ("left" | "center" | "right")
- **`lineSpacing`** instead of `lineHeight` — matches `TextCompOpt.lineSpacing`
- **`StyledTextCompOpt`** naming — matches `{Name}CompOpt` pattern (TextCompOpt, SpriteCompOpt, etc.)

## Files to Modify

### 1. `src/plugin.ts` — Full rewrite

- Import `Color`, `Outline`, `TextAlign`, `Comp`, `KAPLAYCtx`, `SpriteData`, `Rect`, `Anchor`, `Uniform` from 'kaplay'
- Define `StyledTextCompOpt`, `StyledTextShadow`, `StyledTextGradient`, `StyledTextComp` types
- Declare module augmentation: add `styledText` to `KAPLAYCtx`
- Implement `styledTextPlugin(k)`:
  - `styledText(txt, opt)` creates a component that:
    - Creates an offscreen `HTMLCanvasElement` + 2D context
    - Measures text, sizes canvas accordingly
    - Renders text with styles (shadow → stroke → fill/gradient)
    - Creates `SpriteData.fromImage(canvas)`
    - `draw()` calls `k.drawSprite()` passing `sprite: spriteData`, `pos: k.vec2(-padding, -padding)` (to align text content with game object position), and all `RenderProps` from the game object (`anchor`, `color`, `opacity`, `outline`, `shader`, `uniform`, `flipX`, `flipY`)
    - `text` setter and `setStyle()` trigger re-render
    - `renderArea()` returns `new k.Rect(k.vec2(0), textWidth, textHeight)` — required by KAPLAY's internal `localArea()` computation
    - `destroy()` frees texture via `spriteData.tex.free()` and clears canvas reference

### 2. `global.d.ts` — Update global type

- Replace `Example` type with `StyledTextComp` and related types

### 3. `__tests__/plugin.test.ts` — Rewrite tests

- Test plugin registration (adds `styledText` to ctx)
- Test component creation (returns component with `id: "styledText"`)
- Test text property get/set
- Test `setStyle()` method
- Test canvas rendering is called (mock `document.createElement`)
- Test `draw()` calls `k.drawSprite`
- Test re-render on text/style change
- Test font fallback: when `k._k` is undefined, defaults to `"monospace"` instead of crashing
- Test font fallback: when `k._k.globalOpt.font` is set, uses that font
- Canary test: verify `k._k.globalOpt` exists on a real KAPLAY instance (import `kaplay` and call `kaplay()`). This test will break when upgrading KAPLAY if the internal structure changes, prompting investigation before release.

### 4. `__tests__/plugin.test.mts` — Update dist tests

- Update import from `examplePlugin` to `styledTextPlugin`
- Test dist export exists and is a function

### 5. `example/game.ts` — Update example

- Use `styledTextPlugin` instead of `examplePlugin`
- Demo multiple styled text objects:
  - Outline only (e.g. title text)
  - Shadow only (e.g. subtitle)
  - Gradient (horizontal, e.g. colorful heading)
  - Outline + shadow + gradient combined (e.g. game over text)
  - Dynamic text update (e.g. score counter using `text` setter)
  - `setStyle()` update (e.g. change color on click)

### 6. `README.md` — Full update

- Update usage examples to show `styledText()` component with style options
- Add **How It Works** section explaining the offscreen canvas approach:
  - Creates an HTML5 `<canvas>` element, renders text using the 2D context API (`strokeText`, `shadowBlur`, `createLinearGradient`, `fillText`), then converts to a KAPLAY sprite
  - Why: KAPLAY renders via WebGL, which doesn't natively support stroke/shadow/gradient on text. The canvas 2D API does.
- Add **Performance** section:
  - Canvas rasterization + GPU texture upload only happens when text or styles change (infrequent)
  - Per-frame `draw()` is a single `k.drawSprite()` call on the cached sprite — cheap
  - Each styled text object holds its own canvas + texture; avoid creating many rapidly-changing styled text objects
- Add **Limitations** section:
  - **No bitmap font support**: canvas 2D API only supports CSS font families, not KAPLAY's bitmap fonts
  - **No `textStyles` / `[style]` markup**: KAPLAY's per-character style syntax doesn't work — text is rendered as a flat string
  - **No `textTransform`**: per-character `CharTransform` (pos, scale, angle, color per char) is not supported
  - **No `letterSpacing`**: canvas 2D has no native letter-spacing (may work in modern browsers via `ctx.letterSpacing`, but not universal)
  - **Not a drop-in replacement for `text()`**: `styledText()` is a separate component; use `text()` for plain text, `styledText()` when you need outline/shadow/gradient
- Add **API** section documenting `StyledTextCompOpt` options (size, font, fill, outline, shadow, gradient, align, width, lineSpacing)
- Add **Options** table or list with defaults

## Performance Note

The canvas rasterization + GPU texture upload only happens when text or styles change (infrequent). The per-frame `draw()` is just a single `k.drawSprite()` call on the cached sprite — cheap.

## Implementation Details

### Canvas Rendering Steps

1. Create canvas, get 2D context
2. Set `ctx.font = "${size}px ${font}"` (font falls back to `k._k.globalOpt.font` with runtime guard, then `"monospace"`)
   - Access `k._k?.globalOpt?.font` defensively — if `k._k` is undefined (internal API changed), fall back to `"monospace"`
3. Measure text with `ctx.measureText()` to get width; handle wrapping if `width` is set
4. Set canvas dimensions (text width + padding for stroke/shadow)
5. Apply shadow: set `ctx.shadowColor/OffsetX/OffsetY/Blur`
6. Apply outline: `ctx.strokeStyle`, `ctx.lineWidth`, `ctx.strokeText()`
7. Reset shadow (set to transparent) before fill
8. Apply fill or gradient: `ctx.fillStyle = gradient ? createLinearGradient() : fill`
9. `ctx.fillText()`
10. Create `SpriteData.fromImage(canvas, { singular: true })` — `singular: true` ensures each sprite gets its own standalone texture (not a shared atlas), making `tex.free()` safe without corrupting other sprites

### Re-rendering

- Canvas element is created once at component init and reused
- `SpriteData` is created via `k.SpriteData.fromImage(canvas, { singular: true })` — accessed directly on `KAPLAYCtx` (no type cast needed)
- On re-render: clear canvas (`ctx.clearRect`), redraw text, then:
  - **Same dimensions**: call `spriteData.tex.update(canvas, texX, texY)` where `texX`/`texY` are pixel offsets derived from `spriteData.frames[0].x * tex.width` and `frames[0].y * tex.height` — ensures the update writes to the correct region of the texture
  - **Changed dimensions**: create new `SpriteData` with `singular: true` (GPU textures are fixed-size); free old texture via `spriteData.tex.free()` — safe because `singular: true` gives each sprite its own texture
- This avoids canvas creation and texture allocation on re-renders; only rasterization + texture upload remains (unavoidable)

## Verification

- `npm run lint:fix`
- `npm run build`
- `npm run lint:tsc`
- `npm run test:ci`
- `npm run lint:package`
