import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, Eye, EyeOff } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Product } from "@shared/schema";

export function StockPanel() {
  const [showAllProducts, setShowAllProducts] = useState(false);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: lowStockProducts } = useQuery({
    queryKey: ["/api/manager/low-stock"],
    refetchInterval: 30000,
  });

  // Ensure arrays are always defined
  const productsList = products || [];
  const lowStockList = lowStockProducts || [];

  const getStockStatus = (product: Product) => {
    if (product.stockQuantity === 0) {
      return { status: 'out_of_stock', color: 'bg-red-500', text: 'Esgotado' };
    } else if (product.stockQuantity <= product.minStockLevel) {
      return { status: 'low_stock', color: 'bg-orange-500', text: 'Stock Baixo' };
    } else if (product.stockQuantity <= product.minStockLevel * 1.5) {
      return { status: 'warning', color: 'bg-yellow-500', text: 'Atenção' };
    } else {
      return { status: 'normal', color: 'bg-green-500', text: 'Normal' };
    }
  };

  const displayProducts = showAllProducts ? productsList : lowStockList;

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Controlo de Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-700 p-3 rounded-lg animate-pulse">
                <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-600 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Controlo de Stock
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-red-500 text-white">
              {lowStockList.length} Alertas
            </Badge>
            <Button
              onClick={() => setShowAllProducts(!showAllProducts)}
              size="sm"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              {showAllProducts ? (
                <>
                  <EyeOff className="w-4 h-4 mr-1" />
                  Só Alertas
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  Todos
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {lowStockList.length === 0 && !showAllProducts ? (
          <div className="text-center py-6">
            <Package className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-green-400 font-medium">Stock em bom estado</p>
            <p className="text-sm text-gray-400 mt-1">Nenhum produto com stock baixo</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {displayProducts.map((product: any) => {
              const stockInfo = getStockStatus(product);
              return (
                <div key={product.id} className="bg-gray-700 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-white">{product.name}</h4>
                        {stockInfo.status !== 'normal' && (
                          <AlertTriangle className="w-4 h-4 text-orange-400" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-400">
                          Preço: {formatCurrency(product.price)}
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">
                          Categoria: {product.category?.name || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={`${stockInfo.color} text-white text-xs`}>
                          {stockInfo.text}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <div className="text-white font-medium">
                          Stock: {product.stockQuantity || product.currentStock || 0}
                        </div>
                        <div className="text-xs text-gray-400">
                          Mín: {product.minStockLevel || product.minStock || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {(product.stockQuantity === 0 || product.currentStock === 0) && (
                    <div className="mt-2 p-2 bg-red-500 bg-opacity-20 rounded border border-red-500">
                      <p className="text-red-400 text-xs font-medium">
                        ⚠️ PRODUTO ESGOTADO - Informar cliente da indisponibilidade
                      </p>
                    </div>
                  )}
                  
                  {((product.stockQuantity > 0 && product.stockQuantity <= product.minStockLevel) || 
                    (product.currentStock > 0 && product.currentStock <= product.minStock)) && (
                    <div className="mt-2 p-2 bg-orange-500 bg-opacity-20 rounded border border-orange-500">
                      <p className="text-orange-400 text-xs">
                        📦 Stock baixo - Considerar reposição urgente
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {showAllProducts && (
          <div className="mt-4 pt-3 border-t border-gray-600">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Total de produtos:</span>
              <span className="text-white font-medium">{productsList.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-gray-400">Produtos com alerta:</span>
              <span className="text-orange-400 font-medium">{lowStockList.length}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}