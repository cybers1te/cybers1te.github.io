// Configuration Firebase de message-me.
//
// Où trouver ces valeurs : console Firebase → ⚙ Paramètres du projet →
// onglet « Général » → section « Vos applications » → ton application web →
// « Configuration du SDK » → option « Config ». Recopie chaque valeur entre
// les guillemets ci-dessous.
//
// Ces valeurs ne sont PAS secrètes : elles disent seulement à quel projet se
// connecter, et elles finissent de toute façon dans le navigateur de chaque
// visiteur. Ce qui protège les données, ce sont les règles de firestore.rules.
//
// Guide pas à pas : FIREBASE.md, à la racine du dépôt.
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
