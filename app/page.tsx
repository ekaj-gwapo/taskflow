"use client"

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import './landing.css'

export default function Home() {
  const router = useRouter()
  const scrollLineRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      router.replace('/dashboard')
    }
  }, [router])

  useEffect(() => {
    const onScroll = () => {
      const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      if (scrollLineRef.current) scrollLineRef.current.style.width = scrolled + '%'
      if (navRef.current) navRef.current.style.background = window.scrollY > 50 ? 'rgba(6,12,7,0.95)' : 'rgba(6,12,7,0.7)'
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const reveals = document.querySelectorAll('.lp-reveal')
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } })
    }, { threshold: 0.15 })
    reveals.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <div className="lp-root">
      <div className="lp-noise" />
      <div className="lp-grid" />
      <div className="lp-scroll-line" ref={scrollLineRef} />

      {/* NAV */}
      <nav className="lp-nav" ref={navRef}>
        <a href="#" className="lp-logo">
          <div className="lp-logo-icon">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="#060c07">
              <rect x="2" y="2" width="5" height="5" rx="1.5" />
              <rect x="9" y="2" width="5" height="5" rx="1.5" />
              <rect x="2" y="9" width="5" height="5" rx="1.5" />
              <rect x="9" y="9" width="5" height="5" rx="1.5" opacity="0.4" />
            </svg>
          </div>
          TaskFlow
        </a>
        <ul className="lp-nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><Link href="/auth/login" className="lp-nav-cta">Login</Link></li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-glow" />
        <div className="lp-badge"><span className="lp-badge-dot" /> Now in public beta — free to try</div>
        <h1 className="lp-h1">Monitor tasks.<br />Drive <span className="accent">results</span>.</h1>
        <p className="lp-sub">Assign, track, and complete work with total clarity. Real-time visibility across every task, every team, every deadline.</p>
        <div className="lp-cta-group">
          <Link href="/auth/login" className="lp-btn-primary">
            Login
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" /></svg>
          </Link>
          <a href="#features" className="lp-btn-ghost">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3,2 11,7 3,12" /></svg>
            See how it works
          </a>
        </div>

        {/* Dashboard Preview */}
        <div className="lp-preview-wrap">
          <div className="lp-preview-frame">
            <div className="lp-frame-bar">
              <div className="lp-frame-dot" style={{ background: '#ff5f57' }} />
              <div className="lp-frame-dot" style={{ background: '#febc2e' }} />
              <div className="lp-frame-dot" style={{ background: '#28c840' }} />
              <span className="lp-frame-title">TaskFlow — Project Overview</span>
            </div>
            <div className="lp-dash-inner">
              <div className="lp-dash-sidebar">
                {[['Dashboard', 'M2 4h12M2 4h12', 'active'], ['My Tasks', 'M2 4h12M2 8h8M2 12h10', ''], ['Team', '', ''], ['Reports', 'M2 12l3-4 3 2 3-5 3 3', '']].map(([label, , cls], i) => (
                  <div key={i} className={`lp-dash-nav-item${cls ? ' active' : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      {i === 0 && <><rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" /><rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" /></>}
                      {i === 1 && <path d="M2 4h12M2 8h8M2 12h10" />}
                      {i === 2 && <><circle cx="8" cy="6" r="3" /><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" /></>}
                      {i === 3 && <path d="M2 12l3-4 3 2 3-5 3 3" />}
                    </svg>
                    {label}
                  </div>
                ))}
              </div>
              <div className="lp-dash-main">
                <div className="lp-stats-row">
                  <div className="lp-stat-card"><div className="lp-stat-label">Total Tasks</div><div className="lp-stat-val">48</div></div>
                  <div className="lp-stat-card"><div className="lp-stat-label">In Progress</div><div className="lp-stat-val green">12</div></div>
                  <div className="lp-stat-card"><div className="lp-stat-label">Completed</div><div className="lp-stat-val">31</div></div>
                  <div className="lp-stat-card"><div className="lp-stat-label">Overdue</div><div className="lp-stat-val red">3</div></div>
                </div>
                <table className="lp-task-table">
                  <thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Progress</th></tr></thead>
                  <tbody>
                    {[
                      ['Design system tokens', 'done', 'Done', 100],
                      ['API integration', 'inprogress', 'In Progress', 60],
                      ['QA testing sprint', 'review', 'In Review', 80],
                      ['Deploy to production', 'todo', 'To Do', 0],
                    ].map(([name, cls, label, pct]) => (
                      <tr key={name as string}>
                        <td className="lp-task-name">{name}</td>
                        <td><span className={`lp-badge-pill lp-badge-${cls}`}>{label}</span></td>
                        <td><span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: cls === 'review' ? '#ef4444' : cls === 'inprogress' ? '#f59e0b' : '#22c55e' }} /></td>
                        <td><div className="lp-pbar-wrap"><div className="lp-pbar-fill" style={{ width: `${pct}%` }} /></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="lp-stats-section">
        <div className="lp-stats-inner">
          {[['98%', 'On-time delivery rate'], ['12k', 'Teams using TaskFlow'], ['3.4M', 'Tasks completed'], ['4.9', 'Average user rating']].map(([num, label], i) => (
            <div key={i} className={`lp-big-stat lp-reveal${i > 0 ? ' lp-reveal-d' + i : ''}`}>
              <div className="lp-big-stat-num">{num}</div>
              <div className="lp-big-stat-label">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div className="lp-features-section" id="features">
        <div className="lp-features-head lp-reveal">
          <div className="lp-section-label">Features</div>
          <h2 className="lp-h2">Everything you need<br />to stay in control</h2>
          <p className="lp-section-sub">From assignment to delivery, TaskFlow gives you full visibility without the noise.</p>
        </div>
        <div className="lp-features-grid">
          {[
            ['Real-time monitoring', 'Track every task as it moves through stages. Get instant updates when status changes or a deadline shifts.', 'M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2'],
            ['Assignee workload', 'See who\'s overloaded at a glance. Balance tasks across your team with a clear picture of capacity.', 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75'],
            ['Priority scoring', 'Automatically surface critical items so your team always knows what matters most.', 'M18 20V10M12 20V4M6 20v-6'],
            ['Audit trail', 'Full activity log of every change — who moved it, when, and why. Complete accountability.', 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8'],
            ['Deadline alerts', 'Automatic flags for overdue and approaching tasks. Never miss a deadline again.', 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01'],
            ['Kanban + list views', 'Switch between drag-and-drop Kanban and detailed list view. Work the way that suits your team.', 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z'],
          ].map(([title, desc, path], i) => (
            <div key={i} className={`lp-feature-card lp-reveal${i % 3 > 0 ? ' lp-reveal-d' + (i % 3) : ''}`}>
              <div className="lp-feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={path as string} />
                </svg>
              </div>
              <div className="lp-feature-title">{title}</div>
              <div className="lp-feature-desc">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how" style={{ overflow: 'hidden' }}>
        <div className="lp-workflow-section">
          <div className="lp-reveal">
            <div className="lp-section-label">How it works</div>
            <h2 className="lp-h2">Built for the way<br />teams actually work</h2>
            <div style={{ marginTop: 40 }}>
              {[
                ['Create and assign tasks', 'Add tasks in seconds. Assign to team members, set priority levels, and define clear deadlines.'],
                ['Monitor in real time', 'Watch tasks move through stages live. Your dashboard updates the moment something changes.'],
                ['Get alerted before it\'s late', 'Smart alerts surface overdue tasks and blocked work before they become problems.'],
                ['Report and improve', 'Review completion rates, team workload, and bottlenecks. Build faster every sprint.'],
              ].map(([title, desc], i) => (
                <div key={i} className={`lp-workflow-step${activeStep === i ? ' active' : ''}`} onClick={() => setActiveStep(i)}>
                  <div className="lp-step-num">0{i + 1}</div>
                  <div>
                    <div className="lp-step-title">{title}</div>
                    <div className="lp-step-desc">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lp-reveal lp-reveal-d2">
            <div className="lp-workflow-visual">
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Active tasks — Sprint 4</div>
              {[
                ['User auth redesign', 'Design', 'inprogress', 'In Progress', '#166534', '#4ade80', 'JK', '#1e3a5f', '#93c5fd', 'RS'],
                ['Payment gateway', 'Backend', 'review', 'In Review', '#4a1942', '#f0abfc', 'ML', null, null, null],
                ['Email notifications', 'Full-stack', 'done', 'Done', '#451a03', '#fdba74', 'TC', '#166534', '#4ade80', 'JK'],
                ['Mobile responsive QA', 'QA', 'todo', 'Blocked', '#1e3a5f', '#93c5fd', 'RS', null, null, null],
              ].map(([name, team, cls, label, bg1, c1, a1, bg2, c2, a2]) => (
                <div key={name as string} className="lp-task-row">
                  <div>
                    <div className="lp-task-info-name">{name}</div>
                    <div className="lp-task-info-assignee">Assigned to {team}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`lp-badge-pill lp-badge-${cls}`}>{label}</span>
                    <div style={{ display: 'flex' }}>
                      <div className="lp-avatar" style={{ background: bg1 as string, color: c1 as string }}>{a1}</div>
                      {a2 && <div className="lp-avatar" style={{ background: bg2 as string, color: c2 as string }}>{a2}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div className="lp-pricing-section" id="pricing">
        <div style={{ textAlign: 'center' }} className="lp-reveal">
          <div className="lp-section-label" style={{ justifyContent: 'center' }}>Pricing</div>
          <h2 className="lp-h2">Simple, transparent pricing</h2>
          <p className="lp-section-sub" style={{ margin: '0 auto' }}>No hidden fees. Cancel anytime. Scale as your team grows.</p>
        </div>
        <div className="lp-pricing-grid">
          {[
            { name: 'Starter', price: '$0', sub: '/mo', desc: 'Perfect for solo developers and small teams.', features: ['Up to 3 team members', '50 tasks per month', 'Basic dashboard', 'Email alerts'], cta: 'Get started', featured: false },
            { name: 'Pro', price: '$18', sub: '/mo', desc: 'For teams that move fast and need full visibility.', features: ['Up to 25 team members', 'Unlimited tasks', 'Full monitoring dashboard', 'Kanban + list views', 'Audit trail & reporting', 'Priority support'], cta: 'Start free trial', featured: true, badge: 'Most popular' },
            { name: 'Enterprise', price: 'Custom', sub: '', desc: 'For organizations that need total control and SLA.', features: ['Unlimited members', 'SSO & advanced roles', 'Custom integrations', 'Dedicated support', 'SLA guarantee'], cta: 'Contact sales', featured: false },
          ].map((plan, i) => (
            <div key={i} className={`lp-pricing-card lp-reveal${i > 0 ? ' lp-reveal-d' + i : ''}${plan.featured ? ' featured' : ''}`}>
              {plan.badge && <div className="lp-plan-badge">{plan.badge}</div>}
              <div className="lp-plan-name">{plan.name}</div>
              <div className="lp-plan-price">{plan.price}{plan.sub && <span>{plan.sub}</span>}</div>
              <div className="lp-plan-desc">{plan.desc}</div>
              <ul className="lp-plan-features">{plan.features.map(f => <li key={f}>{f}</li>)}</ul>
              <Link href="/auth/login" className={plan.featured ? 'lp-btn-primary' : 'lp-btn-ghost'} style={{ width: '100%', justifyContent: 'center' }}>{plan.cta}</Link>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <section className="lp-cta-section">
        <div className="lp-cta-glow" />
        <div className="lp-reveal">
          <div className="lp-section-label" style={{ justifyContent: 'center' }}>Get started</div>
          <h2 className="lp-h2">Your team is ready.<br />Are you?</h2>
          <p style={{ fontSize: 17, fontWeight: 300, color: 'var(--text2)', marginBottom: 40 }}>Start tracking in minutes. No credit card required.</p>
          <Link href="/auth/login" className="lp-btn-primary" style={{ fontSize: 16, padding: '16px 40px' }}>
            Create free account
            <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" /></svg>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-text">© 2025 TaskFlow. All rights reserved.</div>
        <ul className="lp-footer-links">
          <li><a href="#">Privacy</a></li>
          <li><a href="#">Terms</a></li>
          <li><a href="#">Docs</a></li>
          <li><a href="#">Status</a></li>
        </ul>
      </footer>
    </div>
  )
}
