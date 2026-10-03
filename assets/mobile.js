(function(){
  const body=document.body;
  const menuBtn=document.getElementById('mobileMenuButton');
  const closeBtn=document.getElementById('sidebarClose');
  const overlay=document.getElementById('sidebarOverlay');
  const sidebar=document.getElementById('sidebar');

  function openMenu(){
    body.classList.add('menu-open');
    menuBtn?.setAttribute('aria-expanded','true');
    setTimeout(()=>closeBtn?.focus(),0);
  }
  function closeMenu(){
    body.classList.remove('menu-open');
    menuBtn?.setAttribute('aria-expanded','false');
  }

  window.openMobileMenu=openMenu;
  window.closeMobileMenu=closeMenu;

  menuBtn?.addEventListener('click',()=>body.classList.contains('menu-open')?closeMenu():openMenu());
  closeBtn?.addEventListener('click',closeMenu);
  overlay?.addEventListener('click',closeMenu);

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&body.classList.contains('menu-open')) closeMenu();
  });

  sidebar?.addEventListener('click',e=>{
    const btn=e.target.closest('.nav button');
    if(btn&&window.innerWidth<=860) closeMenu();
  });

  window.addEventListener('resize',()=>{
    if(window.innerWidth>860) closeMenu();
  });
})();