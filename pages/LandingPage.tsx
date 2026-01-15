
import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../components/UI';
import { 
  Mic2, 
  Zap, 
  Languages, 
  PieChart, 
  ArrowRight, 
  Stethoscope, 
  Building2, 
  Briefcase, 
  Hotel, 
  Headphones, 
  Landmark,
  Sun,
  Moon,
  Rocket,
  ShieldCheck
} from 'lucide-react';
import { AppTheme } from '../types';

interface LandingPageProps {
  theme?: AppTheme;
  toggleTheme?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ theme, toggleTheme }) => {
  const features = [
    { icon: Languages, title: "Multi-Language Agents", desc: "Fluent in English, Hindi, and 12+ regional Indian dialects." },
    { icon: Zap, title: "Zero Latency", desc: "Human-like response times (<500ms) for natural conversations." },
    { icon: Mic2, title: "Real-time Voice Testing", desc: "Test your agents instantly within the browser before deploying." },
    { icon: PieChart, title: "Deep Analytics", desc: "Full transcripts, call recordings, and sentiment analysis." },
    { icon: Landmark, title: "Affordable Pricing", desc: "Built for Bharat. Start as low as ₹5/min with pay-as-you-go." },
    { icon: ShieldCheck, title: "Enterprise Security", desc: "Bank-grade encryption and data privacy tailored for Indian compliance." },
  ];

  const useCases = [
    { icon: Stethoscope, title: "Doctor Appointment Agent", color: "text-vani-blue" },
    { icon: Building2, title: "Real Estate Executive", color: "text-vani-plum" },
    { icon: Briefcase, title: "Loan & Finance Agent", color: "text-vani-pink" },
    { icon: Landmark, title: "Collections Agent", color: "text-vani-blue" },
    { icon: Hotel, title: "Hotel Booking Agent", color: "text-vani-plum" },
    { icon: Headphones, title: "Virtual Receptionist", color: "text-vani-pink" },
  ];

  return (
    <div className="flex flex-col min-h-screen text-gray-900 dark:text-gray-100">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12 fixed w-full top-0 z-50 bg-vani-light/80 dark:bg-vani-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg vani-gradient flex items-center justify-center text-white font-bold">V</div>
          <span className="text-xl font-bold tracking-tight dark:text-white">Vani</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
          <a href="#features" className="hover:text-vani-plum transition-colors">Features</a>
          <a href="#usecases" className="hover:text-vani-plum transition-colors">Use Cases</a>
          <Link to="/pricing" className="hover:text-vani-plum transition-colors">Pricing</Link>
          <a href="#" className="hover:text-vani-plum transition-colors">Docs</a>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-vani-plum hidden sm:block">Login</Link>
          <Link to="/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[800px] bg-gradient-to-b from-vani-blue/20 via-vani-pink/10 to-transparent blur-[120px] -z-10" />
        
        <div className="max-w-6xl mx-auto text-center space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-vani-plum/10 text-vani-plum dark:text-vani-pink text-xs font-bold border border-vani-plum/20">
            <Rocket size={14} className="animate-pulse" />
            Vani 2.0: Now with 12+ Regional Indian Languages
          </div>
          
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter dark:text-white leading-[0.9] text-balance">
            Build <span className="gradient-text">Human-Like</span> Voice AI Agents in Minutes
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed font-medium">
            The only enterprise-grade platform built specifically for the Indian accent and culture.
            Deploy AI agents for support, sales, and collections starting at <span className="text-gray-900 dark:text-white font-bold underline decoration-vani-plum underline-offset-4">₹5/min</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto h-16 px-10 text-lg shadow-2xl">
                Get Started for Free <ArrowRight className="ml-2" size={24} />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-16 px-10 text-lg border-2">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 bg-white dark:bg-[#080809] border-y border-gray-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-6xl font-black dark:text-white tracking-tight">Enterprise-Ready <span className="gradient-text">Features</span></h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Everything you need to automate your voice interactions at scale.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <Card key={i} className="p-10 group hover:-translate-y-2 duration-300 bg-gray-50/50 dark:bg-white/5">
                <div className="w-16 h-16 rounded-2xl vani-gradient/10 flex items-center justify-center text-vani-plum mb-8 group-hover:scale-110 transition-transform bg-vani-plum/10">
                  <f.icon size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4 dark:text-white">{f.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="usecases" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-black dark:text-white tracking-tight">Built for <span className="gradient-text">Bharat</span></h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Deploy ready-to-use templates for common Indian business scenarios.</p>
            </div>
            <Link to="/templates">
              <Button variant="ghost" className="text-vani-plum font-bold hover:bg-vani-plum/5">Explore All Templates <ArrowRight className="ml-2" size={16} /></Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {useCases.map((uc, i) => (
              <Card key={i} className="p-10 flex flex-col items-center text-center gap-6 hover:border-vani-plum/50 border-2">
                <div className="p-4 rounded-full bg-gray-50 dark:bg-white/5">
                  <uc.icon size={48} className={uc.color} />
                </div>
                <h3 className="font-bold text-lg md:text-xl dark:text-gray-200">{uc.title}</h3>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-20 border-t border-gray-200 dark:border-white/10 px-6 lg:px-12 bg-gray-50 dark:bg-vani-dark">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-16 mb-20">
          <div className="space-y-6 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl vani-gradient flex items-center justify-center text-white font-bold text-xl">V</div>
              <span className="text-2xl font-bold tracking-tight dark:text-white">Vani</span>
            </div>
            <p className="text-base text-gray-500 dark:text-gray-400 font-medium">
              <span className="bg-vani-plum/10 dark:bg-vani-plum/20 px-2 py-1 rounded text-vani-plum dark:text-vani-pink font-bold">Building the future of voice interactions for Bharat.</span>
            </p>
            <p className="text-xs text-gray-400 font-medium pt-4">© 2024 Vani Voice AI. All rights reserved.</p>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Platform</h4>
            <ul className="space-y-4 text-sm font-medium text-gray-600 dark:text-gray-400">
              <li><Link to="/templates" className="hover:text-vani-plum transition-colors">Templates</Link></li>
              <li><Link to="/pricing" className="hover:text-vani-plum transition-colors">Pricing</Link></li>
              <li><a href="#" className="hover:text-vani-plum transition-colors">API Docs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Company</h4>
            <ul className="space-y-4 text-sm font-medium text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-vani-plum transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-vani-plum transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-vani-plum transition-colors">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Support</h4>
            <ul className="space-y-4 text-sm font-medium text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-vani-plum transition-colors">Contact Sales</a></li>
              <li><a href="#" className="hover:text-vani-plum transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-vani-plum transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
