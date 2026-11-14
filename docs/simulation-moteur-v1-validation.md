# Moteur de simulation et de prédiction v1 — implémentation et validation (phases 2 et 3)

Date : 14 novembre 2026. Fait suite à [la conception](simulation-moteur-v1-conception.md), validée avec amendements.

- Tables complètes du backtest : [simulation-backtest-resultats.md](simulation-backtest-resultats.md) (fichier généré).
- Sortie des contrôles : [simulation-controles-sortie.txt](simulation-controles-sortie.txt).

Les chiffres de ce document remplacent ceux du backtest exploratoire de la phase 1. Ils diffèrent un peu
(hyperparamètres retenus, intervalles), pour trois raisons : ajustement conjoint de ρ, a priori sur l'avantage du
domicile à huis clos, et intervalles par bootstrap par blocs au lieu d'erreurs-types appariées.

---

## 1. Ce qui a été construit

| Élément | Emplacement |
|---|---|
| Noyau statistique : grille Dixon-Coles, Elo interne, ajustement, métriques | `packages/match-model/src/` |
| Ingestion de l'historique (football-data.co.uk) | `packages/match-model/scripts/ingest-history.ts` → `data/ligue1-history.json` |
| Backtest de référence | `packages/match-model/scripts/backtest.ts` → `data/backtest-summary.json` |
| Génération du JSON de paramètres | `packages/match-model/src/build-params.ts` |
| Calendrier complet, régénération à chaque synchro | `packages/football-sync/src/football-data.ts`, `simulation-model.ts` |
| Stockage jsonb | table `simulation_params` (migration `supabase/migrations/20261114120000_simulation_params.sql`) |
| Copie de référence des paramètres | `packages/match-model/data/ligue1-params.json` |
| Moteur « score d'abord » | `frontend/src/lib/simulation/engines/dixon-coles.ts` |
| Probabilités en direct en forme close | `frontend/src/lib/simulation/live.ts` |
| Construction des entrées | `frontend/src/lib/simulation/model-input.ts`, `frontend/src/lib/data/simulation-model.ts` |
| Contrôles | `frontend/scripts/check-simulation.ts` |

Commandes :

```bash
bun run model:ingest     # historique football-data.co.uk (ponctuel, à relancer environ une fois par mois)
bun run model:backtest   # backtest de référence, choisit les hyperparamètres (≈ 2 min)
bun run model:fit        # régénère la copie de référence des paramètres (ajouter -- --db pour écrire en base)
```

Le contrat `SimulationEngine` n'est pas cassé : `MatchSimulationInput.model` et deux champs de `SimPlayer` sont
optionnels. Le moteur de démonstration reste dans `ENGINES`.

---

## 2. Règle d'admission : ce qui a changé, et quand

**La règle 5 a été modifiée après avoir vu les résultats exploratoires.** Formulation d'origine : une entrée
n'est admise que si elle *améliore* le RPS en backtest. Formulation retenue : une entrée est admise si elle *ne
dégrade ni le RPS ni le log-loss* et a une justification structurelle. Ce changement est postérieur aux
données : il doit être présenté comme tel dans le mémoire, et non comme un critère fixé à l'avance. Sans lui,
seuls l'historique multi-saisons et l'avantage du domicile seraient admis.

Statut de chaque composant sur le test (918 matchs, intervalles à 95 % par bootstrap par blocs de journées).
« Démontré » : l'intervalle du ΔRPS exclut zéro.

| Composant | ΔRPS quand on le retire | Statut | Décision |
|---|---|---|---|
| Historique multi-saisons | +0,0070 [+0,0028 ; +0,0115] | **démontré** | gardé |
| Avantage du domicile | +0,0032 [+0,0003 ; +0,0059] | **démontré** | gardé |
| Avantage estimé plutôt que fixé (1,12 / 0,90) | −0,0004 [−0,0010 ; +0,0002] | non démontré | gardé : pas de constante arbitraire |
| A priori Elo plutôt que moyenne unique | +0,0007 [−0,0006 ; +0,0019] | non démontré | gardé : traite les promus, sens favorable |
| Pondération temporelle | −0,0006 [−0,0024 ; +0,0011] | non démontré | gardée (demi-vie 365 j, choisie sur la validation) |
| Correction ρ | −0,0001 [−0,0003 ; +0,0001] | non démontré | gardée (décision validée) |
| γ séparé pour 2020-21 | 0,0000 [−0,0002 ; +0,0001] | non démontré | gardé : nul aujourd'hui, protège la validation |
| Moyenne prédictive | 0,0000 [0,0000 ; +0,0001] | non démontré | gardée (décision validée) |
| Repos court (≤ 4 j, Ligue 1 seule) | 0,0000 [0,0000 ; +0,0001] | non démontré | **non admis** : aucune justification mesurable |
| Recalibrage par puissance | Δlog-loss +0,0006 [−0,0022 ; +0,0032] | non démontré | **non retenu** |

