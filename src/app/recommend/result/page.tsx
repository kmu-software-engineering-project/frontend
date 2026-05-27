'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

/* ─────────────────── types ─────────────────── */

interface RecommendedBook {
  id: string;
  title: string;
  author: string;
  publisher?: string;
  genre?: string;
  rating?: number;
  thumbnailUrl?: string;
  coverImage?: string;
  thumbnail?: string;
  description?: string;
  publishedYear?: number;
  tags?: string[];
  categories?: string[];
  reason?: string;
}

/* ─────────────────── constants ─────────────────── */

const STORE_URLS = {
  yes24:  (t: string) => `https://www.yes24.com/Product/Search?query=${encodeURIComponent(t)}`,
  aladin: (t: string) => `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchWord=${encodeURIComponent(t)}`,
  kyobo:  (t: string) => `https://product.kyobobook.co.kr/search?query=${encodeURIComponent(t)}`,
};

// Cycling messages shown during AI loading
const LOADING_MSGS = [
  'AI가 취향을 분석하고 있어요...',
  '도서 데이터베이스를 탐색하는 중...',
  '딱 맞는 책을 선별하고 있어요...',
  '추천 이유를 정리하는 중...',
  '거의 다 됐어요!',
];

// Gradient palettes for cover fallbacks (cycles by book index)
const COVER_GRADIENTS = [
  ['#6366f1', '#8b5cf6'],
  ['#3b82f6', '#6366f1'],
  ['#8b5cf6', '#ec4899'],
  ['#0ea5e9', '#6366f1'],
  ['#10b981', '#0ea5e9'],
  ['#f59e0b', '#ef4444'],
];

/* ─────────────────── loading screen ─────────────────── */

