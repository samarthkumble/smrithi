import { createSystem, type UIKitMLAsset, VisibilityState } from '@iwsdk/core';

/**
 * Panels: the old 3D start panel stays hidden (the DOM start screen in
 * topic-overlay.ts replaces it); Smriti's caption shows only inside XR.
 */
export class PanelSystem extends createSystem({}) {
  init(): void {
    const panelObj = this.world.getSceneObject<UIKitMLAsset>('start-panel');
    if (panelObj) panelObj.visible = false;
    this.cleanupFuncs.push(
      this.world.visibilityState.subscribe((state) => {
        const caption = this.world.getSceneObject('caption-panel');
        if (caption) caption.visible = state !== VisibilityState.NonImmersive;
      }),
    );
  }
}
