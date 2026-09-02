import type { KAPLAYCtx, SpriteData } from 'kaplay';

import { styledTextPlugin } from '../src/plugin';

/** Shared mock canvas 2D context. */
function createMockCtx() {
  return {
    font: '',
    textAlign: '',
    textBaseline: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineJoin: '',
    shadowColor: '',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowBlur: 0,
    measureText: vi.fn(() => ({ width: 50 })),
    clearRect: vi.fn(),
    strokeText: vi.fn(),
    fillText: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
  };
}

/** Shared mock canvas element. */
function createMockCanvas(ctx: ReturnType<typeof createMockCtx>) {
  return {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ctx),
  };
}

/** Shared mock SpriteData with tex.update and tex.free. */
function createMockSpriteData() {
  return {
    tex: {
      update: vi.fn(),
      free: vi.fn(),
      width: 256,
      height: 256,
    },
    frames: [{ x: 0.1, y: 0.2, w: 0.3, h: 0.4 }],
  } as unknown as SpriteData;
}

/** Mock SpriteData class with static fromImage. */
function createMockSpriteDataClass(spriteData: SpriteData) {
  return {
    fromImage: vi.fn((_img: unknown, opt?: { singular?: boolean }) => {
      if (opt?.singular) {
        return spriteData;
      }
      return spriteData;
    }),
  } as unknown as typeof SpriteData;
}

/** Set up global document mock. Returns cleanup function. */
function setupDomMock() {
  const ctx = createMockCtx();
  const canvas = createMockCanvas(ctx);
  const spriteData = createMockSpriteData();
  const SpriteDataClass = createMockSpriteDataClass(spriteData);

  const createElementMock = vi.fn(() => canvas);
  const originalDocument = globalThis.document as Document | undefined;
  globalThis.document = {
    createElement: createElementMock,
  } as unknown as Document;

  const cleanup = () => {
    if (originalDocument) {
      globalThis.document = originalDocument;
    } else {
      delete (globalThis as Record<string, unknown>).document;
    }
    vi.restoreAllMocks();
  };

  return {
    ctx,
    canvas,
    spriteData,
    SpriteDataClass,
    createElementMock,
    cleanup,
  };
}

