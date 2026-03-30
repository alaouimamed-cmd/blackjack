'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building, Mail, Phone, MapPin, Save } from 'lucide-react';

export default function CompanyPage() {
  const [companyData, setCompanyData] = useState({
    name: 'Votre Entreprise SARL',
    address: '123 Boulevard Mohammed V',
    city: 'Casablanca',
    ice: '001234567890001',
    pat: '12345678',
    mf: '12345678',
    rc: '123456',
    if: '12345678',
    phone: '+212 522 00 00 00',
    email: 'contact@entreprise.ma',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Informations enregistrées avec succès!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Informations de l'entreprise</h1>
        <p className="text-muted-foreground">
          Configurez les informations légales de votre entreprise
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Informations générales
            </CardTitle>
            <CardDescription>
              Raison sociale et coordonnées de votre entreprise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Raison sociale *</Label>
              <Input
                id="name"
                value={companyData.name}
                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                placeholder="Ex: VOTRE ENTREPRISE SARL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse *</Label>
              <Input
                id="address"
                value={companyData.address}
                onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                placeholder="Adresse complète"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                value={companyData.city}
                onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                placeholder="Ex: Casablanca"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={companyData.phone}
                    onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                    placeholder="+212 5XX XX XX XX"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={companyData.email}
                    onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                    placeholder="email@entreprise.ma"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Identifiants fiscaux */}
        <Card>
          <CardHeader>
            <CardTitle>Identifiants fiscaux obligatoires</CardTitle>
            <CardDescription>
              Ces informations apparaîtront sur toutes vos factures
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> L'ICE (Identifiant Commun de l'Entreprise) est obligatoire 
                sur toutes les factures émises au Maroc depuis 2017. Il se compose de 15 chiffres.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ice">ICE (Identifiant Commun de l'Entreprise) *</Label>
              <Input
                id="ice"
                value={companyData.ice}
                onChange={(e) => setCompanyData({ ...companyData, ice: e.target.value })}
                placeholder="15 chiffres"
                maxLength={15}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Format: 15 chiffres (ex: 001234567890001)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="if">IF (Identifiant Fiscal)</Label>
                <Input
                  id="if"
                  value={companyData.if}
                  onChange={(e) => setCompanyData({ ...companyData, if: e.target.value })}
                  placeholder="Ex: 12345678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rc">RC (Registre de Commerce)</Label>
                <Input
                  id="rc"
                  value={companyData.rc}
                  onChange={(e) => setCompanyData({ ...companyData, rc: e.target.value })}
                  placeholder="Ex: 123456"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pat">Patente</Label>
                <Input
                  id="pat"
                  value={companyData.pat}
                  onChange={(e) => setCompanyData({ ...companyData, pat: e.target.value })}
                  placeholder="Ex: 12345678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mf">MF (Modèle Formulaire)</Label>
                <Input
                  id="mf"
                  value={companyData.mf}
                  onChange={(e) => setCompanyData({ ...companyData, mf: e.target.value })}
                  placeholder="Ex: 12345678"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle>Logo de l'entreprise</CardTitle>
            <CardDescription>
              Votre logo apparaîtra sur les factures et devis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                <span className="text-muted-foreground text-sm text-center">
                  Aucun logo<br/>téléchargé
                </span>
              </div>
              <div className="space-y-2">
                <Button type="button" variant="outline">
                  Télécharger un logo
                </Button>
                <p className="text-xs text-muted-foreground">
                  Formats acceptés: PNG, JPG, SVG<br/>
                  Taille maximale: 2MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg">
            <Save className="mr-2 h-4 w-4" />
            Enregistrer les informations
          </Button>
        </div>
      </form>

      {/* Legal info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rappel des obligations légales</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>L'ICE doit figurer sur tous les documents commerciaux (factures, devis, bons de livraison)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Les factures doivent être conservées pendant 10 ans</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>La numérotation des factures doit être séquentielle et sans interruption</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Le timbre fiscal est obligatoire pour les factures acquittées</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
