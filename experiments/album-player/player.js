import { createDemoAudio } from "./demo.js";

const byId = (id) => document.getElementById(id);
const audio = byId("audio");
const playButton = byId("play");
const previousButton = byId("previous");
const nextButton = byId("next");
const seek = byId("seek");
const demoButton = byId("demo");
const status = byId("status");
const trackList = byId("tracks");

let album = null;
let activeIndex = -1;
let demoObjectUrl = null;
let scrubbing = false;

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

function mediaMetadata() {
  if (!album || !("mediaSession" in navigator)) return;
  const track = album.tracks[activeIndex < 0 ? 0 : activeIndex];

  if (typeof MediaMetadata !== "undefined") {
    const art = new URL(album.cover, location.href);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: album.artist,
      album: album.title,
      artwork: [{ src: art.href, type: art.pathname.toLowerCase().endsWith(".svg") ? "image/svg+xml" : "image/jpeg" }]
    });
  }
  navigator.mediaSession.playbackState = audio.paused ? "paused" : "playing";
}

function mediaPosition() {
  if (!("mediaSession" in navigator) || !("setPositionState" in navigator.mediaSession)) return;
  const duration = usableDuration();
  if (!duration) return;
  try {
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate: audio.playbackRate,
      position: Math.max(0, Math.min(audio.currentTime, duration))
    });
  } catch {
    // Algunas implementaciones rechazan estado de posición.
  }
}

function update() {
  const duration = usableDuration();
  const ready = duration > 0;
  const time = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;

  playButton.disabled = !ready;
  previousButton.disabled = !ready;
  nextButton.disabled = !ready;
  seek.disabled = !ready;
  playButton.textContent = !audio.paused ? "Ⅱ" : "▶";
  playButton.setAttribute("aria-label", !audio.paused ? "Pausar" : "Reproducir");

  byId("duration").textContent = clock(duration);
  if (!scrubbing) {
    byId("elapsed").textContent = clock(time);
    seek.max = duration || 100;
    seek.value = ready ? Math.max(0, Math.min(time, duration)) : 0;
  }

  const nextIndex = currentIndex(time);
  if (nextIndex !== activeIndex) {
    activeIndex = nextIndex;
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

  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = audio.paused ? "paused" : "playing";
  }
  mediaPosition();
}

async function play() {
  if (!audio.getAttribute("src")) return;
  try {
    await audio.play();
    message("Reproduciendo.");
  } catch (error) {
    message("El navegador impidió iniciar el audio. Inicia desde el botón Reproducir.");
    console.warn("No se pudo iniciar el audio", error);
  }
  update();
}

function seekTo(position) {
  if (!usableDuration()) return;
  audio.currentTime = Math.max(0, Math.min(position, usableDuration()));
  update();
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
  const actions = {
    play: () => { void play(); },
    pause: () => audio.pause(),
    previoustrack: previous,
    nexttrack: next,
    seekto: (details) => {
      if (Number.isFinite(details.seekTime)) seekTo(details.seekTime);
    },
    seekbackward: (details) => seekTo(audio.currentTime - (details.seekOffset || 10)),
    seekforward: (details) => seekTo(audio.currentTime + (details.seekOffset || 10))
  };
  for (const [action, handler] of Object.entries(actions)) {
    try { navigator.mediaSession.setActionHandler(action, handler); }
    catch { /* Acción no disponible en este navegador. */ }
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
      demoButton.hidden = false;
      message("Sin audio publicado. Carga la demostración para probar el reproductor.");
    }
  } catch (error) {
    message("Error de configuración: " + error.message + " Ejecuta la página desde un servidor HTTP(S).");
    console.error(error);
  }
}

playButton.addEventListener("click", () => {
  if (audio.paused) void play();
  else audio.pause();
});
previousButton.addEventListener("click", previous);
nextButton.addEventListener("click", next);

seek.addEventListener("input", () => {
  scrubbing = true;
  byId("elapsed").textContent = clock(Number(seek.value));
});
seek.addEventListener("change", () => {
  seekTo(Number(seek.value));
  scrubbing = false;
  update();
});

demoButton.addEventListener("click", () => {
  demoButton.disabled = true;
  message("Generando demostración WAV original…");
  try {
    demoObjectUrl = createDemoAudio();
    audio.src = demoObjectUrl;
    audio.load();
    demoButton.hidden = true;
    message("Demostración preparada. Pulsa Reproducir.");
  } catch (error) {
    demoButton.disabled = false;
    message("No se pudo generar la demostración.");
    console.error(error);
  }
});

audio.addEventListener("loadedmetadata", () => {
  enableTracks();
  update();
  message("Álbum preparado. Pulsa Reproducir.");
});
audio.addEventListener("timeupdate", update);
audio.addEventListener("durationchange", () => { enableTracks(); update(); });
audio.addEventListener("play", update);
audio.addEventListener("pause", update);
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
