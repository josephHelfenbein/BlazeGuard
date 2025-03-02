"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";

export type MedicalFormData = {
  fullName: string;
  dateOfBirth: string;
  bloodType: string;
  allergies: string;
  medications: string;
  emergencyContact: string;
  emergencyPhone: string;
  hasChronicConditions: boolean;
  chronicConditions: string;
  additionalNotes: string;
};

const defaultFormData: MedicalFormData = {
  fullName: "",
  dateOfBirth: "",
  bloodType: "",
  allergies: "",
  medications: "",
  emergencyContact: "",
  emergencyPhone: "",
  hasChronicConditions: false,
  chronicConditions: "",
  additionalNotes: "",
};

interface MedicalFormProps {
  initialData?: Partial<MedicalFormData>;
  onSubmit: (data: MedicalFormData) => Promise<void>;
  submitButtonText?: string;
}

export default function MedicalForm({
  initialData = {},
  onSubmit,
  submitButtonText = "Save Information",
}: MedicalFormProps) {
  const [formData, setFormData] = useState<MedicalFormData>({
    ...defaultFormData,
    ...initialData,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, hasChronicConditions: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      toast({
        title: "Success",
        description: "Your medical information has been saved.",
      });
    } catch (error) {
      console.error("Error saving medical information:", error);
      toast({
        title: "Error",
        description:
          "Failed to save your medical information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="bloodType">Blood Type</Label>
          <Input
            id="bloodType"
            name="bloodType"
            value={formData.bloodType}
            onChange={handleChange}
            placeholder="e.g., A+, B-, O+"
          />
        </div>

        <div>
          <Label htmlFor="allergies">Allergies</Label>
          <Textarea
            id="allergies"
            name="allergies"
            value={formData.allergies}
            onChange={handleChange}
            placeholder="List any allergies (if none, leave blank)"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="medications">Current Medications</Label>
          <Textarea
            id="medications"
            name="medications"
            value={formData.medications}
            onChange={handleChange}
            placeholder="List any medications you're currently taking (if none, leave blank)"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
          <Input
            id="emergencyContact"
            name="emergencyContact"
            value={formData.emergencyContact}
            onChange={handleChange}
            placeholder="Name of emergency contact"
          />
        </div>

        <div>
          <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
          <Input
            id="emergencyPhone"
            name="emergencyPhone"
            value={formData.emergencyPhone}
            onChange={handleChange}
            placeholder="Phone number of emergency contact"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasChronicConditions"
            checked={formData.hasChronicConditions}
            onCheckedChange={handleCheckboxChange}
          />
          <Label htmlFor="hasChronicConditions">
            I have chronic medical conditions
          </Label>
        </div>

        {formData.hasChronicConditions && (
          <div>
            <Label htmlFor="chronicConditions">Chronic Conditions</Label>
            <Textarea
              id="chronicConditions"
              name="chronicConditions"
              value={formData.chronicConditions}
              onChange={handleChange}
              placeholder="Describe your chronic conditions"
              rows={3}
            />
          </div>
        )}

        <div>
          <Label htmlFor="additionalNotes">Additional Notes</Label>
          <Textarea
            id="additionalNotes"
            name="additionalNotes"
            value={formData.additionalNotes}
            onChange={handleChange}
            placeholder="Any additional information you'd like to provide"
            rows={3}
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitButtonText}
      </Button>
    </form>
  );
}
