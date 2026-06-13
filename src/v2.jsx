import React from 'react';
import { createRoot } from 'react-dom/client';
import { motion } from 'framer-motion';
import './v2.css';
import { pageView } from './utils/gtm.js';
import { trackCTA, trackEvent } from './utils/events.js';
import {
  decorateInternalLinks,
  decorateLinkWithTracking,
  getTrackingData,
  initTracking
} from './utils/tracking.js';

initTracking();
decorateInternalLinks();
pageView();
window.tpclubTrackEvent = trackEvent;
window.getTrackingData = getTrackingData;

function handleTelegramClick(event, label) {
  decorateLinkWithTracking(event.currentTarget);
  trackCTA(label, { cta_href: event.currentTarget.href });
}

const features = [
  { label: 'Daily Education', detail: 'Calm learning context', icon: 'book', side: 'right', top: '20%' },
  { label: 'Mandarin Support', detail: '中文 + English learning', icon: 'chat', side: 'right', top: '50%' },
  { label: 'Beginner Help', detail: 'Ask before decisions', icon: 'users', side: 'left', top: '43%' },
  { label: 'Risk-First', detail: 'Safety before setups', icon: 'shield', side: 'right', top: '80%' }
];

const pillars = [
  ['Education Over Hype', 'Workshops on long-term knowledge and capital safety.'],
  ['Respect & Support', 'Everyone is welcome, from absolute beginners to active learners.'],
  ['Risk-First Mindset', 'We teach risk management before everything else.'],
  ['Privacy Focused', 'Your money and account always stay under your control.'],
  ['Community Driven', 'We grow and learn together as a team.']
];

const lessons = [
  ['Understanding Crypto Education Basics', 'Clear concepts for beginners.'],
  ['Risk Education & Personal Responsibility', 'Build patience and safer learning habits.'],
  ['Reading Market Education Context', 'Trend, support, resistance, and context.'],
  ['Avoiding Beginner Mistakes', 'No FOMO, no signal chasing, no gambling mindset.'],
  ['Security Awareness Guides', 'Learn account safety without sharing access.'],
  ['Learning Psychology & Mindset', 'Build discipline before taking risk.']
];

const safeSpace = [
  ['book', 'Education Over Hype', 'Workshops on long-term knowledge and capital safety.'],
  ['users', 'Respect & Support', 'Everyone is welcome. Ask questions without pressure.'],
  ['shield', 'Risk-First Mindset', 'We teach risk management before everything else.'],
  ['lock', 'Privacy Focused', 'Your money and account always stay under your control.'],
  ['chat', 'Community Driven', 'We grow and learn together as a team.']
];

const steps = [
  ['send', 'Join The Free Education Community', 'Click the button below to join our Telegram group. It is free and takes 10 seconds.'],
  ['book', 'Learn & Grow Every Day', 'Access daily education context, structured lessons, and helpful discussions in Mandarin.'],
  ['chat', 'Get Support When You Need It', 'Ask questions, get guidance, and learn with a community that actually cares.']
];

const communityCards = [
  ['Education Discussion', 'Teacher TP', '今天重点：先理解概念，再做判断。'],
  ['Member Question', 'Alice', '请问新手应该如何控制仓位？'],
  ['Learning Note', 'Teacher TP', 'No hype. Learn the framework first.'],
  ['Study Notes', 'Admin TP', '今日学习重点：风险管理。']
];

const chatMessages = [
  {
    author: 'Teacher TP',
    role: 'Daily Education Update',
    text: 'Today we focus on understanding the framework first. Manage your risk and stay patient.',
    chart: true,
    reactions: ['24', '12', '9']
  },
  {
    author: 'Alice',
    text: '感谢老师的分析！学习到了很多',
    reactions: ['7', '3']
  },
  {
    author: 'TP Club Admin',
    text: '新手必读：风险管理指南已经更新，大家可以去看置顶消息。',
    reactions: ['15', '5']
  },
  {
    author: 'James',
    text: '先学习框架，再根据自己的情况做判断。',
    reactions: ['6']
  }
];

