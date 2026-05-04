async function searchBook() {
  const title = document.getElementById('title').value.trim();
  if (!title) return;

  const key = document.getElementById('book-search-form').dataset.apiKey;
  const resp = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}&key=${key}&maxResults=8`
  );
  const data = await resp.json();
  if (!data.items || data.items.length === 0) {
    alert('未找到相关书籍');
    return;
  }

  // 显示搜索结果
  let resultsDiv = document.getElementById('book-search-results');
  if (!resultsDiv) {
    resultsDiv = document.createElement('div');
    resultsDiv.id = 'book-search-results';
    resultsDiv.style.cssText = 'margin-top:0.5rem;border:1px solid var(--gray-200);border-radius:var(--border-radius);overflow:hidden;';
    document.getElementById('book-search-form').querySelector('.form-group').appendChild(resultsDiv);
  }

  resultsDiv.innerHTML = data.items.map((item, i) => {
    const info = item.volumeInfo;
    const cover = info.imageLinks?.thumbnail?.replace('http:', 'https:') || '';
    const author = (info.authors || []).join(', ');
    return `
      <div onclick="selectBook(${i})" data-index="${i}" style="display:flex;gap:0.75rem;padding:0.75rem;cursor:pointer;border-bottom:1px solid var(--gray-200);align-items:center;" 
           onmouseenter="this.style.background='var(--gray-100)'" onmouseleave="this.style.background=''">
        ${cover ? `<img src="${cover}" style="width:40px;height:auto;border-radius:2px;flex-shrink:0">` : '<div style="width:40px;height:52px;background:var(--gray-200);border-radius:2px;flex-shrink:0"></div>'}
        <div>
          <div style="font-weight:500;font-size:var(--font-size-smaller)">${info.title}</div>
          <div style="font-size:var(--font-size-smallest);opacity:0.6">${author}</div>
        </div>
      </div>`;
  }).join('');

  window._bookSearchResults = data.items;
}

function selectBook(index) {
  const info = window._bookSearchResults[index].volumeInfo;
  document.getElementById('author').value = (info.authors || []).join(', ');
  document.getElementById('cover').value = info.imageLinks?.thumbnail?.replace('http:', 'https:') || '';
  document.getElementById('url').value = info.infoLink || '';
  document.getElementById('title').value = info.title;
  document.getElementById('book-search-results').innerHTML = '';
}