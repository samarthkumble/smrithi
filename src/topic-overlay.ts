/**
 * Start screen (2D only): type what you want to remember, or pick a ready deck,
 * then enter. Typing happens here because the headset keyboard works in 2D pages.
 */
import { SessionMode, VisibilityState, type World } from '@iwsdk/core';
import { buildFromTopic, deckSource, startReview, usePreset } from './deck-source.js';
import { loadPalace, nextReviewText } from './palace-store.js';
import { saveSettings, settings, type Settings } from './settings.js';
import { PRESET_DECKS } from './decks.js';

const CSS = `
#smriti-start{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);width:min(560px,calc(100vw - 32px));
  box-sizing:border-box;padding:18px 18px 16px;border-radius:18px;background:rgba(34,22,14,.92);color:#F7EEDC;
  font:15px/1.4 system-ui,"Segoe UI",sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.45);z-index:10}
#smriti-start .eyebrow{font-size:11px;letter-spacing:1.4px;font-weight:700;color:#CDBB9E;margin-bottom:4px}
#smriti-start h2{margin:0 0 8px;font-size:18px;font-weight:650;color:#F3C35B}
#smriti-start textarea{width:100%;box-sizing:border-box;min-height:64px;resize:vertical;border-radius:12px;border:1px solid #6b4a2c;
  background:#1d130c;color:#F7EEDC;padding:10px 12px;font:inherit}
#smriti-start textarea:focus{outline:2px solid #E3A21A;border-color:transparent}
#smriti-start .row{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;align-items:center}
#smriti-start .chip{border:1px solid #7a5532;background:transparent;color:#F7EEDC;border-radius:999px;padding:6px 12px;font:inherit;cursor:pointer}
#smriti-start .chip[aria-pressed=true]{background:#E3A21A;color:#24160c;border-color:#E3A21A}
#smriti-start .go{margin-left:auto;border:0;border-radius:12px;background:#E3A21A;color:#24160c;font-weight:700;padding:10px 16px;font:inherit;cursor:pointer}
#smriti-start .go:disabled{opacity:.5;cursor:default}
#smriti-start .back{display:flex;gap:12px;align-items:center;margin:0 0 14px;padding:12px 14px;border-radius:14px;background:#3a2616;border:1px solid #8a5f33}
#smriti-start .back b{color:#F3C35B}
#smriti-start .back small{display:block;color:#CDBB9E}
#smriti-start .back button{margin-left:auto;flex:none}
#smriti-start .prefs{display:flex;flex-wrap:wrap;gap:14px;margin-top:10px;font-size:13px;color:#CDBB9E}
#smriti-start .prefs label{display:flex;gap:6px;align-items:center;cursor:pointer}
#smriti-start .prefs label[hidden]{display:none}
#smriti-start .prefs input{accent-color:#E3A21A;width:16px;height:16px}
#smriti-start .status{margin-top:8px;min-height:20px;color:#CDBB9E;font-size:13px}
`;

const SITE = 'smrithi-eight.vercel.app';
const NO_HEADSET = `Smriti is a VR experience. Open ${SITE} in the browser on a Meta Quest to step inside.`;

/**
 * Mounted before the 3D world finishes loading, so the page is never blank.
 * ready() is called once the world exists; until then, Enter explains it is loading.
 */
