'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ShoppingCart, Store, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Role = 'BUYER' | 'SELLER';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role')?.toUpperCase() as Role | null;

  const [step, setStep] = useState<'role' | 'details' | 'success'>(
    defaultRole ? 'details' : 'role'
  );
  const [role, setRole] = useState<Role>(defaultRole || 'BUYER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Failed to create account');
        setLoading(false);
        return;
      }

      // Check if email confirmation is required
      // If identities is empty or email not confirmed, user needs to verify
      const needsConfirmation =
        !authData.user.email_confirmed_at &&
        (!authData.user.identities || authData.user.identities.length === 0);

      // Create user in our database via API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authData.user.id,
          email,
          role,
          ...(role === 'SELLER' && { companyName, country, city }),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        // If user already exists in our DB, that's okay - might be re-registering
        if (data.error !== 'User already exists') {
          setError(data.error || 'Failed to create profile');
          setLoading(false);
          return;
        }
      }

      if (needsConfirmation) {
        // Show success message asking to check email
        setNeedsEmailConfirmation(true);
        setStep('success');
      } else {
        // Email confirmation disabled - redirect directly
        router.push(role === 'SELLER' ? '/seller' : '/buyer');
        router.refresh();
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Success screen for email confirmation
  if (step === 'success') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a confirmation link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Click the link in your email to verify your account, then you can
              log in.
            </p>
            <Link href="/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'role') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Join AutoMarket B2B</CardTitle>
            <CardDescription>
              Choose how you want to use the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => handleRoleSelect('BUYER')}
              className={cn(
                'p-6 rounded-lg border-2 text-left transition-all hover:border-primary',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
              )}
            >
              <ShoppingCart className="h-10 w-10 mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">I'm a Buyer</h3>
              <p className="text-sm text-muted-foreground">
                Browse and purchase vehicles in bulk from Chinese sellers
              </p>
            </button>
            <button
              onClick={() => handleRoleSelect('SELLER')}
              className={cn(
                'p-6 rounded-lg border-2 text-left transition-all hover:border-primary',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
              )}
            >
              <Store className="h-10 w-10 mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">I'm a Seller</h3>
              <p className="text-sm text-muted-foreground">
                Upload and sell your vehicle inventory to UAE dealers
              </p>
            </button>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            Create {role === 'SELLER' ? 'Seller' : 'Buyer'} Account
          </CardTitle>
          <CardDescription>
            {role === 'SELLER'
              ? 'Set up your seller profile to start listing vehicles'
              : 'Create an account to start browsing and purchasing'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            {role === 'SELLER' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="Your company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      placeholder="China"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Shanghai"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
            <div className="flex gap-4 text-sm">
              <button
                type="button"
                onClick={() => setStep('role')}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Change role
              </button>
              <Link href="/login" className="text-primary hover:underline">
                Sign in instead
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
