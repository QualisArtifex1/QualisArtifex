/* Chapter 19: regular first-conjugation verbs, active, third-person singular. */
(() => {
  'use strict';
  const types = [
    {name:'Present simple fact',tense:'Present indicative',end:'at',note:'An open present condition: the speaker does not assert whether the condition is true.'},
    {name:'Present contrary to fact',tense:'Imperfect subjunctive',end:'āret',note:'Imperfect subjunctives describe an unreal PRESENT situation: the condition is not happening now.'},
    {name:'Past simple fact',tense:'Imperfect indicative',end:'ābat',note:'An open past condition. This game uses the imperfect; other past indicative tenses are also possible.'},
    {name:'Past contrary to fact',tense:'Pluperfect subjunctive',end:'āvisset',note:'Pluperfect subjunctives describe an unreal PAST situation: the condition did not happen.'},
    {name:'Future more vivid',tense:'Future indicative',end:'ābit',note:'A future condition stated directly. English uses a present form after “if,” but Latin uses the future here.'},
    {name:'Future less vivid',tense:'Present subjunctive',end:'et',note:'Present subjunctives imagine a FUTURE possibility. This is not a claim that it cannot happen.'}
  ];
  const families = [
    {a:'ambul',b:'salūt',before:'Sī Mārcus in forō ',between:', Iūlia eum ',gloss:'ambulō = walk; salūtō = greet; in forō = in the forum; eum = him',english:[
      'If Marcus is walking in the forum, Julia greets him.',
      'If Marcus were walking in the forum now, Julia would greet him.',
      'If Marcus was walking in the forum, Julia was greeting him.',
      'If Marcus had walked in the forum, Julia would have greeted him.',
      'If Marcus walks in the forum, Julia will greet him.',
      'If Marcus should walk in the forum, Julia would greet him.']},
    {a:'cant',b:'laud',before:'Sī puella ',between:', poēta eam ',gloss:'puella = girl; poēta = poet; cantō = sing; laudō = praise; eam = her',english:[
      'If the girl sings, the poet praises her.',
      'If the girl were singing now, the poet would praise her.',
      'If the girl was singing, the poet was praising her.',
      'If the girl had sung, the poet would have praised her.',
      'If the girl sings, the poet will praise her.',
      'If the girl should sing, the poet would praise her.']},
    {a:'labōr',b:'par',before:'Sī agricola ',between:', dominus cēnam ',gloss:'agricola = farmer; dominus = master; labōrō = work; parō = prepare; cēnam = dinner',english:[
      'If the farmer works, the master prepares dinner.',
      'If the farmer were working now, the master would prepare dinner.',
      'If the farmer was working, the master was preparing dinner.',
      'If the farmer had worked, the master would have prepared dinner.',
      'If the farmer works, the master will prepare dinner.',
      'If the farmer should work, the master would prepare dinner.']}
  ];
  const root=document.getElementById('conditions-quest');
  if (!root) return;
  const $=id=>root.querySelector('#cq-'+id);
  const buttons=[...root.querySelectorAll('[data-condition]')];
  let deck=[],index=0,score=0,streak=0,best=0,attempted=false,hinted=false,solved=false,results=[];
  const shuffle=items=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  function sentence(q){const f=families[q.family],t=types[q.type];return `${f.before}${f.a}${t.end}${f.between}${f.b}${t.end}.`;}
  function setStats(){ $('progress').value=index; $('progress').max=deck.length;$('counter').textContent=`Question ${index+1} / ${deck.length}`;$('score').textContent=score;$('streak').textContent=streak; }
  function showQuestion(){
    attempted=false;hinted=false;solved=false;
    const q=deck[index],f=families[q.family],t=types[q.type];
    $('sentence').replaceChildren(document.createTextNode(f.before));
    const first=document.createElement('strong');first.lang='la';first.textContent=f.a+t.end;
    const second=document.createElement('strong');second.lang='la';second.textContent=f.b+t.end;
    $('sentence').append(first,document.createTextNode(f.between),second,document.createTextNode('.'));
    $('gloss').textContent=f.gloss;$('feedback').textContent='Choose the condition’s time and viewpoint on the chart.';
    $('hint-text').textContent='';$('hint').disabled=false;$('next').hidden=true;
    buttons.forEach(b=>{b.disabled=false;b.classList.remove('correct','wrong');b.removeAttribute('aria-pressed');});
    $('marker').hidden=true;setStats();
  }
  function start(questions){
    deck=shuffle(questions);index=score=streak=best=0;results=[];
    $('summary').hidden=true;$('play').hidden=false;$('intro').hidden=true;showQuestion();$('sentence').focus();
  }
  function newRound(){start(types.flatMap((_,type)=>shuffle([0,1,2]).slice(0,2).map(family=>({type,family}))));}
  function flyTo(button){
    const area=$('board').getBoundingClientRect(),target=button.getBoundingClientRect(),origin=$('sentence').getBoundingClientRect(),marker=$('marker');
    marker.hidden=false;
    marker.style.left=(target.left-area.left+target.width/2-16)+'px';marker.style.top=(target.top-area.top+target.height/2-16)+'px';
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){marker.getAnimations().forEach(a=>a.cancel());marker.animate([{transform:`translate(${origin.left+origin.width/2-target.left-target.width/2}px,${origin.top+origin.height/2-target.top-target.height/2}px) scale(.7)`},{transform:'translate(0,0) scale(1)'}],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'});}
  }
  buttons.forEach(button=>button.addEventListener('click',()=>{
    if(solved)return;
    const q=deck[index],type=Number(button.dataset.condition),t=types[q.type];
    if(type!==q.type){attempted=true;streak=0;button.disabled=true;button.classList.add('wrong');$('feedback').textContent=`Not quite: ${types[type].name} uses ${types[type].tense.toLowerCase()}. Look again at the two verb forms and try another cell.`;setStats();return;}
    solved=true;const points=attempted?0:hinted?5:10;score+=points;streak=attempted||hinted?0:streak+1;best=Math.max(best,streak);
    results.push({q,points,practice:attempted||hinted});
    button.classList.add('correct');buttons.forEach(b=>b.disabled=true);flyTo(button);$('hint').disabled=true;
    $('feedback').textContent=`${attempted?'Corrected!':'Correct!'} +${points} points. ${t.name}: both verbs are ${t.tense.toLowerCase()}. ${t.note} Translation: ${families[q.family].english[q.type]}`;
    $('next').textContent=index===deck.length-1?'See results →':'Next sentence →';$('next').hidden=false;setStats();$('progress').value=index+1;
  }));
  $('hint').addEventListener('click',()=>{if(solved)return;hinted=true;$('hint').disabled=true;const t=types[deck[index].type];$('hint-text').textContent=`Both verbs are ${t.tense.toLowerCase()}. A correct first answer with this hint earns 5 points.`;});
  $('next').addEventListener('click',()=>{if(!solved)return;if(index+1<deck.length){index++;showQuestion();$('sentence').focus();}else finish();});
  function finish(){
    $('play').hidden=true;$('summary').hidden=false;
    const perfect=results.filter(r=>r.points===10).length,missed=results.filter(r=>r.practice);
    $('result').textContent=`${score} / ${deck.length*10} points · ${perfect} / ${deck.length} without help · best streak ${best}`;
    $('reward').textContent=perfect===deck.length?'Condition champion!':perfect>=deck.length*.75?'Strong work—keep building!':'Every correction is practice. Try the review round!';
    $('review').replaceChildren();
    results.forEach(r=>{const li=document.createElement('li'),title=document.createElement('strong'),detail=document.createElement('p');title.textContent=sentence(r.q);title.lang='la';detail.textContent=`${types[r.q.type].name} · ${types[r.q.type].tense} · ${r.points} points. ${families[r.q.family].english[r.q.type]}`;li.append(title,detail);$('review').append(li);});
    $('retry').hidden=missed.length===0;$('retry').textContent=`Practice ${missed.length} missed / hinted sentences`;$('result').focus();
  }
  $('start').addEventListener('click',newRound);$('again').addEventListener('click',newRound);
  $('retry').addEventListener('click',()=>start(results.filter(r=>r.practice).map(r=>r.q)));
  $('reference-body').replaceChildren();
  types.forEach((t,i)=>{const tr=document.createElement('tr');[t.name,t.tense,`ambul${t.end} / salūt${t.end}`].forEach(s=>{const td=document.createElement('td');td.textContent=s;tr.append(td);});$('reference-body').append(tr);});
})();
