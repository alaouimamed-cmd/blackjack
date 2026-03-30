'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Package, DollarSign } from 'lucide-react';

const stats = [
  {
    title: 'Factures en attente',
    value: '12',
    description: 'Ce mois-ci',
    icon: FileText,
    color: 'text-blue-600',
  },
  {
    title: 'Clients actifs',
    value: '48',
    description: 'Total',
    icon: Users,
    color: 'text-green-600',
  },
  {
    title: 'Produits',
    value: '156',
    description: 'En catalogue',
    icon: Package,
    color: 'text-purple-600',
  },
  {
    title: 'Chiffre d\'affaires',
    value: '245 000 DH',
    description: 'Ce mois-ci',
    icon: DollarSign,
    color: 'text-orange-600',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Bienvenue sur votre application de facturation conforme à la législation marocaine
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Dernières factures</CardTitle>
            <CardDescription>
              Vos factures récentes avec leur statut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { number: 'FAC-2025-001', client: 'SARP MAROC', amount: '15 000 DH', status: 'Payée' },
                { number: 'FAC-2025-002', client: 'DISWAY', amount: '8 500 DH', status: 'Envoyée' },
                { number: 'FAC-2025-003', client: 'Marjane Holding', amount: '32 000 DH', status: 'En attente' },
                { number: 'FAC-2025-004', client: 'Orange Maroc', amount: '12 400 DH', status: 'Envoyée' },
              ].map((invoice) => (
                <div key={invoice.number} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{invoice.number}</p>
                    <p className="text-sm text-muted-foreground">{invoice.client}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{invoice.amount}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      invoice.status === 'Payée' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'Envoyée' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Rappel légal</CardTitle>
            <CardDescription>
              Obligations légales au Maroc
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <p><strong>ICE obligatoire:</strong> Identifiant Commun de l'Entreprise requis pour toutes les factures</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <p><strong>TVA:</strong> Taux normal de 20% (taux réduits: 14%, 10%, 7%)</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <p><strong>Timbre fiscal:</strong> Obligatoire selon le montant TTC</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <p><strong>Conservation:</strong> 10 ans minimum pour les factures</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
