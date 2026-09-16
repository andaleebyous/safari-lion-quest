import { useEffect, useMemo, useState } from "react";
import GameCanvas from "@/components/GameCanvas";
import type { GameHandle, GameStats, Puzzle } from "@/game/scene";

const INTRO_VIDEO = "/manus-storage/intro_22c29918.mp4";
const GAMEPLAY_REFERENCE = "/manus-storage/reference-gameplay_c393fc12.png";

type Screen = "intro" | "game" | "done";

const initialStats: GameStats = { score: 0, coins: 0, distance: 0, level: 1, tokens: 0 };

export default function App() {
  const demo = useMemo(() => new URLSearchParams(window.location.search).has("demo"), []);
  const [screen, setScreen] = useState<Screen>(demo ? "game" : "intro");
  const [stats, setStats] = useState<GameStats>(initialStats);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [handle, setHandle] = useState<GameHandle | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; tone: "good" | "warn" } | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 2800);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const beginGame = () => {
    setStats(initialStats);
    setPuzzle(null);
    setFeedback(null);
    setScreen("game");
  };

  const chooseAnswer = (index: number) => {
    if (!puzzle || !handle) return;
    handle.resolvePuzzle(index === puzzle.correct);
    if (index === puzzle.correct) setPuzzle(null);
  };

  if (screen === "intro") {
    return (
      <main className="intro-screen" dir="rtl">
        <video className="intro-video" src={INTRO_VIDEO} poster={GAMEPLAY_REFERENCE} autoPlay muted loop playsInline />
        <div className="intro-vignette" />
        <div className="intro-topbar">
          <div className="brand-lockup"><span className="brand-mark">BM</span><span>SAFARI<br /><b>QUEST</b></span></div>
          <div className="intro-meta"><span>تجربة ثلاثية الأبعاد</span><span className="meta-dot" /><span>3 مستويات</span></div>
        </div>
        <section className="intro-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> رحلة البرية تبدأ الآن</div>
          <h1>المطاردة<br /><em>البرية</em></h1>
          <p>اركض بين الأقفاص، اجمع العملات، وافتح أسرار الحديقة قبل أن تغلق البوابات.</p>
          <button className="primary-button" onClick={beginGame}><span>ابدأ المطاردة</span><b>←</b></button>
          <div className="intro-footnote"><span className="pulse-dot" /> استخدم الأسهم أو WASD للتحكم بالأسد</div>
        </section>
        <div className="intro-corner">01 <span>/</span> 03</div>
      </main>
    );
  }

  if (screen === "done") {
    return (
      <main className="done-screen" dir="rtl" style={{ backgroundImage: `url(${GAMEPLAY_REFERENCE})` }}>
        <div className="done-card">
          <span className="done-kicker">مهمة مكتملة</span>
          <h1>الحديقة لك.</h1>
          <p>أثبتَّ أن السرعة والذكاء يصنعان قائد البرية.</p>
          <div className="result-grid"><div><b>{stats.score}</b><small>النقاط</small></div><div><b>{stats.coins}</b><small>العملات</small></div><div><b>{stats.tokens}</b><small>الرموز</small></div></div>
          <button className="primary-button wide" onClick={beginGame}><span>إعادة المطاردة</span><b>↻</b></button>
        </div>
      </main>
    );
  }

  return (
    <main className="game-shell" dir="rtl">
      <GameCanvas onReady={setHandle} onStats={setStats} onPuzzle={setPuzzle} onFeedback={(message, tone) => setFeedback({ message, tone })} onFinish={() => setScreen("done")} />
      <div className="game-shade" />
      <header className="hud-top">
        <div className="quest-card"><div className="quest-icon">♛</div><div><span>THE WILD RUN</span><strong>المطاردة البرية</strong><i><b style={{ width: `${Math.min(100, stats.distance)}%` }} /></i></div></div>
        <div className="hud-stats"><div><small>النقاط</small><b>{stats.score.toLocaleString("en-US")}</b></div><div className="divider" /><div><small>العملات</small><b className="gold-text">◉ {stats.coins}</b></div></div>
      </header>
      <div className="level-ribbon"><span>LEVEL {stats.level}</span><b>{stats.level === 1 ? "الانطلاقة" : stats.level === 2 ? "نبض القطيع" : "قلب العرين"}</b></div>
      {feedback && <div className={`feedback-toast ${feedback.tone}`}><span>{feedback.tone === "good" ? "✦" : "!"}</span>{feedback.message}</div>}
      <div className="distance-pill"><span className="pulse-dot" /> المسافة <b>{stats.distance}م</b></div>
      <div className="mobile-controls"><button onPointerDown={() => handle?.steer(-1)} aria-label="تحرك يسارًا">←</button><button onPointerDown={() => handle?.steer(1)} aria-label="تحرك يمينًا">→</button></div>
      <div className="control-hint"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>أو الأسهم للتحرك</span></div>

      {puzzle && (
        <div className="puzzle-backdrop">
          <section className="puzzle-card" role="dialog" aria-modal="true" aria-label={puzzle.title}>
            <div className="puzzle-head"><div><span className="puzzle-kicker">{puzzle.enclosure}</span><h2>{puzzle.title}</h2></div><span className={`difficulty d${puzzle.id}`}>{puzzle.difficulty}</span></div>
            <div className="puzzle-separator" />
            <p className="puzzle-question">{puzzle.question}</p>
            <div className="answer-list">{puzzle.options.map((option, index) => <button key={option} onClick={() => chooseAnswer(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
            <div className="reward-line"><span>مكافأة الحل</span><b>+{puzzle.reward} نقطة</b><i>◉ +{Math.ceil(puzzle.reward / 40)}</i></div>
          </section>
        </div>
      )}
    </main>
  );
}
