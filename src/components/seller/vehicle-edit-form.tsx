'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VehicleImage } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, X } from 'lucide-react';
import {
  conditionLabels,
  bodyTypeLabels,
  fuelTypeLabels,
  transmissionLabels,
  drivetrainLabels,
} from '@/lib/utils';
import { VehicleImageUpload } from './vehicle-image-upload';
import { SerializedVehicleWithImage } from '@/types/inventory';

interface VehicleEditFormProps {
  vehicle: SerializedVehicleWithImage;
}

interface FormState {
  // Basic info
  make: string;
  model: string;
  variant: string;
  year: string;
  color: string;
  // Specifications
  condition: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  drivetrain: string;
  // Engine & Performance
  engineSize: string;
  cylinders: string;
  horsepower: string;
  // Details
  mileage: string;
  doors: string;
  seatingCapacity: string;
  vin: string;
  registrationNo: string;
  // Location
  city: string;
  country: string;
  regionalSpecs: string;
  // Pricing
  price: string;
  currency: string;
  incoterm: string;
  // Additional
  description: string;
  features: string;
  inspectionReportLink: string;
}

const CONDITION_OPTIONS = Object.entries(conditionLabels);
const BODY_TYPE_OPTIONS = Object.entries(bodyTypeLabels);
const FUEL_TYPE_OPTIONS = Object.entries(fuelTypeLabels);
const TRANSMISSION_OPTIONS = Object.entries(transmissionLabels);
const DRIVETRAIN_OPTIONS = Object.entries(drivetrainLabels);

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
  { value: 'EUR', label: 'EUR - Euro' },
];

const INCOTERM_OPTIONS = [
  { value: 'FOB', label: 'FOB - Free on Board' },
  { value: 'CIF', label: 'CIF - Cost, Insurance & Freight' },
];

