import { Button } from "@/components/ui/button";
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegistrationForm } from './RegistrationForm';

function CTA() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPanel, setShowPanel] = useState(null);

  const handleGetStarted = () => {
    if (user) {
      navigate('/service-booking');
    } else {
      setShowPanel('register');
    }
  };

  return (
    <section className='py-12 container px-4 md:px-6'>
      <div className="bg-primary rounded-lg p-8 shadow-md text-foreground">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="text-center lg:text-left container space-y-6">
            <h6 className="text-sm font-medium uppercase">Repair Portal</h6>
            <h1 className="text-6xl font-bold mb-8">Get Your Repairs Done Fast</h1>
            <p className="text-lg leading-loose">
              From plumbing emergencies to electrical repairs, find trusted technicians in your area.
              Post a job, compare bids, and get it fixed — all in one place.
            </p>
            <Button variant="outline" onClick={handleGetStarted}>
              Get Started <ChevronRight />
            </Button>
          </div>
          <div className='flex justify-center'>
            <img
              alt="Repair services illustration"
              height="720"
              src="assets/ctapic.png"
              style={{
                aspectRatio: "1080/720",
              }}
              width="720"
            />
          </div>
        </div>
      </div>
      {showPanel && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[100]"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPanel(null); }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            {showPanel === 'login' && (
              <LoginForm onSwitchToRegister={() => setShowPanel('register')} />
            )}
            {showPanel === 'register' && (
              <RegistrationForm onSwitchToLogin={() => setShowPanel('login')} />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default CTA;
