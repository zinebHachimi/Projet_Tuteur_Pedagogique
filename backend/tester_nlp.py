from app.services.nlp_service import traduire_texte, resumer_texte

FENCE = "`" * 3

texte_fr = """La tour Eiffel est l'un des monuments les plus célèbres du monde.
Elle se trouve à Paris, en France, et a été construite par Gustave Eiffel
pour l'Exposition universelle de 1889. Elle mesure environ 330 mètres de
hauteur, antennes comprises. Chaque année, des millions de touristes
viennent la visiter pour admirer sa beauté et profiter d'une vue magnifique
sur la ville. Elle représente un symbole important de la France et attire
des visiteurs du monde entier. Aujourd'hui, elle est considérée comme un
chef-d'œuvre architectural et un incontournable pour toute personne qui
visite Paris."""

print("=== TRADUCTION fr -> en ===")
trad, source = traduire_texte(texte_fr, "en")
print("Langue détectée :", source)
print(trad)

print("\n=== RÉSUMÉ ===")
print(resumer_texte(texte_fr))

print("\n=== TRADUCTION AVEC MARKDOWN ===")
exercice = (
    "## Exercice 1\n"
    "- Explique le principe de KNN.\n"
    "- Donne un exemple.\n\n"
    f"{FENCE}python\n"
    'print("code non traduit")\n'
    f"{FENCE}\n"
)
print(traduire_texte(exercice, "en")[0])