import { useState } from "react";
import "../styles/ContactUs.css";

function ContactUs() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, connect to your email service or Supabase
    setSubmitted(true);
  };

  const contacts = [
    { icon: "📧", label: "Email", value: "support@cookease.com", href: "mailto:support@cookease.com" },
    { icon: "📍", label: "Location", value: "Paranaque City, Philippines", href: null },
    { icon: "🕐", label: "Response Time", value: "Within 24 hours", href: null },
  ];

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <span className="contact-tag">Get In Touch</span>
        <h1>We'd Love to <span className="contact-accent">Hear</span> From You</h1>
        <p>Have a question, suggestion, or just want to say hello? Reach out to the CookEase team.</p>
      </div>

      <div className="contact-main">
        <div className="contact-info">
          <h2>Contact Information</h2>
          <p>Our team is here to help. Reach out through any of the channels below or fill out the form.</p>

          <div className="contact-cards">
            {contacts.map((c, i) => (
              <div className="contact-card" key={i}>
                <span className="contact-icon">{c.icon}</span>
                <div>
                  <span className="contact-label">{c.label}</span>
                  {c.href ? (
                    <a href={c.href} className="contact-value link">{c.value}</a>
                  ) : (
                    <span className="contact-value">{c.value}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="contact-note">
            <h3>🍳 Recipe Issues?</h3>
            <p>For recipe approvals, rejections, or content issues, please use the subject line "Recipe Report" so we can prioritize your message.</p>
          </div>
        </div>

        <div className="contact-form-wrapper">
          {submitted ? (
            <div className="contact-success">
              <span className="success-icon">✓</span>
              <h3>Message Sent!</h3>
              <p>Thanks for reaching out. We'll get back to you within 24 hours.</p>
              <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }} className="contact-reset">
                Send Another Message
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <h2>Send a Message</h2>
              <div className="contact-row">
                <div className="contact-field">
                  <label>Your Name</label>
                  <input type="text" placeholder="Juan dela Cruz" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="contact-field">
                  <label>Email Address</label>
                  <input type="email" placeholder="juan@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                </div>
              </div>
              <div className="contact-field">
                <label>Subject</label>
                <input type="text" placeholder="What's this about?" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required />
              </div>
              <div className="contact-field">
                <label>Message</label>
                <textarea placeholder="Tell us more..." rows="6" value={form.message} onChange={e => setForm({...form, message: e.target.value})} required />
              </div>
              <button type="submit" className="contact-submit">Send Message →</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContactUs;