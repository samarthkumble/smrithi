/**
 * The start screen (2D only), over the live room. Type what you want to remember
 * or pick a ready palace, then enter in VR, or preview with a mouse on a computer.
 * Typing happens here because the headset keyboard works in 2D pages.
 */
import { SessionMode, VisibilityState, type World } from '@iwsdk/core';
import { type AgentStep, buildFromTopic, deckSource, startReview, usePreset } from './deck-source.js';
import { type Deck, PRESET_DECKS } from './decks.js';
import { LOCI } from './palace-layout.js';
import { loadPalace, nextReviewText } from './palace-store.js';
import { preview } from './preview.js';
import { saveSettings, settings, type Settings } from './settings.js';
import { downloadCalendarFile, googleCalendarLink, sharedDeckFromUrl, sharePalace } from './share.js';
import { START_CSS } from './start-screen-css.js';

const SITE = 'smrithi-eight.vercel.app';

const ICON = {
  headset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5A2.5 2.5 0 0 1 5.5 7h13A2.5 2.5 0 0 1 21 9.5v5a2.5 2.5 0 0 1-2.5 2.5h-3.1a2 2 0 0 1-1.7-.95l-.9-1.5a1 1 0 0 0-1.7 0l-.9 1.5a2 2 0 0 1-1.7.95H5.5A2.5 2.5 0 0 1 3 14.5z"/></svg>',
  hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5v-6a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V12m0-2.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.8-2.4L4.6 15.4a1.6 1.6 0 0 1 2.4-2.1L8 14.3"/></svg>',
  mouse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="6" y="3" width="12" height="18" rx="6"/><path d="M12 7v4"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3c1.5 3.2 5 5.4 5 9.5a5 5 0 0 1-10 0c0-2.2 1.2-3.6 2.4-4.6.2 1.6 1 2.6 2.1 3.1C11 8.7 11.2 5.6 12 3z"/><path d="M5 21h14" /></svg>',
  ok: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg>',
  fix: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0 1 13.7-5.6L20 9M20 4v5h-5M20 12a8 8 0 0 1-13.7 5.6L4 15M4 20v-5h5"/></svg>',
  wait: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 3a9 9 0 1 1-9 9"/></svg>',
};

/** Small line drawings for the ready palaces. */
const DECK_ICON: Record<string, string> = {
  'oop-pillars': '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M16 4l9 6v12l-9 6-9-6V10z"/><path d="M7 10l9 6 9-6M16 16v12"/></svg>',
  acid: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="14" width="18" height="13" rx="2.5"/><path d="M11 14V10a5 5 0 0 1 10 0v4M16 19v3"/></svg>',
  planets: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="16" cy="16" r="7"/><ellipse cx="16" cy="16" rx="14" ry="4.5" transform="rotate(-20 16 16)"/></svg>',
  osi: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 9l11-5 11 5-11 5zM5 16l11 5 11-5M5 23l11 5 11-5"/></svg>',
  mughals: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6 27h20M8 27V15a8 8 0 0 1 16 0v12M16 3v4M13 27v-6a3 3 0 0 1 6 0v6"/></svg>',
  'fundamental-rights': '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 5v22M8 27h16M6 11h20M6 11l-3 8h6zM26 11l-3 8h6z"/></svg>',
  elements: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="6" width="20" height="20" rx="3"/><path d="M12 12v8M12 16h6M18 12v8" stroke-linecap="round"/></svg>',
  newton: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="16" cy="18" r="8"/><path d="M16 10c0-3 2-5 5-5M16 10c-1-2-3-3-5-3"/></svg>',
  spanish: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 7h22v14H14l-6 5v-5H5z"/><path d="M11 14h10" stroke-linecap="round"/></svg>',
};

const SHORT: Record<string, string> = {
  'oop-pillars': '4 pillars of OOP',
  osi: 'OSI model layers',
  planets: 'The planets',
  acid: 'ACID properties',
  mughals: 'Mughal emperors',
  'fundamental-rights': 'Fundamental Rights',
  elements: 'First 8 elements',
  newton: "Newton's laws",
  spanish: 'Spanish greetings',
};

const shortTitle = (d: Deck) => SHORT[d.id] ?? d.title;
const words = (id: string) => id.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/TV/, ' TV').toLowerCase().replace(/ tv/, ' TV').trim();
const spotName = (id: string) => LOCI.find((l) => l.id === id)?.label ?? id;

