# كادر AI

أكاديمية لكتابة برومبت السينما والإعلان. الموقع بالعربية أولاً (مع تبديل إلى الإنجليزية)، واتجاه RTL، واشتراك شهري يفتح ثلاثة بوتات تُرجع برومبتاً جاهزاً للنسخ. البوتات لا تولّد صورة ولا فيديو.

الاسم والألوان والسعر والعدّ التنازلي ورقم واتساب في ملف واحد: `config/site.ts`.

## التشغيل المحلي

```bash
npm install
cp .env.example .env.local
npm run dev
```

ثم افتح `http://localhost:3000`.

للمعاينة من غير Supabase وبدون مفتاح OpenAI:

```bash
# داخل .env.local
NEXT_PUBLIC_DEMO_MODE=true
```

وضع المعاينة يحفظ المحادثات في المتصفح فقط ولا يستدعي النموذج. **عطّله في الإنتاج.**

```bash
npm run lint
npm run build
```

## المتغيرات

| المتغير | أين يُستخدم |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | روابط العودة من الدفع وبيانات الصفحة |
| `NEXT_PUBLIC_DEMO_MODE` | `true` للمعاينة فقط |
| `NEXT_PUBLIC_SUPABASE_URL` | العميل والخادم |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | العميل والخادم |
| `SUPABASE_SERVICE_ROLE_KEY` | الخادم فقط: الكتابة، الويبهوك، الإدارة |
| `OPENAI_API_KEY` | الخادم فقط |
| `OPENAI_MODEL` | الافتراضي `gpt-4.1-mini` |
| `MONTHLY_MESSAGE_QUOTA` | الافتراضي 200 رسالة مستخدم في الشهر |
| `RATE_LIMIT_PER_MINUTE` | الافتراضي 8 |
| `HISTORY_TOKEN_BUDGET` | تاريخ الجلسة المُرسل مع كل طلب |
| `PAYMENT_PROVIDER` | `stripe` الآن |
| `STRIPE_SECRET_KEY` | الخادم فقط |
| `STRIPE_WEBHOOK_SECRET` | توقيع الويبهوك |
| `STRIPE_PRICE_ID` | سعر الاشتراك الشهري |
| `ADMIN_EMAILS` | بريد المشرفين، مفصول بفاصلة |

## Supabase

