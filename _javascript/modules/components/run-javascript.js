/*
 * Run JavaScript code locally.
 */

"use strict";

const btnSelector = '.code-header button.button-run-javascript';

const LOCK = 'lock';
const COMPLETE = 'data-run-complete';
const TIMEOUT = 20000; // in milliseconds

/**
 * @param {HTMLButtonElement} node 
 */
function isLocked(node) {
  if (node.hasAttribute(LOCK)) {
    let timeout = node.getAttribute(LOCK);
    if (Number(timeout) + 5000 > Date.now()) {
      return true;
    }
  }
  return false;
}

/**
 * @param {HTMLButtonElement} node
 */
function isComplete(node) {
  return node.hasAttribute(COMPLETE);
}

/**
 * @param {HTMLButtonElement} node 
 */
function lock(node) {
  node.setAttribute(LOCK, Date.now() + TIMEOUT);
  node.getElementsByTagName('i')[0].classList.replace('icon-playfill', 'icon-loading1');
}

/**
 * @param {HTMLButtonElement} node 
 */
function unlock(node) {
  node.removeAttribute(LOCK);
  node.getElementsByTagName('i')[0].classList.replace('icon-loading1', 'icon-playfill');
}

/**
 * @param {HTMLButtonElement} node
 */
function complete(node) {
  node.setAttribute(COMPLETE, 'true');
  node.disabled = true;
  node.setAttribute('aria-disabled', 'true');
  node.getElementsByTagName('i')[0].classList.replace('icon-loading1', 'icon-playfill');
}

/**
 * @param {HTMLButtonElement} btn
 * @return {HTMLDivElement}
 */
function getCodeBlock(btn) {
  return btn.parentNode.nextElementSibling;
}

/**
 * @param {HTMLButtonElement} btn
 * @return {HTMLDetailsElement | null}
 */
function findOutputFrame(btn) {
  let outputFrame = btn.parentNode.parentNode.nextElementSibling;
  if (outputFrame == undefined || !(outputFrame.tagName == 'DETAILS' && outputFrame.className == 'run-output')) {
    return null;
  }

  return outputFrame;
}

/**
 * @param {HTMLButtonElement} btn
 * @return {HTMLDetailsElement}
 */
function getOutputFrame(btn) {
  let outputFrame = findOutputFrame(btn);
  if (outputFrame == null) {
    let referElement = btn.parentNode.parentNode.nextElementSibling;
    outputFrame = document.createElement('details');
    outputFrame.className = 'run-output';
    let summary = document.createElement('summary');
    summary.textContent = btn.getAttribute('output-title');
    outputFrame.appendChild(summary);
    if (referElement == undefined) {
      btn.parentNode.parentNode.parentNode.appendChild(outputFrame);
    } else {
      referElement.parentNode.insertBefore(outputFrame, referElement);
    }
  }

  outputFrame.setAttribute('open', 'open');
  return outputFrame;
}

/**
 * @param {HTMLButtonElement} btn
 * @param {string} text
 */
function renderOutput(btn, text) {
  let outputFrame = getOutputFrame(btn);
  while (outputFrame.getElementsByTagName('p').length > 0) {
    outputFrame.removeChild(outputFrame.getElementsByTagName('p')[0]);
  }
  let p = document.createElement('p');
  p.innerText = text;
  outputFrame.appendChild(p);
}

/**
 * @param {HTMLButtonElement} btn
 */
function removeOutputFrame(btn) {
  let outputFrame = findOutputFrame(btn);
  if (outputFrame != null) {
    outputFrame.remove();
  }
}

/**
 * @param {any} value
 * @returns {string}
 */
function stringifyLogValue(value) {
  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
}

function log() {
  console.logs.push(Array.from(arguments).map(stringifyLogValue).join(' '));
  console.stdlog.apply(console, arguments);
}

/**
 * @param {HTMLDivElement} codeBlock
 * @param {{ background?: string }} options
 * @return {HTMLDivElement}
 */
function mountVisualFrame(codeBlock, options = {}) {
  let overlay = codeBlock.querySelector('.run-visual-overlay');
  if (overlay == null) {
    overlay = document.createElement('div');
    overlay.className = 'run-visual-overlay';
    codeBlock.appendChild(overlay);
  }

  codeBlock.classList.add('run-visual-host');
  if (options.height != null) {
    codeBlock.style.height = options.height;
  }
  if (options.minHeight != null) {
    codeBlock.style.minHeight = options.minHeight;
  }
  overlay.innerHTML = '';
  overlay.style.backgroundColor = options.background || '#ffffff';
  return overlay;
}

export function runJavascript() {
  /**
   * @type {NodeListOf<HTMLButtonElement>}
   */
  let buttons = document.querySelectorAll(btnSelector);
  [...buttons].forEach((btn) => {
    btn.onclick = () => {
      if (isLocked(btn) || isComplete(btn)) {
        return;
      }

      lock(btn);
      let codeBlock = getCodeBlock(btn);
      let preBlock = codeBlock.getElementsByTagName('pre');
      let text;
      if (preBlock.length == 2) {
        text = preBlock[1].innerText;
      } else if (preBlock.length == 1) {
        text = preBlock[0].innerText;
      } else {
        unlock(btn);
        return;
      }

      let visualMode = false;
      let lockAfterRun = false;
      let succeeded = false;
      let runContext = {
        button: btn,
        codeBlock,
        mount: (options = {}) => {
          visualMode = true;
          if (options.once !== false) {
            lockAfterRun = true;
          }
          removeOutputFrame(btn);
          return mountVisualFrame(codeBlock, options);
        }
      };

      let F = new Function('runContext', text);
      if (console.log != log) {
        console.stdlog = console.log.bind(console);
        console.log = log;
      }
      console.logs = [];

      try {
        F(runContext);
        succeeded = true;
        if (console.logs.length > 0) {
          renderOutput(btn, console.logs.join('\n'));
        } else if (visualMode) {
          removeOutputFrame(btn);
        } else {
          renderOutput(btn, '');
        }
      } catch (error) {
        renderOutput(btn, `${btn.getAttribute('error-prompt')}\n${error.stack || error.message || error}`);
      } finally {
        console.log = console.stdlog || console.log;
        if (lockAfterRun && succeeded) {
          complete(btn);
        } else {
          unlock(btn);
        }
      }
    }
  });
}
