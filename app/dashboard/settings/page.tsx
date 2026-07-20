"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";
import { defaultTemplates } from "@/lib/whatsapp";
import { createPortal } from "react-dom";

interface ImageCropperProps {
  imageSrc: string;
  type: 'gallery' | 'achiever' | 'founder' | 'hero';
  onClose: () => void;
  onCropComplete: (croppedBase64: string) => void;
}

const ImageCropper = ({ imageSrc, type, onClose, onCropComplete }: ImageCropperProps) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Crop viewport dimensions
  let viewportWidth = 320;
  let viewportHeight = 240;
  if (type === 'achiever') {
    viewportWidth = 240;
    viewportHeight = 240;
  } else if (type === 'founder') {
    viewportWidth = 240;
    viewportHeight = 300;
  } else if (type === 'hero') {
    viewportWidth = 320;
    viewportHeight = 160;
  }

  useEffect(() => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      setImg(image);
      setScale(1);
      setOffsetX(0);
      setOffsetY(0);
    };
  }, [imageSrc]);

  // Cover calculation
  const scaleX = img ? viewportWidth / img.width : 1;
  const scaleY = img ? viewportHeight / img.height : 1;
  const baseScale = Math.max(scaleX, scaleY);
  const initialWidth = img ? img.width * baseScale : 0;
  const initialHeight = img ? img.height * baseScale : 0;

  const currentWidth = initialWidth * scale;
  const currentHeight = initialHeight * scale;

  const clampOffsets = (x: number, y: number, currentScale: number) => {
    const w = initialWidth * currentScale;
    const h = initialHeight * currentScale;
    
    const minX = (viewportWidth - w) / 2;
    const maxX = (w - viewportWidth) / 2;
    const minY = (viewportHeight - h) / 2;
    const maxY = (h - viewportHeight) / 2;
    
    const clampedX = w < viewportWidth ? 0 : Math.min(Math.max(x, minX), maxX);
    const clampedY = h < viewportHeight ? 0 : Math.min(Math.max(y, minY), maxY);
    
    return { x: clampedX, y: clampedY };
  };

  const leftPos = (viewportWidth - currentWidth) / 2 + offsetX;
  const topPos = (viewportHeight - currentHeight) / 2 + offsetY;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - offsetX, y: touch.clientY - offsetY });
  };

  // Window listeners to allow holding and moving anywhere with boundary clamping
  useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      const clamped = clampOffsets(newX, newY, scale);
      setOffsetX(clamped.x);
      setOffsetY(clamped.y);
    };

    const handleWindowMouseUp = () => {
      setIsDragging(false);
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;
      const clamped = clampOffsets(newX, newY, scale);
      setOffsetX(clamped.x);
      setOffsetY(clamped.y);
    };

    const handleWindowTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
    window.addEventListener('touchend', handleWindowTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
    };
  }, [isDragging, dragStart, scale, initialWidth, initialHeight]);

  const handleApply = () => {
    if (!img) return;
    let outputWidth = 640;
    let outputHeight = 480;
    if (type === 'achiever') {
      outputWidth = 400;
      outputHeight = 400;
    } else if (type === 'founder') {
      outputWidth = 400;
      outputHeight = 500;
    } else if (type === 'hero') {
      outputWidth = 1200;
      outputHeight = 600;
    }

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const factorX = outputWidth / viewportWidth;
    const factorY = outputHeight / viewportHeight;

    const destW = currentWidth * factorX;
    const destH = currentHeight * factorY;
    const destX = leftPos * factorX;
    const destY = topPos * factorY;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outputWidth, outputHeight);
    ctx.drawImage(img, destX, destY, destW, destH);
    
    onCropComplete(canvas.toDataURL('image/jpeg', 0.85));
  };

  if (!img) {
    return typeof document !== 'undefined' ? createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
        <div className="text-white text-xs font-bold animate-pulse">Loading image preview...</div>
      </div>,
      document.body
    ) : null;
  }

  return typeof document !== 'undefined' ? createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <div className="glass-pane-elevated max-w-md w-full relative z-10 overflow-hidden !rounded-2xl border border-white/10 shadow-2xl p-6 flex flex-col items-center">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-manrope mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">crop</span>
          Crop and Arrange Photo
        </h3>
        <p className="text-[11px] text-slate-400 mb-6 text-center font-manrope">Drag inside the box to center, and zoom using the slider below.</p>

        <div
          style={{ width: viewportWidth, height: viewportHeight }}
          className={`relative overflow-hidden cursor-move bg-slate-950 border-2 border-primary/40 shadow-inner ${
            type === 'achiever' ? 'rounded-full' : 'rounded-xl'
          }`}
        >
          <img
            src={imageSrc}
            alt="Crop viewport"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{
              position: 'absolute',
              left: leftPos,
              top: topPos,
              width: currentWidth,
              height: currentHeight,
              maxWidth: 'none',
              userSelect: 'none',
              pointerEvents: 'auto',
              touchAction: 'none'
            }}
          />
        </div>

        <div className="w-full mt-6 space-y-2">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase font-manrope">
            <span>Zoom</span>
            <span>{Math.round(scale * 100)}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={scale}
            onChange={(e) => {
              const newScale = parseFloat(e.target.value);
              setScale(newScale);
              const clamped = clampOffsets(offsetX, offsetY, newScale);
              setOffsetX(clamped.x);
              setOffsetY(clamped.y);
            }}
            className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        <div className="flex gap-3 w-full mt-8">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost flex-1 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="btn-primary flex-1 py-2 text-xs rounded-xl font-bold flex items-center justify-center gap-1 shadow-lg"
          >
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Apply Crop
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;
};


