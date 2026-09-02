import type {
  Anchor,
  Color,
  Comp,
  KAPLAYCtx,
  Outline,
  Rect,
  SpriteData,
  TextAlign,
  Uniform,
} from 'kaplay';

/** Drop shadow style for styled text. */
export interface StyledTextShadow {
  color: Color;
  offsetX: number;
  offsetY: number;
  blur: number;
}

/** Gradient style for styled text. */
export interface StyledTextGradient {
  from: Color;
  to: Color;
  direction: 'horizontal' | 'vertical';
}

/** Options for the {@link styledText} component. */
export interface StyledTextCompOpt {
  size?: number;
  font?: string;
  fill?: Color;
  outline?: Outline;
  shadow?: StyledTextShadow;
  gradient?: StyledTextGradient;
  align?: TextAlign;
  width?: number;
  lineSpacing?: number;
}

/** The {@link styledText} component. */
export interface StyledTextComp extends Comp {
  id: 'styledText';
  text: string;
  width: number;
  height: number;
  renderArea(): Rect;
  setStyle(opt: Partial<StyledTextCompOpt>): void;
}

declare module 'kaplay' {
  interface KAPLAYCtx {
    styledText: (txt?: string, opt?: StyledTextCompOpt) => StyledTextComp;
  }
}

/** Convert a KAPLAY {@link Color} to a CSS string. */
function colorToCss(color: Color): string {
  return `rgb(${String(color.r)}, ${String(color.g)}, ${String(color.b)})`;
}

/** Resolve the font from options, KAPLAY init, or default. */
function resolveFont(k: KAPLAYCtx, font?: string): string {
  if (font) return font;
  const initFont = (k as { _k?: { globalOpt?: { font?: string } } })._k
    ?.globalOpt?.font;
  if (initFont) return initFont;
  return 'monospace';
}

