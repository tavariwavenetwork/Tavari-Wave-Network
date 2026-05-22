import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'EN' | 'ES' | 'FR' | 'DE' | 'ZH' | 'HI';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  EN: {
    dashboard: "Dashboard",
    home: "Home",
    fund: "Fund",
    invest: "Invest",
    help: "Help",
    me: "Me",
    profile: "Profile",
    settings: "Settings",
    terminate: "Logout",
    search_assets: "SEARCH ASSETS",
    authenticated_as: "Authenticated as",
    status: "Status",
    view_privileges: "View Privileges",
    notifications: "Notifications",
    view_all: "View All",
    no_notifications: "No new notifications",
    mark_all_read: "Mark all as read",
    language: "Language",
    welcome_back: "Welcome back",
    total_balance: "Total Balance",
    available_balance: "Available Balance",
    invested_funds: "Invested Funds",
    locked_rewards: "Locked Rewards",
    recent_transactions: "Recent Transactions",
    market_overview: "Market Overview",
    top_assets: "Top Assets",
    performance: "Performance",
  },
  ES: {
    dashboard: "Panel",
    home: "Inicio",
    fund: "Fondos",
    invest: "Invertir",
    help: "Ayuda",
    me: "Yo",
    profile: "Perfil",
    settings: "Ajustes",
    terminate: "Cerrar sesión",
    search_assets: "BUSCAR ACTIVOS",
    authenticated_as: "Autenticado como",
    status: "Estado",
    view_privileges: "Ver Privilegios",
    notifications: "Notificaciones",
    view_all: "Ver todo",
    no_notifications: "Sin notificaciones nuevas",
    mark_all_read: "Marcar todo como leído",
    language: "Idioma",
    welcome_back: "Bienvenido de nuevo",
    total_balance: "Saldo Total",
    available_balance: "Saldo Disponible",
    invested_funds: "Fondos Invertidos",
    locked_rewards: "Recompensas Bloqueadas",
    recent_transactions: "Transacciones Recientes",
    market_overview: "Resumen del Mercado",
    top_assets: "Activos Principales",
    performance: "Rendimiento",
  },
  FR: {
    dashboard: "Tableau de bord",
    home: "Accueil",
    fund: "Fonds",
    invest: "Investir",
    help: "Aide",
    me: "Moi",
    profile: "Profil",
    settings: "Paramètres",
    terminate: "Déconnexion",
    search_assets: "RECHERCHER DES ACTIFS",
    authenticated_as: "Authentifié en tant que",
    status: "Statut",
    view_privileges: "Voir les privilèges",
    notifications: "Notifications",
    view_all: "Voir tout",
    no_notifications: "Aucune nouvelle notification",
    mark_all_read: "Tout marquer comme lu",
    language: "Langue",
    welcome_back: "Bon retour",
    total_balance: "Solde Total",
    available_balance: "Solde Disponible",
    invested_funds: "Fonds Investis",
    locked_rewards: "Récompenses Verrouillées",
    recent_transactions: "Transactions Récentes",
    market_overview: "Aperçu du Marché",
    top_assets: "Meilleurs Actifs",
    performance: "Performance",
  },
  DE: {
    dashboard: "Dashboard",
    home: "Startseite",
    fund: "Fonds",
    invest: "Investieren",
    help: "Hilfe",
    me: "Ich",
    profile: "Profil",
    settings: "Einstellungen",
    terminate: "Abmelden",
    search_assets: "VERMÖGENSWERTE SUCHEN",
    authenticated_as: "Authentifiziert als",
    status: "Status",
    view_privileges: "Privilegien anzeigen",
    notifications: "Benachrichtigungen",
    view_all: "Alle anzeigen",
    no_notifications: "Keine neuen Benachrichtigungen",
    mark_all_read: "Alle als gelesen markieren",
    language: "Sprache",
    welcome_back: "Willkommen zurück",
    total_balance: "Gesamtguthaben",
    available_balance: "Verfügbares Guthaben",
    invested_funds: "Investierte Mittel",
    locked_rewards: "Gesperrte Belohnungen",
    recent_transactions: "Letzte Transaktionen",
    market_overview: "Marktübersicht",
    top_assets: "Top-Assets",
    performance: "Leistung",
  },
  ZH: {
    dashboard: "仪表板",
    home: "首页",
    fund: "资金",
    invest: "投资",
    help: "帮助",
    me: "我",
    profile: "个人资料",
    settings: "设置",
    terminate: "退出",
    search_assets: "搜索资产",
    authenticated_as: "身份认证为",
    status: "状态",
    view_privileges: "查看权限",
    notifications: "通知",
    view_all: "查看全部",
    no_notifications: "无新通知",
    mark_all_read: "全部标记为已读",
    language: "语言",
    welcome_back: "欢迎回来",
    total_balance: "总余额",
    available_balance: "可用余额",
    invested_funds: "已投资金",
    locked_rewards: "锁定奖励",
    recent_transactions: "最近交易",
    market_overview: "市场概况",
    top_assets: "热门资产",
    performance: "业绩",
  },
  HI: {
    dashboard: "डैशबोर्ड",
    home: "होम",
    fund: "फंड",
    invest: "निवेश",
    help: "सहायता",
    me: "मैं",
    profile: "प्रोफ़ाइल",
    settings: "सेटिंग्स",
    terminate: "लॉगआउट",
    search_assets: "संपत्ति खोजें",
    authenticated_as: "के रूप में प्रमाणित",
    status: "स्थिति",
    view_privileges: "विशेषाधिकार देखें",
    notifications: "सूचनाएं",
    view_all: "सभी देखें",
    no_notifications: "कोई नई सूचना नहीं",
    mark_all_read: "सभी को पढ़ा हुआ मानें",
    language: "भाषा",
    welcome_back: "वापसी पर स्वागत है",
    total_balance: "कुल शेष",
    available_balance: "उपलब्ध शेष",
    invested_funds: "निवेशित फंड",
    locked_rewards: "लॉक रिवार्ड्स",
    recent_transactions: "हाल के लेनदेन",
    market_overview: "बाजार अवलोकन",
    top_assets: "शीर्ष संपत्ति",
    performance: "प्रदर्शन",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('nexus_language') as Language) || 'EN';
  });

  useEffect(() => {
    localStorage.setItem('nexus_language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || translations['EN'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
