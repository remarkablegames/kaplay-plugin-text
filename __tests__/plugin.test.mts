import type { KAPLAYCtx } from 'kaplay';

import { styledTextPlugin } from '../dist/plugin.mjs';

describe('dist/plugin.mjs', () => {
  it('exports plugin', () => {
    expect(styledTextPlugin).toBeTypeOf('function');
  });

  it('adds plugin', () => {
    const k = {} as unknown as KAPLAYCtx;
    expect(styledTextPlugin(k).styledText).toBeTypeOf('function');
  });

  it('creates component', () => {
    const k = {} as unknown as KAPLAYCtx;
    const comp = styledTextPlugin(k).styledText('hello');
    expect(comp.id).toBe('styledText');
    expect(comp.text).toBe('hello');
  });
});
