import { GalleryDemo } from "@/components/blocks/gallery-demo";
import VisitorNav from "@/components/visitor-nav";
import Footer4Col from "@/components/ui/footer-column";

export const metadata = {
  title: "Gallery - Krishna Library",
  description: "Take a visual tour of Krishna Library's beautiful branches at Namlakala and Bengali Chowk.",
};

export default function GalleryPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <VisitorNav />
      <main className="flex-1 pt-20 bg-v-surface">
        <GalleryDemo />
      </main>
      <Footer4Col />
    </div>
  );
}
