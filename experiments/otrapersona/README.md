# Otrapersona

Página musical y enlaces. HTML5 Audio y Media Session, sin dependencias externas.

## Publicar

Incorporar la carpeta `assets/` del paquete entregado: `portada.jpg`, `portada-512.jpg` y `otrapersona.mp3`. Los archivos binarios aún no están en GitHub. No usar enlaces a audios de prueba ni sustituir los másteres. Para probar localmente, servir la carpeta con `python -m http.server 8000`.

## Contenido

- Cimiento (4:33) y Cobijos de tierra (3:38), en el orden de los archivos entregados. Los dos MP3 originales se ensamblaron mediante copia de flujo con FFmpeg, sin recodificación. Duración total aproximada: 8:11.
- Portada original íntegra, con una versión cuadrada JPEG de 512 px para Media Session.
- Completar los cuatro valores de links en album.json con URLs HTTPS. Mientras estén vacíos no hay navegación.
- Se mantiene el archivo continuo y metadatos/tiempos por pista lógica. iOS puede ignorar la posición relativa o elegir sus propios controles.
- El campo de álbum usa provisionalmente Otrapersona, sin inventar un título independiente.
