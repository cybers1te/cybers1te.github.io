// Tests du moteur de la démonstration (commerces fictifs, aucune dépendance).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SHOPS, answer, fold, greeting, isOpen, nextOpening, weekText } from '../site/moteur.js';

const shop = (id) => SHOPS.find((s) => s.id === id);
// Vendredi 2 octobre 2026.
const at = (h, m = 0, day = 2) => new Date(2026, 9, day, h, m);

describe('horaires', () => {
  it('ouvert ou fermé selon l\'heure', () => {
    assert.equal(isOpen(shop('salon'), at(10)), true);
    assert.equal(isOpen(shop('salon'), at(23, 10)), false);
    assert.equal(isOpen(shop('restaurant'), at(16)), false, 'entre les deux services');
    assert.equal(isOpen(shop('salon'), at(10, 0, 4)), false, 'dimanche');
  });

  it('prochaine ouverture', () => {
    assert.equal(nextOpening(shop('restaurant'), at(16)), 'aujourd\'hui à 18 h 30');
    assert.equal(nextOpening(shop('salon'), at(23, 10)), 'demain à 9 h');
    assert.equal(nextOpening(shop('salon'), at(18, 0, 3)), 'mardi à 9 h', 'samedi soir : fermé dimanche et lundi');
  });

  it('semaine résumée, jours identiques regroupés', () => {
    assert.equal(weekText(shop('sport')), 'du lundi au vendredi de 6 h 30 à 22 h ; samedi et dimanche de 8 h à 18 h.');
    assert.match(weekText(shop('salon')), /^lundi : fermé ; du mardi au vendredi de 9 h à 18 h 30/);
  });
});

describe('réponses', () => {
  it('reconnaît le sujet de la question', () => {
    const topic = (id, q) => answer(shop(id), q, at(23, 10)).topic;
    assert.equal(topic('salon', 'Combien coûte une coupe ?'), 'prix');
    assert.equal(topic('salon', 'Quels sont vos horaires ?'), 'horaires');
    assert.equal(topic('restaurant', 'Comment réserver une table ?'), 'reservation');
    assert.equal(topic('sport', 'Comment s\'inscrire ?'), 'reservation');
    assert.equal(topic('restaurant', 'Vous êtes où ?'), 'adresse');
    assert.equal(topic('institut', 'On peut payer par carte ?'), 'paiement');
    assert.equal(topic('restaurant', 'Avez-vous des plats végétariens ?'), 'precision');
    assert.equal(topic('institut', 'bonjour'), 'salut', '« bonjour » ne déclenche pas les bons cadeaux');
  });

  it('chaque question proposée a une vraie réponse', () => {
    for (const s of SHOPS) {
      for (const q of s.questions) assert.notEqual(answer(s, q, at(11)).topic, 'inconnu', `${s.name} : ${q}`);
    }
  });

  it('répond pour le jour demandé', () => {
    assert.equal(answer(shop('restaurant'), 'Êtes-vous ouverts dimanche ?', at(11)).text, 'Le dimanche, nous sommes ouverts de 12 h à 15 h.');
    assert.match(answer(shop('salon'), 'Vous êtes ouverts lundi ?', at(11)).text, /^Le lundi, nous sommes fermés\./);
    assert.match(answer(shop('salon'), 'et demain ?', at(11)).text, /^Demain, nous sommes ouverts de 9 h à 17 h\./);
  });

  it('« ce soir » : dit si c\'est déjà fermé', () => {
    assert.equal(answer(shop('sport'), 'À quelle heure fermez-vous ce soir ?', at(20)).text, 'Oui, nous sommes ouverts en ce moment, jusqu\'à 22 h.');
    assert.equal(answer(shop('sport'), 'À quelle heure fermez-vous ce soir ?', at(23, 10)).text, 'Nous avons fermé à 22 h. Prochaine ouverture : demain à 8 h.');
  });

  it('ne sait pas : le dit, sans rien inventer', () => {
    const r = answer(shop('salon'), 'Vous vendez des chaussures ?', at(23, 10));
    assert.equal(r.topic, 'inconnu');
    assert.match(r.text, /Je n'ai pas cette information/);
    assert.match(r.text, /le salon rouvre demain à 9 h/);
    assert.equal(answer(shop('salon'), '   ', at(10)).topic, 'vide');
  });

  it('accueil selon l\'heure, accents ignorés', () => {
    assert.match(greeting(shop('restaurant'), at(23, 10)), /répondeur du Petit Quai\. Nous sommes fermés pour l'instant \(réouverture demain à 12 h\)/);
    assert.match(greeting(shop('institut'), at(10)), /répondeur de l'Institut Capucine\. Nous sommes ouverts en ce moment/);
    assert.equal(fold('Végétarien ?'), 'vegetarien ?');
    assert.equal(answer(shop('restaurant'), 'VEGETARIEN', at(10)).topic, 'precision');
  });
});
