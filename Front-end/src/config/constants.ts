import { ServiceItem, Branch, Promotion, LoyaltyTierDef } from '../types';
export const LOYALTY_TIERS: LoyaltyTierDef[] = [
  { name: 'Member', multiplier: 1.0, bookingAdvanceLimit: 7, requiredPoints: 0 },
  { name: 'Silver', multiplier: 1.1, bookingAdvanceLimit: 10, requiredPoints: 1000 },
  { name: 'Gold', multiplier: 1.2, bookingAdvanceLimit: 12, requiredPoints: 3000 },
  { name: 'Platinum', multiplier: 1.3, bookingAdvanceLimit: 14, requiredPoints: 7000 },
];

export const CAR_MULTIPLIERS: Record<string, number> = {
  hatchback: 0.9,
  sedan: 1.0,
  suv: 1.2,
  pickup: 1.4,
};

export const CAR_TYPES = [
  { id: 'hatchback', name: 'Hatchback', description: 'Compact cars', icon: '🚗', multiplier: 0.9 },
  { id: 'sedan', name: 'Sedan', description: 'Standard sedans', icon: '🚙', multiplier: 1.0 },
  { id: 'suv', name: 'SUV', description: 'Sport utility vehicles', icon: '🚐', multiplier: 1.2 },
  { id: 'pickup', name: 'Pickup', description: 'Pickup trucks', icon: '🛻', multiplier: 1.4 },
];

