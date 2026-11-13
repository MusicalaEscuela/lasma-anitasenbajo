/*
 * LAS MAÑANITAS PARA BAJO | Musicala
 * Melodía tradicional mexicana, adaptación didáctica en Do mayor.
 * Bajo estándar E1 A1 D2 G2. Todos los trastes en la melodía: 0, 2, 3.
 * Duraciones didácticas simplificadas en 3/4. No incluye archivos de audio externos.
 */
'use strict';

const BAR_DATA = [
  {rest:2, notes:[['G1',.5],['G1',.5]]},
  {notes:[['C2',1.5],['C2',.5],['B1',.5],['C2',.5]]},
  {notes:[['D2',1.5],['B1',.5],['C2',.5],['D2',.5]]},
  {notes:[['E2',1.5],['C2',.5],['D2',.5],['E2',.5]]},
  {notes:[['F2',2],['F2',.5],['F2',.5]]},
  {notes:[['E2',1.5],['D2',.5],['C2',.5],['B1',.5]]},
  {notes:[['D2',1],['C2',.5],['B1',.5],['C2',.5],['D2',.5]]},
  {notes:[['E2',1],['F2',1],['D2',1]]},
  {notes:[['C2',2],['E2',1]]},
  {notes:[['D2',1],['B1',.5],['B1',.5],['C2',.5],['D2',.5]]},
  {notes:[['E2',2],['C2',.5],['E2',.5]]},
  {notes:[['D2',1],['B1',.5],['B1',.5],['C2',.5],['D2',.5]]},
  {notes:[['E2',2],['C2',.5],['C2',.5]]},
  {notes:[['F2',1.5],['F2',.5],['G2',.5],['F2',.5]]},
  {notes:[['E2',1],['C2',.5],['B1',.5],['C2',.5],['D2',.5]]},
  {notes:[['E2',1],['F2',1],['D2',1]]},
  {notes:[['C2',2]]}
];

const PITCHES = {
  G1:{name:'SOL',code:'G1',midi:31,string:'E',fret:3,finger:'3 (anular)'},
  B1:{name:'SI',code:'B1',midi:35,string:'A',fret:2,finger:'2 (medio)'},
  C2:{name:'DO',code:'C2',midi:36,string:'A',fret:3,finger:'3 (anular)'},
  D2:{name:'RE',code:'D2',midi:38,string:'D',fret:0,finger:'cuerda al aire'},
  E2:{name:'MI',code:'E2',midi:40,string:'D',fret:2,finger:'2 (medio)'},
  F2:{name:'FA',code:'F2',midi:41,string:'D',fret:3,finger:'3 (anular)'},
  G2:{name:'SOL',code:'G2',midi:43,string:'G',fret:0,finger:'cuerda al aire'}
};
const STRINGS = [
  {code:'G',name:'SOL',number:1,openMidi:43},
  {code:'D',name:'RE',number:2,openMidi:38},
  {code:'A',name:'LA',number:3,openMidi:33},
  {code:'E',name:'MI',number:4,openMidi:28}
];
const stringByCode = new Map(STRINGS.map(string=>[string.code,string]));
const positionCode = (string,fret)=>`${string.number}${fret}`;

const SECTIONS = [
  {id:0,label:'1 · Inicio',title:'El comienzo',startBar:0,endBar:3},
  {id:1,label:'2 · Sigue',title:'La melodía continúa',startBar:4,endBar:7},
  {id:2,label:'3 · Repite',title:'Un poquito más',startBar:8,endBar:11},
  {id:3,label:'4 · Final',title:'El gran final',startBar:12,endBar:16}
];

