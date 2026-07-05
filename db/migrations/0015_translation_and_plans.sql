-- Migration 0015: Translation dictionary and updated plans
CREATE TABLE IF NOT EXISTS public.translation_dictionary (
    string_key TEXT PRIMARY KEY,
    text_en TEXT NOT NULL,
    text_ar TEXT NOT NULL,
    text_ur TEXT NOT NULL
);

-- Seed initial translations
INSERT INTO public.translation_dictionary (string_key, text_en, text_ar, text_ur) VALUES
('app.tagline', 'Hyper-local Khidmah', 'خدمة محلية فورية', 'مقامی خدمت'),
('onboarding.welcome', 'Welcome to FixIt Now', 'مرحباً بك في فيكس إت', 'فکس اِٹ میں خوش آمدید'),
('onboarding.chooseCountry', 'Choose your country', 'اختر بلدك', 'اپنا ملک منتخب کریں'),
('onboarding.chooseLanguage', 'Choose your language', 'اختر لغتك', 'اپنی زبان منتخب کریں'),
('onboarding.continue', 'Continue', 'متابعة', 'جاری رکھیں'),
('nav.home', 'Home', 'الرئيسية', 'ہوم'),
('nav.search', 'Search', 'بحث', 'تلاش'),
('nav.post', 'Post', 'نشر', 'پوسٹ'),
('nav.wallet', 'Wallet', 'المحفظة', 'والٹ'),
('nav.profile', 'Profile', 'حسابي', 'پروفائل')
ON CONFLICT (string_key) DO UPDATE
SET text_en = EXCLUDED.text_en,
    text_ar = EXCLUDED.text_ar,
    text_ur = EXCLUDED.text_ur;

-- Add weekly and lifetime plans to subscription_plans
INSERT INTO public.subscription_plans (plan_id, display_name, monthly_fee_omr, take_rate_pct, priority_placement, audience, perks) VALUES
('WEEKLY', 'Weekly extension', 1.000, 20.00, false, 'CONSUMER', '{"durationDays": 7, "interval": "WEEKLY", "name": "Weekly Extension"}'),
('LIFETIME', 'FixIt Now Lifetime Plus', 15.000, 5.00, true, 'CONSUMER', '{"durationDays": 36500, "interval": "ONCE", "name": "Lifetime Plus", "unlimited_ai": true, "golden_badge": true, "priority": "high", "support": "ultra", "warranty": "lifetime", "unlimited_images": true}')
ON CONFLICT (plan_id) DO UPDATE
SET monthly_fee_omr = EXCLUDED.monthly_fee_omr,
    display_name = EXCLUDED.display_name,
    audience = EXCLUDED.audience,
    perks = EXCLUDED.perks;

-- Add vendor_radius_preference to vendor_profiles if not exists
ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS radius_meters INTEGER NOT NULL DEFAULT 15000;

-- Ensure reviews unique key constraint on order_id (job_id in our reviews table is the unique link to orders)
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_job_id_key;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_job_id_key UNIQUE (job_id);

-- Add floor and building details to user_addresses
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS floor VARCHAR(40);
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS building VARCHAR(80);
-- 1. FLUSH AND RESET STATIC AUTO-INCREMENT (Optional for fresh seed)
-- ALTER SEQUENCE categories_category_id_seq RESTART WITH 1;

-- 2. INSERT BULK MULTI-LINGUAL CATEGORY TAXONOMY WITH ENGINE CONTROLS
INSERT INTO public.categories (category_id, name_en, name_ar, name_ur, framework, parent_id, ai_price_floor) VALUES

-- ============================================================================
-- 🔧 FRAMEWORK A: THE REPAIR, MAINTENANCE & TECHNICAL NETWORK
-- Enforces: Blind Labor Bidding, On-Site Multi-Receipt Logs, Custom Warranties
-- ============================================================================

