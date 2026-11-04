/** Styles for the start screen. Colours come from the room: teak, red oxide, brass, limewash, tulsi. */
export const START_CSS = `
#smriti-start{--teak:#1E1410;--teak-raise:#2B1D15;--teak-edge:#3D2A1E;--oxide:#9C3B2B;--brass:#D4A24C;--brass-hi:#F1C86F;
  --lime:#EFE6D6;--lime-dim:#BFAF98;--tulsi:#8DBB76;--line:rgba(212,162,76,.32);
  --serif:'Tiro Devanagari Sanskrit',Georgia,'Times New Roman',serif;--sans:'Hanken Grotesk',system-ui,'Segoe UI',sans-serif;
  position:fixed;inset:0;z-index:10;pointer-events:none;color:var(--lime);font:16px/1.5 var(--sans);-webkit-font-smoothing:antialiased}
#smriti-start *{box-sizing:border-box}
#smriti-start .scrim{position:absolute;inset:0;background:linear-gradient(90deg,rgba(24,15,10,.94) 0,rgba(24,15,10,.82) 34%,rgba(24,15,10,.25) 62%,rgba(24,15,10,0) 80%);animation:smr-dawn 1.6s ease-out both}
@keyframes smr-dawn{from{background-color:rgba(24,15,10,1)}to{background-color:rgba(24,15,10,0)}}
#smriti-start .top{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px clamp(16px,4vw,48px);pointer-events:auto}
#smriti-start .mark{display:flex;align-items:baseline;gap:10px;color:var(--lime)}
#smriti-start .mark .dev{font:400 34px/1 var(--serif);color:var(--brass-hi)}
#smriti-start .mark .lat{font:500 15px/1 var(--sans);color:var(--lime-dim);letter-spacing:.02em}
#smriti-start .badge{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--lime-dim);padding:7px 12px 7px 10px;border:1px solid var(--teak-edge);border-radius:999px;background:rgba(30,20,16,.6)}
#smriti-start .badge svg{width:18px;height:18px;color:var(--brass)}
#smriti-start .panel{position:absolute;left:clamp(16px,4vw,48px);top:84px;bottom:24px;width:min(520px,calc(100vw - 32px));display:flex;flex-direction:column;
  gap:16px;overflow-y:auto;padding:4px 4px 24px;pointer-events:auto;scrollbar-width:thin;animation:smr-rise .7s .25s cubic-bezier(.2,.7,.2,1) both}
@keyframes smr-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
#smriti-start h1{margin:6px 0 0;font:400 clamp(32px,min(4.2vw,6.6vh),56px)/1.06 var(--serif);letter-spacing:-.012em;color:var(--lime);max-width:16ch}
#smriti-start .lede{margin:-4px 0 0;color:var(--lime-dim);font-size:16px;line-height:1.55;max-width:48ch}
#smriti-start .composer{position:relative;display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:16px;background:var(--teak-raise);border:1px solid var(--line);
  box-shadow:0 18px 50px rgba(0,0,0,.35),inset 0 1px 0 rgba(241,200,111,.08);transition:border-color .2s,box-shadow .2s}
#smriti-start .composer:focus-within{border-color:var(--brass);box-shadow:0 18px 50px rgba(0,0,0,.35),0 0 0 4px rgba(212,162,76,.16)}
#smriti-start .composer label{font-weight:600;font-size:15px;color:var(--lime)}
#smriti-start textarea{width:100%;min-height:52px;max-height:180px;resize:vertical;border:0;outline:0;background:transparent;color:var(--lime);font:16px/1.5 var(--sans);padding:0}
#smriti-start textarea::placeholder{color:#8f7f6b}
#smriti-start .composer .row{display:flex;align-items:center;gap:10px}
#smriti-start .composer .count{font-size:12px;color:#8f7f6b;margin-right:auto}
#smriti-start button{font:inherit;cursor:pointer;border-radius:12px;transition:transform .12s,background .2s,border-color .2s,color .2s,opacity .2s}
#smriti-start button:active{transform:scale(.97)}
#smriti-start button:focus-visible,#smriti-start .deck:focus-visible{outline:3px solid var(--brass-hi);outline-offset:3px}
#smriti-start .btn-brass{border:0;padding:11px 18px;font-weight:700;color:#241509;background:linear-gradient(180deg,var(--brass-hi),var(--brass));box-shadow:0 6px 18px rgba(212,162,76,.25),inset 0 1px 0 rgba(255,255,255,.35)}
#smriti-start .btn-brass:hover{background:linear-gradient(180deg,#F7D58A,#DDB05C)}
#smriti-start .btn-brass:disabled{opacity:.45;cursor:default;transform:none}
#smriti-start .btn-line{border:1px solid var(--line);padding:11px 18px;font-weight:600;color:var(--lime);background:rgba(30,20,16,.55)}
#smriti-start .btn-line:hover{border-color:var(--brass);color:var(--brass-hi)}
#smriti-start .log{list-style:none;margin:-6px 0 0;padding:12px 14px;border-left:2px solid var(--brass);background:rgba(30,20,16,.6);border-radius:0 12px 12px 0;font-size:14px;display:flex;flex-direction:column;gap:6px}
#smriti-start .log[hidden]{display:none}
#smriti-start .log li{display:flex;gap:9px;align-items:flex-start;color:var(--lime-dim);animation:smr-step .35s ease-out both}
#smriti-start .log li b{color:var(--lime);font-weight:600}
#smriti-start .log li .ic{flex:none;width:18px;height:18px;margin-top:2px}
#smriti-start .log li.ok .ic{color:var(--tulsi)}
#smriti-start .log li.fix .ic{color:var(--brass-hi)}
#smriti-start .log li.wait .ic{color:var(--brass);animation:smr-spin 1.1s linear infinite}
@keyframes smr-step{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:none}}
@keyframes smr-spin{to{transform:rotate(360deg)}}
#smriti-start h2{margin:6px 0 -4px;font:600 15px/1.3 var(--sans);color:var(--lime)}
#smriti-start .decks{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
#smriti-start .deck{display:flex;flex-direction:row;align-items:center;gap:10px;text-align:left;padding:10px 12px;border:1px solid var(--teak-edge);background:rgba(30,20,16,.72);color:var(--lime);border-radius:14px}
#smriti-start .deck svg{flex:none;width:26px;height:26px;color:var(--brass)}
#smriti-start .deck .t{font-weight:600;font-size:14px;line-height:1.3}
#smriti-start .deck .n{font-size:12px;color:var(--lime-dim)}
#smriti-start .deck:hover{border-color:var(--line)}
#smriti-start .deck[aria-pressed=true]{border-color:var(--brass);background:linear-gradient(180deg,rgba(212,162,76,.16),rgba(30,20,16,.72))}
#smriti-start .cta{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
#smriti-start .cta .btn-brass,#smriti-start .cta .btn-line{padding:14px 22px;font-size:16px;display:inline-flex;align-items:center;gap:10px}
#smriti-start .cta svg{width:20px;height:20px}
#smriti-start .status{margin:-6px 0 0;min-height:22px;font-size:14px;color:var(--lime-dim)}
#smriti-start .back{display:flex;gap:14px;align-items:center;padding:14px 16px;border-radius:16px;background:linear-gradient(120deg,rgba(156,59,43,.55),rgba(43,29,21,.9));border:1px solid rgba(241,200,111,.35)}
#smriti-start .back .flame{flex:none;width:34px;height:34px;color:var(--brass-hi)}
#smriti-start .back .txt{flex:1;min-width:0}
#smriti-start .back .txt b{display:block;font-weight:700;color:var(--lime)}
#smriti-start .back .txt span{font-size:13px;color:var(--lime-dim)}
#smriti-start .how{position:absolute;right:clamp(16px,4vw,48px);bottom:28px;margin:0;padding:0;list-style:none;display:flex;gap:10px;pointer-events:auto}
#smriti-start .how li{display:flex;gap:10px;align-items:center;padding:10px 14px;border-radius:14px;background:rgba(24,15,10,.72);border:1px solid var(--teak-edge);font-size:13px;color:var(--lime-dim);max-width:200px}
#smriti-start .how li i{font:400 22px/1 var(--serif);font-style:normal;color:var(--brass-hi)}
#smriti-start .how li b{display:block;color:var(--lime);font-weight:600;font-size:14px}
#smriti-start .gear{position:relative}
#smriti-start .gear>button{display:flex;align-items:center;gap:8px;border:1px solid var(--teak-edge);background:rgba(30,20,16,.6);color:var(--lime-dim);padding:7px 12px;font-size:13px;border-radius:999px}
#smriti-start .gear>button svg{width:16px;height:16px}
#smriti-start .gear>button[aria-expanded=true]{color:var(--brass-hi);border-color:var(--brass)}
#smriti-start .prefs{position:absolute;right:0;top:calc(100% + 8px);width:290px;padding:8px;border-radius:14px;background:var(--teak-raise);border:1px solid var(--line);box-shadow:0 20px 50px rgba(0,0,0,.45)}
#smriti-start .prefs[hidden]{display:none}
#smriti-start .sw{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:10px;border:0;background:transparent;color:var(--lime);font-size:14px;text-align:left;border-radius:10px}
#smriti-start .sw:hover{background:rgba(212,162,76,.08)}
#smriti-start .sw[hidden]{display:none}
#smriti-start .sw small{display:block;color:var(--lime-dim);font-size:12px}
#smriti-start .sw .knob{flex:none;width:38px;height:22px;border-radius:999px;background:#4a3527;position:relative;transition:background .2s}
#smriti-start .sw .knob::after{content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:var(--lime-dim);transition:transform .2s,background .2s}
#smriti-start .sw[aria-checked=true] .knob{background:var(--brass)}
#smriti-start .sw[aria-checked=true] .knob::after{transform:translateX(16px);background:#241509}
#smriti-hud{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:11;display:flex;align-items:center;gap:14px;max-width:calc(100vw - 32px);
  padding:10px 10px 10px 18px;border-radius:999px;background:rgba(30,20,16,.88);border:1px solid rgba(212,162,76,.32);color:#EFE6D6;font:14px/1.35 'Hanken Grotesk',system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.4)}
#smriti-hud[hidden]{display:none}
#smriti-hud b{color:#F1C86F;font-weight:700}
#smriti-hud button{flex:none;font:600 13px/1 'Hanken Grotesk',system-ui,sans-serif;border:1px solid rgba(212,162,76,.4);background:transparent;color:#EFE6D6;padding:9px 14px;border-radius:999px;cursor:pointer}
#smriti-hud button:hover{border-color:#F1C86F;color:#F1C86F}
@media (max-width:860px){
  #smriti-start .scrim{background:linear-gradient(0deg,rgba(24,15,10,.96) 0,rgba(24,15,10,.85) 55%,rgba(24,15,10,.35) 100%)}
  #smriti-start .badge span{display:none}
  #smriti-start .panel{top:76px;bottom:0}
  #smriti-start .how{display:none}
  #smriti-start .decks{grid-template-columns:1fr}
  #smriti-start .panel{padding-bottom:0}
  #smriti-start .cta{position:sticky;bottom:0;margin:0 -4px;padding:12px 4px 16px;background:linear-gradient(0deg,rgba(24,15,10,1) 70%,rgba(24,15,10,0))}
}
@media (max-width:520px){#smriti-start .cta .btn-brass,#smriti-start .cta .btn-line{flex:1;justify-content:center;padding:13px 14px}}
@media (prefers-reduced-motion:reduce){#smriti-start *,#smriti-start .scrim,#smriti-start .panel{animation:none!important;transition:none!important}}
`;
