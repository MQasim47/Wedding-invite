// Ticks a callback every second with the remaining time breakdown.
// Returns a stop() function to clear the interval.
export function startCountdown(targetDateISO, onTick) {
  const target = new Date(targetDateISO).getTime();

  function compute() {
    const diff = target - Date.now();
    if (diff <= 0) {
      return { done: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { done: false, days, hours, minutes, seconds };
  }

  onTick(compute());
  const intervalId = setInterval(() => onTick(compute()), 1000);
  return () => clearInterval(intervalId);
}