function Icon({ type }) {
  const paths = {
    book: 'M5 5.5A2.5 2.5 0 0 1 7.5 3H12v17H7.5A2.5 2.5 0 0 0 5 22V5.5ZM19 5.5A2.5 2.5 0 0 0 16.5 3H12v17h4.5A2.5 2.5 0 0 1 19 22V5.5Z',
    users: 'M9.5 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3.5 20a6 6 0 0 1 12 0M16.5 11a3 3 0 0 0 0-6M17.5 14.5A5 5 0 0 1 21 19.3',
    shield: 'M12 3.5 19 6v5.2c0 4.2-2.8 8-7 9.3-4.2-1.3-7-5.1-7-9.3V6l7-2.5ZM9 12l2 2 4-5',
    lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6v-9Z',
    chat: 'M5 6.75A2.75 2.75 0 0 1 7.75 4h8.5A2.75 2.75 0 0 1 19 6.75v5.5A2.75 2.75 0 0 1 16.25 15H11l-4.5 4v-4.25A2.75 2.75 0 0 1 5 12.25v-5.5Z',
    chart: 'M4 19h16M6 15l4-4 3 3 5-7M18 7h-4M18 7v4',
    send: 'M21 4 3 11.5l7 2.5 2.5 7L21 4ZM10 14l4-4',
    trend: 'M4 16l5-5 4 4 7-8M20 7h-5M20 7v5'
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d={paths[type]} />
    </svg>
  );
}

function MiniChart() {
  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-3">
      <div className="mb-2 flex items-center justify-between text-[0.58rem] uppercase tracking-[0.16em] text-white/35">
        <span>Education Desk · 4h</span>
        <span>Education View</span>
      </div>
      <svg viewBox="0 0 320 120" className="h-28 w-full overflow-visible">
        <defs>
          <linearGradient id="v2Chart" x1="0" x2="1">
            <stop offset="0%" stopColor="#5fd400" />
            <stop offset="55%" stopColor="#aaff00" />
            <stop offset="100%" stopColor="#e0ff70" />
          </linearGradient>
        </defs>
        {[22, 48, 74, 100].map((y) => (
          <line key={y} x1="0" x2="320" y1={y} y2={y} stroke="rgba(255,255,255,0.06)" />
        ))}
        <path d="M8 88 C30 70 44 96 66 76 S110 42 132 60 S168 92 194 64 S238 32 264 48 S294 78 312 54" fill="none" stroke="url(#v2Chart)" strokeWidth="3" strokeLinecap="round" />
        <path d="M8 92 L66 80 L132 64 L194 68 L264 52 L312 58" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1" strokeDasharray="4 7" />
      </svg>
    </div>
  );
}

function HeroCommunityMockup() {
  return (
    <motion.div
      className="relative mx-auto w-full max-w-[560px]"
      aria-label="Telegram community preview with education updates and learner discussions"
      initial={{ opacity: 0, y: 36, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-10 rounded-[3rem] bg-lime-300/18 blur-3xl" />
      <motion.div
        className="relative overflow-hidden rounded-[2rem] border border-lime-300/14 bg-white/[0.025] shadow-[0_34px_100px_rgba(0,0,0,0.72)]"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img
          src="/images/hero-community-mockup.png"
          alt="TP Club Education Telegram community preview with education updates and Chinese learner discussions"
          width="1024"
          height="1024"
          className="relative z-10 h-auto w-full select-none"
          loading="eager"
          decoding="async"
        />
      </motion.div>
    </motion.div>
  );
}

function FloatingCards() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block">
      {features.map((feature, index) => (
        <motion.div
          key={feature.label}
          className={`absolute w-40 rounded-2xl border border-lime-300/18 bg-black/65 p-3 shadow-[0_18px_55px_rgba(0,0,0,0.38)] backdrop-blur-xl xl:w-44 ${feature.side === 'left' ? 'left-1 xl:left-6' : 'right-1 xl:right-6'}`}
          style={{ top: feature.top }}
          animate={{ y: [0, index % 2 === 0 ? -9 : 9, 0] }}
          transition={{ duration: 5 + index, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-lime-300/12 text-lime-300">
            <Icon type={feature.icon} />
          </div>
          <p className="text-xs font-bold text-white xl:text-sm">{feature.label}</p>
          <p className="mt-1 text-[0.72rem] leading-5 text-white/65">{feature.detail}</p>
        </motion.div>
      ))}
    </div>
  );
}

function MobileFeatureCards() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 lg:hidden">
      {features.map((feature) => (
        <div key={feature.label} className="rounded-2xl border border-lime-300/14 bg-white/[0.045] p-4">
          <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-lime-300/12 text-lime-300">
            <Icon type={feature.icon} />
          </div>
          <p className="text-sm font-bold text-white">{feature.label}</p>
          <p className="mt-1 text-xs leading-5 text-white/64">{feature.detail}</p>
        </div>
      ))}
    </div>
  );
}

