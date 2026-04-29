import { Link } from "react-router-dom"

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4 md:px-6">

        {/* Brand — spans 2 cols */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">✝</span>
            <span className="font-display text-xl font-bold">
              Kids <span className="text-primary">Min</span>
            </span>
          </div>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            A fun, safe, faith-filled place where every child is known by name,
            loved unconditionally, and discipled for life.
          </p>
          <p className="mt-4 font-display text-sm italic text-primary">
            "Let the little children come to me." — Matthew 19:14
          </p>
        </div>

        {/* Visit Us */}
        <div>
          <h4 className="font-display text-base font-bold">Visit Us</h4>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              Your church address<br />City, State
            </li>
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Sundays at 9am &amp; 11am
            </li>
          </ul>
        </div>

        {/* Connect */}
        <div>
          <h4 className="font-display text-base font-bold">Connect</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/events" className="text-muted-foreground hover:text-primary">Upcoming Events</Link></li>
            <li><Link to="/about"  className="text-muted-foreground hover:text-primary">About Kids Min</Link></li>
            <li><Link to="/login"  className="text-muted-foreground hover:text-primary">Family Portal</Link></li>
          </ul>
        </div>

      </div>

      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Kids Min · Made with care for our families
      </div>
    </footer>
  )
}
