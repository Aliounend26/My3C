# My 3C

My 3C est une plateforme web full-stack de gestion pedagogique et de formation en ligne. Le projet combine la presence par QR code, l'e-learning structure, les quiz interactifs, les dashboards par role, les ressources de cours, les videos YouTube et la communication pedagogique.

## Architecture

```text
My 3C/
|-- client/
|   |-- public/
|   |   `-- logo-my-3c.png
|   `-- src/
|       |-- components/
|       |-- context/
|       |-- hooks/
|       |-- layouts/
|       |-- pages/
|       |-- routes/
|       |-- services/
|       `-- utils/
|-- server/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- data/
|   |   |-- middlewares/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- services/
|   |   `-- utils/
|   `-- uploads/
|-- docker-compose.yml
`-- README.md
```

## Stack

- Frontend: React 18, Vite, React Router, Tailwind CSS, Axios, Recharts
- Backend: Node.js, Express, JWT, bcryptjs, multer
- Base de donnees: MongoDB avec Mongoose
- QR code: `qrcode`

MongoDB est pertinent ici car le produit manipule des entites pedagogiques souples et imbriquees: cours, chapitres, quiz, options de reponses, ressources et videos rattachables a plusieurs niveaux.

## Roles

- `superadmin`: gouvernance globale, supervision, gestion complete des utilisateurs
- `admin`: gestion des formations, classes, cours, presences, QR codes et statistiques
- `teacher`: gestion de ses cours, ressources, matieres, chapitres, quiz, annonces et messages
- `student`: consultation de ses contenus, quiz, progression et pointage QR

## Modele de donnees

Les modeles principaux sont disponibles dans [server/src/models](/c:/Users/User/Downloads/3C%20My%203C/server/src/models):

- [User.js](/c:/Users/User/Downloads/3C%20My%203C/server/src/models/User.js)
- [Formation.js](/c:/Users/User/Downloads/3C%20My%203C/server/src/models/Formation.js)
- [ClassRoom.js](/c:/Users/User/Downloads/3C%20My%203C/server/src/models/ClassRoom.js)
- [CourseGroup.js](/c:/Users/User/Downloads/3C%20My%203C/server/src/models/CourseGroup.js)
- [CourseSession.js](/c:/Users/User/Downloads/3C%20My%203C/server/src/models/CourseSession.js)
- [Subject.js](/c:/Users/User/Downloads/3C%20My%203C/server/src/models/Subject.js)
- [Lesson.js](/c:/Users/User/Downloads/3C%20My%203C/server/src/models/Lesson.js)
- [CourseMaterial.js](/c:/Users/User/Downloads/3C%20My%203C/server/src/models/CourseMaterial.js)
- [VideoResource.js](/c:/Users/User/Downloads/3C%20My%203C/server/src/models/VideoResource.js)
- [Quiz.js](/c:/Users/User/Downloads/3C%20My%203C/server/src/models/Quiz.js)
- [QuizQuestion.js](/c:/Users/User/Downloads/3C%20My%203C/server/src/models/QuizQuestion.js)
- [QuizResult.js](/c:/Users/User/Downloads/3C%20My%203C/server/src/models/QuizResult.js)
- [Announcement.js](/c:/Users/User/Downloads/3C%20My%203C/server/src/models/Announcement.js)
- [Message.js](/c:/Users/User/Downloads/3C%20My%203C/server/src/models/Message.js)
- [Attendance.js](/c:/Users/User/Downloads/3C%20My%203C/server/src/models/Attendance.js)
- [QrCode.js](/c:/Users/User/Downloads/3C%20My%203C/server/src/models/QrCode.js)

Relations principales:

- une formation contient des classes et des cours
- une classe regroupe un formateur et des etudiants
- un cours pedagogique contient des matieres
- une matiere contient des chapitres et des contenus
- une seance de cours porte la logique de presence QR
- un quiz peut etre rattache a un cours, une matiere ou un chapitre
- une ressource ou video peut etre rattachee a un cours, une matiere ou un chapitre

## Backend

Le backend Express est organise autour de:

- `controllers/` pour la logique metier HTTP
- `routes/` pour les endpoints REST
- `middlewares/` pour JWT, autorisations et gestion d'erreurs
- `services/` pour les calculs transverses comme dashboards, QR code et presence
- `data/seed.js` pour les donnees de demonstration

API principale:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/formations`
- `GET /api/classes`
- `GET /api/courses`
- `GET /api/courses/groups`
- `GET /api/subjects`
- `GET /api/lessons`
- `GET /api/resources`
- `GET /api/videos`
- `GET /api/quizzes`
- `POST /api/quizzes/:id/submit`
- `GET /api/announcements`
- `GET /api/messages`
- `GET /api/attendances`
- `GET /api/attendances/summary/:studentId?`
- `GET /api/qr-codes/:courseId`
- `GET /api/dashboard/superadmin`
- `GET /api/dashboard/admin`
- `GET /api/dashboard/teacher`
- `GET /api/dashboard/student`

## Frontend

Le frontend React/Vite fournit:

- une landing page publique
- une page de connexion
- des layouts dedies par role
- des dashboards distincts
- les pages de gestion pedagogique et de presence
- une page publique `/qr-attendance` pour le pointage via lien QR

Le routeur principal se trouve dans [client/src/routes/AppRouter.jsx](/c:/Users/User/Downloads/3C%20My%203C/client/src/routes/AppRouter.jsx).

## Fonctionnalites couvertes

- authentification JWT
- protection des routes par role
- gestion des utilisateurs
- formations, classes, cours, matieres et chapitres
- ressources pedagogiques et videos YouTube
- quiz interactifs
- annonces et messagerie simple
- generation et scan de QR code
- calcul du taux de presence
- dashboards par role
- seed de demonstration

## Seed

Le script [server/src/data/seed.js](/c:/Users/User/Downloads/3C%20My%203C/server/src/data/seed.js) cree:

- 1 SuperAdmin
- 1 Admin
- 1 Professeur
- 3 Etudiants
- 2 Formations
- 2 Classes
- 2 Cours pedagogiques
- 4 Seances avec QR code
- des matieres, chapitres, ressources, videos, quiz, annonces et messages

Comptes de demonstration:

- SuperAdmin: `superadmin@mypresence.local` / `SuperAdmin123!`
- Admin: `admin@mypresence.local` / `Admin123!`
- Professeur: `teacher@mypresence.local` / `Teacher123!`
- Etudiant: `sara@mypresence.local` / `Student123!`

## Installation

Prerequis:

- Node.js 20+
- npm 10+
- Docker Desktop ou MongoDB local

Installation:

```bash
npm install
```

Configuration minimale:

```env
# server/.env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/my_3c
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d
```

```env
# client/.env
VITE_API_URL=http://localhost:5000/api
```

Fichiers d'exemple:

- [server/.env.example](/c:/Users/User/Downloads/3C%20My%203C/server/.env.example)
- [client/.env.example](/c:/Users/User/Downloads/3C%20My%203C/client/.env.example)

Demarrer MongoDB:

```bash
npm run db:up
```

Executer le seed:

```bash
npm run seed
```

Lancer le projet:

```bash
npm run dev
```

Construire le frontend:

```bash
npm run build --workspace client
```

Acces:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Healthcheck: `http://localhost:5000/api/health`
- Pointage QR public: `http://localhost:5173/qr-attendance`

## Evolutions conseillees

- scanner camera natif avec `html5-qrcode` ou `@zxing/browser`
- validations schema avec Zod ou Joi
- permissions fines par module
- stockage cloud des supports
- notifications email ou SMS
- refresh token et sessions avancees
