"use client";

import { useState, useEffect } from "react";
import MedicalForm, { MedicalFormData } from "@/components/MedicalForm";
import { useToast } from "@/components/ui/use-toast";

interface MedicalInfoFormProps {
  initialData?: Partial<MedicalFormData>;
}

export default function MedicalInfoForm({
  initialData = {},
}: MedicalInfoFormProps) {
  const [formData, setFormData] =
    useState<Partial<MedicalFormData>>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch medical info when component mounts
  useEffect(() => {
    const fetchMedicalInfo = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching medical info...");
        const response = await fetch("/api/medical-info");

        if (!response.ok) {
          const errorData = await response.json();
          console.error("API error response:", errorData);
          throw new Error(
            errorData.error || "Failed to fetch medical information"
          );
        }

        const result = await response.json();
        console.log("Fetched medical info:", result);

        if (result.data && Object.keys(result.data).length > 0) {
          console.log("Setting form data with:", result.data);
          setFormData(result.data);
        } else {
          console.log("No existing medical info found");
          setFormData({});
        }
      } catch (error) {
        console.error("Error fetching medical info:", error);
        toast({
          title: "Error",
          description: "Failed to load your medical information",
          variant: "destructive",
        });
        setFormData({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedicalInfo();
  }, [toast]);

  const handleSubmit = async (data: MedicalFormData) => {
    setIsSubmitting(true);

    try {
      console.log("Submitting medical info:", data);
      const response = await fetch("/api/medical-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        throw new Error(
          errorData.error || "Failed to save medical information"
        );
      }

      const result = await response.json();
      console.log("Save response:", result);

      if (result.data && result.data.length > 0) {
        console.log("Updating form data with:", result.data[0]);
        setFormData(result.data[0]);
      }

      toast({
        title: "Success",
        description: "Your medical information has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving medical info:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save medical information",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        Loading your medical information...
      </div>
    );
  }

  return (
    <MedicalForm
      initialData={formData}
      onSubmit={handleSubmit}
      submitButtonText={
        Object.keys(formData).length > 0
          ? "Update Information"
          : "Save Information"
      }
    />
  );
}
