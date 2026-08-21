import AppointmentBookingForm from "@/components/appointment-booking-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Book a Dental Appointment or Video Consultation | JV Dental Hyderabad",
  description: "Book an in-clinic dental appointment in Hyderabad or request a video consultation from anywhere in India or overseas with JV Dental.",
};

export default function BookAppointmentPage() {
  return (
    <main className="booking-page">
      <SiteHeader />
      <section className="booking-hero">
        <div>
          <p className="eyebrow">Appointments · India & international</p>
          <h1>Book a dental appointment or consultation.</h1>
          <p>JV Dental welcomes patients from Hyderabad, across India and overseas. Visit our Hyderabad clinic in person, or request a video consultation to discuss implants, dental concerns, records, treatment planning or a second opinion before you travel.</p>
        </div>
        <div className="booking-hero__facts">
          <span><strong>Hyderabad & local patients</strong><small>Book an in-clinic dental appointment</small></span>
          <span><strong>Patients across India</strong><small>Visit Hyderabad or begin with a video consultation</small></span>
          <span><strong>International patients</strong><small>Discuss your case remotely before planning travel</small></span>
        </div>
      </section>

      <section className="booking-layout">
        <div className="booking-intro">
          <p className="section-kicker">Choose your consultation</p>
          <h2>Choose the consultation that suits you.</h2>
          <p>Whether you live nearby, are travelling to Hyderabad from another Indian city, or are contacting us from overseas, you can request a preferred date and time here. The clinic team will review availability and confirm the final appointment.</p>
          <div className="booking-steps">
            <span><b>01</b> Choose clinic appointment or video consultation</span>
            <span><b>02</b> Share your preferred date and dental concern</span>
            <span><b>03</b> Complete secure payment when applicable</span>
            <span><b>04</b> Receive appointment confirmation from the clinic</span>
          </div>
        </div>
        <AppointmentBookingForm />
      </section>

      <SiteFooter />
    </main>
  );
}
