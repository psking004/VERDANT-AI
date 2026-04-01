import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        dashboard: 'Dashboard',
        actionPlan: 'Action Plan',
        marketplace: 'Marketplace',
        settings: 'Settings'
      },
      dashboard: {
        title: 'Farm Dashboard',
        climate: 'Climate Data',
        soil: 'Soil Health',
        profit: 'Profit Predictor',
        pest: 'Pest Alerts'
      },
      marketplace: {
        title: 'Verified Marketplace',
        search: 'Search products',
        category: 'Category',
        verified: 'Verified Only'
      },
      common: {
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel'
      }
    }
  },
  ta: {
    translation: {
      nav: {
        dashboard: 'டாஷ்போர்டு',
        actionPlan: 'செயல் திட்டம்',
        marketplace: 'சந்தை',
        settings: 'அமைப்புகள்'
      },
      dashboard: {
        title: 'பண்ணை டாஷ்போர்டு',
        climate: 'காலநிலை தரவு',
        soil: 'மண் ஆரோக்கியம்',
        profit: 'லாப கணிப்பு',
        pest: 'பூச்சி எச்சரிக்கைகள்'
      },
      marketplace: {
        title: 'சரிபார்க்கப்பட்ட சந்தை',
        search: 'தயாரிப்புகளைத் தேடுங்கள்',
        category: 'வகை',
        verified: 'சரிபார்க்கப்பட்டது மட்டும்'
      },
      common: {
        loading: 'ஏற்றுகிறது...',
        save: 'சேமி',
        cancel: 'ரத்து செய்'
      }
    }
  },
  hi: {
    translation: {
      nav: {
        dashboard: 'डैशबोर्ड',
        actionPlan: 'कार्य योजना',
        marketplace: 'बाज़ार',
        settings: 'सेटिंग्स'
      },
      dashboard: {
        title: 'फार्म डैशबोर्ड',
        climate: 'जलवायु डेटा',
        soil: 'मिट्टी स्वास्थ्य',
        profit: 'लाभ भविष्यवक्ता',
        pest: 'कीट अलर्ट'
      },
      marketplace: {
        title: 'सत्यापित बाज़ार',
        search: 'उत्पाद खोजें',
        category: 'श्रेणी',
        verified: 'केवल सत्यापित'
      },
      common: {
        loading: 'लोड हो रहा है...',
        save: 'सहेजें',
        cancel: 'रद्द करें'
      }
    }
  },
  es: {
    translation: {
      nav: {
        dashboard: 'Tablero',
        actionPlan: 'Plan de Acción',
        marketplace: 'Mercado',
        settings: 'Configuración'
      },
      dashboard: {
        title: 'Tablero de Granja',
        climate: 'Datos Climáticos',
        soil: 'Salud del Suelo',
        profit: 'Predictor de Ganancias',
        pest: 'Alertas de Plagas'
      },
      marketplace: {
        title: 'Mercado Verificado',
        search: 'Buscar productos',
        category: 'Categoría',
        verified: 'Solo Verificados'
      },
      common: {
        loading: 'Cargando...',
        save: 'Guardar',
        cancel: 'Cancelar'
      }
    }
  },
  zh: {
    translation: {
      nav: {
        dashboard: '仪表板',
        actionPlan: '行动计划',
        marketplace: '市场',
        settings: '设置'
      },
      dashboard: {
        title: '农场仪表板',
        climate: '气候数据',
        soil: '土壤健康',
        profit: '利润预测',
        pest: '害虫警报'
      },
      marketplace: {
        title: '认证市场',
        search: '搜索产品',
        category: '类别',
        verified: '仅已认证'
      },
      common: {
        loading: '加载中...',
        save: '保存',
        cancel: '取消'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;