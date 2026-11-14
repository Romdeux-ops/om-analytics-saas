# Moteur de simulation et de prédiction v1 — document de conception (phase 1)

Statut : **proposition, en attente de validation**. Aucun code de moteur n'est écrit.
Date : 14 novembre 2026 (J10 jouée, prochain match : Marseille – Le Mans, J11, 22 novembre).

Tous les chiffres viennent d'un backtest **exploratoire** lancé pour ce document (script jetable, hors dépôt).
Ils servent à trancher les choix de conception. Le backtest de référence sera refait proprement en phase 3 ;
les ordres de grandeur ne devraient pas bouger, les troisièmes décimales si.

---

## 1. Résumé

1. **Dixon-Coles hiérarchique avec a priori Elo est confirmé comme moteur de référence**, mais pas pour la raison
   attendue. Sur les probabilités 1/N/2, il fait **jeu égal avec l'Elo seul** (RPS 0,2080 contre 0,2082, écart
   +0,0002 ± 0,0005). Son intérêt mesuré est la **grille de scores** (log-vraisemblance du score exact 2,977
   contre 2,989) et le fait qu'il fournit λ domicile / λ extérieur, dont la simulation a besoin.
2. **Le gain principal ne vient pas du modèle mais de l'historique.** Remplacer « classement de la saison en
   cours » par « historique multi-saisons » fait passer le RPS de 0,2153 à 0,2080 (−0,0073 ± 0,0025), et de
   0,2244 à 0,2007 sur les cinq premières journées. Tout le reste (ρ, pondération temporelle, type d'a priori)
   pèse moins de 0,001, c'est-à-dire **moins que le bruit de mesure**.
3. **Trois composants du cadrage ne passent pas la règle d'admission (décision 5)** sur ces données : la
   correction ρ des petits scores, la pondération temporelle et le repos. Je propose de garder ρ et la
   pondération (coût nul, justification structurelle) en le disant clairement, et de sortir le repos de la
   probabilité de référence. Voir § 5.
4. **Les cotes de clôture restent meilleures** : RPS 0,2027, soit −0,0053 ± 0,0016 par rapport au modèle. C'est
   le plafond réaliste, et l'écart à annoncer dans le mémoire.
5. **Simulation « score d'abord »** (conception i), avec un résultat utile : les probabilités en direct ont alors
   une **forme close exacte**, cohérente avec le générateur par construction (§ 6).
6. **Sources : deux bonnes surprises, un problème.** football-data.org donne tout le calendrier de la Ligue 1 en
   une requête avec le jeton actuel ; le CSV 2026-27 de football-data.co.uk contient désormais des xG. En
   revanche **ClubElo a répondu HTTP 502 à chaque tentative** : je n'ai pas pu vérifier sa couverture des promus.
   Je propose un Elo calculé en interne, qui a servi au backtest (§ 3.2).

---

## 2. Ce que j'ai vérifié sur les sources

### 2.1 football-data.co.uk (CSV `mmz4281/<saison>/F1.csv`)

Téléchargé : Ligue 1 de 2014-15 à 2026-27 (13 fichiers) et Ligue 2 sur la même période. L'URL répond par une
redirection 302 qu'il faut suivre.

| Élément | Constat |
|---|---|
| Résultats, mi-temps | `FTHG, FTAG, FTR, HTHG, HTAG` présents partout |
| Statistiques | `HS, AS, HST, AST, HF, AF, HC, AC, HY, AY, HR, AR` présents sur les 13 saisons |
| Cotes de clôture | `AvgCH/AvgCD/AvgCA` depuis 2019-20 ; `PSCH/PSCD/PSCA` (Pinnacle) avant |
| xG | `HxG, AxG` **présents dans le fichier 2026-27 seulement** (90 matchs, 3,14 xG/match) |
| Volume | 380 matchs/saison jusqu'en 2022-23, **306 depuis 2023-24** (18 clubs), **279 en 2019-20** (saison arrêtée) |
| Fraîcheur | Le fichier 2026-27 contient la J10 (dernier match : 8 novembre) |
| Noms | Stables, mais différents des nôtres (`Paris SG` contre `Paris-SG`) : table d'alias à ajouter |
| Ce qui manque | Minutes des buts et des cartons, remplacements, hors-jeu, possession, matchs de coupe et d'Europe |

Conséquence pour la décision 11 : des xG existent maintenant sans scraping, mais sur **une demi-saison**. Ils ne
peuvent pas être backtestés, donc ils restent hors de la probabilité de référence (règle 5). L'emplacement prévu
dans le JSON pourra être rempli dès la v1 à titre informatif, et le test d'admission deviendra possible à la fin
de la saison.

### 2.2 Avantage du domicile et Covid (mesuré)

| Saison | Buts dom. | Buts ext. | % victoires dom. | % nuls | % victoires ext. |
|---|---|---|---|---|---|
| 2014-15 à 2018-19 (moyenne) | 1,48 | 1,10 | 45,5 | 26,1 | 28,4 |
| 2019-20 (279 matchs) | 1,49 | 1,03 | 48,0 | 25,1 | 26,9 |
| **2020-21 (huis clos)** | **1,40** | **1,36** | **37,4** | 25,0 | **37,6** |
| 2021-22 à 2025-26 (moyenne) | 1,54 | 1,28 | 43,5 | 24,5 | 32,0 |
| 2026-27 (90 matchs) | 1,63 | 1,32 | 46,7 | 22,2 | 31,1 |

L'avantage du domicile a **disparu** en 2020-21. La Ligue 1 2019-20 a été arrêtée en mars 2020, avant les huis
clos : rien à corriger sur cette saison. Choix proposé : un paramètre d'avantage du domicile **séparé pour
2020-21**. Effet mesuré : RPS 0,2102 contre 0,2150 sur la saison 2020-21 elle-même, effet nul ensuite (0,2039
dans les deux cas sur 2021-23). Aujourd'hui ces matchs pèsent presque rien ; le paramètre séparé sert surtout à
rendre le backtest honnête sur les saisons de validation.

### 2.3 Fréquences d'événements (2023-24 à 2025-26, 918 matchs)

| Par match (deux équipes) | Valeur mesurée | Constante du moteur provisoire |
|---|---|---|
| Buts | 2,83 (dom. 1,55 / ext. 1,29) | λ dérivé de 1,4 par équipe |
| Tirs | 25,0 (dom. 13,7 / ext. 11,3) | λ / 0,135, soit environ 21 |
| Tirs cadrés | 9,03 (36,1 % des tirs) | 38 % des tirs non convertis |
| Buts par tir / par tir cadré | 0,113 / 0,314 | xG moyen 0,135 |
| Corners | 9,45 | environ 9 |
| Fautes | 24,4 | environ 21 |
| Jaunes | 3,79 (dom. 1,77 / ext. 2,03) ; 0,156 par faute | 0,14 par faute |
| Rouges | 0,231 | environ 0,1 |
| Part des buts en 1re période | 44,0 % | uniforme |
| Buts par équipe : moyenne / variance | 1,416 / 1,589 | — |
| Tirs par équipe : moyenne / variance | 12,5 / 26,8 (surdispersion nette) | Bernoulli par minute |

Non mesurable sur ces fichiers, donc à documenter comme valeur par défaut avec source externe : minute des buts
à l'intérieur d'une période, minute des cartons, nombre et minute des remplacements, hors-jeu, temps additionnel,
taux de contrôle VAR.

### 2.4 ClubElo — non vérifié

`http://api.clubelo.com/<club>` et `/<date>` ont renvoyé **HTTP 502** à chaque essai (plusieurs tentatives réparties sur
la session, avec et sans en-tête de navigateur) ; `clubelo.com` renvoie 403. Je ne peux donc confirmer ni
le format, ni la couverture de Le Mans et Troyes en divisions inférieures. À retenter en phase 2.

### 2.5 football-data.org — calendrier complet accessible

Vérifié avec le jeton existant (offre gratuite) :

- `GET /v4/competitions/FL1` → `currentMatchday = 11`.
- `GET /v4/competitions/FL1/matches?matchday=11` → **les 9 affiches réelles**, dont Marseille – Le Mans
  (22 novembre, 20 h 45).
- `GET /v4/competitions/FL1/matches` → **306 matchs de la saison en une seule requête**, dont 90 terminés.

La synchro passe de 2 à 3 requêtes par exécution, loin de la limite de 10 par minute. Cette requête unique donne
aussi **tous les résultats de la saison en cours** : la reconstruction d'un historique à partir de la forme ESPN
des 18 clubs (§ 4.3 du cahier des charges) devient inutile, ce qui supprime d'un coup les trois pièges signalés
(doublons, matchs européens, données de secours codées en dur).

---

## 3. Comparaison des approches

### 3.1 Les candidates

| Approche | Principe | Ce qu'elle donne | Ajustable sur nos données ? |
|---|---|---|---|
| **A. Ancien modèle** | Buts pour/contre de la saison, 4 matchs fictifs, constantes 1,12 / 0,90, double Poisson | Grille de scores | Oui, mais une seule saison |
| **B. Elo → λ** | Elo séquentiel, puis régression de Poisson des buts sur l'écart d'Elo | Grille de scores (attaque et défense liées) | Oui |
| **C. Poisson indépendant** (Maher 1982) | Attaque et défense par club, avantage du domicile, maximum de vraisemblance | Grille de scores | Oui |
| **D. Dixon-Coles** (1997) | C + correction ρ des scores 0-0, 1-0, 0-1, 1-1 + pondération exponentielle du passé | Grille de scores | Oui |
| **E. D + a priori hiérarchique Elo** | D, avec forces tirées vers la valeur prédite par l'Elo (écart-type σ) | Grille de scores, incertitude par club | Oui |
| **F. Markov / modèle à états** | Transitions entre états de jeu (possession, zone, tir…) | Déroulé complet | **Non** : aucune donnée d'événements |

F est écarté de la v1, comme prévu par le cadrage. Le contrat `SimulationEngine` suffit à l'accueillir plus tard
sans modification.

### 3.2 Protocole du backtest exploratoire

- Données : Ligue 1 2014-15 à 2026-27, 4 327 matchs.
- **Fenêtre glissante sans fuite** : pour chaque jour de match, ajustement sur les matchs strictement antérieurs
  (fenêtre de 1 500 jours), prédiction des matchs du jour.
- Hyperparamètres (demi-vie, σ, K de l'Elo, note d'entrée des promus) choisis sur **2018-19 à 2022-23**, puis
  figés. Test sur **2023-24, 2024-25, 2025-26** (918 matchs). 2026-27 (90 matchs) rapportée à part.
- Elo **calculé en interne** sur les mêmes CSV (K = 20 × √écart de buts, avantage du domicile 60 points), faute
  d'accès à ClubElo. Un promu entre à 1 450, valeur réglée sur la validation.
- Ajustement de E : attaque/défense par maximum a posteriori (Newton par blocs), puis ρ par recherche à une
  dimension. C'est une approximation en deux temps ; l'ajustement joint sera fait en phase 2.
- Les ± sont des erreurs-types de différences appariées par match. Elles ignorent la corrélation entre matchs
  d'une même journée et sont donc un peu optimistes.

### 3.3 Résultats sur le test (918 matchs, 3 saisons complètes)

| Modèle | RPS | Log-loss | Brier | Log-vrais. score exact | ΔRPS contre E |
|---|---|---|---|---|---|
| (1) Fréquences de base | 0,2326 | 1,0688 | 0,6467 | — | +0,0247 ± 0,0042 |
| (3) A. Ancien modèle | 0,2153 | 1,0195 | 0,6119 | 3,0456 | +0,0073 ± 0,0025 |
| D classique (ni a priori ni pondération) | 0,2088 | 1,0022 | 0,5990 | 2,9840 | +0,0009 ± 0,0015 |
| (2) B. Elo → λ | 0,2082 | 0,9997 | 0,5974 | 2,9887 | +0,0002 ± 0,0005 |
| **E. Dixon-Coles + a priori Elo** | **0,2080** | **0,9992** | **0,5972** | **2,9770** | référence |
| (4) Cotes de clôture | 0,2027 | 0,9816 | 0,5856 | — | −0,0053 ± 0,0016 |

Sur la saison en cours (90 matchs) : E 0,2024, B 0,2030, A 0,2250, cotes 0,1949. Même hiérarchie, intervalles
quatre fois plus larges.

### 3.4 Effet du petit échantillon

RPS selon le nombre de matchs déjà joués dans la saison (test, 3 saisons) :

| Tranche | n | A. Ancien | B. Elo | E. DC + Elo | E sans a priori Elo | Cotes |
|---|---|---|---|---|---|---|
| J1 à J5 | 135 | **0,2244** | 0,2007 | 0,2007 | 0,1998 | 0,1962 |
| J6 à J11 | 164 | 0,2201 | 0,2061 | 0,2071 | 0,2106 | 0,1991 |
| J12 et après | 619 | 0,2120 | 0,2104 | 0,2098 | 0,2105 | 0,2050 |

- L'ancien modèle fait **pire que les fréquences de base** (0,2237) sur J1-J5. Il ne rattrape les autres qu'après
  J12, sans jamais les rejoindre.
- Avec l'historique multi-saisons, **l'erreur ne dépend plus de l'avancement de la saison** : le problème du petit
  échantillon est réglé par l'historique, pas par le raffinement du modèle.
- L'a priori Elo n'apporte rien sur J1-J5 par rapport à une moyenne unique (l'historique suffit) ; son gain
  apparent se situe sur J6-J11 (0,2071 contre 0,2106) et sur les promus. Aucun de ces écarts n'est significatif.

Matchs impliquant un promu (258) : E 0,2099, B 0,2093, sans a priori Elo 0,2109, ancien modèle 0,2159, cotes
0,2021. Sans promu (660) : E 0,2072, cotes 0,2029. L'écart au marché est **deux fois plus grand sur les promus**
(0,0078 contre 0,0043) : c'est là que le modèle est le plus faible, comme attendu.

### 3.5 Calibration (test, trois issues empilées)

| Tranche prédite | n | E : prédit → observé | Cotes : prédit → observé |
|---|---|---|---|
| 10-20 % | 351 | 15,9 → 16,8 | 15,9 → 14,8 |
| 20-30 % | 1 204 | 25,5 → 24,9 | 25,6 → 25,8 |
| 30-40 % | 353 | 34,9 → 38,0 | 34,4 → 34,2 |
| 40-50 % | 310 | 44,9 → 44,2 | 44,9 → 45,1 |
| 50-60 % | 256 | 54,3 → 52,0 | 54,6 → 54,9 |
| 60-70 % | 146 | 64,7 → 69,2 | 64,6 → 67,1 |
| 70 % et plus | 72 | **76,9 → 69,4** | 75,3 → 75,3 |

Le modèle est correct au centre et **trop confiant au-dessus de 70 %** (72 cas seulement : intervalle d'environ
± 5 points). À surveiller en phase 3 ; si l'écart se confirme, un recalibrage simple appris sur la validation
sera testé, et admis seulement s'il améliore le log-loss hors échantillon.

---

## 4. Ablations

Chaque ligne retire un composant du modèle E. ΔRPS positif = le composant est utile.

| Composant retiré | RPS | ΔRPS | Verdict |
|---|---|---|---|
| Avantage du domicile (mis à zéro) | 0,2112 | **+0,0032 ± 0,0014** | Utile, significatif |
| A priori Elo (moyenne unique, σ réglé à part) | 0,2089 | +0,0010 ± 0,0009 | Favorable, non significatif |
| Avantage estimé (remplacé par 1,12 / 0,90) | 0,2077 | −0,0003 ± 0,0004 | Indiscernable |
| γ séparé pour 2020-21 | 0,2079 | 0,0000 ± 0,0001 | Nul sur le test, utile sur 2020-21 |
| Correction ρ | 0,2078 | −0,0001 ± 0,0001 | **Aucun gain** (score exact : 2,9771 contre 2,9770) |
| Pondération temporelle | 0,2074 | **−0,0006 ± 0,0004** | **Aucun gain**, légèrement défavorable |
| Repos | — | — | Non testable correctement (voir ci-dessous) |

Paramètres estimés au dernier ajustement : avantage du domicile γ = 0,197 (× 1,22 sur les buts à domicile),
ρ = −0,055, pente Elo β = 0,73 (log-buts pour 400 points).

**Repos.** Les CSV ne contiennent ni l'Europe ni la coupe : le « repos » n'y est que l'écart entre deux matchs de
Ligue 1. Sur 94 équipes-matchs à 4 jours de repos ou moins, le modèle attend 1,469 point et en observe 1,511 :
aucun effet négatif détectable. Le vrai signal (un club qui a joué en Europe le jeudi) ne peut pas être
backtesté sans un historique des calendriers européens.

**Sensibilité aux hyperparamètres.** La surface est plate : sur la validation, toutes les combinaisons
(demi-vie de 365 jours à l'infini, σ de 0,06 à 0,4) tiennent entre 0,2070 et 0,2106. Un premier réglage sur deux
saisons seulement avait retenu une demi-vie de 120 jours et σ = 0,25, et donnait 0,2102 sur le test ; le réglage
sur cinq saisons retient 730 jours et σ = 0,06 et donne 0,2080. **Le bruit de sélection (≈ 0,002) est du même
ordre que tous les effets d'ablation.** Avec 918 matchs de test, un effet inférieur à 0,002 n'est pas mesurable :
c'est une limite à écrire telle quelle dans le mémoire.

---

## 5. Position sur les décisions de cadrage

| Décision | Position | Motif |
|---|---|---|
| 1. Dixon-Coles + a priori Elo | **Confirmée, avec réserve** | Égal à l'Elo sur le 1/N/2, meilleur sur la grille de scores. Le mémoire ne doit pas affirmer qu'il bat l'Elo. |
| 1 bis. Correction ρ | **Contestée sur les chiffres, conservée** | Ne passe pas la règle 5. Coût nul, ρ estimé de signe attendu. Proposé : garder, afficher ρ, écrire que le gain n'est pas démontré. Alternative : la retirer (Poisson indépendant) sans perte mesurable. |
| 1 ter. Pondération temporelle | **Contestée sur les chiffres, conservée à 730 jours** | L'Elo de l'a priori porte déjà la récence. Une demi-vie courte est risquée ; 730 jours ou l'infini sont indiscernables. |
| 2. Calibré, RPS + log-loss | Confirmée | J'ajoute la log-vraisemblance du score exact : c'est la seule métrique qui juge la grille. |
| 3. Ingestion hors ligne, JSON versionné | Confirmée | Avec un Elo interne en premier choix (ClubElo indisponible). |
| 4. Force hors ligne, prédiction en forme close | Confirmée | Un ajustement prend moins d'une seconde. |
| 5. Règle d'admission | Confirmée, **avec une précision** | Au vu du bruit, « améliore le RPS » doit devenir « ne dégrade pas le RPS ni le log-loss, et a une justification structurelle ». Sinon presque rien ne passe, pas même l'a priori Elo. À valider. |
| 7. Covid | Confirmée | γ séparé pour 2020-21 ; rien à faire pour 2019-20. |
| 8. Multiplex réel | Confirmée, **moins le repos** | Calendrier réel disponible. Le repos ne déplace pas la probabilité (non backtestable). |
| 9. Déclencheur | Confirmée, simplifiée | Une requête football-data.org suffit pour tous les résultats ; ESPN ne sert plus qu'aux effectifs. |
| 10. Promus | Confirmée | Note d'entrée 1 450, soit environ 145 points sous la moyenne actuelle de la ligue : attaque × 0,77, buts encaissés × 1,30 avant le premier match. |
| 11. xG hors v1 | Confirmée, source changée | football-data.co.uk plutôt qu'Understat : pas de scraping. |

**Décision à prendre par toi** : la reformulation de la règle 5, et le sort de ρ (garder ou retirer).

---

## 6. Conception proposée

### 6.1 Modèle de prédiction

Pour un match domicile *i* contre extérieur *j* :

```
log λ_dom = μ + γ + att_i + def_j
log λ_ext = μ     + att_j + def_i
P(x, y)   = τ_ρ(x, y) · Poisson(x ; λ_dom) · Poisson(y ; λ_ext)      (grille 0..10, renormalisée)
```

- `att_i ~ N(β·(Elo_i − Elo_moy)/400, σ²)` et `def_i ~ N(−β·(Elo_i − Elo_moy)/400, σ²)` ;
- vraisemblance pondérée par `exp(−ln 2 · âge / demi-vie)` ;
- μ, γ, γ₂₀₂₀₋₂₁, β et ρ estimés ; σ et la demi-vie choisis par validation.

Exemple avec les paramètres exploratoires, **à titre d'illustration** : Marseille – Le Mans donne λ = 2,36 et
0,84, soit 70,9 % / 18,1 % / 11,0 %. Cette valeur tombe dans la tranche où le modèle est trop confiant (§ 3.5).

**Incertitude.** L'ajustement fournit un écart-type par force (approximation de Laplace). Le script hors ligne
tire quelques centaines de jeux de paramètres et écrit, pour chaque affiche de la journée, un intervalle sur les
probabilités 1/N/2. L'interface affiche l'intervalle, pas un pourcentage nu.

### 6.2 Simulation : « score d'abord » (conception i)

Ordre de génération, tout par le `Rng` :

1. temps additionnels ;
2. scénario de cartons rouges (équipe, minute) tiré selon le taux mesuré (0,231 par match) ;
3. **score final tiré dans la grille 6.1** ;
4. minutes des buts tirées selon un profil d'intensité croissant (44 % des buts en première période, mesuré),
   **incliné par le scénario de carton rouge** : l'équipe réduite marque plutôt avant le rouge, son adversaire
   plutôt après ;
5. tirs non convertis, tirs cadrés, corners, fautes, jaunes : comptages tirés autour des fréquences du § 2.3,
   répartis entre les équipes selon leur force et placés dans le temps ;
6. buteurs, passeurs, remplacements selon les profils des joueurs (poste, buts, passes, titularisations) ;
7. momentum **dérivé** des événements (densité lissée de tirs, état du score, supériorité numérique), sans bruit
   propre : il décrit le match, il ne le pilote pas.

**Convergence.** Le score vient de la grille à l'étape 3 et rien ne le modifie ensuite : la fréquence des scores
simulés converge vers la grille par construction. Le test sur 5 000 graines le vérifiera.

**Probabilités en direct, en forme close exacte.** Sachant le total de buts d'une équipe, leurs minutes sont
indépendantes de fonction de répartition F(t). Donc, si le score est (a, b) à l'instant t :

```
P(final = (x, y) | score (a, b) à t)  ∝  P(x, y) · Binom(a ; x, F_dom(t)) · Binom(b ; y, F_ext(t))
```

C'est la loi a posteriori exacte du générateur : elle vaut la prédiction d'avant-match à t = 0, elle somme à 1,
elle vaut 1 au coup de sifflet final, et elle réagit aux cartons rouges à travers F_dom et F_ext. Elle remplace
`outcomeProbabilities`, qui reste disponible pour le moteur provisoire.

**Hypothèses faibles, assumées :**

- Un carton rouge déplace **le moment** des buts, pas leur nombre : le score final ne dépend pas des rouges.
  C'est le prix de la convergence exacte. L'effet réel (de l'ordre de −1/3 sur le rythme de l'équipe réduite et
  +1/4 pour l'adversaire d'après Vecer, Kopřiva et Ichiba, 2009 — chiffres à relire dans l'article) n'est pas
  mesurable sur nos données, qui n'ont pas la minute des cartons.
- Les événements autres que les buts sont cohérents avec le score mais ne l'expliquent pas : la corrélation
  tirs-buts mesurée est faible (0,29 par équipe et par match), ce qui rend ce choix défendable.
- Les xG par tir sont **décoratifs** en v1 : aucune donnée de tir individuel ne permet de les ancrer.

L'alternative (ii), déroulé libre avec grille recalculée par Monte-Carlo, permettrait un vrai effet du carton
rouge sur le score, au prix d'une grille qui n'est plus celle de Dixon-Coles et d'un calcul plus lourd dans le
navigateur. Elle n'apporte rien de mesurable avec nos données ; je la recommande pour une v2 avec données
d'événements.

### 6.3 Chaîne de données

```
football-data.co.uk (historique, stats, cotes)  ──┐   ponctuel + rafraîchissement mensuel
football-data.org /competitions/FL1/matches     ──┼─► Elo interne ─► ajustement ─► JSON de paramètres versionné
(résultats de la saison + calendrier réel)        ┘                                 │
ESPN (effectifs OM et prochain adversaire) ───────────────────────────────────────►│
                                                                                    ▼
                                    page simulation (serveur) ─► MatchSimulationInput ─► moteur (navigateur)
```

- **Déclencheur** : quand le match de l'OM passe à `played = true`, et une fois par jour en rattrapage : une
  requête pour les 306 matchs, réajustement, écriture du JSON, invalidation du cache.
- **JSON de paramètres** (version de schéma, date de génération, dernier match pris en compte) : paramètres de
  ligue (μ, γ, ρ, β, σ, demi-vie), forces par club avec écart-type, Elo, drapeau promu et a priori, fréquences
  d'événements et profil temporel, affiches réelles de la journée avec intervalles, résumé du dernier backtest,
  emplacement `xg` (nul en v1).
- **Stockage** : je propose une ligne jsonb en base, comme `football_snapshots`, plus une copie de référence
  dans le dépôt pour que les scripts de contrôle soient reproductibles. À confirmer.
- **Extension du contrat**, entièrement optionnelle : un champ `model?` dans `MatchSimulationInput` (λ, ρ,
  profil, fréquences, provenance, intervalle) et un champ `source?: "calendrier" | "illustratif"` sur les
  affiches du multiplex. Sans `model`, le moteur retombe sur `strengthFromStanding` et l'étiquette comme non
  calibré ; le script de contrôle actuel continue de passer.
- **Repli du multiplex** : si le calendrier réel manque, appariement déterministe actuel, étiqueté illustratif,
  sans probabilités affichées comme des prédictions.

---

## 7. Paramètres d'entrée

| Paramètre | Source | État | Effet sur le modèle | Valeur par défaut si absent |
|---|---|---|---|---|
| Résultats L1 multi-saisons | football-data.co.uk | 🔴 à ingérer (vérifié) | Forces attaque/défense, μ, γ, ρ | Aucune : sans historique, repli sur l'ancien modèle, étiqueté |
| Résultats L1 saison en cours | football-data.org, 1 requête | 🔴 à brancher (vérifié) | Mise à jour des forces et de l'Elo | Dernier JSON connu, avec sa date |
| Elo par club | Calcul interne ; ClubElo en recoupement | 🔴 à construire | Moyenne de l'a priori | 1 450 pour un promu |
| Avantage du domicile γ | Estimé (séparé pour 2020-21) | 🔴 | × 1,22 sur λ domicile | 0,197 (dernière estimation) |
| Corrélation ρ | Estimée | 🔴 | Probabilité des 0-0, 1-0, 0-1, 1-1 | 0 (Poisson indépendant) |
| Demi-vie, σ | Validation | 🔴 | Poids du passé, force du rappel vers l'Elo | 730 jours ; σ à fixer en phase 3 |
| Statut promu | Composition des saisons | 🔴 | A priori plus bas, incertitude plus large | — |
| Calendrier réel de la journée | football-data.org | 🔴 à brancher (vérifié) | Affiches du multiplex | Appariement illustratif |
| Fréquences d'événements | football-data.co.uk | 🔴 (mesurées, § 2.3) | Déroulé, pas le score | Valeurs du § 2.3 |
| Effectif, buts, passes, titularisations | ESPN | ✅ | Buteurs, passeurs, remplacements | Texte au nom du club |
| Composition probable, surcharge du staff | `lineup.ts`, `match_customizations` | ✅ | Joueurs présents dans le déroulé | 4-3-3 heuristique |
| Absences, composition | ESPN, saisie manuelle | ✅ | **Scénario « non validé » seulement**, borné à ± 10 % sur λ, désactivable | Aucun ajustement |
| Repos, enchaînement européen | Calendrier OM | ✅ pour l'OM | **Scénario « non validé » seulement** | Aucun ajustement |
| Classement | football-data.org | ✅ | Affichage et repli uniquement | — |
| Forme ESPN | `team-form.ts` | 🟡 | Affichage ; **retirée de tout ajustement** | — |
| xG | football-data.co.uk 2026-27 | 🟡 | Aucun en v1 (emplacement réservé) | nul |
| Cotes de clôture | football-data.co.uk | 🔴 à ingérer | **Référence de comparaison**, jamais une entrée | — |
| Pronostics des supporters | table `predictions` | 🟡 | Point de comparaison | — |
| Entraîneurs, `tendency`, tables héritées | — | hors périmètre | Aucun | — |

---

## 8. À ingérer en plus, par gain attendu rapporté au coût

| Rang | Donnée | Gain attendu | Coût | Remarque |
|---|---|---|---|---|
| 1 | Historique football-data.co.uk | **Très fort** (−0,007 de RPS, mesuré) | Faible | Indispensable à la v1 |
| 2 | Calendrier et résultats complets football-data.org | Fort (multiplex réel, mise à jour) | Très faible : une requête | Vérifié |
| 3 | Cotes de clôture | Nul comme entrée, **fort pour la validation** | Nul : mêmes fichiers | Plafond à 0,2027 |
| 4 | xG football-data.co.uk | Moyen (littérature) ; non mesurable avant fin de saison | Nul | Test d'admission à l'été 2027 |
| 5 | ClubElo | Faible à moyen, surtout sur les promus (écart au marché deux fois plus grand) | Faible, mais **service instable aujourd'hui** | Recoupement, pas dépendance |
| 6 | Calendriers européens historiques | Inconnu ; seul moyen de valider le repos | Moyen | Sans cela, le repos reste « non validé » |
| 7 | Minutes des buts et des cartons, remplacements | Réalisme du déroulé, effet réel du carton rouge | Moyen à élevé (API payante) | Ouvre la conception (ii) |
| 8 | Minutes jouées, effectifs détaillés | Valeur d'une absence | Élevé (API-Football ou équivalent) | Seule voie pour valider compositions et absences |
| 9 | Understat, FBref | Redondant avec le rang 4 | Scraping, conditions d'utilisation à étudier | Non recommandé |

Risque à signaler pour un produit commercial : les effectifs reposent sur des **points d'accès ESPN non
documentés**, sans garantie de stabilité ni de licence. Le moteur de prédiction n'en dépend pas ; seul l'habillage
du déroulé (noms des joueurs) en dépend.

---

## 9. Limites connues

- Le modèle **ne bat pas le marché** et ne le fera pas avec ces données : écart de 0,005 de RPS.
- Il ne voit ni les absences, ni les transferts, ni les changements d'entraîneur, ni la rotation avant un match
  européen. Un club transformé à l'intersaison est mal estimé pendant plusieurs semaines.
- Trop confiant sur les gros favoris (§ 3.5), précisément le cas de Marseille – Le Mans.
- Les promus sont le point faible ; deux ou trois par saison, donc peu de données pour faire mieux.
- Coupe de France et Europa League : **hors modèle**. Aucune force n'est estimée pour les adversaires
  européens ; ces matchs resteront sur le repli étiqueté « non calibré » tant qu'un rating commun (ClubElo)
  n'est pas disponible.
- Fiabilité : avec l'historique, le modèle est utilisable dès la J1. Sans lui, pas avant la J12.
- Trois saisons de test ne permettent pas de mesurer un effet inférieur à 0,002 de RPS.

---

## 10. Plan des phases 2 et 3 (après validation)

1. Ingestion hors ligne et Elo interne, données de référence versionnées.
2. Ajustement, incertitude, JSON de paramètres ; branchement au cron et calendrier réel de la journée.
3. Moteur `dixon-coles` dans `ENGINES` (par défaut), extension optionnelle du contrat, construction des entrées.
4. Contrôles : existants, convergence sur 5 000 graines, cohérence des probabilités en direct.
5. Backtest de référence : baselines, tranches, calibration, ablations, promus, rapport dans `docs/`.

Commits atomiques `feat(simulation): …` à chaque étape.

---

## Références

- Maher (1982), *Modelling association football scores*, Statistica Neerlandica.
- Dixon et Coles (1997), *Modelling association football scores and inefficiencies in the football betting
  market*, Applied Statistics.
- Dixon et Robinson (1998), *A birth process model for association football matches*, The Statistician
  (intensité de but croissante au fil du match).
- Karlis et Ntzoufras (2003), *Analysis of sports data by using bivariate Poisson models*, The Statistician.
- Baio et Blangiardo (2010), *Bayesian hierarchical model for the prediction of football results*, Journal of
  Applied Statistics.
- Hvattum et Arntzen (2010), *Using ELO ratings for match result prediction in association football*,
  International Journal of Forecasting.
- Constantinou et Fenton (2012), *Solving the problem of inadequate scoring rules for assessing probabilistic
  football forecast models*, JQAS (défense du RPS).
- Wheatcroft (2021), *Evaluating probabilistic forecasts of football matches: the case against the ranked
  probability score*, JQAS (critique du RPS, d'où le log-loss rapporté en parallèle).
- Vecer, Kopřiva et Ichiba (2009), *Estimating the effect of the red card in soccer*, JQAS.

Les références sont citées de mémoire : titres et années à vérifier avant de les reprendre dans le mémoire.
