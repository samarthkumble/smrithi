import '@fontsource/hanken-grotesk/400.css';
import '@fontsource/hanken-grotesk/600.css';
import '@fontsource/hanken-grotesk/700.css';
import '@fontsource/tiro-devanagari-sanskrit/400.css';
import { World } from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { AmbienceSystem } from './ambience.js';
import { PalmMenuSystem } from './palm-menu-system.js';
import { PanelSystem } from './panel.js';
import { PreviewSystem } from './preview-system.js';
import { SmritiSystem } from './smriti-system.js';
import { mountTopicOverlay } from './topic-overlay.js';

// The start screen appears at once; the 3D world loads behind it.
const startScreen = mountTopicOverlay();

World.create(document.getElementById('scene-container') as HTMLDivElement, projectOptions).then((world) => {
  world.registerSystem(PanelSystem);
  world.registerSystem(SmritiSystem);
  world.registerSystem(AmbienceSystem);
  world.registerSystem(PreviewSystem);
  world.registerSystem(PalmMenuSystem);
  startScreen.ready(world);
});
