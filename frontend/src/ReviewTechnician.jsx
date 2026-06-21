import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './sections/navbar';
import Footer from './sections/Footer';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const apiUrl = import.meta.env.VITE_API_URL;

export function ReviewTechnician() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [overall, setOverall] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [workQuality, setWorkQuality] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [cleanliness, setCleanliness] = useState(5);
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`${apiUrl}/bookings/single/${bookingId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch booking');
        setBooking(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking: booking.id,
          user: booking.user,
          technician: booking.technician,
          rating: { overall, punctuality, workQuality, communication, cleanliness },
          comment,
          wouldRecommend,
          isAnonymous
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit review');
      alert('Review submitted successfully!');
      navigate('/reviews'); // or wherever you want
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>;

  return (
    <div className="text-foreground font-inter">
      <Navbar />
      <div className="w-full max-w-4xl mx-auto py-8 p-4">
        <h1 className="text-3xl font-bold text-center mb-6">Rate & Review Technician</h1>
        <Card>
          <CardHeader>
            <CardTitle>Booking #{booking.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label>
                Overall Rating:
                <Input type="number" min="1" max="5" value={overall} onChange={e => setOverall(Number(e.target.value))} />
              </label>
              <label>
                Punctuality:
                <Input type="number" min="1" max="5" value={punctuality} onChange={e => setPunctuality(Number(e.target.value))} />
              </label>
              <label>
                Work Quality:
                <Input type="number" min="1" max="5" value={workQuality} onChange={e => setWorkQuality(Number(e.target.value))} />
              </label>
              <label>
                Communication:
                <Input type="number" min="1" max="5" value={communication} onChange={e => setCommunication(Number(e.target.value))} />
              </label>
              <label>
                Cleanliness:
                <Input type="number" min="1" max="5" value={cleanliness} onChange={e => setCleanliness(Number(e.target.value))} />
              </label>
              <label>
                Comment:
                <Textarea value={comment} onChange={e => setComment(e.target.value)} />
              </label>
              <label>
                Would you recommend?
                <select value={wouldRecommend} onChange={e => setWouldRecommend(e.target.value === 'true')}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
              <label>
                Anonymous?
                <select value={isAnonymous} onChange={e => setIsAnonymous(e.target.value === 'true')}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </label>
              <Button type="submit">Submit Review</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
