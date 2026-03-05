import { Link } from "react-router-dom";
import "../styles/AboutUs.css";

function AboutUs() {
  const team = [
    { name: "Lemon Juice", role: "Lead Developer", avatar: "L", bio: "Passionate about food and code. Built CookEase to bring recipes to everyone." },
    { name: "Gwy Ocampo", role: "UI/UX Designer", avatar: "G", bio: "Designs experiences that feel as good as a home-cooked meal." },
    { name: "CookEase Team", role: "Community Managers", avatar: "C", bio: "Keeping the community warm, helpful, and delicious." },
  ];

  const stats = [
    { value: "500+", label: "Recipes Shared" },
    { value: "1,000+", label: "Community Members" },
    { value: "50+", label: "Cuisines Covered" },
    { value: "2026", label: "Founded" },
  ];

  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="about-hero-content">
          <span className="about-tag">Our Story</span>
          <h1>Cooking Made <span className="about-accent">Easy</span> for Everyone</h1>
          <p>CookEase is a community-driven recipe platform where home cooks, food enthusiasts, and culinary explorers come together to share, discover, and celebrate food.</p>
          <Link to="/signup" className="about-cta">Join the Community</Link>
        </div>
      </div>

      <div className="about-stats">
        {stats.map((s, i) => (
          <div className="about-stat-card" key={i}>
            <span className="about-stat-value">{s.value}</span>
            <span className="about-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="about-mission">
        <div className="about-mission-content">
          <h2>Our Mission</h2>
          <p>We believe every recipe tells a story — of culture, family, and love. CookEase was built to make those stories accessible to everyone, from first-time cooks to seasoned chefs. We're not just a recipe site; we're a place where food brings people together.</p>
        </div>
        <div className="about-mission-values">
          {[
            { icon: "🍳", title: "Accessibility", desc: "Recipes for every skill level, diet, and cuisine." },
            { icon: "🤝", title: "Community", desc: "Built by home cooks, for home cooks." },
            { icon: "✨", title: "Quality", desc: "Every recipe is reviewed before it goes live." },
            { icon: "🌍", title: "Diversity", desc: "Celebrating cuisines from every corner of the world." },
          ].map((v, i) => (
            <div className="about-value-card" key={i}>
              <span className="about-value-icon">{v.icon}</span>
              <h3>{v.title}</h3>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="about-team">
        <h2>Meet the Team</h2>
        <div className="about-team-grid">
          {team.map((member, i) => (
            <div className="about-team-card" key={i}>
              <div className="about-team-avatar">{member.avatar}</div>
              <h3>{member.name}</h3>
              <span className="about-team-role">{member.role}</span>
              <p>{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AboutUs;