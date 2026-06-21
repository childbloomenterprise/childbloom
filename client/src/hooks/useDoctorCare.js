// Parent-facing reads of doctor-authored clinical data.
//
// Doctors author these rows in Dr. Bloom; they land in ChildBloom's project.
// Migration 024 added the parent-read RLS (is_parent_of(child_id)) that makes
// these queries return data for the signed-in parent's own children.
//
// All four datasets refresh live via useDoctorCareRealtime() — when the doctor
// writes anything, the parent gets a notifications INSERT and/or a
// doctor_child_connections change (both already in the realtime publication),
// and we invalidate the matching React Query keys. That's the "Apple handoff".

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import useAuthStore from '../stores/authStore';

// Active doctor connections for a child (the care team).
export function useConnectedDoctors(childId) {
  return useQuery({
    queryKey: ['doctor-connections', childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctor_child_connections')
        .select('id, doctor_id, doctor_display_name, doctor_specialty, status, consent_signed_at, created_at')
        .eq('child_id', childId)
        .eq('status', 'active')
        .order('consent_signed_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!childId,
  });
}

// Visit notes / consultations, newest first.
export function useConsultations(childId) {
  return useQuery({
    queryKey: ['doctor-consultations', childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('child_id', childId)
        .order('consultation_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!childId,
  });
}

// Prescriptions (active + past), newest first.
export function usePrescriptions(childId) {
  return useQuery({
    queryKey: ['doctor-prescriptions', childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('child_id', childId)
        .order('prescribed_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!childId,
  });
}

// Vaccines recorded into the clinical vaccination_records table (doctor- or
// parent-sourced — distinct from the parent's 'vaccinations' schedule table).
export function useDoctorVaccines(childId) {
  return useQuery({
    queryKey: ['doctor-vaccines', childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vaccination_records')
        .select('*')
        .eq('child_id', childId)
        .order('administered_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!childId,
  });
}

// Live refresh: invalidate all doctor-care queries when the doctor writes
// anything for this child or family. No polling.
export function useDoctorCareRealtime(childId) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id || !childId) return;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-connections', childId] });
      queryClient.invalidateQueries({ queryKey: ['doctor-consultations', childId] });
      queryClient.invalidateQueries({ queryKey: ['doctor-prescriptions', childId] });
      queryClient.invalidateQueries({ queryKey: ['doctor-vaccines', childId] });
    };

    const channel = supabase
      .channel(`doctor-care:${childId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
        invalidate,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'doctor_child_connections', filter: `child_id=eq.${childId}` },
        invalidate,
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, childId, queryClient]);
}
