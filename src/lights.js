import { t } from './i18n.js';

// A light is the only colour in the product. Green means explained,
// amber means half-way or not judged yet, red means missed, off means untouched.
export const LIGHT_STATES = ['off', 'green', 'amber', 'red'];
export const POINT_LIGHTS = ['green', 'amber', 'red'];
const ICONS = { green: 'ic-check', amber: 'ic-bang', red: 'ic-x' };
const LABELS = { green: '讲清了', amber: '还差一点', red: '漏掉了', off: '未作答' };

// Layer light rule: every point green -> green; any red -> red; otherwise amber.
export function summarizeLights(lights) {
  if (!Array.isArray(lights) || lights.length === 0) return 'amber';
  if (lights.every(light => light === 'green')) return 'green';
  if (lights.includes('red')) return 'red';
  return 'amber';
}

// Existing Pass/Review records stay valid: green is the only Pass.
export function statusForLight(light) {
  return light === 'green' ? 'pass' : 'review';
}

export function lightForStatus(status) {
  return status === 'pass' ? 'green' : status === 'review' ? 'red' : 'off';
}

export function nextLight(light) {
  return light === 'amber' ? 'green' : light === 'green' ? 'red' : 'amber';
}

export function lightLabel(light) {
  return t(LABELS[light] || LABELS.off);
}

export function isLight(light) {
  return POINT_LIGHTS.includes(light);
}

// DOM helper: inline SVG shape keeps green/amber/red distinguishable without colour.
export function createLamp(light = 'off', { label = true } = {}) {
  const lamp = document.createElement('span');
  lamp.className = 'lamp';
  lamp.dataset.state = light;
  if (label) {
    lamp.setAttribute('role', 'img');
    lamp.setAttribute('aria-label', lightLabel(light));
  } else {
    lamp.setAttribute('aria-hidden', 'true');
  }
  if (light !== 'off') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#${ICONS[light]}`);
    svg.append(use);
    lamp.append(svg);
  }
  return lamp;
}

export function setLampState(lamp, light) {
  lamp.dataset.state = light;
  lamp.replaceChildren();
  if (light !== 'off') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#${ICONS[light]}`);
    svg.append(use);
    lamp.append(svg);
  }
  if (lamp.getAttribute('role') === 'img') lamp.setAttribute('aria-label', lightLabel(light));
}

// Restart the ignite animation even when the same element is reused.
export function ignite(lamp) {
  lamp.classList.remove('is-on', 'is-flash');
  void lamp.offsetWidth;
  lamp.classList.add('is-on');
}

// Reserved for a future live-AI proposal. Suggestions never change a rating by
// themselves: the practice UI shows them and the learner still clicks confirm.
const suggestions = new Map();
const suggestionKey = (questionId, layerId) => `${questionId}::${layerId}`;

export function suggestLights(questionId, layerId, lights) {
  if (typeof questionId !== 'string' || !/^L[123]$/.test(layerId)) return false;
  if (!Array.isArray(lights) || !lights.length || !lights.every(isLight)) return false;
  suggestions.set(suggestionKey(questionId, layerId), [...lights]);
  return true;
}

export function getSuggestion(questionId, layerId) {
  return suggestions.get(suggestionKey(questionId, layerId)) || null;
}

export function clearSuggestion(questionId, layerId) {
  suggestions.delete(suggestionKey(questionId, layerId));
}
