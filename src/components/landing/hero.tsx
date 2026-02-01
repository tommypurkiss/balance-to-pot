"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="container px-4">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Automate Your Savings with{" "}
            <span className="text-primary">Credit Card to Pot</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            Connect your Monzo account and credit cards. We&apos;ll
            automatically transfer your balance to your Monzo pots every day at
            2am. Save smarter, effortlessly.
          </p>
          <motion.div
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button asChild size="lg" className="text-base">
              <Link href="/auth/signup" className="gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <Link href="/#how-it-works">See How It Works</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
