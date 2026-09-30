import { BALANCE } from '../config/balance.js';

// Regras de combate: quem acerta quem e quanto dano chega de fato.
// Um "ataque" é { damage, damageType, canHit } (vem das capacidades da torre).

// Camada em que o inimigo anda (terrestre, voador...), a partir das traits.
export function layerOf (traits) {
    for (const t of traits) {
        const rule = BALANCE.traitRules[t];
        if (rule && rule.layer) { return rule.layer; }
    }
    return 'terrestre';
}

// A torre/projétil consegue acertar este inimigo?
export function canHit (attack, enemy) {
    return attack.canHit.includes(enemy.layer);
}

// Multiplicador de dano que o inimigo recebe de um tipo de dano (resist próprio × traits).
export function resistFor (enemy, damageType) {
    let mult = enemy.resist[damageType] ?? 1;
    for (const t of enemy.traits) {
        const rule = BALANCE.traitRules[t];
        if (!rule) { continue; }
        if (rule.resist) { mult *= rule.resist[damageType] ?? 1; }
        if (rule.resistWhileShielded && enemy.shield > 0) { mult *= rule.resistWhileShielded[damageType] ?? 1; }
    }
    return mult;
}

// Dano final (arredondado) de um ataque bruto contra o inimigo.
export function finalDamage (enemy, amount, damageType) {
    return Math.round(amount * resistFor(enemy, damageType));
}
