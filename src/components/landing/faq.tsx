"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is my financial data secure?",
    answer:
      "Yes. We use official Monzo and TrueLayer APIs with bank-level security. We never store your login credentials. All tokens are encrypted. We're fully compliant with UK Open Banking regulations.",
  },
  {
    question: "When do transfers happen?",
    answer:
      "Transfers run automatically every day at 2am GMT (or BST during British Summer Time). This ensures your credit card balance is up to date from the previous day's spending.",
  },
  {
    question: "Which credit cards are supported?",
    answer:
      "We use TrueLayer for credit card connections. Support depends on your card provider's participation in Open Banking. Popular UK providers like Amex, Barclaycard, and others are typically supported. We'll show you if your card is supported during connection.",
  },
  {
    question: "What if I don't have enough in my Monzo account?",
    answer:
      "If your Monzo account doesn't have sufficient funds for the transfer, we'll skip that run and send you an email notification. You can manually move funds and we'll try again the next day, or adjust your automation settings.",
  },
  {
    question: "Do I need to reconnect my accounts?",
    answer:
      "Yes. Open Banking regulations require re-authorisation every 90 days. We'll remind you when reconnection is needed (with warnings at 10 days remaining) and make it a one-click process.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-28 bg-muted/30">
      <div className="container px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about PotSaver
          </p>
        </motion.div>

        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
