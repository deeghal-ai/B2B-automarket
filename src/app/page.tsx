import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Car, Package, ShoppingCart, Upload } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-muted/30 via-background to-background">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-foreground">
            Bulk Used Car Trading
            <br />
            <span className="text-primary">Made Simple</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Connect Chinese sellers with UAE dealers. Upload inventory in bulk,
            group vehicles dynamically, and purchase efficiently.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register?role=buyer">
              <Button size="lg" className="gap-2 px-8">
                <ShoppingCart className="h-5 w-5" />
                Start Buying
              </Button>
            </Link>
            <Link href="/register?role=seller">
              <Button size="lg" variant="outline" className="gap-2 px-8">
                <Upload className="h-5 w-5" />
                Start Selling
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-background">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-muted-foreground text-center mb-14 max-w-xl mx-auto">
            Three simple steps to transform your used car business
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Upload className="h-10 w-10" />}
              title="Bulk Upload"
              description="Sellers upload their entire inventory via Excel. Map your columns once, import thousands of vehicles."
            />
            <FeatureCard
              icon={<Package className="h-10 w-10" />}
              title="Smart Grouping"
              description="Buyers choose how to group vehicles - by make, model, year, color, or any combination. See aggregated listings."
            />
            <FeatureCard
              icon={<ShoppingCart className="h-10 w-10" />}
              title="Bulk Purchase"
              description="Select multiple vehicles from a group and add to cart in one click. Purchase from multiple sellers."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-muted/50">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-10 max-w-lg mx-auto">
            Join the marketplace connecting Chinese auto exporters with UAE dealers.
          </p>
          <Link href="/register">
            <Button size="lg" className="px-10">Create Account</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-8 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
      <div className="text-primary mb-5">{icon}</div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