/** Turn one checked tool call into a line a person can read. */
function stepLine(st: AgentStep): { cls: string; html: string } {
  const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string);
  if (!st.ok) return { cls: 'fix', html: `Sent back to fix: ${esc(st.note)}` };
  if (st.tool === 'plan_palace') return { cls: 'ok', html: `Chose <b>${esc(st.note.replace(' facts planned', ''))}</b> things worth remembering` };
  if (st.tool === 'finish_palace') return { cls: 'ok', html: '<b>Palace ready</b>' };
  const m = st.note.match(/^(.+) -> (\w+) on (\w+)$/);
  if (m) return { cls: 'ok', html: `<b>${esc(m[1])}</b>: a ${esc(words(m[2]))} on ${esc(spotName(m[3]))}` };
  return { cls: 'ok', html: esc(st.note) };
}

const PREFS: { key: keyof Settings; label: string; note: string }[] = [
  { key: 'largeText', label: 'Larger captions', note: "Smriti's words, about a third bigger" },
  { key: 'calm', label: 'Calm motion', note: 'Nothing spins, bounces or drifts' },
  { key: 'voice', label: "Smriti's voice", note: 'She reads every caption aloud' },
  { key: 'sound', label: 'Sounds', note: 'Chimes and a soft tanpura drone' },
  { key: 'ownRoom', label: 'Use my own room', note: 'Passthrough: leave memories around your real room' },
];

/**
 * Mounted before the 3D world finishes loading, so the page is never blank.
 * ready() is called once the world exists; until then, Enter explains it is loading.
 */
