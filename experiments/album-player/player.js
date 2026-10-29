import { createDemoAudio } from "./demo.js";

const byId = (id) => document.getElementById(id);
const audio = byId("audio");
const playButton = byId("play");
const coverPlayButton = byId("cover-play");
const previousButton = byId("previous");
const nextButton = byId("next");
const seek = byId("seek");
const status = byId("status");
const trackList = byId("tracks");

let album = null;
let activeIndex = -1;
let demoObjectUrl = null;
let scrubbing = false;
let startingPlayback = false;

function message(text) {
  status.textContent = text;
}

function clock(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  return String(minutes).padStart(2, "0") + ":" + String(whole % 60).padStart(2, "0");
}

function usableDuration() {
  return Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
}

function currentIndex(time) {
  if (!album) return -1;
  let index = 0;
  for (let i = 1; i < album.tracks.length; i++) {
    if (time + 0.05 >= album.tracks[i].start) index = i;
    else break;
  }
  return index;
}

// Duración y posición de una pista lógica dentro del archivo continuo.
function trackWindow(index = activeIndex) {
  const total = usableDuration();
  if (!album || !total || index < 0 || !album.tracks[index]) return null;
  const start = album.tracks[index].start;
  const next = album.tracks[index + 1]?.start ?? total;
  const end = Math.max(start, Math.min(total, next));
  return { start, end, duration: Math.max(0, end - start) };
}

function mediaArtwork() {
  const source = album.mediaArtwork || album.cover;
  const url = new URL(source, location.href);
  const ext = url.pathname.toLowerCase().split(".").pop();
  const type = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" }[ext] || "image/png";
  const artwork = { src: url.href, type };
  // El PNG de prueba es de 128 × 128 para evitar errores de renderizado en iOS.
  if (source.endsWith("cover-128.png")) artwork.sizes = "128x128";
  return [artwork];
}

function mediaMetadata() {
  if (!album || !("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
  const track = album.tracks[activeIndex < 0 ? 0 : activeIndex];

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: album.artist,
      album: album.title,
      artwork: mediaArtwork()
    });
  } catch (error) {
    console.warn("No se pudieron actualizar los metadatos", error);
  }
  navigator.mediaSession.playbackState = audio.paused ? "paused" : "playing";
}

function mediaPosition() {
  if (!("mediaSession" in navigator) || !("setPositionState" in navigator.mediaSession)) return;
  const window = trackWindow();
  if (!window || window.duration <= 0) return;
  try {
    // La plataforma recibe el tiempo de la pista, no el del archivo completo.
    // Safari puede ignorarlo y mostrar la duración total del elemento <audio>.
    navigator.mediaSession.setPositionState({
      duration: window.duration,
      playbackRate: audio.playbackRate,
      position: Math.max(0, Math.min(audio.currentTime - window.start, window.duration))
    });
  } catch {
    // La compatibilidad con setPositionState varía entre navegadores.
  }
}

