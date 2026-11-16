# Otrapersona

Página musical y enlaces. HTML5 Audio y Media Session, con HLS nativo o HLS.js alojado localmente.

## Publicar

El sitio utiliza exclusivamente HLS cifrado, servido desde `assets/stream/`. Las fuentes de audio deben conservarse fuera del repositorio. Consultar [HLS.md](./HLS.md) para regeneración local. Para probar localmente, servir la carpeta con `python -m http.server 8000`.

## Contenido

- Cimiento (4:33) y Cobijos de tierra (3:38), en el orden de los archivos entregados. La versión pública es AAC estéreo de 256 kbps, segmentada y cifrada. Duración total aproximada: 8:11.
- Portada original íntegra, con una versión cuadrada JPEG de 512 px para Media Session.
- Completar los cuatro valores de links en album.json con URLs HTTPS. Mientras estén vacíos no hay navegación.
- Se mantiene el archivo continuo y metadatos/tiempos por pista lógica. iOS puede ignorar la posición relativa o elegir sus propios controles.
- El campo de álbum usa provisionalmente Otrapersona, sin inventar un título independiente.

## Salida de audio — fase 1

- AirPlay: selector nativo en Safari/WebKit mediante `webkitShowPlaybackTargetPicker()`. El control aparece al disponer de HLS nativo; informa de conexión y detección cuando el sistema los comunica.
- Remote Playback API: selector del navegador cuando existe soporte para la fuente HLS nativa. No se simula compatibilidad de Chromecast en HLS.js/MSE.
- El mismo elemento de audio conserva el manifiesto cifrado; no se añade una fuente MP3 ni se modifica la clave.
- Prueba física pendiente: iniciar una canción en Safari, elegir AirPlay, conectar a un dispositivo de la misma red, cambiar de pista, bloquear la pantalla y volver a la salida local. En navegadores sin soporte el botón se oculta.
- Google Cast SDK y receptor de TV quedan para la fase 2.

## Propiedad intelectual

El contenido musical y gráfico está excluido de CC0. [Todos los derechos reservados](./RIGHTS.md), sin perjuicio de la legislación, las condiciones de GitHub y los permisos anteriores válidos.
