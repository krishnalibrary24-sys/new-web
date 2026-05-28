"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

export default function ReservationForm() {
  const [selectedSlotId, setSelectedSlotId] = useState(2);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [branch, setBranch] = useState("bengali-chowk");
  const [seatNo, setSeatNo] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const slots = branch === 'namnakala' ? [
    {
      id: 1,
      title: "Morning Slot",
      description: "7:30 AM to 2:30 PM",
      price: "₹600/month",
      interestValue: "Morning",
    },
    {
      id: 2,
      title: "Full Day Slot",
      description: "7:30 AM to 9:30 PM",
      price: "₹1,000/month",
      interestValue: "Full Day",
    },
    {
      id: 3,
      title: "Evening Slot",
      description: "2:30 PM to 9:30 PM",
      price: "₹600/month",
      interestValue: "Evening",
    },
  ] : [
    {
      id: 1,
      title: "Morning Slot",
      description: "7:00 AM to 3:00 PM",
      price: "₹600/month",
      interestValue: "Morning",
    },
    {
      id: 2,
      title: "Full Day Slot",
      description: "7:00 AM to 10:00 PM",
      price: "₹1,000/month",
      interestValue: "Full Day",
    },
    {
      id: 3,
      title: "Evening Slot",
      description: "3:00 PM to 10:00 PM",
      price: "₹600/month",
      interestValue: "Evening",
    },
  ];

  const selectedSlot = slots.find(s => s.id === selectedSlotId) || slots[1];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const payload = {
        full_name: fullName,
        phone: phone,
        interest: selectedSlot.interestValue,
        branch: branch,
        notes: `Seat No: ${seatNo || 'Not specified'}. Email: ${email || 'None'}. ${notes}`.trim(),
        status: "new",
      };

      const { error: insertError } = await supabase.from("leads").insert([payload]);

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      setFullName("");
      setPhone("");
      setEmail("");
      setSeatNo("");
      setNotes("");
    } catch (err: any) {
      console.error("Failed to submit reservation:", err);
      setError(err.message || "Failed to submit reservation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-6 md:p-10 bg-v-surface-container-low rounded-3xl border border-v-outline-variant/20 max-w-4xl mx-auto shadow-xl">
      <div className="w-full">
        <h3 className="text-2xl font-bold font-v-display text-v-on-background">
          Reserve Your Study Space
        </h3>
        <p className="mt-2 text-sm text-v-on-surface-variant leading-relaxed">
          Fill out the form below to request a study cabin at your preferred branch and slot. No immediate payment required.
        </p>
        
        {success && (
          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-medium">
            ✓ Reservation request submitted successfully! We will contact you shortly.
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-sm font-medium">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
            <div className="col-span-full sm:col-span-3">
              <Label htmlFor="full-name" className="font-semibold text-v-on-background">
                Full Name<span className="text-rose-500">*</span>
              </Label>
              <Input
                type="text"
                id="full-name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="mt-2 bg-v-surface border-v-outline-variant/30 text-v-on-background focus:ring-v-primary"
              />
            </div>
            
            <div className="col-span-full sm:col-span-3">
              <Label htmlFor="phone" className="font-semibold text-v-on-background">
                Phone Number<span className="text-rose-500">*</span>
              </Label>
              <Input
                type="tel"
                id="phone"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="mt-2 bg-v-surface border-v-outline-variant/30 text-v-on-background focus:ring-v-primary"
              />
            </div>

            <div className="col-span-full sm:col-span-3">
              <Label htmlFor="email" className="font-semibold text-v-on-background">
                Email Address <span className="text-xs text-v-on-surface-variant">(Optional)</span>
              </Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="mt-2 bg-v-surface border-v-outline-variant/30 text-v-on-background focus:ring-v-primary"
              />
            </div>

            <div className="col-span-full sm:col-span-3">
              <Label htmlFor="branch" className="font-semibold text-v-on-background">
                Select Branch<span className="text-rose-500">*</span>
              </Label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger id="branch" className="mt-2 bg-v-surface border-v-outline-variant/30 text-v-on-background">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent className="bg-v-surface border-v-outline-variant/30 text-v-on-background">
                  <SelectItem value="bengali-chowk">Bangali Chowk</SelectItem>
                  <SelectItem value="namnakala">Namnakala</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-full sm:col-span-3">
              <Label htmlFor="seat-no" className="font-semibold text-v-on-background">
                Preferred Seat / Book No <span className="text-xs text-v-on-surface-variant">(Optional)</span>
              </Label>
              <Input
                type="text"
                id="seat-no"
                value={seatNo}
                onChange={(e) => setSeatNo(e.target.value)}
                placeholder="e.g. 14A"
                className="mt-2 bg-v-surface border-v-outline-variant/30 text-v-on-background focus:ring-v-primary"
              />
            </div>

            <div className="col-span-full sm:col-span-3">
              <Label htmlFor="notes" className="font-semibold text-v-on-background">
                Additional Description / Notes <span className="text-xs text-v-on-surface-variant">(Optional)</span>
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requirements..."
                className="mt-2 bg-v-surface border-v-outline-variant/30 text-v-on-background focus:ring-v-primary resize-none min-h-[40px] h-[40px] focus:h-[100px] transition-all duration-200"
              />
            </div>

            <Separator className="col-span-full my-4 bg-v-outline-variant/20" />
            
            <div className="col-span-full">
              <Label className="font-semibold text-v-on-background block mb-4">
                Select a Study Slot
              </Label>

              <RadioGroup
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                value={selectedSlotId.toString()}
                onValueChange={(value) => {
                  setSelectedSlotId(Number(value));
                }}
              >
                {slots.map((item) => (
                  <label
                    key={item.id}
                    htmlFor={`slot-option-${item.id}`}
                    className={`relative flex flex-col gap-2 rounded-xl border p-4 shadow-sm outline-none cursor-pointer transition-all duration-200 ${
                      selectedSlot.id === item.id
                        ? "border-v-secondary bg-v-secondary/5 ring-1 ring-v-secondary"
                        : "border-v-outline-variant/30 bg-v-surface hover:border-v-secondary/50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="block text-sm font-bold text-v-on-background">
                        {item.title}
                      </span>
                      <RadioGroupItem
                        id={`slot-option-${item.id}`}
                        value={item.id.toString()}
                        className="border-v-outline-variant text-v-secondary"
                      />
                    </div>
                    <div className="flex flex-col h-full justify-between mt-1">
                      <p className="text-xs text-v-on-surface-variant">
                        {item.description}
                      </p>
                      <span className="mt-3 block text-sm font-bold text-v-secondary">
                        {item.price}
                      </span>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </div>

          <Separator className="my-6 bg-v-outline-variant/20" />
          
          <div className="flex items-center justify-end space-x-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-v-secondary text-white hover:bg-v-secondary/90 px-8 py-3 rounded-xl transition-all font-semibold"
            >
              {loading ? "Submitting..." : "Submit Reservation"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
