// Mock Data store for standalone Netlify production preview
export const INITIAL_CATEGORIES = [
  { id: 1, name: "Electrical Services", slug: "electrical-services", icon: "Zap", description: "Fan, light, switchboard repairs, short circuit fixes and rewiring.", is_active: true, display_order: 1 },
  { id: 2, name: "Plumbing Services", slug: "plumbing-services", icon: "Droplets", description: "Tap leaks, pipe replacements, drain unclogging and sanitary fittings.", is_active: true, display_order: 2 },
  { id: 3, name: "AC Repair & Maintenance", slug: "ac-repair-maintenance", icon: "Wind", description: "AC jet pump servicing, gas charging, cooling issues and PCB diagnostics.", is_active: true, display_order: 3 },
  { id: 4, name: "Home Cleaning", slug: "home-cleaning", icon: "Sparkles", description: "Deep house cleaning, sofa/carpet shampooing and kitchen sanitization.", is_active: true, display_order: 4 },
  { id: 5, name: "Painting Services", slug: "painting-services", icon: "Paintbrush", description: "Interior/exterior wall painting, waterproof coating and texture designs.", is_active: true, display_order: 5 },
  { id: 6, name: "Carpentry Services", slug: "carpentry-services", icon: "Hammer", description: "Furniture assembly, door lock fixing, cabinet hinges and custom wood repairs.", is_active: true, display_order: 6 },
  { id: 7, name: "Appliance Repair", slug: "appliance-repair", icon: "Tv", description: "Washing machine, refrigerator, microwave and TV troubleshooting.", is_active: true, display_order: 7 },
  { id: 8, name: "Pest Control", slug: "pest-control", icon: "ShieldCheck", description: "Cockroach, bedbug, termite and mosquito herbal extermination.", is_active: true, display_order: 8 }
];

export const INITIAL_SERVICES = [
  {
    id: 1,
    category_id: 1,
    category_name: "Electrical Services",
    name: "Ceiling & Exhaust Fan Installation",
    description: "Installation or repair of high-speed ceiling fans and exhaust fans with regulator testing.",
    duration_minutes: 45,
    base_price: 299,
    image_url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
    is_active: true
  },
  {
    id: 2,
    category_id: 1,
    category_name: "Electrical Services",
    name: "Switchboard & MCB Fuse Replacement",
    description: "Repair of burnt switch sockets, MCB trip diagnostics and smart switch upgrades.",
    duration_minutes: 60,
    base_price: 449,
    image_url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80",
    is_active: true
  },
  {
    id: 3,
    category_id: 2,
    category_name: "Plumbing Services",
    name: "Tap & Flush Valve Leakage Repair",
    description: "Fixing dripping taps, sink mixer issues, angle valves and dual-flush tank repair.",
    duration_minutes: 40,
    base_price: 349,
    image_url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
    is_active: true
  },
  {
    id: 4,
    category_id: 2,
    category_name: "Plumbing Services",
    name: "Complete Drain Unclogging & Jet Clean",
    description: "Motorized drain snake and chemical flushing for blocked bathroom/kitchen sinks.",
    duration_minutes: 60,
    base_price: 599,
    image_url: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80",
    is_active: true
  },
  {
    id: 5,
    category_id: 3,
    category_name: "AC Repair & Maintenance",
    name: "AC Deep Jet Servicing (Indoor & Outdoor)",
    description: "High-pressure jet wash of cooling coils, filter sanitization and gas leak test.",
    duration_minutes: 75,
    base_price: 799,
    image_url: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80",
    is_active: true
  },
  {
    id: 6,
    category_id: 3,
    category_name: "AC Repair & Maintenance",
    name: "AC Gas Charging & Refrigerant Refill",
    description: "R32 / R410 refrigerant recharge with vacuuming and pressure gauge check.",
    duration_minutes: 90,
    base_price: 1499,
    image_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
    is_active: true
  },
  {
    id: 7,
    category_id: 4,
    category_name: "Home Cleaning",
    name: "2BHK / 3BHK Deep Home Cleaning",
    description: "Complete floor machine buffing, cobweb removal, kitchen de-greasing and bathroom scrub.",
    duration_minutes: 180,
    base_price: 2499,
    image_url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80",
    is_active: true
  },
  {
    id: 8,
    category_id: 4,
    category_name: "Home Cleaning",
    name: "5-Seater Sofa & Carpet Shampooing",
    description: "Dry-wet steam extraction to eliminate dust mites, stains and odors.",
    duration_minutes: 90,
    base_price: 899,
    image_url: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80",
    is_active: true
  },
  {
    id: 9,
    category_id: 5,
    category_name: "Painting Services",
    name: "Room Repainting & Touch-Up Service",
    description: "Waterproof primer, wall putty sanding, and 2 coats of premium emulsion paint.",
    duration_minutes: 240,
    base_price: 3499,
    image_url: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80",
    is_active: true
  },
  {
    id: 10,
    category_id: 6,
    category_name: "Carpentry Services",
    name: "Modular Furniture Assembly & Repair",
    description: "Precision assembly of IKEA/bed/wardrobes, hinge realignment and drawer slides.",
    duration_minutes: 90,
    base_price: 699,
    image_url: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80",
    is_active: true
  },
  {
    id: 11,
    category_id: 7,
    category_name: "Appliance Repair",
    name: "Washing Machine Drum & Motor Diagnostics",
    description: "Front-load & top-load spin errors, inlet valve repair and belt adjustments.",
    duration_minutes: 60,
    base_price: 499,
    image_url: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=600&q=80",
    is_active: true
  },
  {
    id: 12,
    category_id: 8,
    category_name: "Pest Control",
    name: "Eco Herbal Pest & Cockroach Shield",
    description: "Odorless herbal gel baiting and spray with 90-day pest recurrence warranty.",
    duration_minutes: 60,
    base_price: 1199,
    image_url: "https://images.unsplash.com/photo-1587582423116-ec07293f0395?auto=format&fit=crop&w=600&q=80",
    is_active: true
  }
];

