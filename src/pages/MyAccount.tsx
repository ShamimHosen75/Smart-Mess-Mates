import { useState, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { User, Pencil, Camera, Lock, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  role: string;
  mess: string;
  memberSince: string;
}

function ChangePasswordSection() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });

  const handleChangePassword = () => {
    if (!form.current || !form.newPass || !form.confirm) {
      toast.error("Please fill in all fields");
      return;
    }
    if (form.newPass.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (form.newPass !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setForm({ current: "", newPass: "", confirm: "" });
    setOpen(false);
    toast.success("Password changed successfully");
  };

  return (
    <>
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Password & Security</h3>
              <p className="text-xs text-muted-foreground">Last changed: Never</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
            <Lock size={14} />
            Change Password
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-xl">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={form.current}
                  onChange={(e) => setForm({ ...form, current: e.target.value })}
                  maxLength={128}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={form.newPass}
                  onChange={(e) => setForm({ ...form, newPass: e.target.value })}
                  maxLength={128}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  maxLength={128}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                {t.cancel}
              </Button>
              <Button className="flex-1" onClick={handleChangePassword}>
                Update Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function MyAccount() {
  const { t } = useLanguage();
  const [editOpen, setEditOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(() => localStorage.getItem("profile-avatar"));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData>({
    name: "Didar Hosen",
    email: "didar@example.com",
    phone: "+880 1700 000000",
    role: t.admin,
    mess: "Main Hostel Mess",
    memberSince: "January 2025",
  });
  const [editForm, setEditForm] = useState<ProfileData>(profile);

  const handleEdit = () => {
    setEditForm(profile);
    setEditOpen(true);
  };

  const handleSave = () => {
    setProfile(editForm);
    setEditOpen(false);
    toast.success(t.profileUpdated);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAvatar(dataUrl);
      localStorage.setItem("profile-avatar", dataUrl);
      window.dispatchEvent(new Event("profile-avatar-updated"));
      toast.success("Profile photo updated");
    };
    reader.readAsDataURL(file);
    // Reset input so re-selecting the same file triggers change
    e.target.value = "";
  };

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <AppLayout title={t.myAccount} subtitle={t.accountSettings} icon={<User className="text-primary" size={22} />}>
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Avatar with upload overlay */}
              <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/30"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Camera size={20} className="text-white" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{profile.name}</h2>
                <p className="text-sm text-muted-foreground">{profile.role}</p>
                <p className="text-xs text-primary">{profile.email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleEdit} className="gap-1.5">
              <Pencil size={14} />
              {t.editProfile}
            </Button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border/30">
              <span className="text-muted-foreground">{t.fullName}</span>
              <span className="text-foreground font-medium">{profile.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/30">
              <span className="text-muted-foreground">{t.email}</span>
              <span className="text-foreground font-medium">{profile.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/30">
              <span className="text-muted-foreground">{t.phone}</span>
              <span className="text-foreground font-medium">{profile.phone}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/30">
              <span className="text-muted-foreground">{t.role}</span>
              <span className="text-foreground font-medium">{profile.role}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/30">
              <span className="text-muted-foreground">{t.activeMess}</span>
              <span className="text-foreground font-medium">{profile.mess}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/30">
              <span className="text-muted-foreground">{t.activeMonth}</span>
              <span className="text-primary font-medium">{t.february2026}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">{t.memberSince}</span>
              <span className="text-foreground font-medium">{profile.memberSince}</span>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <ChangePasswordSection />
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-xl">
          <DialogHeader>
            <DialogTitle>{t.editProfile}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Avatar upload in dialog */}
            <div className="flex justify-center">
              <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover ring-2 ring-primary/30"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold">
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Camera size={22} className="text-white" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.fullName}</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.email}</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.phone}</Label>
              <Input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                maxLength={20}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>
                {t.cancel}
              </Button>
              <Button className="flex-1" onClick={handleSave}>
                {t.saveChanges}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
