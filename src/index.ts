import { World } from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { AmbienceSystem } from './ambience.js';
import { PanelSystem } from './panel.js';
import { SmritiSystem } from './smriti-system.js';
import { mountTopicOverlay } from './topic-overlay.js';

// The start screen appears at once; the 3D world loads behind it.
const startScreen = mountTopicOverlay();

World.create(document.getElementById('scene-container') as HTMLDivElement, projectOptions).then((world) => {
  world.registerSystem(PanelSystem);
  world.registerSystem(SmritiSystem);
  world.registerSystem(AmbienceSystem);
  startScreen.ready(world);
});