1. أنشئ مشروعاً على [supabase.com](https://supabase.com).
2. من **Project Settings → API** انسخ عنوان المشروع والمفتاح العام `anon` ومفتاح `service_role`. المفتاح الأخير لا يُوضع في أي ملف يصل إلى المتصفح.
3. افتح **SQL Editor** والصق محتوى `supabase/migrations/20261114120000_init.sql` ثم نفّذه. ينشئ الجداول والسياسات ودالة إنشاء الملف الشخصي عند التسجيل:
   - `profiles`
   - `subscriptions`
   - `chat_sessions`
   - `messages`
   - `usage_monthly`
4. السياسات تسمح للطالب بقراءة صفوفه فقط. الكتابة على الاشتراك ورسائل المساعد تتم بمفتاح الخدمة من مسارات الخادم.
5. من **Authentication → URL Configuration** ضع موقعك، مثلاً `http://localhost:3000` محلياً و`https://your-domain.com` بعد النشر. أضف مسار إعادة التوجيه: `https://your-domain.com/auth/callback`.
6. **Authentication → Providers**: البريد مفعّل افتراضياً. فعّل Google إذا أردت، والصق معرّف العميل وسرّه من Google Cloud، وأضف نفس مسار `/auth/callback` في قائمة العناوين المسموحة عند جوجل.
7. إن كان تأكيد البريد مفعّلاً، المستخدم يرى رسالة «تفقد البريد» قبل الدخول. يمكن إطفاؤه من إعدادات المزود أثناء التجربة.

## Stripe

1. أنشئ منتجاً بسعر **متكرر شهري** في وضع الاختبار.
2. انسخ `price_...` إلى `STRIPE_PRICE_ID`.
3. من **Developers → API keys** انسخ المفتاح السري.
4. للويبهوك المحلي:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

انسخ سر التوقيع `whsec_...` إلى `STRIPE_WEBHOOK_SECRET`.

5. في الإنتاج، أضف نقطة نهاية في Stripe تشير إلى:

```text
https://your-domain.com/api/billing/webhook
```

الأحداث التي يتعامل معها الكود: `checkout.session.completed` و`customer.subscription.created` و`customer.subscription.updated` و`customer.subscription.deleted` و`invoice.payment_failed`.

الويبهوك يكتب حالة الاشتراك في Postgres. البوتات تُفتح فقط عندما تكون الحالة `active` والفترة لم تنتهِ. التفعيل اليدوي يترك نهاية الفترة فارغة، أي تبقى العضوية حتى يوقفها المشرف.

من **Settings → Billing → Customer portal** فعّل إلغاء الاشتراك حتى يعمل زر «إدارة الدفع».

## إذا لم يتوفر Stripe

Stripe غير متاح لكل الحسابات في فلسطين. منطق الدفع معزول في `lib/payments/`:

- `types.ts` يعرّف الواجهة `PaymentProvider` (إنشاء جلسة دفع، بوابة العميل، قراءة الويبهوك).
- `stripe.ts` التنفيذ الحالي.
- `index.ts` يختار المزود حسب `PAYMENT_PROVIDER`.

لاستبداله بـ **Lemon Squeezy** أو **Paddle**:

1. أضف ملفاً مثل `lib/payments/lemonsqueezy.ts` يطبّق نفس الواجهة ويحوّل حدث الدفع إلى `SubscriptionUpdate`.
2. أرجعه من `getPaymentProvider()` عندما تكون قيمة `PAYMENT_PROVIDER` مطابقة.
3. وجّه ويبهوك المزود إلى `/api/billing/webhook` أو أضف مساراً رفيعاً يستدعي `applySubscriptionUpdate` في `lib/billing-store.ts`.

إلى أن يجهز ذلك، المسار العملي هو الدفع عبر واتساب (الرقم في `config/site.ts`) ثم التفعيل اليدوي.

## التفعيل اليدوي

1. ضع بريدك في `ADMIN_EMAILS`.
2. ادخل بهذا الحساب وافتح `/admin`.
3. التفعيل يضع `status = active` و`provider = manual`.
4. الإيقاف يعيد الحالة إلى `inactive`.

الطالب غير المشترك يرى جدار الدفع داخل المحادثة. القراءة ممكنة، والإرسال يرفضه الخادم برمز 402 حتى لو عُبث بالواجهة.

## البوتات

التعريف في `config/bots.ts`. المفعّل الآن:

| المسار | الدور |
| --- | --- |
| `scenes` | ورقة شخصية وإطار ثابت |
| `video` | حركة الكاميرا والعدسة والإضاءة والمشاعر |
| `posters` | تكوين البوستر ومعالجة العنوان |

`sfx` و`ads` ظاهران كـ«قريباً». قلب `enabled` إلى `true` يفتحهما من غير تعديل الصفحات.

كل بوت له ملفان في `prompts/`:

- `scenes.md` (والملف المماثل لكل بوت): تعليمات النظام. التعليق داخل `<!-- ... -->` يُحذف قبل الإرسال. **الصق تعليمات الـ GPT الخاصة بك مكان المسودة.**
- `scenes.knowledge.md`: معرفة تُلحَق أسفل التعليمات.

الطلب إلى OpenAI يُبنى على الخادم فقط: تعليمات النظام، ثم المعرفة، ثم تاريخ الجلسة مقصوصاً حسب `HISTORY_TOKEN_BUDGET`. المتصفح لا يرسل تعليمات النظام ولا يستطيع حقنها.

الرد يُعرض مع كتل الكود وزر نسخ. البرومبت المعدّ للصق بالإنجليزية لأن نماذج الصورة والفيديو تتبعه بثبات أكبر، والشرح بلغة الطالب.

### إضافة بوت لاحقاً

1. أضف عنصراً في `config/bots.ts` مع `slug` و`promptFile` و`knowledgeFile`.
2. أضف الملفين تحت `prompts/`.
3. اجعل `enabled: true`.

## المعرض

الأعمال في `data/works.ts`. العيّنات الحالية إطارات توضيحية بلا وسائط حقيقية. ضع `youtubeId` ليظهر المشغّل داخل النافذة. التصنيف يصفّي الشبكة.

## النشر على Vercel

1. ارفع المستودع إلى GitHub أو Origin.
2. [vercel.com/new](https://vercel.com/new) → استورد المشروع. الإطار Next.js يُكتشف وحده. أمر البناء `npm run build`.
3. أضف كل متغيرات `.env.example` في **Settings → Environment Variables**. `NEXT_PUBLIC_DEMO_MODE` تكون `false`. `NEXT_PUBLIC_SITE_URL` هو النطاق النهائي `https://...`.
4. انشر.
5. في Supabase حدّث عناوين الموقع ومسار `/auth/callback` إلى نطاق Vercel أو نطاقك.
6. أضف ويبهوك Stripe إلى `https://your-domain.com/api/billing/webhook`.

## ربط نطاق Namecheap لاحقاً

1. في Vercel: **Project → Settings → Domains** → أضف النطاق، مثلاً `kadr.example.com` أو النطاق الجذر.
2. انسخ السجلات التي يعرضها Vercel. الأرقام أدناه هي الشكل الشائع وقد تتغير، فاعتمد ما يظهر في لوحة Vercel:
   - سجل `A` للاسم `@` يشير إلى `76.76.21.21`
   - سجل `CNAME` للاسم `www` يشير إلى `cname.vercel-dns.com`
3. في Namecheap: **Domain List → Manage → Advanced DNS**. احذف السجلات المتعارضة (مثل إعادة توجيه النطاق أو سجل `A` قديم لـ `@`).
4. أضف السجلات واحفظ. انتظر الانتشار (غالباً أقل من ساعة، وقد يطول).
5. بعد أن تظهر علامة التحقق في Vercel، تُصدر الشهادة وحدها.
6. حدّث `NEXT_PUBLIC_SITE_URL` وأعد النشر، ثم حدّث عناوين Supabase وStripe والويبهوك إلى النطاق الجديد.

## Netlify

يمكن نشر المشروع نفسه: اربط المستودع، أمر البناء `npm run build`، وأضف المتغيرات. الإضافة الرسمية لـ Next على Netlify مطلوبة حتى تعمل مسارات الخادم والويبهوك. Vercel هو المسار الأقصر لهذا التطبيق.

## هيكل الملفات

```text
app/                    الصفحات ومسارات API
components/             الواجهة
config/site.ts          الاسم، الألوان، السعر، العدّ، واتساب، النصوص
config/bots.ts          تعريف البوتات
data/works.ts           المعرض
prompts/                تعليمات النظام والمعرفة
lib/payments/           مزود الدفع (قابل للاستبدال)
lib/prompts.ts          تجميع التعليمات على الخادم
supabase/migrations/    مخطط Postgres و RLS
proxy.ts                حماية /dashboard و /account و /admin
```

---

# Kadr AI

An Arabic-first academy site for writing cinema and advertising prompts. A monthly membership unlocks three bots. Each bot returns a prompt ready to copy. None of them generate an image or a video.

Brand, colors, price, countdown, and WhatsApp number live in `config/site.ts`.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Preview without Supabase or OpenAI:

```bash
# in .env.local
NEXT_PUBLIC_DEMO_MODE=true
```

Preview mode stores chats in the browser and does not call the model. **Turn it off in production.**

```bash
npm run lint
npm run build
```

## Environment

See the table in the Arabic section. Every variable is listed in `.env.example`. `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` stay on the server.

## Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the project URL, the `anon` key, and the `service_role` key from **Project Settings → API**.
3. In the **SQL Editor**, run `supabase/migrations/20261114120000_init.sql`. It creates `profiles`, `subscriptions`, `chat_sessions`, `messages`, and `usage_monthly`, plus row level security so a student can read only their own rows. Billing writes and assistant messages go through the service role.
4. A trigger creates the profile and an inactive subscription when a user signs up.
5. Under **Authentication → URL Configuration**, set the site URL and add `https://your-domain.com/auth/callback`.
6. Email and password work out of the box. Enable **Google** under Providers if you want it, and allow the same callback URL in Google Cloud.

## Stripe

1. Create a **monthly recurring** price and copy its id to `STRIPE_PRICE_ID`.
2. Set `STRIPE_SECRET_KEY`.
3. Point a webhook at `/api/billing/webhook`. Locally:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

4. Handled events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
5. Turn on the Customer Portal so “Manage billing” can cancel renewal.

Bots answer only when `subscriptions.status` is `active` and the period has not ended. The server returns 402 otherwise.

## If Stripe is not available

Stripe is not offered to every business in Palestine. Payment calls go through `PaymentProvider` in `lib/payments/types.ts`. The Stripe implementation is `lib/payments/stripe.ts`, chosen from `lib/payments/index.ts`.

To use **Lemon Squeezy** or **Paddle**, add a sibling file that implements the same three methods (`createCheckout`, `createPortal`, `handleWebhook`) and return it from `getPaymentProvider()`. Map the provider’s event into `SubscriptionUpdate` and `applySubscriptionUpdate` will write Postgres.

Until that exists, students can pay via the WhatsApp number in `config/site.ts` and an admin activates them by hand.

## Manual activation

Set `ADMIN_EMAILS` to a comma-separated list. Sign in with one of those emails and open `/admin`. Activate writes `provider = manual` and leaves the period end empty, so the membership stays on until an admin turns it off.

## Bots and prompts

Defined in `config/bots.ts`. Live: `scenes`, `video`, `posters`. `sfx` and `ads` are listed and marked soon. Set `enabled: true` to open them. No page changes.

Each bot has `prompts/<name>.md` and `prompts/<name>.knowledge.md`. HTML comments are stripped before the model sees the file. Replace the draft with your custom GPT instructions. Knowledge is appended under the instructions.

The browser never sends a system prompt. The route loads the files, trims session history to `HISTORY_TOKEN_BUDGET`, and streams the completion. User messages count toward `MONTHLY_MESSAGE_QUOTA` and `RATE_LIMIT_PER_MINUTE`.

### Add a bot later

1. Add an entry to `config/bots.ts`.
2. Add the two markdown files under `prompts/`.
3. Set `enabled: true`.

## Gallery

Edit `data/works.ts`. Current items are abstract placeholders. Set `youtubeId` to show a player. Categories filter the grid.

## Deploy on Vercel

1. Import the repository at [vercel.com/new](https://vercel.com/new). Framework preset: Next.js. Build command: `npm run build`.
2. Add every variable from `.env.example`. `NEXT_PUBLIC_DEMO_MODE` must be `false`. `NEXT_PUBLIC_SITE_URL` must be the public `https` origin.
3. Deploy.
4. Update Supabase auth URLs and the Stripe webhook to the deployed origin.

## Namecheap domain later

1. In Vercel, open **Project → Settings → Domains** and add the domain.
2. Copy the records Vercel shows. The usual pair (confirm it in the dashboard, the IP can change):
   - `A` record, host `@`, value `76.76.21.21`
   - `CNAME` record, host `www`, value `cname.vercel-dns.com`
3. In Namecheap, open **Domain List → Manage → Advanced DNS**. Remove conflicting `@` records and parking redirects.
4. Save, wait for DNS, then Vercel issues the certificate.
5. Set `NEXT_PUBLIC_SITE_URL` to the new origin, redeploy, and update Supabase, Stripe, and the webhook.

## Netlify

The same repo can be deployed there with `npm run build` and the same environment variables. Use Netlify’s Next.js runtime so route handlers and the webhook stay on a server. Vercel is the shorter path for this app.

## Layout

```text
app/                    pages and route handlers
components/             UI
config/site.ts          name, palette, price, countdown, WhatsApp, copy
config/bots.ts          bot registry
data/works.ts           gallery
prompts/                system instructions and knowledge
lib/payments/           swappable payment provider
lib/prompts.ts          server-side prompt assembly
supabase/migrations/    Postgres schema and RLS
proxy.ts                guards /dashboard, /account, /admin
```
