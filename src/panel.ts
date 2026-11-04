import { createSystem, SessionMode, type UIKitMLAsset, VisibilityState } from '@iwsdk/core';
import { mountTopicOverlay } from './topic-overlay.js';

/** Start panel: "Enter Smriti" in the browser; hidden once inside XR. */
export class PanelSystem extends createSystem({}) {
  init(): void {
    const panelObj = this.world.getSceneObject<UIKitMLAsset>('start-panel');
    const xrButton = panelObj?.getElementById('xr-button');
    const exitButton = panelObj?.getElementById('exit-button');
    if (!panelObj || xrButton == null || exitButton == null) return;
    const overlay = mountTopicOverlay({
      canEnterXR: this.world.xrEnabled,
      enterXR: (ownRoom) => this.world.launchXR({ sessionMode: ownRoom ? SessionMode.ImmersiveAR : SessionMode.ImmersiveVR }),
    });
    this.cleanupFuncs.push(() => overlay.dispose());
    if (!this.world.xrEnabled) {
      xrButton.setProperties({ display: 'none' });
      exitButton.setProperties({ display: 'none' });
      return;
    }
    const launchXR = () => this.world.launchXR();
    const exitXR = () => this.world.exitXR();
    xrButton.addEventListener('click', launchXR);
    exitButton.addEventListener('click', exitXR);
    this.cleanupFuncs.push(
      () => xrButton.removeEventListener('click', launchXR),
      () => exitButton.removeEventListener('click', exitXR),
      this.world.visibilityState.subscribe((state) => {
        const is2D = state === VisibilityState.NonImmersive;
        panelObj.visible = false; // the DOM start screen replaces it
        overlay.setVisible(is2D);
        const caption = this.world.getSceneObject('caption-panel');
        if (caption) caption.visible = !is2D;
      }),
    );
  }
}
