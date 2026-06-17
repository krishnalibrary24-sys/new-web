"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MapPin, Library, X, ChevronRight, ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

const DEFAULT_IMAGES = [
  {
    src: "/assets/images/Gallery/exterior.jpg",
    branch: "bengali-chowk",
    label: "Bangali Chowk Branch",
    caption: "Building Exterior",
  },
  {
    src: "/assets/images/Gallery/entry_gate.jpg",
    branch: "bengali-chowk",
    label: "Bangali Chowk Branch",
    caption: "Entry Gate",
  },
  {
    src: "/assets/images/Gallery/light_room.jpg",
    branch: "namnakala",
    label: "Namnakala Branch",
    caption: "Light Study Room",
  },
  {
    src: "/assets/images/Gallery/dark_room.jpg",
    branch: "namnakala",
    label: "Namnakala Branch",
    caption: "Dark Study Room",
  },
  {
    src: "/assets/images/Gallery/discussion_hall.jpg",
    branch: "bengali-chowk",
    label: "Bangali Chowk Branch",
    caption: "Discussion Hall",
  },
  {
    src: "/assets/images/Gallery/office.jpg",
    branch: "bengali-chowk",
    label: "Bangali Chowk Branch",
    caption: "Office Area",
  },
  {
    src: "/assets/images/Gallery/parking.jpg",
    branch: "namnakala",
    label: "Namnakala Branch",
    caption: "Parking Zone",
  },
];

export const GalleryDemo = () => {
  const [images, setImages] = useState(DEFAULT_IMAGES);
  const [activeBranch, setActiveBranch] = useState("bengali-chowk");
  const [selectedImage, setSelectedImage] = useState<any | null>(null);

  useEffect(() => {
    async function loadGallery() {
      try {
        const { data, error } = await supabase
          .from("gallery_photos")
          .select("*")
          .order("created_at", { ascending: true });
        if (error) throw error;
        if (data && data.length > 0) {
          setImages(
            data.map((item: any) => ({
              src: item.url,
              branch: item.branch,
              label:
                item.branch === "bengali-chowk"
                  ? "Bangali Chowk Branch"
                  : item.branch === "namnakala"
                  ? "Namnakala Branch"
                  : "All Branches",
              caption: item.title || "Library View",
            }))
          );
        }
      } catch (err) {
        console.warn("Failed to load gallery photos, using defaults", err);
      }
    }
    loadGallery();
  }, []);

  const displayedImages = images.filter(
    (img) => img.branch === activeBranch || img.branch === "all" || !img.branch
  );

  return (
    <section className="relative bg-v-surface text-v-on-background py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-v-primary/10 text-v-primary font-bold text-xs uppercase tracking-wider mb-6 border border-v-primary/20">
            <Library className="w-4 h-4" />
            Photo Gallery
          </div>
          <h2 className="font-v-display text-4xl md:text-5xl text-v-on-background font-bold leading-tight mb-6">
            Inside the <span className="text-v-primary">Krishna Library</span>
          </h2>
          <p className="leading-relaxed text-v-on-surface-variant text-lg font-v-body-md mb-8">
            Take a visual tour of our beautifully designed spaces. Explore our infrastructure across both branches below.
          </p>
        </motion.div>

        {/* Branch Toggle Slider */}
        <div className="flex justify-center mb-12">
          <div className="bg-[#f1f5f9] p-1.5 rounded-2xl inline-flex relative shadow-inner">
            <button
              onClick={() => setActiveBranch("bengali-chowk")}
              className={`relative z-10 px-6 sm:px-10 py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 ${
                activeBranch === "bengali-chowk" ? "text-white" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Bangali Chowk Branch
            </button>
            <button
              onClick={() => setActiveBranch("namnakala")}
              className={`relative z-10 px-6 sm:px-10 py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 ${
                activeBranch === "namnakala" ? "text-white" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Namnakala Branch
            </button>
            <div
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-v-primary rounded-xl transition-all duration-300 ease-out shadow-md"
              style={{
                left: activeBranch === "bengali-chowk" ? "6px" : "calc(50%)",
              }}
            />
          </div>
        </div>

        {/* Swipe Hint */}
        <div className="text-center mb-6 md:hidden">
          <p className="text-sm font-bold text-v-primary animate-pulse flex items-center justify-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Slide to switch branches <ChevronRight className="w-4 h-4" />
          </p>
        </div>

        {/* Grid Gallery Section with Drag to Switch */}
        <motion.div 
          key={activeBranch}
          initial={{ opacity: 0, x: activeBranch === 'bengali-chowk' ? -50 : 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = offset.x;
            if (swipe < -50) {
              setActiveBranch("namnakala");
            } else if (swipe > 50) {
              setActiveBranch("bengali-chowk");
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 cursor-grab active:cursor-grabbing"
        >
          {displayedImages.map((img, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => setSelectedImage(img)}
              className="relative group aspect-[4/3] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <img
                src={img.src}
                alt={`${img.caption} — ${img.label}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="text-white font-bold text-lg font-v-headline-sm">{img.caption}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        {displayedImages.length === 0 && (
          <div className="text-center py-20 text-slate-400 font-bold">
            No photos uploaded for this branch yet.
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-12 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative max-w-5xl w-full max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedImage.src} 
                alt={selectedImage.caption} 
                className="w-full h-full object-contain bg-black/50"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 md:p-8 pt-20">
                <p className="text-white/80 text-sm font-bold uppercase tracking-widest mb-1">{selectedImage.label}</p>
                <h3 className="text-white text-2xl md:text-4xl font-black font-v-display">{selectedImage.caption}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background ambient glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 h-[80vh] w-[80vw]"
        style={{
          background: "radial-gradient(circle, rgba(0,49,120,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
    </section>
  );
};
