(function(global){
'use strict';
const endpoint='https://eqdhxepqsutufynonacr.supabase.co/functions/v1/otrapersona-connect';
global.OtrapersonaConnect=function(adapter){
const $=id=>document.getElementById(id),tv=new URLSearchParams(location.search).get('tv')==='1';
let id=null,token=null,epoch=0,ack=0,blocked=false,busy=false,online=false,paired=false,dragging=false,sourceReady=false,timer=null,creating=false;
const fmt=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
const msg=t=>{$('connectMessage').textContent=t;};
const controls=()=>$('connectControls').querySelectorAll('button,input');
const setControls=()=>{controls().forEach(e=>e.disabled=!online||busy);};
function panel(show){$('connectPanel').hidden=!show;$('connectLaunch').setAttribute('aria-expanded',String(show))}
async function api(action,data={}){
 const controller=typeof AbortController!=='undefined'?new AbortController():null;
 const timeout=controller?setTimeout(()=>controller.abort(),12000):null;
 try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data}),cache:'no-store',signal:controller?controller.signal:undefined});const j=await r.json();if(!r.ok||j.error)throw Error(j.error||'network');return j;}finally{if(timeout!==null)clearTimeout(timeout)}
}
function withSession(action,data={}){return api(action,{id,token,...data})}
function reset(text){
 epoch++;creating=false;clearTimeout(timer);timer=null;id=token=null;busy=online=paired=blocked=false;ack=0;dragging=false;
 $('connectControls').hidden=true;$('connectClose').hidden=true;$('connectCode').hidden=true;
 $('connectPhone').hidden=tv;$('connectCreate').disabled=!sourceReady;$('connectPair').disabled=false;
 setControls();msg(text||'');
}
function schedule(e,delay){if(e===epoch&&id)timer=setTimeout(()=>poll(e),delay);}
async function execute(cmd){
 if(!cmd)return;
 if(cmd.type==='pause'){adapter.pause();blocked=false;return;}
 if(cmd.type==='play'){blocked=!(await adapter.play());return;}
 if(cmd.type==='seek'){blocked=!adapter.seek(cmd.value);return;}
 if(cmd.type==='track'){const ok=await adapter.jump(cmd.value);blocked=!ok;return;}
}
async function poll(e){
 if(e!==epoch||!id)return;
 try{
  if(tv){
   const a=adapter.audio;
   const r=await withSession('tv',{status:{position:Math.max(0,Math.min(492,Number(a.currentTime)||0)),playing:!a.paused&&!a.ended,ack,blocked}});
   if(e!==epoch)return;
   if(r.paired&&!paired){paired=true;$('connectCode').hidden=true;msg('Teléfono vinculado. Control remoto activo.');}
   if(r.seq>ack){try{await execute(r.cmd)}catch{blocked=true}if(e!==epoch)return;ack=r.seq;if(blocked)msg('Usa Play en el televisor si el navegador bloqueó la orden.');else msg('Teléfono vinculado. Control remoto activo.');}
   schedule(e,paired?1500:3000);
  }else{
   const r=await withSession('phone');if(e!==epoch)return;
   online=!!r.online;busy=Number(r.status?.ack||0)<Number(r.seq||0);
   const t=Number(r.status?.position)||0;$('connectTrack').textContent=adapter.track(t)+' · '+(r.status?.playing?'Reproduciendo en TV':'Pausado en TV');
   if(!dragging){$('connectSeek').value=t;$('connectTime').textContent=fmt(t);$('connectSeek').style.setProperty('--progress',(100*t/491.83)+'%')}
   msg(!online?'Televisor sin conexión.':r.status?.blocked?'El televisor requiere una acción local.':busy?'Enviando orden…':'TV vinculada.');setControls();schedule(e,2000);
  }
 }catch(err){if(e!==epoch)return;if(err.message==='not_found'){reset('Sesión finalizada o caducada.');return;}online=false;setControls();msg('Conexión interrumpida. Reintentando…');schedule(e,5000);}
}
async function create(){
 if(id||creating||!sourceReady)return;creating=true;$('connectCreate').disabled=true;
 // Playback starts on the TV itself from an explicit gesture, before any network await.
 const activation=adapter.play();const e=++epoch;msg('Creando sesión…');
 try{await activation;if(e!==epoch)return;const r=await api('create');if(e!==epoch)return;
  id=r.id;token=r.token;ack=0;blocked=adapter.audio.paused;paired=false;
  $('connectCode').textContent=r.code.match(/.{4}/g).join('-');$('connectCode').hidden=false;$('connectClose').hidden=false;msg('Código válido durante cinco minutos.');poll(e);
 }catch(err){if(e===epoch)reset(err.message==='capacity'?'Capacidad temporal alcanzada.':'No se pudo activar el receptor.');}
}
async function pair(){
 const code=$('connectInput').value.replace(/[\s-]/g,'').toUpperCase();
 if(!/^[0-9A-F]{12}$/.test(code)){msg('Introduce los 12 caracteres del código.');return;}
 $('connectPair').disabled=true;msg('Vinculando…');const e=++epoch;
 try{const r=await api('pair',{code});if(e!==epoch)return;id=r.id;token=r.token;adapter.pause();$('connectInput').value='';$('connectPhone').hidden=true;$('connectControls').hidden=false;$('connectClose').hidden=false;online=true;setControls();poll(e);}
 catch(err){if(e===epoch)reset(err.message==='not_found'?'Código inválido, utilizado o caducado.':'No se pudo vincular. Comprueba Internet.');}
}
async function send(type,value){
 if(tv||!id||!online||busy)return;busy=true;setControls();msg('Enviando orden…');const e=epoch;
 try{await withSession('send',{command:{type,value}});}
 catch(err){if(e!==epoch)return;msg(err.message==='offline'?'Televisor no disponible.':'Orden no enviada.');}
}
$('connectLaunch').addEventListener('click',()=>panel($('connectPanel').hidden));
$('connectCreate').addEventListener('click',create);$('connectPair').addEventListener('click',pair);
$('connectInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!$('connectPair').disabled)pair()});
$('connectClose').addEventListener('click',()=>{const req=id?withSession('close'):Promise.resolve();reset('Sesión desvinculada.');req.catch(()=>{});});
$('connectControls').querySelectorAll('[data-connect-command]').forEach(b=>b.addEventListener('click',()=>send(b.dataset.connectCommand,b.dataset.value===undefined?null:Number(b.dataset.value))));
$('connectSeek').addEventListener('input',()=>{dragging=true;$('connectTime').textContent=fmt(Number($('connectSeek').value));});
$('connectSeek').addEventListener('change',()=>{dragging=false;send('seek',Number($('connectSeek').value));});
$('connectSeek').addEventListener('pointercancel',()=>{dragging=false;});
adapter.audio.addEventListener('playing',()=>{if(tv)blocked=false;});
if(tv){document.body.classList.add('tv-mode');panel(true);$('connectPhone').hidden=true;$('connectTV').hidden=false;}
return {sourceReady(value){sourceReady=!!value;if(!id)$('connectCreate').disabled=!sourceReady||creating;}};
};
})(window);
