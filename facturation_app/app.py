from flask import Flask, render_template, request, redirect, url_for, flash
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'votre_cle_secrete_ici'

# Configuration de la base de données SQLite
engine = create_engine('sqlite:///facturation.db', echo=False)
Base = declarative_base()
Session = sessionmaker(bind=engine)

# Modèles de données
class Client(Base):
    __tablename__ = 'clients'
    
    id = Column(Integer, primary_key=True)
    nom = Column(String(100), nullable=False)
    email = Column(String(100))
    telephone = Column(String(20))
    adresse = Column(String(200))
    factures = relationship('Facture', back_populates='client')

class Facture(Base):
    __tablename__ = 'factures'
    
    id = Column(Integer, primary_key=True)
    numero = Column(String(50), unique=True, nullable=False)
    client_id = Column(Integer, ForeignKey('clients.id'), nullable=False)
    date_creation = Column(DateTime, default=datetime.now)
    date_echeance = Column(DateTime)
    total = Column(Float, default=0.0)
    statut = Column(String(20), default='en_attente')  # en_attente, payee, annulee
    
    client = relationship('Client', back_populates='factures')
    lignes = relationship('LigneFacture', back_populates='facture')

class LigneFacture(Base):
    __tablename__ = 'lignes_facture'
    
    id = Column(Integer, primary_key=True)
    facture_id = Column(Integer, ForeignKey('factures.id'), nullable=False)
    description = Column(String(200), nullable=False)
    quantite = Column(Integer, default=1)
    prix_unitaire = Column(Float, nullable=False)
    total = Column(Float)
    
    facture = relationship('Facture', back_populates='lignes')

# Création des tables
def init_db():
    Base.metadata.create_all(engine)

# Routes
@app.route('/')
def index():
    session = Session()
    factures = session.query(Facture).order_by(Facture.date_creation.desc()).all()
    session.close()
    return render_template('index.html', factures=factures)

@app.route('/clients')
def clients():
    session = Session()
    clients = session.query(Client).order_by(Client.nom).all()
    session.close()
    return render_template('clients.html', clients=clients)

@app.route('/client/ajouter', methods=['GET', 'POST'])
def ajouter_client():
    if request.method == 'POST':
        session = Session()
        client = Client(
            nom=request.form['nom'],
            email=request.form.get('email', ''),
            telephone=request.form.get('telephone', ''),
            adresse=request.form.get('adresse', '')
        )
        session.add(client)
        session.commit()
        session.close()
        flash('Client ajouté avec succès!', 'success')
        return redirect(url_for('clients'))
    return render_template('client_form.html')

@app.route('/factures')
def factures():
    session = Session()
    factures = session.query(Facture).order_by(Facture.date_creation.desc()).all()
    session.close()
    return render_template('factures.html', factures=factures)

@app.route('/facture/creer', methods=['GET', 'POST'])
def creer_facture():
    session = Session()
    if request.method == 'POST':
        client_id = int(request.form['client_id'])
        numero = request.form['numero']
        date_echeance = datetime.strptime(request.form['date_echeance'], '%Y-%m-%d')
        
        facture = Facture(
            numero=numero,
            client_id=client_id,
            date_echeance=date_echeance,
            statut='en_attente'
        )
        session.add(facture)
        session.commit()
        
        # Ajouter les lignes de facture
        descriptions = request.form.getlist('description[]')
        quantites = request.form.getlist('quantite[]')
        prix_unitaires = request.form.getlist('prix_unitaire[]')
        
        total_facture = 0.0
        for i in range(len(descriptions)):
            if descriptions[i]:
                qte = int(quantites[i]) if quantites[i] else 1
                prix = float(prix_unitaires[i]) if prix_unitaires[i] else 0.0
                total_ligne = qte * prix
                total_facture += total_ligne
                
                ligne = LigneFacture(
                    facture_id=facture.id,
                    description=descriptions[i],
                    quantite=qte,
                    prix_unitaire=prix,
                    total=total_ligne
                )
                session.add(ligne)
        
        facture.total = total_facture
        session.commit()
        session.close()
        flash('Facture créée avec succès!', 'success')
        return redirect(url_for('factures'))
    
    clients = session.query(Client).all()
    session.close()
    return render_template('facture_form.html', clients=clients)

@app.route('/facture/<int:id>')
def voir_facture(id):
    session = Session()
    facture = session.query(Facture).get(id)
    session.close()
    return render_template('facture_detail.html', facture=facture)

@app.route('/facture/<int:id>/payer', methods=['POST'])
def payer_facture(id):
    session = Session()
    facture = session.query(Facture).get(id)
    if facture:
        facture.statut = 'payee'
        session.commit()
        flash('Facture marquée comme payée!', 'success')
    session.close()
    return redirect(url_for('factures'))

@app.route('/facture/<int:id>/annuler', methods=['POST'])
def annuler_facture(id):
    session = Session()
    facture = session.query(Facture).get(id)
    if facture and facture.statut == 'en_attente':
        facture.statut = 'annulee'
        session.commit()
        flash('Facture annulée!', 'info')
    session.close()
    return redirect(url_for('factures'))

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
