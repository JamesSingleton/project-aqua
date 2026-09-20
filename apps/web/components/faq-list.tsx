import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@project-aqua/ui/components/accordion";
import { faqs } from "@/lib/site";

export function FaqList() {
  return (
    <Accordion>
      {faqs.map((item, index) => (
        <AccordionItem key={item.question} value={`faq-${index}`}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
