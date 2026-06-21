import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const apiUrl = import.meta.env.VITE_API_URL;

export function TechnicianBidsPage() {
  const { user, token, logout } = useAuth(); // Fetch user data from context and add logout
  const [bids, setBids] = useState([]); // Technician's bids
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(''); // Error state
  const [success, setSuccess] = useState(''); // Success state
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBids = async () => {
      setLoading(true);
      setError('');
      setSuccess('');

      try {
        const response = await fetch(`${apiUrl}/bids/technician/${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError('Session expired. Please log in again.');
            logout();  // Log out user if token is invalid
            return;
          }
          throw new Error('Failed to fetch bids');
        }

        const data = await response.json();
        if (data.bids && data.bids.length > 0) {
          setBids(data.bids);
        } else {
          setError('You have no bids at the moment.');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching your bids');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBids();
    }
  }, [user, token, logout]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="text-foreground font-inter">
      <div className="w-full max-w-7xl mx-auto py-8 p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-6">
          Your Bids
        </h1>

        {/* Display error or success message */}
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        {success && <p className="text-green-500 text-sm mt-4">{success}</p>}

        {/* Display bids made by technician */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-center text-gray-500">Loading your bids...</p>
          ) : bids.length === 0 ? (
            <p className="text-center text-gray-500">You haven't placed any bids yet.</p>
          ) : (
            bids.map((bid) => (
              <Card
                key={bid.id}
                className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{bid.booking.service}</CardTitle>
                    <Badge className={getStatusColor(bid.status)}>
                      {bid.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm text-muted-foreground">
                    {bid.booking.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(bid.booking.preferredDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{`$${bid.bidAmount}`}</span>
                    </div>
                  </div>

                  {/* If the bid is accepted, show a green check circle */}
                  {bid.status === 'accepted' && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>Bid Accepted</span>
                    </div>
                  )}

                  {/* If the bid is rejected, show a red X circle */}
                  {bid.status === 'rejected' && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <XCircle className="h-5 w-5" />
                      <span>Bid Rejected</span>
                    </div>
                  )}

                  {/* If the bid is pending, show an alert */}
                  {bid.status === 'pending' && (
                    <div className="flex items-center gap-2 text-sm text-yellow-600">
                      <AlertCircle className="h-5 w-5" />
                      <span>Bid Pending</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
