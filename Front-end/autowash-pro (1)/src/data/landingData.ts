export const NAV_LINKS = [
  { name: 'Benefits', href: '#benefits' },
  { name: 'Packages', href: '#packages' },
  { name: 'Process', href: '#process' },
  { name: 'Locations', href: '#locations' },
  { name: 'Reviews', href: '#reviews' },
];

export const BENEFITS = [
  {
    id: 1,
    title: 'Real-time availability',
    description: 'See available time slots and reserve your wash without calling the branch.',
    icon: 'calendar',
  },
  {
    id: 2,
    title: 'Transparent pricing',
    description: 'Know exactly what each package includes before confirming your booking.',
    icon: 'dollar',
  },
  {
    id: 3,
    title: 'Fast turnaround',
    description: 'Standardized workflows help keep your waiting time predictable.',
    icon: 'clock',
  },
  {
    id: 4,
    title: 'Loyalty rewards',
    description: 'Earn points from every completed wash and unlock future benefits.',
    icon: 'award',
  },
];

export const PACKAGES = [
  {
    id: 'essential',
    name: 'Essential Wash',
    price: 120000,
    duration: '15–20 min',
    features: [
      'Exterior foam wash',
      'High-pressure rinse',
      'Wheel cleaning',
      'Microfiber drying',
    ],
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium Wash',
    price: 280000,
    duration: '25–35 min',
    features: [
      'Everything in Essential',
      'Interior vacuum',
      'Dashboard cleaning',
      'Tire shine',
      'Protective wax finish',
    ],
    popular: true,
  },
  {
    id: 'signature',
    name: 'Signature Detail',
    price: 520000,
    duration: '45–60 min',
    features: [
      'Deep interior cleaning',
      'Premium exterior wash',
      'Paint protection',
      'Leather conditioning',
      'Final quality inspection',
    ],
    popular: false,
  },
];

export const PROCESS_STEPS = [
  { step: '01', title: 'Choose a branch' },
  { step: '02', title: 'Select a package' },
  { step: '03', title: 'Pick a time slot' },
  { step: '04', title: 'Confirm your booking' },
];

export const LOCATIONS = [
  {
    id: 'thu-duc',
    name: 'Thu Duc Branch',
    address: '503 Le Van Viet, Thu Duc City, Ho Chi Minh City',
    hours: '07:00–21:00',
    services: 3,
  },
  {
    id: 'district-7',
    name: 'District 7 Branch',
    address: 'Nguyen Thi Thap Street, District 7, Ho Chi Minh City',
    hours: '07:00–21:00',
    services: 3,
  },
];

export const REVIEWS = [
  {
    id: 1,
    quote: '“The booking process was quick, and my car was ready exactly when promised.”',
    name: 'Minh Tran',
    service: 'Premium Wash',
    initials: 'MT',
  },
  {
    id: 2,
    quote: '“Clear pricing, friendly staff, and no waiting around. I will definitely return.”',
    name: 'Linh Nguyen',
    service: 'Essential Wash',
    initials: 'LN',
  },
  {
    id: 3,
    quote: '“The finish looked excellent, especially the interior. Very professional service.”',
    name: 'Hoang Pham',
    service: 'Signature Detail',
    initials: 'HP',
  },
];

export const FAQS = [
  {
    question: 'How long does a car wash take?',
    answer: 'It depends on the package you choose. Our Essential Wash takes about 15-20 minutes, while the Signature Detail can take up to 60 minutes.',
  },
  {
    question: 'Can I reschedule my booking?',
    answer: 'Yes, you can easily reschedule or cancel your booking through the confirmation email up to 2 hours before your reserved time slot.',
  },
  {
    question: 'Do you accept SUVs and seven-seat vehicles?',
    answer: 'Yes! We accommodate all standard passenger vehicles, including SUVs and 7-seaters. A small surcharge may apply for oversized vehicles, which is shown during booking.',
  },
  {
    question: 'What happens if I arrive late?',
    answer: 'We hold your reservation for 15 minutes past your booked time. After that, we may need to accommodate you as a walk-in customer depending on availability.',
  },
  {
    question: 'Can I pay at the branch?',
    answer: 'Absolutely. We accept cash, credit cards, and local mobile payment options directly at all our branches upon completion of the service.',
  },
];
