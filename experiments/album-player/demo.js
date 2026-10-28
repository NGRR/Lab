/**
 * Señal sonora original generada localmente para comprobar reproducción HTML5.
 * WAV PCM mono, 11 025 Hz, tres secciones, un solo archivo continuo.
 * No utiliza AudioContext durante la reproducción: el elemento <audio>
 * reproduce un Blob WAV como fuente multimedia normal.
 */
export function createDemoAudio() {
  const rate = 11025;
  const seconds = 66;
  const total = rate * seconds;
  const wav = new ArrayBuffer(44 + total * 2);
  const view = new DataView(wav);

  function stringAt(pos, string) {
    for (let i = 0; i < string.length; i++) view.setUint8(pos + i, string.charCodeAt(i));
  }

  stringAt(0, "RIFF");
  view.setUint32(4, 36 + total * 2, true);
  stringAt(8, "WAVE");
  stringAt(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  stringAt(36, "data");
  view.setUint32(40, total * 2, true);

  const notes = [
    [82.41, 123.47, 164.81],
    [73.42, 110.00, 146.83],
    [65.41, 98.00, 130.81]
  ];

  for (let i = 0; i < total; i++) {
    const time = i / rate;
    const part = Math.min(2, Math.floor(time / 22));
    const f = notes[part];
    const envelope = Math.min(1, time / 2, (seconds - time) / 2);
    const pulse = .73 + .27 * Math.sin(time * .51);
    const signal = (
      .45 * Math.sin(2 * Math.PI * f[0] * time) +
      .25 * Math.sin(2 * Math.PI * f[1] * time + .4 * Math.sin(time * .15)) +
      .16 * Math.sin(2 * Math.PI * f[2] * time) +
      .07 * Math.sin(2 * Math.PI * (f[0] / 2) * time)
    );
    const sample = Math.max(-1, Math.min(1, .43 * envelope * pulse * signal));
    view.setInt16(44 + 2 * i, Math.round(sample * 32767), true);
  }

  return URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
}
