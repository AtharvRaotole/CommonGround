import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import "./demo.css";

const STEPS = ["Collect", "Shortlist", "Veto", "Replan", "Export"] as const;

const MEMBERS = [
  { name: "Alex", seeds: "ramen, indie film", need: "budget at most $$" },
  { name: "Sam", seeds: "jazz, natural wine", need: "late seating" },
  { name: "Jordan", seeds: "plant-forward, museums", need: "vegetarian evidence" },
  { name: "Riley", seeds: "skip profiling", need: "step-free still unknown" },
] as const;

const FIRST_SHORTLIST = [
  {
    title: "Synthetic Noodle Room",
    meta: "East Village · $$ · noodles",
    role: "Best compromise",
    fit: "Lowers the worst member rank on one common slate.",
    unknown: "Step-free access unverified",
  },
  {
    title: "Synthetic Brasserie",
    meta: "Tribeca · $$$ · brasserie",
    role: "Familiar fallback",
    fit: "Prior visit id present. Popularity alone never qualifies.",
    unknown: "Party of 7 may exceed reservation cap",
  },
  {
    title: "Synthetic Vegetarian Diner",
    meta: "East Village · $$ · vegetarian",
    role: "Mean-rank alternative",
    fit: "Shown when it differs from the worst-rank compromise.",
    unknown: "Walk-in likelihood unknown",
  },
] as const;

const REPLANNED = [
  {
    title: "Synthetic Vegetarian Diner",
    meta: "East Village · $$ · vegetarian",
    role: "Best compromise",
    fit: "Hard-vetoed venues never return. Fresh ordinal pass on the reduced slate.",
    unknown: "Walk-in likelihood unknown",
  },
  {
    title: "Synthetic Herb Counter",
    meta: "West Village · $$ · small plates",
    role: "Replacement",
    fit: "Still clears budget and late-seating tags.",
    unknown: "Noise level unverified",
  },
] as const;

const BEATS = [
  { at: 0, step: 0, veto: false },
  { at: 5000, step: 1, veto: false },
  { at: 10000, step: 2, veto: false },
  { at: 13000, step: 3, veto: true },
  { at: 17000, step: 4, veto: true },
] as const;

