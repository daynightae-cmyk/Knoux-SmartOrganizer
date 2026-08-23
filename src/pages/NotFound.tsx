import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Home, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-knoux-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg w-full"
      >
        <Card className="text-center overflow-hidden">
          <CardContent className="p-12">
            {/* Animated 404 */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-8"
            >
              <div className="relative">
                <h1 className="text-8xl font-bold knoux-text-gradient mb-4">
                  404
                </h1>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 right-0 -mt-4 -mr-4"
                >
                  <div className="w-12 h-12 bg-gradient-knoux rounded-full flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-4 mb-8"
            >
              <div className="flex items-center justify-center space-x-2 text-gray-500 mb-4">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm uppercase tracking-wide font-medium">
                  Page Not Found
                </span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! This page got lost
              </h2>

              <p className="text-gray-600 leading-relaxed">
                Even our AI couldn't organize this page into the right place. It
                seems like the page you're looking for doesn't exist or has been
                moved.
              </p>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="bg-gradient-knoux text-white">
                  <Link to="/">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                  </Link>
                </Button>

                <Button variant="outline" asChild>
                  <Link to="/">
                    <Search className="w-4 h-4 mr-2" />
                    Start Organizing
                  </Link>
                </Button>
              </div>

              {/* Fun AI message */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="p-4 bg-knoux-50 rounded-lg border border-knoux-200"
              >
                <p className="text-sm text-knoux-700">
                  💡 <strong>Pro Tip:</strong> While you're here, why not upload
                  some images and let our AI organize them for you? It's way
                  better at finding things than we are!
                </p>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>

        {/* Brand Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8"
        >
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <Brain className="w-4 h-4" />
            <span className="text-sm">Knoux SmartOrganizer PRO</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
