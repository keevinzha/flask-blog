'use strict';

(function () {
  const input   = document.querySelector('#book-search-input');
  const results = document.querySelector('#book-search-results');
  const spinner = document.querySelector('.book-search-spinner');

  if (!input) return;

  // URL is injected via data attribute to keep JS framework-agnostic
  const searchDataURL = input.getAttribute('data-search-url') || '/search-data.json';

  const indexConfig = {
    includeScore: true,
    useExtendedSearch: true,
    fieldNormWeight: 1.5,
    threshold: 0.2,
    ignoreLocation: true,
    keys: [
      { name: 'title',   weight: 0.7 },
      { name: 'content', weight: 0.3 }
    ]
  };

  input.addEventListener('focus', init);
  input.addEventListener('keyup', search);
  document.addEventListener('keypress', focusSearchFieldOnKeyPress);

  function focusSearchFieldOnKeyPress(event) {
    if (event.target.value !== undefined) return;
    if (input === document.activeElement) return;
    const ch = String.fromCharCode(event.charCode);
    const hotkeys = input.getAttribute('data-hotkeys') || '';
    if (hotkeys.indexOf(ch) < 0) return;
    input.focus();
    event.preventDefault();
  }

  function init() {
    input.removeEventListener('focus', init);
    input.required = true;
    if (spinner) spinner.classList.remove('hidden');

    fetch(searchDataURL)
      .then(r => r.json())
      .then(pages => {
        window.bookSearchIndex = new Fuse(pages, indexConfig);
      })
      .then(() => {
        input.required = false;
        if (spinner) spinner.classList.add('hidden');
      })
      .then(search)
      .catch(() => {
        input.required = false;
        if (spinner) spinner.classList.add('hidden');
      });
  }

  function search() {
    while (results.firstChild) results.removeChild(results.firstChild);
    if (!input.value || !window.bookSearchIndex) return;

    window.bookSearchIndex.search(input.value).slice(0, 10).forEach(({ item }) => {
      const li    = document.createElement('li');
      const a     = document.createElement('a');
      const small = document.createElement('small');

      a.href        = item.href;
      a.textContent = item.title;
      small.textContent = item.section || '';

      li.appendChild(a);
      li.appendChild(small);
      results.appendChild(li);
    });
  }
})();
