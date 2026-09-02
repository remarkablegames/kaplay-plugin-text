import kaplay from 'kaplay';

import { styledTextPlugin } from '../src/plugin';

const k = kaplay({
  plugins: [styledTextPlugin],
  font: 'sans-serif',
  width: 640,
  height: 480,
});

const posX = 100;

// Outline only
k.add([
  k.pos(posX, 60),
  k.styledText('OUTLINE', {
    size: 48,
    fill: k.rgb(255, 255, 255),
    outline: {
      color: k.rgb(0, 0, 0),
      width: 4,
    },
  }),
]);

// Shadow only
k.add([
  k.pos(posX, 140),
  k.styledText('SHADOW', {
    size: 48,
    fill: k.rgb(255, 255, 255),
    shadow: {
      color: k.rgb(0, 0, 0),
      offsetX: 4,
      offsetY: 4,
      blur: 8,
    },
  }),
]);

// Gradient
k.add([
  k.pos(posX, 220),
  k.styledText('GRADIENT', {
    size: 48,
    gradient: {
      from: k.rgb(255, 0, 0),
      to: k.rgb(0, 0, 255),
      direction: 'horizontal',
    },
  }),
]);

// Combined: outline + shadow + gradient
k.add([
  k.pos(posX, 300),
  k.styledText('GAME OVER', {
    size: 56,
    outline: {
      color: k.rgb(0, 0, 0),
      width: 6,
    },
    shadow: {
      color: k.rgb(0, 0, 0),
      offsetX: 6,
      offsetY: 6,
      blur: 12,
    },
    gradient: {
      from: k.rgb(255, 215, 0),
      to: k.rgb(255, 50, 50),
      direction: 'horizontal',
    },
  }),
]);

// Dynamic text update (score counter)
const score = k.add([
  k.pos(k.center().x, 380),
  k.anchor('center'),
  k.styledText('Score: 0', {
    size: 32,
    fill: k.rgb(0, 255, 0),
    outline: {
      color: k.rgb(0, 0, 0),
      width: 2,
    },
  }),
]);

let scoreValue = 0;
k.onKeyPress('space', () => {
  scoreValue++;
  score.text = `Score: ${String(scoreValue)}`;
});

// setStyle update (change color on click)
const button = k.add([
  k.pos(k.center().x, 430),
  k.anchor('center'),
  k.styledText('Click me!', {
    size: 28,
    fill: k.rgb(100, 180, 255),
  }),
  k.area(),
]);

button.onClick(() => {
  button.text = 'Clicked!';
  button.setStyle({ fill: k.rgb(255, 100, 100) });
});
