import Image from 'next/image';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr/ArrowUpRight';

import type { Portfolio } from '@/lib/portfolio';

export function PortfolioSections({ portfolio }: { portfolio: Portfolio }) {
  const { profile, about, experience, projects } = portfolio;

  return (
    <>
      {projects.length ? (
        <section className="projects-section" id="projects" aria-labelledby="projects-title">
          <div className="section-heading">
            <h2 id="projects-title">A few things I have built</h2>
            <span>Selected work</span>
          </div>
          <div className="project-grid">
            {projects.map((project) => (
              <article className={`project${project.image ? '' : ' project-text-only'}`} key={project.title}>
                {project.image ? (
                  <div className="project-image">
                    <Image src={project.image.src} alt={project.image.alt} fill sizes="(max-width: 760px) calc(100vw - 40px), 50vw" />
                  </div>
                ) : null}
                <div className="project-description">
                  <h3>
                    {project.url ? (
                      <a href={project.url} target="_blank" rel="noreferrer">
                        {project.title}<ArrowUpRight size={22} weight="light" aria-hidden="true" />
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    ) : project.title}
                  </h3>
                  <p>{project.summary}</p>
                  <ul className="tag-list" aria-label={`${project.title} technologies`}>
                    {project.tags.map((tag) => <li key={tag}>{tag}</li>)}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section-grid about-section" id="about" aria-labelledby="about-title">
        <div className="section-label"><span>01 / A little context</span><h2 id="about-title">The person<br />behind the work.</h2></div>
        <div className="prose-stack">
          {about.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </section>

      {experience.length ? <section className="section-grid" id="experience" aria-labelledby="experience-title">
        <div className="section-label"><span>02 / Along the way</span><h2 id="experience-title">Experience</h2></div>
        <ol className="experience-list">
          {experience.map((item) => (
            <li key={`${item.organization}-${item.role}`}>
              <div><h3>{item.role}</h3><p className="organization">{item.organization}</p></div>
              <p className="period">{item.period}</p>
              <p className="item-summary">{item.summary}</p>
            </li>
          ))}
        </ol>
      </section> : null}

      <section className="contact-section" id="contact" aria-labelledby="contact-title">
        <p className="eyebrow">{experience.length ? '03' : '02'} / Start a conversation</p>
        <h2 id="contact-title">Something good<br />starts with <em>a hello.</em></h2>
        <p className="availability">{profile.availability}</p>
        <a className="button-link" href={`mailto:${profile.email}`}>Email {profile.name.split(' ')[0]}<ArrowUpRight size={20} weight="light" aria-hidden="true" /></a>
        <ul className="social-links" aria-label="Social links">
          {profile.links.map((link) => (
            <li key={link.url}><a href={link.url} target="_blank" rel="noreferrer">{link.label}<ArrowUpRight size={16} weight="light" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a></li>
          ))}
        </ul>
      </section>
    </>
  );
}