export const INITIAL_ADDRESSES = [
  {
    id: 1,
    title: "Apartment / Home",
    street_address: "Flat 402, Sea Breeze Residency, Carter Road",
    city: "Mumbai",
    state: "Maharashtra",
    postal_code: "400050",
    landmark: "Near Joggers Park",
    is_default: true
  },
  {
    id: 2,
    title: "Office Studio",
    street_address: "Unit 12B, Apex Tech Park, Andheri East",
    city: "Mumbai",
    state: "Maharashtra",
    postal_code: "400069",
    landmark: "Opposite Metro Station",
    is_default: false
  }
];

export const INITIAL_BOOKINGS = [
  {
    id: 1,
    booking_code: "HS-2026-101",
    service_name: "AC Deep Jet Servicing (Indoor & Outdoor)",
    service_image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80",
    provider_name: "Apex Pro Home & Electricals",
    provider_phone: "9876543213",
    booking_date: "2026-11-02",
    time_slot: "10:00 AM - 12:00 PM",
    status: "COMPLETED",
    total_amount: 679.0,
    address: "Flat 402, Sea Breeze Residency, Mumbai",
    payment_status: "PAID",
    technician_name: "Vikram Singh",
    technician_phone: "9876543216",
    technician_status: "COMPLETED",
    has_review: true,
    has_invoice: true,
    invoice_number: "INV-2026-0001",
    special_instructions: "Please check cooling coils in master bedroom split AC."
  },
  {
    id: 2,
    booking_code: "HS-2026-102",
    service_name: "Switchboard & MCB Fuse Replacement",
    service_image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80",
    provider_name: "Apex Pro Home & Electricals",
    provider_phone: "9876543213",
    booking_date: "2026-11-04",
    time_slot: "02:00 PM - 04:00 PM",
    status: "IN_PROGRESS",
    total_amount: 454.0,
    address: "Flat 402, Sea Breeze Residency, Mumbai",
    payment_status: "PAID",
    technician_name: "Vikram Singh",
    technician_phone: "9876543216",
    technician_status: "ARRIVED",
    has_review: false,
    has_invoice: false,
    invoice_number: null,
    special_instructions: "Living room main switchboard sparks occasionally."
  },
  {
    id: 3,
    booking_code: "HS-2026-103",
    service_name: "Tap & Flush Valve Leakage Repair",
    service_image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
    provider_name: "AquaFlow Plumbing Masters",
    provider_phone: "9876543214",
    booking_date: "2026-11-05",
    time_slot: "11:00 AM - 01:00 PM",
    status: "CONFIRMED",
    total_amount: 349.0,
    address: "Unit 12B, Apex Tech Park, Mumbai",
    payment_status: "PAID",
    technician_name: "Amit Verma",
    technician_phone: "9876543217",
    technician_status: "ASSIGNED",
    has_review: false,
    has_invoice: false,
    invoice_number: null,
    special_instructions: "Office washroom flush tank leaking continuously."
  }
];
