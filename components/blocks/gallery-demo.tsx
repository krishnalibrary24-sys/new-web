"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MapPin, Library } from "lucide-react";

const IMAGES: { src: string; label: string; caption: string }[] = [
  {
    src: "/assets/images/Gallery/exterior.jpg",
    label: "Bangali Chowk Branch",
    caption: "Building Exterior",
  },
  {
    src: "/assets/images/Gallery/entry_gate.jpg",
    label: "Bangali Chowk Branch",
    caption: "Entry Gate",
  },
  {
    src: "/assets/images/Gallery/light_room.jpg",
    label: "Namnakala Branch",
    caption: "Light Study Room",
  },
  {
    src: "/assets/images/Gallery/dark_room.jpg",
    label: "Namnakala Branch",
    caption: "Dark Study Room",
  },
  {
    src: "/assets/images/Gallery/discussion_hall.jpg",
    label: "Bangali Chowk Branch",
    caption: "Discussion Hall",
  },
  {
    src: "/assets/images/Gallery/office.jpg",
    label: "Bangali Chowk Branch",
    caption: "Office Area",
  },
  {
    src: "/assets/images/Gallery/parking.jpg",
    label: "Namnakala Branch",
    caption: "Parking Zone",
  },
];

export const GalleryDemo = () => {
  return (
    <section className="relative bg-v-surface text-v-on-background py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-v-primary/10 text-v-primary font-bold text-xs uppercase tracking-wider mb-6 border border-v-primary/20">
            <Library className="w-4 h-4" />
            Photo Gallery
          </div>
          <h2 className="font-v-display text-4xl md:text-5xl text-v-on-background font-bold leading-tight mb-6">
            Inside the <span className="text-v-primary">Krishna Library</span>
          </h2>
          <p className="leading-relaxed text-v-on-surface-variant text-lg font-v-body-md mb-8">
            Take a visual tour of our beautifully designed spaces. From the quiet reading rooms of our Namlakala branch to the high-tech collaboration zones at Bengali Chowk.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://maps.app.goo.gl/qe5inarf97yZfRvG9"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-v-primary text-v-on-primary hover:bg-v-primary-container hover:text-v-on-primary-container rounded-full px-8 py-6 font-bold shadow-lg flex items-center gap-2 w-full sm:w-auto">
                Visit Bangali Chowk <MapPin className="w-4 h-4" />
              </Button>
            </a>
            <a
              href="https://maps.app.goo.gl/QMnULNxGCoyZbeyj9"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-v-primary text-v-on-primary hover:bg-v-primary-container hover:text-v-on-primary-container rounded-full px-8 py-6 font-bold shadow-lg flex items-center gap-2 w-full sm:w-auto">
                Visit Namnakala <MapPin className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Grid Gallery Section */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        >
          {IMAGES.map((img, idx) => (
            <motion.div
              key={idx}
              variants={{
                hidden: { opacity: 0, scale: 0.9, y: 20 },
                visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
              }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative group aspect-[4/3] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <img
                src={img.src}
                alt={`${img.caption} — ${img.label}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-v-primary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">{img.label}</p>
                  <span className="text-white font-bold text-lg font-v-headline-sm">{img.caption}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

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
