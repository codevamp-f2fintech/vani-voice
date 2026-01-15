
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, Input, Label } from '../components/UI';
import { Mail, Lock, Chrome, ArrowRight, Github, Loader2 } from 'lucide-react';

const Auth: React.FC<{ mode: 'login' | 'signup' }> = ({ mode }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-vani-light dark:bg-vani-dark relative overflow-hidden text-gray-900 dark:text-gray-100">
      {/* Decorative Gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-vani-plum/20 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-vani-blue/20 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-2xl vani-gradient flex items-center justify-center text-white font-black text-2xl shadow-xl">V</div>
            <span className="text-3xl font-black tracking-tighter dark:text-white">Vani</span>
          </Link>
          <h1 className="text-4xl font-black dark:text-white tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {mode === 'login' ? 'Enter any details to explore the platform.' : 'Join the future of voice AI for Bharat today.'}
          </p>
        </div>

        <Card className="p-10 border-2 shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input type="email" placeholder="amit@startup.in" className="pl-12 h-14 text-base font-bold" />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="mb-0">Password</Label>
                {mode === 'login' && <a href="#" className="text-xs font-black text-vani-plum hover:text-vani-pink transition-colors uppercase tracking-widest">Forgot?</a>}
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input type="password" placeholder="••••••••" className="pl-12 h-14 text-base font-bold" />
              </div>
            </div>

            <Button className="w-full h-16 text-lg shadow-xl" type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>{mode === 'login' ? 'Sign In' : 'Get Started'} <ArrowRight size={20} className="ml-2" /></>
              )}
            </Button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-gray-100 dark:border-white/5" /></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em]"><span className="bg-white dark:bg-[#121214] px-4 text-gray-400">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-3 py-4 px-4 rounded-2xl border-2 border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-sm font-black dark:text-gray-300 shadow-sm group">
              <Chrome size={20} className="group-hover:scale-110 transition-transform" /> Google
            </button>
            <button className="flex items-center justify-center gap-3 py-4 px-4 rounded-2xl border-2 border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-sm font-black dark:text-gray-300 shadow-sm group">
              <Github size={20} className="group-hover:scale-110 transition-transform" /> GitHub
            </button>
          </div>
        </Card>

        <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-400">
          {mode === 'login' ? (
            <>Don't have an account? <Link to="/signup" className="text-vani-plum font-black hover:underline decoration-2">Sign up for free</Link></>
          ) : (
            <>Already have an account? <Link to="/login" className="text-vani-plum font-black hover:underline decoration-2">Log in</Link></>
          )}
        </p>
      </div>
    </div>
  );
};

export default Auth;
