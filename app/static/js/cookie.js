(function () {
  if (localStorage.getItem('cookie-accepted')) {
    document.getElementById('cookie-banner').style.display = 'none';
    return;
  }

  window.acceptCookie = function () {
    localStorage.setItem('cookie-accepted', '1');
    document.getElementById('cookie-banner').style.display = 'none';
    const overlay = document.getElementById('cookie-overlay');
    overlay.classList.add('show');
    setTimeout(() => {
      overlay.style.transition = 'opacity 0.5s';
      overlay.style.opacity = '0';
      setTimeout(() => overlay.classList.remove('show'), 500);
    }, 2000);
  };

  window.dismissCookie = function () {
    localStorage.setItem('cookie-accepted', '1');
    document.getElementById('cookie-banner').style.display = 'none';
  };
})();