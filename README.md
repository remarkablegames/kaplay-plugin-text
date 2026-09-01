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

Use the plugin:

```ts
k.example();
```

To load the plugin using a script:

```html
<script src="https://unpkg.com/kaplay@latest/dist/kaplay.js"></script>
<script src="https://unpkg.com/kaplay-plugin-text@latest/dist/plugin.umd.js"></script>

<script>
  const k = kaplay({
    plugins: [KaplayPluginText.styledTextPlugin],
  });

  k.example();
</script>
```

## Release

Release is automated with [Release Please](https://github.com/googleapis/release-please).

## License

[MIT](https://github.com/remarkablegames/kaplay-plugin-text/blob/master/LICENSE)
