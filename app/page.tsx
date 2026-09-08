import Image from 'next/image';

import { ChatPanel } from '@/components/chat/chat-panel';
import { PortfolioSections } from '@/components/portfolio-sections';
import { SiteHeader } from '@/components/site-header';
import { portfolio } from '@/lib/portfolio';

export default function Home() {
  const { profile } = portfolio;

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="page-shell" id="top">
        <SiteHeader name={profile.name} hasProjects={portfolio.projects.length > 0} />
      </div>
      <main id="main-content">
        <div className="page-shell">
          <section className={`hero${profile.image ? '' : ' hero-text-only'}`} aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="eyebrow">{profile.role}</p>
              <h1 id="hero-title">
                {profile.headline ? <>{profile.headline.text} <em>{profile.headline.emphasis}</em></> : profile.intro}
              </h1>
              {profile.headline ? <p className="hero-intro">{profile.intro}</p> : null}
              <a className="button-link" href={portfolio.projects.length ? '#projects' : '#about'}>{portfolio.projects.length ? 'Explore my work' : 'A little about me'}</a>
            </div>
            {profile.image ? (
              <figure className="hero-figure">
                <Image src={profile.image.src} alt={profile.image.alt} width={1400} height={1000} sizes="(max-width: 760px) calc(100vw - 40px), 50vw" preload />
                <figcaption>Based in {profile.location}</figcaption>
              </figure>
            ) : <p className="hero-location">Based in {profile.location}</p>}
          </section>
        </div>
        <ChatPanel name={profile.name} />
        <div className="page-shell">
          <PortfolioSections portfolio={portfolio} />
        </div>
      </main>
      <div className="page-shell">
        <footer className="site-footer">
          <p>© {new Date().getFullYear()} {profile.name}</p>
          <p className="example-note">Fictional example portfolio.</p>
        </footer>
      </div>
    </>
  );
}
