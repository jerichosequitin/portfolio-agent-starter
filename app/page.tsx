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
        <SiteHeader name={profile.name} />
        <main id="main-content">
          <section className="hero" aria-labelledby="hero-title">
            <p className="eyebrow">{profile.role} · {profile.location}</p>
            <h1 id="hero-title">{profile.intro}</h1>
            <div className="hero-meta">
              <p>{profile.availability}</p>
              <a href="#projects">View selected work</a>
              <ChatPanel name={profile.name} />
            </div>
          </section>
          <PortfolioSections portfolio={portfolio} />
        </main>
        <footer className="site-footer">
          <p>© {new Date().getFullYear()} {profile.name}</p>
          <p className="example-note">Fictional example portfolio.</p>
        </footer>
      </div>
    </>
  );
}
