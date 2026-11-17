import { ContactForm } from "@/components/contact/contact-form";
import { SiteFrame } from "@/components/site-frame";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "تواصل معنا",
  description: "راسل أكاديمية كادر بالاسم ووسيلة التواصل والموضوع، أو عبر واتساب.",
  path: "/contact",
});

export default function Page() {
  return (
    <SiteFrame>
      <ContactForm />
    </SiteFrame>
  );
}
