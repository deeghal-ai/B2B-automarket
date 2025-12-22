'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Car, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { CartBadge } from '@/components/shared/cart-badge';

interface HeaderProps {
  user?: {
    email: string;
    role: 'BUYER' | 'SELLER' | 'ADMIN';
  } | null;
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  if (isAuthPage) {
    return (
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl text-foreground">
            <Car className="h-6 w-6 text-primary" />
            <span>AutoMarket B2B</span>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl text-foreground hover:text-primary transition-colors">
          <Car className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">AutoMarket B2B</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {user ? (
            <>
              {user.role === 'SELLER' ? (
                <>
                  <Link
                    href="/seller"
                    className={`text-sm font-medium transition-colors hover:text-foreground ${
                      pathname === '/seller' ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/seller/upload"
                    className={`text-sm font-medium transition-colors hover:text-foreground ${
                      pathname === '/seller/upload' ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    Upload
                  </Link>
                  <Link
                    href="/seller/inventory"
                    className={`text-sm font-medium transition-colors hover:text-foreground ${
                      pathname === '/seller/inventory' ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    Inventory
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/buyer"
                    className={`text-sm font-medium transition-colors hover:text-foreground ${
                      pathname === '/buyer' ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    Browse
                  </Link>
                  <CartBadge />
                </>
              )}
              <form action="/api/auth/signout" method="post">
                <Button variant="outline" size="sm" type="submit">
                  Sign Out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <nav className="flex flex-col gap-4 mt-8">
              {user ? (
                <>
                  {user.role === 'SELLER' ? (
                    <>
                      <Link
                        href="/seller"
                        onClick={() => setOpen(false)}
                        className="text-lg font-medium"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/seller/upload"
                        onClick={() => setOpen(false)}
                        className="text-lg font-medium"
                      >
                        Upload
                      </Link>
                      <Link
                        href="/seller/inventory"
                        onClick={() => setOpen(false)}
                        className="text-lg font-medium"
                      >
                        Inventory
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/buyer"
                        onClick={() => setOpen(false)}
                        className="text-lg font-medium"
                      >
                        Browse
                      </Link>
                      <Link
                        href="/buyer/cart"
                        onClick={() => setOpen(false)}
                        className="text-lg font-medium"
                      >
                        Quote Builder
                      </Link>
                    </>
                  )}
                  <form action="/api/auth/signout" method="post">
                    <Button variant="outline" className="w-full" type="submit">
                      Sign Out
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)}>
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
