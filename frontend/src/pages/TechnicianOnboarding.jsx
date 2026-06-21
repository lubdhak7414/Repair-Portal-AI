// TechnicianOnboarding.jsx
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export function TechnicianOnboarding() {
  // Use the useParams hook to get the userId from the URL
  const { userId } = useParams();

  const [formData, setFormData] = useState({
    services: '',
    experience: '',
    hourlyRate: '',
    availability: {
      monday: { start: '', end: '', available: false },
      tuesday: { start: '', end: '', available: false },
      wednesday: { start: '', end: '', available: false },
      thursday: { start: '', end: '', available: false },
      friday: { start: '', end: '', available: false },
      saturday: { start: '', end: '', available: false },
      sunday: { start: '', end: '', available: false },
    },
    serviceArea: '',
    certifications: [],
  });

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        availability: {
          ...prev.availability,
          [id.split('-')[1]]: {
            ...prev.availability[id.split('-')[1]],
            available: checked
          }
        }
      }));
    } else if (id.startsWith('avail-')) {
      const [_, day, field] = id.split('-');
      setFormData(prev => ({
        ...prev,
        availability: {
          ...prev.availability,
          [day]: {
            ...prev.availability[day],
            [field]: value
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };

  const handleCertificationChange = (index, field, value) => {
    const newCerts = [...formData.certifications];
    newCerts[index] = { ...newCerts[index], [field]: value };
    setFormData(prev => ({ ...prev, certifications: newCerts }));
  };

  const addCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        { name: '', issuedBy: '', issuedDate: '', expiryDate: '' }
      ]
    }));
  };

  const removeCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Use the userId from useParams here
    console.log("Technician Onboarding Data:", {
      user: userId,
      ...formData,
    });
    // Now you can make an API call to your backend using the userId
    // e.g., await createTechnicianProfile(userId, formData);
  };

  // Helper for availability inputs
  const DayAvailability = ({ day, data, onChange }) => (
    <div className="flex items-center gap-2">
      <Checkbox
        id={`avail-${day}`}
        checked={data.available}
        onCheckedChange={(checked) => onChange({ target: { id: `avail-${day}`, type: 'checkbox', checked } })}
      />
      <Label htmlFor={`avail-${day}`} className="capitalize min-w-[70px]">{day}</Label>
      {data.available && (
        <>
          <Input
            id={`avail-${day}-start`}
            type="time"
            value={data.start}
            onChange={onChange}
            className="w-full"
          />
          <span className="mx-1">-</span>
          <Input
            id={`avail-${day}-end`}
            type="time"
            value={data.end}
            onChange={onChange}
            className="w-full"
          />
        </>
      )}
    </div>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Technician Onboarding</CardTitle>
        <CardDescription>
          Tell us more about your professional services.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="services">Services (comma-separated)</Label>
              <Textarea
                id="services"
                placeholder="e.g., Plumbing, HVAC Repair, Electrical Wiring"
                value={formData.services}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="experience">Experience (Years)</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                placeholder="5"
                value={formData.experience}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hourlyRate">Hourly Rate (e.g., $50.00)</Label>
              <Input
                id="hourlyRate"
                type="text"
                placeholder="$50.00"
                value={formData.hourlyRate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2 col-span-full">
              <Label>Availability</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.keys(formData.availability).map(day => (
                  <DayAvailability
                    key={day}
                    day={day}
                    data={formData.availability[day]}
                    onChange={handleInputChange}
                  />
                ))}
              </div>
            </div>
            <div className="grid gap-2 col-span-full">
              <Label htmlFor="serviceArea">Service Area</Label>
              <Textarea
                id="serviceArea"
                placeholder="e.g., New York, NY (Manhattan, Brooklyn); Los Angeles, CA (Hollywood, Santa Monica)"
                value={formData.serviceArea}
                onChange={handleInputChange}
                required
              />
              <p className="text-muted-foreground text-sm">List cities and specific areas you serve.</p>
            </div>
            <div className="grid gap-2 col-span-full">
              <Label>Certifications</Label>
              {formData.certifications.map((cert, index) => (
                <Card key={index} className="p-4 mb-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor={`cert-name-${index}`}>Name</Label>
                      <Input
                        id={`cert-name-${index}`}
                        placeholder="e.g., Master Plumber License"
                        value={cert.name}
                        onChange={(e) => handleCertificationChange(index, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`cert-issuedBy-${index}`}>Issued By</Label>
                      <Input
                        id={`cert-issuedBy-${index}`}
                        placeholder="e.g., ABC Certifications"
                        value={cert.issuedBy}
                        onChange={(e) => handleCertificationChange(index, 'issuedBy', e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`cert-issuedDate-${index}`}>Issued Date</Label>
                      <Input
                        id={`cert-issuedDate-${index}`}
                        type="date"
                        value={cert.issuedDate}
                        onChange={(e) => handleCertificationChange(index, 'issuedDate', e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`cert-expiryDate-${index}`}>Expiry Date</Label>
                      <Input
                        id={`cert-expiryDate-${index}`}
                        type="date"
                        value={cert.expiryDate}
                        onChange={(e) => handleCertificationChange(index, 'expiryDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeCertification(index)}
                    className="mt-4"
                  >
                    Remove Certification
                  </Button>
                </Card>
              ))}
              <Button type="button" variant="outline" onClick={addCertification} className="mt-2">
                Add Another Certification
              </Button>
            </div>
          </div>
          <CardFooter className="flex-col gap-2 mt-6 p-0">
            <Button type="submit" className="w-full">
              Complete Onboarding
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}