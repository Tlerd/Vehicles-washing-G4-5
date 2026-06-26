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
  { id: 'hatchback', name: 'Hatchback', description: 'Xe cỡ nhỏ', icon: '🚗', multiplier: 0.9 },
  { id: 'sedan', name: 'Sedan', description: 'Xe sedan tiêu chuẩn', icon: '🚙', multiplier: 1.0 },
  { id: 'suv', name: 'SUV', description: 'Xe thể thao đa dụng', icon: '🚐', multiplier: 1.2 },
  { id: 'pickup', name: 'Bán tải', description: 'Xe tải thùng', icon: '🛻', multiplier: 1.4 },
];

export const SERVICES: ServiceItem[] = [
  { id: 's1', name: 'Combo Rửa Xe Cơ Bản', description: 'Rửa ngoài + hút bụi nội thất + lau taplo + xịt thơm', basePrice: 150000, duration: 30, category: 'combo', icon: '💧', includes: ['Rửa ngoài', 'Hút bụi nội thất', 'Lau taplo', 'Xịt thơm'], suitableFor: 'Xe di chuyển hàng ngày trong thành phố', benefits: ['Sạch sẽ nhanh chóng', 'Khử mùi cơ bản'] },
  { id: 's2', name: 'Combo Rửa Xe Cao Cấp', description: 'Rửa tay toàn bộ bên ngoài + vệ sinh sâu nội thất + đánh bóng lốp + phủ sáp', basePrice: 280000, duration: 60, category: 'combo', icon: '✨', includes: ['Rửa tay toàn bộ bên ngoài', 'Vệ sinh sâu nội thất', 'Đánh bóng lốp', 'Phủ sáp'], suitableFor: 'Xe đi công tác xa, đi tỉnh về', benefits: ['Bảo vệ sơn', 'Nội thất sạch sâu'] },
  { id: 's3', name: 'Combo Chăm Sóc Toàn Diện', description: 'Tẩy đất sét + phục hồi sơn + phủ ceramic + dưỡng da + rửa khoang máy', basePrice: 650000, duration: 120, category: 'combo', icon: '💎', includes: ['Tẩy đất sét', 'Phục hồi sơn', 'Phủ ceramic', 'Dưỡng da', 'Rửa khoang máy'], suitableFor: 'Xe cần tân trang định kỳ (6 tháng - 1 năm)', benefits: ['Bảo vệ toàn diện', 'Tăng tuổi thọ xe'] },
  { id: 'premium', name: 'RỬA XE PREMIUM', description: 'Gói rửa xe đẳng cấp nhất với các sản phẩm cao cấp.', basePrice: 950000, duration: 150, category: 'combo', icon: '👑', isPremium: true, includes: ['Rửa xe ngoại thất cao cấp', 'Vệ sinh nội thất sâu', 'Vệ sinh khoang máy', 'Phủ wax bảo vệ sơn', 'Dưỡng lốp + detailing'], suitableFor: 'Khách hàng VIP, xe siêu sang', benefits: ['Sử dụng dung dịch cao cấp', 'Kỹ thuật viên chuyên nghiệp nhất', 'Phục hồi độ bóng tối đa'] },
  { id: 's4', name: 'Rửa Ngoài', description: 'Xịt rửa áp lực cao + tắm bọt tuyết + lau khô', basePrice: 80000, duration: 20, category: 'single', icon: '🚿', includes: ['Xịt rửa áp lực cao', 'Tắm bọt tuyết', 'Lau khô'], suitableFor: 'Bụi bẩn nhẹ', benefits: ['Sạch bùn đất'] },
  { id: 's5', name: 'Hút Bụi Nội Thất', description: 'Hút bụi toàn bộ ghế, thảm sàn và cốp xe', basePrice: 60000, duration: 15, category: 'single', icon: '🧹', includes: ['Hút bụi ghế', 'Hút bụi thảm sàn', 'Hút bụi cốp xe'], suitableFor: 'Nội thất bụi bẩn', benefits: ['Không gian thoáng mát'] },
  { id: 's6', name: 'Phủ Sáp & Đánh Bóng', description: 'Phủ sáp thủ công + đánh bóng bằng máy giữ độ bóng lâu dài', basePrice: 200000, duration: 45, category: 'single', icon: '🪄', includes: ['Phủ sáp thủ công', 'Đánh bóng bằng máy'], suitableFor: 'Xe bị mờ sơn', benefits: ['Giữ độ bóng lâu dài'] },
  { id: 's7', name: 'Vệ Sinh Mâm & Lốp', description: 'Làm sạch sâu lốp + đánh bóng mâm + dưỡng lốp', basePrice: 70000, duration: 15, category: 'single', icon: '⭕', includes: ['Làm sạch sâu lốp', 'Đánh bóng mâm', 'Dưỡng lốp'], suitableFor: 'Xe dính nhiều sình lầy ở bánh', benefits: ['Lốp đen bóng', 'Mâm sạch bong'] },
  { id: 's8', name: 'Chăm Sóc Ghế Da', description: 'Làm sạch ghế da + dưỡng ẩm + bảo vệ tia UV', basePrice: 180000, duration: 40, category: 'single', icon: '🛋️', includes: ['Làm sạch ghế da', 'Dưỡng ẩm', 'Bảo vệ tia UV'], suitableFor: 'Ghế da lâu ngày không bảo dưỡng', benefits: ['Chống nứt nẻ', 'Da mềm mại hơn'] },
  { id: 's9', name: 'Khử Mùi', description: 'Xử lý ozone + làm sạch bằng hơi nước diệt mùi tận gốc', basePrice: 120000, duration: 30, category: 'single', icon: '🌿', includes: ['Xử lý ozone', 'Làm sạch bằng hơi nước'], suitableFor: 'Xe có mùi hôi, mùi thức ăn', benefits: ['Diệt khuẩn', 'Không khí trong lành'] },
  { id: 's10', name: 'Phục Hồi Đèn Pha', description: 'Chà nhám, đánh bóng và phủ UV bảo vệ đèn pha bị mờ', basePrice: 250000, duration: 40, category: 'single', icon: '💡', includes: ['Chà nhám', 'Đánh bóng', 'Phủ UV'], suitableFor: 'Đèn pha ố vàng, mờ sương', benefits: ['Cải thiện tầm nhìn', 'Đèn sáng như mới'] },
];

