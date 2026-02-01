"use client";

import { motion } from "framer-motion";
import { Clock, Shield, CreditCard, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Clock,
    title: "Daily transfers at 2am",
    description:
      "Automatic transfers run every day at 2am GMT. Set it and forget it.",
  },
  {
    icon: Shield,
    title: "Secure connections",
    description:
      "Official Monzo and TrueLayer APIs. Bank-level security, no credential storage.",
  },
  {
    icon: CreditCard,
    title: "Track multiple cards",
    description:
      "Connect all your credit cards. Full balance, percentage, or fixed amount transfers.",
  },
  {
    icon: TrendingUp,
    title: "Automated savings",
    description:
      "Watch your pots grow automatically. Build savings without thinking about it.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Key Benefits
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to automate your savings
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Card className="h-full">
                <CardContent className="pt-6">
                  <feature.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
