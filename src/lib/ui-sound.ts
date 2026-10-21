type UiSound = 'section' | 'theme' | 'success';

let context: AudioContext | null = null;

export function playUiSound(kind: UiSound): void {
  try {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    context ||= new AudioContextCtor();
    if (context.state === 'suspended') void context.resume();
    const now = context.currentTime;
    const notes = kind === 'theme' ? [392, 523.25, 659.25] : kind === 'success' ? [523.25, 659.25, 783.99] : [330, 440];
    notes.forEach((frequency, index) => {
      const oscillator = context!.createOscillator();
      const gain = context!.createGain();
      oscillator.type = kind === 'theme' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.045);
      gain.gain.setValueAtTime(0.0001, now + index * 0.045);
      gain.gain.exponentialRampToValueAtTime(kind === 'section' ? 0.018 : 0.024, now + index * 0.045 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.045 + 0.16);
      oscillator.connect(gain).connect(context!.destination);
      oscillator.start(now + index * 0.045);
      oscillator.stop(now + index * 0.045 + 0.18);
    });
  } catch {
    // Audio is an enhancement; a blocked or unavailable audio device never affects the app.
  }
}
