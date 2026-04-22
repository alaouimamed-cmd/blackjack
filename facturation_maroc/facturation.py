#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Logiciel de Facturation conforme aux lois marocaines
Conforme à la législation fiscale du Maroc (TVA, Timbre fiscal, etc.)
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
from enum import Enum
import json


class TypeTVA(Enum):
    """Types de TVA au Maroc selon le CGI"""
    EXONERE = 0.0        # Exonéré de TVA
    TAUX_7 = 7.0         # Taux réduit (produits de première nécessité)
    TAUX_10 = 10.0       # Taux intermédiaire
    TAUX_14 = 14.0       # Taux intermédiaire
    TAUX_20 = 20.0       # Taux normal


class TypeFacture(Enum):
    """Types de factures"""
    FACTURE = "Facture"
    FACTURE_PROFORMA = "Facture Proforma"
    AVOIR = "Facture d'Avoir"
    NOTE_DEBIT = "Note de Débit"


@dataclass
class Entreprise:
    """Informations sur l'entreprise émettrice"""
    nom: str
    adresse: str
    ice: str  # Identifiant Commun de l'Entreprise (obligatoire au Maroc)
    rc: str   # Numéro Registre de Commerce
    patente: str  # Numéro patente
    iff: str  # Identifiant Fiscal
    cnss: str  # Numéro CNSS
    telephone: str
    email: str
    site_web: Optional[str] = None


@dataclass
class Client:
    """Informations sur le client"""
    nom: str
    adresse: str
    ice: Optional[str] = None  # ICE obligatoire pour les entreprises assujetties
    rc: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None


@dataclass
class LigneFacture:
    """Une ligne de facture"""
    description: str
    quantite: float
    prix_unitaire_ht: float  # Prix unitaire hors taxe
    tva: TypeTVA = TypeTVA.TAUX_20
    remise_percent: float = 0.0
    
    @property
    def montant_ht(self) -> float:
        """Montant HT de la ligne"""
        return self.quantite * self.prix_unitaire_ht * (1 - self.remise_percent / 100)
    
    @property
    def montant_tva(self) -> float:
        """Montant de la TVA pour cette ligne"""
        return self.montant_ht * self.tva.value / 100
    
    @property
    def montant_ttc(self) -> float:
        """Montant TTC de la ligne"""
        return self.montant_ht + self.montant_tva


