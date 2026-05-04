// Bouton "Acheter" -> POST /api/create-checkout -> redirige vers Stripe.
'use strict';

(function () {
  const btn = document.getElementById('buy-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Chargement...';

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Réponse invalide');
      }
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.textContent = original;
      alert('Impossible de lancer le paiement : ' + err.message + '\n\nRéessaie ou contacte contact@triskell-studio.fr');
    }
  });
})();