const TEMPLATE_CONFIG = [
  { key: 'welcome_msg', label: 'Welcome Message (New Admission)', tags: '{name}, {branch}, {seat}, {shift}, {expiry}, {total_amount}, {paid_amount}, {due_amount}, {due_date_line}, {status}, {invoice_link}' },
  { key: 'renew_msg', label: 'Subscription Renewed Message', tags: '{name}, {branch}, {seat}, {shift}, {expiry}, {total_amount}, {paid_amount}, {due_amount}, {due_date_line}, {status}, {invoice_link}' },
  { key: 'dues_receipt_msg', label: 'Dues Settlement Receipt', tags: '{name}, {branch}, {seat}, {shift}, {expiry}, {paid_amount}, {remaining_dues}, {status}, {invoice_link}' },
  { key: 'seat_assigned_msg', label: 'Seat Allocation Update', tags: '{name}, {branch}, {seat}, {shift}, {expiry}, {payment_section}' },
  { key: 'due_soon_msg', label: 'Due Soon Reminder (3 days prior)', tags: '{name}, {permanent_id}, {expiry}, {branch}' },
  { key: 'expired_msg', label: 'Membership Expired Warning', tags: '{name}, {permanent_id}, {expiry}, {branch}' },
  { key: 'released_msg', label: 'Seat Released Notification (>15 days expired)', tags: '{name}, {permanent_id}, {expiry}, {branch}' },
  { key: 'pending_dues_msg', label: 'Pending Dues/Overdue Reminder', tags: '{name}, {due_date}, {branch}' },
  { key: 'overdue_dues_msg', label: 'Overdue Payment Warning (Defaulters)', tags: '{name}, {permanent_id}, {due_amount}, {due_date}, {branch}' },
  { key: 'invoice_share_msg', label: 'Invoice Share Button Message', tags: '{name}, {receipt_no}, {date}, {permanent_id}, {seat}, {shift}, {subtotal}, {discount}, {total_amount}, {paid_amount}, {due_amount}, {status}, {invoice_link}, {lib_name}' }
];

const DEFAULT_SLIDES = [
  {
    src: "/assets/images/hero/bengali_chowk.png",
    tag: "Bengali Chowk Branch",
    headline: "Where Knowledge\nMeets Community.",
    sub: "A serene, fully-equipped study environment in the heart of the city — crafted for focus and excellence.",
    cta: "Explore This Branch",
    ctaHref: "#locations",
  },
  {
    src: "/assets/images/hero/namnakala.jpg",
    tag: "Namnakala Branch",
    headline: "Quiet Spaces.\nBig Ambitions.",
    sub: "Premium seating, high-speed Wi-Fi, and a culture of achievement — everything you need to succeed.",
    cta: "View Seating",
    ctaHref: "#seating",
  },
  {
    src: "/assets/images/hero/amenities.png",
    tag: "World-Class Amenities",
    headline: "Explore, Learn,\nand Grow.",
    sub: "A network of 2 branches dedicated to lifelong learning, digital literacy, and a safe space to thrive.",
    cta: "Our Membership Plans",
    ctaHref: "#pricing",
  },
];