export function mountTopicOverlay(): {
  ready(world: World): void;
  dispose(): void;
} {
  let world: World | null = null;
  let vrOK = false;
  /** Returns true if the session was started; otherwise explains why not in the status line. */
  const tryEnter = (ownRoom: boolean): boolean => {
    if (!world) {
      status.textContent = 'Still getting the room ready, one moment...';
      return false;
    }
    if (!vrOK || !world.xrEnabled) {
      status.textContent = NO_HEADSET;
      return false;
    }
    world.launchXR({ sessionMode: ownRoom ? SessionMode.ImmersiveAR : SessionMode.ImmersiveVR });
    return true;
  };
  const style = document.createElement('style');
  style.textContent = CSS;
  const root = document.createElement('section');
  root.id = 'smriti-start';
  root.setAttribute('aria-label', 'Start Smriti');
  root.innerHTML = `
    <div class="eyebrow">SMRITI · A MEMORY PALACE THAT BUILDS ITSELF</div>
    <h2>What do you want to remember?</h2>
    <textarea maxlength="1500" placeholder="A topic, or paste your notes. For example: the causes of World War 1"></textarea>
    <div class="row" role="group" aria-label="Ready decks">
      <span style="color:#CDBB9E;font-size:13px">Or try:</span>
    </div>
    <div class="row"><span class="status" aria-live="polite"></span><button class="go main" type="button">Build my palace</button></div>
    <div class="prefs" role="group" aria-label="Comfort">
      <label><input type="checkbox" data-pref="largeText">Larger captions</label>
      <label><input type="checkbox" data-pref="calm">Calm motion</label>
      <label><input type="checkbox" data-pref="sound">Sounds</label>
      <label class="own" hidden><input type="checkbox" data-pref="ownRoom">Use my own room (passthrough)</label>
    </div>`;
  let arOK = false;
  void navigator.xr?.isSessionSupported('immersive-ar').then((ok) => {
    arOK = ok;
    (root.querySelector('.own') as HTMLElement).hidden = !ok;
  }).catch(() => {});
  for (const box of root.querySelectorAll<HTMLInputElement>('input[data-pref]')) {
    const key = box.dataset.pref as keyof Settings;
    box.checked = settings[key];
    box.addEventListener('change', () => {
      settings[key] = box.checked;
      saveSettings();
    });
  }
  const saved = loadPalace();
  if (saved) {
    const back = document.createElement('div');
    back.className = 'back';
    const streak = saved.streak > 0 ? ` · ${saved.streak}-day streak` : '';
    back.innerHTML = `<div><b>Welcome back.</b> Your palace is waiting.<small></small></div><button class="go" type="button">Review my palace</button>`;
    const where = saved.room === 'own' ? ' · in your own room' : '';
    back.querySelector('small')!.textContent = `${saved.deck.title}${where} · ${nextReviewText(saved)}${streak}`;
    back.querySelector('button')!.addEventListener('click', () => {
      startReview(saved);
      tryEnter(saved.room === 'own' && arOK);
    });
    root.insertBefore(back, root.querySelector('h2'));
  }
  const text = root.querySelector('textarea')!;
  const chipsRow = root.querySelectorAll('.row')[0] as HTMLElement;
  const go = root.querySelector('.go.main') as HTMLButtonElement;
  const status = root.querySelector('.status') as HTMLElement;
  let preset = PRESET_DECKS[0];
  const chips = PRESET_DECKS.map((d) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = d.title.replace(' of transactions', '').replace(', in order from the Sun', '');
    b.addEventListener('click', () => {
      preset = d;
      text.value = '';
      refresh();
    });
    chipsRow.appendChild(b);
    return { b, d };
  });
  const refresh = () => {
    const typed = text.value.trim().length >= 3;
    for (const c of chips) c.b.setAttribute('aria-pressed', String(!typed && c.d === preset));
    go.textContent = typed ? 'Build my palace' : 'Enter Smriti';

  };
  text.addEventListener('input', refresh);
  go.addEventListener('click', () => {
    const typed = text.value.trim();
    if (typed.length >= 3) void buildFromTopic(typed);
    else usePreset(preset);
    tryEnter(settings.ownRoom && arOK);
  });
  // Live progress while the agent builds (also useful if the person is still in 2D).
  let seen = -1;
  const timer = window.setInterval(() => {
    if (deckSource.version === seen || !deckSource.topic) return;
    seen = deckSource.version;
    const made = deckSource.steps.filter((st) => st.ok && st.tool === 'create_image').length;
    if (deckSource.status === 'building') status.textContent = made ? `Smriti is imagining... ${made} images so far` : 'Smriti is choosing what to remember...';
    else if (deckSource.status === 'ready')
      status.textContent = `Ready: ${deckSource.deck.cards.length} memories for "${deckSource.deck.title}".${vrOK ? '' : ' Open this link on a Meta Quest to place them.'}`;
    else status.textContent = `Could not build it: ${deckSource.error}`;
  }, 300);
  refresh();
  document.head.appendChild(style);
  document.body.appendChild(root);
  status.textContent = 'Getting the room ready...';
  void navigator.xr
    ?.isSessionSupported('immersive-vr')
    .then((ok) => (vrOK = ok))
    .catch(() => (vrOK = false));
  return {
    ready(w: World) {
      world = w;
      if (status.textContent === 'Getting the room ready...') status.textContent = '';
      w.visibilityState.subscribe((state) => {
        root.style.display = state === VisibilityState.NonImmersive ? '' : 'none';
      });
    },
    dispose() {
      window.clearInterval(timer);
      root.remove();
      style.remove();
    },
  };
}

