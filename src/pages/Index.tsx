import { useState, useEffect } from "react";
import { Topbar } from "@/components/Topbar";
import { Navbar } from "@/components/Navbar";
import { ProductModal } from "@/components/ProductModal";
import { useStore } from "@/store/useStore";
import { Product } from "@/types/product";
import { useTranslation } from "react-i18next";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { ProductCarousel } from "@/components/ProductCarousel";
import { BrandsCarousel } from "@/components/BrandsCarousel";
import { SuppliersCarousel } from "@/components/SuppliersCarousel";
import { CategoriesCarousel } from "@/components/CategoriesCarousel";
import Footer from "@/components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const Index = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const products = useStore((state) => state.products) || [];
  const { t } = useTranslation();
  const [heroApi, setHeroApi] = useState<any>(null);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const navigate = useNavigate();

  // Auto-scroll for hero carousel
  useEffect(() => {
    if (!heroApi || isHeroHovered) return;

    const interval = setInterval(() => {
      if (heroApi.canScrollNext()) {
        heroApi.scrollNext();
      } else {
        heroApi.scrollTo(0);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [heroApi, isHeroHovered]);

  // Get special offers
  const specialOffersProducts = products.filter(
    (product) =>
      !product.isArchived &&
      product.specialOffer &&
      new Date(product.offerEndsAt as string) > new Date()
  );

  // Get featured products (those that aren't special offers)
  const featuredProducts = products
    .filter(
      (product) =>
        !product.isArchived &&
        (!product.specialOffer ||
          new Date(product.offerEndsAt as string) <= new Date())
    )
    .slice(0, 8); // Limit to 8 products

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <Navbar />

      <main className="container py-4 px-4 md:px-8">
        {/* Hero Carousel Section */}
        <section className="mb-8 md:mb-12">
          <div
            onMouseEnter={() => setIsHeroHovered(true)}
            onMouseLeave={() => setIsHeroHovered(false)}
          >
            <Carousel className="mx-auto" setApi={setHeroApi}>
              <CarouselContent>
                <CarouselItem>
                  <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 rounded-xl overflow-hidden">
                    <img
                      src="bg1.jpeg"
                      alt="Hero Image 1"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
                      <div className="p-6 md:p-10 max-w-md">
                        <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-2 md:mb-4">
                          {t("hero.title1")}
                        </h2>
                        <p className="text-white/90 text-sm sm:text-base md:text-lg mb-4">
                          {t("hero.description1")}
                        </p>
                        <Link
                          to="/products"
                          className="group inline-flex items-center gap-2 px-4 py-2 text-base font-medium text-white bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
                        >
                          {t("hero.shopNow")}
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
                <CarouselItem>
                  <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 rounded-xl overflow-hidden">
                    <img
                      src="bg2.jpeg"
                      alt="Hero Image 2"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
                      <div className="p-6 md:p-10 max-w-md">
                        <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-2 md:mb-4">
                          {t("hero.title2")}
                        </h2>
                        <p className="text-white/90 text-sm sm:text-base md:text-lg mb-4">
                          {t("hero.description2")}
                        </p>
                        <Link
                          to="/products"
                          className="group inline-flex items-center gap-2 px-4 py-2 text-base font-medium text-white bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
                        >
                          {t("hero.shopNow")}
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              </CarouselContent>
              <div className="hidden sm:block">
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </div>
            </Carousel>
          </div>
        </section>

        {/* Categories Section */}
        <CategoriesCarousel />

        {/* Special Offers Section */}
        {specialOffersProducts.length > 0 && (
          <section className="my-20 md:my-28">
            <div className="relative">
              {/* Main content */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-50 via-transparent to-red-50 rounded-2xl"></div>
                <div className="relative p-2">
                  {/* Title section */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 bg-red-500 rounded-full"></div>
                      <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-600">
                          {t("specialOffers.title")}
                        </h2>
                        <p className="text-sm text-gray-500/70 mt-1">
                          {t("specialOffers.subtitle")}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/products")}
                      className="flex items-center gap-1 border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      {t("specialOffers.viewAll")}
                      <ArrowRight className="h-4 w-4 ms-1 rtl:rotate-180" />
                    </Button>
                  </div>

                  {/* Divider */}
                  <div className="mb-6">
                    <div className="w-1/6 border-2 border-gray-300"></div>
                  </div>

                  {/* Products carousel */}
                  <div className="relative">
                    <div className="relative">
                      <ProductCarousel products={specialOffersProducts} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Suppliers Carousel Section */}
        {/* <SuppliersCarousel /> */}

        {/* Featured Products Section */}
        <section className="mb-8 md:mb-12">
          <div className="relative">
            <div className=" relative p-0">
              {/* Title section */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                      {t("products.featured")}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {t("products.featuredSubtitle")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate("/products")}
                  className="flex items-center gap-1"
                >
                  {t("products.viewMore")}
                  <ArrowRight className="h-4 w-4 ms-1 rtl:rotate-180" />
                </Button>
              </div>

              {/* Divider */}
              <div className="mb-6">
                <div className="w-1/6 border-2 border-gray-400"></div>
              </div>

              {/* Products carousel */}
              <div className="relative">
                <div className="relative">
                  <ProductCarousel products={featuredProducts} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Brands Section */}
        {/* <section className="my-20 md:my-24">
          <BrandsCarousel title={t("brands.title")} />
        </section> */}
      </main>

      {/* Footer */}
      <Footer />

      <ProductModal
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default Index;
