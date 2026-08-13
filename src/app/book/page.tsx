import { SiteHeader } from "@/components/site-header";
import AppointmentBookingForm from "@/components/appointment-booking-form";

export const metadata = {
  title: "Book a Dental Appointment | JV Dental",
  description: "Request an in-clinic dental appointment or video consultation with JV Dental in Hyderabad.",
};

export default function BookAppointmentPage() {
  return (
    <main className="booking-page">
      <SiteHeader />
      <section className="booking-hero">
        <div>
          <p className="eyebrow">Appointments · Hyderabad</p>
          <h1>Book a dental appointment or consultation.</h1>
          <p>Local patients can request an in-clinic visit. Patients who want to discuss implant treatment, records or travel planning can request a video consultation.</p>
        </div>
        <div className="booking-hero__facts">
          <span><strong>Clinic appointment</strong><small>Visit JV Dental in Hyderabad</small></span>
          <span><strong>Video consultation</strong><small>Discuss your case remotely</small></span>
          <span><strong>Secure payment</strong><small>Available when consultation payment is configured</small></span>
        </div>
      </section>

      <section className="booking-layout">
        <div className="booking-intro">
          <p className="section-kicker">Choose your consultation</p>
          <h2>Tell us when you would like to visit.</h2>
          <p>Your preferred date and time are a request, not an automatic confirmation. The clinic team will confirm availability and the final appointment time.</p>
          <div className="booking-steps">
            <span><b>01</b> Choose clinic or video consultation</span>
            <span><b>02</b> Share your preferred date and concern</span>
            <span><b>03</b> Complete secure payment when applicable</span>
            <span><b>04</b> Receive appointment confirmation from the clinic</span>
          </div>
        </div>
        <AppointmentBookingForm />
      </section>
    </main>
  );
}
