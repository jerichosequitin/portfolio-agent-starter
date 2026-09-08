import type { Portfolio } from '@/lib/portfolio';

function SectionHeading({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <div className="section-heading">
      <span aria-hidden="true">{index}</span>
      <h2>{children}</h2>
    </div>
  );
}

export function PortfolioSections({ portfolio }: { portfolio: Portfolio }) {
  const { profile, about, experience, projects } = portfolio;

  return (
    <>
      <section className="section-grid" id="about" aria-labelledby="about-title">
        <SectionHeading index="01"><span id="about-title">About</span></SectionHeading>
        <div className="prose-stack">
          {about.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </section>

      <section className="section-grid" id="experience" aria-labelledby="experience-title">
        <SectionHeading index="02"><span id="experience-title">Experience</span></SectionHeading>
        <ol className="experience-list">
          {experience.map((item) => (
            <li key={`${item.organization}-${item.role}`}>
              <div>
                <h3>{item.role}</h3>
                <p className="organization">{item.organization}</p>
              </div>
              <p className="period">{item.period}</p>
              <p className="item-summary">{item.summary}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section-grid" id="projects" aria-labelledby="projects-title">
        <SectionHeading index="03"><span id="projects-title">Selected projects</span></SectionHeading>
        <div className="project-grid">
          {projects.map((project) => {
            const content = (
              <>
                <div className="project-topline">
                  <h3>{project.title}</h3>
                  {project.url ? <span aria-hidden="true">Open</span> : null}
                </div>
                <p>{project.summary}</p>
                <ul className="tag-list" aria-label={`${project.title} technologies`}>
                  {project.tags.map((tag) => <li key={tag}>{tag}</li>)}
                </ul>
              </>
            );

            return project.url ? (
              <a className="project-card" href={project.url} key={project.title} target="_blank" rel="noreferrer">
                {content}
              </a>
            ) : (
              <article className="project-card" key={project.title}>{content}</article>
            );
          })}
        </div>
      </section>

      <section className="contact-section" id="contact" aria-labelledby="contact-title">
        <SectionHeading index="04"><span id="contact-title">Contact</span></SectionHeading>
        <div>
          <p className="contact-lead">Have a thoughtful project in mind? Let’s talk.</p>
          <p className="availability">{profile.availability}</p>
          <a className="button-link" href={`mailto:${profile.email}`}>Email {profile.name.split(' ')[0]}</a>
          <ul className="social-links" aria-label="Social links">
            {profile.links.map((link) => (
              <li key={link.url}><a href={link.url} target="_blank" rel="noreferrer">{link.label}</a></li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
