import React, { useState } from 'react';
import { Zap, Shield, Users, Check, X, Loader2, AlertTriangle } from 'lucide-react';

const STRIPE_CONFIGURED =
  import.meta.env.VITE_STRIPE_PRO_PRICE_ID &&
  !import.meta.env.VITE_STRIPE_PRO_PRICE_ID.includes('placeholder');
import type { SubscriptionStatus } from '../services/stripeService';

interface PricingModalProps {
  onClose: () => void;
  onUpgrade: (priceId: string, trial?: boolean) => Promise<void>;
  onManage: () => Promise<void>;
  subscription: SubscriptionStatus;
}

type BillingInterval = 'monthly' | 'annual';

const PLANS = [
  {
    name: 'Free',
    monthly: { price: '$0', priceId: null },
    annual: { price: '$0', priceId: null },
    period: { monthly: '/forever', annual: '/forever' },
    icon: 'shield' as const,
    features: [
      '3 analyses per day',
      'AI code intelligence',
      'Architecture blueprint',
      'Security audit',
      'PR review (limited)',
    ],
    missing: ['Unlimited analyses', 'Team workspaces', 'Priority support', 'Export to PDF'],
    cta: 'Current Plan',
    highlight: false,
    trial: false,
    savings: null,
  },
  {
    name: 'Pro',
    monthly: {
      price: '$9',
      priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || 'price_pro_placeholder',
    },
    annual: {
      price: '$79',
      priceId: import.meta.env.VITE_STRIPE_PRO_ANNUAL_PRICE_ID || 'price_pro_annual_placeholder',
    },
    period: { monthly: '/month', annual: '/year' },
    icon: 'zap' as const,
    features: [
      'Unlimited analyses',
      'AI code intelligence',
      'Architecture blueprint',
      'Deep security audit',
      'Unlimited PR reviews',
      'Export to PDF',
      'Analysis history',
      'Priority support',
    ],
    missing: ['Team workspaces', 'Shared analysis history', 'Team analytics'],
    cta: 'Start 7-Day Free Trial',
    highlight: true,
    trial: true,
    savings: 'Save $29/yr',
  },
  {
    name: 'Team',
    monthly: {
      price: '$49',
      priceId: import.meta.env.VITE_STRIPE_TEAM_PRICE_ID || 'price_team_placeholder',
    },
    annual: {
      price: '$399',
      priceId: import.meta.env.VITE_STRIPE_TEAM_ANNUAL_PRICE_ID || 'price_team_annual_placeholder',
    },
    period: { monthly: '/month', annual: '/year' },
    icon: 'users' as const,
    features: [
      'Everything in Pro',
      'Up to 25 team members',
      'Shared workspaces',
      'Shared analysis history',
      'Team PR review queue',
      'Team analytics dashboard',
      'Workspace invite links',
      'Admin & member roles',
      'Priority support',
    ],
    missing: [],
    cta: 'Upgrade to Team',
    highlight: false,
    trial: false,
    savings: 'Save $189/yr',
  },
];

const ICON_MAP = {
  shield: Shield,
  zap: Zap,
  users: Users,
};

const PricingModal: React.FC<PricingModalProps> = ({ onClose, onUpgrade, onManage, subscription }) => {
  const [upgrading, setUpgrading] = useState(false);
  const [interval, setInterval] = useState<BillingInterval>('monthly');

  const handleUpgrade = async (priceId: string, trial?: boolean) => {
    setUpgrading(true);
    try {
      await onUpgrade(priceId, trial);
    } catch {
      setUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-4xl w-full shadow-2xl animate-in fade-in scale-95 duration-300">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-white">Choose Your Plan</h2>
            <p className="text-slate-400 text-sm mt-1">Unlock the full power of GitMind Pro</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!STRIPE_CONFIGURED && (
          <div className="mb-6 flex items-start gap-3 px-4 py-3 bg-amber-950/60 border border-amber-500/40 rounded-2xl text-amber-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span><strong className="text-amber-200">Stripe not configured.</strong> Set <code className="font-mono bg-amber-950 px-1 rounded">VITE_STRIPE_PRO_PRICE_ID</code> (and team/annual variants) in your Vercel environment variables to enable payments.</span>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className={`text-sm font-bold transition-colors ${interval === 'monthly' ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
          <button
            onClick={() => setInterval(prev => prev === 'monthly' ? 'annual' : 'monthly')}
            className={`relative w-14 h-7 rounded-full transition-colors ${interval === 'annual' ? 'bg-emerald-600' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${interval === 'annual' ? 'translate-x-7' : 'translate-x-0.5'}`} />
          </button>
          <span className={`text-sm font-bold transition-colors ${interval === 'annual' ? 'text-white' : 'text-slate-500'}`}>Annual</span>
          {interval === 'annual' && (
            <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full">
              Save 27%
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrentPlan =
              (plan.name === 'Free' && !subscription.isActive) ||
              (plan.name === 'Pro' && subscription.plan === 'pro' && subscription.isActive) ||
              (plan.name === 'Team' && subscription.plan === 'team' && subscription.isActive);

            const IconComponent = ICON_MAP[plan.icon];
            const currentPricing = plan[interval];
            const currentPeriod = plan.period[interval];

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 border ${
                  plan.highlight
                    ? 'border-indigo-500 bg-indigo-950/30'
                    : plan.name === 'Team'
                    ? 'border-violet-500/50 bg-violet-950/20'
                    : 'border-slate-800 bg-slate-950'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest text-white">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <IconComponent className={`w-5 h-5 ${plan.name === 'Free' ? 'text-slate-400' : plan.name === 'Team' ? 'text-violet-400' : 'text-indigo-400'}`} />
                    <h3 className="text-lg font-black text-white">{plan.name}</h3>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">{currentPricing.price}</span>
                    <span className="text-slate-500 text-sm">{currentPeriod}</span>
                  </div>
                  {interval === 'annual' && plan.name !== 'Free' && (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-emerald-400 text-xs font-bold">{plan.savings}</span>
                      <span className="text-slate-600 text-xs">
                        ({plan.name === 'Pro' ? '$6.58' : '$33.25'}/mo effective)
                      </span>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <X className="w-4 h-4 text-slate-700 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  subscription.isActive && (plan.name === 'Pro' || plan.name === 'Team') ? (
                    <button
                      onClick={() => void onManage()}
                      className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all"
                    >
                      Manage Subscription
                    </button>
                  ) : (
                    <div className="w-full px-4 py-3 bg-slate-800 text-slate-400 font-black rounded-2xl text-xs uppercase tracking-widest text-center">
                      Current Plan
                    </div>
                  )
                ) : currentPricing.priceId ? (
                  <button
                    onClick={() => void handleUpgrade(currentPricing.priceId!, plan.trial)}
                    disabled={upgrading || !STRIPE_CONFIGURED || currentPricing.priceId.includes('placeholder')}
                    className={`w-full px-4 py-3 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                      plan.name === 'Team' ? 'bg-violet-600 hover:bg-violet-500' : 'bg-indigo-600 hover:bg-indigo-500'
                    }`}
                  >
                    {upgrading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Redirecting...
                      </>
                    ) : (
                      <>
                        <IconComponent className="w-4 h-4" /> {plan.cta}
                      </>
                    )}
                  </button>
                ) : null}

                {plan.trial && !isCurrentPlan && (
                  <p className="text-[10px] text-indigo-400 text-center mt-2 font-semibold">No charge for 7 days — cancel anytime</p>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-slate-500 text-center mt-6">
          Secure payments powered by Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  );
};

export default PricingModal;
