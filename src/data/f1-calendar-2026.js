// 2026 F1 Calendar (dates are approximate — update when official calendar is confirmed)
const f1Calendar2026 = [
  { round: 1, name: "Australian Grand Prix", location: "Melbourne", date: "2026-03-15" },
  { round: 2, name: "Chinese Grand Prix", location: "Shanghai", date: "2026-03-29" },
  { round: 3, name: "Japanese Grand Prix", location: "Suzuka", date: "2026-04-05" },
  { round: 4, name: "Bahrain Grand Prix", location: "Sakhir", date: "2026-04-19" },
  { round: 5, name: "Saudi Arabian Grand Prix", location: "Jeddah", date: "2026-05-03" },
  { round: 6, name: "Miami Grand Prix", location: "Miami", date: "2026-05-17" },
  { round: 7, name: "Emilia Romagna Grand Prix", location: "Imola", date: "2026-05-31" },
  { round: 8, name: "Monaco Grand Prix", location: "Monte Carlo", date: "2026-06-07" },
  { round: 9, name: "Spanish Grand Prix", location: "Barcelona", date: "2026-06-21" },
  { round: 10, name: "Canadian Grand Prix", location: "Montreal", date: "2026-06-28" },
  { round: 11, name: "Austrian Grand Prix", location: "Spielberg", date: "2026-07-12" },
  { round: 12, name: "British Grand Prix", location: "Silverstone", date: "2026-07-19" },
  { round: 13, name: "Belgian Grand Prix", location: "Spa", date: "2026-08-02" },
  { round: 14, name: "Hungarian Grand Prix", location: "Budapest", date: "2026-08-09" },
  { round: 15, name: "Dutch Grand Prix", location: "Zandvoort", date: "2026-08-30" },
  { round: 16, name: "Italian Grand Prix", location: "Monza", date: "2026-09-06" },
  { round: 17, name: "Azerbaijan Grand Prix", location: "Baku", date: "2026-09-20" },
  { round: 18, name: "Singapore Grand Prix", location: "Marina Bay", date: "2026-10-04" },
  { round: 19, name: "United States Grand Prix", location: "Austin", date: "2026-10-18" },
  { round: 20, name: "Mexico City Grand Prix", location: "Mexico City", date: "2026-10-25" },
  { round: 21, name: "Brazilian Grand Prix", location: "Sao Paulo", date: "2026-11-08" },
  { round: 22, name: "Las Vegas Grand Prix", location: "Las Vegas", date: "2026-11-22" },
  { round: 23, name: "Qatar Grand Prix", location: "Lusail", date: "2026-11-29" },
  { round: 24, name: "Abu Dhabi Grand Prix", location: "Yas Marina", date: "2026-12-06" },
];

export const getNextRace = () => {
  const now = new Date();
  return f1Calendar2026.find((race) => new Date(race.date) > now) || null;
};

export const getDaysUntil = (dateStr) => {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export default f1Calendar2026;
