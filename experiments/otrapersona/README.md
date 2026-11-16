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

## Otrapersona Connect (experimental)

- Teléfono: abrir el reproductor y seleccionar Conectar a TV por Internet.
- TV: abrir `https://ngrr.github.io/Lab/tv/` (acceso corto al receptor; guardar en favoritos), activar receptor y reproducir; introducir en el teléfono el código de 12 caracteres que muestra el televisor.
- Control remoto por HTTPS con consulta periódica (1.5–3 s, con reconexión). No requiere compartir Wi-Fi; ambos requieren Internet. El volumen se controla en la TV. El dispositivo TV debe admitir el flujo HLS existente.
- Código de un solo uso, caducidad de 5 minutos antes de vincular; sesión de máximo 2 horas. Tokens aleatorios por rol, almacenados como hashes en el backend. No se publican credenciales administrativas. Límite de 60 sesiones activas.
- Backend: función Edge `otrapersona-connect` en el proyecto Supabase existente, tabla aislada con RLS y RPC accesible únicamente por service_role. La función realiza autenticación propia por token de sesión; no modifica otros datos del proyecto. No es Google Cast ni enciende el televisor; el usuario debe abrir su navegador y activar el sonido. La supresión del proceso del teléfono en segundo plano puede detener el mando.
- La prueba física del navegador Samsung sigue pendiente. La música, cifrado y los 62 segmentos no cambian.

## Bridge — apertura remota del navegador

[Instalación y prueba local](./bridge/README.md). Puente Python en la LAN del Samsung; el teléfono puede estar en LTE. No afecta HLS, AirPlay ni Connect. Solo abre la URL fija, sujeto al firmware.
