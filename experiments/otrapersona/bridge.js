(function(){
'use strict';
const $=id=>document.getElementById(id);
const endpoint='https://eqdhxepqsutufynonacr.supabase.co/functions/v1/otrapersona-bridge';
let busy=false;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function say(text){$('bridgeStatus').textContent=text;}
async function api(action,data){
 const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data}),cache:'no-store'});
 const j=await r.json();if(!r.ok||j.error)throw Error(j.error||'network');return j;
}
$('bridgeLaunch').addEventListener('click',()=>{
 const show=$('bridgeForm').hidden;$('bridgeForm').hidden=!show;$('bridgeLaunch').setAttribute('aria-expanded',String(show));if(show)$('bridgeCode').focus();
});
async function open(){
 if(busy)return;
 const code=$('bridgeCode').value.replace(/[\s-]/g,'').toUpperCase();
 if(!/^[0-9A-F]{12}$/.test(code)){say('Introduce el código de 12 caracteres que muestra Bridge en tu PC.');return;}
 busy=true;$('bridgeSend').disabled=true;say('Solicitando apertura…');
 try{
 const s=await api('open',{code});$('bridgeCode').value='';
 say('Orden recibida. Esperando al computador…');
 for(let i=0;i<45;i++){
  await sleep(2000);
  const r=await api('status',{id:s.id,token:s.token});
  if(r.state==='sent'){say('Orden enviada al Samsung. Comprueba la pantalla; pulsa Activar receptor y reproducir si se abre.');return;}
  if(r.state==='failed'){say('El computador no pudo enviar la orden al Samsung. Revisa su consola.');return;}
 }
 say('Sin confirmación del computador. Comprueba la TV y Bridge.');
 }catch(e){say(e.message==='not_found'?'Código inválido, caducado, ocupado o Bridge desconectado.':'No se pudo confirmar la solicitud. Comprueba Internet y el computador.');}
 finally{busy=false;$('bridgeSend').disabled=false}
}
$('bridgeSend').addEventListener('click',open);
$('bridgeCode').addEventListener('keydown',e=>{if(e.key==='Enter')open()});
})();
