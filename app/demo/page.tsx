import { BouncingBalls } from "@/components/ui/bouncing-balls";

export default function DemoOne() {
  return (
    <div className="w-full h-screen bg-[#0b1326] flex items-center justify-center">
        <h1 className="text-white text-4xl font-manrope font-black z-10 relative pointer-events-none">Bouncing Balls Background</h1>
        <BouncingBalls 
            numBalls={100}
            colors={["#bfc2ff", "#e9c400", "#ffffff"]}
            opacity={0.5}
            speed={1}
            interactive={true}
        />
    </div>
  );
}