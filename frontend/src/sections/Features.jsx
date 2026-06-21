function Features() {
  return (
    <section className='py-12'>
      {/* Feature 1: AI-Powered Diagnosis */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold text-primary mb-4">AI-Powered Diagnosis</h2>
            <h1 className="text-6xl font-bold mb-4">Snap a Photo, Get Answers</h1>
            <p className="py-4 mx-auto max-w-[700px] text-gray-500 md:text-xl">
              Upload a photo of your broken appliance or fixture and our AI instantly
              analyzes the issue. Get a detailed diagnosis, estimated repair cost, and
              recommended technician specialties — before anyone even visits.
            </p>
          </div>
          <div>
            <img
              alt="AI Diagnosis"
              className="mx-auto"
              height="400"
              src="assets/f1.png"
              style={{
                aspectRatio: "400/400",
              }}
              width="400"
            />
          </div>
        </div>
      </div>

      {/* Feature 2: Smart Bidding System */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <img
              alt="Smart Bidding"
              className="mx-auto"
              height="400"
              src="assets/f1.png"
              style={{
                aspectRatio: "400/400",
              }}
              width="400"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-primary mb-4">Smart Bidding System</h2>
            <h1 className="text-6xl font-bold mb-4">Choose the Best Offer</h1>
            <p className="py-4 mx-auto max-w-[700px] text-gray-500 md:text-xl">
              Post your repair job and let certified technicians compete for your business.
              Compare quotes, read reviews, and pick the technician that fits your budget
              and schedule. No more calling around for prices.
            </p>
          </div>
        </div>
      </div>

      <div className="circlePosition w-full h-full bg-[#36a0d142] rounded-[100%] absolute -z-10 blur-[100px] flex justify-center items-center">
        <div className="circle w-68 h-68 bg-[#26b9fd42] rounded-[100%]" />
      </div>

      {/* Feature 3: Real-Time Tracking */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center">
          <h1 className="text-6xl font-bold mb-4 text-center">
            Real-Time Job Tracking
          </h1>
          <p className="py-4 mx-auto max-w-[700px] text-gray-500 md:text-xl text-center">
            Know exactly when your technician will arrive and what&apos;s happening at every
            stage. Get live status updates, chat directly with your technician, and
            receive digital invoices and warranty cards when the job is done.
          </p>
          <div className="w-full">
            <img
              alt="Dashboard preview"
              className="w-full h-auto"
              src="assets/Dashboard.png"
              style={{
                aspectRatio: "1280/720",
                objectFit: "cover",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Features;
