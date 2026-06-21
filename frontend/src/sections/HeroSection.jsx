import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoginForm } from './LoginForm';
import { RegistrationForm } from './RegistrationForm';

function HeroSection() {
  const [activePanel, setActivePanel] = useState(null);

  useEffect(() => {
    // Dynamically load the dotlottie web component script
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@lottiefiles/dotlottie-wc@0.6.2/dist/dotlottie-wc.js";
    script.type = "module";
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) setActivePanel(null);
  };

  return (
    <section className="w-full py-12">
      <div className="circlePosition w-full h-full bg-[#36a0d142] rounded-[100%] absolute -z-10 blur-[100px] flex justify-center items-center">
        <div className="circle w-68 h-68 bg-[#26b9fd42] rounded-[100%]" />
      </div>
      <div className="container px-4 md:px-6">
        <div className="gap-4 grid grid-cols-1 lg:grid-cols-2 md:gap-16 flex items-center">
          <div>
            <h1 className="text-6xl font-extrabold mb-4">
              Revolutionizing Repair Services with Ease
            </h1>
            <p className="py-4 mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              Empower individuals and technicians with a seamless platform to book, track, and manage repair services.
              With an intuitive interface and trusted professionals, we make the repair process simple, transparent, and efficient.
              Join us in transforming the way repairs are done---bringing you closer to the service you need, with just a click.
            </p>

            <div className="flex items-left gap-6">
              <Button variant="outline" onClick={() => setActivePanel('login')}>Sign In</Button>
              <Button onClick={() => setActivePanel('register')}>Get Started</Button>
            </div>
          </div>

          <div className="mx-auto flex justify-center items-center">
            <div>
              <dotlottie-wc
                src="https://lottie.host/c22ca101-bb76-4648-b8bb-d4eb3db2e7c3/CC19uPCLYE.lottie"
                style={{ width: "300px", height: "300px" }}
                speed="1"
                autoplay
                loop
              ></dotlottie-wc>
            </div>
          </div>
        </div>
      </div>

      {activePanel && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[100]"
          onClick={handleOverlayClick}
        >
          <div onClick={(e) => e.stopPropagation()}>
            {activePanel === 'login' && (
              <LoginForm onSwitchToRegister={() => setActivePanel('register')} />
            )}
            {activePanel === 'register' && (
              <RegistrationForm onSwitchToLogin={() => setActivePanel('login')} />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default HeroSection;