export const BRANCHES: Branch[] = [
  { id: 'D1', name: 'AutoWash Pro - Quận 1', address: '123 Lê Lợi, Quận 1, TP.HCM', phone: '028-1234-5678', openTime: '07:00', closeTime: '20:00' },
  { id: 'D7', name: 'AutoWash Pro - Quận 7', address: '456 Nguyễn Hữu Thọ, Quận 7, TP.HCM', phone: '028-8765-4321', openTime: '07:00', closeTime: '20:00' },
];

export const MOCK_PROMOTIONS: Promotion[] = [
  { id: 'promo1', title: 'Siêu Sale Mùa Hè', description: 'Giảm 20% cho tất cả Combo Rửa Xe Cao Cấp trong mùa hè này!', discount: 'GIẢM 20%', validUntil: '2026-08-31', bgGradient: 'linear-gradient(135deg, #0ea5e9, #6366f1)', icon: '☀️' },
  { id: 'promo2', title: 'Giới Thiệu Bạn Bè', description: 'Giới thiệu bạn bè và cả hai đều nhận được 500 điểm thưởng!', discount: '500 ĐIỂM', validUntil: '2026-12-31', bgGradient: 'linear-gradient(135deg, #10b981, #06b6d4)', icon: '🎁' },
  { id: 'promo3', title: 'Ưu Đãi Cuối Tuần', description: 'Đặt lịch vào Thứ 7 và nhận miễn phí dịch vụ Vệ Sinh Mâm & Lốp', discount: 'TẶNG DỊCH VỤ', validUntil: '2026-09-30', bgGradient: 'linear-gradient(135deg, #f59e0b, #ef4444)', icon: '🏆' },
];

export const TIME_SLOTS_START = '07:00';
export const TIME_SLOTS_END = '20:00';
export const SLOT_INTERVAL_MINUTES = 30;