describe('styledTextPlugin', () => {
  const drawSprite = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  /** Build a mock KAPLAYCtx with SpriteData on it. */
  function makeK(SpriteDataClass?: unknown) {
    return {
      drawSprite,
      SpriteData: SpriteDataClass,
      vec2: (x: number, y: number) => ({ x, y }),
      Rect: class MockRect {
        pos: { x: number; y: number };
        width: number;
        height: number;
        constructor(
          pos: { x: number; y: number },
          width: number,
          height: number,
        ) {
          this.pos = pos;
          this.width = width;
          this.height = height;
        }
      },
      _k: {
        globalOpt: { font: 'Arial' },
      },
    } as unknown as KAPLAYCtx;
  }

  it('registers styledText on the context', () => {
    const result = styledTextPlugin(makeK());
    expect(result.styledText).toBeTypeOf('function');
  });

  it('returns a component with id "styledText"', () => {
    const { styledText } = styledTextPlugin(makeK());
    const comp = styledText('hello');
    expect(comp.id).toBe('styledText');
  });

  it('gets and sets text', () => {
    const { styledText } = styledTextPlugin(makeK());
    const comp = styledText('hello');
    expect(comp.text).toBe('hello');
    comp.text = 'world';
    expect(comp.text).toBe('world');
  });

  it('calls setStyle and updates options', () => {
    const { styledText } = styledTextPlugin(makeK());
    const comp = styledText('hello', { size: 32 });
    comp.setStyle({ size: 64 });
    expect(comp.text).toBe('hello');
  });

  it('creates canvas on add and calls drawSprite on draw', () => {
    const { ctx, canvas, spriteData, SpriteDataClass, cleanup } =
      setupDomMock();
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));
    const comp = styledText('test');

    comp.add?.();
    expect(canvas.getContext).toHaveBeenCalledWith('2d');
    expect(ctx.measureText).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(SpriteDataClass.fromImage).toHaveBeenCalledWith(canvas, {
      singular: true,
    });

    comp.draw?.();
    expect(drawSprite).toHaveBeenCalledExactlyOnceWith({
      sprite: spriteData,
      pos: { x: -2, y: -2 },
      anchor: undefined,
      color: undefined,
      opacity: undefined,
      outline: undefined,
      shader: undefined,
      uniform: undefined,
      flipX: undefined,
      flipY: undefined,
    });

    comp.destroy?.();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(vi.mocked(spriteData.tex.free)).toHaveBeenCalledOnce();

    cleanup();
  });

  it('re-renders when text changes', () => {
    const { ctx, SpriteDataClass, cleanup } = setupDomMock();
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));
    const comp = styledText('initial');

    comp.add?.();
    const initialCallCount = ctx.fillText.mock.calls.length;

    comp.text = 'updated';
    expect(ctx.fillText.mock.calls.length).toBeGreaterThan(initialCallCount);

    cleanup();
  });

  it('re-renders when setStyle is called', () => {
    const { ctx, SpriteDataClass, cleanup } = setupDomMock();
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));
    const comp = styledText('hello', { size: 32 });

    comp.add?.();
    const initialCallCount = ctx.fillText.mock.calls.length;

    comp.setStyle({ size: 64 });
    expect(ctx.fillText.mock.calls.length).toBeGreaterThan(initialCallCount);

    cleanup();
  });

  it('falls back to "monospace" when k._k is undefined', () => {
    const { ctx, SpriteDataClass, cleanup } = setupDomMock();
    const kNoInternal = {
      SpriteData: SpriteDataClass,
      vec2: (x: number, y: number) => ({ x, y }),
      Rect: class {
        pos: { x: number; y: number };
        width: number;
        height: number;
        constructor(
          pos: { x: number; y: number },
          width: number,
          height: number,
        ) {
          this.pos = pos;
          this.width = width;
          this.height = height;
        }
      },
    } as unknown as KAPLAYCtx;
    const { styledText } = styledTextPlugin(kNoInternal);

    const comp = styledText('test');
    expect(() => comp.add?.()).not.toThrow();
    expect(ctx.font).toContain('monospace');

    cleanup();
  });

  it('uses font from k._k.globalOpt when set', () => {
    const { ctx, SpriteDataClass, cleanup } = setupDomMock();
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));

    const comp = styledText('test');
    comp.add?.();
    expect(ctx.font).toContain('Arial');

    cleanup();
  });

  it('uses explicitly passed font over kaplay init font', () => {
    const { ctx, SpriteDataClass, cleanup } = setupDomMock();
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));

    const comp = styledText('test', { font: 'Georgia' });
    comp.add?.();
    expect(ctx.font).toContain('Georgia');

    cleanup();
  });

  it('renders outline without color (defaults to black)', () => {
    const { ctx, SpriteDataClass, cleanup } = setupDomMock();
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));

    const comp = styledText('outlined', {
      outline: { width: 4 },
    });
    comp.add?.();
    expect(ctx.strokeStyle).toBe('black');
    expect(ctx.lineWidth).toBe(4);

    cleanup();
  });

  it('renders outline without width (defaults to 1)', () => {
    const { ctx, SpriteDataClass, cleanup } = setupDomMock();
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));

    const comp = styledText('outlined', {
      outline: { color: { r: 0, g: 0, b: 0 } as never },
    });
    comp.add?.();
    expect(ctx.lineWidth).toBe(1);

    cleanup();
  });

  it('does not render when getContext returns null', () => {
    const { canvas, SpriteDataClass, cleanup } = setupDomMock();
    canvas.getContext = vi.fn(
      () => null,
    ) as unknown as typeof canvas.getContext;
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));

    const comp = styledText('test');
    expect(() => comp.add?.()).not.toThrow();

    cleanup();
  });

  it('does not call drawSprite when spriteData is null', () => {
    const { SpriteDataClass, cleanup } = setupDomMock();
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));

    const comp = styledText('test');
    // Draw before add — spriteData is null
    comp.draw?.();
    expect(drawSprite).not.toHaveBeenCalled();

    cleanup();
  });

  it('does not throw on destroy when spriteData is null', () => {
    const { SpriteDataClass, cleanup } = setupDomMock();
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));

    const comp = styledText('test');
    // Destroy before add — spriteData is null
    expect(() => comp.destroy?.()).not.toThrow();

    cleanup();
  });

  it('renders with gradient fill', () => {
    const { ctx, SpriteDataClass, cleanup } = setupDomMock();
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));

    const comp = styledText('gradient text', {
      gradient: {
        from: { r: 255, g: 0, b: 0 } as never,
        to: { r: 0, g: 0, b: 255 } as never,
        direction: 'horizontal',
      },
    });
    comp.add?.();
    expect(ctx.createLinearGradient).toHaveBeenCalled();

    cleanup();
  });

  it('renders with vertical gradient', () => {
    const { ctx, SpriteDataClass, cleanup } = setupDomMock();
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));

    const comp = styledText('vertical', {
      gradient: {
        from: { r: 255, g: 0, b: 0 } as never,
        to: { r: 0, g: 0, b: 255 } as never,
        direction: 'vertical',
      },
    });
    comp.add?.();
    expect(ctx.createLinearGradient).toHaveBeenCalled();

    cleanup();
  });

  it('renders with fill color', () => {
    const { ctx, SpriteDataClass, cleanup } = setupDomMock();
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));

    const comp = styledText('filled', {
      fill: { r: 0, g: 255, b: 0 } as never,
    });
    comp.add?.();
    expect(ctx.fillStyle).toContain('rgb(0, 255, 0)');

    cleanup();
  });

  it('renders with outline', () => {
    const { ctx, SpriteDataClass, cleanup } = setupDomMock();
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));

    const comp = styledText('outlined', {
      outline: {
        color: { r: 0, g: 0, b: 0 } as never,
        width: 4,
      },
    });
    comp.add?.();
    expect(ctx.strokeText).toHaveBeenCalled();
    expect(ctx.lineWidth).toBe(4);

    cleanup();
  });

  it('renders with shadow', () => {
    const { ctx, SpriteDataClass, cleanup } = setupDomMock();
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));

    const comp = styledText('shadowed', {
      shadow: {
        color: { r: 0, g: 0, b: 0 } as never,
        offsetX: 4,
        offsetY: 4,
        blur: 8,
      },
    });
    comp.add?.();
    // Shadow persists for fill when no outline is drawn
    expect(ctx.shadowBlur).toBe(8);
    expect(ctx.shadowOffsetX).toBe(4);

    cleanup();
  });

  it('resets shadow after outline when both shadow and outline are set', () => {
    const { ctx, SpriteDataClass, cleanup } = setupDomMock();
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));

    const comp = styledText('outlined shadow', {
      outline: {
        color: { r: 0, g: 0, b: 0 } as never,
        width: 4,
      },
      shadow: {
        color: { r: 0, g: 0, b: 0 } as never,
        offsetX: 4,
        offsetY: 4,
        blur: 8,
      },
    });
    comp.add?.();
    // Shadow should be reset after outline+shadow, before fill
    expect(ctx.shadowBlur).toBe(0);
    expect(ctx.strokeText).toHaveBeenCalled();

    cleanup();
  });

  it('wraps text when width is set', () => {
    const { ctx, SpriteDataClass, cleanup } = setupDomMock();
    // Override measureText to return widths that exceed the wrap width
    ctx.measureText = vi.fn((text: string) => ({
      width: text.length * 10,
    })) as unknown as typeof ctx.measureText;
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));

    const comp = styledText('one two three four', { width: 60 });
    comp.add?.();
    // measureText is called for wrapping logic
    expect(ctx.measureText).toHaveBeenCalled();
    // fillText should be called multiple times due to wrapping
    expect(ctx.fillText.mock.calls.length).toBeGreaterThan(1);

    cleanup();
  });

  it('handles multiline text', () => {
    const { ctx, SpriteDataClass, cleanup } = setupDomMock();
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));

    const comp = styledText('line one\nline two');
    comp.add?.();
    // fillText should be called for each line
    expect(ctx.fillText.mock.calls.length).toBeGreaterThanOrEqual(2);

    cleanup();
  });

  it('exposes width and height after render', () => {
    const { SpriteDataClass, cleanup } = setupDomMock();
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));

    const comp = styledText('hello');
    comp.add?.();
    expect(comp.width).toBeGreaterThan(0);
    expect(comp.height).toBeGreaterThan(0);

    cleanup();
  });

  it('returns a Rect from renderArea', () => {
    const { SpriteDataClass, cleanup } = setupDomMock();
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));

    const comp = styledText('hello');
    comp.add?.();
    const area = comp.renderArea();
    expect(area.width).toBe(comp.width);
    expect(area.height).toBe(comp.height);

    cleanup();
  });

  it('updates texture in-place when dimensions are unchanged', () => {
    const { spriteData, SpriteDataClass, cleanup } = setupDomMock();
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));

    const comp = styledText('same');
    comp.add?.();

    // Clear call count, then re-render with same text (same dimensions)
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const updateSpy = vi.mocked(spriteData.tex.update);
    updateSpy.mockClear();
    comp.text = 'same';
    expect(updateSpy).toHaveBeenCalled();
    // Verify atlas offsets are passed (frame.x * tex.width, frame.y * tex.height)
    expect(updateSpy).toHaveBeenCalledWith(
      expect.anything(),
      Math.round(0.1 * 256),
      Math.round(0.2 * 256),
    );

    cleanup();
  });

  it('frees old texture and creates new one when dimensions change', () => {
    const { ctx, spriteData, SpriteDataClass, cleanup } = setupDomMock();
    // Override measureText to return different widths for different text
    ctx.measureText = vi.fn((text: string) => ({
      width: text.length * 10,
    })) as unknown as typeof ctx.measureText;
    const { styledText } = styledTextPlugin(makeK(SpriteDataClass));

    const comp = styledText('short');
    comp.add?.();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const freeSpy = vi.mocked(spriteData.tex.free);
    freeSpy.mockClear();

    // Change to longer text to force dimension change
    comp.text = 'this is a much longer text that will change dimensions';
    expect(freeSpy).toHaveBeenCalled();

    cleanup();
  });
});

/**
 * Canary test: verifies that k._k.globalOpt exists in KAPLAY's type definitions.
 * This test will break when upgrading KAPLAY if the internal structure changes,
 * prompting investigation before release.
 */
describe('KAPLAY internal structure canary', () => {
  it('k._k.globalOpt is accessible in the type system', () => {
    const k = {
      _k: {
        globalOpt: { font: 'test' },
      },
    } as unknown as KAPLAYCtx;

    expect(k._k.globalOpt).toBeDefined();
    expect(k._k.globalOpt.font).toBe('test');
  });
});