-- Parent Hub: Home Trades
(100, 'Home Maintenance & Trades', 'صيانة المنازل والحرف', 'گھریلو دیکھ بھال اور دستکاری', 'REPAIR', NULL, 0.000),
(101, 'Residential Plumber', 'سباك منازل', 'گھریلو پلمبر', 'REPAIR', 100, 10.000),
(102, 'Emergency Split AC Tech', 'فني تكييف مركزي وسبليت', 'اے سی ٹیکنیشن', 'REPAIR', 100, 15.000),
(103, 'Domestic Electrician', 'كهربائي منازل', 'گھریلو الیکٹریشن', 'REPAIR', 100, 8.000),
(104, 'Custom Carpentry Repair', 'نجارة وإصلاح أثاث', 'فرنیچر بڑھئی', 'REPAIR', 100, 12.000),
(105, 'Masonry & Wall Plastering', 'بناء ولياسة جدران', 'راج مستری', 'REPAIR', 100, 20.000),
(106, 'Tile & Marble Installer', 'تركيب بلاط ورخام', 'ٹائل اور ماربل فٹر', 'REPAIR', 100, 25.000),
(107, 'Aluminum & Glass Fitter', 'تركيب ألمنيوم وزجاج', 'ایلومینیم اور شیشہ فٹر', 'REPAIR', 100, 15.000),
(108, 'Roof Waterproofing', 'عزل أسطح ومقاومة تسريب', 'چھت کی واٹر پروفنگ', 'REPAIR', 100, 45.000),
(109, 'Water Heater Technician', 'فني سخانات مياه', 'واٹر ہیٹر ٹیکنیشن', 'REPAIR', 100, 8.000),
(110, 'Wall Painter & Touch-Up', 'صباغة ودهان جدران', 'رنگ ساز', 'REPAIR', 100, 15.000),

-- Parent Hub: Vehicle & Machinery
(200, 'Vehicle & Machinery Mechanics', 'ميكانيكا المركبات والآلات', 'گاڑیوں اور مشینری کی مہم', 'REPAIR', NULL, 0.000),
(201, 'Mobile Auto Mechanic', 'ميكانيكي سيارات متنقل', 'موبائل آٹو مکینک', 'REPAIR', 200, 15.000),
(202, 'Auto Electrician', 'كهربائي سيارات', 'گاڑیوں کا الیکٹریشن', 'REPAIR', 200, 12.000),
(203, 'Mobile Tyre Vulcanizer', 'بناشر وإصلاح إطارات متنقل', 'ٹائر پنکچر شاپ', 'REPAIR', 200, 5.000),
(204, 'Marine Outboard Mechanic', 'ميكانيكي محركات بحرية', 'کشتی کے انجن کا مکینک', 'REPAIR', 200, 40.000),
(205, 'Heavy Forklift Mechanic', 'ميكانيكي رافعات شوكية وثقيلة', 'فورک لفٹ مکینک', 'REPAIR', 200, 50.000),
(206, 'Generator Repair Specialist', 'إصلاح مولدات كهربائية', 'جنریٹر مکینک', 'REPAIR', 200, 30.000),

-- Parent Hub: Advanced Systems & Electronics
(300, 'Specialty Equipment & IT', 'الأنظمة الذكية والإلكترونيات', 'خصوصی آلات اور آئی ٹی', 'REPAIR', NULL, 0.000),
(301, 'Home Appliance Repairman', 'إصلاح أجهزة منزلية', 'گھریلو سامان کا مکینک', 'REPAIR', 300, 10.000),
(302, 'Smart CCTV Installer', 'تركيب كاميرات مراقبة ذكية', 'سی سی ٹی وی کیمرہ فٹر', 'REPAIR', 300, 20.000),
(303, 'Network Router & Fiber Fix', 'إصلاح ألياف بصرية وشبكات', 'انٹرنیٹ راؤٹر فٹر', 'REPAIR', 300, 10.000),
(304, 'Mobile Phone Screen Fixer', 'إصلاح شاشات هواتف متنقل', 'موبائل اسکرین ریپیئر', 'REPAIR', 300, 5.000),
(305, 'PC Builder & Hardware Setup', 'تجميع الحواسب وأنظمة التشغيل', 'کمپیوٹر ہارڈ ویئر سیٹ اپ', 'REPAIR', 300, 12.000),
(306, 'Custom Bespoke Gig / Task', 'مهمة خاصة مخصصة', 'خصوصی کام یا گگ', 'REPAIR', 300, 5.000),


-- ============================================================================
-- 🚗 FRAMEWORK B: THE TRANSIT, LOGISTICS & MOVEMENT NETWORK
-- Enforces: Dual GPS Match Payouts, Destination Parameters, 0 Parts, 0 Warranty
-- ============================================================================

-- Parent Hub: Human Mobility
(400, 'Human Transit & Commute', 'نقل الركاب والتنقل', 'انسانی نقل و حمل', 'TRANSIT', NULL, 0.000),
(401, 'Local City Taxi', 'تاكسي أجرة محلية', 'لوکل سٹی ٹیکسی', 'TRANSIT', 400, 2.000),
(402, 'City to City Traveling', 'نقل بين المدن ومشاركة سيارات', 'شہر سے شہر سفر', 'TRANSIT', 400, 10.000),
(403, 'Airport Terminal Transfer', 'توصيل إلى مطار', 'ایئرپورٹ ٹیکسی', 'TRANSIT', 400, 12.000),
(404, 'Emergency Hospital Run', 'توصيل اضطراري للمستشفى', 'ہسپتال کی ایمرجنسی سواری', 'TRANSIT', 400, 5.000),

