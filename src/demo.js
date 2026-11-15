// Fixed example only. No imports, storage access, fetch or model calls.
export function initDemo() {
  const $ = id => document.getElementById(id);
  const sample = 'Both threads can read 5, calculate 6, and write 6. The increment is several steps, so visibility alone cannot prevent the lost update. I would use an atomic increment or protect the whole operation with the same lock.';
  function reset() {
    $('demo-feedback').hidden = true; $('demo-feedback-button').disabled = false;
    $('demo-retry').value = ''; $('demo-after').textContent = 'Your retry will appear here.';
    $('demo-status').textContent = 'Not rated.';
    $('demo-sheet').textContent = 'A review item will appear here only if you choose Review.';
  }
  function showRetry() { $('demo-after').textContent = $('demo-retry').value || 'Your retry will appear here.'; }
  $('open-demo').addEventListener('click', () => {
    reset(); $('demo').hidden = false; $('practice').hidden = true;
    $('demo-title').focus(); $('demo').scrollIntoView({block:'start'});
  });
  document.querySelector('a[href="#practice"]').addEventListener('click', () => {
    $('demo').hidden = true; $('practice').hidden = false;
  });
  $('close-demo').addEventListener('click', () => {
    $('demo').hidden = true; $('practice').hidden = false;
    $('practice').scrollIntoView({block:'start'}); $('open-demo').focus({preventScroll:true});
  });
  $('demo-feedback-button').addEventListener('click', () => {
    $('demo-feedback').hidden = false; $('demo-feedback-button').disabled = true;
  });
  $('demo-retry').addEventListener('input', showRetry);
  $('demo-use-example').addEventListener('click', () => { $('demo-retry').value = sample; showRetry(); });
  for (const status of ['pass','review']) $('demo-' + status).addEventListener('click', () => {
    $('demo-status').textContent = `Demo self-rating: ${status}. Not saved to practice records.`;
    $('demo-sheet').textContent = status === 'review'
      ? 'Demo Crash Sheet: L2 — explain the read-modify-write steps and a lost-update interleaving. Simulated guidance, not a live diagnosis.'
      : 'Demo Crash Sheet: no current review items. This is not proof of mastery.';
  });
  $('demo-reset').addEventListener('click', reset);
}
