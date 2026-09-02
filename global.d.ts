import type { StyledTextComp } from './dist/plugin';

declare global {
  var styledText: (
    txt?: string,
    opt?: import('./dist/plugin').StyledTextCompOpt,
  ) => StyledTextComp;
}

export {};
