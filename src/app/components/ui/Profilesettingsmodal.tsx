import { useRef, useState } from 'react';
import { X, Camera, Loader2, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileSettingsModal({ isOpen, onClose }: Props) {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen || !user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return `${urlData.publicUrl}?t=${Date.now()}`;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      let avatarUrl = user.avatarUrl;

      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile);
      }

      const result = await updateProfile({
        name: name.trim(),
        ...(avatarUrl !== user.avatarUrl ? { avatarUrl } : {}),
      });

      if (!result.ok) throw new Error(result.error);

      toast.success('Profile updated successfully');
      onClose();
    } catch (err: any) {
      toast.error('Failed to update profile', { description: err?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    setName(user.name);
    setAvatarPreview(user.avatarUrl ?? null);
    setAvatarFile(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#1f3d2b]" style={{ fontFamily: 'Georgia, serif' }}>
            Profile Settings
          </h2>
          <button
            onClick={handleClose}
            disabled={saving}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-[#2d5840] flex items-center justify-center text-white text-3xl font-bold shadow-md">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 text-sm text-[#2d5840] font-medium hover:underline"
          >
            Change photo
          </button>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG or GIF · max 5MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Fields */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5fa476] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-full text-white text-sm font-medium shadow transition flex items-center justify-center gap-2 disabled:opacity-70"
            style={{ background: 'linear-gradient(90deg, #5fa476 0%, #2d5840 100%)' }}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}