/* Phase 1. Native AirPlay or browser Remote Playback; no Cast SDK. */
(function(global){
  'use strict';
  global.OtrapersonaRemote=function(media,ui){
    const apple=typeof media.webkitShowPlaybackTargetPicker==='function';
    const remote=media.remote;
    const standard=!!remote&&typeof remote.prompt==='function';
    let source='none',ready=false,available=null,opening=false,watchId=null,watching=false,watchEpoch=0,error='';
    const canUse=()=>apple||standard;
    const connection=()=>media.webkitCurrentPlaybackTargetIsWireless===true||remote?.state==='connected'?'connected':remote?.state==='connecting'?'connecting':'disconnected';
    function paint(){
      const active=connection();
      // MSE/blob HLS has no transferable manifest through this API on many browsers.
      const usable=source==='hls-native'||active==='connected';
      ui.row.hidden=!canUse()||!usable;
      ui.note.hidden=ui.row.hidden;
      ui.button.disabled=!ready||opening||active==='connecting';
      ui.button.dataset.state=active;
      ui.button.setAttribute('aria-label',active==='connected'?'Cambiar salida de audio':apple?'Seleccionar salida AirPlay':'Seleccionar dispositivo de reproducción');
      ui.icon.setAttribute('href',apple?'#i-airplay':'#i-remote');
      const name=apple?'AirPlay':'Dispositivos';
      ui.label.textContent=active==='connected'?'Salida conectada':active==='connecting'?'Conectando…':name;
      ui.note.textContent=ui.row.hidden?'':error||(active==='connected'?'Reproducción en un dispositivo externo.':active==='connecting'?'Conectando al dispositivo…':available===false?'Sin dispositivos detectados. Comprueba tu red Wi-Fi.':'');
    }
    function startWatch(){
      if(apple||!standard||watching||watchId!==null||!ready||source!=='hls-native'||typeof remote.watchAvailability!=='function')return;
      watching=true;
      const epoch=++watchEpoch;
      Promise.resolve().then(()=>remote.watchAvailability(found=>{
        if(epoch!==watchEpoch)return;
        available=!!found;error='';paint();
      })).then(id=>{
        if(epoch!==watchEpoch){if(typeof remote.cancelWatchAvailability==='function')Promise.resolve(remote.cancelWatchAvailability(id)).catch(()=>{});return;}
        watchId=id;
      }).catch(()=>{if(epoch===watchEpoch){available=null;paint();}}).finally(()=>{if(epoch===watchEpoch)watching=false;});
    }
    function stopWatch(){
      watchEpoch++;watching=false;
      if(watchId!==null&&typeof remote?.cancelWatchAvailability==='function'){
        try{Promise.resolve(remote.cancelWatchAvailability(watchId)).catch(()=>{});}catch{}
      }
      watchId=null;available=null;
    }
    function change(){error='';paint();}
    if(apple){
      media.addEventListener('webkitplaybacktargetavailabilitychanged',e=>{available=e.availability==='available';change();});
      media.addEventListener('webkitcurrentplaybacktargetiswirelesschanged',change);
    }
    if(standard&&typeof remote.addEventListener==='function'){
      for(const event of ['connecting','connect','disconnect'])remote.addEventListener(event,change);
    }
    ui.button.addEventListener('click',()=>{
      if(!ready||opening||ui.row.hidden)return;
      error='';
      // Call the native picker synchronously inside the user gesture.
      if(apple){
        try{media.webkitShowPlaybackTargetPicker();}catch{error='No se pudo abrir AirPlay. Usa el selector de audio del sistema.';}
        paint();return;
      }
      if(!standard)return;
      opening=true;paint();
      try{
        Promise.resolve(remote.prompt()).catch(e=>{
          if(e?.name==='NotAllowedError'||e?.name==='AbortError')return;
          error=e?.name==='NotFoundError'?'No se encontraron dispositivos disponibles.':'El navegador no admite enviar esta fuente al dispositivo.';
        }).finally(()=>{opening=false;paint();});
      }catch{opening=false;error='No se pudo abrir el selector de dispositivos.';paint();}
    });
    paint();
    return {setSource(mode,isReady){
      if(source===mode&&ready===!!isReady)return;
      const wasReady=ready;
      if(source!==mode||(!isReady&&wasReady)){stopWatch();error='';}
      source=mode;ready=!!isReady;
      if(ready)startWatch();
      paint();
    },refresh:paint};
  };
})(window);
