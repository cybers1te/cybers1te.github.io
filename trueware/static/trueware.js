/* Améliorations progressives : le site fonctionne entièrement sans ce script.
   - soumission automatique des filtres du catalogue au changement de menu
   - mise à jour de quantité sans recliquer sur le bouton
   - masquage des messages flash après lecture */
(function () {
  'use strict';

  document.querySelectorAll('.filters select').forEach(function (sel) {
    sel.addEventListener('change', function () {
      var form = sel.closest('form');
      var page = form.querySelector('input[name=page]');
      if (page) page.value = '1';
      form.submit();
    });
  });

  document.querySelectorAll('.line-qty').forEach(function (form) {
    var input = form.querySelector('input[name=qty]');
    if (!input) return;
    var last = input.value;
    input.addEventListener('change', function () {
      if (input.value !== last && input.checkValidity()) {
        last = input.value;
        form.submit();
      }
    });
  });

  var flashes = document.querySelector('.flashes');
  if (flashes) {
    setTimeout(function () {
      flashes.style.transition = 'opacity .5s';
      flashes.style.opacity = '0';
      setTimeout(function () { flashes.remove(); }, 600);
    }, 6000);
  }
})();
