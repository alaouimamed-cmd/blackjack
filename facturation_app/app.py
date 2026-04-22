from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'ma-cle-secrete-facturation'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///factures.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Modèles de données
class Client(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120))
    adresse = db.Column(db.Text)
    telephone = db.Column(db.String(20))
    factures = db.relationship('Facture', backref='client', lazy=True)

class Facture(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.String(50), unique=True, nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=False)
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    date_echeance = db.Column(db.DateTime)
    statut = db.Column(db.String(20), default='en_attente')  # en_attente, payee, annulee
    lignes = db.relationship('LigneFacture', backref='facture', lazy=True)
    
    @property
    def total(self):
        return sum(ligne.total for ligne in self.lignes)

class LigneFacture(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    facture_id = db.Column(db.Integer, db.ForeignKey('facture.id'), nullable=False)
    description = db.Column(db.String(200), nullable=False)
    quantite = db.Column(db.Integer, default=1)
    prix_unitaire = db.Column(db.Float, nullable=False)
    
    @property
    def total(self):
        return self.quantite * self.prix_unitaire

# Routes
@app.route('/')
def index():
    factures = Facture.query.order_by(Facture.date_creation.desc()).all()
    return render_template('index.html', factures=factures)

@app.route('/clients')
def clients():
    clients = Client.query.all()
    return render_template('clients.html', clients=clients)

@app.route('/client/ajouter', methods=['GET', 'POST'])
def ajouter_client():
    if request.method == 'POST':
        nom = request.form.get('nom')
        email = request.form.get('email')
        adresse = request.form.get('adresse')
        telephone = request.form.get('telephone')
        
        if nom:
            client = Client(nom=nom, email=email, adresse=adresse, telephone=telephone)
            db.session.add(client)
            db.session.commit()
            flash('Client ajouté avec succès!', 'success')
            return redirect(url_for('clients'))
    
    return render_template('client_form.html', client=None)

@app.route('/client/<int:id>/modifier', methods=['GET', 'POST'])
def modifier_client(id):
    client = Client.query.get_or_404(id)
    
    if request.method == 'POST':
        client.nom = request.form.get('nom')
        client.email = request.form.get('email')
        client.adresse = request.form.get('adresse')
        client.telephone = request.form.get('telephone')
        
        db.session.commit()
        flash('Client modifié avec succès!', 'success')
        return redirect(url_for('clients'))
    
    return render_template('client_form.html', client=client)

@app.route('/client/<int:id>/supprimer', methods=['POST'])
def supprimer_client(id):
    client = Client.query.get_or_404(id)
    db.session.delete(client)
    db.session.commit()
    flash('Client supprimé avec succès!', 'success')
    return redirect(url_for('clients'))

@app.route('/facture/creer', methods=['GET', 'POST'])
def creer_facture():
    if request.method == 'POST':
        client_id = request.form.get('client_id')
        numero = request.form.get('numero')
        date_echeance_str = request.form.get('date_echeance')
        
        if not client_id or not numero:
            flash('Veuillez remplir les champs obligatoires', 'error')
            return redirect(url_for('creer_facture'))
        
        date_echeance = None
        if date_echeance_str:
            date_echeance = datetime.strptime(date_echeance_str, '%Y-%m-%d')
        
        facture = Facture(
            numero=numero,
            client_id=int(client_id),
            date_echeance=date_echeance
        )
        db.session.add(facture)
        db.session.commit()
        
        flash('Facture créée avec succès!', 'success')
        return redirect(url_for('ajouter_ligne', facture_id=facture.id))
    
    clients = Client.query.all()
    return render_template('facture_form.html', facture=None, clients=clients)

@app.route('/facture/<int:facture_id>/ajouter-ligne', methods=['GET', 'POST'])
def ajouter_ligne(facture_id):
    facture = Facture.query.get_or_404(facture_id)
    
    if request.method == 'POST':
        description = request.form.get('description')
        quantite = int(request.form.get('quantite', 1))
        prix_unitaire = float(request.form.get('prix_unitaire'))
        
        if description and prix_unitaire:
            ligne = LigneFacture(
                facture_id=facture_id,
                description=description,
                quantite=quantite,
                prix_unitaire=prix_unitaire
            )
            db.session.add(ligne)
            db.session.commit()
            flash('Ligne ajoutée avec succès!', 'success')
            return redirect(url_for('voir_facture', id=facture_id))
    
    return render_template('ligne_form.html', facture=facture, ligne=None)

@app.route('/facture/<int:id>')
def voir_facture(id):
    facture = Facture.query.get_or_404(id)
    return render_template('facture_detail.html', facture=facture)

@app.route('/facture/<int:id>/modifier', methods=['GET', 'POST'])
def modifier_facture(id):
    facture = Facture.query.get_or_404(id)
    
    if request.method == 'POST':
        facture.numero = request.form.get('numero')
        facture.date_echeance = datetime.strptime(request.form.get('date_echeance'), '%Y-%m-%d') if request.form.get('date_echeance') else None
        facture.statut = request.form.get('statut')
        
        db.session.commit()
        flash('Facture modifiée avec succès!', 'success')
        return redirect(url_for('voir_facture', id=facture.id))
    
    clients = Client.query.all()
    return render_template('facture_form.html', facture=facture, clients=clients)

@app.route('/facture/<int:id>/supprimer', methods=['POST'])
def supprimer_facture(id):
    facture = Facture.query.get_or_404(id)
    db.session.delete(facture)
    db.session.commit()
    flash('Facture supprimée avec succès!', 'success')
    return redirect(url_for('index'))

@app.route('/facture/<int:id>/statut/<statut>')
def changer_statut(id, statut):
    facture = Facture.query.get_or_404(id)
    if statut in ['en_attente', 'payee', 'annulee']:
        facture.statut = statut
        db.session.commit()
        flash(f'Statut changé à {statut}', 'success')
    return redirect(url_for('voir_facture', id=id))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)
