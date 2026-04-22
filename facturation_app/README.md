# Application Web de Facturation en Python

Une application web simple de gestion de facturation développée avec **Flask** et **SQLAlchemy**.

## Fonctionnalités

- ✅ Gestion des clients (ajout, liste)
- ✅ Création de factures avec plusieurs lignes
- ✅ Suivi du statut des factures (en attente, payée, annulée)
- ✅ Calcul automatique des totaux
- ✅ Interface utilisateur responsive et moderne
- ✅ Base de données SQLite intégrée

## Prérequis

- Python 3.8 ou supérieur
- pip (gestionnaire de paquets Python)

## Installation

1. **Installer les dépendances :**

```bash
cd facturation_app
pip install -r requirements.txt
```

2. **Lancer l'application :**

```bash
python app.py
```

3. **Accéder à l'application :**

Ouvrez votre navigateur et rendez-vous sur : `http://localhost:5000`

## Structure du projet

```
facturation_app/
├── app.py                 # Application principale Flask
├── requirements.txt       # Dépendances Python
├── templates/             # Templates HTML
│   ├── base.html         # Template de base
│   ├── index.html        # Page d'accueil
│   ├── clients.html      # Liste des clients
│   ├── client_form.html  # Formulaire d'ajout de client
│   ├── factures.html     # Liste des factures
│   ├── facture_form.html # Formulaire de création de facture
│   └── facture_detail.html # Détail d'une facture
└── static/
    └── css/
        └── style.css     # Feuilles de style (incluses dans base.html)
```

## Utilisation

### 1. Ajouter un client
- Cliquez sur "Clients" dans le menu
- Cliquez sur "Ajouter un client"
- Remplissez le formulaire et enregistrez

### 2. Créer une facture
- Cliquez sur "Factures" dans le menu
- Cliquez sur "Créer une facture"
- Sélectionnez un client, entrez le numéro et la date d'échéance
- Ajoutez une ou plusieurs lignes de produits/services
- Enregistrez la facture

### 3. Gérer les factures
- Consultez la liste des factures
- Visualisez le détail d'une facture
- Marquez une facture comme payée
- Annulez une facture (si elle est en attente)

## Technologies utilisées

- **Flask** : Framework web Python léger
- **SQLAlchemy** : ORM pour la gestion de la base de données
- **SQLite** : Base de données légère incluse
- **HTML/CSS** : Interface utilisateur moderne et responsive

## Personnalisation

Vous pouvez modifier la clé secrète dans `app.py` :

```python
app.secret_key = 'votre_cle_secrete_ici'
```

Pour utiliser une autre base de données (MySQL, PostgreSQL), modifiez la configuration dans `app.py` :

```python
engine = create_engine('mysql+pymysql://user:password@localhost/dbname')
```

## Licence

Ce projet est open source et peut être utilisé librement.
