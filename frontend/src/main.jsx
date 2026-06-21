import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LandingPage from './LandingPage.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoutes from './context/ProtectedRoutes.jsx';
import './index.css';
import Layout from './Layout.jsx';
import { SocketProvider } from './context/socket.provider.jsx';

// Route pages are code-split so each loads only when its route is visited.
// Named exports are unwrapped to the `default` shape React.lazy expects.
const TechnicianOnboarding = lazy(() =>
  import('./pages/TechnicianOnboarding.jsx').then((m) => ({ default: m.TechnicianOnboarding }))
);
const ServiceBooking = lazy(() =>
  import('./ServiceBooking.jsx').then((m) => ({ default: m.ServiceBooking }))
);
const BookingStatus = lazy(() =>
  import('./BookingStatus.jsx').then((m) => ({ default: m.BookingStatus }))
);
const ReviewTechnician = lazy(() =>
  import('./ReviewTechnician.jsx').then((m) => ({ default: m.ReviewTechnician }))
);
const UserBookings = lazy(() =>
  import('./UserBookingsDetails.jsx').then((m) => ({ default: m.UserBookings }))
);
const TechnicianBiddingPage = lazy(() =>
  import('./TechnicianBidding.jsx').then((m) => ({ default: m.TechnicianBiddingPage }))
);
const TechnicianBidsPage = lazy(() =>
  import('./TechnicianBidsPage.jsx').then((m) => ({ default: m.TechnicianBidsPage }))
);
const RepairDiagnosis = lazy(() =>
  import('./RepairDiagnosis.jsx').then((m) => ({ default: m.RepairDiagnosis }))
);
const AdminDashboard = lazy(() => import('./AdminDashboard.jsx'));
const SearchTechnicians = lazy(() => import('./components/SearchTechnician.jsx'));
const PaymentGateway = lazy(() => import('./components/PaymentGateway.jsx'));
const TechnicianDashboard = lazy(() => import('./components/TechnicianDashboard.jsx'));
const ProfilePage = lazy(() => import('./ProfilePage.jsx'));

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

// Lightweight fallback shown while a route chunk is loading.
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">
      Loading…
    </div>
  );
}

// Wrap the RouterProvider with the AuthProvider to provide authentication context globally
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <RouterProvider router={router} />
        </Suspense>
      </Layout>
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>
);