function LoadingScreen() {
  const [msgIndex,     setMsgIndex]     = useState(0);
  const [fakeProgress, setFakeProgress] = useState(0);
  const [msgVisible,   setMsgVisible]   = useState(true);

  // Advance fake progress bar — fast early, slows near 88%
  useEffect(() => {
    const iv = setInterval(() => {
      setFakeProgress(p => {
        if (p >= 88) return p;
        const step = p < 35 ? 9 : p < 60 ? 5 : p < 78 ? 2.5 : 0.8;
        return Math.min(88, p + step);
      });
    }, 350);
    return () => clearInterval(iv);
  }, []);

  // Cycle through messages with a fade-out/in
  useEffect(() => {
    const iv = setInterval(() => {
      setMsgVisible(false);
      setTimeout(() => {
        setMsgIndex(i => (i + 1) % LOADING_MSGS.length);
        setMsgVisible(true);
      }, 400);
    }, 2600);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="ls-root">
      <style dangerouslySetInnerHTML={{ __html: `
        /* ── Loading screen root ── */
        .ls-root {
          min-height: 100vh;
          background: #f8f7ff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
          position: relative;
          overflow: hidden;
          padding: 2rem;
        }
        .ls-root::before {
          content: '';
          position: fixed;
          width: 560px; height: 560px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%);
          top: -180px; left: -160px;
          pointer-events: none;
        }
        .ls-root::after {
          content: '';
          position: fixed;
          width: 440px; height: 440px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%);
          bottom: -100px; right: -120px;
          pointer-events: none;
        }

        /* ── Book icon ── */
        .ls-icon-wrap {
          position: relative;
          margin-bottom: 2.5rem;
        }
        .ls-icon-ring {
          width: 96px; height: 96px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12));
          border: 1.5px solid rgba(99,102,241,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: ls-float 2.8s ease-in-out infinite;
        }
        .ls-icon {
          font-size: 2.6rem;
          line-height: 1;
        }
        /* Orbiting dot */
        .ls-orbit {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 2px dashed rgba(99,102,241,0.2);
          animation: ls-spin 6s linear infinite;
        }
        .ls-orbit-dot {
          position: absolute;
          top: -4px; left: 50%;
          transform: translateX(-50%);
          width: 8px; height: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          box-shadow: 0 0 6px rgba(99,102,241,0.5);
        }

        @keyframes ls-float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes ls-spin {
          to { transform: rotate(360deg); }
        }

        /* ── Message ── */
        .ls-msg-wrap {
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
          overflow: hidden;
        }
        .ls-msg {
          font-size: 1rem;
          font-weight: 600;
          color: #4338ca;
          letter-spacing: -0.01em;
          text-align: center;
          transition: opacity 0.38s ease, transform 0.38s ease;
        }
        .ls-msg.hidden {
          opacity: 0;
          transform: translateY(8px);
        }
        .ls-msg.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Progress bar ── */
        .ls-progress-wrap {
          width: 100%;
          max-width: 320px;
          margin-bottom: 0.75rem;
        }
        .ls-progress-track {
          height: 5px;
          background: #ede9fe;
          border-radius: 999px;
          overflow: hidden;
        }
        .ls-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          border-radius: 999px;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ls-progress-label {
          text-align: right;
          font-size: 0.7rem;
          font-weight: 600;
          color: #a5b4fc;
          margin-top: 0.35rem;
          letter-spacing: 0.05em;
        }

        /* ── Sub-text ── */
        .ls-sub {
          font-size: 0.8rem;
          color: #b0b7c3;
          margin-top: 0.5rem;
          text-align: center;
        }
      `}} />

      {/* Animated book */}
      <div className="ls-icon-wrap">
        <div className="ls-icon-ring">
          <span className="ls-icon">📚</span>
        </div>
        <div className="ls-orbit">
          <div className="ls-orbit-dot" />
        </div>
      </div>

      {/* Cycling message */}
      <div className="ls-msg-wrap">
        <p className={`ls-msg ${msgVisible ? 'visible' : 'hidden'}`}>
          {LOADING_MSGS[msgIndex]}
        </p>
      </div>

      {/* Fake progress bar */}
      <div className="ls-progress-wrap">
        <div className="ls-progress-track">
          <div className="ls-progress-fill" style={{ width: `${fakeProgress}%` }} />
        </div>
        <div className="ls-progress-label">{Math.round(fakeProgress)}%</div>
      </div>

      <p className="ls-sub">AI가 책을 고르는 중이에요. 잠깐만 기다려 주세요.</p>
    </div>
  );
}

/* ─────────────────── result page ─────────────────── */

function ResultContent() {
  const searchParams = useSearchParams();

  const [results,   setResults]   = useState<RecommendedBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError,   setIsError]   = useState(false);

  const bookType      = searchParams.get('bookType')      || '';
  const genre         = searchParams.get('genre')         || '';
  const interest      = searchParams.get('interest')      || '';
  const purpose       = searchParams.get('purpose')       || '';
  const atmosphere    = searchParams.get('atmosphere')    || '';
  const difficulty    = searchParams.get('difficulty')    || '';
  const pastBooks     = searchParams.get('pastBooks')     || '';
  const avoidElements = searchParams.get('avoidElements') || '';

  const criteria = [
    { label: '유형',    value: bookType },
    { label: '장르',    value: genre },
    { label: '관심분야', value: interest },
    { label: '목적',    value: purpose },
    { label: '분위기',  value: atmosphere },
    { label: '난이도',  value: difficulty },
    { label: '참고도서', value: pastBooks },
    { label: '제외요소', value: avoidElements },
  ].filter(c => c.value.trim());

  const queryTerms = criteria.map(c => c.value.trim());

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch('/api/recommend', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            bookType, genre, interest, purpose,
            atmosphere, difficulty, pastBooks, avoidElements,
          }),
        });
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setIsError(true);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetch_();
  }, [bookType, genre, interest, purpose, atmosphere, difficulty, pastBooks, avoidElements]);

  /* ── Loading ── */
  if (isLoading) return <LoadingScreen />;

  /* ── Global styles (only rendered once loading is done) ── */
  const styles = `
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .rr-root {
      min-height: 100vh;
      background: #f8f7ff;
      position: relative;
      overflow-x: hidden;
    }
    .rr-root::before {
      content: '';
      position: fixed;
      width: 560px; height: 560px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%);
      top: -180px; left: -160px;
      pointer-events: none;
      z-index: 0;
    }
    .rr-root::after {
      content: '';
      position: fixed;
      width: 440px; height: 440px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%);
      bottom: -100px; right: -120px;
      pointer-events: none;
      z-index: 0;
    }

    .rr-body {
      position: relative;
      z-index: 1;
      max-width: 680px;
      margin: 0 auto;
      padding: 3rem 1.5rem 6rem;
    }

    /* ── Header ── */
    .rr-back {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.82rem;
      font-weight: 600;
      color: #8b5cf6;
      text-decoration: none;
      margin-bottom: 1.75rem;
      transition: color 0.15s;
    }
    .rr-back:hover { color: #6366f1; }

    .rr-eyebrow {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #8b5cf6;
      margin-bottom: 0.4rem;
    }
    .rr-heading {
      font-size: 1.875rem;
      font-weight: 800;
      color: #1e1b4b;
      letter-spacing: -0.03em;
      margin-bottom: 1rem;
      line-height: 1.2;
    }
    .rr-heading span {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* ── Criteria chips ── */
    .rr-criteria {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 2rem;
    }
    .rr-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.28rem 0.7rem;
      background: #ede9fe;
      border: 1px solid #c7d2fe;
      border-radius: 999px;
      font-size: 0.75rem;
      color: #4338ca;
      font-weight: 500;
    }
    .rr-chip-key {
      color: #a5b4fc;
      font-size: 0.62rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    /* ── Book card ── */
    .rr-card-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .rr-card {
      background: #ffffff;
      border-radius: 1.25rem;
      border: 1px solid #ede9fe;
      box-shadow: 0 2px 12px rgba(99,102,241,0.07), 0 1px 3px rgba(0,0,0,0.04);
      overflow: hidden;
      opacity: 0;
      animation: cardIn 0.45s ease forwards;
      transition: box-shadow 0.2s ease, transform 0.2s ease;
    }
    .rr-card:hover {
      box-shadow: 0 8px 30px rgba(99,102,241,0.14), 0 2px 6px rgba(0,0,0,0.06);
      transform: translateY(-2px);
    }

    .rr-card-inner {
      display: flex;
      gap: 0;
    }

    /* Rank stripe */
    .rr-rank-stripe {
      width: 52px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem 0 1rem;
      gap: 0.5rem;
    }
    .rr-rank-num {
      font-size: 1.1rem;
      font-weight: 900;
      color: #c7d2fe;
      letter-spacing: -0.03em;
      line-height: 1;
    }
    .rr-rank-line {
      flex: 1;
      width: 1px;
      background: #ede9fe;
      min-height: 20px;
    }

    /* Cover */
    .rr-cover-wrap {
      flex-shrink: 0;
      width: 88px;
      align-self: stretch;
      position: relative;
    }
    .rr-cover {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .rr-cover-fallback {
      width: 100%;
      height: 100%;
      min-height: 140px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
    }
    .rr-cover-initial {
      font-size: 1.75rem;
      font-weight: 900;
      color: rgba(255,255,255,0.9);
      line-height: 1;
      letter-spacing: -0.03em;
    }
    .rr-cover-label {
      font-size: 0.6rem;
      font-weight: 700;
      color: rgba(255,255,255,0.55);
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    /* Info */
    .rr-info {
      flex: 1;
      min-width: 0;
      padding: 1.4rem 1.4rem 1.25rem 1rem;
    }

    .rr-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #1e1b4b;
      line-height: 1.35;
      margin-bottom: 0.3rem;
      letter-spacing: -0.02em;
    }
    .rr-meta {
      font-size: 0.78rem;
      color: #9ca3af;
      margin-bottom: 0.75rem;
      line-height: 1.4;
    }

    /* Tags */
    .rr-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
      margin-bottom: 0.85rem;
    }
    .rr-tag {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 500;
      border: 1px solid #e5e7eb;
      color: #6b7280;
      background: #fafafa;
      white-space: nowrap;
    }
    .rr-tag.match {
      border-color: #a7f3d0;
      color: #065f46;
      background: #ecfdf5;
    }

    /* AI reason */
    .rr-reason {
      display: flex;
      gap: 0.6rem;
      background: #f5f3ff;
      border-radius: 0.75rem;
      padding: 0.75rem 0.9rem;
      margin-bottom: 1rem;
    }
    .rr-reason-icon {
      font-size: 0.9rem;
      flex-shrink: 0;
      margin-top: 0.05rem;
    }
    .rr-reason-text {
      font-size: 0.78rem;
      color: #5b21b6;
      line-height: 1.6;
      font-style: italic;
    }

    /* Store buttons */
    .rr-stores {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }
    .rr-store {
      display: inline-flex;
      align-items: center;
      padding: 0.3rem 0.8rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.15s ease;
      border: 1.5px solid transparent;
    }
    .rr-store-yes24  { background:#fff0f0; color:#cc0000; border-color:#ffd0d0; }
    .rr-store-yes24:hover  { background:#ffe0e0; border-color:#cc0000; }
    .rr-store-aladin { background:#f0f6ff; color:#0057a8; border-color:#c8dff8; }
    .rr-store-aladin:hover { background:#deeeff; border-color:#0057a8; }
    .rr-store-kyobo  { background:#fffbe6; color:#8a6200; border-color:#ffe57a; }
    .rr-store-kyobo:hover  { background:#fff3c0; border-color:#8a6200; }

    /* ── Empty / error states ── */
    .rr-state-box {
      text-align: center;
      padding: 5rem 0;
      color: #9ca3af;
    }
    .rr-state-icon  { font-size: 2.5rem; margin-bottom: 0.75rem; }
    .rr-state-title { font-size: 1rem; font-weight: 700; color: #4b5563; margin-bottom: 0.4rem; }
    .rr-state-sub   { font-size: 0.85rem; }

    /* ── Footer CTA ── */
    .rr-footer {
      margin-top: 2.5rem;
      display: flex;
      justify-content: center;
    }
    .rr-retry-link {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.7rem 1.5rem;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      border-radius: 999px;
      font-size: 0.875rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 4px 14px rgba(99,102,241,0.35);
    }
    .rr-retry-link:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 22px rgba(99,102,241,0.45);
    }
  `;

  return (
    <div className="rr-root">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="rr-body">

        {/* ── Back link ── */}
        <Link href="/recommend" className="rr-back">
          ← 처음으로 돌아가기
        </Link>

        {/* ── Header ── */}
        <p className="rr-eyebrow">AI 추천 결과</p>
        {isError ? (
          <h1 className="rr-heading">오류가 발생했어요</h1>
        ) : results.length > 0 ? (
          <h1 className="rr-heading">
            <span>{results.length}권</span>의 책을 추천했어요
          </h1>
        ) : (
          <h1 className="rr-heading">추천 결과</h1>
        )}

        {/* Criteria chips */}
        {criteria.length > 0 && (
          <div className="rr-criteria">
            {criteria.map(c => (
              <span key={c.label} className="rr-chip">
                <span className="rr-chip-key">{c.label}</span>
                {c.value}
              </span>
            ))}
          </div>
        )}

        {/* ── Error state ── */}
        {isError && (
          <div className="rr-state-box">
            <div className="rr-state-icon">⚠️</div>
            <p className="rr-state-title">추천을 불러오지 못했어요</p>
            <p className="rr-state-sub">잠시 후 다시 시도해 주세요.</p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!isError && results.length === 0 && (
          <div className="rr-state-box">
            <div className="rr-state-icon">📭</div>
            <p className="rr-state-title">맞는 책을 찾지 못했어요</p>
            <p className="rr-state-sub">조건을 바꿔서 다시 시도해 보세요.</p>
          </div>
        )}

        {/* ── Book cards ── */}
        {!isError && results.length > 0 && (
          <div className="rr-card-list">
            {results.map((book, i) => {
              const tags: string[]  = book.tags ?? book.categories ?? [];
              const cover           = book.coverImage ?? book.thumbnailUrl ?? book.thumbnail;
              const [c1, c2]        = COVER_GRADIENTS[i % COVER_GRADIENTS.length];
              const initial         = book.title.charAt(0);

              return (
                <div
                  key={book.id}
                  className="rr-card"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <div className="rr-card-inner">

                    {/* Rank stripe */}
                    <div className="rr-rank-stripe">
                      <span className="rr-rank-num">{String(i + 1).padStart(2, '0')}</span>
                      <div className="rr-rank-line" />
                    </div>

                    {/* Cover */}
                    <div
                      className="rr-cover-wrap"
                      style={{ background: `linear-gradient(160deg, ${c1}, ${c2})` }}
                    >
                      {cover ? (
                        <img src={cover} alt={book.title} className="rr-cover" />
                      ) : (
                        <div className="rr-cover-fallback">
                          <span className="rr-cover-initial">{initial}</span>
                          <span className="rr-cover-label">도서</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="rr-info">
                      <div className="rr-title">{book.title}</div>
                      <div className="rr-meta">
                        {[book.author, book.publisher].filter(Boolean).join(' · ')}
                        {book.publishedYear ? ` · ${book.publishedYear}` : ''}
                      </div>

                      {/* Tags */}
                      {tags.length > 0 && (
                        <div className="rr-tags">
                          {tags.map(tag => {
                            const isMatch = queryTerms.some(
                              q => tag.includes(q) || q.includes(tag)
                            );
                            return (
                              <span key={tag} className={`rr-tag${isMatch ? ' match' : ''}`}>
                                #{tag}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* AI reason */}
                      {book.reason && (
                        <div className="rr-reason">
                          <span className="rr-reason-icon">✦</span>
                          <p className="rr-reason-text">{book.reason}</p>
                        </div>
                      )}

                      {/* Bookstore links */}
                      <div className="rr-stores">
                        <a href={STORE_URLS.yes24(book.title)}  target="_blank" rel="noopener noreferrer" className="rr-store rr-store-yes24">Yes24</a>
                        <a href={STORE_URLS.aladin(book.title)} target="_blank" rel="noopener noreferrer" className="rr-store rr-store-aladin">알라딘</a>
                        <a href={STORE_URLS.kyobo(book.title)}  target="_blank" rel="noopener noreferrer" className="rr-store rr-store-kyobo">교보문고</a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Footer CTA ── */}
        <div className="rr-footer">
          <Link href="/recommend" className="rr-retry-link">
            ↩ 다시 추천받기
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── export ─────────────────── */

export default function RecommendResultPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ResultContent />
    </Suspense>
  );
}
