import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../stores/authStore';
import useChildStore from '../../stores/childStore';
import { useAuth } from '../../hooks/useAuth';
import { useChildren } from '../../hooks/useChild';
import { LANGUAGES } from '../../i18n';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { UserIcon, BabyIcon, PlusIcon, TrashIcon, LogoutIcon, SettingsIcon } from '../../assets/icons';
import { formatAge, formatDate } from '../../lib/formatters';
import { GENDERS } from '../../lib/constants';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const { signOut, updateProfile } = useAuth();
  const { data: children } = useChildren();
  const { setSelectedChildId } = useChildStore();
  const queryClient = useQueryClient();

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(profile?.full_name || '');
  const [showAddChild, setShowAddChild] = useState(false);
  const [childForm, setChildForm] = useState({
    name: '',
    childType: 'born',
    date_of_birth: '',
    gender: 'male',
    due_date: '',
  });

  const profileMutation = useMutation({
    mutationFn: () => updateProfile({ full_name: profileName }),
    onSuccess: () => setEditingProfile(false),
  });

  const addChildMutation = useMutation({
    mutationFn: async () => {
      const data = {
        user_id: user.id,
        name: childForm.name || (childForm.childType === 'pregnant' ? 'Baby' : 'My Child'),
        is_pregnant: childForm.childType === 'pregnant',
        gender: childForm.childType === 'born' ? childForm.gender : null,
        date_of_birth: childForm.childType === 'born' ? childForm.date_of_birth : null,
        due_date: childForm.childType === 'pregnant' ? childForm.due_date : null,
      };
      const { error } = await supabase.from('children').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      setShowAddChild(false);
      setChildForm({ name: '', childType: 'born', date_of_birth: '', gender: 'male', due_date: '' });
    },
  });

  const deleteChildMutation = useMutation({
    mutationFn: async (childId) => {
      const { error } = await supabase.from('children').delete().eq('id', childId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['children'] }),
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-h1 font-serif text-forest-700">{t('settings.title')}</h1>
        <p className="text-body text-gray-400 mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Language Section */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-terracotta-50 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-terracotta-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </div>
          <div>
            <h2 className="text-h3 font-serif text-forest-700">{t('settings.language')}</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                i18n.language === lang.code
                  ? 'border-terracotta-400 bg-terracotta-50'
                  : 'border-cream-300 hover:border-cream-300 hover:bg-cream-100'
              }`}
            >
              <p className={`text-caption font-semibold ${i18n.language === lang.code ? 'text-terracotta-500' : 'text-forest-700'}`}>
                {lang.nativeLabel}
              </p>
              <p className="text-micro text-gray-400">{lang.label}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Profile Section */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-forest-50 rounded-xl flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-forest-600" />
          </div>
          <h2 className="text-h3 font-serif text-forest-700">{t('settings.profile')}</h2>
        </div>

        {editingProfile ? (
          <div className="space-y-4">
            <Input label={t('settings.name')} value={profileName} onChange={(e) => setProfileName(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={() => profileMutation.mutate()} loading={profileMutation.isPending} size="sm">{t('settings.save')}</Button>
              <Button variant="ghost" onClick={() => setEditingProfile(false)} size="sm">{t('settings.cancel')}</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-micro text-gray-400 uppercase tracking-wider">{t('settings.name')}</p>
                <p className="text-caption font-medium text-forest-700">{profile?.full_name || t('settings.notSet')}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setProfileName(profile?.full_name || ''); setEditingProfile(true); }}>{t('settings.edit')}</Button>
            </div>
            <div>
              <p className="text-micro text-gray-400 uppercase tracking-wider">Email</p>
              <p className="text-caption font-medium text-forest-700">{user?.email}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Children / Family Section */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <BabyIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-h3 font-serif text-forest-700">{t('settings.children')}</h2>
          </div>
          <Button size="sm" onClick={() => setShowAddChild(true)}>
            <PlusIcon className="w-4 h-4 mr-1" /> {t('settings.addChild')}
          </Button>
        </div>

        <div className="space-y-3">
          {(children || []).map((child) => (
            <div key={child.id} className="flex items-center justify-between p-3.5 bg-cream-100 rounded-xl">
              <div className="flex-1 cursor-pointer" onClick={() => { setSelectedChildId(child.id); navigate('/dashboard'); }}>
                <div className="flex items-center gap-2">
                  <p className="text-caption font-semibold text-forest-700">{child.name}</p>
                  {child.is_pregnant && <Badge variant="primary">{t('onboarding.expecting')}</Badge>}
                </div>
                <p className="text-micro text-gray-400">
                  {child.is_pregnant ? `Due: ${formatDate(child.due_date)}` : `${formatAge(child.date_of_birth)} — ${child.gender || 'Unknown'}`}
                </p>
              </div>
              <button
                onClick={() => { if (window.confirm(t('settings.removeConfirm', { name: child.name }))) deleteChildMutation.mutate(child.id); }}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                <TrashIcon className="w-4 h-4 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          ))}
          {(!children || children.length === 0) && (
            <p className="text-caption text-gray-400 text-center py-4">{t('settings.noChildren')}</p>
          )}
        </div>
      </Card>

      {/* About */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-cream-200 rounded-xl flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-gray-500" />
          </div>
          <h2 className="text-h3 font-serif text-forest-700">{t('settings.about')}</h2>
        </div>
        <div className="space-y-2 text-caption text-gray-500">
          <p>{t('settings.version')}</p>
          <p>{t('settings.description')}</p>
          <p className="text-micro text-gray-400">{t('settings.aboutDisclaimer')}</p>
        </div>
      </Card>

      <Button variant="danger" onClick={handleSignOut} className="w-full" size="lg">
        <LogoutIcon className="w-5 h-5 mr-2" /> {t('nav.signOut')}
      </Button>

      {/* Add Child Modal */}
      <Modal isOpen={showAddChild} onClose={() => setShowAddChild(false)} title="Add someone to your family">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setChildForm({ ...childForm, childType: 'born' })} className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${childForm.childType === 'born' ? 'border-forest-500 bg-forest-50' : 'border-cream-300'}`}>
              <p className="text-caption font-semibold text-forest-700">{t('settings.bornChild')}</p>
            </button>
            <button onClick={() => setChildForm({ ...childForm, childType: 'pregnant' })} className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${childForm.childType === 'pregnant' ? 'border-forest-500 bg-forest-50' : 'border-cream-300'}`}>
              <p className="text-caption font-semibold text-forest-700">{t('onboarding.expecting')}</p>
            </button>
          </div>
          <Input label="What's their name?" placeholder={t('onboarding.enterChildName')} value={childForm.name} onChange={(e) => setChildForm({ ...childForm, name: e.target.value })} />
          {childForm.childType === 'born' ? (
            <>
              <Input label={t('onboarding.dateOfBirth')} type="date" value={childForm.date_of_birth} onChange={(e) => setChildForm({ ...childForm, date_of_birth: e.target.value })} />
              <div className="space-y-1.5">
                <label className="block text-caption font-semibold text-forest-700">{t('onboarding.gender')}</label>
                <div className="flex gap-2">
                  {GENDERS.map((g) => (
                    <button key={g.value} onClick={() => setChildForm({ ...childForm, gender: g.value })} className={`flex-1 py-2.5 rounded-xl text-caption font-medium border-2 transition-all duration-200 ${childForm.gender === g.value ? 'border-forest-500 bg-forest-50 text-forest-700' : 'border-cream-300 text-gray-600'}`}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <Input label={t('onboarding.dueDate')} type="date" value={childForm.due_date} onChange={(e) => setChildForm({ ...childForm, due_date: e.target.value })} />
          )}
          <Button onClick={() => addChildMutation.mutate()} loading={addChildMutation.isPending} disabled={childForm.childType === 'born' ? !childForm.date_of_birth : !childForm.due_date} className="w-full">
            Add to family
          </Button>
        </div>
      </Modal>
    </div>
  );
}
