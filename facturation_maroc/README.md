# Logiciel de Facturation Maroc

Un logiciel de facturation en Python conforme à la législation fiscale marocaine.

## 🇲🇦 Conformité Législation Marocaine

Ce logiciel respecte les exigences du Code Général des Impôts (CGI) marocain :

- **ICE (Identifiant Commun de l'Entreprise)** : Obligatoire pour toutes les factures
- **Taux de TVA** : 7%, 10%, 14%, 20% et exonéré
- **Timbre fiscal** : 0.5% du montant TTC (minimum 1.50 DH, maximum 5000 DH)
- **Mentions légales obligatoires** : RC, Patente, IFF, CNSS
- **Conservation** : 10 ans recommandée

## Installation

```bash
# Optionnel : Pour générer des PDF
pip install reportlab

# Lancer le logiciel
python facturation.py
```

## Fonctionnalités

### Types de factures supportés
- Facture normale
- Facture Proforma
- Facture d'Avoir
- Note de Débit

### Taux de TVA marocains
- **20%** : Taux normal
- **14%** : Taux intermédiaire
- **10%** : Taux intermédiaire (hôtellerie, restauration, etc.)
- **7%** : Taux réduit (produits de première nécessité)
- **0%** : Exonéré (export, certaines activités)

### Calcul automatique
- Total HT (Hors Taxe)
- Total TVA par taux
- Total TTC (Toutes Taxes Comprises)
- Timbre fiscal (0.5%)
- Net à payer

### Export
- Format texte (.txt)
- Format JSON (.json)
- Format PDF (.pdf) - avec reportlab

## Exemple d'utilisation

```python
from facturation import (
    Entreprise, Client, LigneFacture, Facture, 
    TypeTVA, TypeFacture
)
from datetime import datetime

# Créer l'entreprise
entreprise = Entreprise(
    nom="Votre Société SARL",
    adresse="123 Boulevard Mohammed V, Casablanca",
    ice="001234567890123",
    rc="123456",
    patente="12345678",
    iff="12345678",
    cnss="1234567",
    telephone="+212 522 12 34 56",
    email="contact@votre-societe.ma"
)

# Créer le client
client = Client(
    nom="Client SA",
    adresse="456 Avenue Hassan II, Rabat",
    ice="009876543210987",
    telephone="+212 537 98 76 54"
)

# Créer les lignes de facture
lignes = [
    LigneFacture(
        description="Prestation de service",
        quantite=10,
        prix_unitaire_ht=500.0,
        tva=TypeTVA.TAUX_20,
        remise_percent=5.0
    ),
    LigneFacture(
        description="Formation",
        quantite=3,
        prix_unitaire_ht=1200.0,
        tva=TypeTVA.TAUX_10
    )
]

# Créer la facture
facture = Facture(
    numero="FAC-2024-001",
    date_emission=datetime.now(),
    entreprise=entreprise,
    client=client,
    lignes=lignes,
    type_facture=TypeFacture.FACTURE,
    mode_paiement="Virement bancaire"
)

# Afficher les totaux
print(f"Total HT: {facture.total_ht:.2f} DH")
print(f"Total TVA: {facture.total_tva:.2f} DH")
print(f"Total TTC: {facture.total_ttc:.2f} DH")
print(f"Timbre fiscal: {facture.timbre_fiscal:.2f} DH")
print(f"Net à payer: {facture.net_a_payer:.2f} DH")

# Générer les fichiers
facture.generer_txt("ma_facture.txt")
facture.to_json("ma_facture.json")
facture.generer_pdf("ma_facture.pdf")  # Nécessite reportlab
```

## Structure du projet

```
facturation_maroc/
├── facturation.py      # Module principal
├── README.md           # Documentation
├── facture_exemple.txt # Exemple de sortie texte
└── facture_exemple.json # Exemple de sortie JSON
```

## Mentions importantes

### Obligations légales au Maroc
1. **ICE obligatoire** : Toutes les factures doivent mentionner l'ICE de l'émetteur et du client (si assujetti)
2. **Numérotation séquentielle** : Les factures doivent être numérotées de manière séquentielle
3. **Délai de conservation** : 10 ans minimum
4. **Langue** : Les factures peuvent être en français ou en arabe

### Timbre fiscal
- Taux : 0.5% du montant TTC
- Minimum : 1.50 DH
- Maximum : 5000 DH
- Arrondi : Au multiple de 1.50 DH le plus proche
- Non applicable : Exportations et certaines opérations exonérées

## Licence

Ce logiciel est fourni à titre éducatif. Consultez un expert-comptable pour une conformité totale.

## Contact

Pour toute question sur la conformité fiscale au Maroc, contactez la Direction Générale des Impôts (DGI).
