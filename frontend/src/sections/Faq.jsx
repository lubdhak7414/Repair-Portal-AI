import { AccordionTrigger, AccordionContent, AccordionItem, Accordion } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"

function Faq() {
  return (
    <section className="py-12 w-full max-w-4xl p-6 mx-auto">
      <div className="text-center">
        <Badge variant="outline">FAQs</Badge>
        <h1 className="py-4 text-6xl font-bold">Frequently Asked Questions</h1>
      </div>

      <div className="mt-6">
        <Accordion className="w-full divide-y" collapsible type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger className="p-4 cursor-pointer text-lg font-medium">
              How do I book a repair service?
            </AccordionTrigger>
            <AccordionContent className="p-4">
              Simply sign up, select the service you need, describe the issue, and choose
              your preferred date and time. You can optionally enable bidding to let
              multiple technicians compete for your job.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="p-4 cursor-pointer text-lg font-medium">
              How does the bidding system work?
            </AccordionTrigger>
            <AccordionContent className="p-4">
              When you create a booking with bidding enabled, technicians in your area
              can submit offers with their price and estimated duration. You can review
              their profiles and ratings, then accept the best bid. You&apos;re not obligated
              to accept any bid if none meet your needs.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="p-4 cursor-pointer text-lg font-medium">
              What payment methods are accepted?
            </AccordionTrigger>
            <AccordionContent className="p-4">
              We accept bKash, Nagad, Rocket, credit/debit cards, and cash on completion.
              All payments are processed securely through our platform. A small platform
              fee is included in the total amount.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger className="p-4 cursor-pointer text-lg font-medium">
              Is there a warranty on repair work?
            </AccordionTrigger>
            <AccordionContent className="p-4">
              Yes! Every completed booking comes with a digital warranty card. The warranty
              period varies by service type — typically 30-90 days for parts and labor.
              You can file warranty claims directly through the platform if issues arise.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger className="p-4 cursor-pointer text-lg font-medium">
              Can I cancel or reschedule a booking?
            </AccordionTrigger>
            <AccordionContent className="p-4">
              Yes, you can cancel or reschedule a booking as long as it hasn&apos;t been
              marked as completed. Go to &quot;My Bookings&quot;, click on the booking, and use
              the cancel or reschedule options. Please note that repeated last-minute
              cancellations may affect your account standing.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-6">
            <AccordionTrigger className="p-4 cursor-pointer text-lg font-medium">
              How do I become a technician on the platform?
            </AccordionTrigger>
            <AccordionContent className="p-4">
              Sign up and select the &quot;technician&quot; role during registration. After creating
              your account, complete your technician profile with your services, experience,
              certifications, and service areas. Once verified, you can start browsing and
              bidding on available jobs in your area.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}

export default Faq;
