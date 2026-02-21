import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/simplify-tap/Navbar";
import { Footer } from "@/components/simplify-tap/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { products } from "@/data/products";

const NFC = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Dynamically compute unique categories from products
  const categories = [
    "All",
    ...new Set(products.flatMap(p => p.categories))
  ];

  const filteredProducts = selectedCategory === "All"
    ? products
    : products.filter(p => p.categories?.includes(selectedCategory));

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />

      <main className="flex-1">
        {/* Hero / Header Section */}
        <section className="pt-32 pb-12 px-4 text-center space-y-4 bg-muted/30">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Shop Now
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            We have smart product for smart peoples
          </p>
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row gap-8">

            {/* Sidebar Filter */}
            <aside className="w-full md:w-64 space-y-8 hidden md:block">
              <div className="space-y-4">
                <h3 className="text-xl font-light text-foreground/80 border-b pb-2">Filter by</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between group cursor-pointer" onClick={() => setSelectedCategory("All")}>
                    <span className="text-sm font-medium">Category</span>
                    <span className="text-lg text-muted-foreground group-hover:text-foreground">-</span>
                  </div>
                  <div className="pl-2 space-y-2 text-sm text-foreground/80">
                    {categories.map((cat) => (
                      <div
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`cursor-pointer transition-colors ${selectedCategory === cat ? 'text-primary font-semibold' : 'hover:text-primary text-muted-foreground'}`}
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Mobile Filter (Simple Select style or horizontal scroll) */}
            <div className="md:hidden overflow-x-auto pb-4 flex gap-2 no-scrollbar">
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>

            {/* Product Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <Card key={product.id} className="group overflow-hidden border-border/50 hover:shadow-xl transition-all duration-300 flex flex-col h-full bg-card">
                    <CardHeader className="p-0 relative aspect-square bg-muted/20">
                      {product.tag && (
                        <div className="absolute top-4 left-4 z-10">
                          <Badge variant="secondary" className="bg-cyan-400 text-white hover:bg-cyan-500 font-medium rounded-sm px-2 py-0.5 text-xs uppercase tracking-wider">
                            {product.tag}
                          </Badge>
                        </div>
                      )}
                      <Link to={`/nfc/${product.id}`} className="block w-full h-full"> {/* Make image clickable */}
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-contain p-8 transform group-hover:scale-105 transition-transform duration-500"
                        />
                      </Link>
                    </CardHeader>
                    <CardContent className="flex-1 p-6 text-center space-y-3">
                      <Link to={`/nfc/${product.id}`} className="block">
                        <CardTitle className="text-xl font-normal leading-tight tracking-tight text-foreground hover:text-primary transition-colors">
                          {product.name}
                        </CardTitle>
                      </Link>
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <span className="text-muted-foreground line-through decoration-muted-foreground/50">
                          {product.originalPrice}
                        </span>
                        <span className="text-lg font-medium text-foreground">
                          {product.price}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="p-6 pt-0">
                      <Link to={`/nfc/${product.id}`} className="w-full">
                        <Button className="w-full bg-black text-white hover:bg-gray-800 rounded-md h-12 text-sm font-medium tracking-wide">
                          Claim yours
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-20 text-center text-muted-foreground">
                  No products found in this category.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default NFC;
