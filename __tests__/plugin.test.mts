import type { KAPLAYCtx } from 'kaplay';

import { examplePlugin } from '../dist/plugin.mjs';

describe('dist/plugin.mjs', () => {
  it('exports plugin', () => {
    expect(examplePlugin).toBeTypeOf('function');
  });

  it('adds plugin', () => {
    const k = {} as unknown as KAPLAYCtx;
    expect(examplePlugin(k).example).toBeTypeOf('function');
  });

  it('calls plugin', () => {
    const log = vi.fn();
    const k = {
      debug: {
        log,
      },
    } as unknown as KAPLAYCtx;

    examplePlugin(k).example();

    expect(log).toHaveBeenCalledExactlyOnceWith('kaplay-plugin-template');
  });
});
