# Application de Facturation en Python/Flask

## Description
Une application web de facturation simple et complète développée avec Python et Flask.

## Fonctionnalités

- **Gestion des clients** : Ajouter, modifier, supprimer des clients
- **Gestion des factures** : Créer, modifier, supprimer des factures
- **Lignes de facture** : Ajouter des produits/services aux factures avec quantité et prix
- **Suivi des statuts** : Marquer les factures comme "En attente", "Payée" ou "Annulée"
- **Calcul automatique** : Total des factures calculé automatiquement
- **Interface responsive** : Design moderne et adaptatif

## Installation

1. Installer les dépendances :
```bash
pip install flask flask-sqlalchemy
```

2. Lancer l'application :
```bash
cd facturation_app
python app.py
```

3. Accéder à l'application dans votre navigateur :
```
http://localhost:5000
```

## Structure du projet

```
facturation_app/
├── app.py                 # Application principale Flask
├── templates/             # Templates HTML
│   ├── base.html         # Template de base
│   ├── index.html        # Page d'accueil (liste des factures)
│   ├── clients.html      # Liste des clients
│   ├── client_form.html  # Formulaire client (ajout/modification)
│   ├── facture_form.html # Formulaire facture (création/modification)
│   ├── facture_detail.html # Détail d'une facture
│   └── ligne_form.html   # Formulaire d'ajout de ligne
└── static/               # Fichiers statiques (CSS, JS, images)
```

## Utilisation

### 1. Créer un client
- Allez dans "Clients" depuis le menu
- Cliquez sur "Ajouter un client"
- Remplissez les informations (nom, email, téléphone, adresse)

### 2. Créer une facture
- Cliquez sur "Nouvelle Facture" depuis le menu
- Sélectionnez un client et entrez un numéro de facture
- Ajoutez une date d'échéance (optionnel)

### 3. Ajouter des lignes à la facture
- Après avoir créé la facture, vous serez redirigé vers la page d'ajout de lignes
- Entrez la description, la quantité et le prix unitaire
- Le total est calculé automatiquement

### 4. Gérer le statut des factures
- Depuis le détail d'une facture, cliquez sur les boutons pour changer le statut
- Les statuts disponibles : En attente, Payée, Annulée

## Technologies utilisées

- **Python 3** : Langage de programmation
- **Flask** : Framework web léger
- **Flask-SQLAlchemy** : ORM pour la gestion de la base de données
- **SQLite** : Base de données (fichier local)
- **HTML/CSS** : Interface utilisateur

## Base de données

L'application utilise SQLite par défaut. Le fichier de base de données `factures.db` sera créé automatiquement dans le dossier `facturation_app` lors du premier lancement.

### Modèles de données

- **Client** : id, nom, email, adresse, telephone
- **Facture** : id, numero, client_id, date_creation, date_echeance, statut
- **LigneFacture** : id, facture_id, description, quantite, prix_unitaire

## Personnalisation

Vous pouvez modifier la clé secrète dans `app.py` :
```python
app.config['SECRET_KEY'] = 'votre-cle-secrete-personnalisee'
```

Pour utiliser une autre base de données, modifiez l'URI de connexion :
```python
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:password@localhost/dbname'
```

## Licence

Ce projet est open source et peut être utilisé librement.