function update() {
  const total = usableDuration();
  const ready = total > 0;
  const time = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;

  const nextIndex = currentIndex(time);
  const changed = nextIndex !== activeIndex;
  activeIndex = nextIndex;
  const window = trackWindow();
  const trackDuration = window?.duration || 0;
  const trackElapsed = window ? Math.max(0, Math.min(time - window.start, trackDuration)) : 0;

  const isPlaying = !audio.paused && !audio.ended;
  playButton.disabled = !album;
  coverPlayButton.disabled = !album;
  previousButton.disabled = !ready;
  nextButton.disabled = !ready || !album || activeIndex >= album.tracks.length - 1;
  seek.disabled = !ready;
  playButton.classList.toggle("is-playing", isPlaying);
  coverPlayButton.classList.toggle("is-playing", isPlaying);
  playButton.setAttribute("aria-label", isPlaying ? "Pausar" : "Reproducir");
  coverPlayButton.setAttribute("aria-label", isPlaying ? "Pausar álbum" : "Reproducir álbum");

  if (changed) {
    if (album && activeIndex >= 0) {
      byId("current-track").textContent = album.tracks[activeIndex].title;
    }
    trackList.querySelectorAll(".track-row").forEach((button, i) => {
      const selected = i === activeIndex;
      button.classList.toggle("active", selected);
      if (selected) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
    mediaMetadata();
  }

  byId("duration").textContent = clock(trackDuration);
  if (!scrubbing) {
    byId("elapsed").textContent = clock(trackElapsed);
    seek.max = trackDuration || 100;
    seek.value = ready ? trackElapsed : 0;
    seek.style.setProperty("--progress", (trackDuration ? Math.min(100, trackElapsed / trackDuration * 100) : 0) + "%");
  }

  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }
  mediaPosition();
}

function ensureAudioSource() {
  if (audio.getAttribute("src")) return true;
  if (!album) return false;
  try {
    // Esta preparación es síncrona para mantener la activación del usuario:
    // la llamada a audio.play() ocurre dentro del mismo evento de clic.
    demoObjectUrl = createDemoAudio();
    audio.src = demoObjectUrl;
    audio.load();
    return true;
  } catch (error) {
    message("No se pudo preparar la demostración sonora.");
    console.error(error);
    return false;
  }
}

async function play() {
  if (!ensureAudioSource()) return;
  startingPlayback = true;
  message("Iniciando reproducción…");
  try {
    await audio.play();
    message("Reproduciendo.");
  } catch (error) {
    message("El navegador no pudo iniciar el audio. Intenta reproducir de nuevo.");
    console.warn("No se pudo iniciar el audio", error);
  } finally {
    startingPlayback = false;
    update();
  }
}

function togglePlayback() {
  if (!audio.paused && !audio.ended) audio.pause();
  else void play();
}

function seekTo(position) {
  if (!usableDuration()) return;
  audio.currentTime = Math.max(0, Math.min(position, usableDuration()));
  update();
}

function seekWithinTrack(position) {
  const window = trackWindow();
  if (!window || !Number.isFinite(position)) return;
  // Evita que el seek se desplace al tema siguiente de forma accidental.
  const last = Math.max(window.start, window.end - 0.05);
  seekTo(Math.max(window.start, Math.min(window.start + position, last)));
}

function jumpTo(index) {
  if (!usableDuration() || !album || !album.tracks[index]) return;
  seekTo(album.tracks[index].start);
  void play();
}

function previous() {
  if (!album || activeIndex < 0) return;
  const start = album.tracks[activeIndex].start;
  if (audio.currentTime - start > 3) jumpTo(activeIndex);
  else jumpTo(Math.max(0, activeIndex - 1));
}

function next() {
  if (!album || activeIndex < 0) return;
  if (activeIndex < album.tracks.length - 1) jumpTo(activeIndex + 1);
}

function renderTracks() {
  trackList.replaceChildren();
  album.tracks.forEach((track, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "track-row";
    button.disabled = true;

    const number = document.createElement("span");
    number.className = "track-number";
    number.textContent = String(index + 1).padStart(2, "0");

    const name = document.createElement("span");
    name.className = "track-title";
    name.textContent = track.title;

    const arrow = document.createElement("span");
    arrow.className = "track-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";

    button.append(number, name, arrow);
    button.addEventListener("click", () => jumpTo(index));
    item.append(button);
    trackList.append(item);
  });
}

function enableTracks() {
  const ready = usableDuration() > 0;
  trackList.querySelectorAll(".track-row").forEach((button) => {
    button.disabled = !ready;
  });
}

function installMediaSession() {
  if (!("mediaSession" in navigator)) return;
  const session = navigator.mediaSession;
  const actions = {
    play: () => { void play(); },
    pause: () => audio.pause(),
    previoustrack: previous,
    nexttrack: next,
    seekto: (details) => {
      // El sistema recibe la duración de cada pista lógica.
      if (Number.isFinite(details.seekTime)) seekWithinTrack(details.seekTime);
    }
  };
  for (const [action, handler] of Object.entries(actions)) {
    try { session.setActionHandler(action, handler); }
    catch { /* Acción no disponible en este navegador. */ }
  }

  // En iOS los handlers ±10 s sustituyen los botones de pistas.
  // Limpiar ambos y registrar de nuevo al evento "playing".
  for (const action of ["seekbackward", "seekforward"]) {
    try { session.setActionHandler(action, null); }
    catch { /* Acción no disponible. */ }
  }
}

function validateAlbum(raw) {
  if (!raw || !Array.isArray(raw.tracks) || raw.tracks.length === 0) {
    throw new Error("El manifiesto requiere una lista de pistas.");
  }
  const tracks = raw.tracks.map((track) => ({
    title: String(track.title || "").trim(),
    start: Number(track.start)
  }));
  if (tracks.some((t) => !t.title || !Number.isFinite(t.start) || t.start < 0) ||
      tracks[0].start !== 0 ||
      tracks.some((t, i) => i > 0 && t.start <= tracks[i - 1].start)) {
    throw new Error("Las pistas requieren nombres y posiciones crecientes desde 0.");
  }
  return {
    title: String(raw.title || "Sin título"),
    artist: String(raw.artist || "Artista"),
    year: String(raw.year || ""),
    cover: typeof raw.cover === "string" && raw.cover ? raw.cover : "./cover.svg",
    mediaArtwork: typeof raw.mediaArtwork === "string" && raw.mediaArtwork
      ? raw.mediaArtwork : (raw.cover || "./cover.svg"),
    audio: typeof raw.audio === "string" && raw.audio ? raw.audio : null,
    tracks
  };
}

async function initialize() {
  try {
    const response = await fetch("./album.json", { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo leer album.json (" + response.status + ").");
    album = validateAlbum(await response.json());

    byId("album-title").textContent = album.title;
    byId("album-artist").textContent = album.artist;
    byId("album-year").textContent = album.year;
    byId("cover").src = new URL(album.cover, location.href).href;
    byId("cover").alt = "Portada de " + album.title;
    byId("track-count").textContent = String(album.tracks.length).padStart(2, "0");
    byId("current-track").textContent = album.tracks[0].title;
    renderTracks();
    installMediaSession();

    if (album.audio) {
      audio.src = new URL(album.audio, location.href).href;
      audio.load();
      message("Cargando álbum…");
    } else {
      message("Prototipo sin disco cargado. Pulsa Play para escuchar la señal de prueba.");
    }
    update();
  } catch (error) {
    message("Error de configuración: " + error.message + " Ejecuta la página desde un servidor HTTP(S).");
    console.error(error);
  }
}

playButton.addEventListener("click", togglePlayback);
coverPlayButton.addEventListener("click", togglePlayback);
previousButton.addEventListener("click", previous);
nextButton.addEventListener("click", next);

seek.addEventListener("input", () => {
  scrubbing = true;
  byId("elapsed").textContent = clock(Number(seek.value));
  const duration = trackWindow()?.duration || 0;
  seek.style.setProperty("--progress", (duration ? Number(seek.value) / duration * 100 : 0) + "%");
});
seek.addEventListener("change", () => {
  seekWithinTrack(Number(seek.value));
  scrubbing = false;
  update();
});

audio.addEventListener("loadedmetadata", () => {
  enableTracks();
  update();
  if (!startingPlayback) message("Álbum preparado. Pulsa Reproducir.");
});
audio.addEventListener("timeupdate", update);
audio.addEventListener("durationchange", () => { enableTracks(); update(); });
audio.addEventListener("play", update);
audio.addEventListener("playing", () => {
  // Safari puede activar los botones externos solo tras iniciar audio real.
  installMediaSession();
  mediaMetadata();
  update();
});
audio.addEventListener("pause", () => {
  update();
  if (!audio.ended && !startingPlayback) message("Pausado.");
});
audio.addEventListener("ended", () => { message("Fin del álbum."); update(); });
audio.addEventListener("error", () => {
  message("No se pudo cargar el audio. Comprueba la ruta, el formato y el alojamiento HTTP.");
  update();
});

document.addEventListener("visibilitychange", update);
window.addEventListener("pagehide", () => {
  // No se revoca el Blob: el reproductor debe seguir reproduciendo.
  // El navegador liberará la URL de objeto al cerrar el documento.
});

void initialize();
