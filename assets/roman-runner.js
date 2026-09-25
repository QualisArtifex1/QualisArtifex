/* Via Infinita: a tiny, dependency-free, endlessly generated Roman adventure. */
(() => {
  'use strict';
  const host = document.createElement('aside');
  host.id = 'roman-runner';
  host.setAttribute('aria-label', 'Via Infinita mini game');
  document.body.append(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    :host{display:block;position:fixed;bottom:0;left:0;right:0;z-index:1000;color:#f6e5b9;font:12px/1.3 system-ui,sans-serif;--gold:#dfba6e}
    *{box-sizing:border-box}button{font:inherit;color:inherit;background:#292738;border:1px solid #75654e;border-radius:4px;cursor:pointer;padding:5px 10px;min-height:30px}button:hover{background:#484050}button:focus-visible,canvas:focus-visible{outline:2px solid #f5d080;outline-offset:-3px}
    .bar{height:36px;display:flex;align-items:center;gap:12px;padding:0 14px;background:#24212b;border-top:1px solid #99805a}.title{font:600 12px Georgia,serif;letter-spacing:2px;color:var(--gold)}.hint{color:#c6bfae;font-size:11px}.score{margin-left:auto;font-variant-numeric:tabular-nums;white-space:nowrap}.stage{position:relative;background:#24233c}canvas{display:block;width:100%;height:144px;image-rendering:pixelated;touch-action:none}.overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}.overlay button{pointer-events:auto;background:#211e2bea;border-color:var(--gold);padding:10px 20px;font-weight:600}.touch{position:absolute;bottom:13px;right:12px;display:flex;gap:6px}.touch button{min-width:43px;min-height:35px;background:#262330dc;touch-action:none;user-select:none;-webkit-user-select:none}.note{position:absolute;left:14px;bottom:8px;font:10px monospace;color:#dfd2b2;pointer-events:none}.hidden{display:none!important}:host([collapsed]) .stage{display:none}:host([collapsed]) .hint{display:none}
    @media(max-width:600px){.bar{gap:7px;padding:0 8px}.title{font-size:10px;letter-spacing:1px}.hint{display:none}.score{font-size:10px}.bar button{padding:4px 7px}canvas{height:144px}}
  </style><div class="bar"><span class="title">VIA INFINITA</span><span class="hint">→ / D move · Space / ↑ jump · X sword · Esc pause</span><span class="score">0 m · 0 defeated</span><button class="pause" aria-label="Pause game">Pause</button><button class="collapse" aria-label="Minimize game" aria-expanded="true">−</button></div><div class="stage"><canvas tabindex="0" role="img" aria-label="Roman soldier game. Right arrow or D to move, Space or Up to jump, X to swing sword, Escape to pause."></canvas><div class="overlay"><button class="start">Play a little →</button></div><div class="touch"><button data-action="move" aria-label="Move right">→</button><button data-action="jump" aria-label="Jump">↑</button><button data-action="attack" aria-label="Swing sword">⚔</button></div><span class="note">An endless road. A moment of play.</span></div>`;
  // Reserve the strip's space so the last page links remain reachable.
  const spacer = document.createElement('div'); spacer.style.height = '180px'; spacer.setAttribute('aria-hidden','true'); document.body.append(spacer);
  const canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d');
  const overlay = root.querySelector('.overlay'), start = root.querySelector('.start'), pause = root.querySelector('.pause');
  let width = 800, running = false, started = false, last = 0, raf = 0, world = 0, next = 340, time = 0, kills = 0;
  let y = 0, vy = 0, swing = 0, cooldown = 0, grace = 0, respawn = 0;
  let obstacles = [], particles = []; const keys = new Set(), held = new Set();
  const floor = 111, speed = 115, gravity = 560, jumpSpeed = 235;
  const palette = {o:'#211b2d',r:'#aa3342',R:'#e76051',g:'#8b9298',G:'#d6d8bf',s:'#f4c693',S:'#ba8261',b:'#674a42',y:'#d9ae55',Y:'#ffe0a0',t:'#4e6556',T:'#84956e'};
  const soldier = [
    '.......rrrrr........','......rRRRRRr.......','.....rrRRRRRrr......','.....yyyyyyyy.......','....yGGGGGGGgy......','....yGGggggGgy......','....ysssosssgy......','.....sSsssssg.......','.....ggggggg........','....gGGGGGGgg.......','...rgGggggGgss......','...rrGGGGGGgSs......','...ryyyyyyyg........','...rrrRRrrr.........','....rrRRrrr.........','.....ss.ss..........','.....ss.ss..........','.....bb.bb..........','....bbb.bbb.........'];
  const enemy = ['......bbbb........','.....bTTTTb.......','....bTTTTTTb......','....bssossb.......','.....sSSss........','....ttTTttt.......','...tttTTttss......','...ttTTTTtss......','....tyyyyt........','....tttttt........','.....ss.ss........','.....bb.bb........','....bbb.bbb.......'];
  function pixelSprite(rows, x, top, scale = 2, step = 0, explode = false) {
    rows.forEach((row, ry) => [...row].forEach((c, rx) => {
      if (!palette[c]) return;
      const leg = ry > rows.length-5 ? (rx < 8 ? step : -step) : 0;
      const px = Math.round(x + rx*scale + leg), py = Math.round(top + ry*scale);
      if(explode) particles.push({x:px,y:py,vx:(Math.random()-.5)*140,vy:-40-Math.random()*145,life:.65+Math.random()*.55,color:palette[c]});
      else {ctx.fillStyle=palette[c];ctx.fillRect(px,py,scale,scale);}
    }));
  }
  function resize(){width=Math.max(280,Math.round(canvas.getBoundingClientRect().width));canvas.width=width;canvas.height=144;ctx.imageSmoothingEnabled=false;draw();}
  new ResizeObserver(resize).observe(canvas);
  function setRunning(value){running=value;keys.clear();held.clear();pause.textContent=value?'Pause':'Resume';pause.setAttribute('aria-label',value?'Pause game':'Resume game');overlay.classList.toggle('hidden',value);start.textContent=started?'Continue the journey →':'Play a little →';if(value){started=true;last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);canvas.focus({preventScroll:true});}else{cancelAnimationFrame(raf);draw();}}
  function action(name){if(!running)setRunning(true);if(name==='jump'&&y===0&&!respawn)vy=jumpSpeed;if(name==='attack'&&cooldown<=0&&!respawn){swing=.24;cooldown=.36;}}
  start.onclick=()=>setRunning(true);pause.onclick=()=>{if(host.hasAttribute('collapsed'))root.querySelector('.collapse').click();setRunning(!running);};
  root.querySelector('.collapse').onclick=()=>{const collapsed=host.toggleAttribute('collapsed');spacer.style.height=collapsed?'36px':'180px';const button=root.querySelector('.collapse');button.textContent=collapsed?'+':'−';button.setAttribute('aria-label',collapsed?'Expand game':'Minimize game');button.setAttribute('aria-expanded',String(!collapsed));if(collapsed)setRunning(false);else resize();};
  root.addEventListener('keydown',e=>{if(e.target.tagName==='BUTTON')return;const k=e.code;if(!['ArrowRight','KeyD','ArrowUp','Space','KeyW','KeyX','Escape'].includes(k))return;e.preventDefault();e.stopPropagation();if(k==='Escape'){setRunning(false);return;}if(!running)setRunning(true);keys.add(k);if(!e.repeat&&['ArrowUp','Space','KeyW'].includes(k))action('jump');if(k==='KeyX')action('attack');});
  root.addEventListener('keyup',e=>keys.delete(e.code));
  root.querySelectorAll('[data-action]').forEach(button=>{button.addEventListener('pointerdown',e=>{e.preventDefault();action(button.dataset.action);if(button.dataset.action==='move')held.add(e.pointerId);button.setPointerCapture(e.pointerId);});for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,e=>held.delete(e.pointerId));});
  window.addEventListener('blur',()=>setRunning(false));document.addEventListener('visibilitychange',()=>{if(document.hidden)setRunning(false);});
  root.addEventListener('focusout',()=>{setTimeout(()=>{if(!root.activeElement&&running)setRunning(false);},0);});
  function hit(){if(grace>0||respawn>0)return;grace=1.7;respawn=.65;vy=0;y=0;keys.clear();held.clear();root.querySelector('.note').textContent='Back on your feet. The road goes on.';obstacles=obstacles.filter(o=>Math.abs(o.x-world-60)>170);}
  function update(dt){time+=dt;swing=Math.max(0,swing-dt);cooldown=Math.max(0,cooldown-dt);grace=Math.max(0,grace-dt);respawn=Math.max(0,respawn-dt);
    const moving=(keys.has('ArrowRight')||keys.has('KeyD')||held.size>0)&&respawn===0;
    if(moving)world+=speed*dt;
    if(vy!==0||y>0){y+=vy*dt;vy-=gravity*dt;if(y<=0){y=0;vy=0;}}
    while(next<world+width+300){const kind=['rock','river','enemy'][Math.floor(Math.random()*3)];obstacles.push({x:next,kind,w:kind==='river'?58:kind==='rock'?23:36});next+=235+Math.random()*170;}
    for(const o of obstacles){const x=o.x-world;
      if(o.kind==='enemy'&&swing>0&&x<132&&x+o.w>72&&y<39){pixelSprite(enemy,x,floor-26,2,0,true);o.dead=true;kills++;}
      if(!o.dead&&x<89&&x+o.w>67){if((o.kind==='river'&&y<5)||(o.kind==='rock'&&y<20)||(o.kind==='enemy'&&y<26))hit();}}
    obstacles=obstacles.filter(o=>!o.dead&&o.x-world>-100);
    for(const p of particles){p.x+=p.vx*dt-(moving?speed*dt:0);p.y+=p.vy*dt;p.vy+=300*dt;p.life-=dt;}
    particles=particles.filter(p=>p.life>0);
    root.querySelector('.score').textContent=`${Math.floor(world/10)} m · ${kills} defeated`;
  }
  function rect(color,x,y,w,h){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
  function draw(){if(!ctx)return;ctx.clearRect(0,0,width,144);rect('#252440',0,0,width,144);rect('#333153',0,43,width,68);
    // Distant stars, ochre moon, cypress silhouettes, and an aqueduct.
    for(let i=0;i<Math.ceil(width/70)+2;i++){let x=((i*83+17-world*.08)%(width+80)+width+80)%(width+80);rect(i%3?'#8c83a2':'#d7c49b',x,8+(i*17)%33,2,2);}
    rect('#e6d5a1',width-96,15,14,18);rect('#e6d5a1',width-99,18,20,12);rect('#b9ac91',width-94,19,3,4);
    for(let i=-1;i<width/140+2;i++){const x=i*140-(world*.18)%140;rect('#45415c',x,72,100,5);rect('#45415c',x+5,77,10,34);rect('#45415c',x+85,77,10,34);rect('#45415c',x+15,77,10,8);rect('#45415c',x+75,77,10,8);rect('#272d3e',x+116,71,7,40);rect('#272d3e',x+112,80,15,23);rect('#272d3e',x+119,65,2,8);}
    rect('#9b986f',0,floor,width,3);rect('#56534e',0,floor+3,width,12);rect('#34333c',0,floor+15,width,20);
    for(let x=-(world%36);x<width;x+=36){rect('#34333c',x,floor+4,2,11);rect('#77705b',x+4,floor+5,18,2);rect('#49444a',x+15,floor+19,23,2);}
    for(const o of obstacles){const x=o.x-world;if(o.kind==='river'){rect('#1d354b',x,floor,o.w,33);for(let j=0;j<4;j++)rect(j%2?'#4d96a2':'#75b3ae',x+4+((time*12+j*11)%25),floor+4+j*7,22,2);}else if(o.kind==='rock'){rect('#292933',x,floor-15,23,15);rect('#292933',x+5,floor-21,14,6);rect('#9b9885',x+4,floor-15,15,10);rect('#b8b29a',x+7,floor-19,9,5);rect('#676977',x+15,floor-12,5,10);}else pixelSprite(enemy,x,floor-26,2,Math.sin(time*9)>0?1:-1);}
    const moving=running&&(keys.has('ArrowRight')||keys.has('KeyD')||held.size>0);const top=floor-38-y;
    if(respawn===0&&!(grace>0&&Math.floor(time*12)%2)){const bob=y===0&&!moving?Math.floor(Math.sin(time*3)):0;pixelSprite(soldier,54,top+bob,2,moving?Math.round(Math.sin(time*15)*3):0);
      // Rectangular scutum, gold boss, gladius and three-frame slash.
      rect('#211b2d',57,top+20,13,17);rect('#973741',59,top+21,9,14);rect('#e4b762',62,top+22,2,12);rect('#ffdd88',60,top+27,6,3);
      if(swing>0){const phase=swing>.16?0:swing>.08?1:2;ctx.save();ctx.translate(85,top+23);ctx.rotate([-.8,0,.7][phase]);rect('#d5dcd5',2,-2,31,3);rect('#fff2bd',29,-1,7,1);rect('#dfb363',0,-5,3,10);ctx.restore();rect('#efe2b3',111,top+14+phase*7,5,2);}else{rect('#dbc67f',87,top+25,7,3);rect('#ccd1c6',90,top+13,3,12);}}
    for(const p of particles){ctx.globalAlpha=Math.min(1,p.life*2);rect(p.color,p.x,p.y,2,2);}ctx.globalAlpha=1;
  }
  function frame(stamp){if(!running)return;const dt=last?Math.min((stamp-last)/1000,.035):0;last=stamp;update(dt);draw();raf=requestAnimationFrame(frame);}
  resize();setRunning(false);
})();
