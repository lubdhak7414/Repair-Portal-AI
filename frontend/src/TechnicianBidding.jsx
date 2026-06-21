import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './sections/navbar';
import Footer from './sections/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, AlertCircle, DollarSign, User, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const apiUrl = import.meta.env.VITE_API_URL;

export function TechnicianBiddingPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [userLoading, setUserLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user !== null) {
      setUserLoading(false);
    }

    const fetchBookings = async () => {
      if (!user || !user.id) return;
      
      try {
        const response = await fetch(`${apiUrl}/bookings/bidding-bookings/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError('Session expired. Please log in again.');
            logout();
            return;
          }
          throw new Error('Failed to fetch bidding bookings');
        }

        const data = await response.json();
        if (data.message === 'Bidding bookings retrieved successfully') {
          setBookings(data.bookings);
        } else {
          setBookings([]);
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching the bookings');
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading) {
      fetchBookings();
    }
  }, [user, userLoading, token, logout]);

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCardClick = (booking) => {
    setSelectedBooking(booking);
    setDialogOpen(true);
  };

  const handlePlaceBid = () => {
    setDialogOpen(false);
    setBidDialogOpen(true);
    setBidAmount('');
    setEstimatedDuration('');
    setMessage('');
    setError('');
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();

    if (!selectedBooking) {
      setError('Please select a booking to bid on.');
      return;
    }

    if (!bidAmount || !estimatedDuration || !message) {
      setError('Please fill in all the bid details.');
      return;
    }

    if (parseFloat(bidAmount) <= 0) {
      setError('Bid amount must be greater than 0.');
      return;
    }

    if (parseFloat(estimatedDuration) <= 0) {
      setError('Estimated duration must be greater than 0.');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking: selectedBooking.id,
          technician: user.id,
          bidAmount: parseFloat(bidAmount),
          message,
          estimatedDuration: parseFloat(estimatedDuration),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Your bid has been submitted successfully!');
        setBidDialogOpen(false);
        setBookings(prevBookings => 
          prevBookings.filter(booking => booking.id !== selectedBooking.id)
        );
      } else {
        throw new Error(data.message || 'Failed to place the bid. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while placing the bid.');
    } finally {
      setActionLoading(false);
    }
  };

  if (userLoading) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="text-foreground font-inter min-h-screen">
      <Navbar />
      <div className="w-full max-w-7xl mx-auto py-8 p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-6">
          Available Bidding Jobs
        </h1>
        <p className="text-lg text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
          Browse available jobs and place your bids. Click on any job to view details and submit your offer.
        </p>

        {loading ? (
          <div className="text-center">Loading available jobs...</div>
        ) : error ? (
          <div className="text-center text-red-500">Error: {error}</div>
        ) : bookings.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <p>No bidding jobs available at the moment.</p>
            <p className="mt-2">Check back later for new opportunities!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => (
              <Card
                key={booking.id}
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                onClick={() => handleCardClick(booking)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{booking.service.name}</CardTitle>
                    <Badge className="bg-orange-500">
                      bidding
                    </Badge>
                  </div>
                  <CardDescription className="text-sm text-muted-foreground">
                    {booking.service.category}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {booking.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(booking.preferredDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatTime(booking.preferredTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="line-clamp-1">{booking.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {booking.estimatedCost > 0
                          ? `$${booking.estimatedCost}`
                          : `$${booking.service.estimatedPrice.min} - $${booking.service.estimatedPrice.max}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className={getUrgencyColor(booking.urgency)}>
                      {booking.urgency} priority
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Job Details Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Job Details</DialogTitle>
              <DialogDescription>
                {selectedBooking?.service.name} - {selectedBooking && formatDate(selectedBooking.preferredDate)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Service Information:</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Service:</strong> {selectedBooking?.service.name}</p>
                  <p><strong>Category:</strong> {selectedBooking?.service.category}</p>
                  <p><strong>Description:</strong> {selectedBooking?.description}</p>
                  <p><strong>Date:</strong> {selectedBooking && formatDate(selectedBooking.preferredDate)}</p>
                  <p><strong>Time:</strong> {selectedBooking && formatTime(selectedBooking.preferredTime)}</p>
                  <p><strong>Address:</strong> {selectedBooking?.address}</p>
                  <p><strong>Estimated Cost Range:</strong> ${selectedBooking?.service.estimatedPrice.min} - ${selectedBooking?.service.estimatedPrice.max}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className={getUrgencyColor(selectedBooking?.urgency)}>
                  {selectedBooking?.urgency} priority
                </Badge>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={handlePlaceBid}
              >
                Place Bid
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bid Submission Dialog */}
        <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Place Your Bid</DialogTitle>
              <DialogDescription>
                Submit your offer for {selectedBooking?.service.name}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleBidSubmit}>
              <div className="space-y-4">
                {/* Bid Amount */}
                <div className="space-y-2">
                  <label htmlFor="bidAmount" className="text-sm font-medium">
                    Bid Amount ($)
                  </label>
                  <Input
                    id="bidAmount"
                    type="number"
                    step="0.01"
                    min="1"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Enter your bid amount"
                    required
                  />
                </div>

                {/* Estimated Duration */}
                <div className="space-y-2">
                  <label htmlFor="estimatedDuration" className="text-sm font-medium">
                    Estimated Duration (hours)
                  </label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    placeholder="e.g., 2.5"
                    required
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message to Customer
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Explain your approach, experience, or any relevant details..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>

                {/* Error Message */}
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBidDialogOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Submitting...' : 'Submit Bid'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
}
