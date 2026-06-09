import { useState, useEffect } from 'react';
import {
  Activity,
  Layers,
  Sliders,
  Calendar,
  Globe,
  Tag,
  TrendingUp,
  FileText,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
  Edit2,
  Trash2,
  Database,
  Info,
  Users,
  Landmark,
  CreditCard,
  Percent,
  Coins,
  PiggyBank,
  User,
  ChevronDown
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

interface Person {
  person_id: string;
  first_name: string;
  last_name?: string;
  middle_name?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  email?: string;
  phone_number?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  father_name?: string;
  mother_name?: string;
  created_at: string;
  updated_at: string;
}

interface FinEntity {
  fin_entity_id: string;
  entity_type: 'BANK_ACCOUNT' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'FIXED_DEPOSIT' | 'LOAN' | 'OVERDRAFT';
  entity_name: string;
  owner_person_id?: string;
  balance: number;
  currency: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Global & Regional banking
  bank_name?: string;
  branch_name?: string;
  account_number?: string;
  iban?: string;
  bic_swift?: string;
  ifsc?: string;
  micr?: string;
  bsr_code?: string;
  sort_code?: string;
  roll_number?: string;

  // Cards
  card_number_masked?: string;
  card_network?: string;
  card_holder_name?: string;
  issue_date?: string;
  expiry_date?: string;

  // Credit Card
  credit_limit?: number;
  available_limit?: number;
  minimum_due?: number;
  statement_date_day?: number;
  payment_due_date_day?: number;

  // Fixed Deposit
  fd_receipt_number?: string;
  principal_amount?: number;
  compounding_frequency?: string;
  booking_date?: string;
  maturity_date?: string;
  maturity_amount?: number;
  is_cumulative?: boolean;

  // Loan
  loan_type?: string;
  sanctioned_amount?: number;
  interest_type?: string;
  tenure_months?: number;
  emi_amount?: number;
  next_emi_date?: string;

  // Overdraft & Interest
  overdraft_limit?: number;
  interest_rate?: number;
  linked_parent_entity_id?: string;
}

interface CfgModule {
  module_id: string;
  module_name: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface CfgType {
  type_id: number;
  module_id: string;
  config_type: string;
  metadata_schema?: any;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface CfgEventType {
  event_type_code: string;
  module_code: string;
  display_name: string;
}

interface CfgDimension {
  dimension_code: string;
  unit_code: string;
  description: string;
}

interface CfgAttributeKey {
  event_type_code: string;
  attribute_key: string;
  is_required: number;
}

interface TwinEvent {
  event_id: string;
  event_type_code: string;
  occurred_at: string;
  created_at?: string;
}

interface TwinImpact {
  impact_id: string;
  event_id: string;
  dimension_code: string;
  value: number;
  target_entity: string;
}

interface EventDetail {
  event_id: string;
  attribute_key: string;
  attribute_val: string;
}

interface SummaryData {
  status: string;
  timestamp: string;
  counts: {
    cfg_modules: number;
    cfg_type: number;
    cfg_event_types: number;
    cfg_dimensions: number;
    cfg_attribute_keys: number;
    twin_event: number;
    twin_impact: number;
    event_details: number;
    audit_log: number;
  };
  metrics: {
    last_updated: string;
  };
}

type MenuSection =
  | 'dashboard'
  | 'cfg_modules'
  | 'cfg_type'
  | 'cfg_event_types'
  | 'cfg_dimensions'
  | 'cfg_attribute_keys'
  | 'twin_event'
  | 'twin_impact'
  | 'event_details'
  | 'entity_management';

const getInitialRouteState = () => {
  const path = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const moduleParam = searchParams.get('module');
  
  const entityTypesMatch = path.match(/^\/entity-types(?:\/([^/]+))?$/);
  const modulesMatch = path.match(/^\/modules$/);
  const eventTypesMatch = path.match(/^\/event-types$/);
  const dimensionsMatch = path.match(/^\/dimensions$/);
  const attributeKeysMatch = path.match(/^\/attribute-keys$/);
  const eventsMatch = path.match(/^\/events$/);
  const impactsMatch = path.match(/^\/event-impacts$/);
  const eventDetailsMatch = path.match(/^\/event-details$/);
  const entityManagementMatch = path.match(/^\/entity-management$/);

  let initialMenu: MenuSection = 'dashboard';
  let initialTypeTab = '';

  if (entityTypesMatch) {
    initialMenu = 'cfg_type';
    const mod = moduleParam || entityTypesMatch[1] || '';
    if (mod) {
      initialTypeTab = mod;
    }
  } else if (modulesMatch) {
    initialMenu = 'cfg_modules';
  } else if (eventTypesMatch) {
    initialMenu = 'cfg_event_types';
  } else if (dimensionsMatch) {
    initialMenu = 'cfg_dimensions';
  } else if (attributeKeysMatch) {
    initialMenu = 'cfg_attribute_keys';
  } else if (eventsMatch) {
    initialMenu = 'twin_event';
  } else if (impactsMatch) {
    initialMenu = 'twin_impact';
  } else if (eventDetailsMatch) {
    initialMenu = 'event_details';
  } else if (entityManagementMatch) {
    initialMenu = 'entity_management';
  }

  return { initialMenu, initialTypeTab };
};

const getMenuLabel = (menu: MenuSection, singular: boolean = false): string => {
  switch (menu) {
    case 'dashboard':
      return 'Dashboard Overview';
    case 'cfg_modules':
      return singular ? 'Module' : 'Config Management';
    case 'cfg_type':
      return singular ? 'Entity Type' : 'Entity Types';
    case 'cfg_event_types':
      return singular ? 'Event Type' : 'Event Types';
    case 'cfg_dimensions':
      return singular ? 'Dimension' : 'Dimensions';
    case 'cfg_attribute_keys':
      return singular ? 'Attribute Key' : 'Attribute Keys';
    case 'twin_event':
      return singular ? 'Event' : 'Events Ledger';
    case 'twin_impact':
      return singular ? 'Event Impact' : 'Event Impacts';
    case 'event_details':
      return singular ? 'Event Detail' : 'Event Details';
    default:
      return (menu as string).replace(/_/g, ' ');
  }
};

export default function App() {
  const { initialMenu, initialTypeTab } = getInitialRouteState();
  const [activeMenu, setActiveMenu] = useState<MenuSection>(initialMenu);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  // Sidebar expanded sections state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Overview: true,
    Config: true,
    'Operational Ledger': true
  });

  // Database Data States
  const [modules, setModules] = useState<CfgModule[]>([]);
  const [groupedTypes, setGroupedTypes] = useState<Record<string, CfgType[]>>({});
  const [activeTypeTab, setActiveTypeTab] = useState<string>(initialTypeTab);
  const [eventTypes, setEventTypes] = useState<CfgEventType[]>([]);
  const [dimensions, setDimensions] = useState<CfgDimension[]>([]);
  const [attributeKeys, setAttributeKeys] = useState<CfgAttributeKey[]>([]);
  const [events, setEvents] = useState<TwinEvent[]>([]);
  const [impacts, setImpacts] = useState<TwinImpact[]>([]);
  const [eventDetails, setEventDetails] = useState<EventDetail[]>([]);

  // Page States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Show Toast Helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [editKeys, setEditKeys] = useState<Record<string, string | number>>({});

  // Entity Management states
  const [persons, setPersons] = useState<Person[]>([]);
  const [finEntities, setFinEntities] = useState<FinEntity[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState<string>('PERSON');
  
  // Modals for Entity CRUD
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [entityModalType, setEntityModalType] = useState<'create' | 'edit'>('create');
  
  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEntityDetails, setSelectedEntityDetails] = useState<any>(null);

  // Form states for Person
  const [formPerson, setFormPerson] = useState({
    person_id: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    date_of_birth: '',
    gender: 'Male',
    nationality: '',
    email: '',
    phone_number: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: '',
    father_name: '',
    mother_name: ''
  });

  // Form states for Financial Entity
  const [formFinEntity, setFormFinEntity] = useState({
    fin_entity_id: '',
    entity_type: 'BANK_ACCOUNT',
    entity_name: '',
    owner_person_id: '',
    balance: 0,
    currency: 'USD',
    is_active: true,
    notes: '',
    bank_name: '',
    branch_name: '',
    account_number: '',
    iban: '',
    bic_swift: '',
    ifsc: '',
    micr: '',
    bsr_code: '',
    sort_code: '',
    roll_number: '',
    card_number_masked: '',
    card_network: 'VISA',
    card_holder_name: '',
    issue_date: '',
    expiry_date: '',
    credit_limit: 0,
    available_limit: 0,
    minimum_due: 0,
    statement_date_day: 1,
    payment_due_date_day: 1,
    fd_receipt_number: '',
    principal_amount: 0,
    compounding_frequency: 'MONTHLY',
    booking_date: '',
    maturity_date: '',
    maturity_amount: 0,
    is_cumulative: true,
    loan_type: 'HOME',
    sanctioned_amount: 0,
    interest_type: 'FIXED',
    tenure_months: 12,
    emi_amount: 0,
    next_emi_date: '',
    overdraft_limit: 0,
    interest_rate: 0.0,
    linked_parent_entity_id: ''
  });

  const fetchPersonsList = async () => {
    try {
      const res = await fetch(`${API_BASE}/persons`);
      if (res.ok) {
        setPersons(await res.json());
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const fetchFinEntitiesList = async (type: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/fin-entities?type=${type}`);
      if (res.ok) {
        setFinEntities(await res.json());
      }
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      showToast(err.message, 'error');
    }
  };

  // Fetch Entity Management Data
  useEffect(() => {
    if (activeMenu === 'entity_management') {
      fetchPersonsList();
      if (selectedEntityType !== 'PERSON') {
        fetchFinEntitiesList(selectedEntityType);
      }
    }
  }, [activeMenu, selectedEntityType, refreshTrigger]);

  const openEntityCreateModal = () => {
    setEntityModalType('create');
    if (selectedEntityType === 'PERSON') {
      setFormPerson({
        person_id: '',
        first_name: '',
        last_name: '',
        middle_name: '',
        date_of_birth: '',
        gender: 'Male',
        nationality: '',
        email: '',
        phone_number: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state_province: '',
        postal_code: '',
        country: '',
        father_name: '',
        mother_name: ''
      });
    } else {
      setFormFinEntity({
        fin_entity_id: '',
        entity_type: selectedEntityType as any,
        entity_name: '',
        owner_person_id: persons[0]?.person_id || '',
        balance: 0,
        currency: 'USD',
        is_active: true,
        notes: '',
        bank_name: '',
        branch_name: '',
        account_number: '',
        iban: '',
        bic_swift: '',
        ifsc: '',
        micr: '',
        bsr_code: '',
        sort_code: '',
        roll_number: '',
        card_number_masked: '',
        card_network: 'VISA',
        card_holder_name: '',
        issue_date: '',
        expiry_date: '',
        credit_limit: 0,
        available_limit: 0,
        minimum_due: 0,
        statement_date_day: 1,
        payment_due_date_day: 1,
        fd_receipt_number: '',
        principal_amount: 0,
        compounding_frequency: 'MONTHLY',
        booking_date: '',
        maturity_date: '',
        maturity_amount: 0,
        is_cumulative: true,
        loan_type: 'HOME',
        sanctioned_amount: 0,
        interest_type: 'FIXED',
        tenure_months: 12,
        emi_amount: 0,
        next_emi_date: '',
        overdraft_limit: 0,
        interest_rate: 0.0,
        linked_parent_entity_id: ''
      });
    }
    setEntityModalOpen(true);
  };

  const openEntityEditModal = (item: any) => {
    setEntityModalType('edit');
    if (selectedEntityType === 'PERSON') {
      setFormPerson({
        ...item,
        date_of_birth: item.date_of_birth ? item.date_of_birth.substring(0, 10) : ''
      });
    } else {
      setFormFinEntity({
        ...item,
        issue_date: item.issue_date ? item.issue_date.substring(0, 10) : '',
        expiry_date: item.expiry_date ? item.expiry_date.substring(0, 10) : '',
        booking_date: item.booking_date ? item.booking_date.substring(0, 10) : '',
        maturity_date: item.maturity_date ? item.maturity_date.substring(0, 10) : '',
        next_emi_date: item.next_emi_date ? item.next_emi_date.substring(0, 10) : ''
      });
    }
    setEntityModalOpen(true);
  };

  const openEntityDetailModal = (item: any) => {
    setSelectedEntityDetails(item);
    setDetailModalOpen(true);
  };

  const handleEntitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isPerson = selectedEntityType === 'PERSON';
      const url = isPerson
        ? (entityModalType === 'create' ? `${API_BASE}/persons` : `${API_BASE}/persons/${formPerson.person_id}`)
        : (entityModalType === 'create' ? `${API_BASE}/fin-entities` : `${API_BASE}/fin-entities/${formFinEntity.fin_entity_id}`);
      
      const method = entityModalType === 'create' ? 'POST' : 'PUT';
      
      let body: any;
      if (isPerson) {
        body = {
          ...formPerson,
          middle_name: formPerson.middle_name || null,
          last_name: formPerson.last_name || null,
          date_of_birth: formPerson.date_of_birth ? new Date(formPerson.date_of_birth).toISOString() : null,
          email: formPerson.email || null,
          phone_number: formPerson.phone_number || null,
          address_line1: formPerson.address_line1 || null,
          address_line2: formPerson.address_line2 || null,
          city: formPerson.city || null,
          state_province: formPerson.state_province || null,
          postal_code: formPerson.postal_code || null,
          country: formPerson.country || null,
          father_name: formPerson.father_name || null,
          mother_name: formPerson.mother_name || null
        };
      } else {
        body = {
          ...formFinEntity,
          entity_type: selectedEntityType,
          balance: parseFloat(formFinEntity.balance as any) || 0.0,
          credit_limit: formFinEntity.credit_limit ? parseFloat(formFinEntity.credit_limit as any) : null,
          available_limit: formFinEntity.available_limit ? parseFloat(formFinEntity.available_limit as any) : null,
          minimum_due: formFinEntity.minimum_due ? parseFloat(formFinEntity.minimum_due as any) : null,
          principal_amount: formFinEntity.principal_amount ? parseFloat(formFinEntity.principal_amount as any) : null,
          maturity_amount: formFinEntity.maturity_amount ? parseFloat(formFinEntity.maturity_amount as any) : null,
          sanctioned_amount: formFinEntity.sanctioned_amount ? parseFloat(formFinEntity.sanctioned_amount as any) : null,
          emi_amount: formFinEntity.emi_amount ? parseFloat(formFinEntity.emi_amount as any) : null,
          overdraft_limit: formFinEntity.overdraft_limit ? parseFloat(formFinEntity.overdraft_limit as any) : null,
          interest_rate: formFinEntity.interest_rate ? parseFloat(formFinEntity.interest_rate as any) : null,
          statement_date_day: formFinEntity.statement_date_day ? parseInt(formFinEntity.statement_date_day as any) : null,
          payment_due_date_day: formFinEntity.payment_due_date_day ? parseInt(formFinEntity.payment_due_date_day as any) : null,
          tenure_months: formFinEntity.tenure_months ? parseInt(formFinEntity.tenure_months as any) : null,
          owner_person_id: formFinEntity.owner_person_id || null,
          linked_parent_entity_id: formFinEntity.linked_parent_entity_id || null,
          bank_name: formFinEntity.bank_name || null,
          branch_name: formFinEntity.branch_name || null,
          account_number: formFinEntity.account_number || null,
          iban: formFinEntity.iban || null,
          bic_swift: formFinEntity.bic_swift || null,
          ifsc: formFinEntity.ifsc || null,
          micr: formFinEntity.micr || null,
          bsr_code: formFinEntity.bsr_code || null,
          sort_code: formFinEntity.sort_code || null,
          roll_number: formFinEntity.roll_number || null,
          card_number_masked: formFinEntity.card_number_masked || null,
          card_holder_name: formFinEntity.card_holder_name || null,
          fd_receipt_number: formFinEntity.fd_receipt_number || null,
          notes: formFinEntity.notes || null,
          issue_date: formFinEntity.issue_date ? new Date(formFinEntity.issue_date).toISOString() : null,
          expiry_date: formFinEntity.expiry_date ? new Date(formFinEntity.expiry_date).toISOString() : null,
          booking_date: formFinEntity.booking_date ? new Date(formFinEntity.booking_date).toISOString() : null,
          maturity_date: formFinEntity.maturity_date ? new Date(formFinEntity.maturity_date).toISOString() : null,
          next_emi_date: formFinEntity.next_emi_date ? new Date(formFinEntity.next_emi_date).toISOString() : null
        };
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save entity');
      }

      showToast(`Entity ${entityModalType === 'create' ? 'created' : 'updated'} successfully`);
      setEntityModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleEntityDelete = async (item: any) => {
    const isPerson = selectedEntityType === 'PERSON';
    const name = isPerson ? `${item.first_name} ${item.last_name || ''}` : item.entity_name;
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const url = isPerson
        ? `${API_BASE}/persons/${item.person_id}`
        : `${API_BASE}/fin-entities/${item.fin_entity_id}`;
      
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete entity');
      }

      showToast('Entity deleted successfully');
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Form Field States
  const [formModule, setFormModule] = useState({ module_id: '', module_name: '', notes: '' });
  const [formType, setFormType] = useState({ type_id: 0, module_id: '', config_type: '', metadata_schema: '{}', notes: '' });
  const [formEventType, setFormEventType] = useState({ event_type_code: '', module_code: '', display_name: '' });
  const [formDimension, setFormDimension] = useState({ dimension_code: '', unit_code: '', description: '' });
  const [formAttributeKey, setFormAttributeKey] = useState({ event_type_code: '', attribute_key: '', is_required: 0 });
  const [formEvent, setFormEvent] = useState({ event_id: '', event_type_code: '', occurred_at: '' });
  const [formImpact, setFormImpact] = useState({ impact_id: '', event_id: '', dimension_code: '', value: 0, target_entity: '' });
  const [formEventDetail, setFormEventDetail] = useState({ event_id: '', attribute_key: '', attribute_val: '' });


  const navigateTo = (menu: MenuSection, params?: { module?: string }) => {
    let path = '/';
    if (menu === 'cfg_modules') {
      path = '/modules';
    } else if (menu === 'cfg_type') {
      if (params?.module) {
        path = `/entity-types?module=${encodeURIComponent(params.module)}`;
      } else {
        path = '/entity-types';
      }
    } else if (menu === 'cfg_event_types') {
      path = '/event-types';
    } else if (menu === 'cfg_dimensions') {
      path = '/dimensions';
    } else if (menu === 'cfg_attribute_keys') {
      path = '/attribute-keys';
    } else if (menu === 'twin_event') {
      path = '/events';
    } else if (menu === 'twin_impact') {
      path = '/event-impacts';
    } else if (menu === 'event_details') {
      path = '/event-details';
    } else if (menu === 'entity_management') {
      path = '/entity-management';
    } else if (menu === 'dashboard') {
      path = '/';
    }
    
    window.history.pushState(null, '', path);
    setActiveMenu(menu);
    if (menu === 'cfg_type') {
      setActiveTypeTab(params?.module || '');
    }
    setSearchQuery('');
  };

  useEffect(() => {
    const handlePopState = () => {
      const { initialMenu, initialTypeTab } = getInitialRouteState();
      setActiveMenu(initialMenu);
      setActiveTypeTab(initialTypeTab);
      setSearchQuery('');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch Data on Load or Refresh
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          summaryRes,
          modulesRes,
          typesRes,
          eventTypesRes,
          dimensionsRes,
          attributeKeysRes,
          eventsRes,
          impactsRes,
          eventDetailsRes
        ] = await Promise.all([
          fetch(`${API_BASE}/summary`),
          fetch(`${API_BASE}/cfg/modules`),
          fetch(`${API_BASE}/cfg/types`),
          fetch(`${API_BASE}/cfg/event-types`),
          fetch(`${API_BASE}/cfg/dimensions`),
          fetch(`${API_BASE}/cfg/attribute-keys`),
          fetch(`${API_BASE}/twin/events`),
          fetch(`${API_BASE}/twin/impacts`),
          fetch(`${API_BASE}/twin/event-details`)
        ]);

        if (
          !summaryRes.ok ||
          !modulesRes.ok ||
          !typesRes.ok ||
          !eventTypesRes.ok ||
          !dimensionsRes.ok ||
          !attributeKeysRes.ok ||
          !eventsRes.ok ||
          !impactsRes.ok ||
          !eventDetailsRes.ok
        ) {
          throw new Error('Server returned an error. Verify the Go backend status.');
        }

        setSummary(await summaryRes.json());
        setModules(await modulesRes.json());
        const fetchedTypes = await typesRes.json();
        const groups: Record<string, CfgType[]> = {};
        fetchedTypes.forEach((t: CfgType) => {
          const prefix = t.module_id;
          if (!groups[prefix]) {
            groups[prefix] = [];
          }
          groups[prefix].push(t);
        });
        setGroupedTypes(groups);
        setEventTypes(await eventTypesRes.json());
        setDimensions(await dimensionsRes.json());
        setAttributeKeys(await attributeKeysRes.json());
        setEvents(await eventsRes.json());
        setImpacts(await impactsRes.json());
        setEventDetails(await eventDetailsRes.json());
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Could not connect to the Go API server.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    showToast('Dashboard details updated');
  };

  // Delete Handlers
  const handleDelete = async (table: MenuSection, item: any) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;

    let url = '';
    if (table === 'cfg_modules') url = `${API_BASE}/cfg/modules/${item.module_id}`;
    else if (table === 'cfg_type') url = `${API_BASE}/cfg/types/${item.type_id}`;
    else if (table === 'cfg_event_types') url = `${API_BASE}/cfg/event-types/${item.event_type_code}`;
    else if (table === 'cfg_dimensions') url = `${API_BASE}/cfg/dimensions/${item.dimension_code}`;
    else if (table === 'cfg_attribute_keys') url = `${API_BASE}/cfg/attribute-keys/${item.event_type_code}/${item.attribute_key}`;
    else if (table === 'twin_event') url = `${API_BASE}/twin/events/${item.event_id}`;
    else if (table === 'twin_impact') url = `${API_BASE}/twin/impacts/${item.impact_id}`;
    else if (table === 'event_details') url = `${API_BASE}/twin/event-details/${item.event_id}/${item.attribute_key}`;

    try {
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete record.');
      }
      showToast('Record deleted successfully');
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Open Create Modal
  const openCreateModal = (table: MenuSection) => {
    setModalType('create');
    setEditKeys({});

    // Reset Forms
    if (table === 'cfg_modules') {
      setFormModule({ module_id: '', module_name: '', notes: '' });
    } else if (table === 'cfg_type') {
      setFormType({ type_id: 0, module_id: modules[0]?.module_id || '', config_type: '', metadata_schema: '{}', notes: '' });
    } else if (table === 'cfg_event_types') {
      setFormEventType({ event_type_code: '', module_code: modules[0]?.module_id || '', display_name: '' });
    } else if (table === 'cfg_dimensions') {
      setFormDimension({ dimension_code: '', unit_code: '', description: '' });
    } else if (table === 'cfg_attribute_keys') {
      setFormAttributeKey({ event_type_code: eventTypes[0]?.event_type_code || '', attribute_key: '', is_required: 0 });
    } else if (table === 'twin_event') {
      setFormEvent({ event_id: '', event_type_code: eventTypes[0]?.event_type_code || '', occurred_at: new Date().toISOString().substring(0, 16) });
    } else if (table === 'twin_impact') {
      setFormImpact({ impact_id: '', event_id: events[0]?.event_id || '', dimension_code: dimensions[0]?.dimension_code || '', value: 0, target_entity: '' });
    } else if (table === 'event_details') {
      setFormEventDetail({ event_id: events[0]?.event_id || '', attribute_key: '', attribute_val: '' });
    }

    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (table: MenuSection, item: any) => {
    setModalType('edit');

    if (table === 'cfg_modules') {
      setFormModule({ module_id: item.module_id, module_name: item.module_name, notes: item.notes || '' });
      setEditKeys({ module_id: item.module_id });
    } else if (table === 'cfg_type') {
      setFormType({
        type_id: item.type_id,
        module_id: item.module_id,
        config_type: item.config_type,
        metadata_schema: JSON.stringify(item.metadata_schema || {}, null, 2),
        notes: item.notes || ''
      });
      setEditKeys({ type_id: item.type_id });
    } else if (table === 'cfg_event_types') {
      setFormEventType({ event_type_code: item.event_type_code, module_code: item.module_code, display_name: item.display_name });
      setEditKeys({ event_type_code: item.event_type_code });
    } else if (table === 'cfg_dimensions') {
      setFormDimension({ dimension_code: item.dimension_code, unit_code: item.unit_code, description: item.description });
      setEditKeys({ dimension_code: item.dimension_code });
    } else if (table === 'cfg_attribute_keys') {
      setFormAttributeKey({ event_type_code: item.event_type_code, attribute_key: item.attribute_key, is_required: item.is_required });
      setEditKeys({ event_type_code: item.event_type_code, attribute_key: item.attribute_key });
    } else if (table === 'twin_event') {
      // format to datetime-local friendly format
      const localDate = item.occurred_at ? new Date(item.occurred_at).toISOString().substring(0, 16) : '';
      setFormEvent({ event_id: item.event_id, event_type_code: item.event_type_code, occurred_at: localDate });
      setEditKeys({ event_id: item.event_id });
    } else if (table === 'twin_impact') {
      setFormImpact({
        impact_id: item.impact_id,
        event_id: item.event_id,
        dimension_code: item.dimension_code,
        value: item.value,
        target_entity: item.target_entity
      });
      setEditKeys({ impact_id: item.impact_id });
    } else if (table === 'event_details') {
      setFormEventDetail({ event_id: item.event_id, attribute_key: item.attribute_key, attribute_val: item.attribute_val });
      setEditKeys({ event_id: item.event_id, attribute_key: item.attribute_key });
    }

    setModalOpen(true);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let url = '';
    const method = modalType === 'create' ? 'POST' : 'PUT';
    let body: Record<string, unknown> | null = null;

    try {
      if (activeMenu === 'cfg_modules') {
        url = modalType === 'create' ? `${API_BASE}/cfg/modules` : `${API_BASE}/cfg/modules/${editKeys.module_id}`;
        body = formModule;
      } else if (activeMenu === 'cfg_type') {
        url = modalType === 'create' ? `${API_BASE}/cfg/types` : `${API_BASE}/cfg/types/${editKeys.type_id}`;
        let parsedSchema = {};
        try {
          parsedSchema = JSON.parse(formType.metadata_schema || '{}');
        } catch {
          throw new Error('Metadata Schema must be a valid JSON object.');
        }
        body = { ...formType, metadata_schema: parsedSchema };
      } else if (activeMenu === 'cfg_event_types') {
        url = modalType === 'create' ? `${API_BASE}/cfg/event-types` : `${API_BASE}/cfg/event-types/${editKeys.event_type_code}`;
        body = formEventType;
      } else if (activeMenu === 'cfg_dimensions') {
        url = modalType === 'create' ? `${API_BASE}/cfg/dimensions` : `${API_BASE}/cfg/dimensions/${editKeys.dimension_code}`;
        body = formDimension;
      } else if (activeMenu === 'cfg_attribute_keys') {
        url = modalType === 'create'
          ? `${API_BASE}/cfg/attribute-keys`
          : `${API_BASE}/cfg/attribute-keys/${editKeys.event_type_code}/${editKeys.attribute_key}`;
        body = { ...formAttributeKey, is_required: Number(formAttributeKey.is_required) };
      } else if (activeMenu === 'twin_event') {
        url = modalType === 'create' ? `${API_BASE}/twin/events` : `${API_BASE}/twin/events/${editKeys.event_id}`;
        body = { ...formEvent, occurred_at: new Date(formEvent.occurred_at).toISOString() };
      } else if (activeMenu === 'twin_impact') {
        url = modalType === 'create' ? `${API_BASE}/twin/impacts` : `${API_BASE}/twin/impacts/${editKeys.impact_id}`;
        body = { ...formImpact, value: Number(formImpact.value) };
      } else if (activeMenu === 'event_details') {
        url = modalType === 'create'
          ? `${API_BASE}/twin/event-details`
          : `${API_BASE}/twin/event-details/${editKeys.event_id}/${editKeys.attribute_key}`;
        body = formEventDetail;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit form data.');
      }

      showToast(`Record ${modalType === 'create' ? 'created' : 'updated'} successfully`);
      setModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Dynamic Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity, group: 'Overview' },
    { id: 'cfg_modules', label: 'Modules', icon: Layers, group: 'Config' },
    { id: 'cfg_type', label: 'Entity Types', icon: Sliders, group: 'Config' },
    { id: 'cfg_event_types', label: 'Event Types', icon: Calendar, group: 'Config' },
    { id: 'cfg_dimensions', label: 'Dimensions', icon: Globe, group: 'Config' },
    { id: 'cfg_attribute_keys', label: 'Attribute Keys', icon: Tag, group: 'Config' },
    { id: 'twin_event', label: 'Events Ledger', icon: Database, group: 'Operational Ledger' },
    { id: 'twin_impact', label: 'Event Impacts', icon: TrendingUp, group: 'Operational Ledger' },
    { id: 'event_details', label: 'Event Details', icon: FileText, group: 'Operational Ledger' },
    { id: 'entity_management', label: 'Entity Registry', icon: Users, group: 'Operational Ledger' }
  ];

  // Helper for Table Column Headers & Cells
  const renderTable = () => {
    switch (activeMenu) {
      case 'cfg_modules': {
        const filtered = modules.filter(
          m =>
            m.module_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.module_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/50">
                  <th className="p-4">Module ID</th>
                  <th className="p-4">Module Name</th>
                  <th className="p-4">Notes</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map(m => (
                  <tr key={m.module_id} className="hover:bg-slate-900/30 transition">
                    <td className="p-4 font-mono font-bold">
                      <button
                        onClick={() => navigateTo('cfg_type', { module: m.module_id })}
                        className="text-teal-400 hover:text-teal-300 transition duration-150 font-bold focus:outline-none cursor-pointer"
                      >
                        {m.module_id}
                      </button>
                    </td>
                    <td className="p-4 font-medium text-slate-200">
                      <button
                        onClick={() => navigateTo('cfg_type', { module: m.module_id })}
                        className="text-slate-200 hover:text-teal-400 hover:underline transition duration-150 font-medium text-left focus:outline-none cursor-pointer"
                      >
                        {m.module_name}
                      </button>
                    </td>
                    <td className="p-4 text-slate-400 max-w-xs truncate">{m.notes || '—'}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => openEditModal('cfg_modules', m)} className="p-1.5 hover:text-teal-400 transition" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete('cfg_modules', m)} className="p-1.5 hover:text-rose-400 transition" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">No modules found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      }
      case 'cfg_type': {
        // Filter the grouped results based on the search query
        const filteredGroups: Record<string, CfgType[]> = {};

        Object.entries(groupedTypes).forEach(([moduleId, moduleTypes]) => {
          const matchingTypes = moduleTypes.filter(
            t =>
              t.config_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.module_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()))
          );
          if (matchingTypes.length > 0) {
            filteredGroups[moduleId] = matchingTypes;
          }
        });

        // Resolve target module from activeTypeTab (which could be passed via query string/route)
        const targetModule = modules.find(
          m => m.module_id.toLowerCase() === activeTypeTab.toLowerCase() ||
               m.module_name.toLowerCase() === activeTypeTab.toLowerCase()
        );
        const resolvedActiveModuleId = targetModule ? targetModule.module_id : '';

        // Build list of modules to display as tabs
        const groupKeys = Object.keys(filteredGroups);
        
        if (resolvedActiveModuleId && !groupKeys.includes(resolvedActiveModuleId)) {
          // If we have a resolved active module, but it has 0 matching types,
          // we still append it to groupKeys so we can render its tab and header.
          groupKeys.push(resolvedActiveModuleId);
        }

        // Determine the active tab ID.
        const activeTabId = groupKeys.includes(resolvedActiveModuleId)
          ? resolvedActiveModuleId
          : (groupKeys.includes(activeTypeTab)
              ? activeTypeTab
              : (groupKeys[0] || ''));

        if (groupKeys.length === 0) {
          return (
            <div className="text-center p-8 text-slate-500 border border-slate-800 rounded-lg bg-slate-900/5">
              No entity templates found matching your search.
            </div>
          );
        }

        return (
          <div className="space-y-6">
            {/* Tab Navigation Bar */}
            <div className="border-b border-slate-850 flex flex-wrap gap-1 bg-slate-950/20 p-1 rounded-t-lg">
              {groupKeys.map(moduleId => {
                const module = modules.find(m => m.module_id === moduleId);
                const groupName = module ? module.module_name : moduleId;
                const count = filteredGroups[moduleId] ? filteredGroups[moduleId].length : 0;
                const isActive = activeTabId === moduleId;

                return (
                  <button
                    key={moduleId}
                    onClick={() => {
                      setActiveTypeTab(moduleId);
                      navigateTo('cfg_type', { module: moduleId });
                    }}
                    className={`px-4 py-2.5 text-sm font-medium transition-all relative rounded-t-md flex items-center space-x-2 border-b-2 -mb-[1px] ${
                      isActive
                        ? 'border-teal-500 text-teal-400 bg-slate-900/40 font-semibold'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-905/10'
                    }`}
                  >
                    <span>{groupName}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                      isActive
                        ? 'bg-teal-950 text-teal-300 border border-teal-800'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Tab Table Content */}
            {activeTabId && (
              <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/10">
                {filteredGroups[activeTabId] && filteredGroups[activeTabId].length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/20">
                          <th className="p-4 pl-6">Type ID</th>
                          <th className="p-4">Entity Type</th>
                          <th className="p-4">Notes</th>
                          <th className="p-4">Metadata Schema</th>
                          <th className="p-4 text-right pr-6">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filteredGroups[activeTabId].map(t => (
                          <tr key={t.type_id} className="hover:bg-slate-900/30 transition">
                            <td className="p-4 pl-6 font-mono text-slate-400">{t.type_id}</td>
                            <td className="p-4 font-medium text-slate-200">{t.config_type}</td>
                            <td className="p-4 text-slate-400 max-w-xs truncate">{t.notes || '—'}</td>
                            <td className="p-4 font-mono text-xs">
                              <pre className="p-2 bg-slate-950 text-emerald-400 rounded max-w-xs overflow-auto max-h-24">
                                {JSON.stringify(t.metadata_schema, null, 2)}
                              </pre>
                            </td>
                            <td className="p-4 text-right pr-6 space-x-2">
                              <button onClick={() => openEditModal('cfg_type', t)} className="p-1.5 hover:text-teal-400 transition" title="Edit">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete('cfg_type', t)} className="p-1.5 hover:text-rose-400 transition" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-12 text-slate-500 bg-slate-900/5">
                    No entity types found for this module.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
      case 'cfg_event_types': {
        const filtered = eventTypes.filter(
          e =>
            e.event_type_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.module_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.display_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/50">
                  <th className="p-4">Event Type Code</th>
                  <th className="p-4">Module Code</th>
                  <th className="p-4">Display Name</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map(e => (
                  <tr key={e.event_type_code} className="hover:bg-slate-900/30 transition">
                    <td className="p-4 font-mono font-bold text-violet-400">{e.event_type_code}</td>
                    <td className="p-4"><span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">{e.module_code}</span></td>
                    <td className="p-4 text-slate-200">{e.display_name}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => openEditModal('cfg_event_types', e)} className="p-1.5 hover:text-teal-400 transition" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete('cfg_event_types', e)} className="p-1.5 hover:text-rose-400 transition" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">No event types found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      }
      case 'cfg_dimensions': {
        const filtered = dimensions.filter(
          d =>
            d.dimension_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.unit_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/50">
                  <th className="p-4">Dimension Code</th>
                  <th className="p-4">Unit Code</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map(d => (
                  <tr key={d.dimension_code} className="hover:bg-slate-900/30 transition">
                    <td className="p-4 font-mono font-bold text-sky-400">{d.dimension_code}</td>
                    <td className="p-4 font-mono text-slate-300">{d.unit_code}</td>
                    <td className="p-4 text-slate-400">{d.description}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => openEditModal('cfg_dimensions', d)} className="p-1.5 hover:text-teal-400 transition" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete('cfg_dimensions', d)} className="p-1.5 hover:text-rose-400 transition" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">No dimensions found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      }
      case 'cfg_attribute_keys': {
        const filtered = attributeKeys.filter(
          a =>
            a.event_type_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.attribute_key.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/50">
                  <th className="p-4">Event Type</th>
                  <th className="p-4">Attribute Key</th>
                  <th className="p-4">Required</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((a, idx) => (
                  <tr key={`${a.event_type_code}-${a.attribute_key}-${idx}`} className="hover:bg-slate-900/30 transition">
                    <td className="p-4"><span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-violet-950 text-violet-300 border border-violet-850">{a.event_type_code}</span></td>
                    <td className="p-4 font-mono font-bold text-slate-200">{a.attribute_key}</td>
                    <td className="p-4">
                      {a.is_required === 1 ? (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800">Required</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-400">Optional</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => openEditModal('cfg_attribute_keys', a)} className="p-1.5 hover:text-teal-400 transition" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete('cfg_attribute_keys', a)} className="p-1.5 hover:text-rose-400 transition" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">No attribute keys found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      }
      case 'twin_event': {
        const filtered = events.filter(
          e =>
            e.event_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.event_type_code.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/50">
                  <th className="p-4">Event ID</th>
                  <th className="p-4">Event Type</th>
                  <th className="p-4">Occurred At</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map(e => (
                  <tr key={e.event_id} className="hover:bg-slate-900/30 transition">
                    <td className="p-4 font-mono font-bold text-emerald-400">{e.event_id}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-violet-950 text-violet-300 border border-violet-850">
                        {e.event_type_code}
                      </span>
                    </td>
                    <td className="p-4 text-slate-200">{e.occurred_at ? new Date(e.occurred_at).toLocaleString() : '—'}</td>
                    <td className="p-4 text-slate-500 text-xs">{e.created_at ? new Date(e.created_at).toLocaleString() : '—'}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => openEditModal('twin_event', e)} className="p-1.5 hover:text-teal-400 transition" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete('twin_event', e)} className="p-1.5 hover:text-rose-400 transition" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">No events ledger entries found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      }
      case 'twin_impact': {
        const filtered = impacts.filter(
          i =>
            i.impact_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.event_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.dimension_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.target_entity.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/50">
                  <th className="p-4">Impact ID</th>
                  <th className="p-4">Event ID</th>
                  <th className="p-4">Dimension</th>
                  <th className="p-4">Value</th>
                  <th className="p-4">Target Entity</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map(i => (
                  <tr key={i.impact_id} className="hover:bg-slate-900/30 transition">
                    <td className="p-4 font-mono font-bold text-sky-400">{i.impact_id}</td>
                    <td className="p-4 font-mono text-emerald-300 hover:underline"><a href="#events">{i.event_id}</a></td>
                    <td className="p-4 font-mono text-xs">{i.dimension_code}</td>
                    <td className={`p-4 font-semibold ${i.value < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {i.value > 0 ? `+${i.value}` : i.value}
                    </td>
                    <td className="p-4 text-slate-200">{i.target_entity}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => openEditModal('twin_impact', i)} className="p-1.5 hover:text-teal-400 transition" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete('twin_impact', i)} className="p-1.5 hover:text-rose-400 transition" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">No event impacts found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      }
      case 'event_details': {
        const filtered = eventDetails.filter(
          d =>
            d.event_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.attribute_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.attribute_val.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/50">
                  <th className="p-4">Event ID</th>
                  <th className="p-4">Attribute Key</th>
                  <th className="p-4">Attribute Value</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((d, idx) => (
                  <tr key={`${d.event_id}-${d.attribute_key}-${idx}`} className="hover:bg-slate-900/30 transition">
                    <td className="p-4 font-mono text-emerald-300">{d.event_id}</td>
                    <td className="p-4 font-mono font-bold text-slate-200">{d.attribute_key}</td>
                    <td className="p-4 text-slate-400 max-w-sm truncate">{d.attribute_val}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => openEditModal('event_details', d)} className="p-1.5 hover:text-teal-400 transition" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete('event_details', d)} className="p-1.5 hover:text-rose-400 transition" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">No event details found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      }
      default:
        return null;
    }
  };

  // Render Entity Management Drill-Down Layout
  const renderEntityManagement = () => {
    const filteredPersons = persons.filter(p => 
      `${p.first_name} ${p.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredFinEntities = finEntities.filter(f => 
      f.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.bank_name && f.bank_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.account_number && f.account_number.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const modulesList = [
      {
        id: 'identity',
        label: 'Identity Registry',
        icon: Users,
        types: [
          { code: 'PERSON', label: 'Persons', icon: User }
        ]
      },
      {
        id: 'finance',
        label: 'Financial Ledger',
        icon: Coins,
        types: [
          { code: 'BANK_ACCOUNT', label: 'Bank Accounts', icon: Landmark },
          { code: 'CREDIT_CARD', label: 'Credit Cards', icon: CreditCard },
          { code: 'LOAN', label: 'Loans & Liabilities', icon: Percent },
          { code: 'FIXED_DEPOSIT', label: 'Fixed Deposits', icon: Coins },
          { code: 'OVERDRAFT', label: 'Overdrafts', icon: PiggyBank }
        ]
      }
    ];

    return (
      <div className="flex flex-col lg:flex-row gap-6 min-h-[500px]">
        {/* Left Sub-Sidebar (Drilldown Nav) */}
        <div className="w-full lg:w-64 shrink-0 space-y-4">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-6 backdrop-blur-md">
            <h3 className="text-slate-400 text-xs font-mono font-semibold uppercase tracking-wider px-2">Navigation</h3>
            
            <div className="space-y-4">
              {modulesList.map(mod => (
                <div key={mod.id} className="space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-350 font-semibold text-xs uppercase tracking-wider px-2 py-1 bg-slate-950/20 rounded-md">
                    <mod.icon className="w-3.5 h-3.5 text-teal-400" />
                    <span>{mod.label}</span>
                  </div>
                  
                  <div className="space-y-0.5 pl-2">
                    {mod.types.map(type => {
                      const isActive = selectedEntityType === type.code;
                      return (
                        <button
                          key={type.code}
                          onClick={() => {
                            setSelectedEntityType(type.code);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-sm flex items-center justify-between transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-teal-500/10 to-indigo-500/10 text-teal-400 border border-teal-805/40 font-medium'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <type.icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
                            <span>{type.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 space-y-4 min-w-0">
          <div className="bg-slate-900/20 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden">
            {/* Header inside view */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-200 text-lg">
                  {selectedEntityType === 'PERSON' ? 'Persons Directory' : `${selectedEntityType.replace(/_/g, ' ')}s Registry`}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Manage active entities registered in this node.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
                  <input
                    type="text"
                    placeholder="Search registry..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200 placeholder-slate-500 transition"
                  />
                </div>
                <button
                  onClick={openEntityCreateModal}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-600 hover:to-indigo-600 text-slate-950 font-bold rounded-xl flex items-center gap-2 shadow-lg transition"
                >
                  <Plus className="w-4 h-4" />
                  Add New
                </button>
              </div>
            </div>

            {/* Dynamic Data Table */}
            <div className="overflow-x-auto">
              {selectedEntityType === 'PERSON' ? (
                // PERSON Table
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/20">
                      <th className="p-4 pl-6">Person ID</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Nationality</th>
                      <th className="p-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredPersons.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-slate-500">No persons found.</td>
                      </tr>
                    ) : (
                      filteredPersons.map(p => (
                        <tr key={p.person_id} className="hover:bg-slate-900/30 transition">
                          <td className="p-4 pl-6 font-mono text-xs text-slate-400 truncate max-w-[120px]">{p.person_id}</td>
                          <td className="p-4 font-medium text-slate-200">
                            {p.first_name} {p.last_name || ''}
                          </td>
                          <td className="p-4 text-slate-400">{p.email || '—'}</td>
                          <td className="p-4 text-slate-400">{p.phone_number || '—'}</td>
                          <td className="p-4 text-slate-400">{p.nationality || '—'}</td>
                          <td className="p-4 text-right pr-6 space-x-2">
                            <button onClick={() => openEntityDetailModal(p)} className="px-2.5 py-1 text-xs bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg transition">Details</button>
                            <button onClick={() => openEntityEditModal(p)} className="p-1 hover:text-teal-400 transition" title="Edit"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleEntityDelete(p)} className="p-1 hover:text-rose-400 transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                // Financial Entities Table
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/20">
                      <th className="p-4 pl-6">Entity ID</th>
                      <th className="p-4">Entity Name</th>
                      <th className="p-4">Owner</th>
                      <th className="p-4">Balance</th>
                      <th className="p-4">Status</th>
                      {selectedEntityType === 'BANK_ACCOUNT' && <th className="p-4">Routing / IFSC</th>}
                      {selectedEntityType === 'CREDIT_CARD' && <th className="p-4">Limit</th>}
                      {selectedEntityType === 'LOAN' && <th className="p-4">Sanctioned</th>}
                      {selectedEntityType === 'FIXED_DEPOSIT' && <th className="p-4">Principal</th>}
                      {selectedEntityType === 'OVERDRAFT' && <th className="p-4">OD Limit</th>}
                      <th className="p-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredFinEntities.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-slate-500">No financial entities found.</td>
                      </tr>
                    ) : (
                      filteredFinEntities.map(f => {
                        const owner = persons.find(p => p.person_id === f.owner_person_id);
                        return (
                          <tr key={f.fin_entity_id} className="hover:bg-slate-900/30 transition">
                            <td className="p-4 pl-6 font-mono text-xs text-slate-400 truncate max-w-[120px]">{f.fin_entity_id}</td>
                            <td className="p-4 font-medium text-slate-200">{f.entity_name}</td>
                            <td className="p-4 text-slate-450">{owner ? `${owner.first_name} ${owner.last_name || ''}` : '—'}</td>
                            <td className="p-4 font-semibold text-slate-300">
                              {f.balance.toLocaleString('en-US', { style: 'currency', currency: f.currency })}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-xxs font-mono font-bold ${
                                f.is_active
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                                  : 'bg-rose-950/80 text-rose-300 border border-rose-800/40'
                              }`}>
                                {f.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            {selectedEntityType === 'BANK_ACCOUNT' && (
                              <td className="p-4 text-slate-450 font-mono text-xs">
                                {f.ifsc ? `IFSC: ${f.ifsc}` : (f.sort_code ? `Sort: ${f.sort_code}` : '—')}
                              </td>
                            )}
                            {selectedEntityType === 'CREDIT_CARD' && (
                              <td className="p-4 text-slate-400 font-semibold">
                                {f.credit_limit ? f.credit_limit.toLocaleString('en-US', { style: 'currency', currency: f.currency }) : '—'}
                              </td>
                            )}
                            {selectedEntityType === 'LOAN' && (
                              <td className="p-4 text-slate-450 font-semibold">
                                {f.sanctioned_amount ? f.sanctioned_amount.toLocaleString('en-US', { style: 'currency', currency: f.currency }) : '—'}
                              </td>
                            )}
                            {selectedEntityType === 'FIXED_DEPOSIT' && (
                              <td className="p-4 text-slate-450 font-semibold">
                                {f.principal_amount ? f.principal_amount.toLocaleString('en-US', { style: 'currency', currency: f.currency }) : '—'}
                              </td>
                            )}
                            {selectedEntityType === 'OVERDRAFT' && (
                              <td className="p-4 text-slate-450 font-semibold">
                                {f.overdraft_limit ? f.overdraft_limit.toLocaleString('en-US', { style: 'currency', currency: f.currency }) : '—'}
                              </td>
                            )}
                            <td className="p-4 text-right pr-6 space-x-2">
                              <button onClick={() => openEntityDetailModal(f)} className="px-2.5 py-1 text-xs bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg transition font-medium">Details</button>
                              <button onClick={() => openEntityEditModal(f)} className="p-1 hover:text-teal-400 transition" title="Edit"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleEntityDelete(f)} className="p-1 hover:text-rose-400 transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 z-50 border transition-all duration-300 ${
            toast.type === 'error'
              ? 'bg-rose-950/80 border-rose-800 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
          } backdrop-blur-md`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/40 backdrop-blur-lg flex flex-col flex-shrink-0">
        {/* Header Branding */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-teal-500 to-indigo-500 rounded-lg">
            <Database className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">Digital Twin</h1>
            <p className="text-xxs text-slate-500 font-mono">CORE ENGINE</p>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {['Overview', 'Config', 'Operational Ledger'].map(group => {
            const isExpanded = expandedGroups[group] !== false;
            return (
              <div key={group} className="space-y-2">
                <button
                  onClick={() => setExpandedGroups(prev => ({ ...prev, [group]: !isExpanded }))}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xxs font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest font-mono focus:outline-none transition-colors duration-150 cursor-pointer text-left"
                >
                  <span>{group}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-500 hover:text-slate-300 ${
                      isExpanded ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                </button>
                <div className={`sidebar-accordion-wrapper ${isExpanded ? 'expanded' : ''}`}>
                  <div className="sidebar-accordion-content">
                    <ul className="space-y-1 pt-1">
                      {navItems
                        .filter(item => item.group === group)
                        .map(item => {
                          const Icon = item.icon;
                          const isActive = activeMenu === item.id;
                          return (
                            <li key={item.id}>
                              <button
                                onClick={() => navigateTo(item.id as MenuSection)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
                                  isActive
                                    ? 'bg-gradient-to-r from-teal-950 to-indigo-950 text-teal-300 font-medium border-l-2 border-teal-500'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                                }`}
                              >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
                                {item.label}
                              </button>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 text-slate-600 text-xxs font-mono text-center">
          SYSTEM VERSION 2.1.0
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-slate-900/20 to-slate-950">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 px-8 flex items-center justify-between bg-slate-900/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-slate-200 capitalize">
              {activeMenu === 'dashboard' ? 'Dashboard Overview' : getMenuLabel(activeMenu)}
            </h2>
            {loading && <RefreshCw className="w-4 h-4 text-teal-400 animate-spin" />}
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live Sync
            </span>
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-4.5 h-4.5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-400" />
              <div>
                <h4 className="font-semibold text-rose-200">API Connection Issue</h4>
                <p className="text-sm text-rose-300/80 mt-1">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold bg-rose-900/60 hover:bg-rose-900 text-rose-200 rounded-md border border-rose-700/60 transition"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          )}

          {activeMenu === 'dashboard' ? (
            <div className="space-y-8">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Modules', count: summary?.counts.cfg_modules ?? 0, desc: 'Operational Domains', color: 'from-teal-500/10 to-emerald-500/10 border-teal-800/40 text-teal-400' },
                  { title: 'Entity Types', count: summary?.counts.cfg_type ?? 0, desc: 'Entity category schemas', color: 'from-indigo-500/10 to-violet-500/10 border-indigo-800/40 text-indigo-400' },
                  { title: 'Event Types', count: summary?.counts.cfg_event_types ?? 0, desc: 'Supported life event types', color: 'from-pink-500/10 to-rose-500/10 border-pink-800/40 text-pink-400' },
                  { title: 'Dimensions', count: summary?.counts.cfg_dimensions ?? 0, desc: 'Tracking and metric units', color: 'from-sky-500/10 to-blue-500/10 border-sky-800/40 text-sky-400' },
                  { title: 'Attribute Keys', count: summary?.counts.cfg_attribute_keys ?? 0, desc: 'Validation keys for events', color: 'from-amber-500/10 to-orange-500/10 border-amber-800/40 text-amber-400' },
                  { title: 'Events Logged', count: summary?.counts.twin_event ?? 0, desc: 'Timeline entries ledger', color: 'from-emerald-500/10 to-teal-500/10 border-emerald-800/40 text-emerald-400' },
                  { title: 'Ledger Impacts', count: summary?.counts.twin_impact ?? 0, desc: 'Impact balances adjustments', color: 'from-purple-500/10 to-fuchsia-500/10 border-purple-800/40 text-purple-400' },
                  { title: 'Audit Logs', count: summary?.counts.audit_log ?? 0, desc: 'Traceability kaalam actions', color: 'from-slate-500/10 to-zinc-500/10 border-slate-800/40 text-slate-400' }
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className={`bg-gradient-to-tr ${stat.color} p-6 rounded-2xl border backdrop-blur-md shadow-lg flex flex-col justify-between h-36`}
                  >
                    <div>
                      <h3 className="text-slate-400 text-xs font-mono font-semibold uppercase tracking-wider">{stat.title}</h3>
                      <p className="text-slate-500 text-xxs mt-0.5">{stat.desc}</p>
                    </div>
                    <p className={`text-4xl font-bold font-mono ${stat.color.split(' ').pop()}`}>
                      {loading ? '...' : stat.count}
                    </p>
                  </div>
                ))}
              </div>

              {/* Explanatory banner */}
              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl flex gap-4 items-start shadow-xl backdrop-blur-md">
                <div className="p-3 bg-indigo-950 text-indigo-400 rounded-xl border border-indigo-900">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200 text-lg">Personal Life Operating System Schema</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    This workspace serves as the configuration and auditing interface for the PLOS. It has two main layers:
                  </p>
                  <ul className="list-disc list-inside text-sm text-slate-400 mt-3 space-y-1 bg-slate-950/40 p-4 rounded-xl border border-slate-900 font-mono">
                    <li><strong className="text-slate-200 font-semibold">Configuration Layer:</strong> Customise modules, config sub-categories, specific event models, metric dimensions, and parameter verification keys.</li>
                    <li><strong className="text-slate-200 font-semibold">Operational Layer:</strong> Ledger capturing live user events, financial/experience impacts, and detailed metadata attributes.</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : activeMenu === 'entity_management' ? (
            renderEntityManagement()
          ) : (
            /* CRUD View */
            <div className="bg-slate-900/20 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden">
              {/* Header inside CRUD view */}
              <div className="p-6 border-b border-slate-800 bg-slate-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200 placeholder-slate-500 transition"
                  />
                </div>
                <button
                  onClick={() => openCreateModal(activeMenu)}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-600 hover:to-indigo-600 text-slate-950 font-bold rounded-xl flex items-center gap-2 shadow-lg transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Record
                </button>
              </div>

              {/* Data Table */}
              {renderTable()}
            </div>
          )}
        </div>
      </main>

      {/* Dynamic Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <h3 className="font-semibold text-slate-200 text-lg">
                {modalType === 'create' ? 'Create' : 'Edit'} {getMenuLabel(activeMenu, true)}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {activeMenu === 'cfg_modules' && (
                <>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Module ID (Primary Key)</label>
                    <input
                      type="text"
                      disabled={modalType === 'edit'}
                      required
                      placeholder="e.g. FIN"
                      maxLength={10}
                      value={formModule.module_id}
                      onChange={e => setFormModule(prev => ({ ...prev, module_id: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 disabled:opacity-50 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Module Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Finance"
                      value={formModule.module_name}
                      onChange={e => setFormModule(prev => ({ ...prev, module_name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Notes</label>
                    <textarea
                      placeholder="Notes or operational description..."
                      value={formModule.notes}
                      onChange={e => setFormModule(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200 h-24 resize-none"
                    />
                  </div>
                </>
              )}

              {activeMenu === 'cfg_type' && (
                <>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Module ID (Foreign Key)</label>
                    <select
                      value={formType.module_id}
                      onChange={e => setFormType(prev => ({ ...prev, module_id: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200"
                    >
                      {modules.map(m => (
                        <option key={m.module_id} value={m.module_id}>{m.module_id} - {m.module_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Entity Type</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BANK_ACCOUNT"
                      value={formType.config_type}
                      onChange={e => setFormType(prev => ({ ...prev, config_type: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Notes</label>
                    <textarea
                      placeholder="Notes or operational description..."
                      value={formType.notes}
                      onChange={e => setFormType(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200 h-20 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Metadata Schema (JSON)</label>
                    <textarea
                      required
                      placeholder='{"required_field": true}'
                      value={formType.metadata_schema}
                      onChange={e => setFormType(prev => ({ ...prev, metadata_schema: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-emerald-400 font-mono h-28 resize-none"
                    />
                  </div>
                </>
              )}

              {activeMenu === 'cfg_event_types' && (
                <>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Event Type Code (Primary Key)</label>
                    <input
                      type="text"
                      disabled={modalType === 'edit'}
                      required
                      placeholder="e.g. FIN_INVOICE"
                      value={formEventType.event_type_code}
                      onChange={e => setFormEventType(prev => ({ ...prev, event_type_code: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 disabled:opacity-50 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Module Code (Foreign Key)</label>
                    <select
                      value={formEventType.module_code}
                      onChange={e => setFormEventType(prev => ({ ...prev, module_code: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200"
                    >
                      {modules.map(m => (
                        <option key={m.module_id} value={m.module_id}>{m.module_id} - {m.module_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Display Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Customer Invoice Issued"
                      value={formEventType.display_name}
                      onChange={e => setFormEventType(prev => ({ ...prev, display_name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200"
                    />
                  </div>
                </>
              )}

              {activeMenu === 'cfg_dimensions' && (
                <>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Dimension Code (Primary Key)</label>
                    <input
                      type="text"
                      disabled={modalType === 'edit'}
                      required
                      placeholder="e.g. CURRENCY_USD"
                      value={formDimension.dimension_code}
                      onChange={e => setFormDimension(prev => ({ ...prev, dimension_code: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 disabled:opacity-50 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Unit Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. USD, MMHG, BPM"
                      value={formDimension.unit_code}
                      onChange={e => setFormDimension(prev => ({ ...prev, unit_code: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Description</label>
                    <input
                      type="text"
                      required
                      placeholder="Description of metric context..."
                      value={formDimension.description}
                      onChange={e => setFormDimension(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200"
                    />
                  </div>
                </>
              )}

              {activeMenu === 'cfg_attribute_keys' && (
                <>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Event Type Code (Primary Key)</label>
                    <select
                      disabled={modalType === 'edit'}
                      value={formAttributeKey.event_type_code}
                      onChange={e => setFormAttributeKey(prev => ({ ...prev, event_type_code: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 disabled:opacity-50 text-slate-200"
                    >
                      {eventTypes.map(et => (
                        <option key={et.event_type_code} value={et.event_type_code}>{et.event_type_code} - {et.display_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Attribute Key (Primary Key)</label>
                    <input
                      type="text"
                      disabled={modalType === 'edit'}
                      required
                      placeholder="e.g. item_name"
                      value={formAttributeKey.attribute_key}
                      onChange={e => setFormAttributeKey(prev => ({ ...prev, attribute_key: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 disabled:opacity-50 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Is Required</label>
                    <select
                      value={formAttributeKey.is_required}
                      onChange={e => setFormAttributeKey(prev => ({ ...prev, is_required: Number(e.target.value) }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200"
                    >
                      <option value={0}>Optional (0)</option>
                      <option value={1}>Required (1)</option>
                    </select>
                  </div>
                </>
              )}

              {activeMenu === 'twin_event' && (
                <>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Event ID (Primary Key)</label>
                    <input
                      type="text"
                      disabled={modalType === 'edit'}
                      required
                      placeholder="e.g. ev-001"
                      value={formEvent.event_id}
                      onChange={e => setFormEvent(prev => ({ ...prev, event_id: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 disabled:opacity-50 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Event Type Code (Foreign Key)</label>
                    <select
                      value={formEvent.event_type_code}
                      onChange={e => setFormEvent(prev => ({ ...prev, event_type_code: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200"
                    >
                      {eventTypes.map(et => (
                        <option key={et.event_type_code} value={et.event_type_code}>{et.event_type_code} - {et.display_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Occurred At</label>
                    <input
                      type="datetime-local"
                      required
                      value={formEvent.occurred_at}
                      onChange={e => setFormEvent(prev => ({ ...prev, occurred_at: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200"
                    />
                  </div>
                </>
              )}

              {activeMenu === 'twin_impact' && (
                <>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Impact ID (Primary Key)</label>
                    <input
                      type="text"
                      disabled={modalType === 'edit'}
                      required
                      placeholder="e.g. imp-001"
                      value={formImpact.impact_id}
                      onChange={e => setFormImpact(prev => ({ ...prev, impact_id: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 disabled:opacity-50 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Event ID (Foreign Key)</label>
                    <select
                      value={formImpact.event_id}
                      onChange={e => setFormImpact(prev => ({ ...prev, event_id: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200"
                    >
                      {events.map(ev => (
                        <option key={ev.event_id} value={ev.event_id}>{ev.event_id} ({ev.event_type_code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Dimension Code (Foreign Key)</label>
                    <select
                      value={formImpact.dimension_code}
                      onChange={e => setFormImpact(prev => ({ ...prev, dimension_code: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200"
                    >
                      {dimensions.map(d => (
                        <option key={d.dimension_code} value={d.dimension_code}>{d.dimension_code} - {d.description}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Value (Numeric)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. -4500.00"
                      value={formImpact.value}
                      onChange={e => setFormImpact(prev => ({ ...prev, value: Number(e.target.value) }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Target Entity</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ACCOUNTS_RECEIVABLE"
                      value={formImpact.target_entity}
                      onChange={e => setFormImpact(prev => ({ ...prev, target_entity: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200"
                    />
                  </div>
                </>
              )}

              {activeMenu === 'event_details' && (
                <>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Event ID (Primary Key)</label>
                    <select
                      disabled={modalType === 'edit'}
                      value={formEventDetail.event_id}
                      onChange={e => setFormEventDetail(prev => ({ ...prev, event_id: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 disabled:opacity-50 text-slate-200"
                    >
                      {events.map(ev => (
                        <option key={ev.event_id} value={ev.event_id}>{ev.event_id} ({ev.event_type_code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Attribute Key (Primary Key)</label>
                    <input
                      type="text"
                      disabled={modalType === 'edit'}
                      required
                      placeholder="e.g. serial_no"
                      value={formEventDetail.attribute_key}
                      onChange={e => setFormEventDetail(prev => ({ ...prev, attribute_key: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 disabled:opacity-50 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Attribute Value</label>
                    <input
                      type="text"
                      required
                      placeholder="Attribute text description..."
                      value={formEventDetail.attribute_val}
                      onChange={e => setFormEventDetail(prev => ({ ...prev, attribute_val: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200"
                    />
                  </div>
                </>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-slate-200 font-semibold rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-600 hover:to-indigo-600 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Polymorphic Entity CRUD Modal */}
      {entityModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <h3 className="font-semibold text-slate-200 text-lg">
                {entityModalType === 'create' ? 'Create' : 'Edit'} {selectedEntityType === 'PERSON' ? 'Person Profile' : selectedEntityType.replace(/_/g, ' ')}
              </h3>
              <button onClick={() => setEntityModalOpen(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEntitySubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {selectedEntityType === 'PERSON' ? (
                // PERSON FORM FIELDS
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">First Name *</label>
                    <input type="text" required value={formPerson.first_name} onChange={e => setFormPerson(prev => ({ ...prev, first_name: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Last Name</label>
                    <input type="text" value={formPerson.last_name} onChange={e => setFormPerson(prev => ({ ...prev, last_name: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Email</label>
                    <input type="email" value={formPerson.email} onChange={e => setFormPerson(prev => ({ ...prev, email: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Phone Number</label>
                    <input type="text" value={formPerson.phone_number} onChange={e => setFormPerson(prev => ({ ...prev, phone_number: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Date of Birth</label>
                    <input type="date" value={formPerson.date_of_birth} onChange={e => setFormPerson(prev => ({ ...prev, date_of_birth: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Gender</label>
                    <select value={formPerson.gender} onChange={e => setFormPerson(prev => ({ ...prev, gender: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">City</label>
                    <input type="text" value={formPerson.city} onChange={e => setFormPerson(prev => ({ ...prev, city: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Country</label>
                    <input type="text" value={formPerson.country} onChange={e => setFormPerson(prev => ({ ...prev, country: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                  </div>
                </div>
              ) : (
                // FINANCIAL ENTITY FORM FIELDS
                <div className="space-y-4">
                  {/* Shared Fields Section */}
                  <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 space-y-4">
                    <h4 className="text-slate-400 text-xs font-mono font-semibold uppercase tracking-wider">Core Shared Fields</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-mono text-slate-400 mb-1.5">Entity Name *</label>
                        <input type="text" required placeholder="e.g. Chase Checking, Barclays Card" value={formFinEntity.entity_name} onChange={e => setFormFinEntity(prev => ({ ...prev, entity_name: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-mono text-slate-400 mb-1.5">Owner *</label>
                        <select required value={formFinEntity.owner_person_id} onChange={e => setFormFinEntity(prev => ({ ...prev, owner_person_id: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200">
                          {persons.map(p => (
                            <option key={p.person_id} value={p.person_id}>{p.first_name} {p.last_name || ''}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-mono text-slate-400 mb-1.5">Currency *</label>
                        <select value={formFinEntity.currency} onChange={e => setFormFinEntity(prev => ({ ...prev, currency: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200">
                          <option value="USD">USD ($)</option>
                          <option value="INR">INR (₹)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="EUR">EUR (€)</option>
                        </select>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-mono text-slate-400 mb-1.5">Balance / Principal / Spent *</label>
                        <input type="number" step="0.01" required value={formFinEntity.balance} onChange={e => setFormFinEntity(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex items-center">
                        <label className="flex items-center gap-2 text-slate-300 text-sm h-full pt-4">
                          <input type="checkbox" checked={formFinEntity.is_active} onChange={e => setFormFinEntity(prev => ({ ...prev, is_active: e.target.checked }))} className="w-4 h-4 accent-teal-500 rounded border-slate-800 bg-slate-950" />
                          Is Active
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Conditional Fields Section */}
                  <div className="p-4 bg-slate-950/20 rounded-xl border border-slate-850 space-y-4">
                    <h4 className="text-slate-400 text-xs font-mono font-semibold uppercase tracking-wider">Type Specific Fields ({selectedEntityType.replace(/_/g, ' ')})</h4>
                    
                    {selectedEntityType === 'BANK_ACCOUNT' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Bank Name</label>
                          <input type="text" placeholder="e.g. Barclays Bank" value={formFinEntity.bank_name || ''} onChange={e => setFormFinEntity(prev => ({ ...prev, bank_name: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Account Number</label>
                          <input type="text" value={formFinEntity.account_number || ''} onChange={e => setFormFinEntity(prev => ({ ...prev, account_number: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">IFSC (India)</label>
                          <input type="text" placeholder="BARC0000001" value={formFinEntity.ifsc || ''} onChange={e => setFormFinEntity(prev => ({ ...prev, ifsc: e.target.value.toUpperCase() }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Sort Code (UK)</label>
                          <input type="text" placeholder="200000" value={formFinEntity.sort_code || ''} onChange={e => setFormFinEntity(prev => ({ ...prev, sort_code: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">IBAN</label>
                          <input type="text" value={formFinEntity.iban || ''} onChange={e => setFormFinEntity(prev => ({ ...prev, iban: e.target.value.toUpperCase() }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                      </div>
                    )}

                    {selectedEntityType === 'CREDIT_CARD' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Masked Card Number</label>
                          <input type="text" placeholder="XXXX-XXXX-XXXX-1234" value={formFinEntity.card_number_masked || ''} onChange={e => setFormFinEntity(prev => ({ ...prev, card_number_masked: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Card Network</label>
                          <select value={formFinEntity.card_network} onChange={e => setFormFinEntity(prev => ({ ...prev, card_network: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200">
                            <option value="VISA">VISA</option>
                            <option value="MASTERCARD">MASTERCARD</option>
                            <option value="AMEX">AMEX</option>
                            <option value="RUPAY">RUPAY</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Cardholder Name</label>
                          <input type="text" value={formFinEntity.card_holder_name || ''} onChange={e => setFormFinEntity(prev => ({ ...prev, card_holder_name: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Credit Limit</label>
                          <input type="number" step="0.01" value={formFinEntity.credit_limit} onChange={e => setFormFinEntity(prev => ({ ...prev, credit_limit: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Available Limit</label>
                          <input type="number" step="0.01" value={formFinEntity.available_limit} onChange={e => setFormFinEntity(prev => ({ ...prev, available_limit: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Statement Day (1-31)</label>
                          <input type="number" min="1" max="31" value={formFinEntity.statement_date_day} onChange={e => setFormFinEntity(prev => ({ ...prev, statement_date_day: parseInt(e.target.value) || 1 }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Payment Due Day (1-31)</label>
                          <input type="number" min="1" max="31" value={formFinEntity.payment_due_date_day} onChange={e => setFormFinEntity(prev => ({ ...prev, payment_due_date_day: parseInt(e.target.value) || 1 }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                      </div>
                    )}

                    {selectedEntityType === 'LOAN' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Loan Type</label>
                          <select value={formFinEntity.loan_type} onChange={e => setFormFinEntity(prev => ({ ...prev, loan_type: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200">
                            <option value="HOME">Home Loan</option>
                            <option value="PERSONAL">Personal Loan</option>
                            <option value="AUTO">Auto Loan</option>
                          </select>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Sanctioned Amount</label>
                          <input type="number" step="0.01" value={formFinEntity.sanctioned_amount} onChange={e => setFormFinEntity(prev => ({ ...prev, sanctioned_amount: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Interest Type</label>
                          <select value={formFinEntity.interest_type} onChange={e => setFormFinEntity(prev => ({ ...prev, interest_type: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200">
                            <option value="FIXED">Fixed Rate</option>
                            <option value="FLOATING">Floating Rate</option>
                          </select>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Interest Rate (APR %)</label>
                          <input type="number" step="0.001" value={formFinEntity.interest_rate} onChange={e => setFormFinEntity(prev => ({ ...prev, interest_rate: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">EMI Amount</label>
                          <input type="number" step="0.01" value={formFinEntity.emi_amount} onChange={e => setFormFinEntity(prev => ({ ...prev, emi_amount: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Tenure (Months)</label>
                          <input type="number" value={formFinEntity.tenure_months} onChange={e => setFormFinEntity(prev => ({ ...prev, tenure_months: parseInt(e.target.value) || 12 }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                      </div>
                    )}

                    {selectedEntityType === 'FIXED_DEPOSIT' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Receipt Number</label>
                          <input type="text" value={formFinEntity.fd_receipt_number || ''} onChange={e => setFormFinEntity(prev => ({ ...prev, fd_receipt_number: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Principal Amount</label>
                          <input type="number" step="0.01" value={formFinEntity.principal_amount} onChange={e => setFormFinEntity(prev => ({ ...prev, principal_amount: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Interest Rate (APR %)</label>
                          <input type="number" step="0.001" value={formFinEntity.interest_rate} onChange={e => setFormFinEntity(prev => ({ ...prev, interest_rate: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Maturity Amount</label>
                          <input type="number" step="0.01" value={formFinEntity.maturity_amount} onChange={e => setFormFinEntity(prev => ({ ...prev, maturity_amount: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Booking Date</label>
                          <input type="date" value={formFinEntity.booking_date} onChange={e => setFormFinEntity(prev => ({ ...prev, booking_date: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Maturity Date</label>
                          <input type="date" value={formFinEntity.maturity_date} onChange={e => setFormFinEntity(prev => ({ ...prev, maturity_date: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Compounding Frequency</label>
                          <select value={formFinEntity.compounding_frequency} onChange={e => setFormFinEntity(prev => ({ ...prev, compounding_frequency: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200">
                            <option value="MONTHLY">Monthly</option>
                            <option value="QUARTERLY">Quarterly</option>
                            <option value="MATURITY">At Maturity</option>
                          </select>
                        </div>
                        <div className="col-span-2 sm:col-span-1 flex items-center">
                          <label className="flex items-center gap-2 text-slate-300 text-sm h-full pt-4">
                            <input type="checkbox" checked={formFinEntity.is_cumulative} onChange={e => setFormFinEntity(prev => ({ ...prev, is_cumulative: e.target.checked }))} className="w-4 h-4 accent-teal-500 rounded border-slate-800 bg-slate-950" />
                            Is Cumulative
                          </label>
                        </div>
                      </div>
                    )}

                    {selectedEntityType === 'OVERDRAFT' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Overdraft Limit</label>
                          <input type="number" step="0.01" value={formFinEntity.overdraft_limit} onChange={e => setFormFinEntity(prev => ({ ...prev, overdraft_limit: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Interest Rate (APR %)</label>
                          <input type="number" step="0.001" value={formFinEntity.interest_rate} onChange={e => setFormFinEntity(prev => ({ ...prev, interest_rate: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-mono text-slate-400 mb-1.5">Linked Parent Bank Account</label>
                          <select value={formFinEntity.linked_parent_entity_id} onChange={e => setFormFinEntity(prev => ({ ...prev, linked_parent_entity_id: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200">
                            <option value="">None</option>
                            {finEntities.filter(f => f.entity_type === 'BANK_ACCOUNT').map(f => (
                              <option key={f.fin_entity_id} value={f.fin_entity_id}>{f.entity_name} ({f.account_number || '—'})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Notes</label>
                    <textarea placeholder="Notes or operational description..." value={formFinEntity.notes || ''} onChange={e => setFormFinEntity(prev => ({ ...prev, notes: e.target.value }))} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200 h-20 resize-none" />
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setEntityModalOpen(false)} className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-slate-200 font-semibold rounded-xl text-sm transition">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-600 hover:to-indigo-600 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg">
                  Save Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Entity Details Profile Modal */}
      {detailModalOpen && selectedEntityDetails && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <h3 className="font-semibold text-slate-200 text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-teal-400" />
                <span>Entity Profile Details</span>
              </h3>
              <button onClick={() => setDetailModalOpen(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {selectedEntityType === 'PERSON' ? (
                // Person Profile Details
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                    <div className="w-12 h-12 bg-teal-950 border border-teal-850 rounded-full flex items-center justify-center text-teal-400 font-bold text-lg">
                      {selectedEntityDetails.first_name[0]}{selectedEntityDetails.last_name ? selectedEntityDetails.last_name[0] : ''}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-200 text-lg">{selectedEntityDetails.first_name} {selectedEntityDetails.last_name || ''}</h4>
                      <p className="text-slate-500 text-xs font-mono">{selectedEntityDetails.person_id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <span className="text-slate-500 text-xs block font-mono">Email</span>
                      <span className="text-slate-300">{selectedEntityDetails.email || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block font-mono">Phone Number</span>
                      <span className="text-slate-300">{selectedEntityDetails.phone_number || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block font-mono">Date of Birth</span>
                      <span className="text-slate-300">{selectedEntityDetails.date_of_birth ? new Date(selectedEntityDetails.date_of_birth).toLocaleDateString() : '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block font-mono">Gender</span>
                      <span className="text-slate-300">{selectedEntityDetails.gender || '—'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 text-xs block font-mono">Address</span>
                      <span className="text-slate-300">
                        {selectedEntityDetails.address_line1 || ''}
                        {selectedEntityDetails.address_line2 ? `, ${selectedEntityDetails.address_line2}` : ''}
                        {selectedEntityDetails.city ? `, ${selectedEntityDetails.city}` : ''}
                        {selectedEntityDetails.country ? `, ${selectedEntityDetails.country}` : ''}
                        {!selectedEntityDetails.address_line1 && '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                // Financial Entity Profile Details
                <div className="space-y-4">
                  <div className="pb-4 border-b border-slate-800">
                    <span className="px-2.5 py-0.5 rounded-full text-xxs font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800/40 uppercase tracking-wide">
                      {selectedEntityDetails.entity_type}
                    </span>
                    <h4 className="font-semibold text-slate-200 text-xl mt-2">{selectedEntityDetails.entity_name}</h4>
                    <p className="text-slate-500 text-xs font-mono mt-0.5">{selectedEntityDetails.fin_entity_id}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <span className="text-slate-500 text-xs block font-mono">Balance</span>
                      <span className="text-slate-200 font-semibold">
                        {selectedEntityDetails.balance.toLocaleString('en-US', { style: 'currency', currency: selectedEntityDetails.currency })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block font-mono">Status</span>
                      <span className={selectedEntityDetails.is_active ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                        {selectedEntityDetails.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {selectedEntityDetails.bank_name && (
                      <div>
                        <span className="text-slate-500 text-xs block font-mono">Bank Name</span>
                        <span className="text-slate-300">{selectedEntityDetails.bank_name}</span>
                      </div>
                    )}
                    {selectedEntityDetails.account_number && (
                      <div>
                        <span className="text-slate-500 text-xs block font-mono">Account Number</span>
                        <span className="text-slate-350">{selectedEntityDetails.account_number}</span>
                      </div>
                    )}
                    {selectedEntityDetails.ifsc && (
                      <div>
                        <span className="text-slate-500 text-xs block font-mono">IFSC</span>
                        <span className="text-slate-350">{selectedEntityDetails.ifsc}</span>
                      </div>
                    )}
                    {selectedEntityDetails.sort_code && (
                      <div>
                        <span className="text-slate-500 text-xs block font-mono">Sort Code</span>
                        <span className="text-slate-350">{selectedEntityDetails.sort_code}</span>
                      </div>
                    )}
                    {selectedEntityDetails.iban && (
                      <div className="col-span-2">
                        <span className="text-slate-500 text-xs block font-mono">IBAN</span>
                        <span className="text-slate-350 font-mono text-xs">{selectedEntityDetails.iban}</span>
                      </div>
                    )}

                    {/* CC Limit */}
                    {selectedEntityDetails.credit_limit !== null && selectedEntityDetails.credit_limit !== undefined && (
                      <div>
                        <span className="text-slate-500 text-xs block font-mono">Credit Limit</span>
                        <span className="text-slate-300">
                          {selectedEntityDetails.credit_limit.toLocaleString('en-US', { style: 'currency', currency: selectedEntityDetails.currency })}
                        </span>
                      </div>
                    )}
                    {selectedEntityDetails.card_number_masked && (
                      <div>
                        <span className="text-slate-500 text-xs block font-mono">Card Number</span>
                        <span className="text-slate-300">{selectedEntityDetails.card_number_masked}</span>
                      </div>
                    )}

                    {/* Interest details */}
                    {selectedEntityDetails.interest_rate !== null && selectedEntityDetails.interest_rate !== undefined && (
                      <div>
                        <span className="text-slate-500 text-xs block font-mono">Interest Rate</span>
                        <span className="text-slate-300">{selectedEntityDetails.interest_rate}% APR</span>
                      </div>
                    )}
                    {selectedEntityDetails.tenure_months && (
                      <div>
                        <span className="text-slate-500 text-xs block font-mono">Tenure</span>
                        <span className="text-slate-300">{selectedEntityDetails.tenure_months} Months</span>
                      </div>
                    )}
                  </div>
                  
                  {selectedEntityDetails.notes && (
                    <div className="pt-2">
                      <span className="text-slate-500 text-xs block font-mono">Notes</span>
                      <p className="text-slate-300 text-xs bg-slate-950/40 p-3 rounded-lg border border-slate-850 mt-1">{selectedEntityDetails.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-800 flex justify-end bg-slate-950/25">
              <button onClick={() => setDetailModalOpen(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-350 font-semibold rounded-xl text-sm transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
