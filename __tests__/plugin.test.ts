import type { KAPLAYCtx } from 'kaplay';

import { examplePlugin } from '../src/plugin';

describe('plugin', () => {
  const log = vi.fn();
  const k = {
    debug: {
      log,
    },
  } as unknown as KAPLAYCtx;

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('logs the template name', () => {
    examplePlugin(k).example();

    expect(log).toHaveBeenCalledExactlyOnceWith('kaplay-plugin-template');
  });
});
