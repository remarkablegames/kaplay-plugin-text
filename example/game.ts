import kaplay from 'kaplay';

import { examplePlugin } from '../src/plugin';

const k = kaplay({
  plugins: [examplePlugin],
});

k.example();
