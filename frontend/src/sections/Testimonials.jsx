import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card";
import {
  CarouselItem,
  CarouselContent,
  CarouselPrevious,
  CarouselNext,
  Carousel,
} from "@/components/ui/carousel";

function Testimonials() {
  return (
    <section className="py-12 w-full max-w-4xl p-6 mx-auto">
      <div className="flex flex-col items-center justify-center space-y-8 mx-auto">
        <div className="text-center">
          <Badge variant="outline">Our Satisfied Customers</Badge>
          <h1 className="py-4 text-6xl font-bold">Client Testimonials</h1>
        </div>
        <Carousel
          opts={{
            align: "start",
          }}
          className="w-full max-w-64 sm:max-w-xl md:max-w-2xl lg:max-w-4xl"
        >
          <CarouselContent className="px-4">
            <CarouselItem className="sm:basis-1/1 md:basis-1/2 lg:basis-1/2">
              <Card className="flex flex-col items-center text-center p-6 h-full">
                <Avatar className="w-20 h-20 border-2">
                  <AvatarImage alt="@rahim" src="/placeholder-avatar.jpg" />
                  <AvatarFallback>RM</AvatarFallback>
                </Avatar>
                <h3 className="mt-4 text-lg font-semibold text-primary">Rahim M.</h3>
                <div className="flex flex-col h-full">
                  <p className="mt-4 text-gray-500">
                    {'"My AC broke down in the middle of summer. I posted the job on Repair Portal and had three quotes within an hour. The technician arrived the same day and fixed everything. Couldn\'t be happier!"'}
                  </p>
                </div>
              </Card>
            </CarouselItem>
            <CarouselItem className="sm:basis-1/1 md:basis-1/2 lg:basis-1/2">
              <Card className="flex flex-col items-center text-center p-6 h-full">
                <Avatar className="w-20 h-20 border-2">
                  <AvatarImage alt="@fatima" src="/placeholder-avatar.jpg" />
                  <AvatarFallback>FK</AvatarFallback>
                </Avatar>
                <h3 className="mt-4 text-lg font-semibold text-primary">Fatima K.</h3>
                <div className="flex flex-col h-full">
                  <p className="mt-4 text-gray-500">
                    {'"The AI diagnosis feature is incredible! I took a photo of my leaking pipe, and it identified the issue instantly. The technician who came was already prepared with the right parts. Saved me time and money."'}
                  </p>
                </div>
              </Card>
            </CarouselItem>
            <CarouselItem className="sm:basis-1/1 md:basis-1/2 lg:basis-1/2">
              <Card className="flex flex-col items-center text-center p-6 h-full">
                <Avatar className="w-20 h-20 border-2">
                  <AvatarImage alt="@karim" src="/placeholder-avatar.jpg" />
                  <AvatarFallback>KA</AvatarFallback>
                </Avatar>
                <h3 className="mt-4 text-lg font-semibold text-primary">Karim A.</h3>
                <div className="flex flex-col h-full">
                  <p className="mt-4 text-gray-500">
                    {'"As a technician, Repair Portal has transformed my business. I get matched with jobs that fit my skills, set my own prices through bidding, and get paid on time. The platform fee is more than fair for the volume of leads I receive."'}
                  </p>
                </div>
              </Card>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
}

export default Testimonials;
