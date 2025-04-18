"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { SimliAgent } from "./components/simli-agent";
import { DottedFace } from "./components/dotted-face";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IconAlertTriangle, IconX } from "@tabler/icons-react";

interface LiveSession {
  id: number;
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
  status: string;
}

export default function LiveSessionPage() {
  const [showDottedFace, setShowDottedFace] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const onStart = async () => {
    setShowDottedFace(false);
    setError(null);
  };

  const onClose = () => {
    setShowDottedFace(true);
    setError(null);
  };

  const onError = (errorMessage: string) => {
    setError(errorMessage);
    toast({
      variant: "destructive",
      title: "Session Error",
      description: errorMessage,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent mb-4">
          Live Learning Sessions
        </h1>
        <p className="text-gray-400 text-lg mb-8 max-w-2xl">
          Join interactive live sessions with AI tutors and fellow learners.
        </p>
        <Alert className="mb-6 bg-gray-700">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertTitle>Note</AlertTitle>
          <AlertDescription>
            This is a free version of the agent. If you encounter server busy issues or any other issues, please try again later.
          </AlertDescription>
        </Alert>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <Alert variant="destructive">
              <IconAlertTriangle className="h-4 w-4" />
              <AlertTitle>Session Error</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setError(null)}
                  className="h-8 w-8"
                >
                  <IconX className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col items-center gap-6 bg-[#13131A] rounded-xl p-8 shadow-2xl border border-[#27272A]"
      >
        <div className="w-[350px] h-[350px] relative">
          {showDottedFace && <DottedFace />}
          <SimliAgent onStart={onStart} onClose={onClose} onError={onError} />
        </div>
      </motion.div>
    </div>
  );
} 