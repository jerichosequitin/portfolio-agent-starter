export function SiteHeader({ name, hasProjects }: { name: string; hasProjects: boolean }) {
  return (
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label={`${name}, home`}>
        {name}
      </a>
      <nav aria-label="Primary navigation">
        <ul className="nav-list">
          {hasProjects ? <li><a href="#projects">Work</a></li> : null}
          <li><a href="#about">About</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>
    </header>
  );
}