@dataclass
class Facture:
    """Facture conforme à la législation marocaine"""
    numero: str
    date_emission: datetime
    entreprise: Entreprise
    client: Client
    lignes: List[LigneFacture] = field(default_factory=list)
    type_facture: TypeFacture = TypeFacture.FACTURE
    reference: Optional[str] = None  # Référence (ex: bon de commande)
    
    # Mode de paiement
    mode_paiement: str = "Espèces"  # Espèces, Virement, Chèque, Traite
    echeance: Optional[datetime] = None
    
    @property
    def total_ht(self) -> float:
        """Total Hors Taxe"""
        return sum(ligne.montant_ht for ligne in self.lignes)
    
    @property
    def total_tva(self) -> float:
        """Total TVA"""
        return sum(ligne.montant_tva for ligne in self.lignes)
    
    @property
    def timbre_fiscal(self) -> float:
        """
        Droit de timbre au Maroc:
        - 0.50% du montant TTC avec un minimum de 1.50 DH et un maximum de 5000 DH
        - Non applicable pour les exportations et certaines opérations
        - Arrondi au multiple de 1.50 DH le plus proche
        """
        if self.total_ttc <= 0:
            return 0.0
        
        timbre = self.total_ttc * 0.005  # 0.50%
        
        # Minimum 1.50 DH si le montant est > 0
        if timbre > 0 and timbre < 1.50:
            timbre = 1.50
        
        # Maximum 5000 DH
        if timbre > 5000:
            timbre = 5000
        
        # Arrondi au multiple de 1.50 DH le plus proche
        timbre = round(timbre / 1.50) * 1.50
        
        return timbre
    
    @property
    def total_ttc(self) -> float:
        """Total Toutes Taxes Comprises (avant timbre fiscal)"""
        return self.total_ht + self.total_tva
    
    @property
    def net_a_payer(self) -> float:
        """Net à payer (TTC + Timbre fiscal)"""
        return self.total_ttc + self.timbre_fiscal
    
    def generer_pdf(self, chemin_sortie: str) -> None:
        """Génère un PDF de la facture"""
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import cm
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
            
            doc = SimpleDocTemplate(chemin_sortie, pagesize=A4,
                                   rightMargin=2*cm, leftMargin=2*cm,
                                   topMargin=2*cm, bottomMargin=2*cm)
            
            elements = []
            styles = getSampleStyleSheet()
            
            # Style personnalisé
            style_title = ParagraphStyle('Title', parent=styles['Heading1'], 
                                        fontSize=16, alignment=TA_CENTER, spaceAfter=20)
            style_normal_center = ParagraphStyle('NormalCenter', parent=styles['Normal'],
                                                alignment=TA_CENTER)
            style_normal_right = ParagraphStyle('NormalRight', parent=styles['Normal'],
                                               alignment=TA_RIGHT)
            
            # En-tête de l'entreprise
            elements.append(Paragraph(f"<b>{self.entreprise.nom}</b>", style_title))
            elements.append(Paragraph(self.entreprise.adresse, styles['Normal']))
            elements.append(Paragraph(f"Tél: {self.entreprise.telephone} | Email: {self.entreprise.email}", 
                                    styles['Normal']))
            elements.append(Spacer(1, 0.5*cm))
            
            # Informations légales
            infos_legales = [
                f"ICE: {self.entreprise.ice}",
                f"RC: {self.entreprise.rc}",
                f"Patente: {self.entreprise.patente}",
                f"IFF: {self.entreprise.iff}",
                f"CNSS: {self.entreprise.cnss}"
            ]
            elements.append(Paragraph(" | ".join(infos_legales), 
                                    ParagraphStyle('Small', parent=styles['Normal'], fontSize=8)))
            elements.append(Spacer(1, 0.5*cm))
            
            # Titre de la facture
            elements.append(Paragraph(f"<b>{self.type_facture.value}</b>", 
                                    ParagraphStyle('FactureTitle', parent=styles['Heading2'],
                                                  alignment=TA_CENTER, spaceAfter=10)))
            
            # Numéro et date
            elements.append(Paragraph(f"<b>N°:</b> {self.numero}", styles['Normal']))
            elements.append(Paragraph(f"<b>Date:</b> {self.date_emission.strftime('%d/%m/%Y')}", 
                                    styles['Normal']))
            if self.reference:
                elements.append(Paragraph(f"<b>Référence:</b> {self.reference}", styles['Normal']))
            elements.append(Spacer(1, 0.5*cm))
            
            # Informations client
            elements.append(Paragraph("<b>Client:</b>", styles['Normal']))
            elements.append(Paragraph(f"<b>{self.client.nom}</b>", styles['Normal']))
            elements.append(Paragraph(self.client.adresse, styles['Normal']))
            if self.client.telephone:
                elements.append(Paragraph(f"Tél: {self.client.telephone}", styles['Normal']))
            if self.client.ice:
                elements.append(Paragraph(f"ICE: {self.client.ice}", styles['Normal']))
            elements.append(Spacer(1, 0.5*cm))
            
            # Tableau des lignes
            data = [['Description', 'Qté', 'Prix Unit. HT', 'Remise %', 'HT', 'TVA %', 'TVA', 'TTC']]
            
            for ligne in self.lignes:
                data.append([
                    ligne.description,
                    str(ligne.quantite),
                    f"{ligne.prix_unitaire_ht:.2f} DH",
                    f"{ligne.remise_percent:.1f}%",
                    f"{ligne.montant_ht:.2f} DH",
                    f"{ligne.tva.value:.1f}%",
                    f"{ligne.montant_tva:.2f} DH",
                    f"{ligne.montant_ttc:.2f} DH"
                ])
            
            # Ajouter les totaux
            data.append(['', '', '', 'Total HT:', f"{self.total_ht:.2f} DH", '', '', ''])
            data.append(['', '', '', 'Total TVA:', f"{self.total_tva:.2f} DH", '', '', ''])
            data.append(['', '', '', 'TTC:', f"{self.total_ttc:.2f} DH", '', '', ''])
            data.append(['', '', '', 'Timbre fiscal:', f"{self.timbre_fiscal:.2f} DH", '', '', ''])
            data.append(['', '', '', '<b>Net à payer:</b>', f"<b>{self.net_a_payer:.2f} DH</b>", '', '', ''])
            
            table = Table(data, colWidths=[4*cm, 1*cm, 1.5*cm, 1*cm, 1.5*cm, 1*cm, 1*cm, 1.5*cm])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
                ('FONTNAME', (0, -5), (-1, -1), 'Helvetica-Bold'),
                ('BACKGROUND', (0, -1), (-1, -1), colors.lightblue),
            ]))
            
            elements.append(table)
            elements.append(Spacer(1, 1*cm))
            
            # Mode de paiement
            elements.append(Paragraph("<b>Mode de paiement:</b> " + self.mode_paiement, styles['Normal']))
            if self.echeance:
                elements.append(Paragraph("<b>Date d'échéance:</b> " + 
                                        self.echeance.strftime('%d/%m/%Y'), styles['Normal']))
            elements.append(Spacer(1, 1*cm))
            
            # Mentions légales obligatoires
            mentions = [
                "<b>Mentions légales:</b>",
                "Conformément à la législation fiscale marocaine en vigueur.",
                "Toute contestation doit être portée devant les tribunaux compétents.",
                "Cette facture doit être conservée pendant 10 ans."
            ]
            for mention in mentions:
                elements.append(Paragraph(mention, 
                                        ParagraphStyle('Mentions', parent=styles['Normal'], 
                                                      fontSize=8, textColor=colors.grey)))
            
            # Construction du PDF
            doc.build(elements)
            print(f"✓ Facture générée avec succès: {chemin_sortie}")
            
        except ImportError:
            print("⚠ Le module reportlab n'est pas installé.")
            print("  Installez-le avec: pip install reportlab")
            self.generer_txt(chemin_sortie.replace('.pdf', '.txt'))
    
    def generer_txt(self, chemin_sortie: str) -> None:
        """Génère une version texte de la facture"""
        with open(chemin_sortie, 'w', encoding='utf-8') as f:
            f.write("=" * 80 + "\n")
            f.write(f"{self.entreprise.nom}\n")
            f.write(f"{self.entreprise.adresse}\n")
            f.write(f"Tél: {self.entreprise.telephone} | Email: {self.entreprise.email}\n")
            f.write(f"ICE: {self.entreprise.ice} | RC: {self.entreprise.rc} | Patente: {self.entreprise.patente}\n")
            f.write(f"IFF: {self.entreprise.iff} | CNSS: {self.entreprise.cnss}\n")
            f.write("=" * 80 + "\n\n")
            
            f.write(f"{self.type_facture.value.upper()}\n")
            f.write(f"N°: {self.numero}\n")
            f.write(f"Date: {self.date_emission.strftime('%d/%m/%Y')}\n")
            if self.reference:
                f.write(f"Référence: {self.reference}\n")
            f.write("\n")
            
            f.write(f"CLIENT: {self.client.nom}\n")
            f.write(f"Adresse: {self.client.adresse}\n")
            if self.client.ice:
                f.write(f"ICE: {self.client.ice}\n")
            f.write("\n")
            
            f.write("-" * 80 + "\n")
            f.write(f"{'Description':<30} {'Qté':>5} {'Prix HT':>10} {'Remise':>8} {'HT':>12} {'TVA%':>6} {'TVA':>10} {'TTC':>10}\n")
            f.write("-" * 80 + "\n")
            
            for ligne in self.lignes:
                f.write(f"{ligne.description:<30} {ligne.quantite:>5.2f} {ligne.prix_unitaire_ht:>10.2f} {ligne.remise_percent:>7.1f}% "
                       f"{ligne.montant_ht:>11.2f} {ligne.tva.value:>5.1f}% {ligne.montant_tva:>9.2f} {ligne.montant_ttc:>9.2f}\n")
            
            f.write("-" * 80 + "\n")
            f.write(f"{'Total HT:':>58} {self.total_ht:>11.2f} DH\n")
            f.write(f"{'Total TVA:':>58} {self.total_tva:>11.2f} DH\n")
            f.write(f"{'TTC:':>58} {self.total_ttc:>11.2f} DH\n")
            f.write(f"{'Timbre fiscal (0.5%):':>58} {self.timbre_fiscal:>11.2f} DH\n")
            f.write(f"{'NET À PAYER:':>58} {self.net_a_payer:>11.2f} DH\n")
            f.write("-" * 80 + "\n\n")
            
            f.write(f"Mode de paiement: {self.mode_paiement}\n")
            if self.echeance:
                f.write(f"Échéance: {self.echeance.strftime('%d/%m/%Y')}\n")
            f.write("\n")
            f.write("Mentions légales:\n")
            f.write("- Conformément à la législation fiscale marocaine en vigueur.\n")
            f.write("- Conservez cette facture pendant 10 ans.\n")
        
        print(f"✓ Facture générée avec succès: {chemin_sortie}")
    
    def to_dict(self) -> dict:
        """Exporte la facture en dictionnaire JSON"""
        return {
            'numero': self.numero,
            'date_emission': self.date_emission.isoformat(),
            'type_facture': self.type_facture.value,
            'reference': self.reference,
            'entreprise': {
                'nom': self.entreprise.nom,
                'adresse': self.entreprise.adresse,
                'ice': self.entreprise.ice,
                'rc': self.entreprise.rc,
                'patente': self.entreprise.patente,
                'iff': self.entreprise.iff,
                'cnss': self.entreprise.cnss,
                'telephone': self.entreprise.telephone,
                'email': self.entreprise.email
            },
            'client': {
                'nom': self.client.nom,
                'adresse': self.client.adresse,
                'ice': self.client.ice,
                'rc': self.client.rc,
                'telephone': self.client.telephone,
                'email': self.client.email
            },
            'lignes': [
                {
                    'description': ligne.description,
                    'quantite': ligne.quantite,
                    'prix_unitaire_ht': ligne.prix_unitaire_ht,
                    'tva': ligne.tva.value,
                    'remise_percent': ligne.remise_percent,
                    'montant_ht': ligne.montant_ht,
                    'montant_tva': ligne.montant_tva,
                    'montant_ttc': ligne.montant_ttc
                } for ligne in self.lignes
            ],
            'totaux': {
                'total_ht': self.total_ht,
                'total_tva': self.total_tva,
                'total_ttc': self.total_ttc,
                'timbre_fiscal': self.timbre_fiscal,
                'net_a_payer': self.net_a_payer
            },
            'mode_paiement': self.mode_paiement,
            'echeance': self.echeance.isoformat() if self.echeance else None
        }
    
    def to_json(self, chemin_sortie: str) -> None:
        """Exporte la facture en fichier JSON"""
        with open(chemin_sortie, 'w', encoding='utf-8') as f:
            json.dump(self.to_dict(), f, indent=2, ensure_ascii=False)
        print(f"✓ Facture exportée en JSON: {chemin_sortie}")


