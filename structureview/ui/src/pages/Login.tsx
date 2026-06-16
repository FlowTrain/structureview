import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

export function Login() {
  const navigate = useNavigate()
  const handleLogin = (e: FormEvent) => {
    e.preventDefault()
    const btn = document.getElementById('board-btn') as HTMLButtonElement
    btn.innerHTML = '<span class="spinner"></span> Coupling to fleet...'
    btn.disabled = true
    // HashRouter navigation (a hard window.location change would bypass the router under file://)
    setTimeout(() => {
      navigate('/structureview')
    }, 900)
  }

  return (
    <div className="login-page track-pattern">
      {/* Atmospheric background */}
      <div className="login-bg"></div>

      {/* Decorative track SVG at bottom */}
      <div className="login-tracks" aria-hidden="true">
        <svg viewBox="0 0 1440 220" fill="none" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
          {/* Converging perspective rails */}
          <line x1="0" y1="220" x2="620" y2="120" stroke="#2BAEE4" strokeWidth="2" opacity="0.25"/>
          <line x1="0" y1="195" x2="610" y2="114" stroke="#2BAEE4" strokeWidth="2" opacity="0.25"/>
          <line x1="1440" y1="220" x2="820" y2="120" stroke="#2BAEE4" strokeWidth="2" opacity="0.25"/>
          <line x1="1440" y1="195" x2="830" y2="114" stroke="#2BAEE4" strokeWidth="2" opacity="0.25"/>
          <line x1="620" y1="120" x2="720" y2="100" stroke="#2BAEE4" strokeWidth="2" opacity="0.15"/>
          <line x1="820" y1="120" x2="720" y2="100" stroke="#2BAEE4" strokeWidth="2" opacity="0.15"/>
          {/* Cross ties */}
          <line x1="80" y1="223" x2="92" y2="188" stroke="#2BAEE4" strokeWidth="1.5" opacity="0.12"/>
          <line x1="200" y1="219" x2="210" y2="189" stroke="#2BAEE4" strokeWidth="1.5" opacity="0.12"/>
          <line x1="340" y1="215" x2="348" y2="190" stroke="#2BAEE4" strokeWidth="1.5" opacity="0.1"/>
          <line x1="1360" y1="223" x2="1348" y2="188" stroke="#2BAEE4" strokeWidth="1.5" opacity="0.12"/>
          <line x1="1240" y1="219" x2="1230" y2="189" stroke="#2BAEE4" strokeWidth="1.5" opacity="0.12"/>
          <defs>
            <linearGradient id="trackFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a0a0f" stopOpacity="1"/>
              <stop offset="100%" stopColor="#0a0a0f" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <rect width="1440" height="220" fill="url(#trackFade)"/>
        </svg>
      </div>

      {/* Login card */}
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo-wrap">
          <svg className="logo-mark-lg" viewBox="0 0 64 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="FlowTrain logo mark" style={{width:64,height:44,color:'var(--ft-blue)'}}>
            {/* Rail ties */}
            <rect x="10" y="27" width="2.5" height="8" rx="1" fill="currentColor" opacity="0.4"/>
            <rect x="20" y="27" width="2.5" height="8" rx="1" fill="currentColor" opacity="0.4"/>
            <rect x="30" y="27" width="2.5" height="8" rx="1" fill="currentColor" opacity="0.4"/>
            <rect x="40" y="27" width="2.5" height="8" rx="1" fill="currentColor" opacity="0.4"/>
            <rect x="50" y="27" width="2.5" height="8" rx="1" fill="currentColor" opacity="0.4"/>
            {/* Top rail */}
            <rect x="3" y="27" width="58" height="2.5" rx="1.25" fill="currentColor"/>
            {/* Bottom rail */}
            <rect x="3" y="33" width="58" height="2.5" rx="1.25" fill="currentColor"/>
            {/* Loco body */}
            <rect x="6" y="11" width="26" height="16" rx="2" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="1.5"/>
            {/* Cab */}
            <rect x="30" y="6" width="16" height="21" rx="2" fill="currentColor"/>
            {/* Cab window */}
            <rect x="33" y="9" width="8" height="7" rx="1" fill="#0a0a0f"/>
            {/* Stack */}
            <rect x="15" y="7" width="4" height="5" rx="1.5" fill="currentColor" opacity="0.6"/>
            {/* Nose/coupler */}
            <rect x="3" y="15" width="4" height="5" rx="1" fill="currentColor" opacity="0.5"/>
          </svg>
          <div className="logo-text">Flow<span>Train</span></div>
        </div>

        {/* Headline + byline */}
        <h1 className="login-headline">Board your fleet.</h1>
        <p className="login-byline">Enterprise intelligence for every haul, every gauge, every terminal.</p>

        {/* Demo credentials hint */}
        <div className="demo-credentials">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}} aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
          <span>Demo: <code>dispatcher@flowtrain.io</code> / <code>fleet2024</code></span>
        </div>

        {/* Login form */}
        <form id="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="you@flowtrain.io"
              defaultValue="dispatcher@flowtrain.io"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
              <a href="#" style={{float:'right',color:'var(--ft-blue)',fontSize:'var(--xs)'}}>Forgot?</a>
            </label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="••••••••••"
              defaultValue="fleet2024"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-xl w-full" id="board-btn">
            Board the Train
          </button>
        </form>

        <div className="login-footer-note">
          New to FlowTrain? <a href="#">Request trackside access</a>
          {' · '}
          <a href="#">Help</a>
        </div>
      </div>
    </div>
  )
}
