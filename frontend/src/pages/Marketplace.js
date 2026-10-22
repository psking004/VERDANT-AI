import { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, ShoppingCart, Star, CheckCircle, Package } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:8001' : '');
const API = `${BACKEND_URL}/api`;

const Marketplace = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState({ id: 'cart-1', user_id: 'guest', items: [] });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetchProducts();
    loadCart();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, search, categoryFilter, verifiedFilter]);

  useEffect(() => {
    const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(count);
  }, [cart]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/marketplace/products`);
      setProducts(response.data);
      setFilteredProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
      setLoading(false);
    }
  };

  const loadCart = () => {
    const savedCart = localStorage.getItem('verdant_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const saveCart = (updatedCart) => {
    localStorage.setItem('verdant_cart', JSON.stringify(updatedCart));
    setCart(updatedCart);
  };

  const applyFilters = () => {
    let filtered = products;

    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    if (verifiedFilter === 'verified') {
      filtered = filtered.filter((p) => p.verified === true);
    }

    setFilteredProducts(filtered);
  };

  const addToCart = async (product) => {
    const existingItem = cart.items.find((item) => item.product_id === product.id);
    let updatedItems;

    if (existingItem) {
      updatedItems = cart.items.map((item) =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedItems = [...cart.items, { product_id: product.id, quantity: 1 }];
    }

    const updatedCart = { ...cart, items: updatedItems };
    saveCart(updatedCart);

    try {
      await axios.post(`${API}/marketplace/cart`, updatedCart);
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const handleCheckout = async () => {
    if (cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      const originUrl = window.location.origin;
      const response = await axios.post(`${API}/marketplace/checkout`, {
        cart_id: cart.id,
        origin_url: originUrl,
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('Failed to initiate checkout');
    }
  };

  const getCartTotal = () => {
    return cart.items.reduce((total, item) => {
      const product = products.find((p) => p.id === item.product_id);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const categories = ['all', ...new Set(products.map((p) => p.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Loading marketplace...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Cart */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Verified Marketplace
          </h2>
          <p className="text-sm text-slate-600 mt-1">Purchase quality seeds, fertilizers, and rent equipment</p>
        </div>

        <div className="relative">
          <Button
            onClick={handleCheckout}
            className="bg-[#064E3B] hover:bg-[#065F46]"
            data-testid="checkout-button"
          >
            <ShoppingCart size={20} className="mr-2" />
            Checkout ({cartCount})
          </Button>
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-6" data-testid="marketplace-filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-slate-600 mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-2 block">Category</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger data-testid="category-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-2 block">Filter</label>
            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger data-testid="verified-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="verified">Verified Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="products-grid">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
            data-testid={`product-card-${product.id}`}
          >
            <div className="h-48 overflow-hidden bg-slate-100">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-slate-900 flex-1">{product.name}</h4>
                {product.verified && (
                  <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                    <CheckCircle size={12} />
                    Verified
                  </Badge>
                )}
              </div>

              <p className="text-sm text-slate-600 mb-3 line-clamp-2">{product.description}</p>

              <div className="flex items-center gap-1 mb-3">
                <Star className="text-yellow-500 fill-yellow-500" size={16} />
                <span className="text-sm font-medium text-slate-900">{product.rating}</span>
                <span className="text-sm text-slate-500 ml-2">{product.shop_name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-[#064E3B]">₹{product.price.toLocaleString()}</span>
                <Button
                  onClick={() => addToCart(product)}
                  size="sm"
                  className="bg-[#10B981] hover:bg-[#059669]"
                  data-testid={`add-to-cart-${product.id}`}
                >
                  {product.category === 'Tractors' ? 'Rent' : 'Buy'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Package className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500">No products found matching your filters</p>
        </div>
      )}

      {/* Cart Summary (Fixed Bottom Bar on Mobile) */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:relative bg-white border-t md:border border-slate-200 p-4 md:rounded-xl">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div>
              <p className="text-sm text-slate-600">Cart Total</p>
              <p className="text-2xl font-bold text-[#064E3B]">₹{getCartTotal().toLocaleString()}</p>
            </div>
            <Button
              onClick={handleCheckout}
              size="lg"
              className="bg-[#064E3B] hover:bg-[#065F46]"
              data-testid="checkout-button-bottom"
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;