const bars = BAR_DATA.map((bar,barIndex)=>({...bar,barIndex,noteIndices:[]}));
const notes = [];
for(const bar of bars){
  let beat = bar.barIndex*3+(bar.rest || 0);
  for(const [pitch,duration] of bar.notes){
    if(!PITCHES[pitch])throw Error('Tono desconocido '+pitch);
    const note={...PITCHES[pitch],id:notes.length,barIndex:bar.barIndex,start:beat,duration};
    notes.push(note);bar.noteIndices.push(note.id);beat+=duration;
  }
  if(Math.abs(beat-(bar.barIndex+1)*3)>0.001 && bar.barIndex!==bars.length-1){
    throw Error('El compás '+(bar.barIndex+1)+' no suma 3 pulsos.');
  }
}
if(notes.some(n=>n.fret>3))throw Error('La adaptación sale de primera posición');

const $ = (id)=>document.getElementById(id);
const state={index:0,scope:'all',format:'numeric',mode:'learn',tempo:80,correct:0,streak:0,challengeLock:false,renderedSection:-1};
let ctx=null,transport=null,challengeTimer=null,toastTimer=null;
let scoreBarElements=new Map();

function sectionForNote(index){return SECTIONS.find(s=>notes[index].barIndex>=s.startBar && notes[index].barIndex<=s.endBar)||SECTIONS[0];}
function activeSection(){return state.scope==='all' ? sectionForNote(state.index) : SECTIONS[Number(state.scope)];}
function range(){
  if(state.scope==='all')return {start:0,end:notes.length-1};
  const s=activeSection();
  return {start:bars[s.startBar].noteIndices[0],end:bars[s.endBar].noteIndices.at(-1)};
}
function firstIndexOfSection(s){return bars[s.startBar].noteIndices[0];}
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2700);}
function showFeedback(message){$('fretFeedback').textContent=message;}
function clearChallengeTimer(){if(challengeTimer!==null){clearTimeout(challengeTimer);challengeTimer=null;}state.challengeLock=false;}