Aucun composant n'est « défavorable » au sens de l'intervalle. Deux seulement sont démontrés.

---

## 3. Résultats du backtest de référence

Protocole : 4 327 matchs (2014-15 à 2026-27). Fenêtre glissante sans fuite, ajustement refait à chaque jour de
match sur les 1 500 jours précédents. Hyperparamètres choisis sur 2018-19 à 2022-23 par RPS de validation, puis
figés : demi-vie 365 jours, σ = 0,15, K = 20, note d'entrée d'un promu 1 500. Test : 2023-24 à 2025-26.

| Modèle | RPS | Log-loss | Brier | Log-perte score exact | ΔRPS contre E [IC 95 %] |
|---|---|---|---|---|---|
| (1) Fréquences de base | 0,2326 | 1,0688 | 0,6467 | — | +0,0244 [+0,0167 ; +0,0312] |
| (3) Ancien modèle | 0,2153 | 1,0195 | 0,6119 | 3,0456 | +0,0070 [+0,0028 ; +0,0115] |
| (2) B. Elo → λ | 0,2082 | 0,9997 | 0,5974 | 2,9888 | −0,0001 [−0,0014 ; +0,0013] |
| **E. Dixon-Coles + a priori Elo** | **0,2082** | **0,9997** | **0,5977** | **2,9745** | référence |
| (4) Cotes de clôture | 0,2027 | 0,9816 | 0,5856 | — | −0,0055 [−0,0088 ; −0,0024] |

Lecture :

- **E et B sont indiscernables sur le 1/N/2.** RPS identique à quatre décimales, log-loss identique.
- **E est meilleur que B sur le score exact**, et cette fois l'écart est mesuré : −0,0143 [−0,0273 ; −0,0009]
  sur l'ensemble du test.
- **Le marché reste devant**, de 0,0055 de RPS et 0,018 de log-loss. L'intervalle exclut zéro.

### E contre B, saison par saison

| Saison | n | RPS E | RPS B | ΔRPS (E − B) | Score exact E | Score exact B | Δscore exact (E − B) |
|---|---|---|---|---|---|---|---|
| 2023-24 | 306 | 0,2125 | 0,2138 | −0,0013 [−0,0034 ; +0,0009] | 2,8851 | 2,9006 | −0,0155 [−0,0354 ; +0,0034] |
| 2024-25 | 306 | 0,2059 | 0,2048 | +0,0011 [−0,0015 ; +0,0039] | 2,9954 | 3,0170 | −0,0216 [−0,0463 ; +0,0024] |
| 2025-26 | 306 | 0,2063 | 0,2059 | +0,0004 [−0,0017 ; +0,0025] | 3,0430 | 3,0486 | −0,0057 [−0,0331 ; +0,0203] |

Sur le 1/N/2, E gagne une saison et en perd deux, toujours dans le bruit. Sur le score exact, E est devant les
trois saisons, mais **aucune saison prise seule n'est significative** : l'avantage n'apparaît qu'en cumul.

### Petit échantillon et promus (RPS)

| Tranche | n | Ancien modèle | B. Elo | E | E sans a priori Elo | Cotes | E − cotes [IC 95 %] |
|---|---|---|---|---|---|---|---|
| J1 à J5 | 135 | 0,2244 | 0,2011 | 0,2002 | 0,1999 | 0,1962 | +0,0040 [−0,0047 ; +0,0136] |
| J6 à J11 | 164 | 0,2201 | 0,2057 | 0,2087 | 0,2103 | 0,1991 | +0,0096 [+0,0015 ; +0,0172] |
| J12 et après | 619 | 0,2120 | 0,2104 | 0,2099 | 0,2105 | 0,2050 | +0,0048 [+0,0012 ; +0,0086] |
| Avec un promu | 258 | 0,2159 | 0,2091 | 0,2102 | 0,2107 | 0,2021 | +0,0081 [+0,0017 ; +0,0143] |
| Sans promu | 660 | 0,2150 | 0,2078 | 0,2075 | 0,2082 | 0,2029 | +0,0045 [+0,0007 ; +0,0084] |

