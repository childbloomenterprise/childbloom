import { useTranslation } from 'react-i18next';

export default function MedicalDisclaimer({ compact = false }) {
  const { t } = useTranslation();

  return (
    <p className="text-xs text-gray-400 text-center leading-relaxed">
      {t('app.disclaimer')}
    </p>
  );
}
