# Guide d'utilisation My Presence

Ce document explique comment utiliser `My Presence` côté `administrateur` et côté `étudiant`.

## 1. Connexion

Accès à l'application :

- En local : `http://localhost:5173`
- En ligne : `https://my-presence.netlify.app`

Comptes de démonstration :

- Admin : `admin@mypresence.local` / `Admin123!`
- Étudiant : `sara@mypresence.local` / `Student123!`

Après connexion :

- un administrateur est redirigé vers l'espace `Admin`
- un étudiant est redirigé vers l'espace `Étudiant`

## 2. Guide administrateur

### 2.1 Tableau de bord

Le `Dashboard` admin donne une vue d'ensemble de la plateforme :

- nombre total d'étudiants
- nombre total de formations
- nombre total de cours
- taux global de présence
- statistiques et graphiques
- aperçu rapide des séances

Utilisation recommandée :

1. vérifier l'état général de la présence
2. repérer les étudiants les plus assidus ou les plus absents
3. contrôler les séances planifiées

### 2.2 Formations

La section `Formations` permet de gérer les programmes de formation.

Actions possibles :

- créer une formation
- modifier une formation
- supprimer une formation
- préciser le `nombre total d'heures`
- consulter les étudiants inscrits dans une formation
- retirer un étudiant d'une formation

Bon usage :

1. créer d'abord les formations
2. définir correctement le total d'heures prévu
3. rattacher ensuite les étudiants à une ou plusieurs formations

### 2.3 Étudiants

La section `Étudiants` permet de gérer les comptes apprenants.

Actions possibles :

- ajouter un étudiant
- modifier ses informations
- supprimer un étudiant
- affecter une ou plusieurs formations
- changer son mot de passe
- renseigner une photo de profil

Informations gérées :

- prénom
- nom
- email
- téléphone
- matricule
- formations
- photo de profil optionnelle
- mot de passe

Bon usage :

1. créer l'étudiant
2. vérifier son email et son matricule
3. lui affecter ses formations
4. communiquer ses identifiants initiaux si besoin

### 2.4 Cours

La section `Cours` sert à créer les cours logiques, puis à organiser leurs séances.

Important :

- lors de la création d'un cours, on ne renseigne pas la date ni l'heure
- on crée d'abord le `cours`
- ensuite on entre dans le cours pour ajouter les `séances`

Actions possibles :

- créer un cours
- choisir le mode :
  - `séance unique`
  - `séances multiples`
- définir :
  - titre
  - description
  - type de cours
  - formateur
  - formation
- entrer dans un cours
- ajouter une ou plusieurs séances
- modifier une séance existante
- supprimer une séance

Type de cours :

- `Présentiel (Lieu 3C)`
- `En ligne`

Exemple de flux conseillé :

1. créer le cours `Excel avancé`
2. choisir la formation concernée
3. entrer dans le cours
4. ajouter les séances une par une
5. définir pour chaque séance :
   - date
   - heure de début
   - heure de fin
   - durée

### 2.5 Calendrier

La section `Calendrier` admin permet de visualiser les séances programmées.

Utilisation :

- consulter les cours par date
- naviguer rapidement par mois
- sélectionner directement une date
- repérer les jours avec séances prévues

Le calendrier aide à :

- contrôler la planification
- éviter les chevauchements
- vérifier la répartition des séances sur la semaine ou le mois

### 2.6 Présences

La section `Présences` sert à suivre et corriger les présences des étudiants.

Actions possibles :

- voir toutes les présences enregistrées
- filtrer par étudiant
- filtrer par formation
- filtrer par séance
- filtrer par date
- modifier une présence
- corriger un statut
- marquer manuellement :
  - `présent`
  - `absent`
  - `retard`

Règle utile :

- l'administrateur peut corriger une présence liée à une séance pour un étudiant

### 2.7 QR Codes

La section `QR Codes` permet d'afficher les QR codes générés pour les séances.

Fonctionnement :

- chaque séance possède un QR code unique
- le QR code est associé à la séance
- il peut être utilisé pour l'enregistrement de présence

### 2.8 Rapports

La section `Rapports` permet d'exploiter les données de présence.

L'administrateur peut :

- consulter les statistiques
- analyser la progression
- suivre les tendances de présence
- exporter certaines données

