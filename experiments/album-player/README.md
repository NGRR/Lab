# LAB/001 — Album Player

Prototipo de reproductor web para un **álbum continuo** orientado a móviles. Diseñado para reproducir un único archivo de audio con capítulos navegables, de modo que el paso entre pistas no requiera abrir una fuente nueva cuando la pantalla está bloqueada.

## Estado

- HTML5 `<audio>` como motor principal (no usa Web Audio para reproducir).
- Controles de reproducir, pausar, retroceder, avanzar y buscar.
- Media Session API: metadatos y acciones de pantalla bloqueada cuando el dispositivo las admite.
- Pistas virtuales definidas por posiciones de tiempo dentro de un único archivo.
- Interfaz adaptable y sin dependencias, rastreadores ni servidores propios.
- Demostración WAV **original** de 66 segundos, generada localmente al pulsar **Play** (portada o controles).
- Sin audio comercial ni disco real incluido.
- PWA/offline **no implementados** en esta versión.

## Ejecutar

Servir el repositorio por HTTP, por ejemplo:

```bash
python3 -m http.server 8000
```

Abrir `http://localhost:8000/experiments/album-player/` y pulsar **Play** sobre la portada o en los controles inferiores. Si el manifiesto no incluye un archivo, se genera automáticamente la demostración sonora y comienza a reproducirse.

No abrir `index.html` con el esquema `file://`, porque `fetch("./album.json")` requiere un entorno HTTP(S) compatible.

## Incorporar un disco

1. Exportar una **mezcla continua** del álbum, preferentemente MP3 o M4A/AAC con un formato que soporte el público objetivo.
2. Guardarla, por ejemplo, en `assets/album.mp3` (creando la carpeta localmente), o usar una URL HTTPS que permita CORS si está en otro dominio.
3. Editar `album.json`:

```json
{
  "title": "Nombre del disco",
  "artist": "Nombre del artista",
  "year": 2026,
  "cover": "./assets/portada.jpg",
  "mediaArtwork": "./assets/portada-128.png",
  "audio": "./assets/album.mp3",
  "tracks": [
    { "title": "Primera pista", "start": 0 },
    { "title": "Segunda pista", "start": 211.5 },
    { "title": "Tercera pista", "start": 398.2 }
  ]
}
```

Las posiciones están en **segundos desde el comienzo del álbum**, deben crecer estrictamente y comenzar en 0. El listado no corta ni concatena archivos: al saltar a una pista se cambia `audio.currentTime`. La duración total se lee de los metadatos del archivo. Para controles de bloqueo, `mediaArtwork` debe apuntar a un PNG o JPEG cuadrado (el prototipo incluye `cover-128.png`, derivado de la portada SVG). La portada visual de la web (`cover`) puede seguir siendo SVG. En iOS la representación concreta queda a criterio de WebKit.

## Interacción y diseño

- Botón de portada circular, negro al 60 % de opacidad, con reproducción/pausa sincronizada.
- Controles SVG planos de alto contraste y acentos ocres, con estados accesibles.
- Barra de progreso visual por pista, navegación entre pistas y transiciones respetuosas con `prefers-reduced-motion`.

## Integración con los controles de iPhone

- La sesión registra `previoustrack` y `nexttrack`, sin registrar `seekbackward` y `seekforward`; los saltos de ±10 s en iOS pueden desplazar los botones de pista.
- Los handlers se registran otra vez cuando el audio dispara `playing`, pues algunas versiones de Safari no los consideran activos si se registran antes de iniciar.
- Media Session publica el título actual y una posición/duración relativa a cada pista virtual mediante `setPositionState`. Si el navegador no respeta esa API, puede seguir mostrando el archivo completo.
- El archivo de audio sigue siendo uno solo. Esta técnica no crea verdaderos archivos independientes; la navegación externa es una mejora condicionada a WebKit.
- `seekto` se mapea desde la posición relativa de la pista a `audio.currentTime` del álbum continuo.
- En el prototipo, el artwork de pantalla bloqueada se deriva en PNG 128 × 128 de la portada SVG; en un disco real conviene proporcionar PNG/JPEG independiente.

## Reproducción en segundo plano

El navegador puede mantener activo un elemento HTML5 Audio al cambiar de aplicación o bloquear el teléfono, pero esto **no es una garantía del sistema operativo**. Es especialmente importante verificar iOS/Safari con el teléfono físico, porque puede haber restricciones de reproducción, suspensión, metadatos o controles remotos. El diseño con audio continuo reduce la dependencia de que JavaScript pueda iniciar la siguiente pista cuando el dispositivo esté bloqueado.

El demo usa un `Blob` WAV, y su compatibilidad con reproducción en segundo plano puede diferir de la de un MP3/M4A alojado por HTTP. Probar ambos escenarios por separado. El usuario debe comenzar la reproducción mediante una interacción directa; no se pretende eludir las políticas de autoplay.

### Protocolo de verificación

1. Iniciar reproducción con Safari en iPhone y Chrome en Android.
2. Bloquear pantalla durante al menos 60 segundos y verificar que el audio no se detenga.
3. Probar pausa/reproducción y salto de pista desde los controles externos.
4. Repetir con el navegador minimizado, con auriculares Bluetooth y tras una llamada.
5. Repetir con un archivo MP3/M4A real alojado por HTTPS. Registrar navegador, versión del sistema y resultado.

## Publicación

Es un sitio estático. Puede publicarse usando GitHub Pages desde la raíz de la rama `main`. Si Pages queda habilitado, la ruta prevista es:

`https://ngrr.github.io/Lab/experiments/album-player/`

La URL anterior no implica que GitHub Pages esté activado actualmente.

**Licencia:** la raíz del repositorio contiene `LICENSE` con CC0 1.0. No incorporar grabaciones, portadas o material de terceros sin revisar antes sus derechos y los términos de publicación. Los archivos musicales no se han subido al repositorio.

## Próximas iteraciones

- Pruebas en iOS/Android reales y corrección según resultados.
- Soporte de fuentes alternativas MP3/M4A y validación de metadatos.
- Selector de álbum y catálogo.
- Modo instalable PWA y descarga offline con consentimiento explícito, sujetos a pruebas de almacenamiento y compatibilidad.