export default function SettingsPage() {
  const { activeBranch } = useBranch();
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bangali Chowk';
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const savedRole = localStorage.getItem("krishna_role");
    if (savedRole !== "admin") {
      router.push("/dashboard");
    } else {
      setIsAdmin(true);
    }
  }, [router]);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'system' | 'gallery' | 'achievers' | 'visitor'>('system');

  // Visitor page customizer states
  const [founderImage, setFounderImage] = useState("/assets/founder.png");
  const [heroSlides, setHeroSlides] = useState<any[]>(DEFAULT_SLIDES);

  // Slide Form states
  const [editingSlideIdx, setEditingSlideIdx] = useState<number | null>(null);
  const [slideTag, setSlideTag] = useState("");
  const [slideHeadline, setSlideHeadline] = useState("");
  const [slideSub, setSlideSub] = useState("");
  const [slideCta, setSlideCta] = useState("");
  const [slideCtaHref, setSlideCtaHref] = useState("");
  const [slideImage, setSlideImage] = useState("");

  // State for System settings
  const [libName, setLibName] = useState("Krishna Library");
  const [libPhone, setLibPhone] = useState("+91 8269144748");
  const [libAddress, setLibAddress] = useState("Plot 12, Bangali Chowk Area, Ambikapur, C.G.");
  const [upiId, setUpiId] = useState("krishnalibrary@okaxis");
  const [upiName, setUpiName] = useState("Krishna Library");
  
  // States for WhatsApp / Notification message templates
  const [templates, setTemplates] = useState<Record<string, string>>(defaultTemplates);

  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

  // Gallery states
  const [gallery, setGallery] = useState<{ id: string; url: string; title: string; branch: string }[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoTitle, setNewPhotoTitle] = useState("");
  const [newPhotoBranch, setNewPhotoBranch] = useState("all");
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);

  // Achievers states
  const [achieversList, setAchieversList] = useState<{ id: string; name: string; achievement: string; photo_url: string; testimonial: string }[]>([]);
  const [newAchieverName, setNewAchieverName] = useState("");
  const [newAchieverRole, setNewAchieverRole] = useState("");
  const [newAchieverPhoto, setNewAchieverPhoto] = useState("");
  const [newAchieverQuote, setNewAchieverQuote] = useState("");
  const [showGallerySelector, setShowGallerySelector] = useState(false);

  // Cropper states
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImage, setCropperImage] = useState("");
  const [cropperType, setCropperType] = useState<'gallery' | 'achiever' | 'founder' | 'hero'>('gallery');

  // Load all configurations from Supabase on mount
  useEffect(() => {
    async function loadAllData() {
      // 1. Fetch system configs
      try {
        const { data, error } = await supabase.from('library_settings').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          const newTemplates = { ...defaultTemplates };
          data.forEach((item: any) => {
            if (item.id === 'lib_name') setLibName(item.value);
            if (item.id === 'lib_phone') setLibPhone(item.value);
            if (item.id === 'lib_address') setLibAddress(item.value);
            if (item.id === 'upi_id') setUpiId(item.value);
            if (item.id === 'upi_name') setUpiName(item.value);
            if (item.id === 'founder_image_url') setFounderImage(item.value);
            if (item.id === 'hero_slides') {
              try {
                const parsed = JSON.parse(item.value);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setHeroSlides(parsed);
                }
              } catch (e) {
                console.error("Error parsing loaded hero slides", e);
              }
            }
            
            if (item.id in newTemplates) {
              newTemplates[item.id as keyof typeof defaultTemplates] = item.value;
            }
          });
          setTemplates(newTemplates);
        }
      } catch (err) {
        console.warn("Failed to load settings from Supabase, loading localStorage", err);
        // Localstorage fallback
        if (typeof window !== 'undefined') {
          const savedName = localStorage.getItem("krishna_lib_name");
          const savedPhone = localStorage.getItem("krishna_phone");
          const savedAddress = localStorage.getItem("krishna_address");
          const savedUpiId = localStorage.getItem("krishna_upi_id");
          const savedUpiName = localStorage.getItem("krishna_upi_pn");
          // Removed localstorage for templates
        }
      }

      // 2. Fetch gallery
      fetchGallery();

      // 3. Fetch achievers
      fetchAchievers();
    }

    loadAllData();
  }, []);

  const fetchGallery = async () => {
    try {
      const { data, error } = await supabase.from('gallery_photos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setGallery(data || []);
    } catch (err) {
      console.warn("Gallery table not loaded yet", err);
    }
  };

  const fetchAchievers = async () => {
    try {
      const { data, error } = await supabase.from('achievers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAchieversList(data || []);
    } catch (err) {
      console.warn("Achievers table not loaded yet", err);
    }
  };

  // Save Settings handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const settingsPayload = [
        { id: 'lib_name', value: libName, description: 'Library Name' },
        { id: 'lib_phone', value: libPhone, description: 'Library Contact Number' },
        { id: 'lib_address', value: libAddress, description: 'Library Physical Address' },
        { id: 'upi_id', value: upiId, description: 'Payment UPI ID' },
        { id: 'upi_name', value: upiName, description: 'Payment UPI Payee Name' },
        ...Object.entries(templates).map(([key, val]) => ({ id: key, value: val, description: 'WhatsApp Template' }))
      ];

      const { error } = await supabase.from('library_settings').upsert(settingsPayload);
      if (error) throw error;

      // Also mirror to LocalStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem("krishna_lib_name", libName);
        localStorage.setItem("krishna_phone", libPhone);
        localStorage.setItem("krishna_address", libAddress);
        localStorage.setItem("krishna_upi_id", upiId);
        localStorage.setItem("krishna_upi_pn", upiName);
        localStorage.setItem("krishna_welcome_msg", templates.welcome_msg || "");
        localStorage.setItem("krishna_due_msg", templates.pending_dues_msg || "");
      }

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Error saving settings", err);
      alert("Error saving settings. Make sure settings_setup.md SQL script is executed in your Supabase SQL Editor first.");
    } finally {
      setIsSaving(false);
    }
  };

  // Add/Edit gallery photo handler
  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;

    try {
      if (editingPhotoId) {
        const { error } = await supabase.from('gallery_photos').update({
          url: newPhotoUrl.trim(),
          title: newPhotoTitle.trim() || 'Library view',
          branch: newPhotoBranch
        }).eq('id', editingPhotoId);
        if (error) throw error;
        setEditingPhotoId(null);
      } else {
        const { error } = await supabase.from('gallery_photos').insert([
          { url: newPhotoUrl.trim(), title: newPhotoTitle.trim() || 'Library view', branch: newPhotoBranch }
        ]);
        if (error) throw error;
      }
      
      setNewPhotoUrl("");
      setNewPhotoTitle("");
      setNewPhotoBranch("all");
      fetchGallery();
    } catch (err) {
      alert("Error adding photo: " + (err as Error).message);
    }
  };

  // Delete gallery photo handler
  const handleDeletePhoto = async (id: string) => {
    if (!confirm("Remove this image from the gallery?")) return;
    try {
      const { error } = await supabase.from('gallery_photos').delete().eq('id', id);
      if (error) throw error;
      fetchGallery();
    } catch (err) {
      alert("Error deleting photo: " + (err as Error).message);
    }
  };

  // Add achiever handler
  const handleAddAchiever = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAchieverName.trim() || !newAchieverRole.trim()) return;

    try {
      const { error } = await supabase.from('achievers').insert([
        {
          name: newAchieverName.trim(),
          achievement: newAchieverRole.trim(),
          photo_url: newAchieverPhoto.trim() || "https://lh3.googleusercontent.com/aida-public/AB6AXuAXIyldosztmi8fNPYHddI3Ddsv7gSvYSw5EolHH-DQnTg4GfkF2Ng-ZPSCTwr1eUIHeVcVllJJbD17V6s1Ydd6_rAfMZFs6Qounf8a9P-WhPdR34KrWk0I6a6JlF6RnvzRlapPaiica1iWLhhRQBg5EMN_cPIml1df-in3jeIPiDj1OgKWBX6KyOZ5sFhvdBRUH9eNVvUoQ7itGs22Fm46XyOFDb3whdrbuxA_9pCBIqxqO5XbMUlmPbLgcmIo4IEnewxsmwYl-rIS",
          testimonial: newAchieverQuote.trim()
        }
      ]);
      if (error) throw error;
      setNewAchieverName("");
      setNewAchieverRole("");
      setNewAchieverPhoto("");
      setNewAchieverQuote("");
      fetchAchievers();
    } catch (err) {
      alert("Error adding achiever: " + (err as Error).message);
    }
  };

  // Delete achiever handler
  const handleDeleteAchiever = async (id: string) => {
    if (!confirm("Are you sure you want to delete this achiever card?")) return;
    try {
      const { error } = await supabase.from('achievers').delete().eq('id', id);
      if (error) throw error;
      fetchAchievers();
    } catch (err) {
      alert("Error deleting achiever: " + (err as Error).message);
    }
  };

  const handleSaveFounderImage = async () => {
    setIsSaving(true);
    try {
      const payload = {
        id: 'founder_image_url',
        value: founderImage,
        description: "Founder/Owner profile photo URL"
      };
      const { error } = await supabase.from('library_settings').upsert([payload]);
      if (error) throw error;
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Error saving founder image", err);
      alert("Error saving founder image to database.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHeroSlides = async () => {
    setIsSaving(true);
    try {
      const payload = {
        id: 'hero_slides',
        value: JSON.stringify(heroSlides),
        description: "Hero slider slides list configuration"
      };
      const { error } = await supabase.from('library_settings').upsert([payload]);
      if (error) throw error;
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Error saving hero slides", err);
      alert("Error saving hero slides to database.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddEditSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideImage.trim()) {
      alert("Please enter a slide image URL or upload an image file!");
      return;
    }

    const newSlide = {
      src: slideImage.trim(),
      tag: slideTag.trim() || "Krishna Library",
      headline: slideHeadline.trim() || "Where Knowledge Meets Community",
      sub: slideSub.trim() || "Serene environment crafted for focus and excellence.",
      cta: slideCta.trim() || "Explore Details",
      ctaHref: slideCtaHref.trim() || "#pricing"
    };

    if (editingSlideIdx !== null) {
      const updated = [...heroSlides];
      updated[editingSlideIdx] = newSlide;
      setHeroSlides(updated);
      setEditingSlideIdx(null);
    } else {
      setHeroSlides([...heroSlides, newSlide]);
    }

    // Reset fields
    setSlideTag("");
    setSlideHeadline("");
    setSlideSub("");
    setSlideCta("");
    setSlideCtaHref("");
    setSlideImage("");
  };

  const handleDeleteSlide = (index: number) => {
    if (!confirm("Are you sure you want to remove this slide?")) return;
    const updated = heroSlides.filter((_, idx) => idx !== index);
    setHeroSlides(updated);
  };

  const handleEditSlideClick = (index: number) => {
    const slide = heroSlides[index];
    setEditingSlideIdx(index);
    setSlideTag(slide.tag || "");
    setSlideHeadline(slide.headline || "");
    setSlideSub(slide.sub || "");
    setSlideCta(slide.cta || "");
    setSlideCtaHref(slide.ctaHref || "");
    setSlideImage(slide.src || "");
  };

  const handleExportBackup = async () => {
    setBackupLoading(true);
    try {
      const { data: members } = await supabase.from('members').select('*').eq('branch', activeBranch);
      const { data: payments } = await supabase.from('payments').select('*').eq('branch', activeBranch);
      const { data: leads } = await supabase.from('leads').select('*').eq('branch', activeBranch);
      const { data: expenses } = await supabase.from('expenses').select('*').eq('branch', activeBranch);

      const backupData = {
        exportedAt: new Date().toISOString(),
        branch: activeBranch,
        members: members || [],
        payments: payments || [],
        leads: leads || [],
        expenses: expenses || []
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `krishna_library_backup_${activeBranch}_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error(err);
      alert("Error generating backup file.");
    } finally {
      setBackupLoading(false);
    }
  };

  if (isAdmin === null) return null;

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#003178] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10 animate-scale-in">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <div className="text-xs font-bold font-manrope">Settings Saved Successfully!</div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">SaaS Control Center</h1>
          <p className="page-subtitle">Configure invoice profile details, customize notification layouts, manage gallery photos, and edit achievers list.</p>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/10 gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'system'
              ? 'border-[#003178] text-[#003178] dark:border-cyan-400 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base">settings_system_daydream</span>
          Configs & Notification Templates
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'gallery'
              ? 'border-[#003178] text-[#003178] dark:border-cyan-400 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base">photo_library</span>
          Photo Gallery ({gallery.length})
        </button>
        <button
          onClick={() => setActiveTab('achievers')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'achievers'
              ? 'border-[#003178] text-[#003178] dark:border-cyan-400 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base">military_tech</span>
          Achievers success cards ({achieversList.length})
        </button>
        <button
          onClick={() => setActiveTab('visitor')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'visitor'
              ? 'border-[#003178] text-[#003178] dark:border-cyan-400 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base">web</span>
          Visitor Page (Hero & Founder)
        </button>
      </div>

      {/* ── Tab 1: System settings and notification templates ── */}
      {activeTab === 'system' && (
        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Library Profile */}
            <div className="glass-pane-elevated">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-manrope mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">corporate_fare</span>
                Library Profile Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Library Name</label>
                  <input
                    type="text"
                    value={libName}
                    onChange={(e) => setLibName(e.target.value)}
                    className="input-premium w-full py-2.5 px-3 text-sm text-[#0f172a] dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Contact Phone</label>
                  <input
                    type="text"
                    value={libPhone}
                    onChange={(e) => setLibPhone(e.target.value)}
                    className="input-premium w-full py-2.5 px-3 text-sm text-[#0f172a] dark:text-white"
                    required
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Invoice Address</label>
                  <textarea
                    rows={2}
                    value={libAddress}
                    onChange={(e) => setLibAddress(e.target.value)}
                    className="input-premium w-full py-2.5 px-3 text-sm text-[#0f172a] dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* UPI */}
            <div className="glass-pane-elevated">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-manrope mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">qr_code_2</span>
                UPI Payment Gateways
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Merchant UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    placeholder="e.g. library@ybl"
                    onChange={(e) => setUpiId(e.target.value)}
                    className="input-premium w-full py-2.5 px-3 text-sm font-mono text-[#003178] dark:text-cyan-300"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Merchant Name</label>
                  <input
                    type="text"
                    value={upiName}
                    onChange={(e) => setUpiName(e.target.value)}
                    className="input-premium w-full py-2.5 px-3 text-sm text-[#0f172a] dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="glass-pane-elevated">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-manrope mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">chat_bubble</span>
                Custom Notification Message Templates
              </h3>
              
              <div className="space-y-5">
                {TEMPLATE_CONFIG.map((config) => (
                  <div key={config.key} className="space-y-1">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">{config.label}</label>
                      <span className="text-[10px] text-slate-400 font-bold font-mono">Tags: {config.tags}</span>
                    </div>
                    <textarea
                      rows={5}
                      value={templates[config.key]}
                      onChange={(e) => setTemplates({...templates, [config.key]: e.target.value})}
                      className="input-premium w-full py-2.5 px-3 text-sm font-mono text-[#0f172a] dark:text-white leading-relaxed whitespace-pre-wrap"
                      required
                    />
                  </div>
                ))}
                </div>
              </div>
          </div>

          <div className="space-y-6">
            <div className="glass-pane-elevated">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-manrope mb-4">Operations</h3>
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary w-full py-3 text-sm rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                    Saving Configuration...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">save</span>
                    Save Settings
                  </>
                )}
              </button>
            </div>

            <div className="glass-pane-elevated">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-manrope mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-500 text-base">database</span>
                Database Backup Control
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">Export a complete branch JSON dump containing all branches&apos; students, leads, expenses, and payment logs for cold backup recovery.</p>
              
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={backupLoading}
                className="btn-ghost !text-slate-800 dark:!text-slate-200 w-full py-3 text-xs rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
              >
                {backupLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    Compiling Backup JSON...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">download</span>
                    Export Complete JSON Backup
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── Tab 2: Gallery manager ── */}
      {activeTab === 'gallery' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add photo form */}
          <div className="glass-pane-elevated h-fit">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-manrope mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">{editingPhotoId ? "edit" : "add_a_photo"}</span>
              {editingPhotoId ? "Edit Gallery Photo" : "Add Photo to Gallery"}
            </h3>
            <form onSubmit={handleAddPhoto} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Photo Image Source</label>
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="Paste Image URL (https://...)"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    className="input-premium w-full py-2.5 px-3 text-sm text-[#0f172a] dark:text-white"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Or Upload from Computer:</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCropperImage(reader.result as string);
                            setCropperType('gallery');
                            setShowCropper(true);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                  </div>
                </div>
                {newPhotoUrl && (
                  <div className="mt-2 relative w-24 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
                    <img src={newPhotoUrl} className="w-full h-full object-cover" alt="Preview" />
                    <button
                      type="button"
                      onClick={() => setNewPhotoUrl("")}
                      className="absolute top-0 right-0 bg-red-600 text-white rounded-bl p-0.5"
                      title="Clear image"
                    >
                      <span className="material-symbols-outlined text-[10px]">close</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Photo Title / Caption</label>
                <input
                  type="text"
                  placeholder="e.g. Quiet Reading Hall"
                  value={newPhotoTitle}
                  onChange={(e) => setNewPhotoTitle(e.target.value)}
                  className="input-premium w-full py-2.5 px-3 text-sm text-[#0f172a] dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Target Branch</label>
                <select
                  value={newPhotoBranch}
                  onChange={(e) => setNewPhotoBranch(e.target.value)}
                  className="input-premium w-full py-2.5 px-3 text-sm text-[#0f172a] dark:text-white bg-slate-900"
                >
                  <option value="all">All Branches</option>
                  <option value="bengali-chowk">Bangali Chowk</option>
                  <option value="namnakala">Namnakala</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                {editingPhotoId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPhotoId(null);
                      setNewPhotoUrl("");
                      setNewPhotoTitle("");
                      setNewPhotoBranch("all");
                    }}
                    className="btn-ghost flex-1 py-2.5 text-xs rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="btn-primary flex-1 py-2.5 text-xs rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                  <span className="material-symbols-outlined text-sm">{editingPhotoId ? "save" : "publish"}</span>
                  {editingPhotoId ? "Save Changes" : "Publish to Live Gallery"}
                </button>
              </div>
            </form>
          </div>

          {/* List of gallery photos */}
          <div className="lg:col-span-2 glass-pane-elevated">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-manrope mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">grid_on</span>
              Current Live Gallery Images
            </h3>

            {gallery.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No custom gallery photos uploaded. Default local assets will be rendered on the landing page.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {gallery.map((img) => (
                  <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 aspect-video bg-slate-100 dark:bg-slate-950">
                    <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col justify-between p-3">
                      <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase bg-white/20 text-white rounded w-fit">
                        {img.branch}
                      </span>
                      <div className="flex justify-between items-center gap-2 mt-2">
                        <span className="text-[10px] text-white font-bold truncate flex-1">{img.title}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingPhotoId(img.id);
                              setNewPhotoUrl(img.url);
                              setNewPhotoTitle(img.title);
                              setNewPhotoBranch(img.branch);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="w-7 h-7 rounded-full bg-blue-600/95 text-white flex items-center justify-center hover:bg-blue-700 transition-all shrink-0"
                            title="Edit photo"
                          >
                            <span className="material-symbols-outlined text-[12px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeletePhoto(img.id)}
                            className="w-7 h-7 rounded-full bg-red-600/95 text-white flex items-center justify-center hover:bg-red-700 transition-all shrink-0"
                            title="Delete photo"
                          >
                            <span className="material-symbols-outlined text-[12px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 3: Achievers success cards ── */}
      {activeTab === 'achievers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add achiever form */}
          <div className="glass-pane-elevated h-fit">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-manrope mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">military_tech</span>
              Create Achiever Success Card
            </h3>
            <form onSubmit={handleAddAchiever} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Achiever Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Manish Dubey"
                  value={newAchieverName}
                  onChange={(e) => setNewAchieverName(e.target.value)}
                  className="input-premium w-full py-2.5 px-3 text-sm text-[#0f172a] dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Achievement / Exam / Role</label>
                <input
                  type="text"
                  placeholder="e.g. UPSC CSE 2025 - AIR 42"
                  value={newAchieverRole}
                  onChange={(e) => setNewAchieverRole(e.target.value)}
                  className="input-premium w-full py-2.5 px-3 text-sm text-[#0f172a] dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Avatar / Profile Photo</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Paste Image URL (https://...)"
                      value={newAchieverPhoto}
                      onChange={(e) => setNewAchieverPhoto(e.target.value)}
                      className="input-premium w-full py-2.5 px-3 text-sm text-[#0f172a] dark:text-white flex-1"
                    />
                    {gallery.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowGallerySelector(true)}
                        className="px-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all"
                        title="Select from Gallery"
                      >
                        <span className="material-symbols-outlined text-base">photo_library</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Or Upload from Computer:</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCropperImage(reader.result as string);
                            setCropperType('achiever');
                            setShowCropper(true);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                  </div>
                </div>
                {newAchieverPhoto && (
                  <div className="mt-2 relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
                    <img src={newAchieverPhoto} className="w-full h-full object-cover" alt="Preview" />
                    <button
                      type="button"
                      onClick={() => setNewAchieverPhoto("")}
                      className="absolute top-0 right-0 bg-red-600 text-white rounded-bl p-0.5"
                      title="Clear image"
                    >
                      <span className="material-symbols-outlined text-[10px]">close</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Student Testimonial Quote</label>
                <textarea
                  rows={4}
                  placeholder="Tell us about their experience studying at Krishna Library..."
                  value={newAchieverQuote}
                  onChange={(e) => setNewAchieverQuote(e.target.value)}
                  className="input-premium w-full py-2.5 px-3 text-sm text-[#0f172a] dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-2.5 text-xs rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <span className="material-symbols-outlined text-sm">stars</span>
                Add Achiever Success Story
              </button>
            </form>
          </div>

          {/* List of achievers */}
          <div className="lg:col-span-2 glass-pane-elevated">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-manrope mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">format_quote</span>
              Currently Featured Success Stories
            </h3>

            {achieversList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No custom achievers uploaded. Default success stories will be rendered on the landing page.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achieversList.map((a) => (
                  <div key={a.id} className="relative bg-slate-50 dark:bg-white/[0.02] p-5 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <img src={a.photo_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuAXIyldosztmi8fNPYHddI3Ddsv7gSvYSw5EolHH-DQnTg4GfkF2Ng-ZPSCTwr1eUIHeVcVllJJbD17V6s1Ydd6_rAfMZFs6Qounf8a9P-WhPdR34KrWk0I6a6JlF6RnvzRlapPaiica1iWLhhRQBg5EMN_cPIml1df-in3jeIPiDj1OgKWBX6KyOZ5sFhvdBRUH9eNVvUoQ7itGs22Fm46XyOFDb3whdrbuxA_9pCBIqxqO5XbMUlmPbLgcmIo4IEnewxsmwYl-rIS"} alt={a.name} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <h4 className="font-bold text-xs text-slate-800 dark:text-white">{a.name}</h4>
                          <p className="text-[10px] text-primary font-bold">{a.achievement}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed italic mb-4">&quot;{a.testimonial}&quot;</p>
                    </div>
                    
                    <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-white/5">
                      <button
                        onClick={() => handleDeleteAchiever(a.id)}
                        className="btn-ghost !text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border border-transparent hover:border-red-500/20"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'visitor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Founder Section */}
          <div className="glass-pane-elevated h-fit flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-manrope mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">face</span>
              Founder / Owner Photo
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="relative group max-w-[200px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 aspect-[4/5] bg-slate-100 dark:bg-slate-950 shadow-md">
                  <img src={founderImage} alt="Founder Preview" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Replace Founder Photo</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setCropperImage(reader.result as string);
                          setCropperType('founder');
                          setShowCropper(true);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer w-full"
                  />
                </div>
                <div className="mt-2">
                  <span className="text-[10px] text-slate-400 font-semibold block">Or paste image URL:</span>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={founderImage}
                    onChange={(e) => setFounderImage(e.target.value)}
                    className="input-premium w-full py-2 px-3 text-xs text-[#0f172a] dark:text-white mt-1"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveFounderImage}
                disabled={isSaving}
                className="btn-primary w-full py-2.5 text-xs rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg mt-2"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                Save Founder Photo
              </button>
            </div>
          </div>

          {/* Hero Slides Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Form for adding/editing hero slide */}
            <div className="glass-pane-elevated">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-manrope mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">slideshow</span>
                {editingSlideIdx !== null ? `Edit Slide #${editingSlideIdx + 1}` : "Add New Hero Slide"}
              </h3>
              
              <form onSubmit={handleAddEditSlide} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Slide Tag / Badge</label>
                    <input
                      type="text"
                      placeholder="e.g. Namnakala Branch"
                      value={slideTag}
                      onChange={(e) => setSlideTag(e.target.value)}
                      className="input-premium w-full py-2 px-3 text-xs text-[#0f172a] dark:text-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">CTA Button Text</label>
                    <input
                      type="text"
                      placeholder="e.g. View Seating"
                      value={slideCta}
                      onChange={(e) => setSlideCta(e.target.value)}
                      className="input-premium w-full py-2 px-3 text-xs text-[#0f172a] dark:text-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">CTA Target Link</label>
                    <input
                      type="text"
                      placeholder="e.g. #seating or #pricing"
                      value={slideCtaHref}
                      onChange={(e) => setSlideCtaHref(e.target.value)}
                      className="input-premium w-full py-2 px-3 text-xs text-[#0f172a] dark:text-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Slide Main Headline</label>
                    <input
                      type="text"
                      placeholder="e.g. Quiet Spaces.\nBig Ambitions."
                      value={slideHeadline}
                      onChange={(e) => setSlideHeadline(e.target.value)}
                      className="input-premium w-full py-2 px-3 text-xs text-[#0f172a] dark:text-white"
                      required
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Slide Subheading / Description</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Premium seating, high-speed Wi-Fi, and a culture of achievement..."
                      value={slideSub}
                      onChange={(e) => setSlideSub(e.target.value)}
                      className="input-premium w-full py-2 px-3 text-xs text-[#0f172a] dark:text-white"
                      required
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Slide Image (Aspect locked 2:1)</label>
                    <div className="space-y-2">
                      <input
                        type="url"
                        placeholder="Paste Image URL (https://...)"
                        value={slideImage}
                        onChange={(e) => setSlideImage(e.target.value)}
                        className="input-premium w-full py-2 px-3 text-xs text-[#0f172a] dark:text-white"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Or Upload from Computer:</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setCropperImage(reader.result as string);
                                setCropperType('hero');
                                setShowCropper(true);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                        />
                      </div>
                    </div>
                    {slideImage && (
                      <div className="mt-2 relative w-36 h-18 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 aspect-[2/1] max-w-[200px]">
                        <img src={slideImage} className="w-full h-full object-cover" alt="Slide Preview" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  {editingSlideIdx !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSlideIdx(null);
                        setSlideTag("");
                        setSlideHeadline("");
                        setSlideSub("");
                        setSlideCta("");
                        setSlideCtaHref("");
                        setSlideImage("");
                      }}
                      className="btn-ghost flex-1 py-2 text-xs rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="btn-primary flex-1 py-2 text-xs rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                    {editingSlideIdx !== null ? "Apply Slide Changes" : "Add Slide to List"}
                  </button>
                </div>
              </form>
            </div>

            {/* List of current slides */}
            <div className="glass-pane-elevated">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-manrope flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">view_carousel</span>
                  Current Hero Slides ({heroSlides.length})
                </h3>
                <button
                  type="button"
                  onClick={handleSaveHeroSlides}
                  disabled={isSaving || heroSlides.length === 0}
                  className="btn-primary py-2 px-4 text-xs rounded-xl font-bold flex items-center gap-1.5 shadow-md"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  Save Slides Order & Changes
                </button>
              </div>

              {heroSlides.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No slides defined. Default static slides will be rendered on the landing page.
                </div>
              ) : (
                <div className="space-y-4">
                  {heroSlides.map((slide, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] items-start md:items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-24 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 shrink-0 aspect-[2/1]">
                          <img src={slide.src} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                              {slide.tag || "Krishna Library"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">Slide #{idx + 1}</span>
                          </div>
                          <h4 className="font-bold text-xs text-slate-800 dark:text-white truncate mt-1">{slide.headline}</h4>
                          <p className="text-[10px] text-slate-400 truncate leading-relaxed">{slide.sub}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditSlideClick(idx)}
                          className="btn-ghost !text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border border-transparent hover:border-primary/20"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSlide(idx)}
                          className="btn-ghost !text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border border-transparent hover:border-red-500/20"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gallery Photo Selector Modal */}
      {showGallerySelector && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            onClick={() => setShowGallerySelector(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <div className="glass-pane-elevated max-w-2xl w-full relative z-10 overflow-hidden !rounded-2xl border border-white/10 shadow-2xl p-6">
            <button
              onClick={() => setShowGallerySelector(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] transition-all text-white"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
            
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-manrope mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">photo_library</span>
              Select Photo from Gallery
            </h3>
            
            {gallery.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No photos in the gallery to import.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-2" data-lenis-prevent>
                {gallery.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => {
                      setNewAchieverPhoto(img.url);
                      setShowGallerySelector(false);
                    }}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 aspect-video bg-slate-100 dark:bg-slate-950 hover:border-primary transition-all text-left"
                  >
                    <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-end p-2">
                      <span className="text-[10px] text-white font-bold truncate">{img.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
      {/* Image Cropper Modal */}
      {showCropper && (
        <ImageCropper
          imageSrc={cropperImage}
          type={cropperType}
          onClose={() => setShowCropper(false)}
          onCropComplete={(croppedBase64) => {
            if (cropperType === 'gallery') {
              setNewPhotoUrl(croppedBase64);
            } else if (cropperType === 'achiever') {
              setNewAchieverPhoto(croppedBase64);
            } else if (cropperType === 'founder') {
              setFounderImage(croppedBase64);
            } else if (cropperType === 'hero') {
              setSlideImage(croppedBase64);
            }
            setShowCropper(false);
          }}
        />
      )}
    </div>
  );
}