-- Parent Hub: Logistics & Heavy Cargo
(500, 'Logistics, Hauling & Delivery', 'الخدمات اللوجستية والشحن', 'سامان کی نقل و حمل', 'TRANSIT', NULL, 0.000),
(501, 'Personal Delivery Rider', 'مندوب توصيل شخصي سريع', 'ڈیلیوری رائڈر', 'TRANSIT', 500, 1.500),
(502, 'Full Flat Furniture Mover', 'نقل أثاث شقق وفلل كامل', 'گھر کا سامان منتقل کرنا', 'TRANSIT', 500, 35.000),
(503, 'Emergency Tow Truck Recovery', 'سطحة سحب مركبات متعطلة', 'ٹو ٹرک ریکوری', 'TRANSIT', 500, 15.000),
(504, 'Freshwater Tanker Hauler', 'ناقلة مياه عذبة', 'پانی کا ٹینکر', 'TRANSIT', 500, 10.000),
(505, 'Domestic Gas Tank Route', 'توصيل اسطوانات غاز للمنازل', 'گیس سلنڈر ڈیلیوری', 'TRANSIT', 500, 1.000),
(506, 'Flatbed Material Transport', 'نقل مواد بناء ثقيلة سطحية', 'تعمیراتی سامان کی ترسیل', 'TRANSIT', 500, 30.000),
(507, 'Sewage Extraction Tanker', 'سحب مياه مجاري وصرف صحي', 'سیوریج ٹینکر', 'TRANSIT', 500, 15.000),


-- ============================================================================
-- 🧼 FRAMEWORK C: THE INSTANT TASK & ROUTINE ROUTINE NETWORK
-- Enforces: Before/After Photo Matches, Instant Wallet Payouts, 0 Parts, 0 Warranty
-- ============================================================================

-- Parent Hub: Cleaning & Hospitality
(600, 'Cleaning & Cleaning Maintenance', 'خدمات التنظيف والضيافة', 'صفائی اور دیکھ بھال', 'INSTANT', NULL, 0.000),
(601, 'Residential House Maid', 'عاملة تنظيف منازل بالساعة', 'گھریلو کام والی مائی', 'INSTANT', 600, 4.000),
(602, 'Eco Car Washer (At-Home)', 'غسيل سيارات متنقل أمام المنزل', 'گاڑی دھونے والا', 'INSTANT', 600, 2.000),
(603, 'Home Sofa Steam Cleaner', 'تنظيف وغسيل كنب بالبخار', 'صوفہ کی سٹیم صفائی', 'INSTANT', 600, 12.000),
(604, 'Post-Construction Villa Cleaner', 'تنظيف فلل بعد الإنشاء وإزالة الغبار', 'تعمیر کے بعد صفائی', 'INSTANT', 600, 40.000),
(605, 'Kitchen Exhaust Degreaser', 'تنظيف وإزالة دهون مداخن المطابخ', 'کچن چمنی کی صفائی', 'INSTANT', 600, 30.000),

-- Parent Hub: Personal Care & Lifestyle
(700, 'Lifestyle & Academic Tasks', 'العناية الشخصية والخدمات التعليمية', 'ذاتی نگہداشت اور تعلیم', 'INSTANT', NULL, 0.000),
(701, 'Mobile On-Demand Barber', 'حلاق رجالي متنقل للمنازل', 'گھر پر بال کاٹنے والا حجام', 'INSTANT', 700, 3.000),
(702, 'K-12 Curriculum Tutor', 'مدرس خصوصي لمناهج المدارس', 'ٹیوٹر یا ہوم ٹیشن', 'INSTANT', 700, 6.000),
(703, 'Mobile Dog & Pet Groomer', 'حلاقة ورعاية أليفة متنقلة', 'پالتو جانوروں کا گرومر', 'INSTANT', 700, 10.000),
(704, 'Event Videographer & Photo', 'تصوير ومونتاج حفلات ومناسبات', 'ویڈیو گرافر اور فوٹو گرافر', 'INSTANT', 700, 35.000),
(705, 'Document Translator (Legal)', 'ترجمة معتمدة للمستندات والوثائق', 'دستاویزات کا مترجم', 'INSTANT', 700, 4.000)

ON CONFLICT (category_id) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_ar = EXCLUDED.name_ar,
    name_ur = EXCLUDED.name_ur,
    framework = EXCLUDED.framework,
    parent_id = EXCLUDED.parent_id,
    ai_price_floor = EXCLUDED.ai_price_floor;
