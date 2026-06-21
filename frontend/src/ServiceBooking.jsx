import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext'; // Import the useAuth hook
import Navbar from './sections/navbar';
import Footer from './sections/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea'; // For issue description
import { useNavigate } from 'react-router-dom'; // add this line at the top

const apiUrl = import.meta.env.VITE_API_URL;

export function ServiceBooking() {
  const { user } = useAuth(); // Use the hook to get the user object
  const [userLoading, setUserLoading] = useState(true); // State to track loading of user
  const [selectedService, setSelectedService] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [urgency, setUrgency] = useState('');
  const [address, setAddress] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [services, setServices] = useState([]);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [biddingDeadline, setBiddingDeadline] = useState(''); // State for bidding deadline
  const navigate = useNavigate(); 

  useEffect(() => {
    // Check if user data has been loaded
    if (user !== null) {
      setUserLoading(false);
    }

    // Fetch available services for the booking
    const fetchServices = async () => {
      try {
        const response = await fetch(`${apiUrl}/services/`);
        const data = await response.json();
        if (response.ok) {
          setServices(data.services);
        } else {
          throw new Error(data.message || 'Failed to fetch services');
        }
      } catch (err) {
        setError(err.message);
      }
    };
    fetchServices();
  }, [user]);

  const handleBookingSubmit = async (event) => {
    event.preventDefault();

    // Debug: Log user state
    console.log('User:', user);

    // Check if the user is logged in and has an ID
    if (!user || !user.id) {  // Changed from user.id to user.id
      setError('You must be logged in to create a booking.');
      return;
    }

    // Check if preferred time is in the past
    if (new Date(preferredTime) < new Date()) {
      setError('Preferred time cannot be in the past');
      return;
    }

    // Check if service is selected
    if (!selectedService) {
      setError('Please select a service');
      return;
    }

    setLoading(true);
    setError('');

    const userID = user.id; // Use user.id instead of user.id
    const technicianID = null; // No technician is assigned initially for bidding

    try {
      const response = await fetch(`${apiUrl}/bookings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: userID,
          technician: technicianID,
          service: selectedService,
          description: issueDescription,
          images,
          preferredDate: preferredTime.split('T')[0],
          preferredTime,
          urgency,
          address,
          estimatedCost,
          isBidding: true,
          biddingDeadline: biddingDeadline || undefined
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Booking failed. Please try again.');

      navigate(`/booking-status/${data.id}`);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // If user data is still loading, show loading state
  if (userLoading) {
    return <div>Loading user data...</div>; // You can replace this with a more detailed loader
  }

  return (
    <div className="text-foreground font-inter">
      <Navbar />
      <div className="w-full max-w-7xl mx-auto py-8 p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-6">
          Service Booking
        </h1>
        <p className="text-lg text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
          Book a service for repair or maintenance. Select a service, describe the issue, and we'll get it scheduled.
        </p>
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Book Your Service</CardTitle>
            <CardDescription>Select your service and provide details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBookingSubmit}>
              <div className="flex flex-col gap-6">
                {/* Service Selection */}
                <div className="grid gap-2">
                  <label htmlFor="service">Service</label>
                  <select
                    id="service"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="border p-2 rounded-md bg-gray-900 text-white focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="" disabled>Select a Service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Issue Description */}
                <div className="grid gap-2">
                  <label htmlFor="description">Issue Description</label>
                  <Textarea
                    id="description"
                    placeholder="Describe the problem in detail"
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    required
                  />
                </div>
                {/* Time Selection */}
                <div className="grid gap-2">
                  <label htmlFor="time">Preferred Time</label>
                  <Input
                    id="time"
                    type="datetime-local"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    required
                  />
                </div>
                {/* Urgency Level Dropdown */}
                <div className="grid gap-2">
                  <label htmlFor="urgency">Urgency Level</label>
                  <select
                    id="urgency"
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="border p-2 rounded-md bg-gray-900 text-white focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="" disabled>Select Urgency Level</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                {/* Address */}
                <div className="grid gap-2">
                  <label htmlFor="address">Address</label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter the service address"
                    required
                  />
                </div>
                {/* Images (Optional) */}
                <div className="grid gap-2">
                  <label htmlFor="images">Upload Images (Optional)</label>
                  <Input
                    id="images"
                    type="file"
                    onChange={(e) => setImages([...images, ...e.target.files])}
                    multiple
                  />
                </div>
                {/* Bidding Deadline */}
                <div className="grid gap-2">
                  <label htmlFor="biddingDeadline">Bidding Deadline (Optional)</label>
                  <Input
                    id="biddingDeadline"
                    type="datetime-local"
                    value={biddingDeadline}
                    onChange={(e) => setBiddingDeadline(e.target.value)}
                  />
                </div>
                {/* Error Message */}
                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
              </div>
              <CardFooter className="flex-col gap-2 p-0 mt-6">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Booking'}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
