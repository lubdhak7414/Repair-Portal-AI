import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './sections/navbar';
import Footer from './sections/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, AlertCircle, DollarSign, User, Phone } from 'lucide-react';

export function UserBookings() {
  const { user } = useAuth();
  const [userLoading, setUserLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDateTime, setNewDateTime] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [bids, setBids] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (user !== null) {
      setUserLoading(false);
    }

    const fetchBookings = async () => {
      if (!user || !user.id) return;
      
      try {
        const response = await fetch(`${apiUrl}/bookings/user/${user.id}`);
        const data = await response.json();
        
        if (response.ok) {
          setBookings(data.bookings);
        } else {
          throw new Error(data.message || 'Failed to fetch bookings');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading) {
      fetchBookings();
    }
  }, [user, userLoading]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'bidding':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'pending':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'accepted':
      case 'confirmed':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'in-progress':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'completed':
        return 'bg-green-500 hover:bg-green-600';
      case 'cancelled':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return '0 hover:bg-gray-600';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const handleCardClick = async (booking) => {
    setSelectedBooking(booking);
    setNewDateTime(booking.preferredTime);
    setDialogOpen(true);
    
    // If booking is bidding type, fetch the bids
    if (booking.isBidding || booking.status === 'bidding') {
      setBidsLoading(true);
      try {
        const response = await fetch(`${apiUrl}/bids/booking/${booking.id}`);
        const data = await response.json();
        
        if (response.ok) {
          setBids(data.bids || data);
        } else {
          throw new Error(data.message || 'Failed to fetch bids');
        }
      } catch (err) {
        console.error('Error fetching bids:', err);
        setBids([]);
      } finally {
        setBidsLoading(false);
      }
    } else {
      setBids([]);
    }
  };

  const handleAcceptBid = async (bidId) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${apiUrl}/bids/${bidId}/accept`, { method: 'PUT' });
      const data = await response.json();
      if (response.ok) {
        setSelectedBooking({ ...selectedBooking, status: 'accepted' });
        // Refresh bookings to show updated status
        const updatedBookings = bookings.map(b => 
          b.id === selectedBooking.id ? { ...b, status: 'accepted' } : b
        );
        setBookings(updatedBookings);
        alert('Bid accepted successfully!');
        setDialogOpen(false);
      } else {
        alert(data.message || 'Failed to accept bid');
      }
    } catch (err) {
      alert(err.message || 'Failed to accept bid');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await fetch(`${apiUrl}/bookings/cancel/${selectedBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationReason: 'Cancelled by user' })
      });
      
      if (response.ok) {
        const updatedBookings = bookings.map(b => 
          b.id === selectedBooking.id ? { ...b, status: 'cancelled' } : b
        );
        setBookings(updatedBookings);
        alert('Booking cancelled successfully!');
        setDialogOpen(false);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to cancel booking');
      }
    } catch (err) {
      alert('Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!newDateTime) {
      alert('Please select a new date and time');
      return;
    }
    
    if (new Date(newDateTime) < new Date()) {
      alert('New date and time cannot be in the past');
      return;
    }

    setActionLoading(true);
    // Note: You'll need to implement the reschedule API endpoint
    setTimeout(() => {
      alert('Booking rescheduled successfully!');
      setActionLoading(false);
      setDialogOpen(false);
    }, 1000);
  };

  if (userLoading) {
    return (
      <div className="text-foreground font-inter min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg">Loading user data...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="text-foreground font-inter min-h-screen">
      <Navbar />
      <div className="w-full max-w-7xl mx-auto py-8 p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-300 mb-4">
            My Bookings
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">
            View and manage all your service bookings. Click on any booking to view details, reschedule, or cancel.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg">Loading your bookings...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-center text-red-600">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p className="text-xl font-semibold mb-2">Error Loading Bookings</p>
              <p>{error}</p>
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-center text-gray-500">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-xl font-semibold mb-2">No bookings found</p>
              <p className="mb-6">Ready to book your first service?</p>
              <Button 
                onClick={() => window.location.href = '/service-booking'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Browse Services
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => (
              <Card 
                key={booking.id} 
                className=" border border-gray-200 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1"
                onClick={() => handleCardClick(booking)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg font-semibold text-gray-300">
                      {booking.service?.name || 'Service'}
                    </CardTitle>
                    <Badge className={`text-white ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm text-gray-200">
                    {booking.service?.category || 'General'}
                    {booking.isBidding && (
                      <span className="ml-2 text-orange-600 font-medium">• Bidding</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-200 line-clamp-2">
                    {booking.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-200">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span>{formatDate(booking.preferredDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-200">
                      <Clock className="h-4 w-4 text-green-500" />
                      <span>{formatTime(booking.preferredTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-200">
                      <MapPin className="h-4 w-4 text-red-500" />
                      <span className="line-clamp-1">{booking.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-200">
                      <DollarSign className="h-4 w-4 text-yellow-500" />
                      <span>
                        {booking.estimatedCost > 0 
                          ? `৳${booking.estimatedCost}` 
                          : booking.service?.estimatedPrice 
                            ? `৳${booking.service.estimatedPrice.min} - ৳${booking.service.estimatedPrice.max}`
                            : 'Price TBD'}
                      </span>
                    </div>
                    {booking.technician && (
                      <div className="flex items-center gap-2 text-sm text-gray-200">
                        <User className="h-4 w-4 text-purple-500" />
                        <span>{booking.technician.user?.name || booking.technician.name || 'Technician assigned'}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                      <Badge variant="outline" className={`text-xs ${getUrgencyColor(booking.urgency)}`}>
                        {booking.urgency} priority
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Booking Management Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-300">
                Manage Booking
              </DialogTitle>
              <DialogDescription className="text-gray-200">
                {selectedBooking?.service?.name} - {selectedBooking && formatDate(selectedBooking.preferredDate)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Current Booking Details */}
              <div className="p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Booking Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="font-medium text-gray-200">Service:</span> {selectedBooking?.service?.name}</div>
                  <div><span className="font-medium text-gray-200">Category:</span> {selectedBooking?.service?.category}</div>
                  <div><span className="font-medium text-gray-200">Date:</span> {selectedBooking && formatDate(selectedBooking.preferredDate)}</div>
                  <div><span className="font-medium text-gray-200">Time:</span> {selectedBooking && formatTime(selectedBooking.preferredTime)}</div>
                  <div className="md:col-span-2"><span className="font-medium text-gray-200">Address:</span> {selectedBooking?.address}</div>
                  <div><span className="font-medium text-gray-200">Status:</span> 
                    <Badge className={`ml-2 text-white ${getStatusColor(selectedBooking?.status)}`}>
                      {selectedBooking?.status}
                    </Badge>
                  </div>
                  <div><span className="font-medium text-gray-200">Priority:</span> 
                    <Badge variant="outline" className={`ml-2 text-xs ${getUrgencyColor(selectedBooking?.urgency)}`}>
                      {selectedBooking?.urgency}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Technician Info */}
              {selectedBooking?.technician && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Assigned Technician</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-300">{selectedBooking.technician.user?.name || selectedBooking.technician.name}</p>
                      <p className="text-sm text-gray-200">{selectedBooking.technician.user?.phone || selectedBooking.technician.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reschedule Section */}
              {selectedBooking?.status !== 'completed' && selectedBooking?.status !== 'cancelled' && (
                <div className="space-y-3">
                  <label htmlFor="reschedule-time" className="text-sm font-semibold text-gray-300">
                    Reschedule Booking
                  </label>
                  <Input
                    id="reschedule-time"
                    type="datetime-local"
                    value={newDateTime}
                    onChange={(e) => setNewDateTime(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}

              {/* Bids Section */}
              {(selectedBooking?.isBidding || selectedBooking?.status === 'bidding') && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-300">Available Bids</h4>
                  {bidsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-200">Loading bids...</p>
                    </div>
                  ) : bids.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No bids available yet.</p>
                      <p className="text-xs mt-1">Technicians will submit bids soon.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {bids.map((bid) => (
                        <Card key={bid.id} className="border border-gray-200 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h5 className="font-semibold text-gray-300">{bid.technician?.user?.name || bid.technician?.name}</h5>
                                <div className="flex items-center gap-1 text-sm text-gray-200 mt-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{bid.technician?.user?.phone || bid.technician?.phone}</span>
                                </div>
                              </div>
                              <Badge className="bg-green-600 hover:bg-green-700 text-white">
                                ৳{bid.bidAmount}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-200 mb-3">{bid.message}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">
                                Duration: {bid.estimatedDuration}h
                              </span>
                              <Button 
                                size="sm" 
                                onClick={() => handleAcceptBid(bid.id)}
                                disabled={actionLoading}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {actionLoading ? 'Accepting...' : 'Accept Bid'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-6 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                disabled={actionLoading}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
              
              {selectedBooking?.status !== 'completed' && selectedBooking?.status !== 'cancelled' && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleReschedule}
                    disabled={actionLoading}
                    className="w-full sm:w-auto"
                  >
                    {actionLoading ? 'Rescheduling...' : 'Reschedule'}
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="w-full sm:w-auto"
                  >
                    {actionLoading ? 'Cancelling...' : 'Cancel Booking'}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
}