export function mountTopicOverlay(): { ready(world: World): void; dispose(): void } {
  let world: World | null = null;
  let vrOK = false;
  let arOK = false;
  let preset: Deck = deckSource.deck;
  /** A headset session or preview has started in this page load. */
  let entered = false;

  const style = document.createElement('style');
  style.textContent = START_CSS;
  const root = document.createElement('div');
  root.id = 'smriti-start';
  root.innerHTML = `
    <div class="scrim"></div>
    <header class="top">
      <div class="mark" aria-label="Smriti"><span class="dev" lang="sa">स्मृति</span><span class="lat">Smriti</span></div>
      <div style="display:flex;gap:10px;align-items:center">
        <div class="badge">${ICON.hand}<span>Made for Meta Quest, played with your hands</span></div>
        <div class="gear">
          <button type="button" aria-expanded="false" aria-controls="smr-prefs">${ICON.gear}<span>Comfort</span></button>
          <div class="prefs" id="smr-prefs" role="group" aria-label="Comfort settings" hidden></div>
        </div>
      </div>
    </header>
    <main class="panel">
      <h1>A memory palace that builds itself.</h1>
      <p class="lede">Tell Smriti what you need to remember. Each idea becomes a vivid picture that you place around a Mangalore home with your own hands, then Smriti tests you. <button type="button" class="howlink">See how it works</button></p>
      <form class="composer" novalidate>
        <label for="smr-topic">What do you want to remember?</label>
        <textarea id="smr-topic" maxlength="1500" placeholder="A topic, or paste your notes. Try: the causes of World War 1"></textarea>
        <div class="row"><span class="count"></span><button class="btn-brass build" type="submit">Build my palace</button></div>
      </form>
      <ol class="log" aria-live="polite" hidden></ol>
      <h2>Or start with a ready palace</h2>
      <div class="decks" role="group" aria-label="Ready palaces"></div>
      <div class="cta">
        <button class="btn-brass enter" type="button">${ICON.headset}<span>Enter in VR</span></button>
        <button class="btn-line preview" type="button" hidden>${ICON.mouse}<span>Preview on this computer</span></button>
      </div>
      <p class="status" aria-live="polite"></p>
      <button class="btn-line share-now" type="button" hidden>Share this palace</button>
    </main>
    <ol class="how" aria-label="How it works" title="See how it works">
      <li><i>1</i><span><b>Type it</b>Smriti picks the ideas and imagines a picture for each</span></li>
      <li><i>2</i><span><b>Place it</b>Carry each picture to a spot in the room</span></li>
      <li><i>3</i><span><b>Remember it</b>Smriti hides them and walks you back through</span></li>
    </ol>`;
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector(sel) as T;
  const text = $<HTMLTextAreaElement>('textarea');
  const count = $<HTMLElement>('.count');
  const log = $<HTMLOListElement>('.log');
  const status = $<HTMLElement>('.status');
  const enterBtn = $<HTMLButtonElement>('.enter');
  const previewBtn = $<HTMLButtonElement>('.preview');
  const prefsBtn = $<HTMLButtonElement>('.gear > button');
  const prefsBox = $<HTMLElement>('.prefs');
  const shareNow = $<HTMLButtonElement>('.share-now');
  shareNow.addEventListener('click', async () => {
    const r = await sharePalace(deckSource.deck);
    status.textContent = r === 'copied' ? 'Link copied. Anyone who opens it gets this exact palace.' : r === 'shared' ? 'Shared.' : status.textContent;
  });

  // Ready palaces
  const deckButtons = PRESET_DECKS.map((d) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'deck';
    b.innerHTML = `${DECK_ICON[d.id] ?? ''}<span><span class="t">${shortTitle(d)}</span><br><span class="n">${d.cards.length} memories</span></span>`;
    b.addEventListener('click', () => {
      preset = d;
      text.value = '';
      usePreset(d);
      log.hidden = true;
      status.textContent = '';
      refresh();
    });
    $<HTMLElement>('.decks').appendChild(b);
    return { b, d };
  });
  // Three ready palaces at a glance; the rest one tap away.
  const moreBtn = document.createElement('button');
  moreBtn.type = 'button';
  moreBtn.className = 'more';
  const extra = deckButtons.slice(3);
  const setMore = (open: boolean) => {
    for (const x of extra) x.b.hidden = !open;
    moreBtn.textContent = open ? 'Fewer palaces' : `More palaces (${extra.length})`;
    moreBtn.setAttribute('aria-expanded', String(open));
  };
  moreBtn.addEventListener('click', () => setMore(moreBtn.getAttribute('aria-expanded') !== 'true'));
  if (extra.length) {
    setMore(false);
    $<HTMLElement>('.decks').after(moreBtn);
  }

  // Comfort switches
  for (const p of PREFS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sw';
    b.setAttribute('role', 'switch');
    b.dataset.pref = p.key;
    b.innerHTML = `<span>${p.label}<small>${p.note}</small></span><span class="knob" aria-hidden="true"></span>`;
    b.setAttribute('aria-checked', String(settings[p.key]));
    if (p.key === 'ownRoom') b.hidden = true;
    b.addEventListener('click', () => {
      settings[p.key] = !settings[p.key];
      b.setAttribute('aria-checked', String(settings[p.key]));
      saveSettings();
      // A session already ran in this page in the other mode: start clean so the room matches.
      if (p.key === 'ownRoom' && entered) location.reload();
    });
    prefsBox.appendChild(b);
  }
  prefsBtn.addEventListener('click', () => {
    const open = prefsBox.hidden;
    prefsBox.hidden = !open;
    prefsBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    if (!prefsBox.hidden && !(e.target as HTMLElement).closest?.('.gear')) {
      prefsBox.hidden = true;
      prefsBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Coming back: the saved palace goes first.
  const saved = loadPalace();
  if (saved) {
    const back = document.createElement('section');
    back.className = 'back';
    back.setAttribute('aria-label', 'Your saved palace');
    const streak = saved.streak > 0 ? `${saved.streak}-day streak. ` : '';
    const where = saved.room === 'own' ? ' (in your own room)' : '';
    back.innerHTML = `<span class="flame">${ICON.flame}</span><div class="txt"><b>Welcome back. Your palace is waiting.</b><span></span></div><button class="btn-brass" type="button">Review my palace</button>`;
    back.querySelector('.txt span')!.textContent = `${saved.deck.title}${where}. ${streak}${nextReviewText(saved)}.`;
    back.querySelector('button')!.addEventListener('click', () => {
      startReview(saved);
      enter(saved.room === 'own' && arOK, true);
    });
    const actions = document.createElement('div');
    actions.className = 'back-actions';
    const cal = document.createElement('a');
    cal.href = googleCalendarLink(saved.deck.title, saved.nextReviewAt);
    cal.target = '_blank';
    cal.rel = 'noopener';
    cal.textContent = 'Remind me in Google Calendar';
    const ics = document.createElement('button');
    ics.type = 'button';
    ics.textContent = 'Download a calendar reminder';
    ics.addEventListener('click', () => downloadCalendarFile(saved.deck.title, saved.nextReviewAt));
    const share = document.createElement('button');
    share.type = 'button';
    share.textContent = 'Share this palace';
    share.addEventListener('click', async () => {
      const r = await sharePalace(saved.deck);
      status.textContent = r === 'copied' ? 'Link copied. Send it to a friend to give them the same palace.' : r === 'shared' ? 'Shared.' : '';
    });
    actions.append(cal, ics, share);
    const panel = $<HTMLElement>('.panel');
    panel.insertBefore(back, $<HTMLElement>('h1'));
    panel.insertBefore(actions, $<HTMLElement>('h1'));
  }

  // A friend's palace in the link: offer it first.
  const shared = sharedDeckFromUrl();
  if (shared) {
    usePreset(shared);
    preset = shared;
    const gift = document.createElement('section');
    gift.className = 'back gift';
    gift.setAttribute('aria-label', 'A palace shared with you');
    gift.innerHTML = `<span class="flame">${DECK_ICON.planets}</span><div class="txt"><b>A friend shared a palace with you.</b><span></span></div>`;
    gift.querySelector('.txt span')!.textContent = `${shared.title}: ${shared.cards.length} memories, ready to place. Press Enter in VR, or preview it below.`;
    $<HTMLElement>('.panel').insertBefore(gift, $<HTMLElement>('h1'));
  }

  // First-visit guide: four real screenshots, one per step.
  const base = import.meta.env.BASE_URL;
  const guide = document.createElement('div');
  guide.id = 'smriti-guide';
  guide.hidden = true;
  guide.setAttribute('role', 'dialog');
  guide.setAttribute('aria-modal', 'true');
  guide.setAttribute('aria-labelledby', 'smr-guide-title');
  guide.innerHTML = `
    <div class="sheet">
      <button class="x" type="button" aria-label="Close">×</button>
      <h2 id="smr-guide-title">How Smriti works</h2>
      <p class="sub">Smriti turns what you study into a memory palace: strange pictures placed around a room, so you can walk back through them and remember. It takes about ten minutes.</p>
      <ol>
        <li><img src="${base}howto/1-type.jpg" alt="The start screen with a topic typed and Smriti's steps listed below it"><div><i>1</i><b>Tell Smriti what to learn</b><span>Type a topic or paste your notes, or pick a ready palace. Smriti's AI picks the ideas worth remembering.</span></div></li>
        <li><img src="${base}howto/2-pictures.jpg" alt="Twenty picture types: a rocket, a key, scales, a heart, a bridge and more"><div><i>2</i><b>Each idea becomes a picture</b><span>A vivid object stands for each idea: a capsule locked around a chest for Encapsulation, a red war shield for Mars.</span></div></li>
        <li><img src="${base}howto/3-place.jpg" alt="Inside the room, a burning pink heart placed on the swing, with Smriti's caption"><div><i>3</i><b>Place them around the room</b><span>In the headset, pinch a picture and carry it to a glowing spot: the swing, the bookshelf, the window. On a computer, drag it with the mouse.</span></div></li>
        <li><img src="${base}howto/4-test.jpg" alt="Three answer orbs, one marked with a tick and one with a cross"><div><i>4</i><b>Smriti tests you, then brings you back</b><span>The pictures vanish and one spot glows: pick what you left there. A miss comes back weirder, and Smriti asks again after 1, 3 and 7 days.</span></div></li>
      </ol>
      <p class="why">Memory champions use this method, the memory palace. In a 2018 University of Maryland study, people remembered 8.8% more with a memory palace in VR than on a regular screen.</p>
      <div class="foot"><button class="go" type="button">Got it, let's start</button></div>
    </div>`;
  let lastFocus: HTMLElement | null = null;
  const openGuide = () => {
    lastFocus = document.activeElement as HTMLElement | null;
    guide.hidden = false;
    const sheet = guide.querySelector('.sheet') as HTMLElement;
    sheet.scrollTop = 0;
    (guide.querySelector('.go') as HTMLButtonElement).focus({ preventScroll: true });
  };
  const closeGuide = () => {
    guide.hidden = true;
    try {
      localStorage.setItem('smriti.seenGuide', '1');
    } catch {
      /* ignore */
    }
    (lastFocus ?? text).focus?.();
  };
  guide.querySelector('.x')!.addEventListener('click', closeGuide);
  guide.querySelector('.go')!.addEventListener('click', closeGuide);
  guide.addEventListener('click', (e) => {
    if (e.target === guide) closeGuide();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !guide.hidden) closeGuide();
  });
  $<HTMLButtonElement>('.howlink').addEventListener('click', openGuide);
  $<HTMLElement>('.how').addEventListener('click', openGuide);

  const typedTopic = () => text.value.trim();
  const refresh = () => {
    const typed = typedTopic().length >= 3;
    for (const c of deckButtons) c.b.setAttribute('aria-pressed', String(!typed && c.d === preset));
    count.textContent = text.value.length > 1200 ? `${1500 - text.value.length} characters left` : '';
  };
  text.addEventListener('input', refresh);

  /** Enter the headset, or (on a computer) explain or start the mouse preview. */
  const enter = (ownRoom: boolean, allowPreview: boolean): void => {
    if (!world) {
      status.textContent = 'Still getting the room ready, one moment.';
      return;
    }
    if (vrOK && world.xrEnabled) {
      entered = true;
      world.launchXR({ sessionMode: ownRoom ? SessionMode.ImmersiveAR : SessionMode.ImmersiveVR });
      return;
    }
    if (allowPreview) startPreviewMode();
    else status.textContent = `No headset here. Open ${SITE} in a Meta Quest browser, or preview it with your mouse.`;
  };

  const startPreviewMode = () => {
    preview.active = true;
    root.style.display = 'none';
    hud.hidden = false;
  };

  // Building with the agent: each checked step appears as it happens.
  $<HTMLFormElement>('.composer').addEventListener('submit', (e) => {
    e.preventDefault();
    const topic = typedTopic();
    if (topic.length < 3) {
      status.textContent = 'Type a topic first, or pick a ready palace below.';
      text.focus();
      return;
    }
    void buildFromTopic(topic);
    if (vrOK && world?.xrEnabled) enter(settings.ownRoom && arOK, false);
  });
  enterBtn.addEventListener('click', () => enter(settings.ownRoom && arOK, false));
  previewBtn.addEventListener('click', () => {
    if (!world) {
      status.textContent = 'Still getting the room ready, one moment.';
      return;
    }
    startPreviewMode();
  });

  let seen = -1;
  const timer = window.setInterval(() => {
    if (deckSource.version === seen || !deckSource.topic) return;
    seen = deckSource.version;
    log.hidden = false;
    const lines = deckSource.steps.map(stepLine);
    if (deckSource.status === 'building')
      lines.push({ cls: 'wait', html: lines.length ? 'Imagining the next picture...' : 'Reading your topic and choosing what matters...' });
    log.innerHTML = lines.map((l) => `<li class="${l.cls}">${ICON[l.cls as 'ok' | 'fix' | 'wait']}<span>${l.html}</span></li>`).join('');
    shareNow.hidden = deckSource.status !== 'ready';
    if (deckSource.status === 'ready') {
      status.textContent = vrOK
        ? `Your palace for "${deckSource.deck.title}" is ready.`
        : `Your palace for "${deckSource.deck.title}" is ready. Preview it here, or open ${SITE} on a Meta Quest.`;
    } else if (deckSource.status === 'error') {
      status.textContent = `Smriti could not build that palace: ${deckSource.error} Try again, or pick a ready one.`;
    } else status.textContent = '';
  }, 250);

  // Preview heads-up bar
  const hud = document.createElement('div');
  hud.id = 'smriti-hud';
  hud.hidden = true;
  hud.innerHTML = `<span><b>Preview on this computer.</b> Drag empty space to look around; drag pictures onto glowing rings. Arrow keys look too.</span><button type="button">Exit preview</button>`;
  hud.querySelector('button')!.addEventListener('click', () => location.reload());

  status.textContent = 'Getting the room ready...';
  void navigator.xr
    ?.isSessionSupported('immersive-vr')
    .then((ok) => {
      vrOK = ok;
      previewBtn.hidden = ok;
    })
    .catch(() => (previewBtn.hidden = false));
  if (!navigator.xr) previewBtn.hidden = false;
  void navigator.xr
    ?.isSessionSupported('immersive-ar')
    .then((ok) => {
      arOK = ok;
      ($<HTMLElement>('[data-pref="ownRoom"]')).hidden = !ok;
    })
    .catch(() => {});

  refresh();
  document.head.appendChild(style);
  document.body.appendChild(root);
  document.body.appendChild(hud);
  document.body.appendChild(guide);
  let seenGuide = false;
  try {
    seenGuide = localStorage.getItem('smriti.seenGuide') === '1';
  } catch {
    /* ignore */
  }
  if (!seenGuide && !saved) openGuide();
  document.getElementById('boot')?.remove();

  return {
    ready(w: World) {
      world = w;
      if (status.textContent === 'Getting the room ready...') status.textContent = '';
      w.visibilityState.subscribe((state) => {
        if (!preview.active) root.style.display = state === VisibilityState.NonImmersive ? '' : 'none';
      });
    },
    dispose() {
      window.clearInterval(timer);
      root.remove();
      hud.remove();
      guide.remove();
      style.remove();
    },
  };
}
