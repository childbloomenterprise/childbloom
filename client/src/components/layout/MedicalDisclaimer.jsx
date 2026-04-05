import { useTranslation } from 'react-i18next';
import { AlertIcon } from '../../assets/icons';

export default function MedicalDisclaimer({ compact = false }) {
  const { t } = useTranslation();

  if (compact) {
    return (
      <p className="text-xs text-gray-400 text-center">
        {t('app.disclaimer')}
      </p>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
      <AlertIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-amber-800">{t('common.medicalDisclaimer')}</p>
        <p className="text-xs text-amber-600 mt-1">
          {t('common.disclaimerText')}
        </p>
      </div>
    </div>
  );
}
