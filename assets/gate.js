(function(){
  var KEY="meridian.gate.v1";
  var USER="MERIDIAN";
  var PASS="M3r1dian!";
  if(window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"||window.location.hostname.endsWith(".replit.dev")) return;
  if(sessionStorage.getItem(KEY)==="ok") return;

  document.documentElement.classList.add("gate-locked");

  function build(){
    var wrap=document.createElement("div");
    wrap.className="mh-gate";
    wrap.innerHTML=''
      +'<div class="mh-gate-card" role="dialog" aria-modal="true" aria-labelledby="mh-gate-h">'
      +'  <span class="mh-gate-eyebrow">Private preview</span>'
      +'  <div class="mh-gate-rule"></div>'
      +'  <h1 id="mh-gate-h">Meridian Health</h1>'
      +'  <p class="mh-gate-lead">Sign in to view the practice site.</p>'
      +'  <form class="mh-gate-form" autocomplete="off">'
      +'    <label><span>Username</span><input type="text" name="u" autocomplete="off" autocapitalize="characters" required /></label>'
      +'    <label><span>Password</span><input type="password" name="p" autocomplete="off" required /></label>'
      +'    <p class="mh-gate-err" aria-live="polite"></p>'
      +'    <button type="submit">Enter</button>'
      +'  </form>'
      +'  <p class="mh-gate-foot">For Meridian Health staff and invited reviewers.</p>'
      +'</div>';
    document.body.appendChild(wrap);
    var f=wrap.querySelector("form");
    var err=wrap.querySelector(".mh-gate-err");
    f.addEventListener("submit",function(e){
      e.preventDefault();
      var u=f.elements.u.value.trim();
      var p=f.elements.p.value;
      if(u.toUpperCase()===USER && p===PASS){
        sessionStorage.setItem(KEY,"ok");
        document.documentElement.classList.remove("gate-locked");
        wrap.remove();
      } else {
        err.textContent="That combination did not match. Please try again.";
        f.elements.p.value="";
        f.elements.p.focus();
      }
    });
    setTimeout(function(){ try{ f.elements.u.focus(); }catch(_){} },50);
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",build);
  } else {
    build();
  }
})();
