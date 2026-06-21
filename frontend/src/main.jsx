import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LandingPage from './LandingPage.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import { TechnicianOnboarding } from './pages/TechnicianOnboarding.jsx';
import { ServiceBooking } from './ServiceBooking.jsx';
import { BookingStatus } from './BookingStatus.jsx';
import { AuthProvider } from './context/AuthContext';
import { ReviewTechnician } from './ReviewTechnician.jsx';
import ProtectedRoutes from './context/ProtectedRoutes.jsx';
import {UserBookings} from './UserBookingsDetails.jsx';
import { TechnicianBiddingPage } from './TechnicianBidding.jsx';
import { TechnicianBidsPage } from './TechnicianBidsPage.jsx';
import './index.css';
import Layout from './Layout.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import {RepairDiagnosis} from './RepairDiagnosis.jsx';
import SearchTechnicians from './components/SearchTechnician.jsx';
import PaymentGateway from './components/PaymentGateway.jsx';
import TechnicianDashboard from './components/TechnicianDashboard.jsx';
import { SocketProvider } from './context/socket.provider.jsx';
import ProfilePage from './ProfilePage.jsx';

// Define your routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
    errorElement: <NotFoundPage />,
  },
  {
    path:'/search',
    element: <SearchTechnicians />
  },
  {
    path:'/payment',
    element: <PaymentGateway />
  },
  {
    path: '/technician-onboarding/:userId',
    element: <TechnicianOnboarding />,
  },
  {
    element: <ProtectedRoutes allowedRoles={['user']} />,
    children: [
      {
        path: '/service-booking',
        element: <ServiceBooking />,
      },
      {
        path: '/booking-status/:id',
        element: <BookingStatus />,
      },
      {
        path: '/review/:bookingId',
        element: <ReviewTechnician />,
      },
      {
        path: '/user-bookings',
        element: <UserBookings />,
      },
      {
        path: "/repair-diagnosis",
        element: <RepairDiagnosis />,
      },
    ],
  },
  {
    element: <ProtectedRoutes allowedRoles={['technician']} />,
    children: [
      {
        path: '/technician-bidding',
        element: <TechnicianBiddingPage />,
      },
      {
        path: '/my-bids',
        element: <TechnicianBidsPage />,
      },
      {
        path: '/dashboard',
        element: <TechnicianDashboard />,
      },
    ],
  },
  {
    element: <ProtectedRoutes allowedRoles={['admin']} />,
    children: [
      {
        path: '/admin-dashboard',
        element: <AdminDashboard />,
      },
    ],
  },
  {
    path: '/profile',
    element: <ProfilePage />,
  },
]);

// Wrap the RouterProvider with the AuthProvider to provide authentication context globally
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
      <Layout>
        <RouterProvider router={router} />
      </Layout>
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>
);
