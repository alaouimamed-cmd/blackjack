'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            Application de Facturation
            <span className="block text-primary mt-2">Conforme Maroc</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Gérez vos factures, devis et clients en toute simplicité, 
            conformément à la législation marocaine en vigueur.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8">
                Accéder au tableau de bord
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="p-6 rounded-lg border bg-card">
            <div className="text-primary mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Factures & Devis</h3>
            <p className="text-muted-foreground">
              Créez des factures et devis professionnels avec calcul automatique de la TVA et du timbre fiscal.
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <div className="text-primary mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Gestion Clients</h3>
            <p className="text-muted-foreground">
              Centralisez les informations de vos clients avec leurs identifiants fiscaux (ICE, IF, RC, etc.).
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <div className="text-primary mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">100% Conforme</h3>
            <p className="text-muted-foreground">
              Respecte toutes les obligations légales marocaines : ICE obligatoire, TVA, timbre fiscal.
            </p>
          </div>
        </div>

        {/* Legal Requirements */}
        <div className="mt-24 p-8 rounded-lg bg-blue-50 border border-blue-200">
          <h2 className="text-2xl font-bold mb-6 text-center">Obligations Légales au Maroc</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <div>
                  <strong className="block">ICE Obligatoire</strong>
                  <span className="text-sm text-muted-foreground">
                    Identifiant Commun de l'Entreprise sur tous les documents
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <div>
                  <strong className="block">TVA Détaillée</strong>
                  <span className="text-sm text-muted-foreground">
                    Taux normal 20%, réduits 14%, 10%, 7%
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <div>
                  <strong className="block">Timbre Fiscal</strong>
                  <span className="text-sm text-muted-foreground">
                    Selon le montant TTC de la facture
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <div>
                  <strong className="block">Archivage 10 ans</strong>
                  <span className="text-sm text-muted-foreground">
                    Conservation obligatoire des factures
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