export const SERVICES: ServiceItem[] = [
  // Wash & Combo
  {
    id: 'wc1', name: 'VW Basic Wash', description: 'Basic exterior and interior cleaning package.', basePrice: 170000, duration: 20, category: 'combo', group: 'Wash & Combo', icon: '💧',
    includes: ['Exterior wash', 'Undercarriage wash', 'Interior vacuum', 'Interior wipe down']
  },
  {
    id: 'wc2', name: 'VW Detail Wash', description: 'Detail Wash is a more thorough wash than Basic Wash, suitable for vehicles needing deeper cleaning for exterior, undercarriage, and basic interior.', basePrice: 270000, duration: 20, category: 'combo', group: 'Wash & Combo', icon: '✨',
    includes: ['Exterior wash', 'Undercarriage wash', 'Interior vacuum', 'Interior wipe down', 'Inner rim cleaning', 'Interior crevice cleaning', 'Exterior plastic/trim dressing with premium Boronax VRP', 'Interior door seal dressing with premium Boronax VRP'],
    suitableFor: 'Daily driven cars, light to medium dirt, wanting a cleaner wash than standard but not yet needing deep interior detailing.'
  },
  {
    id: 'wc3', name: 'VW Ultimate Wash', description: 'Comprehensive wash and care package, combining exterior, undercarriage, basic interior cleaning, odor removal, and paint gloss enhancement.', basePrice: 590000, duration: 40, category: 'combo', group: 'Wash & Combo', icon: '💎', isPremium: true,
    includes: ['Exterior wash', 'Undercarriage wash', 'Interior vacuum', 'Interior wipe down', 'Inner rim cleaning', 'Interior crevice cleaning', 'Exterior plastic/trim dressing with premium Boronax VRP', 'Interior door seal dressing with premium Boronax VRP', 'Odor removal using C-AirFog technology', 'Premium Carnauba wax'],
    suitableFor: 'Cars with slight odors, after rain, long trips, unmaintained for a long time, or customers wanting the most premium wash experience.'
  },
  { id: 'wc4', name: 'Exterior Wash', description: 'Basic exterior wash only', basePrice: 80000, duration: 20, category: 'single', group: 'Wash & Combo', icon: '🚿' },
  { id: 'wc5', name: 'Undercarriage Wash', description: 'Basic undercarriage wash only', basePrice: 40000, duration: 20, category: 'single', group: 'Wash & Combo', icon: '⚙️' },

  // Interior Cleaning
  {
    id: 'ic1', name: 'Super Clean Interior Detailing', description: 'Deep interior cleaning package focusing on dirt, bad odors, and frequently touched areas.', basePrice: 1200000, duration: 120, category: 'combo', group: 'Interior Cleaning', icon: '🧹',
    includes: ['Leather or felt seat washing', 'Ceiling cleaning', 'Dashboard cleaning', 'Door panel cleaning', 'Interior crevice and door cleaning', 'AC vent cleaning', 'Ozone odor removal', 'Leather and plastic detailing'],
    suitableFor: 'Dusty interior, light odors, dirty seats from daily use, family cars, service cars, or cars unmaintained for a long time.'
  },
  {
    id: 'ic2', name: 'Ultimate Clean Interior Detailing', description: 'Premium interior cleaning package, thoroughly cleaning many areas and removing seats for deeper processing.', basePrice: 1700000, duration: 180, category: 'combo', group: 'Interior Cleaning', icon: '🧼',
    includes: ['Seat removal', 'Leather or felt seat washing', 'Ceiling and floor cleaning', 'Dashboard cleaning', 'Interior crevice and door cleaning', 'AC vent cleaning', 'Ozone odor removal', 'Leather and plastic detailing'],
    suitableFor: 'Heavily dirty interior, accumulated odors, long-term use, family cars with small children, or before selling/transferring.'
  },
  {
    id: 'ic3', name: 'Ultimate Clean Plus Interior Detailing', description: 'Upgraded version of Ultimate Clean, for the most intensive interior cleaning. Adds floor removal, floor washing, and floor odor removal.', basePrice: 2100000, duration: 240, category: 'combo', group: 'Interior Cleaning', icon: '👑', isPremium: true,
    includes: ['Seat and floor removal', 'Leather or felt seat washing', 'Ceiling cleaning', 'Dashboard cleaning', 'Interior crevice and door cleaning', 'AC vent cleaning', 'Ozone odor removal', 'Leather and plastic detailing', 'Floor washing and odor removal'],
    suitableFor: 'Severe odors, wet floors, spilled food/drinks, slightly flooded cars, newly bought used cars.'
  },
  { id: 'ic4', name: 'Interior Seat Spot Cleaning (1 seat)', description: 'Spot cleaning for a single seat', basePrice: 350000, duration: 30, category: 'single', group: 'Interior Cleaning', icon: '💺' },
  { id: 'ic5', name: 'Endoscopic AC / Evaporator Cleaning', description: 'Deep cleaning for single AC system', basePrice: 1200000, duration: 60, category: 'single', group: 'Interior Cleaning', icon: '❄️' },
  { id: 'ic6', name: 'Endoscopic Dual AC Cleaning', description: 'Deep cleaning for dual AC systems', basePrice: 1700000, duration: 90, category: 'single', group: 'Interior Cleaning', icon: '❄️' },
  { id: 'ic7', name: 'Odor Removal (C-Air Fog)', description: 'Odor removal using C-Air Fog technology', basePrice: 300000, duration: 30, category: 'single', group: 'Interior Cleaning', icon: '💨' },
  { id: 'ic8', name: 'Ozone Odor Removal', description: 'Odor removal using Ozone generator', basePrice: 200000, duration: 30, category: 'single', group: 'Interior Cleaning', icon: '🌬️' },

  // Exterior Cleaning
  { id: 'ec1', name: 'Engine Bay Detailing', description: 'Deep cleaning of the engine bay', basePrice: 700000, duration: 60, category: 'single', group: 'Exterior Cleaning', icon: '🔧' },
  { id: 'ec2', name: 'Tar Removal', description: 'Removal of tar spots from paint', basePrice: 350000, duration: 45, category: 'single', group: 'Exterior Cleaning', icon: '⚫' },
  { id: 'ec3', name: 'Paint Overspray & Iron Fallout Removal', description: 'Removal of overspray and iron particles', basePrice: 600000, duration: 60, category: 'single', group: 'Exterior Cleaning', icon: '🧲' },
  { id: 'ec4', name: 'Glass Water Spot Removal', description: 'Removal of hard water spots on glass', basePrice: 600000, duration: 45, category: 'single', group: 'Exterior Cleaning', icon: '🪟' },
  { id: 'ec5', name: 'Undercarriage Rust/Dirt Removal', description: 'Deep cleaning and rust removal for undercarriage', basePrice: 800000, duration: 60, category: 'single', group: 'Exterior Cleaning', icon: '🚙' },
  { id: 'ec6', name: 'Chrome Water Spot Removal', description: 'Restoration of chrome trims', basePrice: 200000, duration: 30, category: 'single', group: 'Exterior Cleaning', icon: '✨' },
  { id: 'ec7', name: 'Tree Sap Removal', description: 'Removal of tree sap from paint', basePrice: 200000, duration: 30, category: 'single', group: 'Exterior Cleaning', icon: '🌲' },
  { id: 'ec8', name: 'Inner and Outer Rim Detailing (4 wheels)', description: 'Deep cleaning of rims and tires', basePrice: 450000, duration: 45, category: 'single', group: 'Exterior Cleaning', icon: '⭕' },

  // Surface Correction
  {
    id: 'sc1', name: 'Basic Paint Polishing', description: 'Basic paint surface treatment to clean, improve gloss, and reduce light scratches.', basePrice: 1300000, duration: 180, category: 'combo', group: 'Surface Correction', icon: '🪄',
    includes: ['Car wash', 'Tar & glue removal', 'Clay bar treatment', '1-step polishing', '60-70% scratch removal'],
    suitableFor: 'Slightly dull paint, paint overspray, tar, light swirl marks, or increasing gloss before wax/coating.'
  },
  {
    id: 'sc2', name: 'Correction Paint Polishing', description: 'Intensive paint treatment to restore gloss, reduce swirls, deep scratches, and improve clarity.', basePrice: 2000000, duration: 240, category: 'combo', group: 'Surface Correction', icon: '🔥', isPremium: true,
    includes: ['Car wash', 'Tar & glue removal', 'Clay bar treatment', '3M standard 3-step polishing', '90-98% scratch removal'],
    suitableFor: 'Deep scratches, swirl marks, slight fading, loss of gloss, or restoring exterior before ceramic/wax coating.'
  },
  { id: 'sc3', name: 'Windshield / Rear Glass Polishing (1 panel)', description: 'Polishing for front or rear windshield', basePrice: 1700000, duration: 120, category: 'single', group: 'Surface Correction', icon: '🪟' },
  { id: 'sc4', name: 'Side Window Polishing (1 panel)', description: 'Polishing for a single side window', basePrice: 1100000, duration: 60, category: 'single', group: 'Surface Correction', icon: '🪟' },
  { id: 'sc5', name: 'Headlight Restoration Polishing (1 pair)', description: 'Restoration for oxidized headlights', basePrice: 800000, duration: 60, category: 'single', group: 'Surface Correction', icon: '💡' },
  { id: 'sc6', name: 'Car Paint Waxing', description: 'Premium wax application for gloss', basePrice: 500000, duration: 45, category: 'single', group: 'Surface Correction', icon: '✨' },

  // Protection
  { id: 'p1', name: 'Undercarriage Coating', description: 'Protective coating for undercarriage', basePrice: 3000000, duration: 180, category: 'single', group: 'Protection', icon: '🛡️' },
  { id: 'p2', name: 'Pro Coating (2-layer Ceramic)', description: '2-layer Ceramic coating for paint protection', basePrice: 7500000, duration: 360, category: 'single', group: 'Protection', icon: '💎', isPremium: true },
  { id: 'p3', name: 'Ultimate Coating (3-layer Ceramic)', description: '3-layer Ceramic coating for ultimate paint protection', basePrice: 8500000, duration: 480, category: 'single', group: 'Protection', icon: '👑', isPremium: true },
  { id: 'p4', name: 'Nano Glass Coating', description: 'Hydrophobic coating for all windows', basePrice: 1200000, duration: 60, category: 'single', group: 'Protection', icon: '🌧️' },
  { id: 'p5', name: 'PPF Dopon Save Protection 7.5 mil', description: 'Paint Protection Film (PPF) standard installation', basePrice: 20000000, duration: 1440, category: 'single', group: 'Protection', icon: '🛡️', isPremium: true },
  { id: 'p6', name: 'PPF Dopon Shining 7.5 mil', description: 'Premium glossy Paint Protection Film (PPF)', basePrice: 28000000, duration: 1440, category: 'single', group: 'Protection', icon: '✨', isPremium: true },
  { id: 'p7', name: 'PPF Tecwrap 6.5 mil', description: 'Tecwrap Paint Protection Film (PPF)', basePrice: 28000000, duration: 1440, category: 'single', group: 'Protection', icon: '🛡️', isPremium: true },
  { id: 'p8', name: 'PPF Tecwrap M75 7.5 mil', description: 'Tecwrap M75 premium Paint Protection Film (PPF)', basePrice: 40000000, duration: 1440, category: 'single', group: 'Protection', icon: '👑', isPremium: true },
  { id: 'p9', name: '3M Crystalline Window Tint', description: 'Premium 3M Crystalline window tinting for the whole car', basePrice: 13900000, duration: 240, category: 'single', group: 'Protection', icon: '🕶️', isPremium: true }
];

