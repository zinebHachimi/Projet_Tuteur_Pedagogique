export function normaliserQcm(texte) {
  return texte
    .replace(/(\S)[ \t]+([B-D][.)])\s/g, "$1\n$2 ")
    .replace(/(\S)[ \t]+(Réponse\s*:|Explication\s*:)/g, "$1\n$2")
    .replace(/([^\n])\n(Question\s*\d+)/g, "$1\n\n$2");
}
