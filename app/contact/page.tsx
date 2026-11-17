import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { SiteFrame } from "@/components/site-frame";

export const metadata: Metadata = {
  title: "تواصل معنا",
  description: "راسل أكاديمية كادر بالاسم ووسيلة التواصل والموضوع، أو عبر واتساب.",
};

export default function Page() {
  return (
    <SiteFrame>
      <ContactForm />
    </SiteFrame>
  );
}
