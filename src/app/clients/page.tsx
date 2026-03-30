'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Mail, Phone, Building, Edit, Trash2 } from 'lucide-react';
import { CLIENT_TYPES, formatCurrency } from '@/lib/invoice-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const sampleClients = [
  { id: '1', name: 'SARP MAROC', type: 'entreprise', ice: '001234567890001', email: 'contact@sarp.ma', phone: '+212 522 00 00 00', city: 'Casablanca' },
  { id: '2', name: 'DISWAY', type: 'entreprise', ice: '001234567890002', email: 'info@disway.ma', phone: '+212 522 00 00 01', city: 'Casablanca' },
  { id: '3', name: 'Marjane Holding', type: 'entreprise', ice: '001234567890003', email: 'contact@marjane.ma', phone: '+212 537 00 00 00', city: 'Rabat' },
  { id: '4', name: 'Orange Maroc', type: 'entreprise', ice: '001234567890004', email: 'pro@orange.ma', phone: '+212 522 00 00 02', city: 'Casablanca' },
  { id: '5', name: 'Ahmed Bennani', type: 'particulier', ice: '', email: 'ahmed.bennani@email.com', phone: '+212 661 00 00 00', city: 'Rabat' },
];

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filteredClients = sampleClients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || client.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Gérez votre portefeuille clients
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau client</DialogTitle>
              <DialogDescription>
                Remplissez les informations du client. L'ICE est obligatoire pour les entreprises.
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type de client</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet / Raison sociale *</Label>
                  <Input id="name" placeholder="Ex: SARL EXEMPLE" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ice">ICE (Identifiant Commun de l'Entreprise)</Label>
                <Input id="ice" placeholder="15 chiffres" maxLength={15} />
                <p className="text-xs text-muted-foreground">
                  Obligatoire pour les entreprises assujetties à la TVA
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="if">IF (Identifiant Fiscal)</Label>
                  <Input id="if" placeholder="Ex: 12345678" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rc">RC (Registre de Commerce)</Label>
                  <Input id="rc" placeholder="Ex: 123456" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pat">Patente</Label>
                  <Input id="pat" placeholder="Ex: 12345678" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mf">MF (Modèle Formulaire)</Label>
                  <Input id="mf" placeholder="Ex: 12345678" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" placeholder="Adresse complète" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input id="city" placeholder="Ex: Casablanca" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" placeholder="+212 6XX XX XX XX" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@exemple.com" />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {CLIENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => (
          <Card key={client.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Building className="h-3 w-3" />
                    {client.city}
                  </CardDescription>
                </div>
                <Badge variant={client.type === 'entreprise' ? 'default' : 'secondary'}>
                  {CLIENT_TYPES.find(t => t.value === client.type)?.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.ice && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">ICE:</span>
                  <span className="text-muted-foreground">{client.ice}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${client.email}`} className="text-muted-foreground hover:text-primary">
                    {client.email}
                  </a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${client.phone}`} className="text-muted-foreground hover:text-primary">
                    {client.phone}
                  </a>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun client trouvé
          </CardContent>
        </Card>
      )}
    </div>
  );
}
