import { typeMultiplier } from './types.js';

// Simulates a full turn-based battle up front and returns a log the UI can
// step through. Each log entry carries the HP snapshot after that event so
// the UI just needs to render entries in order.
export function simulateBattle(cardA, cardB) {
  const a = { ...cardA, hp: cardA.maxHp };
  const b = { ...cardB, hp: cardB.maxHp };
  const log = [];

  const pushLog = (text) =>
    log.push({ text, hp1: a.hp, hp2: b.hp, max1: a.maxHp, max2: b.maxHp });

  pushLog(`${a.title} and ${b.title} enter the arena!`);

  const aFirst = a.spd === b.spd ? Math.random() < 0.5 : a.spd > b.spd;
  const order = aFirst ? [a, b] : [b, a];
  pushLog(`${order[0].title} moves first — higher speed!`);

  let round = 1;
  const maxRounds = 30;
  while (a.hp > 0 && b.hp > 0 && round <= maxRounds) {
    for (const attacker of order) {
      const defender = attacker === a ? b : a;
      if (attacker.hp <= 0 || defender.hp <= 0) continue;

      const mult = typeMultiplier(attacker.type.key, defender.type.key);
      const variance = Math.round((Math.random() - 0.5) * 6);
      const dmg = Math.max(2, Math.round(attacker.atk * mult - defender.def * 0.5 + variance));
      defender.hp = Math.max(0, defender.hp - dmg);

      const flavor =
        mult > 1 ? ' — genre-bending critical hit!' : mult < 1 ? ' — thematic mismatch, glancing blow.' : '';
      pushLog(`${attacker.title} hits ${defender.title} for ${dmg}${flavor}`);

      if (defender.hp <= 0) break;
    }
    round++;
  }

  const aWon = a.hp > 0;
  pushLog(`${aWon ? a.title : b.title} wins the battle!`);

  return { log, winner: aWon ? cardA : cardB };
}
