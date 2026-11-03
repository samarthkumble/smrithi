import { createSystem, type UIKitMLAsset, VisibilityState } from '@iwsdk/core';

/** Start panel: "Enter Smriti" in the browser; hidden once inside XR. */
export class PanelSystem extends createSystem({}) {
  init(): void {
    const panelObj = this.world.getSceneObject<UIKitMLAsset>('start-panel');
    const xrButton = panelObj?.getElementById('xr-button');
    const exitButton = panelObj?.getElementById('exit-button');
    if (!panelObj || xrButton == null || exitButton == null) return;
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
        panelObj.visible = is2D;
        const caption = this.world.getSceneObject('caption-panel');
        if (caption) caption.visible = !is2D;
      }),
    );
  }
}
