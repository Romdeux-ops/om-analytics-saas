# Backtest de référence — résultats bruts

Fichier généré par `bun run model:backtest` le 2026-11-14. Ne pas modifier à la main.

- Historique : 4327 matchs de Ligue 1, 2014-15 à 2026-27 (football-data.co.uk).
- Validation (choix des hyperparamètres) : 2018-19, 2019-20, 2020-21, 2021-22, 2022-23 — 1799 matchs.
- Test (hyperparamètres figés) : 2023-24, 2024-25, 2025-26 — 918 matchs. Saison en cours 2026-27 : 90 matchs, rapportée à part.
- Fenêtre d'ajustement : 1500 jours. Intervalles à 95 % : bootstrap apparié par blocs de journées, 2000 rééchantillonnages.

## 1. Réglage de l'Elo interne (validation)

| RPS validation | promu 1350 | promu 1400 | promu 1450 | promu 1500 |
|---|---|---|---|---|
| K = 10 | 0,2108 | 0,2103 | 0,2098 | 0,2094 |
| K = 15 | 0,2097 | 0,2094 | 0,2091 | 0,2088 |
| K = 20 | 0,2093 | 0,2091 | 0,2088 | 0,2087 |
| K = 30 | 0,2093 | 0,2092 | 0,2091 | 0,2090 |

Retenu : K = 20, note d'entrée d'un promu = 1500.

## 2. Réglage de Dixon-Coles (validation, moyenne prédictive)

A priori Elo — RPS / log-loss / log-perte du score exact :

| Demi-vie | σ = 0,06 | σ = 0,1 | σ = 0,15 | σ = 0,25 | σ = 0,4 |
|---|---|---|---|---|---|
| 365 j | 0,2078 / 1,0131 / 2,8860 | 0,2076 / 1,0124 / 2,8840 | 0,2076 / 1,0120 / 2,8845 | 0,2077 / 1,0123 / 2,8885 | 0,2079 / 1,0130 / 2,8936 |
| 730 j | 0,2078 / 1,0130 / 2,8856 | 0,2078 / 1,0128 / 2,8848 | 0,2081 / 1,0134 / 2,8870 | 0,2085 / 1,0147 / 2,8921 | 0,2089 / 1,0159 / 2,8968 |
| aucune | 0,2080 / 1,0135 / 2,8866 | 0,2087 / 1,0153 / 2,8897 | 0,2094 / 1,0174 / 2,8948 | 0,2101 / 1,0198 / 2,9011 | 0,2105 / 1,0213 / 2,9058 |

A priori à moyenne unique (sans Elo) :

| Demi-vie | σ = 0,25 | σ = 0,4 | σ = 1,5 |
|---|---|---|---|
| 365 j | 0,2083 / 1,0141 / 2,8903 | 0,2080 / 1,0130 / 2,8933 | 0,2083 / 1,0145 / 2,9055 |
| 730 j | 0,2090 / 1,0159 / 2,8935 | 0,2089 / 1,0159 / 2,8969 | 0,2093 / 1,0175 / 2,9075 |
| aucune | 0,2105 / 1,0206 / 2,9024 | 0,2106 / 1,0214 / 2,9060 | 0,2110 / 1,0231 / 2,9159 |

Retenu avec a priori Elo : demi-vie 365 j, σ = 0.15. Sans Elo : demi-vie 365 j, σ = 0.4.
Critère de choix : RPS de validation le plus bas (déclaré avant le test).

## 2 bis. Étanchéité entre réglage et test

