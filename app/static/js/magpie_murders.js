// ===== Cursor =====
const cursorDot  = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; });
(function loop(){
  cursorDot.style.left=mx+'px'; cursorDot.style.top=my+'px';
  rx+=(mx-rx)*0.12; ry+=(my-ry)*0.12;
  cursorRing.style.left=rx+'px'; cursorRing.style.top=ry+'px';
  requestAnimationFrame(loop);
})();

// ===== Scroll reveal =====
document.querySelectorAll('.reveal').forEach(el => {
  new IntersectionObserver(([e])=>{ if(e.isIntersecting) el.classList.add('visible'); },{threshold:0.12}).observe(el);
});

// ===== Hero entrance =====
window.addEventListener('load', () => {
  // Split title text into individual letter spans
  ['titleLine1','titleLine2'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const text = el.textContent;
    el.textContent = '';
    [...text].forEach(ch => {
      const span = document.createElement('span');
      span.className = 'letter';
      span.textContent = ch;
      el.appendChild(span);
    });
  });

  setTimeout(() => {
    document.getElementById('hero').classList.add('ready');

    // Animate letters in random order after figures start moving
    const allLetters = document.querySelectorAll('.t-line .letter');
    // Create shuffled index array
    const indices = [...Array(allLetters.length).keys()];
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    // Stagger each letter with random order, starting after 1s delay
    indices.forEach((idx, order) => {
      setTimeout(() => {
        allLetters[idx].classList.add('visible');
      }, 1000 + order * 120);
    });
  }, 100);
});

// ===== Rating stars =====
const starLabels=['','弃读','尚可','不错','很好','神作'];
let currentRating=0;
const starsContainer=document.getElementById('stars');
const ratingText=document.getElementById('ratingText');
if(starsContainer){
  for(let i=1;i<=5;i++){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24'); svg.classList.add('star'); svg.dataset.val=i;
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d','M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
    svg.appendChild(path);
    svg.addEventListener('click',()=>{ currentRating=i; updateStars(); if(ratingText){ratingText.textContent=starLabels[i];ratingText.style.color='rgba(200,16,46,0.8)';} });
    svg.addEventListener('mouseenter',()=>hoverStars(i));
    svg.addEventListener('mouseleave',()=>updateStars());
    starsContainer.appendChild(svg);
  }
}
function hoverStars(n){ document.querySelectorAll('.star').forEach((s,i)=>s.classList.toggle('active',i<n)); }
function updateStars(){ document.querySelectorAll('.star').forEach((s,i)=>s.classList.toggle('active',i<currentRating)); }