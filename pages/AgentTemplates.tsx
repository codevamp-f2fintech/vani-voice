
import React from 'react';
import { Card, Button, Badge } from '../components/UI';
import { 
  Stethoscope, 
  Building2, 
  Briefcase, 
  Landmark, 
  Hotel, 
  Headphones, 
  ArrowRight,
  Search,
  PlusCircle,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AgentTemplates: React.FC = () => {
  const navigate = useNavigate();
  const templates = [
    { 
      id: 'dr', 
      name: "Doctor Appointment", 
      icon: Stethoscope, 
      desc: "Handles patient scheduling, rescheduling, and common FAQ regarding clinic timings.",
      color: "bg-blue-500",
      tags: ["Medical", "Scheduling"]
    },
    { 
      id: 're', 
      name: "Real Estate Executive", 
      icon: Building2, 
      desc: "Qualified leads, schedules site visits, and shares property brochures via WhatsApp.",
      color: "bg-vani-plum",
      tags: ["Sales", "PropTech"]
    },
    { 
      id: 'loan', 
      name: "Loan Executive", 
      icon: Briefcase, 
      desc: "Checks eligibility, collects basic documentation details, and forwards to humans.",
      color: "bg-vani-pink",
      tags: ["FinTech", "Banking"]
    },
    { 
      id: 'coll', 
      name: "Collection Agent", 
      icon: Landmark, 
      desc: "Politely reminds customers of pending EMI payments and explains payment options.",
      color: "bg-vani-blue",
      tags: ["Recovery", "Finance"]
    },
    { 
      id: 'hotel', 
      name: "Hotel Booking", 
      icon: Hotel, 
      desc: "Manages room availability, check-in timings, and basic concierge service requests.",
      color: "bg-orange-500",
      tags: ["Hospitality", "Booking"]
    },
    { 
      id: 'recep', 
      name: "Virtual Receptionist", 
      icon: Headphones, 
      desc: "Answers business calls, takes messages, and filters spam calls efficiently.",
      color: "bg-green-500",
      tags: ["B2B", "Service"]
    },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black dark:text-white tracking-tight">Agent Templates</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Start from a proven template designed for the Indian market or create your own.</p>
        </div>
        <Button onClick={() => navigate('/agents/create')} className="shadow-2xl">
          <PlusCircle size={20} className="mr-2" /> Custom Agent
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            placeholder="Search templates (e.g. Sales, Medical)..."
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-vani-plum/20 outline-none dark:text-white text-base shadow-sm font-medium"
          />
        </div>
        <div className="flex gap-2 items-center">
          {['All', 'Sales', 'Support', 'Finance'].map(cat => (
            <button key={cat} className="px-6 py-3 rounded-2xl text-sm font-bold bg-white dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 hover:border-vani-plum transition-all text-gray-700 dark:text-gray-300 shadow-sm">
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* Create New Template Card */}
        <Card 
          className="p-8 flex flex-col items-center justify-center text-center border-4 border-dashed border-gray-100 dark:border-white/5 bg-transparent hover:border-vani-plum/40 hover:bg-vani-plum/5 duration-500 group cursor-pointer"
          onClick={() => navigate('/agents/create')}
        >
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-vani-plum group-hover:text-white transition-all mb-6">
            <PlusCircle size={40} />
          </div>
          <h3 className="text-2xl font-black dark:text-white mb-2">Blank Template</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium">Build an agent from scratch with your custom logic and voice.</p>
          <Button variant="ghost" className="font-bold text-vani-plum group-hover:translate-x-2 transition-transform">
            Start Building <ArrowRight size={18} className="ml-2" />
          </Button>
        </Card>

        {templates.map((t) => (
          <Card key={t.id} className="p-8 flex flex-col group border-2 shadow-lg">
            <div className="flex items-start justify-between mb-6">
              <div className={`p-4 rounded-3xl ${t.color} text-white shadow-xl shadow-gray-200 dark:shadow-none group-hover:scale-110 transition-transform`}>
                <t.icon size={32} />
              </div>
              <div className="flex flex-col items-end gap-2">
                {t.tags.map(tag => <Badge key={tag} className="text-[9px] font-black">{tag}</Badge>)}
              </div>
            </div>
            
            <h3 className="text-2xl font-black dark:text-white mb-3 tracking-tight">{t.name}</h3>
            <p className="text-base text-gray-500 dark:text-gray-400 mb-8 flex-1 leading-relaxed font-medium">
              {t.desc}
            </p>
            
            <Button 
              className="w-full justify-between h-14 text-lg"
              onClick={() => navigate('/agents/create')}
            >
              Use Template <ArrowRight size={20} />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AgentTemplates;
