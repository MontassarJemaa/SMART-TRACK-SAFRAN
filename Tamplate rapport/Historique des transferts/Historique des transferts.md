---
name: Aerospace Precision System
colors:
  surface: '#f7f9fc'
  surface-dim: '#d8dadd'
  surface-bright: '#f7f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f7'
  surface-container: '#eceef1'
  surface-container-high: '#e6e8eb'
  surface-container-highest: '#e0e3e6'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f4'
  outline: '#75777e'
  outline-variant: '#c5c6ce'
  surface-tint: '#515e7e'
  primary: '#04122e'
  on-primary: '#ffffff'
  primary-container: '#1a2744'
  on-primary-container: '#828eb1'
  inverse-primary: '#b9c6eb'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#031427'
  on-tertiary: '#ffffff'
  tertiary-container: '#19293d'
  on-tertiary-container: '#8090a8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#b9c6eb'
  on-primary-fixed: '#0d1b37'
  on-primary-fixed-variant: '#3a4665'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fc'
  on-background: '#191c1e'
  surface-variant: '#e0e3e6'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  baseline: 4px
  gutter: 24px
  margin-page: 48px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

Le design narratif de ce système repose sur trois piliers : la précision industrielle, la fiabilité aéronautique et la clarté analytique. Destiné à un environnement de haute technologie, l'interface doit évoquer la rigueur d'un instrument de bord tout en conservant la lisibilité d'un rapport professionnel de haut niveau.

Le style adopté est **Corporate / Modern** avec une influence **Minimaliste**. L'accent est mis sur la hiérarchie de l'information et la réduction du bruit visuel pour permettre une prise de décision rapide. L'esthétique globale est sobre, structurée par des lignes nettes et des espaces de respiration généreux, rappelant la mise en page soignée des documents techniques PDF et des tableaux de bord d'ingénierie.

## Colors

La palette chromatique est ancrée dans l'identité institutionnelle de l'aéronautique. 

*   **Bleu Marine (#1a2744) :** Utilisé pour la typographie principale, les en-têtes et les éléments structurels forts. Il incarne l'autorité et la stabilité.
*   **Bleu Électrique (#3b82f6) :** Couleur d'accentuation pour les actions primaires, les liens et les indicateurs de progression.
*   **Gris Surface (#f4f6f9) :** Fond de section et conteneurs pour séparer les zones de données sans alourdir le design.
*   **Blanc (#ffffff) :** Priorisé pour le fond de page (format A4) afin de garantir un contraste maximal lors de la lecture ou de l'impression.

Le système utilise des variantes sémantiques pour le statut des composants : Vert (Succès), Ambre (Attention) et Rouge (Critique), toujours désaturées pour rester en harmonie avec le ton professionnel.

## Typography

Ce système utilise exclusivement la police **Inter**. Son dessin géométrique et technique assure une lisibilité parfaite, que ce soit sur des écrans haute densité ou des rapports imprimés.

Les titres (Headlines) utilisent des graisses semi-bold à bold pour marquer les sections du rapport. Le corps de texte (Body) privilégie la clarté avec un interlignage aéré (1.5x). Les étiquettes (Labels) sont souvent présentées en majuscules avec un espacement de lettres accru pour les métadonnées techniques et les en-têtes de colonnes, renforçant l'aspect "fiche technique".

## Layout & Spacing

Le système repose sur une **grille fixe de 12 colonnes** pour les versions desktop et rapports PDF, s'adaptant à un format A4 portrait. 

*   **Marges :** Des marges de sécurité de 48px (1.25cm environ) sont appliquées sur les bords extérieurs pour l'aspect "document".
*   **Rythme vertical :** Basé sur une unité de 4px (baseline grid). Les composants sont espacés par des multiples de 8px pour maintenir une cohérence mathématique.
*   **Adaptabilité :** Sur tablette, la grille passe à 8 colonnes avec des gouttières de 16px. Sur mobile, une colonne unique avec des marges de 16px est privilégiée.

Les données sont organisées en modules rectangulaires, évitant les compositions trop denses pour privilégier le balayage visuel des indicateurs clés (KPI).

## Elevation & Depth

La hiérarchie visuelle est établie par des **calques tonaux** et des **ombres ambiantes très diffuses**. Contrairement à un style purement plat, ce système utilise la profondeur pour détacher les cartes de données du fond de page.

1.  **Niveau 0 (Fond) :** Blanc pur ou Gris de surface pour les zones de contenu secondaire.
2.  **Niveau 1 (Cartes/Conteneurs) :** Fond blanc avec une bordure fine de 1px (#e2e8f0) et une ombre portée très légère (Y: 2px, Blur: 4px, Opacité: 5%, couleur Navy).
3.  **Niveau 2 (Survols/Modales) :** Ombre plus marquée pour indiquer l'interactivité, augmentant la sensation de flottement au-dessus de la page.

L'utilisation de bordures est privilégiée aux ombres fortes pour conserver l'aspect "ingénierie" et faciliter l'impression du document.

## Shapes

Le langage des formes est **Soft (Adouci)**. 

L'utilisation d'un rayon de courbure de 0.25rem (4px) pour les boutons et les champs de saisie, et de 0.5rem (8px) pour les cartes de données, permet de casser la rigidité industrielle sans tomber dans un aspect ludique. Les éléments restent perçus comme des outils de précision. 

Les indicateurs de statut (badges) peuvent adopter une forme "Pill" (totalement arrondie) pour se distinguer nettement des éléments structurels rectangulaires.

## Components

Les composants de ce système sont conçus pour la densité d'information et la clarté technique :

*   **Boutons :** Le bouton primaire est Navy (#1a2744) avec texte blanc. Le bouton secondaire est une version "Outline" avec bordure bleue.
*   **Cartes (Cards) :** Conteneurs blancs avec bordures fines. Elles regroupent les KPIs ou les graphiques de suivi.
*   **Tableaux de données :** Lignes de 48px de hauteur minimum. Alternance de couleurs de lignes (zebra-striping) très subtile en Gris Surface. En-têtes en Navy avec typographie Label-sm.
*   **Champs de saisie :** Bordure grise neutre, passant au Bleu Secondaire lors du focus. Étiquettes toujours placées au-dessus du champ.
*   **Badges de statut :** Petites étiquettes avec fond coloré très clair (pastels) et texte de couleur vive pour une identification immédiate de l'état des actifs (ex: "En transit", "Maintenance", "Livré").
*   **Visualisation de données :** Utilisation de lignes fines pour les graphiques, avec le bleu secondaire comme série principale. Suppression des quadrillages non essentiels pour maximiser le ratio data-encre.