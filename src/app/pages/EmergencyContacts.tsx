import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { useEmergency, EmergencyContact } from '../context/EmergencyContext';
import { Plus, Edit, Trash2, Phone } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY = { name: '', number: '', category: '', description: '' };

export function EmergencyContacts() {
  const { contacts, addContact, updateContact, deleteContact } = useEmergency();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<EmergencyContact | null>(null);
  const [form, setForm] = useState(EMPTY);

  const reset = () => { setForm(EMPTY); setEditing(null); };

  const handleAdd = async () => {
    if (!form.name || !form.number || !form.category) return toast.error('Please fill in all required fields');
    try {
      await addContact(form);
      setIsAddOpen(false); reset();
      toast.success('Emergency contact added');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to add contact');
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await updateContact(editing.id, form);
      reset();
      toast.success('Contact updated');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to update contact');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this emergency contact?')) return;
    try {
      await deleteContact(id);
      toast.success('Contact deleted');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to delete contact');
    }
  };

  const openEdit = (c: EmergencyContact) => {
    setEditing(c);
    setForm({ name: c.name, number: c.number, category: c.category, description: c.description });
  };

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Emergency Contacts</h1>
          <p className="text-sm text-gray-500">Manage Philippine emergency hotlines</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(o) => { setIsAddOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#2d5840] hover:bg-[#1f3d2b]" onClick={reset}>
              <Plus className="w-4 h-4 mr-2" /> Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Emergency Contact</DialogTitle>
              <DialogDescription>Add a new hotline</DialogDescription>
            </DialogHeader>
            <ContactForm form={form} setForm={setForm} />
            <Button onClick={handleAdd} className="w-full bg-[#2d5840] hover:bg-[#1f3d2b]">Add Contact</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{c.category}</div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-lg font-bold text-[#2d5840] mb-2">
                <Phone className="w-4 h-4" /> {c.number}
              </div>
              {c.description && <p className="text-xs text-gray-600">{c.description}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) reset(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Emergency Contact</DialogTitle>
            <DialogDescription>Update contact information</DialogDescription>
          </DialogHeader>
          <ContactForm form={form} setForm={setForm} />
          <div className="flex gap-3">
            <Button variant="outline" onClick={reset} className="flex-1">Cancel</Button>
            <Button onClick={handleUpdate} className="flex-1 bg-[#2d5840] hover:bg-[#1f3d2b]">Update</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContactForm({ form, setForm }: { form: typeof EMPTY; setForm: (f: typeof EMPTY) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Name *</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Philippine Red Cross" />
      </div>
      <div>
        <Label>Phone Number *</Label>
        <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="e.g., 143" />
      </div>
      <div>
        <Label>Category *</Label>
        <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g., Medical Emergency" />
      </div>
      <div>
        <Label>Description</Label>
        <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
      </div>
    </div>
  );
}