const REEL_MS = 22000;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function DemoPage() {
  const [step, setStep] = useState(0);
  const [vetoed, setVetoed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  const beatRef = useRef(-1);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const timer = window.setTimeout(() => {
      setStep(0);
      setVetoed(false);
      setProgress(0);
      beatRef.current = -1;
      setPlaying(true);
    }, 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!playing) return;
    beatRef.current = -1;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      setProgress(Math.min(1, elapsed / REEL_MS));
      let next = 0;
      for (let i = 0; i < BEATS.length; i += 1) {
        if (elapsed >= BEATS[i].at) next = i;
      }
      if (next !== beatRef.current) {
        beatRef.current = next;
        const beat = BEATS[next];
        setStep(beat.step);
        setVetoed(beat.veto);
      }
      if (elapsed < REEL_MS) {
        frame = requestAnimationFrame(tick);
      } else {
        setPlaying(false);
        setProgress(1);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  function stopReel() {
    setPlaying(false);
  }

  function playStory() {
    if (prefersReducedMotion()) return;
    setStep(0);
    setVetoed(false);
    setProgress(0);
    beatRef.current = -1;
    setPlaying(true);
  }

  function selectStep(index: number) {
    stopReel();
    setProgress(index / (STEPS.length - 1));
    if (index < 3) setVetoed(false);
    if (index >= 3) setVetoed(true);
    setStep(index);
  }

  const shortlist = vetoed && step >= 3 ? REPLANNED : FIRST_SHORTLIST;
  const handoff = vetoed ? REPLANNED[0].title : FIRST_SHORTLIST[0].title;

  return (
    <div className={`cg${playing ? " is-playing" : ""}`}>
      <header className="cg__nav">
        <Link className="cg__brand" to="/">
          <BrandMark className="cg__mark" />
          <span>Common Ground</span>
        </Link>
        <Link className="cg__nav-cta" to="/host/new">
          Plan an outing
        </Link>
      </header>

      <main className="cg__main">
        <div className="cg__hero">
        <section className="cg__intro">
          <h1>Agree on the place.</h1>
          <p className="cg__lede">
            Private tastes. One shortlist. The host never sees who objected or why.
          </p>
          <div className="cg__actions">
            <Link className="cg-btn cg-btn--fill" to="/host/new">
              Start for free
            </Link>
            {reduced ? (
              <p className="cg__motion-note">Reduced motion is on. Scrub the story in the film.</p>
            ) : (
              <button
                type="button"
                className="cg-btn"
                onClick={playStory}
                disabled={playing}
                aria-pressed={playing}
              >
                {playing ? "Playing story" : "Watch the story"}
              </button>
            )}
          </div>
          <p className="cg__meta">
            Demo data only. Not a live recommendation. Plan a real outing for the live path.
          </p>
        </section>

        <section className="cg__film" aria-label="Product story film">
          <div className="film">
            <div className="film__bar">
              <span className="film__label">{STEPS[step]}</span>
              <span className="film__clock">{Math.round(progress * 22)}s</span>
            </div>

            <div
              className="film__screen"
              key={`${step}-${vetoed ? "v" : "a"}`}
              aria-live="polite"
            >
              {step === 0 ? (
                <div className="frame">
                  <h2>Private place settings</h2>
                  <p>Hosts see completion counts. Seeds stay with the member session.</p>
                  <ul className="frame__people">
                    {MEMBERS.map((member, index) => (
                      <li key={member.name} style={{ animationDelay: `${index * 70}ms` }}>
                        <strong>{member.name}</strong>
                        <span>{member.seeds}</span>
                        <em>{member.need}</em>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {step === 1 || step === 2 || step === 3 ? (
                <div className="frame">
                  <h2>{step === 3 ? "After the objection" : "Three options"}</h2>
                  <p>Hard requirements before taste. Unknown never counts as passed.</p>
                  <ol className="frame__venues">
                    {shortlist.map((option, index) => (
                      <li
                        key={option.title}
                        className={
                          playing && step === 2 && index === 0 ? "is-leaving" : undefined
                        }
                        style={{ animationDelay: `${index * 70}ms` }}
                      >
                        <span className="frame__role">{option.role}</span>
                        <strong>{option.title}</strong>
                        <span className="frame__meta">{option.meta}</span>
                        <span>{option.fit}</span>
                        <span className="frame__unknown">Unknown: {option.unknown}</span>
                        {step === 2 && index === 0 ? (
                          <button
                            type="button"
                            className="cg-btn cg-btn--ink"
                            onClick={() => {
                              stopReel();
                              setVetoed(true);
                              setStep(3);
                              setProgress(3 / (STEPS.length - 1));
                            }}
                          >
                            Private veto
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                  {step === 3 && vetoed ? (
                    <p className="frame__status" role="status">
                      Veto recorded. Prior approval cleared. Replan on the reduced slate.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {step === 4 ? (
                <div className="frame frame--handoff">
                  <h2>Tentative handoff</h2>
                  <p className="frame__venue">{handoff}</p>
                  <p>
                    Approving confirms the plan inside Common Ground. It does not reserve a
                    table, charge a card, or message the venue.
                  </p>
                  <p className="frame__unknown">
                    Unknown: required access facts may still block a ready label.
                  </p>
                  <div className="frame__cta">
                    <Link className="cg-btn cg-btn--fill" to="/host/new">
                      Plan a real outing
                    </Link>
                    <Link className="cg-btn" to="/example">
                      Static shortlist
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="film__progress" aria-hidden="true">
              <span style={{ transform: `scaleX(${Math.max(progress, step / (STEPS.length - 1))})` }} />
            </div>

            <div className="film__controls">
              {!reduced ? (
                <button
                  type="button"
                  className="film__play"
                  onClick={playing ? stopReel : playStory}
                  aria-label={playing ? "Pause story" : "Play story"}
                >
                  {playing ? "Pause" : "Play"}
                </button>
              ) : null}
              <ol className="film__steps" aria-label="Story beats">
                {STEPS.map((label, index) => (
                  <li key={label}>
                    <button
                      type="button"
                      className={
                        index === step ? "is-active" : index < step ? "is-done" : undefined
                      }
                      onClick={() => selectStep(index)}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
        </div>

        <section className="cg__facts" aria-label="Product facts">
          <p>
            <strong>Private by default.</strong> Seeds and veto reasons never reach the host
            as a named reveal.
          </p>
          <p>
            <strong>Unknown stays unknown.</strong> Missing access or budget evidence blocks a
            ready label.
          </p>
          <p>
            <strong>Export is not a booking.</strong> The handoff keeps reservation work with
            the host.
          </p>
        </section>
      </main>
    </div>
  );
}
