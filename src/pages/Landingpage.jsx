import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRoles } from "../contexts/RoleContext";
import "../styles/LandingPage.css";

function LandingPage() {
  const { user } = useRoles();
  const navigate = useNavigate();
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll(".reveal").forEach((el) => {
      observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="landing">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="hero-bg-circles" aria-hidden="true">
          <span className="circle c1" />
          <span className="circle c2" />
          <span className="circle c3" />
        </div>
        <div className="hero-food-icons" aria-hidden="true">
          <span className="food-float f1">🍳</span>
          <span className="food-float f2">🌿</span>
          <span className="food-float f3">🍋</span>
          <span className="food-float f4">🫙</span>
          <span className="food-float f5">🧄</span>
          <span className="food-float f6">🫐</span>
        </div>
        <div className="hero-inner">
          <p className="hero-eyebrow">A community cookbook</p>
          <h1 className="hero-title">
            Cook with <em>heart.</em><br />Share with <em>soul.</em>
          </h1>
          <p className="hero-sub">
            CookEase is where home cooks discover, create, and share
            recipes they actually love — no fluff, just food.
          </p>
          <div className="hero-cta">
            {user ? (
              <>
                <button className="btn-primary" onClick={() => navigate("/")}>Browse Recipes</button>
                <button className="btn-ghost" onClick={() => navigate("/add-recipe")}>+ Add Your Recipe</button>
              </>
            ) : (
              <>
                <Link to="/signup" className="btn-get-started">🚀 Get Started — It's Free</Link>
                <Link to="/login" className="btn-ghost">Sign In</Link>
              </>
            )}
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-num">100%</span>
              <span className="stat-label">Community Made</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">Filipino</span>
              <span className="stat-label">& World Cuisine</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">Free</span>
              <span className="stat-label">Always & Forever</span>
            </div>
          </div>
        </div>
        <div className="hero-scroll-hint">
          <span>scroll down</span>
          <span className="scroll-arrow">↓</span>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="landing-how">
        <div className="section-inner">
          <div className="section-label reveal">How It Works</div>
          <h2 className="section-title reveal">From kitchen to community<br />in three simple steps</h2>

          <div className="steps">
            <div className="step reveal">
              <div className="step-num">01</div>
              <div className="step-icon">🔍</div>
              <h3>Discover</h3>
              <p>Browse hundreds of community recipes. Filter by cuisine, category, or difficulty. Find exactly what you're craving.</p>
              <div className="step-line" />
            </div>
            <div className="step reveal">
              <div className="step-num">02</div>
              <div className="step-icon">✍️</div>
              <h3>Create</h3>
              <p>Got a dish you love? Share it. Add ingredients, steps, photos, and let the community discover your kitchen magic.</p>
              <div className="step-line" />
            </div>
            <div className="step reveal">
              <div className="step-num">03</div>
              <div className="step-icon">🤝</div>
              <h3>Connect</h3>
              <p>Rate recipes, get feedback, and be part of a growing community of people who take food seriously.</p>
            </div>
          </div>

          {/* Get Started nudge after steps */}
          {!user && (
            <div className="how-cta reveal">
              <Link to="/signup" className="btn-get-started">🚀 Get Started — It's Free</Link>
            </div>
          )}
        </div>
      </section>

      {/* ── ABOUT ────────────────────────────────────────────────────── */}
      <section className="landing-about">
        <div className="about-blob" aria-hidden="true" />
        <div className="section-inner about-inner">
          <div className="about-text">
            <div className="section-label reveal">About CookEase</div>
            <h2 className="section-title reveal">Built for cooks,<br />not content creators</h2>
            <p className="about-body reveal">
              We started CookEase because we were tired of recipe sites that bury the actual recipe under mountains of story, ads, and noise. You just want to cook.
            </p>
            <p className="about-body reveal">
              CookEase is a clean, community-first recipe platform — especially built for Filipino home cooks and food lovers across all cuisines. Every recipe is submitted, reviewed, and loved by real people.
            </p>
            <div className="about-values reveal">
              <div className="value">
                <span className="value-icon">🏡</span>
                <div>
                  <strong>Home-first</strong>
                  <p>Recipes tested in real kitchens, not professional ones.</p>
                </div>
              </div>
              <div className="value">
                <span className="value-icon">🛡️</span>
                <div>
                  <strong>Moderated quality</strong>
                  <p>Every submission is reviewed before it goes live.</p>
                </div>
              </div>
              <div className="value">
                <span className="value-icon">🌍</span>
                <div>
                  <strong>All cuisines welcome</strong>
                  <p>From adobo to ramen — every culture has a seat at the table.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="about-visual reveal">
            <div className="about-card ac1">
              <span>🍜</span>
              <p>Sinigang na Baboy</p>
              <span className="ac-tag">Filipino</span>
            </div>
            <div className="about-card ac2">
              <span>🍱</span>
              <p>Chicken Teriyaki Bowl</p>
              <span className="ac-tag">Japanese</span>
            </div>
            <div className="about-card ac3">
              <span>🫕</span>
              <p>Kare-Kare</p>
              <span className="ac-tag">Filipino</span>
            </div>
            <div className="about-card ac4">
              <span>🍝</span>
              <p>Aglio e Olio</p>
              <span className="ac-tag">Italian</span>
            </div>
            <div className="about-card-center">
              <span className="big-emoji">🍽️</span>
              <p>Your recipe<br />could be here</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="landing-final-cta">
        <div className="final-cta-inner reveal">
          <span className="final-emoji">🥘</span>
          <h2>Ready to start cooking?</h2>
          <p>Join the CookEase community — it's free, always.</p>
          <div className="final-cta-btns">
            {user ? (
              <button className="btn-primary large" onClick={() => navigate("/home")}>Go to Recipes</button>
            ) : (
              <>
                <Link to="/signup" className="btn-get-started large">🚀 Get Started — It's Free</Link>
                <Link to="/home" className="btn-ghost large">Browse First</Link>
              </>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}

export default LandingPage;