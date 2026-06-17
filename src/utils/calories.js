function getMET(speedKmh) {
  if (speedKmh < 3.2) return 2.5;
  if (speedKmh < 4.8) return 3.5;
  if (speedKmh < 6.4) return 4.8;
  return 6.5;
}

export function calcCalories({ distanceMeters, durationSeconds, weightKg, gender, avgSpeedKmh }) {
  if (!weightKg || durationSeconds < 1) return 0;
  const speed = avgSpeedKmh ?? (distanceMeters / 1000) / (durationSeconds / 3600);
  const met = getMET(speed);
  const hours = durationSeconds / 3600;
  let cal = met * weightKg * hours;
  if (gender === 'female') cal *= 0.85;
  return Math.round(cal);
}
