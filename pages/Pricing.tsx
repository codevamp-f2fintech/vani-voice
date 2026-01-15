
import React from 'react';
import { Card, Button, Badge } from '../components/UI';
import { Check, Info, Zap, Globe, Clock, ShieldCheck } from 'lucide-react';

const Pricing: React.FC = () => {
  const plans = [
    {
      name: "Starter",
      price: "₹0",
      desc: "For testing and hobby projects.",
      features: ["5 Minutes Free", "Hindi & English only", "1 Agent", "Standard Support"],
      button: "Current Plan",
      variant: "outline"
    },
    {
      name: "Pro",
      price: "₹2,500",
      period: "/mo + ₹5/min",
      desc: "For growing businesses and startups.",
      features: ["Unlimited Agents", "All Indian Languages", "Custom Webhooks", "Priority Support", "Call Recordings", "WhatsApp Integration"],
      button: "Upgrade to Pro",
      variant: "primary",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      desc: "For large scale automation and high volume.",
      features: ["Volume Discounts", "Dedicated Account Manager", "Custom Voice Training", "SLA Guarantee", "On-prem Deployment"],
      button: "Contact Sales",
      variant: "outline"
    }
  ];

  return (
    <div className="space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold dark:text-white tracking-tight">Simple Pricing. <span className="gradient-text">Built for India.</span></h1>
        <p className="text-gray-600 dark:text-gray-400">Scale your voice operations without complex contracts or hidden fees.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {plans.map((p, i) => (
          <Card key={i} className={`p-8 relative flex flex-col ${p.popular ? 'border-vani-plum ring-2 ring-vani-plum/20' : ''}`}>
            {p.popular && (
              <div className="absolute top-0 right-8 -translate-y-1/2">
                <Badge variant="info">Most Popular</Badge>
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-xl font-bold dark:text-white mb-1">{p.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold dark:text-white">{p.price}</span>
                {p.period && <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{p.period}</span>}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{p.desc}</p>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              {p.features.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <div className="shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-500">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            <Button variant={p.variant as any} className="w-full">
              {p.button}
            </Button>
          </Card>
        ))}
      </div>

      {/* Pay as you go details */}
      <Card className="p-8 vani-gradient text-white border-none shadow-xl">
        <div className="grid md:grid-cols-3 gap-8 divide-x divide-white/20">
          <div className="flex gap-4 px-4">
            <Clock size={32} className="shrink-0" />
            <div>
              <h4 className="font-bold mb-1">Pay-as-you-go</h4>
              <p className="text-xs text-white/70">Only pay for the exact seconds your agent spends on calls. No rounding up.</p>
            </div>
          </div>
          <div className="flex gap-4 px-4">
            <Zap size={32} className="shrink-0" />
            <div>
              <h4 className="font-bold mb-1">Instant Top-ups</h4>
              <p className="text-xs text-white/70">Add credits instantly via UPI, Cards or Netbanking. Automatic low-balance alerts.</p>
            </div>
          </div>
          <div className="flex gap-4 px-4">
            <ShieldCheck size={32} className="shrink-0" />
            <div>
              <h4 className="font-bold mb-1">Transparent Billing</h4>
              <p className="text-xs text-white/70">Detailed billing dashboard with per-call cost breakdown and usage forecasting.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Pricing;
