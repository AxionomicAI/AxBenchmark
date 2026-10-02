// Wireframe theme: grayscale plus one accent, named after Textual theme variables.
// Every color in the frames comes from these CSS variables; the canvas Tweaks switch dark/light and the accent.
import { CELL } from './lib.mjs';

export const FONT_LINK = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,700;1,400&amp;display=swap">';
export const MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace";

// Textual variable → wireframe CSS variable, per theme. $success/$warning/$error stay grayscale here:
// meaning is carried by glyph and text style until theming.
export const TOKENS = [
  ['$background', '--bg', '#141414', '#fafaf9', 'Screen background, DataTable rows, TextArea'],
  ['$surface', '--sf', '#1f1f1f', '#efefed', 'Inputs, status bars (#env-bar, #identity-bar), dialogs'],
  ['$panel', '--pn', '#2b2b2b', '#e1e1df', 'Header, Footer, DataTable header, toasts'],
  ['$foreground', '--fg', '#e6e6e6', '#1b1b1b', 'Text; reverse-video focus on buttons'],
  ['$foreground 60%', '--mu', '#9b9b9b', '#5f5f5f', 'Muted text: hints, labels, secondary values'],
  ['$foreground 30%', '--ln', '#5c5c5c', '#a2a2a0', 'Idle borders and rules'],
  ['$primary', '--ac', 'accent', 'accent', 'Focus border, table/tree cursor, footer keys, primary button'],
  ['$accent', '--ac', 'accent', 'accent', 'Same hue as $primary in low fidelity'],
  ['$success', '--fg', '✓ glyph', '✓ glyph', 'Grayscale here; identified by ✓ and wording'],
  ['$warning', '--fg', '▲ glyph', '▲ glyph', 'Grayscale here; identified by ▲ and bold'],
  ['$error', '--fg', '✗ glyph', '✗ glyph', 'Grayscale here; identified by ✗ and bold'],
];

const vars = (i) => TOKENS.filter((t) => t[2].startsWith('#')).map((t) => `${t[1]}:${t[i]}`).join(';');

export const CSS = `
body{margin:0}
.t-dark{${vars(2)};--bs:#454545;--on:#121212;--chrome:#0c0c0c;--paper:#181818;--ink2:#c8c8c8}
.t-light{${vars(3)};--bs:#c9c9c7;--on:#121212;--chrome:#e4e4e2;--paper:#f6f6f4;--ink2:#333}
.ax{box-sizing:border-box;background:var(--chrome);color:var(--fg);font-family:${MONO};font-variant-ligatures:none;-webkit-font-smoothing:antialiased}
.ax *{box-sizing:border-box}
.ax a{color:var(--ac)}
.t-light.ax a,.t-light .ax a{color:color-mix(in srgb,var(--ac) 50%,#000)}
.ax button:focus-visible,.ax a:focus-visible{outline:2px solid var(--ac);outline-offset:2px}
.term{position:relative;flex-shrink:0;font-family:${MONO};font-size:${CELL.font}px;line-height:${CELL.h}px;background:var(--bg);color:var(--fg);outline:1px solid var(--ln);font-variant-ligatures:none}
.term .r{height:${CELL.h}px;white-space:pre;overflow:hidden}
.term span,.term a,.term button{font:inherit;line-height:inherit}
.term a,.term button{color:inherit;text-decoration:none;border:0;padding:0;margin:0;background:transparent;cursor:pointer;white-space:pre;vertical-align:top}
.term .k:hover{text-decoration:underline}
.term .B0{background:var(--bg)}.term .B1{background:var(--sf)}.term .B2{background:var(--pn)}.term .BS{background:var(--bs)}
.term .BA{background:var(--ac);color:var(--on)}.term .BT{background:color-mix(in srgb,var(--ac) 24%,var(--bg))}
.term .mu{color:var(--mu)}.term .ln{color:var(--ln)}.term .ac{color:var(--ac)}.term .on{color:var(--on)}
.t-light .term .ac{color:color-mix(in srgb,var(--ac) 55%,#000)}
.term .bd{font-weight:700}.term .dm{opacity:.55}.term .it{font-style:italic}.term .ul{text-decoration:underline}
.term .rv{background:var(--fg);color:var(--bg)}
.term .xd{opacity:.32}
.ov{position:absolute;outline:1px dashed var(--ac);outline-offset:-1px;pointer-events:none}
.ov span{position:absolute;left:0;top:-13px;font-size:10px;line-height:12px;white-space:nowrap;background:var(--ac);color:var(--on);padding:0 3px}
.cap{font-size:12px;line-height:18px;color:var(--mu)}.cap b{color:var(--fg)}
.ctl{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:12px;color:var(--mu)}
.ctl b{color:var(--fg)}
.kb{font:inherit;font-size:12px;min-height:28px;padding:4px 10px;border:1px solid var(--ln);background:var(--paper);color:var(--fg);cursor:pointer}
.kb:hover{border-color:var(--ac)}
.rel{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12px;color:var(--mu)}
.lg{font-size:12px;line-height:17px;color:var(--fg)}
.lg h3{margin:18px 0 6px;font-size:11px;line-height:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--mu)}
.lg h3:first-of-type{margin-top:12px}
.lg pre{margin:0;padding:8px 10px;font:inherit;font-size:11.5px;line-height:16px;white-space:pre;background:var(--paper);outline:1px solid var(--ln);outline-offset:-1px;overflow:hidden}
.lg table{width:100%;border-collapse:collapse}
.lg td{padding:3px 8px 3px 0;vertical-align:top;border-top:1px solid color-mix(in srgb,var(--ln) 45%,transparent)}
.lg td:first-child{white-space:nowrap}
.lg code{color:var(--ac);font:inherit}
.t-light .lg code{color:color-mix(in srgb,var(--ac) 50%,#000)}
.lg kbd{font:inherit;font-weight:700;color:var(--ac)}
.t-light .lg kbd{color:color-mix(in srgb,var(--ac) 50%,#000)}
.lg .mut{color:var(--mu)}
.lg ul,.lg ol{margin:0;padding-left:18px}.lg li{margin:2px 0}
.lg-h{display:flex;flex-direction:column;gap:2px;padding-bottom:10px;border-bottom:1px solid var(--ln)}
.lg-h b{font-size:15px;line-height:20px}
.sec{display:flex;flex-direction:column;gap:10px}
.sec h2{margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--mu)}
.sw{width:28px;height:28px;flex-shrink:0;outline:1px solid var(--ln);outline-offset:-1px}
.node{display:flex;flex-direction:column;gap:2px;min-width:170px;padding:8px 10px;border:1px solid var(--ln);background:var(--paper);color:var(--fg);text-decoration:none;font-size:12px;line-height:16px}
.node b{font-size:13px}
.node:hover{border-color:var(--ac)}
.node.ghost{border-style:dashed;color:var(--mu);background:transparent}
.edge{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:70px;font-size:11px;line-height:14px;color:var(--mu);text-align:center}
.edge i{font-style:normal;color:var(--ln);font-size:13px}
`;
