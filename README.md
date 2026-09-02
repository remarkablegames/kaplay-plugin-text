# kaplay-plugin-text

[![NPM](https://nodei.co/npm/kaplay-plugin-text.svg)](https://www.npmjs.com/package/kaplay-plugin-text)

[![NPM version](https://img.shields.io/npm/v/kaplay-plugin-text.svg)](https://www.npmjs.com/package/kaplay-plugin-text)
[![build](https://github.com/remarkablegames/kaplay-plugin-text/actions/workflows/build.yml/badge.svg)](https://github.com/remarkablegames/kaplay-plugin-text/actions/workflows/build.yml)
[![codecov](https://codecov.io/gh/remarkablegames/kaplay-plugin-text/graph/badge.svg?token=eYjvmCLEpL)](https://codecov.io/gh/remarkablegames/kaplay-plugin-text)

🦖 KAPLAY plugin for styled text.

## Prerequisites

Install [kaplay](https://www.npmjs.com/package/kaplay):

```sh
npm install kaplay
```

## Install

[NPM](https://www.npmjs.com/package/kaplay-plugin-text):

```sh
npm install kaplay-plugin-text
```

[CDN](https://unpkg.com/browse/kaplay-plugin-text/):

```html
<script src="https://unpkg.com/kaplay-plugin-text@latest/dist/plugin.umd.js"></script>
```

## Usage

Import the plugin:

```ts
import kaplay from 'kaplay';
import { styledTextPlugin } from 'kaplay-plugin-text';

const k = kaplay({
  plugins: [styledTextPlugin],
});
```

Outline text:

```ts
k.styledText('Hello', {
  size: 48,
  fill: k.rgb(255, 255, 255),
  outline: {
    color: k.rgb(0, 0, 0),
    width: 4,
  },
});
```

Add a drop shadow:

```ts
k.styledText('Hello', {
  size: 48,
  fill: k.rgb(255, 255, 255),
  shadow: {
    color: k.rgb(0, 0, 0),
    offsetX: 4,
    offsetY: 4,
    blur: 8,
  },
});
```

Fill with a gradient:

```ts
k.styledText('Hello', {
  size: 48,
  gradient: {
    from: k.rgb(255, 0, 0),
    to: k.rgb(0, 0, 255),
    direction: 'horizontal',
  },
});
```

Combine outline, shadow, and gradient:

```ts
k.styledText('GAME OVER', {
  size: 56,
  outline: { color: k.rgb(0, 0, 0), width: 6 },
  shadow: { color: k.rgb(0, 0, 0), offsetX: 6, offsetY: 6, blur: 12 },
  gradient: {
    from: k.rgb(255, 215, 0),
    to: k.rgb(255, 50, 50),
    direction: 'horizontal',
  },
});
```

Update text and styles at runtime:

```ts
const score = k.styledText('Score: 0', { size: 32 });

score.text = 'Score: 10';

// Update styles at runtime
score.setStyle({ fill: k.rgb(0, 255, 0) });
```

To load the plugin using a script:

```html
<script src="https://unpkg.com/kaplay@latest/dist/kaplay.js"></script>
<script src="https://unpkg.com/kaplay-plugin-text@latest/dist/plugin.umd.js"></script>

<script>
  const k = kaplay({
    plugins: [KaplayPluginText.styledTextPlugin],
  });

  k.styledText('Hello', {
    size: 48,
    outline: { color: k.rgb(0, 0, 0), width: 4 },
  });
</script>
```

## How It Works

The plugin creates an offscreen HTML5 `<canvas>` element, renders text using the 2D context API (`strokeText`, `shadowBlur`, `createLinearGradient`, `fillText`), then converts the canvas to a KAPLAY sprite via `SpriteData.fromImage()`.

KAPLAY renders via WebGL, which doesn't natively support stroke, shadow, or gradient on text. The canvas API does, so this plugin bridges the gap by rasterizing styled text to a texture and rendering it as a sprite.

## Performance

Rendering only happens when text or styles change — per-frame draws are a single cached sprite call. Canvas and textures are reused across updates.

## Limitations

- **No bitmap font support**: canvas only supports CSS font families, not KAPLAY's bitmap fonts
- **No `textStyles` / `[style]` markup**: KAPLAY's per-character style syntax doesn't work — text is rendered as a flat string
- **No `textTransform`**: per-character `CharTransform` (pos, scale, angle, color per char) is not supported
- **No `letterSpacing`**: canvas has no native letter-spacing (may work in modern browsers via `ctx.letterSpacing`, but not universal)
- **Not a drop-in replacement for `text()`**: `styledText()` is a separate component; use `text()` for plain text, `styledText()` when you need outline/shadow/gradient

## API

### `styledText(txt?, opt?)`

Returns a `StyledTextComp` component for rendering styled text.

#### Parameters

| Option            | Type                 | Default                           | Description                                       |
| ----------------- | -------------------- | --------------------------------- | ------------------------------------------------- |
| `txt`             | `string`             | `''`                              | The text to display                               |
| `opt.size`        | `number`             | `48`                              | Font size in pixels                               |
| `opt.font`        | `string`             | kaplay init font or `'monospace'` | CSS font family                                   |
| `opt.fill`        | `Color`              | `Color.WHITE`                     | Fill color                                        |
| `opt.outline`     | `Outline`            | —                                 | Text outline (`{ width?, color?, opacity? }`)     |
| `opt.shadow`      | `StyledTextShadow`   | —                                 | Drop shadow (`{ color, offsetX, offsetY, blur }`) |
| `opt.gradient`    | `StyledTextGradient` | —                                 | Color gradient (`{ from, to, direction }`)        |
| `opt.align`       | `TextAlign`          | `'left'`                          | Text alignment (`'left'`, `'center'`, `'right'`)  |
| `opt.width`       | `number`             | —                                 | Wrap width in pixels                              |
| `opt.lineSpacing` | `number`             | `0`                               | Gap between lines in pixels                       |

#### Component Properties

| Property        | Type           | Description                      |
| --------------- | -------------- | -------------------------------- |
| `id`            | `'styledText'` | Component ID                     |
| `text`          | `string`       | Get/set text (re-renders on set) |
| `width`         | `number`       | Rendered text width              |
| `height`        | `number`       | Rendered text height             |
| `setStyle(opt)` | `void`         | Update styles and re-render      |

## Release

Release is automated with [Release Please](https://github.com/googleapis/release-please).

## License

[MIT](https://github.com/remarkablegames/kaplay-plugin-text/blob/master/LICENSE)
