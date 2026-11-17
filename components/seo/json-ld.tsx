import { brand } from "@/config/site";
import { absoluteUrl, readSeo } from "@/lib/seo";

export async function JsonLd() {
  const seo = await readSeo();
  const url = absoluteUrl("/");
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        name: brand.nameAr,
        url,
        description: seo.description,
        inLanguage: "ar",
      },
      {
        "@type": "Course",
        name: "عضوية كادر",
        description: "عضوية شهرية لصناعة المشهد السينمائي والإعلان بالذكاء الاصطناعي: شخصية ثابتة، حركة كاميرا، وبوستر.",
        inLanguage: "ar",
        provider: {
          "@type": "EducationalOrganization",
          name: brand.nameAr,
          url,
        },
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
