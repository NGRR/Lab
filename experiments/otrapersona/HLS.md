# Distribución HLS — Otrapersona

La única fuente pública es `assets/stream/album.m3u8`. No se publica el archivo musical maestro ni existe una ruta de respaldo MP3.

HLS VOD continuo, AAC estéreo a 256 kbps, 62 segmentos de aproximadamente 8 segundos. Cifrado AES-128-CBC con clave binaria de 16 bytes, padding PKCS#7 e IV de 128 bits derivado del número de secuencia del segmento. La clave se distribuye junto al manifiesto para permitir la escucha pública: no constituye DRM y no impide la extracción deliberada.

Safari emplea HLS nativo; los navegadores compatibles restantes usan HLS.js 1.7.4, alojado localmente. La generación y decodificación fueron verificadas. La reproducción con pantalla bloqueada en iPhone requiere una comprobación física.

## Regeneración local

Conservar las fuentes de audio fuera del repositorio. Ejecutar `python3 experiments/otrapersona/tools/build_hls.py /ruta/privada/al/audio-continuo.mp3` con FFmpeg y OpenSSL instalados. El script valida la decodificación e incorpora una clave aleatoria nueva. Publicar solo los segmentos, el manifiesto y su clave, nunca el archivo fuente.
