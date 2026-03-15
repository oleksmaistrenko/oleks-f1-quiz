import React from "react";
import { Link } from "react-router-dom";

const Rules = () => {
  return (
    <div className="card">
      <h1 className="card-title">Race Briefing</h1>

      <div className="question-container">
        <div className="question-text text-red">
          Predict
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          After qualifying and before the race, a quiz goes live with Yes/No prediction questions about the upcoming race.
          Answer every question before the deadline — the countdown timer shows exactly how much time you have left.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red">
          Score
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          After the race, the admin evaluates each question.
          You earn <span className="text-gold font-bold">+1 point</span> for every correct prediction.
          Once scored, you can see how the community voted on each question.
        </p>
      </div>

      <div className="question-container">
        <div className="question-text text-red">
          Win
        </div>
        <p className="text-secondary" style={{ lineHeight: "1.7" }}>
          Points accumulate across every race of the season.
          The player with the most points at the end of the season wins the championship.
        </p>
      </div>

      <div className="question-container" style={{ borderLeft: "3px solid var(--wc-red)", paddingLeft: "16px", fontStyle: "italic" }}>
        <p className="text-secondary" style={{ lineHeight: "1.7", margin: 0 }}>
          <span className="text-red font-bold">"We are checking."</span> — The most iconic non-answer in F1 history.
          That's the spirit of this game: questions so awkward that even the pit wall has no data. You predict, you hope, you check after the race.
        </p>
      </div>

      <h2 className="card-title card-title-sm" style={{ margin: "32px 0 16px" }}>
        Good to Know
      </h2>

      <div className="flex flex-col gap-3">
        {[
          { title: "Edit anytime", desc: "Change your answers as many times as you want before the deadline." },
          { title: "Auto-submit", desc: "When the deadline hits, your current answers are submitted automatically." },
          { title: "Reminders", desc: "Set a reminder to get nudged 2 hours before the quiz closes." },
        ].map((tip) => (
          <div key={tip.title} className="tip-row">
            <span className="text-gold font-bold">{tip.title}</span>
            <span className="text-secondary text-sm">{tip.desc}</span>
          </div>
        ))}
      </div>

      <h2 className="card-title card-title-sm" style={{ margin: "32px 0 16px" }}>
        Driver Titles
      </h2>

      <p className="text-secondary text-sm" style={{ lineHeight: "1.7", marginBottom: "12px" }}>
        Your position in the championship standings earns you an F1-inspired title:
      </p>

      <div className="flex flex-col gap-3">
        {[
          { title: "Strategy Chief", rank: "1st place", className: "rank-title-1" },
          { title: "Pit Wall Genius", rank: "2nd place", className: "rank-title-2" },
          { title: "Smooth Operator", rank: "3rd place", className: "rank-title-3" },
          { title: "Points Finisher", rank: "Top 25%", className: "rank-title-default" },
          { title: "Backmarker", rank: "Last place", className: "rank-title-default" },
        ].map((item) => (
          <div key={item.title} className="tip-row">
            <span className={`rank-title ${item.className}`} style={{ marginRight: "8px" }}>{item.title}</span>
            <span className="text-secondary text-sm">{item.rank}</span>
          </div>
        ))}
      </div>

      <h2 className="card-title card-title-sm" style={{ margin: "32px 0 16px" }}>
        Tiebreaker Rules
      </h2>

      <p className="text-secondary text-sm" style={{ lineHeight: "1.7", marginBottom: "12px" }}>
        When two or more drivers have the same total points, the standings are decided by:
      </p>

      <div className="flex flex-col gap-3">
        {[
          { title: "1. Earlier advantage", desc: "The driver who was higher in the standings before the scores became equal gets priority." },
          { title: "2. Alphabetical order", desc: "If drivers have been tied throughout, names are sorted alphabetically." },
        ].map((tip) => (
          <div key={tip.title} className="tip-row">
            <span className="text-gold font-bold">{tip.title}</span>
            <span className="text-secondary text-sm">{tip.desc}</span>
          </div>
        ))}
      </div>

      <p className="text-secondary text-sm" style={{ lineHeight: "1.7", marginTop: "12px" }}>
        The <span className="font-bold">Points Finisher</span> title is awarded to the top 25% of drivers.
        If multiple drivers are tied at the cutoff, all of them receive the title.
      </p>

      <h2 className="card-title card-title-sm" style={{ margin: "32px 0 16px" }}>
        Elite Drivers
      </h2>

      <p className="text-secondary text-sm" style={{ lineHeight: "1.7", marginBottom: "12px" }}>
        Some drivers carry a <span style={{ color: "var(--wc-gold)", fontWeight: 700 }}>★</span> star next to their name in the rankings.
        This marks an <span className="font-bold">Elite Driver</span> — a long-term participant
        who's been with the league since the early days. It's a badge of honour, not based on score.
      </p>

      <h2 className="card-title card-title-sm" style={{ margin: "32px 0 16px" }}>
        Explore
      </h2>

      <div className="dashboard-stats">
        <Link to="/rankings">
          <div className="stat-card" style={{ cursor: "pointer" }}>
            <div className="stat-value stat-value-sm">Rankings</div>
            <div className="stat-label">Season standings</div>
          </div>
        </Link>
        <Link to="/dashboard">
          <div className="stat-card" style={{ cursor: "pointer" }}>
            <div className="stat-value stat-value-sm">Dashboard</div>
            <div className="stat-label">Your stats</div>
          </div>
        </Link>
        <Link to="/head-to-head">
          <div className="stat-card" style={{ cursor: "pointer" }}>
            <div className="stat-value stat-value-sm">H2H</div>
            <div className="stat-label">Compare with friends</div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Rules;
