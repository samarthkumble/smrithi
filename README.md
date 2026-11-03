# Smriti

A memory palace that builds itself. An AI agent turns what you need to remember into vivid 3D images; you place each one around a warm room with your hands, and Smriti tests you the next day.

Built with Meta's Immersive Web SDK (WebXR) for the Meta VR Start Developer Competition 2026.

## Run it

```bash
npm install
npm start
```

Then open https://localhost:8081 in Chrome (accept the certificate warning). The page includes a Quest 3 emulator (IWER). Click **Enter Smriti**, switch the emulator to hands, pinch a memory in front of you, move it toward a glowing spot and let go.

On a real Quest on the same Wi-Fi: open the network URL shown by `npx @iwsdk/cli dev status` in the Quest browser and accept the certificate warning.

## Status

- Room with 8 memory spots (door stool, jhoola, bookshelf, window sill, clock shelf, brass lamp, tulsi, rangoli)
- Smriti, the floating diya guide, with captions
- OOP deck: 4 vivid memory images, pinch to grab, aim and release to snap to a spot
