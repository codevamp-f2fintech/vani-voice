import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, Input, Label } from '../components/UI';
import { Mail, Lock, Chrome, ArrowRight, Github, Loader2, User, Phone, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Auth: React.FC<{ mode: 'login' | 'signup' }> = ({ mode }) => {
  const navigate = useNavigate();
  const { login, register, isLoading, error, clearError, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when switching modes
  useEffect(() => {
    clearError();
    setValidationError(null);
    setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  }, [mode, clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setValidationError(null);
  };

  const validateForm = (): boolean => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }

    // Password validation
    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return false;
    }

    // Signup specific validation
    if (mode === 'signup') {
      if (!formData.name.trim()) {
        setValidationError('Name is required');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setValidationError('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    let success = false;

    if (mode === 'login') {
      success = await login(formData.email, formData.password);
    } else {
      success = await register(
        formData.email,
        formData.password,
        formData.name,
        formData.phone || undefined
      );
    }

    if (success) {
      navigate('/dashboard');
    }
  };

  const displayError = validationError || error;

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
            {mode === 'login' ? 'Log in to access your Voice AI dashboard.' : 'Join the future of voice AI for Bharat today.'}
          </p>
        </div>

        <Card className="p-10 border-2 shadow-2xl">
          {/* Error Display */}
          {displayError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{displayError}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name Field - Only for signup */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label>Full Name</Label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Amit Sharma"
                    className="pl-12 h-14 text-base font-bold"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="amit@startup.in"
                  className="pl-12 h-14 text-base font-bold"
                />
              </div>
            </div>

            {/* Phone Field - Only for signup */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label>Phone Number (Optional)</Label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="pl-12 h-14 text-base font-bold"
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="mb-0">Password</Label>
                {mode === 'login' && <a href="#" className="text-xs font-black text-vani-plum hover:text-vani-pink transition-colors uppercase tracking-widest">Forgot?</a>}
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="pl-12 pr-12 h-14 text-base font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password - Only for signup */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="pl-12 h-14 text-base font-bold"
                  />
                </div>
              </div>
            )}

            <Button className="w-full h-16 text-lg shadow-xl" type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={20} className="ml-2" /></>
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