- Dernier match visible pendant le réglage : 2023-06-03 (3319 matchs). Premier match du test : 2023-08-11.
- Pendant le réglage, l'Elo, la pente Elo → buts, les ajustements et le recalibrage ne reçoivent que ces matchs : les saisons de test ne sont pas chargées dans le jeu de données visible, et le script s'arrête sur toute tentative d'accès.
- Réglages gelés avant l'ouverture du test : K = 20, promu = 1500, demi-vie = 365 j, σ = 0.15, puissance de recalibrage = 0.9.
- Les grilles de valeurs candidates et les constantes non réglées (fenêtre de 1 500 jours, avantage du domicile de l'Elo à 60 points, a priori à huis clos) sont fixées dans le code, pas choisies sur le test.

## 3. Test : 2023-24, 2024-25, 2025-26

| Modèle | RPS | Log-loss | Brier | Log-perte score exact | ΔRPS contre E [IC 95 %] | Δlog-loss contre E [IC 95 %] |
|---|---|---|---|---|---|---|
| (1) Fréquences de base | 0,2326 | 1,0688 | 0,6467 | — | +0,0244 [+0,0167 ; +0,0312] | +0,0691 [+0,0464 ; +0,0891] |
| (3) Ancien modèle (classement + double Poisson) | 0,2153 | 1,0195 | 0,6119 | 3,0456 | +0,0070 [+0,0028 ; +0,0115] | +0,0199 [+0,0065 ; +0,0335] |
| (2) B. Elo → λ | 0,2082 | 0,9997 | 0,5974 | 2,9888 | −0,0001 [−0,0014 ; +0,0013] | +0,0000 [−0,0046 ; +0,0049] |
| **E. Dixon-Coles + a priori Elo (moyenne prédictive)** | 0,2082 | 0,9997 | 0,5977 | 2,9745 | référence | référence |
| (4) Cotes de clôture, normalisation proportionnelle | 0,2027 | 0,9816 | 0,5856 | — | −0,0055 [−0,0088 ; −0,0024] | −0,0181 [−0,0283 ; −0,0083] |
| (4 bis) Cotes de clôture, méthode de la puissance | 0,2027 | 0,9812 | 0,5856 | — | −0,0056 [−0,0090 ; −0,0022] | −0,0184 [−0,0290 ; −0,0081] |

### E contre B, saison par saison

| Saison | n | RPS E | RPS B | ΔRPS (E − B) [IC 95 %] | Log-loss E | Log-loss B | Score exact E | Score exact B | Δscore exact (E − B) [IC 95 %] |
|---|---|---|---|---|---|---|---|---|---|
| 2023-24 | 306 | 0,2125 | 0,2138 | −0,0013 [−0,0034 ; +0,0009] | 1,0331 | 1,0374 | 2,8851 | 2,9006 | −0,0155 [−0,0354 ; +0,0034] |
| 2024-25 | 306 | 0,2059 | 0,2048 | +0,0011 [−0,0015 ; +0,0039] | 0,9689 | 0,9657 | 2,9954 | 3,0170 | −0,0216 [−0,0463 ; +0,0024] |
| 2025-26 | 306 | 0,2063 | 0,2059 | +0,0004 [−0,0017 ; +0,0025] | 0,9970 | 0,9959 | 3,0430 | 3,0486 | −0,0057 [−0,0331 ; +0,0203] |

Ensemble : Δscore exact (E − B) = −0,0143 [−0,0273 ; −0,0009].

### Erreur selon l'avancement de la saison et selon la présence d'un promu (RPS)

| Tranche | n | Ancien modèle | B. Elo | E | E sans a priori Elo | Cotes | E − cotes [IC 95 %] |
|---|---|---|---|---|---|---|---|
| J1 à J5 | 135 | 0,2244 | 0,2011 | 0,2002 | 0,1999 | 0,1962 | +0,0040 [−0,0047 ; +0,0136] |
| J6 à J11 | 164 | 0,2201 | 0,2057 | 0,2087 | 0,2103 | 0,1991 | +0,0096 [+0,0015 ; +0,0172] |
| J12 et après | 619 | 0,2120 | 0,2104 | 0,2099 | 0,2105 | 0,2050 | +0,0048 [+0,0012 ; +0,0086] |
| Avec un promu | 258 | 0,2159 | 0,2091 | 0,2102 | 0,2107 | 0,2021 | +0,0081 [+0,0017 ; +0,0143] |
| Sans promu | 660 | 0,2150 | 0,2078 | 0,2075 | 0,2082 | 0,2029 | +0,0045 [+0,0007 ; +0,0084] |

### Calibration (trois issues empilées) : prédit → observé, en %

| Tranche prédite | E ponctuel (sans incertitude) | E moyenne prédictive | E recalibré (puissance 0.9) | Cotes (proportionnelle) | Cotes (puissance) |
|---|---|---|---|---|---|
| 0-10 % | 7,3 → 7,0 (n = 57) | 7,3 → 7,8 (n = 51) | 7,6 → 0,0 (n = 32) | 7,9 → 5,9 (n = 51) | 7,6 → 5,1 (n = 78) |
| 10-20 % | 16,0 → 16,8 (n = 358) | 16,1 → 16,1 (n = 360) | 16,1 → 16,6 (n = 283) | 15,9 → 14,8 (n = 412) | 15,8 → 15,0 (n = 428) |
| 20-30 % | 25,4 → 24,7 (n = 1167) | 25,4 → 24,7 (n = 1182) | 25,7 → 24,3 (n = 1245) | 25,6 → 25,8 (n = 1126) | 25,5 → 26,5 (n = 1099) |
| 30-40 % | 34,7 → 38,0 (n = 397) | 34,9 → 38,6 (n = 383) | 34,6 → 36,9 (n = 436) | 34,4 → 34,2 (n = 389) | 34,4 → 33,9 (n = 360) |
| 40-50 % | 45,0 → 44,4 (n = 311) | 45,0 → 44,3 (n = 314) | 45,0 → 45,8 (n = 360) | 44,9 → 45,1 (n = 308) | 44,8 → 45,4 (n = 295) |
| 50-60 % | 54,2 → 51,4 (n = 251) | 54,2 → 51,6 (n = 254) | 54,3 → 53,6 (n = 235) | 54,6 → 54,9 (n = 237) | 54,5 → 53,0 (n = 232) |
| 60-70 % | 64,5 → 69,7 (n = 142) | 64,5 → 70,4 (n = 142) | 64,0 → 72,7 (n = 121) | 64,6 → 67,1 (n = 146) | 64,5 → 64,9 (n = 154) |
| 70-100 % | 76,6 → 69,0 (n = 71) | 76,5 → 67,6 (n = 68) | 76,3 → 69,0 (n = 42) | 75,3 → 75,3 (n = 85) | 76,5 → 74,1 (n = 108) |

Moyenne prédictive contre estimation ponctuelle : Δlog-loss = −0,0002 [−0,0007 ; +0,0002], ΔRPS = −0,0000 [−0,0001 ; +0,0000].

Recalibrage par puissance (k = 0.9, appris sur la validation) contre E : Δlog-loss = +0,0006 [−0,0022 ; +0,0032], ΔRPS = +0,0001 [−0,0006 ; +0,0009].
→ Le recalibrage n'améliore pas le log-loss hors échantillon de façon démontrée : **non retenu**.

### Ablations et entrées candidates

Δ = perte de la variante − perte de E. Positif : le composant de E est utile. « Démontré » : l'intervalle à 95 % du ΔRPS exclut zéro.

| Composant de E | Variante comparée | RPS variante | ΔRPS [IC 95 %] | Δlog-loss [IC 95 %] | Δscore exact [IC 95 %] | Verdict |
|---|---|---|---|---|---|---|
| Historique multi-saisons | ancien modèle, saison en cours seule | 0,2153 | +0,0070 [+0,0028 ; +0,0115] | +0,0199 [+0,0065 ; +0,0335] | +0,0711 [+0,0468 ; +0,0981] | **démontré** |
| Avantage du domicile | mis à zéro | 0,2114 | +0,0032 [+0,0003 ; +0,0059] | +0,0092 [+0,0009 ; +0,0174] | +0,0109 [+0,0014 ; +0,0205] | **démontré** |
| Avantage du domicile estimé | fixé à 1,12 / 0,90 | 0,2078 | −0,0004 [−0,0010 ; +0,0002] | −0,0011 [−0,0030 ; +0,0008] | −0,0003 [−0,0027 ; +0,0022] | **non démontré** |
| A priori Elo | moyenne unique, σ et demi-vie réglés à part | 0,2089 | +0,0007 [−0,0006 ; +0,0019] | +0,0023 [−0,0018 ; +0,0061] | +0,0043 [−0,0024 ; +0,0111] | **non démontré** |
| Pondération temporelle | aucune | 0,2076 | −0,0006 [−0,0024 ; +0,0011] | −0,0016 [−0,0073 ; +0,0040] | −0,0025 [−0,0112 ; +0,0062] | **non démontré** |
| Correction ρ | ρ = 0 | 0,2081 | −0,0001 [−0,0003 ; +0,0001] | −0,0009 [−0,0033 ; +0,0016] | −0,0000 [−0,0039 ; +0,0037] | **non démontré** |
| γ séparé pour 2020-21 | γ unique | 0,2082 | −0,0000 [−0,0002 ; +0,0001] | −0,0001 [−0,0006 ; +0,0004] | −0,0000 [−0,0005 ; +0,0004] | **non démontré** |
| Moyenne prédictive | estimation ponctuelle | 0,2083 | +0,0000 [−0,0000 ; +0,0001] | +0,0002 [−0,0002 ; +0,0007] | +0,0002 [−0,0017 ; +0,0022] | **non démontré** |
| Sans le repos court (candidat) | avec effet du repos ≤ 4 j | 0,2083 | +0,0000 [−0,0000 ; +0,0001] | +0,0001 [−0,0001 ; +0,0004] | +0,0004 [−0,0003 ; +0,0013] | **non démontré** |

Dernier ajustement de la période : μ = 0.200, γ = 0.197 (× 1.217), ρ = -0.040, itérations = 17.

## 4. Saison en cours 2026-27 (partielle, à titre indicatif)

| Modèle | RPS | Log-loss | Brier | Log-perte score exact | ΔRPS contre E [IC 95 %] | Δlog-loss contre E [IC 95 %] |
|---|---|---|---|---|---|---|
| (1) Fréquences de base | 0,2324 | 1,0562 | 0,6382 | — | +0,0306 [+0,0094 ; +0,0497] | +0,0879 [+0,0239 ; +0,1447] |
| (3) Ancien modèle (classement + double Poisson) | 0,2250 | 1,0337 | 0,6221 | 3,0935 | +0,0232 [+0,0005 ; +0,0444] | +0,0654 [−0,0032 ; +0,1300] |
| (2) B. Elo → λ | 0,2027 | 0,9703 | 0,5771 | 2,9963 | +0,0009 [−0,0022 ; +0,0038] | +0,0020 [−0,0062 ; +0,0100] |
| **E. Dixon-Coles + a priori Elo (moyenne prédictive)** | 0,2018 | 0,9683 | 0,5760 | 2,9774 | référence | référence |
| (4) Cotes de clôture, normalisation proportionnelle | 0,1949 | 0,9482 | 0,5611 | — | −0,0069 [−0,0162 ; +0,0010] | −0,0201 [−0,0463 ; +0,0024] |
| (4 bis) Cotes de clôture, méthode de la puissance | 0,1940 | 0,9445 | 0,5590 | — | −0,0079 [−0,0175 ; +0,0006] | −0,0238 [−0,0531 ; +0,0015] |

## 5. Avantage du domicile et huis clos (validation)

| Saisons | RPS γ séparé | RPS γ unique | Δ (unique − séparé) [IC 95 %] |
|---|---|---|---|
| 2020-21 | 0,2137 | 0,2140 | +0,0003 [−0,0007 ; +0,0012] |
| 2021-22 et 2022-23 | 0,2039 | 0,2039 | −0,0000 [−0,0007 ; +0,0007] |

## 6. Cotes : colonnes utilisées

Test et saison en cours : AvgCH / AvgCD / AvgCA (1008 matchs).
Historique complet : PSC (1900), AvgC (2427).

Durée du backtest : 197 s.
