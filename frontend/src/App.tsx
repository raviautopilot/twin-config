import { useState, useEffect } from 'react';
import {
  Activity,
  User,
  DollarSign,
  Settings,
  Plus,
  Search,
  Database,
  CheckCircle,
  AlertCircle,
  CreditCard,
  X,
  Tag,
  RefreshCw,
  TrendingUp,
  UserPlus,
  Coins
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

// TypeScript Types
interface ContactDetails {
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

interface Contact {
  id: number;
  name: string;
  relationship: string;
  contact_details: ContactDetails;
  tags: string[];
  created_at: string;
}

interface AssociatedWorkflows {
  bills?: string[];
  schedules?: string[];
  metadata?: Record<string, string>;
}

interface FinancialEntity {
  id: number;
  bank_name: string;
  account_type: string;
  balance: number;
  associated_workflows: AssociatedWorkflows;
  created_at: string;
}

interface MetaConfig {
  id: number;
  key: string;
  value: any;
  created_at: string;
}

interface SummaryData {
  status: string;
  timestamp: string;
  counts: {
    contacts: number;
    financial_entities: number;
    meta_configs: number;
    events: number;
    audit_logs: number;
  };
  metrics: {
    total_financial_balance: number;
    last_updated: string;
  };
}

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contacts' | 'financials' | 'meta'>('dashboard');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [financials, setFinancials] = useState<FinancialEntity[]>([]);
  const [configs, setConfigs] = useState<MetaConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Form Modals State
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);

  // Form Fields State - Contact
  const [contactForm, setContactForm] = useState({
    name: '',
    relationship: 'Personal',
    email: '',
    phone: '',
    address: '',
    notes: '',
    tags: '',
  });

  // Form Fields State - Financial
  const [financialForm, setFinancialForm] = useState({
    bank_name: '',
    account_type: 'checking',
    balance: '',
    bills: '',
    schedules: '',
    last4: '',
    extra_key: '',
    extra_value: '',
  });

  // Form Fields State - Meta Config
  const [metaForm, setMetaForm] = useState({
    key: '',
    value: '',
  });

  // Search States
  const [contactSearch, setContactSearch] = useState('');
  const [financialSearch, setFinancialSearch] = useState('');

  // Fetch API Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [sumRes, contactsRes, financialsRes, configsRes] = await Promise.all([
          fetch(`${API_BASE}/twin/summary`),
          fetch(`${API_BASE}/contacts`),
          fetch(`${API_BASE}/financials`),
          fetch(`${API_BASE}/meta`)
        ]);

        if (!sumRes.ok || !contactsRes.ok || !financialsRes.ok || !configsRes.ok) {
          throw new Error('Failed to fetch backend configuration data');
        }

        const sumData = await sumRes.json();
        const contactsData = await contactsRes.json();
        const financialsData = await financialsRes.json();
        const configsData = await configsRes.json();

        setSummary(sumData);
        setContacts(contactsData);
        setFinancials(financialsData);
        setConfigs(configsData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Could not connect to the local Go backend. Make sure it is running on localhost:8080');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Submit Handlers
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.relationship) return;

    try {
      const payload = {
        name: contactForm.name,
        relationship: contactForm.relationship,
        contact_details: {
          email: contactForm.email,
          phone: contactForm.phone,
          address: contactForm.address,
          notes: contactForm.notes,
        },
        tags: contactForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      const res = await fetch(`${API_BASE}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save contact');

      setIsContactModalOpen(false);
      setContactForm({
        name: '',
        relationship: 'Personal',
        email: '',
        phone: '',
        address: '',
        notes: '',
        tags: '',
      });
      handleRefresh();
    } catch (err: any) {
      alert(err.message || 'Error occurred while saving contact');
    }
  };

  const handleFinancialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!financialForm.bank_name || !financialForm.account_type) return;

    try {
      const metadata: Record<string, string> = {};
      if (financialForm.last4) metadata['account_last_4'] = financialForm.last4;
      if (financialForm.extra_key && financialForm.extra_value) {
        metadata[financialForm.extra_key] = financialForm.extra_value;
      }

      const payload = {
        bank_name: financialForm.bank_name,
        account_type: financialForm.account_type,
        balance: parseFloat(financialForm.balance) || 0,
        associated_workflows: {
          bills: financialForm.bills.split(',').map(b => b.trim()).filter(Boolean),
          schedules: financialForm.schedules.split(',').map(s => s.trim()).filter(Boolean),
          metadata,
        },
      };

      const res = await fetch(`${API_BASE}/financials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save financial account');

      setIsFinancialModalOpen(false);
      setFinancialForm({
        bank_name: '',
        account_type: 'checking',
        balance: '',
        bills: '',
        schedules: '',
        last4: '',
        extra_key: '',
        extra_value: '',
      });
      handleRefresh();
    } catch (err: any) {
      alert(err.message || 'Error occurred while saving account');
    }
  };

  const handleMetaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metaForm.key) return;

    try {
      let parsedValue: any;
      try {
        parsedValue = JSON.parse(metaForm.value);
      } catch {
        // Fallback to treat it as string if not valid JSON
        parsedValue = metaForm.value;
      }

      const payload = {
        key: metaForm.key,
        value: parsedValue,
      };

      const res = await fetch(`${API_BASE}/meta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save config key');

      setIsMetaModalOpen(false);
      setMetaForm({ key: '', value: '' });
      handleRefresh();
    } catch (err: any) {
      alert(err.message || 'Error occurred while saving metadata');
    }
  };

  // Derived Values
  const ownerName = configs.find(c => c.key === 'twin_owner_name')?.value || 'Alex Mercer';

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.relationship.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.tags.some(t => t.toLowerCase().includes(contactSearch.toLowerCase()))
  );

  const filteredFinancials = financials.filter(f =>
    f.bank_name.toLowerCase().includes(financialSearch.toLowerCase()) ||
    f.account_type.toLowerCase().includes(financialSearch.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between">
        <div>
          {/* Logo & Identity */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
            <div className="bg-indigo-600/20 p-2 rounded-lg border border-indigo-500/40 text-indigo-400">
              <Database size={20} className="animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight tracking-wide text-slate-50 uppercase">
                Digital Twin
              </h1>
              <p className="text-xs text-slate-400 font-mono">PLOS CONFIG v1.0</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="mt-6 px-4 space-y-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Activity size={18} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'contacts'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <User size={18} />
              Contacts Map
            </button>
            <button
              onClick={() => setActiveTab('financials')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'financials'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <DollarSign size={18} />
              Financial Entities
            </button>
            <button
              onClick={() => setActiveTab('meta')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'meta'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Settings size={18} />
              Meta Configurations
            </button>
          </nav>
        </div>

        {/* Footer State */}
        <div className="p-4 border-t border-slate-800 font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-400 mb-1.5">
            <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
            <span>{error ? 'Disconnected' : 'Engine Connected'}</span>
          </div>
          <p className="text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">
            {API_BASE}
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight text-slate-100 capitalize">
              {activeTab === 'meta' ? 'Meta Configurations' : activeTab === 'financials' ? 'Financial Ledger' : activeTab + ' Workspace'}
            </h2>
            {loading && (
              <RefreshCw className="animate-spin text-indigo-400" size={16} />
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Refresh */}
            <button
              onClick={handleRefresh}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={16} />
            </button>

            {/* Profile Info */}
            <div className="flex items-center gap-3 bg-slate-800/80 pl-3 pr-4 py-1.5 rounded-full border border-slate-700">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xs text-white">
                {ownerName[0]}
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-400 leading-none">Config Owner</p>
                <p className="text-sm font-semibold text-slate-200 leading-tight">{ownerName}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Panels */}
        <main className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-800/80 rounded-xl text-red-200 flex items-center gap-3">
              <AlertCircle size={20} className="text-red-400 shrink-0" />
              <div>
                <p className="font-semibold text-sm">System Connection Fault</p>
                <p className="text-xs text-red-300/80">{error}</p>
              </div>
            </div>
          )}

          {/* DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Balance Card */}
                <div className="bg-gradient-to-br from-indigo-950/30 to-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 text-indigo-400 select-none">
                    <TrendingUp size={120} />
                  </div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">
                      Net Liquid Worth
                    </span>
                    <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 text-emerald-400">
                      <Coins size={16} />
                    </div>
                  </div>
                  <h3 className="text-3xl font-extrabold text-slate-50 tracking-tight font-mono">
                    ${summary?.metrics?.total_financial_balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </h3>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                    <span>Database Ledger Aggregation</span>
                  </div>
                </div>

                {/* Contacts Count */}
                <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">
                      Contacts Mapped
                    </span>
                    <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20 text-indigo-400">
                      <User size={16} />
                    </div>
                  </div>
                  <h3 className="text-3xl font-extrabold text-slate-50 tracking-tight font-mono">
                    {summary?.counts?.contacts ?? 0}
                  </h3>
                  <div className="mt-2 text-xs text-slate-400 font-mono">
                    Active relationships tracked
                  </div>
                </div>

                {/* Financial Assets */}
                <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">
                      Ledger Accounts
                    </span>
                    <div className="bg-purple-500/10 p-2 rounded-lg border border-purple-500/20 text-purple-400">
                      <CreditCard size={16} />
                    </div>
                  </div>
                  <h3 className="text-3xl font-extrabold text-slate-50 tracking-tight font-mono">
                    {summary?.counts?.financial_entities ?? 0}
                  </h3>
                  <div className="mt-2 text-xs text-slate-400 font-mono">
                    Liquid bank and credit streams
                  </div>
                </div>

                {/* Meta Config Key-Value Count */}
                <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">
                      Config Variables
                    </span>
                    <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 text-amber-400">
                      <Settings size={16} />
                    </div>
                  </div>
                  <h3 className="text-3xl font-extrabold text-slate-50 tracking-tight font-mono">
                    {summary?.counts?.meta_configs ?? 0}
                  </h3>
                  <div className="mt-2 text-xs text-slate-400 font-mono">
                    Custom config keys registered
                  </div>
                </div>
              </div>

              {/* Detail Panels (Double Column) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Health & Engine status */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 lg:col-span-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono mb-4">
                      Engine Diagnostics
                    </h4>
                    <div className="space-y-4">
                      {/* Connection */}
                      <div className="flex justify-between items-center py-2 border-b border-slate-800">
                        <span className="text-sm text-slate-400">API Health</span>
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold font-mono">
                          <CheckCircle size={14} /> HEALTHY
                        </span>
                      </div>
                      {/* Database */}
                      <div className="flex justify-between items-center py-2 border-b border-slate-800">
                        <span className="text-sm text-slate-400">Postgres Schema</span>
                        <span className="text-xs text-indigo-400 font-semibold font-mono">
                          MIGRATIONS OK
                        </span>
                      </div>
                      {/* Seed status */}
                      <div className="flex justify-between items-center py-2 border-b border-slate-800">
                        <span className="text-sm text-slate-400">Event Stream Logs</span>
                        <span className="text-xs text-slate-300 font-mono">
                          {summary?.counts?.events ?? 0} events
                        </span>
                      </div>
                      {/* Change records */}
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-slate-400">Audit Trail ledger</span>
                        <span className="text-xs text-slate-300 font-mono">
                          {summary?.counts?.audit_logs ?? 0} entries
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800">
                    <p className="text-xs text-slate-500 font-mono leading-relaxed">
                      All system configurations auto-validate schema requirements. Relational layers synced at UTC.
                    </p>
                  </div>
                </div>

                {/* Recent Event Streams */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 lg:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">
                      Recent Activity Ledger
                    </h4>
                    <span className="text-xs bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-900 font-mono">
                      LIVE EVENTS
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2">
                    <div className="flex gap-3 text-xs leading-relaxed border-l-2 border-indigo-500 pl-4 py-1">
                      <div className="text-slate-400 font-mono shrink-0">12:00 PM</div>
                      <div>
                        <span className="text-indigo-400 font-semibold font-mono">[RECO_CRM]</span>
                        <p className="text-slate-200 mt-0.5 font-medium">Coffee check-in meeting with Sarah Jenkins (VP of Engineering)</p>
                        <p className="text-slate-500 mt-0.5 italic">"Excellent sync. Expressed interest in scaling contract team next quarter."</p>
                      </div>
                    </div>

                    <div className="flex gap-3 text-xs leading-relaxed border-l-2 border-emerald-500 pl-4 py-1">
                      <div className="text-slate-400 font-mono shrink-0">11:15 AM</div>
                      <div>
                        <span className="text-emerald-400 font-semibold font-mono">[FIN_ASSET]</span>
                        <p className="text-slate-200 mt-0.5 font-medium">Asset Purchased: MacBook Pro M4 14 Inch (expires 2028-06-05)</p>
                        <p className="text-slate-500 mt-0.5 font-mono">Serial: C02F83H0Q05D | Paid: $1,299.00</p>
                      </div>
                    </div>

                    <div className="flex gap-3 text-xs leading-relaxed border-l-2 border-amber-500 pl-4 py-1">
                      <div className="text-slate-400 font-mono shrink-0">07:00 AM</div>
                      <div>
                        <span className="text-amber-400 font-semibold font-mono">[HLTH_VITAL]</span>
                        <p className="text-slate-200 mt-0.5 font-medium">Health Logged: Blood Pressure & Pulse Checkup</p>
                        <p className="text-slate-400 mt-0.5">BP: 118/79 mmHg | Pulse: 64 bpm (SYS/DIA Normal)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider font-mono mb-4">
                  Quick System Entry Actions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button
                    onClick={() => setIsContactModalOpen(true)}
                    className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 group text-left transition-all duration-200"
                  >
                    <div className="bg-indigo-500/10 p-3 rounded-lg text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
                      <UserPlus size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-200">Add New Contact</p>
                      <p className="text-xs text-slate-400 mt-0.5">Register nodes in relationship map</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setIsFinancialModalOpen(true)}
                    className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5 group text-left transition-all duration-200"
                  >
                    <div className="bg-purple-500/10 p-3 rounded-lg text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-200">
                      <Coins size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-200">Register Bank Stream</p>
                      <p className="text-xs text-slate-400 mt-0.5">Link assets, accounts and bills</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setIsMetaModalOpen(true)}
                    className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 group text-left transition-all duration-200"
                  >
                    <div className="bg-amber-500/10 p-3 rounded-lg text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-200">
                      <Settings size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-200">Add Config Variable</p>
                      <p className="text-xs text-slate-400 mt-0.5">Upsert metadata key-value settings</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONTACTS LIST VIEW */}
          {activeTab === 'contacts' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Actions */}
              <div className="flex justify-between items-center gap-4">
                {/* Search Bar */}
                <div className="relative max-w-md w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search name, relationship, tags..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 pl-10 pr-4 py-2 rounded-xl text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <button
                  onClick={() => setIsContactModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/10 transition-colors shrink-0"
                >
                  <Plus size={16} /> Add Contact
                </button>
              </div>

              {/* Contacts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all duration-200"
                  >
                    {/* Relationship Badge */}
                    <div className="absolute right-4 top-4">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase border border-slate-700">
                        {contact.relationship}
                      </span>
                    </div>

                    <div>
                      {/* Name */}
                      <h3 className="font-bold text-lg text-slate-100 pr-20 group-hover:text-indigo-400 transition-colors">
                        {contact.name}
                      </h3>

                      {/* Details */}
                      <div className="mt-4 space-y-2 text-xs font-mono text-slate-400">
                        {contact.contact_details?.email && (
                          <p className="flex items-center gap-2 overflow-hidden text-ellipsis">
                            <span className="text-slate-500">Email:</span>
                            <span className="text-slate-300">{contact.contact_details.email}</span>
                          </p>
                        )}
                        {contact.contact_details?.phone && (
                          <p className="flex items-center gap-2">
                            <span className="text-slate-500">Phone:</span>
                            <span className="text-slate-300">{contact.contact_details.phone}</span>
                          </p>
                        )}
                        {contact.contact_details?.address && (
                          <p className="flex items-center gap-2">
                            <span className="text-slate-500">Loc:</span>
                            <span className="text-slate-300 truncate">{contact.contact_details.address}</span>
                          </p>
                        )}
                      </div>

                      {/* Notes */}
                      {contact.contact_details?.notes && (
                        <div className="mt-4 p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-300 font-sans italic leading-relaxed">
                          "{contact.contact_details.notes}"
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {contact.tags && contact.tags.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-1.5 pt-3 border-t border-slate-800">
                        {contact.tags.map((tag) => (
                          <span
                            key={tag}
                            className="flex items-center gap-1 text-[10px] font-semibold bg-indigo-950/40 text-indigo-400 border border-indigo-900/50 px-2 py-0.5 rounded-full"
                          >
                            <Tag size={8} /> {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {filteredContacts.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-500">
                    <User size={48} className="mx-auto text-slate-700 mb-3" />
                    <p className="text-sm font-semibold">No contacts mapped</p>
                    <p className="text-xs text-slate-600 mt-1">Add a new connection to initialize the map grid</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FINANCIALS LIST VIEW */}
          {activeTab === 'financials' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Actions */}
              <div className="flex justify-between items-center gap-4">
                {/* Search Bar */}
                <div className="relative max-w-md w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search bank name, account type..."
                    value={financialSearch}
                    onChange={(e) => setFinancialSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 pl-10 pr-4 py-2 rounded-xl text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <button
                  onClick={() => setIsFinancialModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/10 transition-colors shrink-0"
                >
                  <Plus size={16} /> Register Stream
                </button>
              </div>

              {/* Financial List */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredFinancials.map((fin) => (
                  <div
                    key={fin.id}
                    className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-sm relative hover:border-slate-700 transition-all duration-200"
                  >
                    <div>
                      {/* Top Row: Title & Type */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-slate-100">{fin.bank_name}</h3>
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-400 uppercase border border-slate-700 inline-block mt-1">
                            {fin.account_type}
                          </span>
                        </div>
                        <div className="text-right">
                          <h3 className="text-2xl font-black font-mono text-slate-50">
                            ${fin.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h3>
                          {fin.associated_workflows?.metadata?.account_last_4 && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              LAST 4: •••• {fin.associated_workflows.metadata.account_last_4}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Metadata / Details */}
                      {fin.associated_workflows?.metadata && Object.keys(fin.associated_workflows.metadata).filter(k => k !== 'account_last_4').length > 0 && (
                        <div className="mt-4 p-3 bg-slate-950/40 rounded-lg border border-slate-800/80 text-xs font-mono">
                          <p className="text-slate-500 font-bold uppercase mb-1 text-[10px]">Account Details</p>
                          {Object.entries(fin.associated_workflows.metadata)
                            .filter(([k]) => k !== 'account_last_4')
                            .map(([k, v]) => (
                              <p key={k} className="flex justify-between">
                                <span className="text-slate-500 capitalize">{k.replace('_', ' ')}:</span>
                                <span className="text-slate-300 font-semibold">{v}</span>
                              </p>
                            ))
                          }
                        </div>
                      )}

                      {/* Workflows / Schedules & Bills */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800">
                        {/* Automated bills */}
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-2">
                            Associated Debits / Bills
                          </h4>
                          {fin.associated_workflows?.bills && fin.associated_workflows.bills.length > 0 ? (
                            <ul className="space-y-1 text-xs">
                              {fin.associated_workflows.bills.map((bill, i) => (
                                <li key={i} className="flex items-center gap-1.5 text-slate-300">
                                  <div className="w-1 h-1 rounded-full bg-red-500" />
                                  {bill}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-500 italic">No associated bill streams</p>
                          )}
                        </div>

                        {/* Schedules / Transfers */}
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-2">
                            Deposit & Transfer Routines
                          </h4>
                          {fin.associated_workflows?.schedules && fin.associated_workflows.schedules.length > 0 ? (
                            <ul className="space-y-1 text-xs">
                              {fin.associated_workflows.schedules.map((sched, i) => (
                                <li key={i} className="flex items-center gap-1.5 text-slate-300">
                                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                  {sched}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-500 italic">No scheduled routines configured</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredFinancials.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-500">
                    <DollarSign size={48} className="mx-auto text-slate-700 mb-3" />
                    <p className="text-sm font-semibold">No assets mapped</p>
                    <p className="text-xs text-slate-600 mt-1">Register a new bank account or stream to begin mapping</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* META CONFIG VIEW */}
          {activeTab === 'meta' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-400 max-w-md">
                  General key-value configurations stored securely for custom parameters and system triggers in the operating system.
                </p>
                <button
                  onClick={() => setIsMetaModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/10 transition-colors shrink-0"
                >
                  <Plus size={16} /> Add Config Key
                </button>
              </div>

              {/* Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800/40 border-b border-slate-800 font-mono text-xs text-slate-400 font-bold uppercase">
                      <th className="py-3.5 px-6">ID</th>
                      <th className="py-3.5 px-6">Configuration Key</th>
                      <th className="py-3.5 px-6">Parameter Value</th>
                      <th className="py-3.5 px-6">Last Configured</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {configs.map((cfg) => (
                      <tr key={cfg.id} className="hover:bg-slate-800/20 transition-colors group">
                        <td className="py-4 px-6 font-mono text-xs text-slate-500">{cfg.id}</td>
                        <td className="py-4 px-6 font-mono font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                          {cfg.key}
                        </td>
                        <td className="py-4 px-6">
                          <pre className="text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 max-w-lg overflow-x-auto text-slate-300 font-mono">
                            {typeof cfg.value === 'object'
                              ? JSON.stringify(cfg.value, null, 2)
                              : String(cfg.value)
                            }
                          </pre>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                          {new Date(cfg.created_at || Date.now()).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}

                    {configs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-16 text-center text-slate-500">
                          <Settings size={36} className="mx-auto text-slate-700 mb-2" />
                          <p className="text-sm font-semibold">No meta configurations stored</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 1. CONTACT MODAL FORM */}
      {/* ========================================================================= */}
      {isContactModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-xl relative animate-scaleUp">
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-6">
              <UserPlus className="text-indigo-400" size={20} /> Add Contact Node
            </h3>

            <form onSubmit={handleContactSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Contact Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    placeholder="E.g. Sarah Jenkins"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Relationship *
                  </label>
                  <select
                    value={contactForm.relationship}
                    onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Professional">Professional</option>
                    <option value="Family">Family</option>
                    <option value="Tenant">Tenant</option>
                    <option value="Advisor">Advisor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    placeholder="sarah@techcorp.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Physical Address
                </label>
                <input
                  type="text"
                  value={contactForm.address}
                  onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  placeholder="San Francisco, CA"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={contactForm.tags}
                  onChange={(e) => setContactForm({ ...contactForm, tags: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="tech-lead, mentor, advisor"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Brief notes / details
                </label>
                <textarea
                  value={contactForm.notes}
                  onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
                  placeholder="Additional contextual details..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-600/10 transition-colors"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FINANCIAL MODAL FORM */}
      {/* ========================================================================= */}
      {isFinancialModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-xl relative animate-scaleUp">
            <button
              onClick={() => setIsFinancialModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-6">
              <Coins className="text-indigo-400" size={20} /> Register Financial Stream
            </h3>

            <form onSubmit={handleFinancialSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Institution Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={financialForm.bank_name}
                    onChange={(e) => setFinancialForm({ ...financialForm, bank_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    placeholder="E.g. Chase Bank"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Account Category *
                  </label>
                  <select
                    value={financialForm.account_type}
                    onChange={(e) => setFinancialForm({ ...financialForm, account_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="investment">Investment Portfolio</option>
                    <option value="credit">Credit Card Account</option>
                    <option value="loan">Loan obligation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Starting Balance ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={financialForm.balance}
                    onChange={(e) => setFinancialForm({ ...financialForm, balance: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="8450.75"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Account Last 4
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={financialForm.last4}
                    onChange={(e) => setFinancialForm({ ...financialForm, last4: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="e.g. 5091"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Associated Debits / Bills (Comma separated)
                </label>
                <input
                  type="text"
                  value={financialForm.bills}
                  onChange={(e) => setFinancialForm({ ...financialForm, bills: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  placeholder="Adobe CC, GitHub Copilot, Rent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Scheduled Routines (Comma separated)
                </label>
                <input
                  type="text"
                  value={financialForm.schedules}
                  onChange={(e) => setFinancialForm({ ...financialForm, schedules: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  placeholder="Salary Deposit (Weekly), Auto-invest (Monthly)"
                />
              </div>

              <div className="border-t border-slate-800 pt-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Custom key-value parameters</p>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={financialForm.extra_key}
                    onChange={(e) => setFinancialForm({ ...financialForm, extra_key: e.target.value })}
                    className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                    placeholder="Key (e.g. APY)"
                  />
                  <input
                    type="text"
                    value={financialForm.extra_value}
                    onChange={(e) => setFinancialForm({ ...financialForm, extra_value: e.target.value })}
                    className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                    placeholder="Value (e.g. 4.4%)"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFinancialModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-600/10 transition-colors"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. META CONFIG MODAL FORM */}
      {/* ========================================================================= */}
      {isMetaModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-xl relative animate-scaleUp">
            <button
              onClick={() => setIsMetaModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-6">
              <Settings className="text-indigo-400" size={20} /> Set Config Variable
            </h3>

            <form onSubmit={handleMetaSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Configuration Key *
                </label>
                <input
                  type="text"
                  required
                  value={metaForm.key}
                  onChange={(e) => setMetaForm({ ...metaForm, key: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="e.g. twin_owner_name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Parameter Value (Supports JSON / Strings)
                </label>
                <textarea
                  value={metaForm.value}
                  onChange={(e) => setMetaForm({ ...metaForm, value: e.target.value })}
                  rows={5}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  placeholder='e.g. "Alex Mercer" or {"enable_digest": true}'
                />
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Valid JSON objects will be stored as structured documents; simple strings will be stored directly.
                </p>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsMetaModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-600/10 transition-colors"
                >
                  Save Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
