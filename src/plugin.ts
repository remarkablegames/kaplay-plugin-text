import type { KAPLAYCtx } from 'kaplay';

declare module 'kaplay' {
  interface KAPLAYCtx {
    example: () => void;
  }
}

export type Example = () => void;

export function examplePlugin(k: KAPLAYCtx) {
  const example: Example = () => {
    k.debug.log('kaplay-plugin-template');
  };

  return { example };
}
