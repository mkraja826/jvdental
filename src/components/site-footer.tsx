import Image from "next/image";
import Link from "next/link";

const navigation = [
  ["Dental implants", "/dental-implants"],
  ["Guided implants", "/guided-implants"],
  ["International patients", "/international"],
  ["Dental cases", "/cases"],
  ["Dentists", "/doctors"],
  ["Dental journal", "/journal"],
  ["Book appointment", "/book"],
  ["Patient login", "/patient/login"],
  ["Clinic login", "/staff/login"],
] as const;

const address = "7-1-395/29 (34-A), Sai Ganga Towers, Balkampet Road, S R Nagar, Hyderabad, Telangana 500038";
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
const receptionNumber = "+91 40 4020 8910";
const whatsappNumber = "+91 96666 89855";
const whatsappUrl = "https://wa.me/919666689855?text=Hello%20JV%20Dental%2C%20I%20would%20like%20to%20enquire%20about%20an%20appointment.";

function Icon({ name }: { name: "pin" | "phone" | "whatsapp" | "linkedin" | "practo" }) {
  if (name === "pin") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-12A7 7 0 0 0 5 9c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>;
  }
  if (name === "phone") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.4 3.5 10 8 8.3 9.7c1.4 2.8 3.2 4.6 6 6l1.7-1.7 4.5 2.6-.9 3.1c-.2.8-1 1.3-1.8 1.3C9.6 21 3 14.4 3 6.2c0-.8.5-1.6 1.3-1.8l3.1-.9Z"/></svg>;
  }
  if (name === "whatsapp") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 3.6A11.8 11.8 0 0 0 1.9 17.8L.4 23.4l5.7-1.5A11.8 11.8 0 0 0 20.4 3.6Zm-8.3 17.1c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.3.9.9-3.2-.2-.4A9.6 9.6 0 1 1 12.1 20.7Zm5.3-7.2c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1l-1 1.2c-.2.2-.4.2-.7.1-1.8-.9-3-1.7-4.2-3.7-.3-.5.3-.5.9-1.6.1-.2.1-.4 0-.6l-.9-2.2c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.4 1.4 3.6c.2.2 2.4 3.7 5.9 5.2.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3Z"/></svg>;
  }
  if (name === "linkedin") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.3 8.3H1.7V20h3.6V8.3ZM3.5 2.5a2.1 2.1 0 1 0 0 4.2 2.1 2.1 0 0 0 0-4.2ZM22.3 13.3c0-3.5-1.9-5.2-4.4-5.2-2 0-3 1.1-3.5 1.9V8.3h-3.6V20h3.6v-5.8c0-1.5.3-3 2.2-3 1.9 0 1.9 1.8 1.9 3.1V20h3.8v-6.7Z"/></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h8.2c4.9 0 7.8 2.2 7.8 5.8 0 3.8-3 6.1-8 6.1H8.1V22H4V6.5Zm4.1 3.4v5.2H12c2.5 0 3.8-.9 3.8-2.7 0-1.7-1.3-2.5-3.8-2.5H8.1Z"/></svg>;
}

export function SiteFooter() {
  return (
    <footer className="footer footer--contact">
      <div className="footer-brand">
        <Image className="footer-logo" src="/jv-dental-logo.svg" alt="JV Dental Implant Centre" width={480} height={242} />
        <p>JV Dental &amp; Implant Centre · Hyderabad, India. Implant dentistry, full-mouth rehabilitation, digital treatment planning and coordinated care.</p>

        <div className="footer-contact" aria-label="JV Dental contact information">
          <a className="footer-contact__item footer-contact__item--address" href={mapsUrl} target="_blank" rel="noreferrer">
            <span className="footer-icon"><Icon name="pin" /></span>
            <span><small>Clinic address</small><strong>{address}</strong></span>
          </a>
          <a className="footer-contact__item" href="tel:+914040208910">
            <span className="footer-icon"><Icon name="phone" /></span>
            <span><small>Reception</small><strong>{receptionNumber}</strong></span>
          </a>
          <a className="footer-contact__item" href={whatsappUrl} target="_blank" rel="noreferrer">
            <span className="footer-icon"><Icon name="whatsapp" /></span>
            <span><small>WhatsApp</small><strong>{whatsappNumber}</strong></span>
          </a>
        </div>

        <div className="footer-social" aria-label="JV Dental profiles">
          <span className="footer-social__label">Connect</span>
          <a href="https://in.linkedin.com/in/jaya-prakash-chinta-9849a51b8" target="_blank" rel="noreferrer" aria-label="JV Dental on LinkedIn">
            <span className="footer-social__icon"><Icon name="linkedin" /></span><span>LinkedIn</span>
          </a>
          <a href="https://www.practo.com/hyderabad/clinic/jv-dental-care-sr-nagar-1" target="_blank" rel="noreferrer" aria-label="JV Dental on Practo">
            <span className="footer-social__icon"><Icon name="practo" /></span><span>Practo</span>
          </a>
        </div>
      </div>

      <nav className="footer-links" aria-label="Footer navigation">
        {navigation.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
      </nav>
    </footer>
  );
}