function AvatarStack() {
  return (
    <div className="flex -space-x-3">
      {['A', 'J', 'M', 'L', 'TP'].map((avatar) => (
        <div key={avatar} className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#06100b] bg-gradient-to-br from-lime-200/80 to-emerald-500/45 text-xs font-black text-black">
          {avatar}
        </div>
      ))}
    </div>
  );
}

function App() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#020503] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_58%_8%,rgba(170,255,0,0.16),transparent_30rem),radial-gradient(circle_at_12%_34%,rgba(0,160,82,0.10),transparent_24rem),linear-gradient(180deg,#020503,#020503)]" />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />

      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#020503]/82 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
        <a href="/en/" className="flex items-center gap-2.5">
          <img src="/images/logo.png" alt="TP Club logo" width="36" height="36" className="h-9 w-9 rounded-xl shadow-[0_0_24px_rgba(170,255,0,0.18)]" />
          <span className="text-sm font-bold tracking-tight">TP Club</span>
        </a>
        <nav className="hidden items-center rounded-full border border-white/10 bg-white/[0.045] p-1 text-[0.72rem] font-semibold text-white/72 lg:flex">
          <a href="#proof" className="rounded-full px-4 py-2 transition hover:bg-lime-300/10 hover:text-lime-300">About</a>
          <a href="#how" className="rounded-full px-4 py-2 transition hover:bg-lime-300/10 hover:text-lime-300">How It Works</a>
          <a href="#education" className="rounded-full px-4 py-2 transition hover:bg-lime-300/10 hover:text-lime-300">Learn</a>
          <a href="#community" className="rounded-full px-4 py-2 transition hover:bg-lime-300/10 hover:text-lime-300">Community</a>
          <a href="/en/#faq" className="rounded-full px-4 py-2 transition hover:bg-lime-300/10 hover:text-lime-300">FAQ</a>
        </nav>
        <a href="/go/" onClick={(event) => handleTelegramClick(event, 'Join Free Community')} className="rounded-full bg-lime-300 px-4 py-2.5 text-[0.7rem] font-black text-black shadow-[0_0_34px_rgba(170,255,0,0.36)] transition hover:-translate-y-0.5 hover:bg-lime-200 hover:shadow-[0_0_46px_rgba(170,255,0,0.5)] sm:px-5">
          Join Free Community
        </a>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 pb-12 pt-10 sm:px-8 lg:min-h-[650px] lg:grid-cols-[0.86fr_1.14fr]">
        <motion.div className="relative z-10" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <p className="mb-5 inline-flex rounded-full border border-lime-300/20 bg-lime-300/8 px-4 py-2 text-[0.68rem] font-black uppercase tracking-[0.22em] text-lime-300">
            Mandarin-first · Education-only · Australia
          </p>
          <h1 className="max-w-xl text-[clamp(2.35rem,5.1vw,4.15rem)] font-black leading-[0.98] tracking-[-0.055em] text-white">
            The Beginner-Friendly <span className="text-lime-300">Crypto Education Community</span>
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-white/76 sm:text-base">
            Built for Chinese Australians. Daily crypto education, Mandarin-speaking support, beginner onboarding, and a private Telegram community focused on learning, not hype.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href="/go/" onClick={(event) => handleTelegramClick(event, 'Join Free Telegram Community')} className="group inline-flex items-center justify-center rounded-2xl bg-lime-300 px-7 py-4 text-sm font-black text-black shadow-[0_18px_58px_rgba(170,255,0,0.34)] transition hover:-translate-y-1 hover:bg-lime-200 hover:shadow-[0_24px_72px_rgba(170,255,0,0.46)]">
              Join Free Telegram Community
              <span className="ml-3 transition group-hover:translate-x-1">→</span>
            </a>
            <a href="#education" className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-6 py-4 text-sm font-bold text-white transition hover:border-lime-300/35 hover:text-lime-300">
              See What You Learn
            </a>
          </div>
          <p className="mt-3 text-xs font-medium text-white/58">No fees. No signals. Just real education and support.</p>
          <div className="mt-7 grid max-w-lg grid-cols-3 gap-2 text-[0.68rem] font-semibold text-white/72">
            <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">500+ members</span>
            <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">Mandarin & English</span>
            <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">Beginner friendly</span>
          </div>
        </motion.div>

        <div className="relative mx-auto w-full max-w-[620px] lg:max-w-none" id="community">
          <HeroCommunityMockup />
          <MobileFeatureCards />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-12 sm:px-8" id="proof">
        <div className="rounded-[1.8rem] border border-lime-300/14 bg-white/[0.035] p-4 backdrop-blur-xl">
          <p className="mb-4 text-center text-[0.65rem] font-black uppercase tracking-[0.24em] text-lime-300/85">
            A safe space to learn, grow, and level up together
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {safeSpace.map(([icon, title, text]) => (
              <div key={title} className="rounded-2xl border border-white/8 bg-black/28 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:-translate-y-1 hover:border-lime-300/24 hover:bg-lime-300/[0.045]">
                <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                  <Icon type={icon} />
                </div>
                <h3 className="text-sm font-bold">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-white/58">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[0.88fr_1.12fr]" id="education">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-300">What You Learn</p>
          <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.045em] sm:text-5xl">Practical Crypto Education For Real Life</h2>
          <p className="mt-5 text-white/58">Our lessons are designed for beginners who want education-first guidance, step by step.</p>
          <a href="/go/" onClick={(event) => handleTelegramClick(event, 'Join & Start Learning')} className="mt-8 inline-flex rounded-2xl border border-lime-300/28 bg-lime-300/8 px-5 py-3 text-sm font-bold text-lime-300 transition hover:bg-lime-300 hover:text-black">
            Join & Start Learning
          </a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {lessons.map(([title, text], index) => (
            <motion.article
              key={title}
              className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_52px_rgba(0,0,0,0.22)] transition hover:-translate-y-1 hover:border-lime-300/24 hover:bg-lime-300/[0.06]"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: index * 0.04 }}
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-lime-300/12 text-lime-300">
                <Icon type={index % 3 === 0 ? 'book' : index % 3 === 1 ? 'shield' : 'lock'} />
              </div>
              <h3 className="font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/50">{text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8" id="how">
        <div className="rounded-[1.9rem] border border-lime-300/16 bg-gradient-to-br from-lime-300/8 via-white/[0.035] to-black p-6 sm:p-8">
          <div className="mb-7 flex flex-col gap-2 text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-300">How It Works</p>
            <h2 className="text-3xl font-black tracking-[-0.04em]">3 Simple Steps To Get Started</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {steps.map(([icon, title, text], index) => (
              <div key={title} className="relative rounded-3xl border border-white/10 bg-black/28 p-5 shadow-[0_18px_52px_rgba(0,0,0,0.22)]">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-lime-300 text-black">
                  <Icon type={icon} />
                </div>
                <p className="text-sm font-black">{title}</p>
                <p className="mt-2 text-sm leading-6 text-white/58">{text}</p>
                {index < steps.length - 1 && <span className="absolute right-5 top-9 hidden text-lime-300/55 lg:block">→</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[0.72fr_1.28fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-300">Real Community · Real People</p>
          <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.045em]">You’re Not Alone On This Journey</h2>
          <p className="mt-5 text-white/58">Join hundreds of Chinese Australian learners sharing questions and building confidence through education together.</p>
          <div className="mt-7">
            <AvatarStack />
            <p className="mt-4 text-sm font-bold text-lime-300">500+ Active Members</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {communityCards.map(([label, author, text], index) => (
            <div key={label} className="min-h-44 rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[0.65rem] font-black uppercase tracking-[0.12em] text-white/42">{label}</span>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-lime-300/12 text-[0.55rem] font-black text-lime-300">TP</span>
              </div>
              <p className="text-xs font-bold text-lime-300">{author}</p>
              <p className="mt-2 text-sm leading-6 text-white/72">{text}</p>
              <div className="mt-4 h-14 rounded-xl border border-lime-300/12 bg-[linear-gradient(135deg,rgba(170,255,0,0.14),transparent),#07100b]" />
              <p className="mt-3 text-xs text-white/42">{['Like 24 · Hot 12', 'Thanks 7 · Saved 3', 'Watch 9 · Discuss 5', 'Learned 15 · Good 5'][index]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid overflow-hidden rounded-[2rem] border border-lime-300/14 bg-gradient-to-br from-lime-300/10 via-white/[0.04] to-black p-6 shadow-[0_28px_90px_rgba(0,0,0,0.45)] lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
          <div className="relative min-h-72 rounded-[1.7rem] border border-lime-300/13 bg-black/35 p-8">
            <div className="absolute inset-0 rounded-[1.7rem] bg-[radial-gradient(circle_at_50%_30%,rgba(170,255,0,0.18),transparent_18rem)]" />
            <div className="relative">
              <AvatarStack />
              <p className="mt-8 text-sm font-bold text-lime-300">500+ Active Members</p>
              <h3 className="mt-3 text-3xl font-black tracking-[-0.04em]">You Are Not Alone On This Journey</h3>
              <p className="mt-4 max-w-md text-white/56">Join hundreds of Chinese Australian learners asking questions, learning safely, and building confidence together.</p>
            </div>
          </div>
          <div className="flex flex-col justify-center p-2 lg:p-10">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-300">Take the first step</p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">Ready to Start Your Education Journey?</h2>
            <p className="mt-5 max-w-xl text-white/58">Join TP Club today, ask beginner questions, and access education designed for a supportive community.</p>
            <a href="/go/" onClick={(event) => handleTelegramClick(event, 'Join Free Telegram Community')} className="mt-8 inline-flex w-fit rounded-2xl bg-lime-300 px-7 py-4 text-sm font-black text-black transition hover:-translate-y-1 hover:bg-lime-200">
              Join Free Telegram Community →
            </a>
            <p className="mt-4 text-xs text-white/38">100% free. No scam. Education only.</p>
          </div>
        </div>
      </section>

      <footer className="mx-auto grid max-w-6xl gap-8 border-t border-white/8 px-5 py-8 text-sm text-white/48 sm:px-8 lg:grid-cols-[1.2fr_1fr_1fr_1.1fr]">
        <div>
          <div className="mb-4 flex items-center gap-2.5 text-white">
            <img src="/images/logo.png" alt="TP Club logo" width="32" height="32" className="h-8 w-8 rounded-xl" />
            <span className="font-bold">TP Club</span>
          </div>
          <p className="max-w-xs leading-6">A Mandarin-first education community for Chinese Australians. Learn together. Grow smarter.</p>
        </div>
        <div>
          <p className="mb-3 font-bold text-white">Community</p>
          <a href="/go/" onClick={(event) => handleTelegramClick(event, 'Telegram Group')} className="block py-1 hover:text-lime-300">Telegram Group</a>
          <a href="#community" className="block py-1 hover:text-lime-300">Learning Support</a>
          <a href="#proof" className="block py-1 hover:text-lime-300">Community Rules</a>
        </div>
        <div>
          <p className="mb-3 font-bold text-white">Resources</p>
          <a href="#education" className="block py-1 hover:text-lime-300">Beginner Guide</a>
          <a href="#education" className="block py-1 hover:text-lime-300">Risk Management</a>
          <a href="#how" className="block py-1 hover:text-lime-300">Education Library</a>
        </div>
        <div>
          <p className="mb-3 font-bold text-white">Follow & Join</p>
          <p className="leading-6">Join our Telegram community and start learning today.</p>
          <a href="/go/" onClick={(event) => handleTelegramClick(event, 'Join Free')} className="mt-4 inline-flex rounded-full bg-lime-300 px-4 py-2 text-xs font-black text-black">Join Free</a>
        </div>
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
