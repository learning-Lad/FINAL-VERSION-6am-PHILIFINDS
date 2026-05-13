import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  category: string;
  description: string;
}

interface EmergencyContextType {
  contacts: EmergencyContact[];
  loading: boolean;
  addContact: (c: Omit<EmergencyContact, 'id'>) => Promise<void>;
  updateContact: (id: string, c: Omit<EmergencyContact, 'id'>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

function fromRow(r: any): EmergencyContact {
  return {
    id: r.id,
    name: r.name,
    number: r.number,
    category: r.category,
    description: r.description ?? '',
  };
}

export function EmergencyProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .order('name', { ascending: true });
    if (!error && data) setContacts(data.map(fromRow));
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) refresh();
    else setContacts([]);
  }, [isAuthenticated]);

  const addContact = async (c: Omit<EmergencyContact, 'id'>) => {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .insert({ name: c.name, number: c.number, category: c.category, description: c.description })
      .select('*')
      .single();
    if (error) throw error;
    if (data) setContacts((prev) => [...prev, fromRow(data)].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const updateContact = async (id: string, c: Omit<EmergencyContact, 'id'>) => {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .update({ name: c.name, number: c.number, category: c.category, description: c.description })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    if (data) setContacts((prev) => prev.map((x) => (x.id === id ? fromRow(data) : x)));
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
    if (error) throw error;
    setContacts((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <EmergencyContext.Provider value={{ contacts, loading, addContact, updateContact, deleteContact, refresh }}>
      {children}
    </EmergencyContext.Provider>
  );
}

export function useEmergency() {
  const ctx = useContext(EmergencyContext);
  if (!ctx) throw new Error('useEmergency must be used within EmergencyProvider');
  return ctx;
}
