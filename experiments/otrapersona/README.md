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

## Propiedad intelectual

El contenido musical y gráfico está excluido de CC0. [Todos los derechos reservados](./RIGHTS.md), sin perjuicio de la legislación, las condiciones de GitHub y los permisos anteriores válidos.