- Avec l'historique, le modèle est utilisable dès la J1 ; l'ancien modèle ne s'en approche qu'après la J12.
- **J6 à J11 est la tranche la plus faible face au marché** (+0,0096), et c'est celle où nous sommes aujourd'hui.
  Hypothèse : les cotes intègrent plus vite les changements d'intersaison. Non vérifiée.
- L'écart au marché est près de deux fois plus grand sur les matchs avec un promu (0,0081 contre 0,0045).
- Sur la saison en cours (90 matchs) : E 0,2018, B 0,2027, cotes 0,1949. Intervalles très larges.

---

## 4. Amendement 4 — moyenne prédictive et surcroît de confiance

La probabilité affichée est la **moyenne prédictive** : la grille est intégrée sur l'incertitude a posteriori des
forces (approximation de Laplace diagonale, quadrature de Gauss-Hermite 5 × 5, donc déterministe). C'est cette
grille qui est stockée dans le JSON, affichée et échantillonnée par le moteur.

**Elle ne corrige pas le surcroît de confiance.**

| Tranche prédite ≥ 70 % | Prédit | Observé | n |
|---|---|---|---|
| Estimation ponctuelle | 76,6 % | 69,0 % | 71 |
| Moyenne prédictive | 76,5 % | 67,6 % | 68 |
| Recalibrée (puissance 0,9) | 76,3 % | 69,0 % | 42 |
| Cotes, normalisation proportionnelle | 75,3 % | 75,3 % | 85 |

Écart moyenne prédictive − estimation ponctuelle : Δlog-loss = −0,0002 [−0,0007 ; +0,0002]. L'incertitude
d'estimation des forces est trop faible pour déplacer les probabilités : sur Marseille – Le Mans, 71,7 % au lieu
de 72,1 %. Le surcroît de confiance ne vient donc pas de là. Il vient de ce que le modèle ignore (effectif,
forme réelle, rotation), et qu'aucun de nos paramètres ne représente.

Le **recalibrage par puissance**, appris sur la validation (k = 0,9), n'améliore pas le log-loss hors
échantillon : +0,0006 [−0,0022 ; +0,0032]. **Il n'est pas ajouté**, conformément à la consigne.

Conséquence pour l'interface : le surcroît de confiance est signalé en clair dans le bloc « hypothèses et
paramètres », et l'intervalle affiché (59 à 83 % pour l'OM contre Le Mans) est plus parlant que le pourcentage
central. Avec 68 cas, l'écart observé (−9 points) a lui-même une incertitude de l'ordre de ± 11 points.

---

## 5. Amendement 5 — probabilités en direct et cartons rouges

Modèle génératif : (1) scénario de cartons rouges, au plus un par équipe, indépendant du score ; (2) score final
tiré dans la grille ; (3) minutes des buts de densité proportionnelle au profil temporel, inclinée par
l'infériorité numérique.

À l'instant t, on connaît le score (a, b) et les rouges déjà sortis. La loi du score final **marginalise sur les
rouges futurs compatibles avec cette histoire** :

```
P(x, y | histoire à t) ∝ G(x, y) · C(x, a) · C(y, b) · E_rouges futurs [ L_dom(x) · L_ext(y) ]
L(x) = Z^(−a) · ((Z − A) / Z)^(x − a)
```

A est la masse d'intensité déjà écoulée (fixée par l'histoire), Z la masse totale (qui dépend des rouges à
venir). L'espérance porte sur « pas de rouge » et sur six tranches de temps restantes par équipe, pondérées par
la loi a priori de la minute du rouge sachant qu'il n'est pas encore sorti (49 scénarios au plus).

Propriétés vérifiées par les contrôles :

