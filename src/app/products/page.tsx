'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { TVA_RATES, formatCurrency } from '@/lib/invoice-utils';
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

const sampleProducts = [
  { id: '1', name: 'Développement Web', description: 'Création de site web vitrine', price: 5000, tvaRate: 20, unit: 'forfait' },
  { id: '2', name: 'Maintenance mensuelle', description: 'Support et maintenance technique', price: 1500, tvaRate: 20, unit: 'mois' },
  { id: '3', name: 'Formation React', description: 'Formation développement React.js', price: 3000, tvaRate: 20, unit: 'jour' },
  { id: '4', name: 'Audit SEO', description: 'Analyse et optimisation SEO', price: 2500, tvaRate: 20, unit: 'forfait' },
  { id: '5', name: 'Licence logiciel', description: 'Licence annuelle', price: 1200, tvaRate: 20, unit: 'an' },
];

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filteredProducts = sampleProducts.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produits & Services</h1>
          <p className="text-muted-foreground">
            Gérez votre catalogue de produits et services
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau produit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau produit/service</DialogTitle>
              <DialogDescription>
                Remplissez les informations du produit ou service
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du produit/service *</Label>
                <Input id="name" placeholder="Ex: Développement Web" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" placeholder="Description détaillée" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Prix HT *</Label>
                  <Input id="price" type="number" step="0.01" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tva">Taux TVA (%)</Label>
                  <Select defaultValue="20">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">Normal (20%)</SelectItem>
                      <SelectItem value="14">Réduit 1 (14%)</SelectItem>
                      <SelectItem value="10">Réduit 2 (10%)</SelectItem>
                      <SelectItem value="7">Social (7%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unité</Label>
                  <Input id="unit" placeholder="unité, kg, litre..." />
                </div>
              </div>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Aperçu des prix</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Prix HT:</span>
                    <span className="font-medium">0.00 DH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TVA (20%):</span>
                    <span className="font-medium">0.00 DH</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Prix TTC:</span>
                    <span>0.00 DH</span>
                  </div>
                </CardContent>
              </Card>

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

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit ou service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                </div>
              </div>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prix HT:</span>
                  <span className="font-medium">{formatCurrency(product.price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TVA ({product.tvaRate}%):</span>
                  <span className="font-medium">{formatCurrency(product.price * product.tvaRate / 100)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Prix TTC:</span>
                  <span>{formatCurrency(product.price * (1 + product.tvaRate / 100))}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <Badge variant="outline">{product.unit}</Badge>
                <span>TVA: {product.tvaRate}%</span>
              </div>

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

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun produit trouvé
          </CardContent>
        </Card>
      )}

      {/* TVA Rates Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Taux de TVA au Maroc</CardTitle>
          <CardDescription>
            Rappel des différents taux de TVA applicables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(TVA_RATES).map(([key, rate]) => (
              <div key={key} className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{rate}%</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {key === 'normal' ? 'Taux normal' : 
                   key === 'reduite1' ? '1er taux réduit' :
                   key === 'reduite2' ? '2ème taux réduit' : 'Taux social'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Badge({ variant, children }: { variant?: string; children: React.ReactNode }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${
      variant === 'outline' ? 'border' : 'bg-primary text-primary-foreground'
    }`}>
      {children}
    </span>
  );
}
