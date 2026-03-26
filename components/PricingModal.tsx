import React, { useState } from 'react';
import { Zap, Shield, Check, X, Loader2 } from 'lucide-react';
import type { SubscriptionStatus } from '../services/stripeService';

interface PricingModalProps {
  onClose: () => void;
  onUpgrade: (priceId: string) => Promise<void>;
  onManage: () => Promise<void>;
  subscription: SubscriptionStatus;
}

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/forever',
    features: [
      '3 analyses per day',
      'AI code intelligence',
      'Architecture blueprint',
      'Security audit',
      'PR review (limited)',
    ],
    missing: ['Unlimited analyses', 'Team workspaces', 'Priority support', 'Export to PDF'],
    cta: 'Current Plan',
    priceId: null,
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
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
    missing: [],
    cta: 'Upgrade to Pro',
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || 'price_pro_placeholder',
    highlight: true,
  },
];

const PricingModal: React.FC<PricingModalProps> = ({ onClose, onUpgrade, onManage, subscription }) => {
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async (priceId: string) => {
    setUpgrading(true);
    try {
      await onUpgrade(priceId);
    } catch {
      setUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in fade-in scale-95 duration-300">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-white">Choose Your Plan</h2>
            <p className="text-slate-400 text-sm mt-1">Unlock the full power of GitMind Pro</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PLANS.map((plan) => {
            const isCurrentPlan =
              (plan.name === 'Free' && !subscription.isActive) ||
              (plan.name === 'Pro' && subscription.plan === 'pro' && subscription.isActive);

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 border ${
                  plan.highlight
                    ? 'border-indigo-500 bg-indigo-950/30'
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
                    {plan.name === 'Free' ? (
                      <Shield className="w-5 h-5 text-slate-400" />
                    ) : (
                      <Zap className="w-5 h-5 text-indigo-400" />
                    )}
                    <h3 className="text-lg font-black text-white">{plan.name}</h3>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">{plan.price}</span>
                    <span className="text-slate-500 text-sm">{plan.period}</span>
                  </div>
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
                  subscription.isActive && plan.name === 'Pro' ? (
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
                ) : plan.priceId ? (
                  <button
                    onClick={() => void handleUpgrade(plan.priceId!)}
                    disabled={upgrading}
                    className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {upgrading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Redirecting...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" /> {plan.cta}
                      </>
                    )}
                  </button>
                ) : null}
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