- à t = 0, la probabilité est exactement la prédiction d'avant-match (écart 1,4 × 10⁻¹⁷) ;
- au coup de sifflet final, elle vaut 1 pour le résultat réalisé ;
- **invariance** : même histoire jusqu'à t, rouge futur supprimé, retardé ou attribué à l'autre équipe → même
  probabilité (écart exactement nul) ; après le rouge, elle se déplace (jusqu'à 28 points dans le match testé) ;
- **calibration contre le générateur** : sur 6 000 matchs, l'écart moyen entre probabilité annoncée et fréquence
  réalisée est de 0,5 point à la 30e minute et de 0,6 point à la 70e.

Approximation assumée : l'intégrale sur la minute du rouge futur est une quadrature à six points, alors que le
générateur tire cette minute en continu. L'erreur est incluse dans les 0,5 à 0,6 point ci-dessus.

Hypothèses non mesurables sur nos données (pas de minute des cartons) : la minute d'un rouge suit une densité
croissante, F(u) = (u / durée)² ; une équipe réduite marque à un rythme × 0,67 et son adversaire × 1,25. Ces
valeurs n'agissent que sur le **moment** des buts, jamais sur leur nombre.

---

## 6. Amendement 6 — matchs hors Ligue 1 et ClubElo

- Hors Ligue 1 (Europa League, Coupe de France), ou dès qu'un club est inconnu du modèle, **aucune prédiction
  n'est transmise**. L'interface remplace la barre 1/N/2 par un message explicite, avant le match et pendant le
  déroulé ; la simulation reste jouable mais est étiquetée illustrative et non calibrée.
- **ClubElo est toujours indisponible** : HTTP 502 à chaque nouvelle tentative pendant la phase 2. L'Elo interne
  reste donc la seule source. Sans rating commun aux championnats, les matchs européens ne peuvent pas être
  couverts.

---

## 7. Amendement 7 — précisions de méthode

**Intervalles.** Bootstrap apparié par blocs, 2 000 rééchantillonnages, graine fixe. Un bloc est une journée :
suite de matchs séparés de moins de deux jours. Les pertes des deux modèles
comparés sont rééchantillonnées ensemble. Ces intervalles sont plus larges que les erreurs-types de la phase 1 :
pour E contre B, ± 0,0013 au lieu de ± 0,0005.

**Cotes.** Colonnes de clôture de football-data.co.uk : `AvgCH / AvgCD / AvgCA` (moyenne du marché) pour les
1 008 matchs du test et de la saison en cours, et depuis 2019-20 ; `PSCH / PSCD / PSCA` (Pinnacle) de 2014-15 à
2018-19, saisons qui ne servent qu'à l'historique. Aucune cote d'ouverture n'est utilisée. Deux normalisations
comparées :

| Méthode | RPS | Log-loss |
|---|---|---|
| Proportionnelle (inverse des cotes divisé par leur somme) | 0,2027 | 0,9816 |
| Puissance (k tel que Σ (1/cote)^k = 1) | 0,2027 | 0,9812 |

La différence est négligeable ; la comparaison au marché ne dépend pas de ce choix. La méthode proportionnelle
est la référence du rapport. Les cotes sont un point de comparaison, jamais une entrée.

**xG.** Colonnes `HxG / AxG` du fichier 2026-27 de football-data.co.uk (90 matchs). La notice du site
(`notes.txt`) les définit seulement comme « Home / Away Team expected goals » : **le fournisseur et le modèle
de xG ne sont pas indiqués**. Tant que la provenance n'est pas établie et qu'une saison complète n'est pas
disponible, ces valeurs sont stockées à titre informatif (`xg.used = false`) et ne déplacent rien.

---

## 8. Contrôles

`bun scripts/check-simulation.ts` depuis `frontend/` : 40 contrôles, tous passent.

| Famille | Résultat |
|---|---|
| Contrôles d'origine (15) | passent avec le nouveau moteur par défaut : 2,77 buts, 26,4 tirs, 3,7 jaunes, 8,0 remplacements |
| Convergence, modèle calibré (6 000 graines) | simulé 71,0 / 16,9 / 12,1 %, prédit 71,7 / 17,0 / 11,3 % ; écart max 1,95 σ ; pire case de score 2,38 σ |
| Convergence, repli sans modèle | écart max 0,76 σ |
| Performance | 7,5 ms par match (hors navigateur) |
| Probabilités en direct | voir § 5 |
| Fréquences simulées contre mesurées | tirs 26,4 / 26,3 ; corners 9,8 / 9,8 ; fautes 24,6 / 24,6 ; jaunes 3,78 / 3,79 ; rouges 0,21 / 0,22 ; buts en 1re période 43,8 % / 44,0 % |
| Multiplex | 8 affiches réelles prédites ; repli étiqueté illustratif ; hors Ligue 1 : rien de transmis |

Non vérifié : le rendu dans le navigateur. `tsc` passe sur les trois paquets ; `next build` compile, puis échoue
au prérendu faute de base de données locale dans cet environnement. `bun run lint` signale une erreur
préexistante, sans rapport, dans un composant de la Fan Zone.

---

## 9. Paramètres exposés à l'interface

Tous sont dans `MatchSimulationInput.model` (ou dans le JSON complet côté serveur).

| Paramètre | Champ | Provenance |
|---|---|---|
| Grille de scores prédite | `model.grid` | Dixon-Coles, moyenne prédictive, calculée hors ligne |
| Probabilités 1/N/2 | dérivées de la grille | idem |
| Buts attendus | `model.lambdaHome`, `model.lambdaAway` | moyennes de la grille |
| Intervalle à 90 % | `provenance.interval` | 1 000 tirages des forces dans leur loi a posteriori |
| Estimation ponctuelle | `provenance.pointEstimate` | sans incertitude sur les forces |
| Force d'attaque et de défense | `provenance.home.att`, `.def` (échelle log) | ajustement sur l'historique pondéré |
| Elo | `provenance.home.elo` | Elo interne, résultats de Ligue 1 |
| Statut promu | `provenance.home.promoted` | composition des saisons |
| Taille d'échantillon effective | `provenance.home.effectiveMatches` | somme des poids temporels |
| Avantage du domicile | `provenance.homeFactor` (× 1,23 aujourd'hui) | estimé |
| Correction des petits scores | `provenance.rho` (−0,056) | estimée |
| Fraîcheur | `provenance.dataThrough`, `generatedAt`, `matchesUsed` | date du dernier match pris en compte |
| Origine de la prédiction | `provenance.source` | « calendrier » (affiche réelle) ou « forces » |
| Fréquences d'événements | `model.eventRates` | mesurées sur 2023-24 à 2025-26 |
| Statut des composants | `params.components` (serveur) | dernier backtest |
| Résumé du backtest | `params.backtest` (serveur) | dernier backtest |
| Origine du multiplex | `MultiplexFixture.source` | « calendrier » ou « illustratif » |

Aucun facteur d'ajustement (absences, composition, repos, enjeu) n'est exposé, parce qu'aucun n'est appliqué.
Le scénario « non validé » prévu par la règle 5 n'est pas implémenté en v1.

---

## 10. Valeurs par défaut et hypothèses à connaître

| Sujet | Valeur | Statut |
|---|---|---|
| Temps additionnel | 1 à 4 min, puis 2 à 6 min | non mesuré |
| Passe décisive sur un but | 72 % | non mesuré |
| Hors-jeu | 1,9 par équipe | non mesuré |
| But validé après contrôle VAR | 7 % des buts | non mesuré |
| But refusé par la VAR | 0,045 par équipe | non mesuré |
| Remplacements | 3 à 5 par équipe, 2 ou 3 fenêtres après la 55e | non mesuré |
| Effet d'un carton rouge | × 0,67 / × 1,25, sur le moment des buts seulement | littérature, à vérifier |
| Minute d'un carton rouge | densité croissante | hypothèse |
| xG par tir | tirés dans des plages fixes | décoratif |
| Profil temporel des buts | uniforme dans chaque période, 44 % avant la pause | seul le partage par période est mesuré |
| Lien tirs / corners et rapport de forces | une pente unique sur l'écart de buts attendus | mesuré ; attendu propre et adverse non séparables (colinéaires) |
| Note d'entrée d'un promu | 1 500 (moyenne actuelle de la ligue : 1 633) | choisie sur la validation ; surface très plate (0,2087 à 0,2093) |
| A priori sur γ à huis clos | N(γ, 0,2²) | fixé, non réglé |

Aucune de ces valeurs non mesurées n'agit sur le score ni sur les probabilités d'avant-match.

---

## 11. Limites

- Le modèle ne bat ni le marché ni, sur le 1/N/2, un simple Elo. Son apport propre est la grille de scores.
- Il est trop confiant au-dessus de 70 %, et rien dans la v1 ne le corrige.
- Il ignore compositions, absences, entraîneurs, repos et enchaînement européen.
- Les promus et la tranche J6 à J11 sont ses points faibles face au marché.
- Un carton rouge ne change pas le nombre de buts simulés.
- Un match déjà joué de la journée en cours reste prédit et simulé dans le multiplex, avec des forces qui
  tiennent déjà compte de son résultat.
- Trois saisons de test : un effet inférieur à 0,002 de RPS environ n'est pas mesurable.

## 12. Mise en service

1. Appliquer la migration `20261114120000_simulation_params.sql`. Tant qu'elle ne l'est pas, la synchro journalise
   un avertissement et le site utilise la copie de référence du dépôt.
2. La synchro existante régénère les paramètres dès que le nombre de matchs de Ligue 1 joués augmente ou que la
   journée à prédire change : une requête de plus à football-data.org par exécution (3 au total).
3. Relancer `model:ingest` puis `model:fit` environ une fois par mois pour rafraîchir statistiques et cotes, et
   `model:backtest` en fin de saison.
