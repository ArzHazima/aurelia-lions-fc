// The club's identity in one place. Everything is fictional.
const base = import.meta.env?.BASE_URL ?? '/';

export const CLUB = {
  name: 'Aurelia Lions FC',
  short: 'Aurelia Lions',
  stadium: 'Aurelia Park',
  founded: 1924,
  crest: `${base}crest.svg`,
  chant: 'COME ON YOU LIONS!',
};