function stopPlayback(){
  if(transport){clearInterval(transport.timer);transport=null;}
  const btn=$('playBtn');btn.innerHTML='<svg viewBox="0 0 24 24" class="icon" fill="currentColor"><path d="m8 5 12 7-12 7V5Z"/></svg><span>Escuchar melodía</span>';
}
function jumpTo(index,{preview=false}={}){
  stopPlayback();clearChallengeTimer();state.index=Math.max(0,Math.min(notes.length-1,index));
  const r=range();
  if(state.index<r.start || state.index>r.end)state.index=r.start;
  updateUI();if(preview)previewCurrent();
}
function selectScope(scope){
  stopPlayback();clearChallengeTimer();state.scope=scope;
  const target=scope==='all'?0:firstIndexOfSection(SECTIONS[Number(scope)]);
  state.index=target;state.renderedSection=-1;
  renderPhraseNav();updateUI();
  showFeedback('👆 Pulsa el traste resaltado para escuchar cómo debe sonar.');
}
function renderPhraseNav(){
  const opts=[{id:'all',label:'♪ Toda la canción'},...SECTIONS.map(s=>({id:String(s.id),label:s.label}))];
  $('phraseNav').innerHTML=opts.map(o=>`<button type="button" class="phrase-pill ${state.scope===o.id?'active':''}" data-scope="${o.id}" aria-pressed="${state.scope===o.id}">${o.label}</button>`).join('');
}
function numericRowForBar(bar,forPrint=false){
  const positions=bar.noteIndices.map(index=>{
    const note=notes[index], string=stringByCode.get(note.string);
    const code=positionCode(string,note.fret);
    if(forPrint)return `<span class="numeric-note">${code}</span>`;
    const fret=note.fret===0?'al aire':`traste ${note.fret}`;
    return `<button type="button" class="numeric-note" data-index="${index}" aria-label="${code}, cuerda ${string.number} (${string.name}), ${fret}">${code}</button>`;
  }).join('');
  return `<div class="numeric-row" role="group" aria-label="Notación numérica">${positions}</div>`;
}
function tabRowsForBar(bar,forPrint=false){
  return STRINGS.map(s=>{
    const cells=bar.noteIndices.map(index=>{
      const note=notes[index];
      if(note.string!==s.code)return '<span class="tab-cell"><span class="tab-empty" aria-hidden="true"></span></span>';
      if(forPrint)return `<span class="tab-cell"><span class="tab-note">${note.fret}</span></span>`;
      return `<span class="tab-cell"><button type="button" class="tab-note" data-index="${index}" aria-label="Nota ${index+1}: cuerda ${s.name}, traste ${note.fret}">${note.fret}</button></span>`;
    }).join('');
    return `<div class="tab-row"><span class="tab-string">${s.code}</span><div class="tab-cells" style="--cols:${bar.noteIndices.length}">${cells}</div></div>`;
  }).join('');
}
function staffForBar(bar,forPrint=false){
  // La línea inferior de la clave de fa corresponde a SOL2.
  const pitchY={G2:60,F2:65,E2:70,D2:75,C2:80,B1:85,G1:95};
  const lines=[20,30,40,50,60].map(y=>`<line x1="0" x2="100%" y1="${y}" y2="${y}"/>`).join('');
  const positions=bar.noteIndices.map(index=>{
    const note=notes[index], y=pitchY[note.code];
    const ledgers=[];
    for(let ledger=70;ledger<=y;ledger+=10){
      ledgers.push(`<line x1="3" x2="21" y1="${ledger}" y2="${ledger}"/>`);
    }
    const head=`<ellipse cx="12" cy="${y}" rx="5.8" ry="3.8" transform="rotate(-18 12 ${y})" ${note.duration===2?'fill="white"':''}/>`;
    const stem=`<path d="M17 ${y}v-27" fill="none"/>`;
    const flag=note.duration===.5?`<path d="M17 ${y-27}q1 5 5 8t0 9q1-5-5-9Z"/>`:'';
    const dot=note.duration===1.5?`<circle cx="22" cy="${y%10===0?y-5:y}" r="1.5"/>`:'';
    const glyph=`<svg width="25" height="106" viewBox="0 0 25 106" aria-hidden="true">${ledgers.join('')}${head}${stem}${flag}${dot}</svg>`;
    if(forPrint)return `<span class="staff-note">${glyph}</span>`;
    return `<button type="button" class="staff-note" data-index="${index}" aria-label="Nota ${index+1}, ${note.name} ${note.code.slice(-1)}, ${note.duration} pulsos">${glyph}</button>`;
  }).join('');
  const rest=bar.rest?'<span class="staff-rest" aria-label="Silencio de blanca"></span>':'';
  const finalRest=bar.barIndex===bars.length-1?'<span class="staff-quarter-rest" aria-label="Silencio de negra">𝄽</span>':'';
  return `<div class="staff" role="group" aria-label="Pentagrama en clave de fa"><svg class="staff-lines" width="100%" height="106" aria-hidden="true">${lines}</svg><span class="staff-clef" aria-hidden="true">𝄢</span><span class="staff-time" aria-hidden="true">3<br>4</span>${rest}${positions}${finalRest}</div>`;
}
const notationFormats={
  numeric:{label:'Notación numérica',help:'Lee de <strong>izquierda a derecha</strong>. El primer dígito indica la cuerda y el segundo, el traste. <strong>43</strong> es cuerda 4, traste 3. <strong>10</strong> es cuerda 1 al aire.',render:numericRowForBar},
  tab:{label:'Tablatura',help:'Cada línea representa una cuerda. Los números indican el traste. <strong>0</strong> significa cuerda al aire.',render:tabRowsForBar},
  staff:{label:'Partitura',help:'Pentagrama en <strong>clave de fa</strong>, en Do mayor y compás de <strong>3/4</strong>. Pulsa una nota para escucharla.',render:staffForBar}
};
function renderScore(){
  const s=activeSection();state.renderedSection=s.id;
  $('visibleSectionNumber').textContent=`FRAGMENTO ${s.id+1} DE 4`;
  $('visibleSectionName').textContent=s.title;
  $('visibleBarsLabel').textContent=`Compases ${s.startBar+1}–${s.endBar+1}`;
  const format=notationFormats[state.format];
  $('measureGrid').setAttribute('aria-label',format.label+' de los compases actuales');
  $('measureGrid').dataset.format=state.format;
  const subset=bars.slice(s.startBar,s.endBar+1);
  $('measureGrid').innerHTML=subset.map(bar=>`<div class="measure-card" data-bar="${bar.barIndex}"><div class="measure-number">COMPÁS ${bar.barIndex+1}</div>${format.render(bar)}<div class="note-duration">${bar.barIndex===0?'entrada después de 2 pulsos':bar.barIndex===16?'última nota: 2 pulsos':'3 pulsos'}</div></div>`).join('');
  scoreBarElements=new Map([...$('measureGrid').querySelectorAll('.measure-card')].map(el=>[Number(el.dataset.bar),el]));
  $('nextSectionBtn').textContent=s.id===3?'Volver al inicio ↺':'Siguiente fragmento →';
}
function renderFretboard(){
  $('fretboard').innerHTML=`<div class="fret-headings"><span>CUERDA</span>${[0,1,2,3].map(f=>`<span>${f===0?'AL AIRE':`TRASTE ${f}`}</span>`).join('')}</div>${STRINGS.map(s=>`<div class="fret-row" data-string="${s.code}"><span class="fret-string-name">${s.code} <span style="font-size:9px;opacity:.55">${s.number}ª</span></span>${[0,1,2,3].map(f=>`<button class="fret-cell" type="button" data-string="${s.code}" data-fret="${f}" aria-label="Cuerda ${s.name}, traste ${f===0?'al aire':f}"><span class="fret-dot">${f}</span></button>`).join('')}</div>`).join('')}<div class="fret-markers"><span></span><span>○</span><span></span><span></span><span>•</span></div>`;
}
function updateUI(){
  const note=notes[state.index],s=activeSection();
  if(state.renderedSection!==s.id)renderScore();
  const string=stringByCode.get(note.string);
  $('currentPosition').textContent=positionCode(string,note.fret);
  $('currentNoteName').textContent=`${note.name} · ${note.code}`;
  $('currentString').innerHTML=`Cuerda ${string.name} <span>(${string.number}.ª cuerda)</span>`;
  $('currentFinger').textContent=note.fret===0?'Traste 0 · toca la cuerda al aire':`Traste ${note.fret} · dedo sugerido: ${note.finger}`;
  $('currentHint').textContent=note.fret===0?'No presiones ningún traste: deja sonar la cuerda libremente.':'Presiona cerca del traste, sin tocar la barrita metálica. Pulsa la cuerda con suavidad.';
  $('noteCounter').textContent=`Nota ${state.index+1} de ${notes.length}`;
  const value=Math.round(((state.index+1)/notes.length)*100);
  $('songProgressText').textContent=value+'%';$('songProgress').setAttribute('aria-valuenow',String(value));$('progressFill').style.width=value+'%';
  for(const el of $('fretboard').querySelectorAll('.fret-cell')){
    const selected=el.dataset.string===note.string&&Number(el.dataset.fret)===note.fret;
    el.classList.toggle('is-target',selected);
    if(selected)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current');
  }
  for(const el of $('measureGrid').querySelectorAll('button[data-index]')){
    const current=Number(el.dataset.index)===state.index;
    el.classList.toggle('current',current);
    if(current)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current');
  }
  for(const [idx,el] of scoreBarElements)el.classList.toggle('active',idx===note.barIndex);
  if(state.mode==='challenge')$('challengeScore').textContent=`${state.correct} aciertos`;
  const activeBar=scoreBarElements.get(note.barIndex);
  if(activeBar && !$('measureGrid').matches(':hover')){
    const pane=$('measureGrid');const start=activeBar.offsetLeft-pane.offsetLeft;
    if(start<pane.scrollLeft-4 || start+activeBar.offsetWidth>pane.scrollLeft+pane.clientWidth+4)
      pane.scrollTo({left:Math.max(0,start-10),behavior:'smooth'});
  }
}
function renderMode(){
  const challenge=state.mode==='challenge';
  $('learnModeBtn').classList.toggle('active',!challenge);
  $('challengeModeBtn').classList.toggle('active',challenge);
  $('learnModeBtn').setAttribute('aria-pressed',String(!challenge));
  $('challengeModeBtn').setAttribute('aria-pressed',String(challenge));
  $('modeDescription').textContent=challenge?'Toca en el diapasón la cuerda y el traste que aparecen en la nota actual. Si aciertas, avanzas automáticamente.':'Explora el diapasón, escucha las notas y avanza con los botones. Sin afán.';
  $('practiceEmoji').textContent=challenge?'🎯':'💡';
  $('practiceTip').textContent=challenge?'Cada acierto suma uno. Un error no te penaliza: vuelve a intentarlo.':'Empieza a 60–80 BPM. Cuando te salga, aumenta la velocidad.';
  $('challengeScore').hidden=!challenge;
  $('challengeScore').textContent=`${state.correct} aciertos`;
}
function changeMode(mode){stopPlayback();clearChallengeTimer();state.mode=mode;state.correct=0;state.streak=0;renderMode();showFeedback(mode==='challenge'?'🎯 Busca la cuerda y el traste resaltados. Toca la casilla correcta.':'👆 Pulsa cualquier casilla del diapasón para escucharla.');}

