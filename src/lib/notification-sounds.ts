/**
 * Notification Sound — REX Finance
 * Son professionnel et discret généré via Web Audio API
 * Compatible Android, iPhone, Desktop, PWA
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Son de validation: 3 notes montantes douces (professionnel)
 */
export async function playValidationSound() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const notes = [523.25, 659.25, 783.99]; // Do Mi Sol (accord majeur)
    const noteLength = 0.12;
    const now = ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * noteLength);

      gain.gain.setValueAtTime(0, now + i * noteLength);
      gain.gain.linearRampToValueAtTime(0.18, now + i * noteLength + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * noteLength + noteLength);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * noteLength);
      osc.stop(now + i * noteLength + noteLength + 0.05);
    });
  } catch {
    // Silently fail if audio is not available
  }
}

/**
 * Son de notification informatif (1 note)
 */
export async function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // La5

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch {
    // Silently fail
  }
}

/**
 * Son d'erreur/refus discret
 */
export async function playErrorSound() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.2);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch {
    // Silently fail
  }
}
