"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { Search, PlusCircle, Package } from "lucide-react";
import Link from "next/link";
import LocationSelector from "@/components/LocationSelector";
import CategoryNav from "@/components/CategoryNav";
import ProductCard from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/Skeleton";
import ThemeToggle from "@/components/ThemeToggle";
import { MOCK_PRODUCTS, CATEGORIES, CATEGORY_GRAMMAR, type Product } from "@/lib/data";
import { isAdExpired } from "@/lib/subscription";
import { isProductVisible } from "@/lib/moderation";

function HomeContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedAimag, setSelectedAimag] = useState<string | undefined>();
  const [selectedSoum, setSelectedSoum] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<"engagement" | "newest" | "price_asc">("engagement");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  // Debounce Search Query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(prev => prev === categoryId ? undefined : categoryId);
  };

  const handleLocationSelect = (aimag: string, soum: string) => {
    setSelectedAimag(aimag);
    setSelectedSoum(soum);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedAimag', aimag);
      localStorage.setItem('selectedSoum', soum);
    }
  };

  // Load location from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAimag = localStorage.getItem('selectedAimag');
      const savedSoum = localStorage.getItem('selectedSoum');
      if (savedAimag) {
        setSelectedAimag(savedAimag);
        setSelectedSoum(savedSoum || undefined);
      }
    }
  }, []);

  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Load products from Supabase
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { getProducts } = await import("@/lib/products");
        const { data: supabaseProducts, error } = await getProducts();

        if (!error && supabaseProducts.length > 0) {
          // Transform Supabase products to match our Product type
          const transformedProducts = supabaseProducts.map((p: any) => ({
            id: p.id,
            title: p.title,
            price: p.price,
            currency: p.currency || '₮',
            location: p.location,
            image: p.images?.[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
            images: p.images || [],
            category: p.category,
            seller: {
              name: p.seller?.name || 'Борлуулагч',
              phone: p.seller?.phone || '',
              isVerified: p.seller?.is_verified || false,
              image: p.seller?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + p.user_id,
            },
            createdAt: p.created_at,
            description: p.description,
            tier: p.tier || 'soum',
            views: p.views || 0,
            saves: p.saves || 0,
          }));

          // Combine with mock products for now
          setProducts([...transformedProducts, ...MOCK_PRODUCTS]);
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading products:', err);
        }
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();

    // Listen for new products
    window.addEventListener('adsUpdated', loadProducts);
    return () => window.removeEventListener('adsUpdated', loadProducts);
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product: Product) => {
      // 1. Search Filter (Use Debounced Query)
      const matchesSearch = product.title
        .toLowerCase()
        .includes(debouncedSearchQuery.toLowerCase());

      // 2. Category Filter
      const matchesCategory = !selectedCategory || selectedCategory === 'all' || product.category === selectedCategory;

      // 3. Tier & Verification Logic
      const tier = product.tier || 'soum';

      // PAUSE Logic: National tier but NOT verified -> Hidden
      if (tier === 'national' && !product.seller.isVerified) {
        return false;
      }

      // 4. Location Visibility Logic
      let matchesLocation = false;

      if (tier === 'national') {
        matchesLocation = true;
      } else if (tier === 'aimag') {
        matchesLocation = !selectedAimag || product.location.aimag === selectedAimag;
      } else {
        matchesLocation =
          (!selectedAimag || product.location.aimag === selectedAimag) &&
          (!selectedSoum || selectedSoum === 'all' || product.location.soum === selectedSoum);
      }

      if (tier === 'soum' && selectedAimag && !selectedSoum) {
        matchesLocation = product.location.aimag === selectedAimag;
      }

      return matchesSearch && matchesLocation && matchesCategory;
    });

    // ✅ ХАНДАЛТААР ЭРЭМБЭЛЭЛТ (Engagement-Based Ranking)
    return filtered.sort((a: Product, b: Product) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

      // Engagement Score: Views(1) + Saves(3) + Clicks(10) + Shares(5)
      if (sortBy === "engagement") {
        const scoreA = (a.views || 0) * 1 + (a.saves || 0) * 3 + ((a.callClicks || 0) + (a.chatClicks || 0)) * 10 + (a.shares || 0) * 5;
        const scoreB = (b.views || 0) * 1 + (b.saves || 0) * 3 + ((b.callClicks || 0) + (b.chatClicks || 0)) * 10 + (b.shares || 0) * 5;
        return scoreB - scoreA;
      }

      return 0;
    });
  }, [debouncedSearchQuery, selectedAimag, selectedSoum, selectedCategory, sortBy, products]);

  return (
    <main id="main-content" className="min-h-screen bg-[var(--background)] pb-20">

      {/* Hero Section */}
      <div className="bg-primary px-4 pt-6 pb-8 rounded-b-[2.5rem] shadow-sm">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header / Logo */}
          <div className="flex items-center justify-between">
            <Link href="/" className="group">
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-2xl md:text-3xl font-bold text-secondary tracking-tight hover:scale-105 transition-transform">
                    Nutgiin
                  </span>
                  <span className="text-2xl md:text-3xl font-bold text-white tracking-tight hover:scale-105 transition-transform">
                    Delguur
                  </span>
                </div>
                <p className="text-xs md:text-sm text-gray-700 font-medium mt-0.5 tracking-wide">
                  🇲🇳 Монгол Үйлдвэрлэлийн Талбар
                </p>
              </div>
              <div className="h-0.5 bg-gradient-to-r from-secondary via-white to-transparent w-0 group-hover:w-full transition-all duration-300"></div>
            </Link>

            {/* Mobile Theme Toggle - visible only on mobile */}
            <div className="md:hidden">
              <ThemeToggle />
            </div>

            {/* Desktop Navigation - Clean & Minimal */}
            <div className="hidden md:flex items-center gap-4">
              <ThemeToggle />
              <Link href="/favorites" className="text-gray-800 dark:text-gray-200 hover:text-secondary transition-colors p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>
              <Link href="/messages" className="text-gray-800 dark:text-gray-200 hover:text-secondary transition-colors p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </Link>
              <Link href="/dashboard" className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center text-white font-bold text-sm hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
              <Link href="/dashboard/post" className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-white font-bold rounded-xl hover:bg-gray-800 transition-colors text-sm">
                <PlusCircle className="w-4 h-4" />
                Зар нэмэх
              </Link>
            </div>
          </div>

          {/* Search & Location */}
          <div className="space-y-3 sticky top-4 z-20">
            <div className="relative shadow-lg rounded-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Хайх зүйлээ бичнэ үү..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Бүтээгдэхүүн хайх"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-none focus:ring-2 focus:ring-black/20 bg-white text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div className="flex justify-center">
              <LocationSelector
                onLocationSelect={handleLocationSelect}
                selectedAimag={selectedAimag}
                selectedSoum={selectedSoum}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content based on Location Selection */}
      {!selectedAimag ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
            <Search className="w-10 h-10 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Байршлаа сонгоно уу</h2>
          <p className="text-gray-500 max-w-xs">
            Та өөрийн хайж буй аймгаа сонгож тухайн бүс нутгийн бараа бүтээгдэхүүнийг харна уу.
          </p>
        </div>
      ) : (
        <>
          {/* Categories */}
          <div className="max-w-4xl mx-auto mt-6">

            <CategoryNav
              selectedCategory={selectedCategory}
              onSelect={handleCategorySelect}
            />
          </div>



          {/* Product Feed */}
          <div className="max-w-4xl mx-auto px-4 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-gray-900">
                Бүс нутгийн бүтээгдэхүүнүүд
              </h2>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border-none bg-transparent font-medium text-gray-500 focus:ring-0 cursor-pointer"
              >
                <option value="engagement">Хандалтаар (Engagement)</option>
                <option value="newest">Шинэ нь эхэндээ</option>
                <option value="price_asc">Хямд нь эхэндээ</option>
              </select>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    {...product}
                    isCompact={true}
                    ranking={sortBy === "engagement" && index < 5 ? index + 1 : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300 mx-4">
                <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-10 h-10 text-yellow-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {(() => {
                    let categoryText = "";
                    if (selectedCategory) {
                      const category = CATEGORIES.find(c => c.id === selectedCategory);
                      if (category) {
                        // Use grammar map for correct genitive form
                        const genitiveForm = CATEGORY_GRAMMAR[category.name] || category.name.toLowerCase();
                        categoryText = `${genitiveForm} `;
                      }
                    }

                    let locationText = "Энэ аймагт";
                    if (selectedAimag === "Улаанбаатар") {
                      locationText = selectedSoum ? "Энэ дүүрэгт" : "Энэ хотод";
                    } else if (selectedSoum) {
                      locationText = "Энэ суманд";
                    }

                    // Use "зар" for services, "бүтээгдэхүүн" for everything else
                    const itemType = selectedCategory === 'services' ? 'зар' : 'бүтээгдэхүүн';

                    return `${locationText} одоогоор ${categoryText}${itemType} алга`;
                  })()}
                </h3>
                <p className="text-gray-500 mb-6 max-w-xs mx-auto">
                  Та энэ нутгийн анхны үйлдвэрлэгч болж бүтээгдэхүүнээ байршуулах уу?
                </p>
                <Link
                  href="/dashboard/post"
                  className="px-6 py-3 bg-primary text-secondary font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-yellow-400/20 active:scale-95 flex items-center gap-2"
                >
                  <PlusCircle className="w-5 h-5" />
                  Анхны бүтээгдэхүүнийг оруулах
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-primary px-4 pt-6 pb-8 rounded-b-[2.5rem]">
          <div className="max-w-4xl mx-auto h-32" />
        </div>
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
