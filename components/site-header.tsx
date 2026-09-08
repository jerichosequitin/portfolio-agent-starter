export function SiteHeader({ name }: { name: string }) {
  return (
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label={`${name}, home`}>
        {name}
      </a>
      <nav aria-label="Primary navigation">
        <ul className="nav-list">
          <li><a href="#about">About</a></li>
          <li><a href="#experience">Experience</a></li>
          <li><a href="#projects">Projects</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>
    </header>
  );
}