/** Styled text plugin for KAPLAY. */
export function styledTextPlugin(k: KAPLAYCtx) {
  const styledText = (
    txt = '',
    opt: StyledTextCompOpt = {},
  ): StyledTextComp => {
    let currentText = txt;
    let currentOpt: StyledTextCompOpt = { ...opt };
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let spriteData: SpriteData | null = null;
    let textWidth = 0;
    let textHeight = 0;
    let lastCanvasWidth = 0;
    let lastCanvasHeight = 0;
    let currentPadding = 0;

    const getFont = (): string => {
      return resolveFont(k, currentOpt.font);
    };

    const render = (): void => {
      if (!canvas || !ctx) return;

      const font = getFont();
      const fontSize = currentOpt.size ?? 48;
      const textAlign = currentOpt.align ?? 'left';
      const ls = currentOpt.lineSpacing ?? 0;
      const outlineWidth = currentOpt.outline?.width ?? 0;
      const shadowOffsetX = currentOpt.shadow?.offsetX ?? 0;
      const shadowOffsetY = currentOpt.shadow?.offsetY ?? 0;
      const shadowBlur = currentOpt.shadow?.blur ?? 0;
      const padding =
        Math.max(outlineWidth, shadowBlur) +
        Math.abs(shadowOffsetX) +
        Math.abs(shadowOffsetY) +
        2;
      currentPadding = padding;

      ctx.font = `${String(fontSize)}px ${font}`;
      ctx.textAlign = textAlign;
      ctx.textBaseline = 'top';

      // Handle wrapping
      const wrapW = currentOpt.width;
      const lines = wrapText(ctx, currentText, wrapW);
      const lineHeight = fontSize + ls;

      // Measure widest line
      let maxLineWidth = 0;
      for (const line of lines) {
        const metrics = ctx.measureText(line);
        maxLineWidth = Math.max(maxLineWidth, metrics.width);
      }

      const canvasWidth = Math.ceil(maxLineWidth + padding * 2);
      const canvasHeight = Math.ceil(lines.length * lineHeight + padding * 2);

      // Resize canvas if dimensions changed
      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        // Re-set context properties after resize (they reset)
        ctx.font = `${String(fontSize)}px ${font}`;
        ctx.textAlign = textAlign;
        ctx.textBaseline = 'top';
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const x = padding;
        const y = padding + i * lineHeight;

        // Apply shadow
        if (currentOpt.shadow) {
          ctx.shadowColor = colorToCss(currentOpt.shadow.color);
          ctx.shadowOffsetX = currentOpt.shadow.offsetX;
          ctx.shadowOffsetY = currentOpt.shadow.offsetY;
          ctx.shadowBlur = currentOpt.shadow.blur;
        }

        // Draw outline (stroke)
        if (currentOpt.outline) {
          ctx.strokeStyle = currentOpt.outline.color
            ? colorToCss(currentOpt.outline.color)
            : 'black';
          ctx.lineWidth = currentOpt.outline.width ?? 1;
          ctx.lineJoin = 'round';
          ctx.strokeText(line, x, y);

          // Reset shadow before fill to avoid double shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.shadowBlur = 0;
        }

        // Apply fill or gradient
        if (currentOpt.gradient) {
          const grad =
            currentOpt.gradient.direction === 'vertical'
              ? ctx.createLinearGradient(0, padding, 0, canvasHeight - padding)
              : ctx.createLinearGradient(padding, 0, canvasWidth - padding, 0);
          grad.addColorStop(0, colorToCss(currentOpt.gradient.from));
          grad.addColorStop(1, colorToCss(currentOpt.gradient.to));
          ctx.fillStyle = grad;
        } else if (currentOpt.fill) {
          ctx.fillStyle = colorToCss(currentOpt.fill);
        } else {
          ctx.fillStyle = 'white';
        }

        ctx.fillText(line, x, y);
      }

      textWidth = canvasWidth;
      textHeight = canvasHeight;

      // Update or create sprite data
      if (
        spriteData &&
        lastCanvasWidth === canvasWidth &&
        lastCanvasHeight === canvasHeight
      ) {
        const frame = spriteData.frames[0];
        const texX = Math.round(frame.x * spriteData.tex.width);
        const texY = Math.round(frame.y * spriteData.tex.height);
        spriteData.tex.update(canvas, texX, texY);
      } else {
        if (spriteData) {
          spriteData.tex.free();
        }
        spriteData = k.SpriteData.fromImage(canvas, { singular: true });
        lastCanvasWidth = canvasWidth;
        lastCanvasHeight = canvasHeight;
      }
    };

    const wrapText = (
      c: CanvasRenderingContext2D,
      text: string,
      maxWidth?: number,
    ): string[] => {
      if (!maxWidth) return text.split('\n');
      const allLines: string[] = [];
      for (const paragraph of text.split('\n')) {
        const words = paragraph.split(' ');
        let currentLine = '';
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const metrics = c.measureText(testLine);
          if (metrics.width > maxWidth && currentLine) {
            allLines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        allLines.push(currentLine);
      }
      return allLines;
    };

    const comp: StyledTextComp = {
      id: 'styledText',
      get text() {
        return currentText;
      },
      set text(value: string) {
        currentText = value;
        render();
      },
      get width() {
        return textWidth;
      },
      get height() {
        return textHeight;
      },
      renderArea(): Rect {
        return new k.Rect(k.vec2(0), textWidth, textHeight);
      },
      setStyle(opt: Partial<StyledTextCompOpt>): void {
        currentOpt = { ...currentOpt, ...opt };
        render();
      },
      add() {
        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d');
        if (ctx) {
          render();
        }
      },
      draw() {
        if (spriteData) {
          const obj = this as unknown as {
            anchor?: Anchor;
            color?: Color;
            opacity?: number;
            outline?: Outline;
            shader?: string;
            uniform?: Uniform;
            flipX?: boolean;
            flipY?: boolean;
          };
          k.drawSprite({
            sprite: spriteData,
            pos: k.vec2(-currentPadding, -currentPadding),
            anchor: obj.anchor,
            color: obj.color,
            opacity: obj.opacity,
            outline: obj.outline,
            shader: obj.shader,
            uniform: obj.uniform,
            flipX: obj.flipX,
            flipY: obj.flipY,
          });
        }
      },
      destroy() {
        if (spriteData) {
          spriteData.tex.free();
          spriteData = null;
        }
        canvas = null;
        ctx = null;
      },
    };

    return comp;
  };

  return { styledText };
}
