import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const publicPath = (path) => `${import.meta.env.BASE_URL}${path}`;
const asset = (path) => publicPath(`generated-website-images/${path}`);

const sections = [
  {
    id: 'annotate-text',
    title: 'Annotate Text',
    kicker: 'Read · Mark · Understand',
    number: '01',
    href: '#annotate-text',
    cardImage: asset('cards/01-annotated-manuscript-card.png'),
    backgroundImage: asset('backgrounds/01-annotated-manuscript-background.png'),
    tone: '#b88947',
    text: 'Highlight, mark, and take notes of any Latin text.',
    links: [
      {
        label: 'Click Here',
        href: 'https://latin-text-annotator-253895394361.us-west1.run.app/',
      },
    ],
  },
  {
    id: 'practice',
    title: 'Practice',
    kicker: 'Forms · Drills · Fluency',
    number: '09',
    href: '#practice',
    cardImage: asset('cards/09-wax-tablet-sundial-card.png'),
    backgroundImage: asset('backgrounds/09-wax-tablet-sundial-background.png'),
    tone: '#a1763a',
    text:
      'Practice endings, forms, and recognition with games built for Latin students.',
    links: [
      {
        label: 'Frog Game',
        href: publicPath('assets/linked-pages/frog-game.html'),
      },
      {
        label: 'Declension Chart',
        href: publicPath('assets/linked-pages/declension-architect.html'),
      },
      {
        label: 'Declension Racer',
        href: publicPath('assets/linked-pages/declension-chart-game.html'),
      },
      {
        label: 'Verb ID',
        href: publicPath('assets/linked-pages/verb-id-hard-mode.html'),
      },
      {
        label: 'Case ID',
        href: publicPath('assets/linked-pages/noun-id-game.html'),
      },
    ],
  },
  {
    id: 'cornology',
    title: 'Cornology',
    kicker: 'Timeline · Rome · Curiosities',
    number: '03',
    href: '#cornology',
    cardImage: asset('cards/03-roman-map-compass-card.png'),
    backgroundImage: asset('backgrounds/03-roman-map-compass-background.png'),
    tone: '#b07934',
    text: "Explore the mysteries of the universe. Learn its secrets.",
    links: [
      {
        label: 'Game of Life',
        href: publicPath('assets/linked-pages/conways-game-of-life.html'),
      },
      {
        label: 'Double Pendulum',
        href: publicPath('assets/linked-pages/double-pendulum.html'),
      },
      {
        label: 'Plinko',
        href: publicPath('assets/linked-pages/plinko.html'),
      },
      {
        label: 'Stoicism',
        href: 'https://qualisartifex1.github.io/Stoicism/',
      },
    ],
  },
  {
    id: 'ap-reading',
    title: 'AP Reading',
    kicker: 'Vergil · Caesar · Commentary',
    number: '11',
    href: '#ap-reading',
    cardImage: asset('cards/11-courtyard-amphora-mask-card.png'),
    backgroundImage: asset('backgrounds/11-courtyard-amphora-mask-background.png'),
    tone: '#9d7a45',
    text:
      'Enter the AP reading room for passages, notes, vocabulary, and guided commentary built to support precise, confident interpretation.',
    links: [
      {
        label: 'Commentary',
        href: publicPath('assets/linked-pages/pliny-with-commentary.pdf'),
      },
      {
        label: 'Word List',
        href: publicPath('assets/linked-pages/ap-vocabulary-papyrus-tabs.html'),
      },
    ],
  },
  {
    id: 'textbook',
    title: 'Textbook',
    kicker: 'Reference · Lessons · Resources',
    number: '10',
    href: '#textbook',
    cardImage: asset('cards/10-blue-stone-laurel-books-card.png'),
    backgroundImage: asset('backgrounds/10-blue-stone-laurel-books-background.png'),
    tone: '#52737a',
    text: 'Delve into the secrets of the Latin language. Bring history to life!',
    links: [
      {
        label: 'Chapters',
        href: 'https://drive.google.com/drive/folders/0B-Qj28gpl1H3LThZUTFWYmxTY1k?resourcekey=0--JTE4jyPoxoDUcG5geMPrw',
      },
      {
        label: 'Flashcards',
        href: publicPath('assets/linked-pages/latin-flash-cards.html'),
      },
    ],
  },
  {
    id: 'quiz-bowl',
    title: 'Quiz Bowl',
    kicker: 'Recall · Speed · Team',
    number: '06',
    href: '#quiz-bowl',
    cardImage: asset('cards/06-green-laurel-trophy-card.png'),
    backgroundImage: asset('backgrounds/06-green-laurel-trophy-background.png'),
    tone: '#2e5f5a',
    text: 'Take notes and keep score. This is your place to get better at quiz bowl.',
    links: [
      {
        label: 'Tournament Scoring',
        href: 'https://qualisartifex1.github.io/NAQT/',
      },
      {
        label: 'Practice Scoring',
        href: 'https://qualisartifex1.github.io/QBPractice/',
      },
      {
        label: 'Practice Notes',
        href: 'https://qualisartifex1.github.io/QBStudy/',
      },
    ],
  },
  {
    id: 'flash-cards',
    title: 'Flash Cards',
    kicker: 'Vocab · Review · Memory',
    number: '07',
    href: '#flash-cards',
    cardImage: asset('cards/07-ribbon-flashcards-card.png'),
    backgroundImage: asset('backgrounds/07-ribbon-flashcards-background.png'),
    tone: '#ad7c48',
    text: 'Use this app to study sets of words. Import the words from anywhere?',
    links: [
      {
        label: 'Click Here',
        href: 'https://qualisartifex1.github.io/FlashCardsAllSubjects/',
      },
    ],
  },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getCircularOffset(index, activeIndex, total) {
  let offset = index - activeIndex;
  if (offset > total / 2) offset -= total;
  if (offset < -total / 2) offset += total;
  return offset;
}

function ArrowIcon({ direction }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d={direction === 'left' ? 'M15 5 8 12l7 7' : 'm9 5 7 7-7 7'}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}

function Card({ item, index, active, onSelect }) {
  const offset = getCircularOffset(index, active, sections.length);
  const abs = Math.abs(offset);
  const spread = window.innerWidth < 760 ? 86 : 142;
  const x = offset * spread;
  const y = abs * 20 + (abs > 1 ? 18 : 0);
  const z = 190 - abs * 120;
  const rotateY = offset * -15;
  const rotateZ = offset * 7;
  const scale = Math.max(0.68, 1 - abs * 0.12);

  return (
    <button
      className="library-card"
      type="button"
      aria-label={`${item.title}. ${index === active ? 'Open section' : 'Bring card forward'}`}
      aria-current={index === active}
      onClick={() => onSelect(index)}
      style={{
        '--card-image': `url(${item.cardImage})`,
        '--tone': item.tone,
        opacity: abs > 3 ? 0 : 1,
        zIndex: 30 - abs,
        filter: `brightness(${index === active ? 1.04 : 0.72}) saturate(${index === active ? 1.03 : 0.86})`,
        transform: `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
      }}
    >
      <span className="card-shine" />
      <span className="card-copy">
        <strong>{item.title}</strong>
      </span>
    </button>
  );
}

function App() {
  const [active, setActive] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const activeItem = sections[active];

  const backdropStyle = useMemo(
    () => ({
      '--detail-image': `url(${activeItem.backgroundImage})`,
      '--active-tone': activeItem.tone,
    }),
    [activeItem],
  );

  const move = (delta) => {
    if (detailOpen) return;
    setActive((current) => (current + delta + sections.length) % sections.length);
  };

  const chooseCard = (index) => {
    if (index !== active) {
      setActive(index);
      return;
    }
    setDetailOpen(true);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setDetailOpen(false);
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'ArrowRight') move(1);
      if (event.key === 'Enter' && !detailOpen) setDetailOpen(true);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, detailOpen]);

  useEffect(() => {
    const onPointerMove = (event) => {
      if (detailOpen) return;
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      setTilt({
        x: clamp(x * 7, -5, 5),
        y: clamp(y * -5, -4, 4),
      });
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [detailOpen]);

  return (
    <main className={detailOpen ? 'app is-detail' : 'app'} style={backdropStyle}>
      <div className="home-backdrop" aria-hidden="true" />
      <div className="detail-backdrop" aria-hidden="true" />

      <section className="intro" aria-hidden={detailOpen}>
        <h1>Qualis Artifex</h1>
      </section>

      <button className="nav-arrow left" type="button" aria-label="Previous card" onClick={() => move(-1)}>
        <ArrowIcon direction="left" />
      </button>
      <button className="nav-arrow right" type="button" aria-label="Next card" onClick={() => move(1)}>
        <ArrowIcon direction="right" />
      </button>

      <section className="carousel-shell" aria-label="Library card carousel">
        <div
          className="carousel"
          style={{
            transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          }}
        >
          {sections.map((item, index) => (
            <Card item={item} index={index} active={active} onSelect={chooseCard} key={item.id} />
          ))}
        </div>
      </section>

      <div className="progress-rail" aria-label="Card position">
        {sections.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={index === active ? 'active' : ''}
            aria-label={`Show ${item.title}`}
            onClick={() => {
              setActive(index);
              setDetailOpen(false);
            }}
          />
        ))}
      </div>

      <section className="detail" aria-label={`${activeItem.title} details`} aria-hidden={!detailOpen}>
        <div className="detail-panel">
          <h2>{activeItem.title}</h2>
          <span className="detail-rule" />
          <p className="detail-text">{activeItem.text}</p>
          <div className="detail-actions">
            {activeItem.links.map((link) => (
              <a className="primary-action" href={link.href} key={link.href}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <button className="back-button" type="button" onClick={() => setDetailOpen(false)}>
        Back to Cards
      </button>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
