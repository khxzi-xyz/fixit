/**
 * Seeds the 100-job FixIt One catalog (jobs.txt) into the categories table.
 * Run:  node scripts/seed-catalog.mjs
 * Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from the root .env.
 * Idempotent: upserts on category_id (SVC_001..SVC_100).
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const env = Object.fromEntries(
  readFileSync(join(root, '.env'), 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const URL = env.SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// [title, priceFloor, mediaRule, credential]
const A = [
  ['Residential Plumber', 10, 'REQUIRED', 'Plumbing Trade Certificate'], ['Emergency Split AC Tech', 15, 'OPTIONAL', 'HVAC Technician License'],
  ['Domestic Electrician', 8, 'REQUIRED', 'Electrical Safety Board Certification'], ['Mobile Auto Mechanic', 20, 'NONE', 'Certified Auto Mechanic Diploma'],
  ['Home Appliance Repairman', 12, 'REQUIRED', 'Appliance Specialist Training Badge'], ['Commercial Chiller Repair', 50, 'REQUIRED', 'Industrial HVAC Engineer Credentials'],
  ['Custom Carpentry Repair', 15, 'REQUIRED', 'Verified Woodworking Shop Profile'], ['Masonry & Wall Plastering', 25, 'REQUIRED', 'Structural Trade Working Permit'],
  ['Tile & Marble Installer', 30, 'REQUIRED', 'Tiling Contractor Registration'], ['Aluminum & Glass Fitter', 18, 'REQUIRED', 'Fabrication Workshop License'],
  ['Locksmith & Safe Technician', 10, 'REQUIRED', 'Security Background Clearance Certificate'], ['Smart CCTV Installer', 25, 'OPTIONAL', 'IT & Security Systems Operator Permit'],
  ['Auto Electrician (Mobile)', 15, 'OPTIONAL', 'Automotive Electronics Trade Certificate'], ['Roof Waterproofing', 60, 'REQUIRED', 'Building Maintenance Contracting Permit'],
  ['Water Heater Technician', 12, 'REQUIRED', 'Plumber & Gas Systems Safety License'], ['Smart Home Automator', 40, 'NONE', 'Advanced Systems Integrator Badge'],
  ['Generator Repair Specialist', 45, 'REQUIRED', 'Heavy Machinery Electrical Engineering Degree'], ['Septic Tank Field Cleaner', 35, 'NONE', 'Environmental Waste Disposal Permit'],
  ['Central Gas Line Repair', 50, 'REQUIRED', 'High-Risk Gas Systems Safety Certification'], ['Marine Outboard Mechanic', 55, 'REQUIRED', 'Marine Engineering Trade Certificate'],
  ['Heavy Forklift Mechanic', 65, 'REQUIRED', 'Hydraulic System Specialist Endorsement'], ['Gym Equipment Repairman', 20, 'REQUIRED', 'Fitness Hardware Service License'],
  ['Solar Inverter Tech', 40, 'REQUIRED', 'Renewable Energy Systems Engineering Code'], ['Water Pump Installer', 15, 'REQUIRED', 'Water Systems Infrastructure Certificate'],
  ['Network Router & Fiber Fix', 10, 'REQUIRED', 'Telecom Fiber Splicing Specialist Pass'], ['Wall Painter & Touch-Up', 20, 'REQUIRED', 'Interior Finishing Workshop Registration'],
  ['Wallpaper Installer', 15, 'REQUIRED', 'Professional Decorator Affiliation'], ['Sofa Framing Repair', 20, 'REQUIRED', 'Furniture Manufacturing Trade Permit'],
  ['Garage Door Motor Fix', 25, 'REQUIRED', 'Automated Gate Mechanics License'], ['Hydraulic Elevator Mechanic', 100, 'REQUIRED', 'National Safety Board Elevator Engineer Permit'],
  ['Welding & Gate Fabricator', 30, 'REQUIRED', 'Certified Arc/MIG Structural Welder Stamp'], ['Electronic Circuit Repair', 12, 'REQUIRED', 'Micro-Electronics Repair Certification'],
  ['Water Tank Crack Patching', 25, 'REQUIRED', 'Confined Space Entry Safety Pass'], ['Intercom System Repair', 15, 'NONE', 'Low Voltage Electronics Systems Permit'],
  ['Pool Filtration Mechanic', 40, 'REQUIRED', 'Aquatic Engineering Infrastructure License'],
];
const B = [
  ['Local City Taxi', 2, 'NONE', 'National Public Transport Driving Permit'], ['Full Flat Furniture Mover', 40, 'OPTIONAL', 'Commercial Logistics & Hauling Permit'],
  ['Emergency Tow Truck', 15, 'OPTIONAL', 'Heavy Recovery Transport Vehicle Clearance'], ['Freshwater Tanker Hauler', 10, 'NONE', 'Water Utility Carrier Operator Permit'],
  ['Domestic Gas Tank Route', 1.5, 'NONE', 'Hazmat Gas Logistics Safety License'], ['Airport Terminal Courier', 12, 'NONE', 'Registered Commercial Chauffeur Badge'],
  ['Flatbed Material Transport', 35, 'OPTIONAL', 'Heavy Freight Transport Authority Token'], ['Luxury Chauffeur Ride', 25, 'NONE', 'VIP Transport Service Background Pass'],
  ['Express Document Courier', 3, 'NONE', 'Bonded Logistics Personnel Certification'], ['Cold-Chain Food Transport', 30, 'NONE', 'Municipal Health Food Carrier Permit'],
  ['Livestock Transport Hauler', 45, 'NONE', 'Agricultural Livestock Carrier License'], ['Scrapyard Bulk Mover', 50, 'OPTIONAL', 'Industrial Waste Carrier Endorsement'],
  ['Construction Sand Tipper', 25, 'NONE', 'Dump Truck Operator Heavy License'], ['Motorcycle Delivery Run', 1, 'NONE', 'Registered Courier Motorbike Operation Permit'],
  ['Inter-City Commute Shuttle', 8, 'NONE', 'Multi-Passenger Fleet Authority Pass'], ['Low-Clearance Garage Extractor', 25, 'OPTIONAL', 'Specialized Low-Clearance Towing Permit'],
  ['Waste Construction Skip Mover', 30, 'NONE', 'Municipal Waste Management Vendor Code'], ['Office Desk Bulk Mover', 60, 'OPTIONAL', 'Corporate Moving Logistics Framework Code'],
  ['Boat Trailer Transport', 40, 'OPTIONAL', 'Marine Craft Road Transport Permit'], ['Chemical Drum Logistical Run', 100, 'NONE', 'Hazardous Chemicals Transport Safety Pass'],
  ['Heavy Equipment Lowbed Run', 120, 'OPTIONAL', 'Oversized Load Transport Authority Waiver'], ['Bulk Diesel Fuel Tanker', 70, 'NONE', 'National Fuel & Energy Distribution Code'],
  ['Glass Sheet Safe Transport', 35, 'OPTIONAL', 'Fragile Cargo Handling Logistics Stamp'], ['Event Staging Freight Haul', 50, 'NONE', 'Entertainment Logistics Transport Clearance'],
  ['Medical Sample Courier', 15, 'NONE', 'Clinical Specimen Transport Certification'], ['Industrial Cable Drum Mover', 40, 'OPTIONAL', 'Heavy Machinery Logistics Permit'],
  ['Sewage Extraction Tanker', 20, 'NONE', 'Environmental Water Sanitation Transport Code'], ['Villa Greenhouse Soil Hauler', 20, 'NONE', 'Landscaping Logistics Supply Permit'],
  ['Fine Art Insured Courier', 80, 'OPTIONAL', 'High-Value Secure Transit Background Pass'], ['Home Delivery Pallet Loader', 30, 'NONE', 'Commercial Warehousing Transport Code'],
];
const C = [
  ['Residential House Maid', 5, 'NONE', 'Registered Domestic Services Agency Code'], ['Mobile On-Demand Barber', 3, 'NONE', 'Professional Styling & Sanitation Cert'],
  ['Eco Car Washer (At-Home)', 2, 'NONE', 'Eco-Friendly Mobile Detailing Permit'], ['K-12 Curriculum Tutor', 7, 'NONE', 'Verified Education Degree / Teaching Pass'],
  ['Event Videographer', 40, 'NONE', 'Digital Media Business Portfolio Check'], ['Mobile Dog Groomer', 12, 'NONE', 'Certified Veterinary Pet Groomer Certificate'],
  ['Home Sofa Steam Cleaner', 15, 'OPTIONAL', 'Industrial Deep Cleaning Operations Ticket'], ['Lawn Mowing & Trimming', 10, 'OPTIONAL', 'Landscaping Maintenance Shop Registration'],
  ['Carpet Stain Extractor', 8, 'OPTIONAL', 'Fabric Restoration Technical Training Badge'], ['On-Demand Private Chef', 30, 'NONE', 'Hospitality Culinary Health Safety Pass'],
  ['Corporate Event Waitstaff', 15, 'NONE', 'Hospitality Operations Personnel Ledger'], ['Document Translator', 5, 'NONE', 'Certified Legal Translation Sworn Stamp'],
  ['Commercial Inventory Counter', 25, 'NONE', 'Certified Financial Inventory Auditor Pass'], ['Mystery Consumer Auditor', 10, 'NONE', 'Platform Verified Auditor Verification'],
  ['Professional Home Organizer', 20, 'OPTIONAL', 'Certified Interior Space Organizer Badge'], ['Post-Construction Cleaner', 50, 'OPTIONAL', 'Commercial Sanitation Facility Operations Permit'],
  ['Swimming Pool Lifeguard', 15, 'NONE', 'National Red Cross Lifeguard Safety Pass'], ['Mobile Tailor & Alteration', 4, 'NONE', 'Fashion Design & Tailoring Shop License'],
  ['Language Conversation Coach', 6, 'NONE', 'Native Speaker Verification Profile'], ['Musical Instrument Tutor', 10, 'NONE', 'Music Conservatory Technical Diploma'],
  ['At-Home Massage Therapist', 15, 'NONE', 'Certified Medical Massage Therapist License'], ['Event Sound Mixer Operator', 35, 'NONE', 'Live Sound Audio Engineering Credentials'],
  ['Kitchen Exhaust Degreaser', 45, 'OPTIONAL', 'Fire Hazard Commercial Kitchen Cleaning Pass'], ['Villa Window Glass Polisher', 20, 'NONE', 'High-Altitude Safety Line Working Permit'],
  ['Mattress Sanitizer Run', 7, 'NONE', 'Allergen Control Deep Cleaning Specialist'], ['Pet Sitter & Cat Walker', 5, 'NONE', 'Animal Behavior Safety Clearance Cert'],
  ['On-Site Baby Sitter', 8, 'NONE', 'Childcare & First Aid Safety Certification'], ['Drone Surveyor Operator', 75, 'NONE', 'Civil Aviation Commercial Drone Pilot License'],
  ['Car Window Tint Installer', 12, 'NONE', 'Auto Customization Detailing Permit'], ['Office Document Shredder', 15, 'NONE', 'Secure Corporate Destruction Compliance Stamp'],
  ['Home Party Setup Decorator', 30, 'OPTIONAL', 'Event Management Agency Registration'], ['Piano Tuning Technician', 25, 'NONE', 'Acoustic Instrument Guild Tuning Certificate'],
  ['Mobile Phone Screen Fixer', 10, 'REQUIRED', 'Mobile Electronics Repair Technician Pass'], ['PC Builder & OS Setup', 15, 'NONE', 'IT Hardware Architecture Specialist Badge'],
  ['Villa Fumigation Spray', 25, 'NONE', 'Municipal Chemical Pesticide Operator Permit'],
  ['Hire a Guy (General Labor)', 1, 'NONE', 'None'],
];

const rows = [];
let n = 0;
const push = (list, fw, icon) => list.forEach(([title, floor, media, cred]) => {
  n += 1;
  rows.push({
    category_id: `SVC_${String(n).padStart(3, '0')}`,
    display_name: title,
    icon_key: icon,
    sort_order: 100 + n,
    is_active: true,
    framework_type: fw,
    custom_fields: { priceFloor: floor, mediaRule: media, requiredCredential: cred },
  });
});
push(A, 'A_REPAIR', 'wrench');
push(B, 'B_TRANSIT', 'truck');
push(C, 'C_INSTANT', 'sparkles');

const res = await fetch(`${URL}/rest/v1/categories?on_conflict=category_id`, {
  method: 'POST',
  headers: {
    apikey: KEY, Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal',
  },
  body: JSON.stringify(rows),
});
console.log(`Seed ${rows.length} categories → HTTP ${res.status}`);
if (!res.ok) console.error(await res.text());
else console.log('✓ Catalog seeded (SVC_001..SVC_100).');
