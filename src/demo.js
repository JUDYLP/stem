import { setLampState, ignite } from './lights.js';

// Fixed example on the landing page. No storage access, fetch or model calls.
const SEQUENCE = ['green', 'green', 'red'];

export function initDemo() {
  const points = [...document.querySelectorAll('#demo-points .lamp')];
  const followup = document.getElementById('demo-followup');
  const replay = document.getElementById('replay-demo');
  if (!points.length) return;
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let timers = [];

  function reset() {
    timers.forEach(clearTimeout);
    timers = [];
    points.forEach(lamp => {
      lamp.dataset.state = 'off';
      lamp.replaceChildren();
      lamp.classList.remove('is-on', 'is-flash');
    });
    followup.hidden = true;
    followup.classList.remove('is-shown');
  }

  function play() {
    reset();
    if (reduced()) {
      points.forEach((lamp, index) => setLampState(lamp, SEQUENCE[index]));
      followup.hidden = false;
      followup.classList.add('is-shown');
      return;
    }
    SEQUENCE.forEach((light, index) => {
      timers.push(setTimeout(() => {
        setLampState(points[index], light);
        ignite(points[index]);
        if (light === 'red') points[index].classList.add('is-flash');
      }, 420 + index * 520));
    });
    timers.push(setTimeout(() => {
      followup.hidden = false;
      requestAnimationFrame(() => followup.classList.add('is-shown'));
    }, 420 + SEQUENCE.length * 520 + 200));
  }

  replay.addEventListener('click', play);
  play();
}
