import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Package, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  type: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  cover_image_url: string | null;
  price_usd: number;
  is_active: boolean;
  is_featured: boolean;
  billing_type: string;
  billing_interval: string | null;
  affiliate_percent: number;
  created_at: string;
}

const productTypes = [
  { value: "strategy", label: "Strategy" },
  { value: "course", label: "Course" },
  { value: "bot", label: "Trading Bot" },
  { value: "signal_pack", label: "Signal Pack" },
];

export const ProductsManagementTab = () => {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    type: "strategy",
    name: "",
    slug: "",
    description: "",
    short_description: "",
    cover_image_url: "",
    price_usd: 0,
    is_active: true,
    is_featured: false,
    billing_type: "one_time",
    billing_interval: null as string | null,
    affiliate_percent: 0,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: purchases } = useQuery({
    queryKey: ["admin-product-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_purchases")
        .select("product_id, count:id")
        .select("product_id");
      if (error) throw error;
      
      // Group by product_id
      const counts: Record<string, number> = {};
      data?.forEach((p: { product_id: string }) => {
        counts[p.product_id] = (counts[p.product_id] || 0) + 1;
      });
      return counts;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const { error } = await supabase.from("products").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create product: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof form> }) => {
      const { error } = await supabase.from("products").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete product: ${error.message}`);
    },
  });

  const resetForm = () => {
    setShowDialog(false);
    setEditingProduct(null);
    setForm({
      type: "strategy",
      name: "",
      slug: "",
      description: "",
      short_description: "",
      cover_image_url: "",
      price_usd: 0,
      is_active: true,
      is_featured: false,
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      type: product.type,
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      short_description: product.short_description || "",
      cover_image_url: product.cover_image_url || "",
      price_usd: product.price_usd,
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.slug) {
      toast.error("Name and slug are required");
      return;
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Products Management</h3>
          <p className="text-sm text-muted-foreground">Manage strategies, courses, bots, and signal packs</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Create Product"}</DialogTitle>
              <DialogDescription>
                {editingProduct ? "Update product details" : "Add a new product to the catalog"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Product Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm({
                      ...form,
                      name,
                      slug: editingProduct ? form.slug : generateSlug(name),
                    });
                  }}
                  placeholder="Product name"
                />
              </div>

              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="product-slug"
                />
              </div>

              <div className="space-y-2">
                <Label>Short Description</Label>
                <Input
                  value={form.short_description}
                  onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                  placeholder="Brief description for cards"
                />
              </div>

              <div className="space-y-2">
                <Label>Full Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detailed description"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Cover Image URL</Label>
                <Input
                  value={form.cover_image_url}
                  onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Price (USD)</Label>
                <Input
                  type="number"
                  value={form.price_usd}
                  onChange={(e) => setForm({ ...form, price_usd: parseFloat(e.target.value) || 0 })}
                  min={0}
                  step={0.01}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(c) => setForm({ ...form, is_active: c })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Featured</Label>
                <Switch
                  checked={form.is_featured}
                  onCheckedChange={(c) => setForm({ ...form, is_featured: c })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingProduct ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Catalog
          </CardTitle>
          <CardDescription>All products available for purchase</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : products && products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">/{product.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{product.type.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {product.price_usd === 0 ? (
                        <Badge variant="secondary">Free</Badge>
                      ) : (
                        `$${product.price_usd.toFixed(2)}`
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        <span>{purchases?.[product.id] || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {product.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {product.is_featured && (
                          <Badge variant="outline">Featured</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(product)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this product?")) {
                              deleteMutation.mutate(product.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No products yet. Create your first product to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
