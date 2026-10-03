import React from "react";
import "./landing.css";

const features = [
  {
    number: "01",
    title: "A plan with a pulse",
    text: "Choose a 60 or 90-day route with bite-sized sessions built around your current level.",
  },
  {
    number: "02",
    title: "Practice that adds up",
    text: "Writing, speaking, listening, and reading are woven into a steady weekly rhythm.",
  },
  {
    number: "03",
    title: "Feedback that moves you",
    text: "Share your work with a teacher and turn each note into your next improvement.",
  },
];

export default function LandingPage({ onNavigate }) {
  const goTo = (path) => {
    onNavigate(path);
  };

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <button className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <span>IELTS</span><strong>Pro</strong>
        </button>
        <nav aria-label="Main navigation">
          <a href="#approach">How it works</a>
          <a href="#routine">Your routine</a>
          <button className="landing-nav-login" onClick={() => goTo("/sign-in")}>Sign in</button>
        </nav>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow"><span className="landing-eyebrow-dot" /> A calmer way to prepare</p>
            <h1>Make your IELTS goal feel <em>closer.</em></h1>
            <p className="landing-lede">
              A thoughtful daily plan, steady practice, and feedback from a real teacher.
              One clear next step at a time.
            </p>
            <div className="landing-actions">
              <button className="landing-button landing-button-primary" onClick={() => goTo("/sign-up")}>
                Build my routine <span aria-hidden="true">↗</span>
              </button>
              <button className="landing-button landing-button-quiet" onClick={() => goTo("/sign-in")}>
                I already have an account
              </button>
            </div>
            <div className="landing-trust">
              <div className="landing-avatars" aria-hidden="true"><span>A</span><span>M</span><span>S</span></div>
              <span>Built for consistent, real progress</span>
            </div>
          </div>

          <div className="landing-plan-card" id="routine" aria-label="Example study plan">
            <div className="landing-card-topline">
              <span>YOUR STUDY MAP</span>
              <span className="landing-live-dot">● Live</span>
            </div>
            <div className="landing-week-heading">
              <div><p>Week 03 · Keep going</p><h2>Today&apos;s focus</h2></div>
              <strong>21 <small>/ 60</small></strong>
            </div>
            <div className="landing-progress"><span /></div>
            <div className="landing-focus">
              <div className="landing-focus-icon">W</div>
              <div><strong>Writing task 2</strong><p>Opinion essay · 35 min</p></div>
              <span className="landing-arrow">→</span>
            </div>
            <div className="landing-calendar" aria-label="Study week">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <div key={`${day}-${index}`} className={index === 4 ? "is-today" : index < 4 ? "is-done" : ""}>
                  <span>{day}</span><b>{17 + index}</b>{index < 4 && <i>✓</i>}
                </div>
              ))}
            </div>
            <p className="landing-card-note"><span>✦</span> A little every day is how confidence grows.</p>
          </div>
        </section>

        <section className="landing-intro" id="approach">
          <div>
            <p className="landing-eyebrow">Practice with purpose</p>
            <h2>Less wondering.<br /><em>More meaningful practice.</em></h2>
          </div>
          <p>
            IELTS preparation can feel like a thousand tabs open in your head. IELTSPro
            brings your plan, practice, and teacher feedback into one calm place.
          </p>
        </section>

        <section className="landing-features">
          {features.map((feature) => (
            <article key={feature.number}>
              <span>{feature.number} / 03</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </section>

        <section className="landing-cta">
          <p className="landing-eyebrow">Ready when you are</p>
          <h2>Your next step is smaller<br />than you think.</h2>
          <p>Start with a plan that fits your pace. We&apos;ll keep the path clear from day one.</p>
          <button className="landing-button landing-button-primary" onClick={() => goTo("/sign-up")}>
            Get started <span aria-hidden="true">↗</span>
          </button>
        </section>
      </main>

      <footer className="landing-footer">
        <span><b>IELTS</b>Pro</span>
        <p>IELTSPro · A steady plan for a stronger score.</p>
        <button onClick={() => goTo("/sign-in")}>Student sign in →</button>
      </footer>
    </div>
  );
}
