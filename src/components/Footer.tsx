import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { CONTACT_PHONES } from "@/constants/supplier";

export default function Footer() {
  const { t } = useTranslation();
  const products = useStore((state) => state.products);

  // Get unique categories from products
  const categories = [
    ...new Set(products?.map((product) => product.category) || []),
  ];

  return (
    <footer className="bg-secondary/10 border-t">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section with Store Name/Logo */}
          <div>
            <h3 className="font-bold text-lg mb-2">{t("footer.aboutUs")}</h3>
            <p className="text-muted-foreground">
              {t("footer.aboutDescription")}
            </p>
            <div className="flex gap-4 mt-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("footer.quickLinks")}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-primary">
                  {t("footer.home")}
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-primary">
                  {t("footer.products")}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary">
                  {t("footer.about")}
                </Link>
              </li>
              <li>
                <Link to="/locations" className="hover:text-primary">
                  {t("footer.locations")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories - Dynamically generated from actual product categories */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t("footer.categories")}</h3>
            <ul className="space-y-2">
              {categories.length > 0 ? (
                categories.slice(0, 5).map((category, index) => (
                  <li key={index}>
                    <Link
                      to={`/products?category=${category}`}
                      className="text-muted-foreground hover:text-primary"
                    >
                      {category}
                    </Link>
                  </li>
                ))
              ) : (
                // Fallback categories
                <>
                  <li>
                    <Link
                      to="/products"
                      className="text-muted-foreground hover:text-primary"
                    >
                      {t("footer.category1")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/products"
                      className="text-muted-foreground hover:text-primary"
                    >
                      {t("footer.category2")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/products"
                      className="text-muted-foreground hover:text-primary"
                    >
                      {t("footer.category3")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/products"
                      className="text-muted-foreground hover:text-primary"
                    >
                      {t("footer.category4")}
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {t("footer.contactUs")}
            </h3>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a
                  href={`tel:${CONTACT_PHONES.main}`}
                  className="hover:underline"
                >
                  {CONTACT_PHONES.main}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a
                  href={`mailto:${CONTACT_PHONES.support}`}
                  className="hover:underline"
                >
                  {CONTACT_PHONES.support}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} - {t("footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