export const BRANCHES: Branch[] = [
  { id: 'D1', name: 'AutoWash Pro - District 1', address: '123 Le Loi Street, District 1, HCMC', phone: '028-1234-5678', openTime: '07:00', closeTime: '20:00', isAvailable: true },
  { id: 'D7', name: 'AutoWash Pro - District 7', address: '456 Nguyen Huu Tho, District 7, HCMC', phone: '028-8765-4321', openTime: '07:00', closeTime: '20:00', isAvailable: true },
];

export const MOCK_PROMOTIONS: Promotion[] = [
  { id: 'promo1', title: 'Summer Splash Sale', description: 'Get 20% off on all Premium Wash combos this summer!', discount: '20% OFF', validUntil: '2026-08-31', bgGradient: 'linear-gradient(135deg, #0ea5e9, #6366f1)', icon: '☀️' },
  { id: 'promo2', title: 'Refer & Earn', description: 'Refer a friend and both get 500 bonus points!', discount: '500 PTS', validUntil: '2026-12-31', bgGradient: 'linear-gradient(135deg, #10b981, #06b6d4)', icon: '🎁' },
  { id: 'promo3', title: 'Weekend Warriors', description: 'Book on Saturday and enjoy free Tire & Rim Clean service', discount: 'FREE ADD-ON', validUntil: '2026-09-30', bgGradient: 'linear-gradient(135deg, #f59e0b, #ef4444)', icon: '🏆' },
];

export const TIME_SLOTS_START = '07:00';
export const TIME_SLOTS_END = '20:00';
export const SLOT_INTERVAL_MINUTES = 30;
