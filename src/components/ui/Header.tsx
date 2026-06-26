export function Header() {
  return (
    <header className="top-shell">
      <a className="brand-lockup" href="#vault" aria-label="Diecast Vault home">
        <span className="brand-main">Diecast</span>
        <span className="brand-sub">Vault</span>
      </a>
      <div className="header-nav" aria-hidden="true">
        <span>01 Browse</span>
        <span>02 Collect</span>
        <span>"Die-cast"</span>
      </div>
    </header>
  )
}
