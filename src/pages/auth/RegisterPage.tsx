import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import {
  UserPlus,
  AlertCircle,
  School,
  User,
  Lock,
  Hash,
  Phone,
  MessageCircle,
  Mail,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sameAsWhatsapp, setSameAsWhatsapp] = useState(true);
  const [password, setPassword] = useState('');
  const [school, setSchool] = useState('');
  const [provinceId, setProvinceId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [alYear, setAlYear] = useState('2027 A/L');
  const [institute, setInstitute] = useState('Online');

  const [categories, setCategories] = useState<any[]>([]);
  const [institutes, setInstitutes] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<any[]>([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/meta/provinces').then((res) => setProvinces(res.data.data)).catch(() => {});
    api.get('/meta/districts').then((res) => setDistricts(res.data.data)).catch(() => {});
    api.get('/meta/categories').then((res) => {
      const cats = res.data?.data || [];
      setCategories(cats);
      if (cats.length > 0 && !cats.some((c: any) => c.name === '2027 A/L')) {
        setAlYear(cats[0].name);
      }
    }).catch(() => {});
    api.get('/meta/institutes').then((res) => {
      const insts = res.data?.data || [];
      setInstitutes(insts);
      if (insts.length > 0) {
        setInstitute(insts[0].name);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (provinceId) {
      setFilteredDistricts(districts.filter((d) => d.provinceId === provinceId));
    } else {
      setFilteredDistricts([]);
    }
    setDistrictId('');
  }, [provinceId, districts]);

  const isValidSriLankanPhone = (num: string): boolean => {
    const cleaned = num.replace(/[\s\-()]/g, '');
    const slRegex = /^(?:0|94|\+94)?7[0-9]{8}$/;
    return slRegex.test(cleaned);
  };

  const handleWhatsappChange = (val: string) => {
    setWhatsappNumber(val);
    if (sameAsWhatsapp) {
      setPhoneNumber(val);
    }
  };

  const handleToggleSameAsWhatsapp = (checked: boolean) => {
    setSameAsWhatsapp(checked);
    if (checked) {
      setPhoneNumber(whatsappNumber);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    // Validate WhatsApp Number
    if (!whatsappNumber || !whatsappNumber.trim()) {
      setError('Please enter your WhatsApp contact number.');
      return;
    }
    if (!isValidSriLankanPhone(whatsappNumber)) {
      setError('Please enter a valid phone number (e.g. 0771234567 or +94771234567).');
      return;
    }

    // Validate SMS Contact Number
    const effectiveSmsPhone = (sameAsWhatsapp ? whatsappNumber : phoneNumber).trim();
    if (!effectiveSmsPhone) {
      setError('Please enter your contact number for SMS.');
      return;
    }
    if (!isValidSriLankanPhone(effectiveSmsPhone)) {
      setError('Please enter a valid SMS contact number (e.g. 0771234567 or +94771234567).');
      return;
    }

    if (!alYear || !alYear.trim()) {
      setError('Please select your examination batch / category.');
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        whatsappNumber: whatsappNumber.trim(),
        phoneNumber: effectiveSmsPhone,
        username: username.trim().toLowerCase(),
        password,
        school: school.trim(),
        alYear: alYear.trim(),
        institute: institute.trim(),
        provinceId,
        districtId,
      });
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || sessionStorage.getItem('quizRedirect');
      sessionStorage.removeItem('quizRedirect');
      if (redirect && redirect.startsWith('/student/')) {
        navigate(redirect);
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check all details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 relative overflow-hidden font-sans">
      {/* Background glow decoration */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full dark:bg-slate-900/85 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-xl shadow-slate-900/5 dark:shadow-2xl border dark:border-slate-800/90 border-slate-200/90 p-8 space-y-6 relative z-10">
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/25 border border-blue-400/30 mx-auto">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black dark:text-white text-slate-900 font-display tracking-tight">
              Create Student Account
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Register to participate in online examinations, timed assessments, and view your performance rankings
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl flex items-start gap-3 text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name & Username */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="reg-full-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-4 py-2.5 dark:bg-slate-950/60 bg-white border dark:border-slate-800 border-slate-300 rounded-xl dark:text-slate-100 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Username / Login ID *
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="reg-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. johndoe2026"
                  className="w-full pl-10 pr-4 py-2.5 dark:bg-slate-950/60 bg-white border dark:border-slate-800 border-slate-300 rounded-xl dark:text-slate-100 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. student@example.com"
                className="w-full pl-10 pr-4 py-2.5 dark:bg-slate-950/60 bg-white border dark:border-slate-800 border-slate-300 rounded-xl dark:text-slate-100 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Contact Numbers: WhatsApp & SMS Contact */}
          <div className="p-4 dark:bg-slate-950/70 bg-slate-50 rounded-2xl border dark:border-slate-800 border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-blue-500" />
                Contact Information
              </span>
              <span className="text-[10px] text-blue-500 font-semibold font-mono">07X XXX XXXX</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* WhatsApp Number */}
              <div>
                <label htmlFor="reg-whatsapp-number" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  WhatsApp Number *
                </label>
                <div className="relative">
                  <MessageCircle className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3.5" />
                  <input
                    id="reg-whatsapp-number"
                    type="tel"
                    required
                    value={whatsappNumber}
                    onChange={(e) => handleWhatsappChange(e.target.value)}
                    placeholder="077 123 4567"
                    className="w-full pl-10 pr-4 py-2.5 dark:bg-slate-900/90 bg-white border dark:border-slate-800 border-slate-300 rounded-xl dark:text-slate-100 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <span className="text-slate-400 text-[10px] block mt-1">Used for exam links &amp; notifications</span>
              </div>

              {/* Contact Number for SMS */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="reg-sms-number" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Contact Number for SMS *
                  </label>
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-blue-500 absolute left-3.5 top-3.5" />
                  <input
                    id="reg-sms-number"
                    type="tel"
                    required
                    value={sameAsWhatsapp ? whatsappNumber : phoneNumber}
                    disabled={sameAsWhatsapp}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="077 123 4567"
                    className="w-full pl-10 pr-4 py-2.5 dark:bg-slate-900/90 bg-white border dark:border-slate-800 border-slate-300 rounded-xl dark:text-slate-100 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  />
                </div>
                <label className="flex items-center gap-2 mt-2 cursor-pointer text-[11px] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white select-none">
                  <input
                    id="reg-same-as-whatsapp-checkbox"
                    type="checkbox"
                    checked={sameAsWhatsapp}
                    onChange={(e) => handleToggleSameAsWhatsapp(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                  />
                  <span>Same as WhatsApp number</span>
                </label>
              </div>
            </div>
          </div>

          {/* Password & School */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="reg-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 dark:bg-slate-950/60 bg-white border dark:border-slate-800 border-slate-300 rounded-xl dark:text-slate-100 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                School / Educational Institute *
              </label>
              <div className="relative">
                <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="reg-school"
                  type="text"
                  required
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="e.g. Central College"
                  className="w-full pl-10 pr-4 py-2.5 dark:bg-slate-950/60 bg-white border dark:border-slate-800 border-slate-300 rounded-xl dark:text-slate-100 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Batch / Category Section */}
          <div className="p-4 dark:bg-slate-950/70 bg-slate-50 rounded-2xl border dark:border-slate-800 border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-500" />
                Batch / Category *
              </label>
              <span className="text-[10px] text-blue-500 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Select Category
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {(categories.length > 0 ? categories : [
                { _id: '1', name: '2026 A/L' },
                { _id: '2', name: '2027 A/L' },
                { _id: '3', name: '2028 A/L' },
                { _id: '4', name: '2029 A/L' },
              ]).map((cat: any) => {
                const isSelected = alYear === cat.name;
                return (
                  <button
                    key={cat._id || cat.name}
                    type="button"
                    onClick={() => setAlYear(cat.name)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 border border-blue-400/40 scale-[1.02]'
                        : 'dark:bg-slate-900/90 bg-white text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white dark:hover:bg-slate-800 hover:bg-slate-100 border dark:border-slate-800 border-slate-200'
                    }`}
                  >
                    <span>🎓</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400">
              Select your examination batch. Categories are configured by the administrator.
            </p>
          </div>

          {/* Institute Section */}
          <div className="p-4 dark:bg-slate-950/70 bg-slate-50 rounded-2xl border dark:border-slate-800 border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <School className="w-4 h-4 text-indigo-500" />
                Branch / Institute *
              </label>
              <span className="text-[10px] text-indigo-500 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Select Branch
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {(institutes.length > 0 ? institutes : [
                { _id: '1', name: 'Main Campus' },
                { _id: '2', name: 'Online' },
                { _id: '3', name: 'None' },
              ]).map((inst: any) => {
                const isSelected = institute === inst.name;
                return (
                  <button
                    key={inst._id || inst.name}
                    type="button"
                    onClick={() => setInstitute(inst.name)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40 scale-[1.02]'
                        : 'dark:bg-slate-900/90 bg-white text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white dark:hover:bg-slate-800 hover:bg-slate-100 border dark:border-slate-800 border-slate-200'
                    }`}
                  >
                    <span>🏛️</span>
                    <span>{inst.name}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400">
              Select your institute or branch (e.g. Main Campus, Online, None).
            </p>
          </div>

          {/* Province & District */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Province *
              </label>
              <select
                required
                value={provinceId}
                onChange={(e) => setProvinceId(e.target.value)}
                className="w-full px-4 py-2.5 dark:bg-slate-950/60 bg-white border dark:border-slate-800 border-slate-300 rounded-xl dark:text-slate-100 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" className="dark:bg-slate-900 bg-white text-slate-400">
                  Select Province
                </option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id} className="dark:bg-slate-900 bg-white dark:text-white text-slate-900">
                    {p.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                District *
              </label>
              <select
                required
                value={districtId}
                disabled={!provinceId}
                onChange={(e) => setDistrictId(e.target.value)}
                className="w-full px-4 py-2.5 dark:bg-slate-950/60 bg-white border dark:border-slate-800 border-slate-300 rounded-xl dark:text-slate-100 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                <option value="" className="dark:bg-slate-900 bg-white text-slate-400">
                  Select District
                </option>
                {filteredDistricts.map((d) => (
                  <option key={d.id} value={d.id} className="dark:bg-slate-900 bg-white dark:text-white text-slate-900">
                    {d.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] mt-2 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Registering account...
              </span>
            ) : (
              'Complete Registration'
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t dark:border-slate-800/80 border-slate-200">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline underline-offset-2">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