### 2.9 Export Excel

Depuis la gestion des présences, l'administrateur peut télécharger un fichier Excel.

L'export peut contenir :

- étudiant
- formation
- cours / séance
- date
- horaires
- statut
- source de la présence

Utilisation conseillée :

1. appliquer les filtres nécessaires
2. cliquer sur `Télécharger Excel`
3. exploiter le fichier pour archivage ou reporting

### 2.10 Mon profil administrateur

La section `Mon profil` permet à l'administrateur de gérer son compte.

Actions possibles :

- modifier prénom, nom, email, téléphone
- changer la photo de profil
- changer le mot de passe

## 3. Guide étudiant

### 3.1 Tableau de bord

Le `Dashboard` étudiant donne une vue personnalisée.

Il permet de voir :

- le taux global de présence
- les cours ou séances à venir
- les dernières présences
- les absences ou retards
- la progression globale

### 3.2 Mon profil

La section `Mon profil` permet à l'étudiant de mettre à jour ses informations personnelles.

Actions possibles :

- modifier son téléphone
- modifier sa photo de profil
- changer son mot de passe

### 3.3 Mes cours

La section `Mes cours` affiche les séances associées aux formations de l'étudiant.

L'étudiant peut :

- voir les séances à venir
- consulter les dates et horaires
- identifier le type de cours
- filtrer ou trier les données si besoin

### 3.4 Calendrier

La section `Calendrier` permet de visualiser les séances sous forme calendaire.

Utilisation :

- voir les séances par jour
- naviguer par mois
- sélectionner rapidement une date
- consulter le détail des journées planifiées

### 3.5 Mes présences

La section `Mes présences` regroupe l'historique des présences enregistrées.

L'étudiant peut y consulter :

- les présences validées
- les retards
- les absences
- les dates et heures associées

### 3.6 Déclarer ma présence

La section `Déclarer ma présence` permet à l'étudiant d'enregistrer sa présence sur une séance.

Fonctionnement :

1. choisir une `séance`
2. vérifier la date et l'horaire affichés
3. saisir l'heure exacte d'arrivée
4. cliquer sur `Enregistrer ma présence`

L'écran affiche :

- la séance choisie
- la date
- l'horaire
- la formation concernée

Important :

- l'étudiant doit choisir une vraie séance planifiée
- la date de présence doit correspondre à la date de la séance
- une présence ne peut pas être enregistrée plusieurs fois pour la même séance

### 3.7 Progression

La section `Progression` affiche le suivi du taux de présence.

Le calcul utilisé est :

`Taux de présence = (heures de présence / heures prévues) × 100`

Code couleur :

- `Rouge` : 0% à 49%
- `Orange` : 50% à 74%
- `Jaune` : 75% à 89%
- `Vert` : 90% à 100%

Interprétation :

- `Excellent` : forte assiduité
- `Moyen` : présence correcte mais à surveiller
- `Faible` : attention, risque d'absences trop élevé

Cas particulier :

- si l'étudiant assiste à toutes les séances prévues, il atteint `100%`

## 4. Conseils d'exploitation

### Pour l'administrateur

- créer d'abord les formations
- créer ensuite les étudiants
- affecter les bonnes formations à chaque étudiant
- créer les cours logiques avant d'ajouter les séances
- utiliser le calendrier pour contrôler la planification
- corriger rapidement les erreurs dans les présences

### Pour l'étudiant

- vérifier régulièrement ses séances à venir
- déclarer sa présence sur la bonne séance
- tenir son profil à jour
- suivre son taux de présence pour éviter les alertes

## 5. Dépannage rapide

### Connexion impossible

Vérifier :

- que le frontend est accessible
- que le backend est en ligne
- que les identifiants sont corrects

### Présence non enregistrée

Vérifier :

- que la bonne séance est sélectionnée
- que la date correspond bien à la séance
- que la présence n'a pas déjà été enregistrée

### Les données n'apparaissent pas

Vérifier :

- que la base a bien été initialisée
- que les comptes et données de démonstration ont bien été injectés
- que le backend est connecté à MongoDB

## 6. Identifiants de démonstration

- Admin : `admin@mypresence.local` / `Admin123!`
- Étudiant : `sara@mypresence.local` / `Student123!`
