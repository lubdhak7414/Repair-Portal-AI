import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // Assuming react-router
import Navbar from './sections/navbar';
import Footer from './sections/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const apiUrl = import.meta.env.VITE_API_URL;

export function BookingStatus() {
  const { id } = useParams(); // booking id from URL
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookingStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/bookings/single/${id}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Failed to fetch booking status');
        setBooking(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingStatus();
  }, [id]);

  if (loading) return <p className="text-center mt-10">Loading booking status...</p>;
  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>;

  return (
    <div className="text-foreground font-inter">
      <Navbar />
      <div className="w-full max-w-4xl mx-auto py-8 p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-center mb-6">Booking Status</h1>

        <Card className="w-full max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Booking #{booking.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Service:</strong> {booking.service?.name}</p>
            <p><strong>Technician:</strong> {booking.technician?.name || 'Not assigned yet'}</p>
            <p><strong>Status:</strong> <span className="font-bold">{booking.status}</span></p>
            <p><strong>Preferred Date:</strong> {new Date(booking.preferredDate).toLocaleString()}</p>
            <p><strong>Address:</strong> {booking.address}</p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
