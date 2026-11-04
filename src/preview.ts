/**
 * "Preview on this computer": shared state between the start screen (DOM),
 * the mouse/camera system and Smriti's main system. No DOM or World here.
 */
export const preview = {
  /** True once the person chose to try Smriti with a mouse. */
  active: false,
  /** Pointer in normalised device coordinates (-1..1), updated by PreviewSystem. */
  ndcX: 0,
  ndcY: 0,
  /** Primary button is held. */
  down: false,
  /** A memory is being carried, so drags move it instead of turning the view. */
  carrying: false,
};