async function ensureAudio(){
  if(!ctx){const AudioContextClass=window.AudioContext||window.webkitAudioContext;if(!AudioContextClass)throw new Error('Este navegador no permite generar sonido.');ctx=new AudioContextClass();}
  if(ctx.state==='suspended')await ctx.resume();
}
function midiFrequency(midi){return 440*Math.pow(2,(midi-69)/12);}
function synthBass(midi,when,seconds=.48,volume=.53){
  if(!ctx)return;
  const hz=midiFrequency(midi),end=Math.max(.17,seconds),t=Math.max(ctx.currentTime+.001,when);
  const env=ctx.createGain(),filter=ctx.createBiquadFilter(),sum=ctx.createGain();
  filter.type='lowpass';filter.frequency.setValueAtTime(800,t);filter.frequency.exponentialRampToValueAtTime(250,t+Math.min(.25,end));filter.Q.value=.65;
  env.gain.setValueAtTime(.0001,t);env.gain.exponentialRampToValueAtTime(volume,t+.012);
  env.gain.exponentialRampToValueAtTime(volume*.26,t+Math.min(.23,end*.54));
  env.gain.exponentialRampToValueAtTime(.0001,t+end);
  sum.gain.value=.8;
  const fundamental=ctx.createOscillator(),harmonic=ctx.createOscillator();
  fundamental.type='triangle';fundamental.frequency.setValueAtTime(hz*1.012,t);fundamental.frequency.exponentialRampToValueAtTime(hz,t+.045);
  harmonic.type='sawtooth';harmonic.frequency.value=hz*2;
  const harmonicGain=ctx.createGain();harmonicGain.gain.value=.115;
  fundamental.connect(sum);harmonic.connect(harmonicGain);harmonicGain.connect(sum);sum.connect(filter);filter.connect(env);env.connect(ctx.destination);
  fundamental.start(t);harmonic.start(t);fundamental.stop(t+end+.03);harmonic.stop(t+end+.03);
  fundamental.onended=()=>{fundamental.disconnect();harmonic.disconnect();harmonicGain.disconnect();sum.disconnect();filter.disconnect();env.disconnect();};
}
function metronomeTick(time,isDownbeat){
  if(!ctx)return;
  const t=Math.max(ctx.currentTime+.001,time),o=ctx.createOscillator(),g=ctx.createGain();
  o.type='sine';o.frequency.value=isDownbeat?950:720;
  g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(isDownbeat?.16:.10,t+.003);g.gain.exponentialRampToValueAtTime(.001,t+.06);
  o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.07);o.onended=()=>{o.disconnect();g.disconnect();};
}
async function previewMidi(midi,duration=.55){
  try{await ensureAudio();synthBass(midi,ctx.currentTime+.01,duration);}catch(error){toast(error.message);}
}
function previewCurrent(){const note=notes[state.index];previewMidi(note.midi,Math.max(.35,note.duration*60/state.tempo*.82));}
function playbackScheduler(t){
  if(t!==transport||!ctx)return;
  const now=ctx.currentTime,lookahead=.17,step=60/t.tempo;
  while(t.nextIndex<=t.range.end){
    const note=notes[t.nextIndex],at=t.anchor+(note.start-t.startBeat)*step;
    if(at>now+lookahead)break;
    if(at>=now-.09)synthBass(note.midi,at,Math.min(1.8,note.duration*step*.90),.55);
    t.nextIndex++;
  }
  if($('metronomeToggle').checked){
    while(t.nextClick<=t.endBeat){
      const at=t.anchor+(t.nextClick-t.startBeat)*step;
      if(at>now+lookahead)break;
      if(at>=now-.09)metronomeTick(at,t.nextClick%3===0);
      t.nextClick++;
    }
  }
  const beat=t.startBeat+(now-t.anchor)/step;
  while(t.uiNext<=t.range.end && notes[t.uiNext].start<=beat+.03){
    state.index=t.uiNext;updateUI();t.uiNext++;
  }
  if(beat>t.endBeat+.08){
    const shouldLoop=$('loopToggle').checked,r=t.range;
    stopPlayback();
    if(shouldLoop){state.index=r.start;updateUI();startPlayback();}
    else showFeedback('🎶 ¡Bien hecho! Escuchaste todo el fragmento.');
  }
}
async function startPlayback(){
  if(transport)return;
  clearChallengeTimer();
  try{await ensureAudio();}catch(error){toast(error.message);return;}
  if(transport)return;
  const r=range();
  if(state.index<r.start||state.index>r.end)state.index=r.start;
  const first=notes[state.index];
  const t={range:r,tempo:state.tempo,startBeat:first.start,anchor:ctx.currentTime+.10,nextIndex:state.index,uiNext:state.index,nextClick:Math.ceil(first.start),endBeat:notes[r.end].start+notes[r.end].duration,timer:null};
  transport=t;
  $('playBtn').innerHTML='<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg><span>Pausar melodía</span>';
  showFeedback('🎧 Escucha y sigue el número resaltado.');
  playbackScheduler(t);t.timer=setInterval(()=>playbackScheduler(t),25);
}
function playPause(){transport?stopPlayback():startPlayback();}
function onFretClick(button){
  const string=STRINGS.find(s=>s.code===button.dataset.string),fret=Number(button.dataset.fret);
  if(!string)return;
  previewMidi(string.openMidi+fret,.56);
  if(state.mode==='challenge' && !transport && !state.challengeLock){
    const note=notes[state.index];
    if(note.string===string.code&&note.fret===fret){
      state.correct++;state.streak++;state.challengeLock=true;
      button.classList.add('is-good');showFeedback('✅ ¡Correcto! '+note.name+' en la cuerda '+string.name+'.');
      challengeTimer=setTimeout(()=>{
        button.classList.remove('is-good');state.challengeLock=false;challengeTimer=null;
        const r=range();
        if(state.index<r.end){state.index++;updateUI();}
        else{toast('🎉 ¡Terminaste! '+state.correct+' aciertos.');showFeedback('🎉 ¡Lo lograste! Puedes repetir el fragmento para seguir practicando.');}
      },450);
      $('challengeScore').textContent=`${state.correct} aciertos`;
    }else{
      state.streak=0;button.classList.add('is-wrong');
      showFeedback('Casi. Busca '+STRINGS.find(s=>s.code===note.string).name+', traste '+note.fret+'. Inténtalo otra vez.');
      setTimeout(()=>button.classList.remove('is-wrong'),420);
    }
  }else if(state.mode==='learn'){
    const match=notes[state.index].string===string.code&&notes[state.index].fret===fret;
    showFeedback(match?'✅ Esa es la nota que sigue. ¡Escúchala!':'🎵 Escuchaste otra nota. Prueba ahora la posición resaltada.');
  }
}
function nextSection(){const current=activeSection().id,next=(current+1)%SECTIONS.length;selectScope(state.scope==='all'?'all':String(next));if(state.scope==='all')jumpTo(firstIndexOfSection(SECTIONS[next]));}
function buildPrint(){
  const format=notationFormats[state.format];
  $('printView').innerHTML=`<img class="brand-logo" src="icons/musicala.png" alt="Musicala"><h1>Las mañanitas · Bajo eléctrico</h1><p>${format.label} · Melodía tradicional mexicana · Do mayor · 3/4</p><p>${format.help}</p><div class="print-grid">${bars.map(bar=>`<div class="print-bar"><b>Compás ${bar.barIndex+1}</b>${format.render(bar,true)}</div>`).join('')}</div>`;
}
function bindEvents(){
  $('notationPicker').addEventListener('click',event=>{
    const button=event.target.closest('button[data-format]');
    if(!button || state.format===button.dataset.format)return;
    state.format=button.dataset.format;
    for(const option of $('notationPicker').querySelectorAll('button')){
      const active=option===button;
      option.classList.toggle('active',active);
      option.setAttribute('aria-pressed',String(active));
    }
    $('notationHelp').innerHTML=notationFormats[state.format].help;
    state.renderedSection=-1;
    updateUI();
    buildPrint();
  });
  $('playBtn').addEventListener('click',playPause);
  $('restartBtn').addEventListener('click',()=>jumpTo(range().start));
  $('prevBtn').addEventListener('click',()=>jumpTo(Math.max(range().start,state.index-1),{preview:true}));
  $('nextBtn').addEventListener('click',()=>jumpTo(Math.min(range().end,state.index+1),{preview:true}));
  $('hearNoteBtn').addEventListener('click',previewCurrent);
  $('tempoSlider').addEventListener('input',(e)=>{state.tempo=Number(e.target.value);$('tempoValue').textContent=state.tempo;if(transport){stopPlayback();startPlayback();}});
  $('metronomeToggle').addEventListener('change',()=>{if(transport){stopPlayback();startPlayback();}});
  $('loopToggle').addEventListener('change',()=>{});
  $('phraseNav').addEventListener('click',(e)=>{const btn=e.target.closest('[data-scope]');if(btn)selectScope(btn.dataset.scope);});
  $('measureGrid').addEventListener('click',(e)=>{const btn=e.target.closest('button[data-index]');if(btn)jumpTo(Number(btn.dataset.index),{preview:true});});
  $('fretboard').addEventListener('click',(e)=>{const btn=e.target.closest('.fret-cell');if(btn)onFretClick(btn);});
  $('learnModeBtn').addEventListener('click',()=>changeMode('learn'));
  $('challengeModeBtn').addEventListener('click',()=>changeMode('challenge'));
  $('nextSectionBtn').addEventListener('click',nextSection);
  $('printBtn').addEventListener('click',()=>window.print());
  document.addEventListener('keydown',(e)=>{
    if(e.altKey||e.ctrlKey||e.metaKey||['INPUT','TEXTAREA','BUTTON','SELECT'].includes(document.activeElement?.tagName))return;
    if(e.code==='Space'){e.preventDefault();playPause();}
    else if(e.code==='ArrowRight'){e.preventDefault();jumpTo(Math.min(range().end,state.index+1));}
    else if(e.code==='ArrowLeft'){e.preventDefault();jumpTo(Math.max(range().start,state.index-1));}
    else if(e.code==='Enter'){e.preventDefault();previewCurrent();}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlayback();});
}
function init(){
  renderFretboard();renderPhraseNav();renderMode();buildPrint();bindEvents();updateUI();
  if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
  window.musicalaBass={notes,bars,sections:SECTIONS,getState:()=>({...state}),selectScope};
}
init();