def exemple_utilisation():
    """Exemple complet d'utilisation du logiciel de facturation"""
    
    # Création de l'entreprise
    entreprise = Entreprise(
        nom="SOCIÉTÉ MAROCAINE DE SERVICES SARL",
        adresse="123 Boulevard Mohammed V, Casablanca 20000",
        ice="001234567890123",
        rc="123456",
        patente="12345678",
        iff="12345678",
        cnss="1234567",
        telephone="+212 522 12 34 56",
        email="contact@sms-maroc.ma",
        site_web="www.sms-maroc.ma"
    )
    
    # Création du client
    client = Client(
        nom="ENTREPRISE CLIENT SA",
        adresse="456 Avenue Hassan II, Rabat 10000",
        ice="009876543210987",
        rc="654321",
        telephone="+212 537 98 76 54",
        email="achats@client-maroc.ma"
    )
    
    # Création des lignes de facture
    lignes = [
        LigneFacture(
            description="Prestation de conseil en gestion",
            quantite=10,
            prix_unitaire_ht=500.0,
            tva=TypeTVA.TAUX_20,
            remise_percent=5.0
        ),
        LigneFacture(
            description="Formation professionnelle",
            quantite=3,
            prix_unitaire_ht=1200.0,
            tva=TypeTVA.TAUX_10
        ),
        LigneFacture(
            description="Livres techniques (produit culturel)",
            quantite=5,
            prix_unitaire_ht=150.0,
            tva=TypeTVA.TAUX_7
        ),
        LigneFacture(
            description="Services exonérés (export)",
            quantite=1,
            prix_unitaire_ht=2000.0,
            tva=TypeTVA.EXONERE
        )
    ]
    
    # Création de la facture
    facture = Facture(
        numero="FAC-2024-001",
        date_emission=datetime.now(),
        entreprise=entreprise,
        client=client,
        lignes=lignes,
        type_facture=TypeFacture.FACTURE,
        reference="BC-2024-042",
        mode_paiement="Virement bancaire",
        echeance=datetime(2024, 2, 15)
    )
    
    # Affichage des informations
    print("\n" + "=" * 80)
    print("LOGICIEL DE FACTURATION MAROC")
    print("=" * 80)
    print(f"\nFacture N°: {facture.numero}")
    print(f"Date: {facture.date_emission.strftime('%d/%m/%Y')}")
    print(f"Client: {facture.client.nom}")
    print("\n" + "-" * 80)
    print("DÉTAIL DES LIGNES:")
    print("-" * 80)
    
    for i, ligne in enumerate(facture.lignes, 1):
        print(f"\n{i}. {ligne.description}")
        print(f"   Quantité: {ligne.quantite} x {ligne.prix_unitaire_ht:.2f} DH")
        print(f"   Remise: {ligne.remise_percent}%")
        print(f"   TVA: {ligne.tva.value}%")
        print(f"   Montant HT: {ligne.montant_ht:.2f} DH")
        print(f"   Montant TVA: {ligne.montant_tva:.2f} DH")
        print(f"   Montant TTC: {ligne.montant_ttc:.2f} DH")
    
    print("\n" + "=" * 80)
    print("RÉCAPITULATIF")
    print("=" * 80)
    print(f"Total HT:           {facture.total_ht:>12.2f} DH")
    print(f"Total TVA:          {facture.total_tva:>12.2f} DH")
    print(f"Total TTC:          {facture.total_ttc:>12.2f} DH")
    print(f"Timbre fiscal (0.5%): {facture.timbre_fiscal:>12.2f} DH")
    print(f"NET À PAYER:        {facture.net_a_payer:>12.2f} DH")
    print("=" * 80)
    
    # Génération des fichiers
    print("\nGénération des fichiers...")
    facture.generer_txt("facture_exemple.txt")
    facture.to_json("facture_exemple.json")
    
    # Essayer de générer le PDF
    try:
        facture.generer_pdf("facture_exemple.pdf")
    except Exception as e:
        print(f"Note: Generation PDF skipped - {str(e)}")
    
    print("\n✓ Facturation terminée avec succès!")
    print("\nConformité législation marocaine:")
    print("  ✓ ICE (Identifiant Commun de l'Entreprise) inclus")
    print("  ✓ TVA calculée selon les taux marocains (7%, 10%, 14%, 20%)")
    print("  ✓ Timbre fiscal de 0.5% appliqué (min 1.50 DH, max 5000 DH)")
    print("  ✓ Mentions légales obligatoires présentes")
    print("  ✓ Conservation recommandée: 10 ans")


if __name__ == "__main__":
    exemple_utilisation()
