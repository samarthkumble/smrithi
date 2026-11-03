import { AssetType, defineAssets } from '@iwsdk/core';
import { createPalaceRoom } from './scene-assets/room.scene-asset.js';

const publicAssetUrl = (filePath: string): string =>
  `${import.meta.env.BASE_URL}${filePath.replace(/^\/+/u, '')}`;

const uikitml = (fileName: string, name: string) => ({
  url: publicAssetUrl(`ui/${fileName}`),
  type: AssetType.UIKitML,
  name,
});

export default defineAssets({
  'palace-room': createPalaceRoom(),
  'start-panel': uikitml('welcome.uikitml', 'Start Panel'),
  'caption-panel': uikitml('caption.uikitml', 'Caption Panel'),
});
