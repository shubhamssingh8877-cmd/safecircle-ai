import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Navigation,
  Compass,
  AlertTriangle,
  Users,
  CheckCircle2,
  Lock,
  ArrowRight,
  Radio,
  Sparkles,
  PhoneCall,
  Activity,
  HeartHandshake,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';

export const LandingPage: React.FC = () => {
  const safetyFeatures = [
    {
      icon: <Navigation className="w-6 h-6 text-brand-600 dark:text-brand-400" />,
      title: 'Predictive Route Deviation Guard',
      description:
        'Continuous geospatial cross-track monitoring compares your live GPS against your planned road corridor. If you veer off track or halt unexpectedly, SafeCircle checks in before escalating.',
    },
    {
      icon: <Activity className="w-6 h-6 text-safe-600 dark:text-safe-400" />,
      title: 'Zero-Friction Scheduled Check-Ins',
      description:
        'Customizable periodic safety prompts. Confirm you are safe with a single tap or snooze when delayed. Overdue pings trigger automated escalation.',
    },
    {
      icon: <Users className="w-6 h-6 text-brand-600 dark:text-brand-400" />,
      title: 'Tiered Trusted Circle Escalation',
      description:
        'Multilevel guardian response: Tier 1 SMS alert, Tier 2 automated call to primary guardian, Tier 3 dispatch coordination with nearby verified safe havens.',
    },
    {
      icon: <Compass className="w-6 h-6 text-warning-600 dark:text-warning-400" />,
      title: 'AI Route Intelligence & Risk Radar',
      description:
        'Contextual route safety scoring powered by Google Gemini and crowd-sourced observations on lighting, infrastructure, and pedestrian density.',
    },
  ];

  const workflowSteps = [
    {
      number: '01',
      title: 'Set Your Destination & Trusted Circle',
      description: 'Enter your destination, select transport mode (Walking, Transit, Rideshare), and pick which guardians watch over this trip.',
    },
    {
      number: '02',
      title: 'AI Monitors Your Corridor Silently',
      description: 'The background radar tracks route deviation, evaluates local hazard signals, and handles scheduled safety check-ins automatically.',
    },
    {
      number: '03',
      title: 'Instant Escrow Escalation When Needed',
      description: 'If you deviate or miss a check-in, SafeCircle activates high-priority audio beacon sirens and provides 1-tap guardian/dispatch calling.',
    },
  ];

  return (
    <div className="space-y-24 py-12 md:py-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/80 text-brand-700 dark:text-brand-300 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Smart India Hackathon 2024 Finalist Build</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-surface-900 dark:text-surface-50 max-w-4xl mx-auto leading-none">
          Never walk alone with{' '}
          <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-teal-500 bg-clip-text text-transparent">
            Autonomous Safety AI
          </span>
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-surface-600 dark:text-surface-300 max-w-2xl mx-auto leading-relaxed">
          The intelligent travel companion that monitors route deviations, handles autonomous safety check-ins, and escalates to your trusted circle in emergencies.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link to="/journey" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" icon={<Navigation className="w-5 h-5" />} className="w-full sm:w-auto shadow-lg shadow-brand-500/25">
              Start Guarded Journey
            </Button>
          </Link>
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" icon={<ArrowRight className="w-5 h-5" />} iconPosition="right" className="w-full sm:w-auto">
              View Guardian Desk
            </Button>
          </Link>
        </div>

        {/* Live Telemetry Ticker Preview */}
        <div className="pt-8 max-w-3xl mx-auto">
          <div className="p-4 rounded-2xl bg-surface-100/80 dark:bg-surface-900/80 border border-surface-200 dark:border-surface-800 shadow-sm backdrop-blur-xs flex flex-wrap items-center justify-around gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-safe-500 animate-pulse" />
              <span className="text-surface-500">Geospatial Engine:</span>
              <span className="font-semibold text-safe-600 dark:text-safe-400">OSRM Road Router</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              <span className="text-surface-500">AI Intelligence:</span>
              <span className="font-semibold text-brand-600 dark:text-brand-400">Gemini 2.5 Flash</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-safe-500" />
              <span className="text-surface-500">Emergency Siren:</span>
              <span className="font-semibold text-surface-900 dark:text-surface-100">Web Audio API</span>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Pillars Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
            Engineered for Real-World Personal Safety
          </h2>
          <p className="text-sm sm:text-base text-surface-600 dark:text-surface-400">
            Unlike basic location sharing apps, SafeCircle actively safeguards your corridor with intelligent autonomous triggers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {safetyFeatures.map((feat, idx) => (
            <Card key={idx} variant="elevated" className="border-surface-200 dark:border-surface-800 hover:border-brand-500/40 transition-all duration-200">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center shadow-2xs">
                  {feat.icon}
                </div>
                <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100 leading-snug">
                  {feat.title}
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
                  {feat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Workflow Section */}
      <section className="bg-surface-100/60 dark:bg-surface-900/40 border-y border-surface-200 dark:border-surface-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
              How SafeCircle AI Protects Your Journey
            </h2>
            <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400">
              Three seamless steps to complete peace of mind while traveling solo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {workflowSteps.map((step, idx) => (
              <div key={idx} className="relative p-6 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm space-y-3">
                <div className="text-3xl font-black font-mono text-brand-600 dark:text-brand-400 opacity-80">
                  {step.number}
                </div>
                <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
                  {step.title}
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Privacy Guarantee Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-tr from-brand-900 via-surface-900 to-surface-950 text-white border border-brand-500/20 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-6">
            <Badge variant="brand" size="sm" className="bg-white/20 text-white border-white/30">
              Privacy-First Architecture
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Zero third-party tracking. Total data sovereignty.
            </h2>
            <p className="text-xs sm:text-sm text-surface-300 leading-relaxed">
              SafeCircle operates entirely client-side with local persistence. Your live location and medical notes are only shared with your explicitly chosen emergency circle during an active journey or verified emergency.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/journey">
                <Button variant="primary" size="md" className="bg-white text-surface-900 hover:bg-surface-100 font-bold shadow-md">
                  Launch Safe Journey
                </Button>
              </Link>
              <Link to="/risk-map">
                <Button variant="outline" size="md" className="text-white border-white/40 hover:bg-white/10">
                  Explore Contextual Risk Map
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