export function VehicleEditForm({ vehicle }: VehicleEditFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form state from vehicle
  const [form, setForm] = useState<FormState>({
    make: vehicle.make,
    model: vehicle.model,
    variant: vehicle.variant || '',
    year: String(vehicle.year),
    color: vehicle.color,
    condition: vehicle.condition,
    bodyType: vehicle.bodyType,
    fuelType: vehicle.fuelType,
    transmission: vehicle.transmission,
    drivetrain: vehicle.drivetrain,
    engineSize: vehicle.engineSize ? String(vehicle.engineSize) : '',
    cylinders: vehicle.cylinders ? String(vehicle.cylinders) : '',
    horsepower: vehicle.horsepower ? String(vehicle.horsepower) : '',
    mileage: String(vehicle.mileage),
    doors: vehicle.doors ? String(vehicle.doors) : '',
    seatingCapacity: vehicle.seatingCapacity ? String(vehicle.seatingCapacity) : '',
    vin: vehicle.vin,
    registrationNo: vehicle.registrationNo || '',
    city: vehicle.city,
    country: vehicle.country,
    regionalSpecs: vehicle.regionalSpecs || '',
    price: vehicle.price ? String(vehicle.price) : '',
    currency: vehicle.currency,
    incoterm: vehicle.incoterm || '',
    description: vehicle.description || '',
    features: vehicle.features.join(', '),
    inspectionReportLink: vehicle.inspectionReportLink || '',
  });

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!form.make.trim()) errors.push('Make is required');
    if (!form.model.trim()) errors.push('Model is required');
    if (!form.year.trim()) errors.push('Year is required');
    if (!form.color.trim()) errors.push('Color is required');
    if (!form.condition) errors.push('Condition is required');
    if (!form.bodyType) errors.push('Body type is required');
    if (!form.fuelType) errors.push('Fuel type is required');
    if (!form.transmission) errors.push('Transmission is required');
    if (!form.drivetrain) errors.push('Drivetrain is required');
    if (!form.mileage.trim()) errors.push('Mileage is required');
    if (!form.vin.trim()) errors.push('VIN is required');
    if (!form.city.trim()) errors.push('City is required');
    if (!form.country.trim()) errors.push('Country is required');

    const year = parseInt(form.year, 10);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      errors.push('Year must be between 1900 and next year');
    }

    const mileage = parseInt(form.mileage, 10);
    if (isNaN(mileage) || mileage < 0) {
      errors.push('Mileage must be a positive number');
    }

    // Price validation
    if (form.price.trim()) {
      const price = parseFloat(form.price);
      if (isNaN(price) || price < 0) {
        errors.push('Price must be a positive number');
      } else if (price > 0) {
        if (!form.currency) errors.push('Currency is required when price is set');
        if (!form.incoterm) errors.push('Incoterm is required when price is set');
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        make: form.make.trim(),
        model: form.model.trim(),
        variant: form.variant.trim() || null,
        year: parseInt(form.year, 10),
        color: form.color.trim(),
        condition: form.condition,
        bodyType: form.bodyType,
        fuelType: form.fuelType,
        transmission: form.transmission,
        drivetrain: form.drivetrain,
        engineSize: form.engineSize ? parseFloat(form.engineSize) : null,
        cylinders: form.cylinders ? parseInt(form.cylinders, 10) : null,
        horsepower: form.horsepower ? parseInt(form.horsepower, 10) : null,
        mileage: parseInt(form.mileage, 10),
        doors: form.doors ? parseInt(form.doors, 10) : null,
        seatingCapacity: form.seatingCapacity ? parseInt(form.seatingCapacity, 10) : null,
        vin: form.vin.trim(),
        registrationNo: form.registrationNo.trim() || null,
        city: form.city.trim(),
        country: form.country.trim(),
        regionalSpecs: form.regionalSpecs.trim() || null,
        price: form.price ? parseFloat(form.price) : null,
        currency: form.currency,
        incoterm: form.incoterm || null,
        description: form.description.trim() || null,
        features: form.features
          .split(',')
          .map((f) => f.trim())
          .filter((f) => f.length > 0),
        inspectionReportLink: form.inspectionReportLink.trim() || null,
      };

      const response = await fetch(`/api/seller/vehicles/${vehicle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update vehicle');
      }

      router.push('/seller/inventory');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="make">Make *</Label>
            <Input
              id="make"
              value={form.make}
              onChange={(e) => handleChange('make', e.target.value)}
              placeholder="e.g., Toyota"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              value={form.model}
              onChange={(e) => handleChange('model', e.target.value)}
              placeholder="e.g., Camry"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="variant">Variant</Label>
            <Input
              id="variant"
              value={form.variant}
              onChange={(e) => handleChange('variant', e.target.value)}
              placeholder="e.g., LE, SE, Sport"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year *</Label>
            <Input
              id="year"
              type="number"
              value={form.year}
              onChange={(e) => handleChange('year', e.target.value)}
              placeholder="e.g., 2022"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color *</Label>
            <Input
              id="color"
              value={form.color}
              onChange={(e) => handleChange('color', e.target.value)}
              placeholder="e.g., White"
            />
          </div>
        </CardContent>
      </Card>

      {/* Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Specifications</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Condition *</Label>
            <Select value={form.condition} onValueChange={(v) => handleChange('condition', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_OPTIONS.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Body Type *</Label>
            <Select value={form.bodyType} onValueChange={(v) => handleChange('bodyType', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select body type" />
              </SelectTrigger>
              <SelectContent>
                {BODY_TYPE_OPTIONS.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fuel Type *</Label>
            <Select value={form.fuelType} onValueChange={(v) => handleChange('fuelType', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select fuel type" />
              </SelectTrigger>
              <SelectContent>
                {FUEL_TYPE_OPTIONS.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Transmission *</Label>
            <Select value={form.transmission} onValueChange={(v) => handleChange('transmission', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select transmission" />
              </SelectTrigger>
              <SelectContent>
                {TRANSMISSION_OPTIONS.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Drivetrain *</Label>
            <Select value={form.drivetrain} onValueChange={(v) => handleChange('drivetrain', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select drivetrain" />
              </SelectTrigger>
              <SelectContent>
                {DRIVETRAIN_OPTIONS.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Engine & Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Engine & Performance</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="engineSize">Engine Size (L)</Label>
            <Input
              id="engineSize"
              type="number"
              step="0.1"
              value={form.engineSize}
              onChange={(e) => handleChange('engineSize', e.target.value)}
              placeholder="e.g., 2.5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cylinders">Cylinders</Label>
            <Input
              id="cylinders"
              type="number"
              value={form.cylinders}
              onChange={(e) => handleChange('cylinders', e.target.value)}
              placeholder="e.g., 4"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="horsepower">Horsepower</Label>
            <Input
              id="horsepower"
              type="number"
              value={form.horsepower}
              onChange={(e) => handleChange('horsepower', e.target.value)}
              placeholder="e.g., 203"
            />
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mileage">Mileage (km) *</Label>
            <Input
              id="mileage"
              type="number"
              value={form.mileage}
              onChange={(e) => handleChange('mileage', e.target.value)}
              placeholder="e.g., 50000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doors">Doors</Label>
            <Input
              id="doors"
              type="number"
              value={form.doors}
              onChange={(e) => handleChange('doors', e.target.value)}
              placeholder="e.g., 4"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seatingCapacity">Seating Capacity</Label>
            <Input
              id="seatingCapacity"
              type="number"
              value={form.seatingCapacity}
              onChange={(e) => handleChange('seatingCapacity', e.target.value)}
              placeholder="e.g., 5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vin">VIN *</Label>
            <Input
              id="vin"
              value={form.vin}
              onChange={(e) => handleChange('vin', e.target.value)}
              placeholder="Vehicle Identification Number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registrationNo">Registration No.</Label>
            <Input
              id="registrationNo"
              value={form.registrationNo}
              onChange={(e) => handleChange('registrationNo', e.target.value)}
              placeholder="Registration number"
            />
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={form.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="e.g., Dubai"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              value={form.country}
              onChange={(e) => handleChange('country', e.target.value)}
              placeholder="e.g., United Arab Emirates"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="regionalSpecs">Regional Specs</Label>
            <Input
              id="regionalSpecs"
              value={form.regionalSpecs}
              onChange={(e) => handleChange('regionalSpecs', e.target.value)}
              placeholder="e.g., GCC, American, European"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
              placeholder="Leave empty for RFQ"
            />
            <p className="text-xs text-muted-foreground">Leave empty for Request for Quote</p>
          </div>
          <div className="space-y-2">
            <Label>Currency {form.price && '*'}</Label>
            <Select value={form.currency} onValueChange={(v) => handleChange('currency', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Incoterm {form.price && '*'}</Label>
            <Select value={form.incoterm} onValueChange={(v) => handleChange('incoterm', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select incoterm" />
              </SelectTrigger>
              <SelectContent>
                {INCOTERM_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Additional */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Additional details about the vehicle..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="features">Features</Label>
            <Input
              id="features"
              value={form.features}
              onChange={(e) => handleChange('features', e.target.value)}
              placeholder="Comma-separated features, e.g., Sunroof, Leather Seats, Navigation"
            />
            <p className="text-xs text-muted-foreground">Separate features with commas</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="inspectionReportLink">Inspection Report Link</Label>
            <Input
              id="inspectionReportLink"
              type="url"
              value={form.inspectionReportLink}
              onChange={(e) => handleChange('inspectionReportLink', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Images */}
      <VehicleImageUpload vehicleId={vehicle.id} initialImages={vehicle.images} />

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/seller/inventory')}
          disabled={saving}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

