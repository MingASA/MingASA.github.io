const STORAGE_KEY = 'chirpy-likes:v1';
const LIKE_SELECTOR = '[data-likes-key]';

let likedState = null;
let storageEnabled = true;
let storageBound = false;

function sanitizeState(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((result, [key, liked]) => {
    if (liked) {
      result[key] = true;
    }

    return result;
  }, {});
}

function loadState() {
  if (likedState !== null) {
    return likedState;
  }

  if (!storageEnabled) {
    likedState = {};
    return likedState;
  }

  try {
    const rawState = localStorage.getItem(STORAGE_KEY);
    likedState = sanitizeState(rawState ? JSON.parse(rawState) : {});
  } catch (_) {
    storageEnabled = false;
    likedState = {};
  }

  return likedState;
}

function persistState() {
  if (!storageEnabled || likedState === null) {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(likedState));
  } catch (_) {
    storageEnabled = false;
  }
}

function parseBaseLikes(element) {
  const parsed = Number.parseInt(element.dataset.baseLikes, 10);

  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function isLiked(key) {
  return Boolean(loadState()[key]);
}

function resolveLikesCount(element, liked) {
  return Math.max(0, parseBaseLikes(element) + (liked ? 1 : 0));
}

function syncLikeElement(element) {
  const key = element.dataset.likesKey;
  const liked = isLiked(key);
  const toggle = element.querySelector('[data-likes-toggle]');
  const count = element.querySelector('[data-likes-count]');

  element.classList.toggle('is-liked', liked);

  if (toggle) {
    toggle.setAttribute('aria-pressed', String(liked));
  }

  if (count) {
    count.textContent = String(resolveLikesCount(element, liked));
  }
}

function syncLikeGroup(key) {
  document.querySelectorAll(LIKE_SELECTOR).forEach((element) => {
    if (element.dataset.likesKey === key) {
      syncLikeElement(element);
    }
  });
}

function toggleLike(key) {
  const state = loadState();

  if (state[key]) {
    delete state[key];
  } else {
    state[key] = true;
  }

  persistState();
  syncLikeGroup(key);
}

function bindStorageSync() {
  if (storageBound) {
    return;
  }

  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) {
      return;
    }

    try {
      likedState = sanitizeState(event.newValue ? JSON.parse(event.newValue) : {});
    } catch (_) {
      likedState = {};
    }

    document.querySelectorAll(LIKE_SELECTOR).forEach((element) => {
      syncLikeElement(element);
    });
  });

  storageBound = true;
}

export function initLikes() {
  const likeElements = document.querySelectorAll(LIKE_SELECTOR);

  if (likeElements.length === 0) {
    return;
  }

  loadState();
  bindStorageSync();

  likeElements.forEach((element) => {
    if (element.dataset.likesBound === 'true') {
      syncLikeElement(element);
      return;
    }

    const toggle = element.querySelector('[data-likes-toggle]');

    if (!toggle) {
      return;
    }

    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      toggleLike(element.dataset.likesKey);
    });

    element.dataset.likesBound = 'true';
    syncLikeElement(element);
  });
}
