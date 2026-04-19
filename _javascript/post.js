import { basic, initTopbar, initSidebar } from './modules/layouts';

import {
  loadImg,
  imgPopup,
  initLikes,
  initLocaleDatetime,
  initClipboard,
  initToc,
  loadMermaid,
  highlightLines,
  runCpp,
  runJavascript,
  runPython,
  runRust
} from './modules/components';

loadImg();
initToc();
imgPopup();
initSidebar();
initLikes();
initLocaleDatetime();
initClipboard();
initTopbar();
loadMermaid();
basic();
highlightLines();
runCpp();
runJavascript();
runPython();
runRust();
