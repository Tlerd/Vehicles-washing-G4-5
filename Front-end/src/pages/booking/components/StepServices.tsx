import React, { useState } from 'react';
import { useBooking } from '../../../context/BookingContext';
import { ChevronDown, ChevronUp, Clock, CheckCircle2 } from 'lucide-react';

// Single Source of Truth VinaWash Menu
const vinawashMenu = {
  rua_xe_and_combo: {
    title: "Rửa xe & combo",
    items: [
      { id: "vw_basic", name: "VW Basic Wash", price: 180000, duration: "20 phút", detail: "Bao gồm rửa xe ngoài, rửa gầm, hút bụi và lau nội thất." },
      { id: "vw_detail", name: "VW Detail Wash", price: 280000, duration: "20 phút", detail: "Detail Wash là gói rửa xe kỹ hơn Basic Wash, phù hợp cho xe cần làm sạch sâu hơn ở cả ngoại thất, gầm xe và khu vực nội thất cơ bản. Bao gồm: Rửa xe ngoài, Rửa gầm, Hút bụi nội thất, Lau nội thất cơ bản, Vệ sinh mặt sau lazang, Vệ sinh khe kẽ nội thất, Dưỡng nhựa nhám/đen ngoại thất và dưỡng ron cửa nội thất bằng dung dịch Boronax VRP cao cấp." },
      { id: "vw_ultimate", name: "VW Ultimate Wash", price: 640000, duration: "40 phút", detail: "Ultimate Wash là gói rửa và chăm sóc xe toàn diện hơn, kết hợp làm sạch ngoại thất, gầm, nội thất cơ bản, khử mùi và tăng độ bóng bề mặt sơn. Bao gồm toàn bộ quy trình Detail Wash kết hợp khử mùi bằng công nghệ C-AirFog và Wax sáp bóng Carnauba cao cấp." },
      { id: "rua_ngoai", name: "Rửa xe ngoài", price: 90000, duration: "20 phút", detail: "Làm sạch ngoại thất cơ bản." },
      { id: "rua_gam", name: "Rửa gầm", price: 50000, duration: "20 phút", detail: "Xịt áp lực cao vệ sinh bùn đất khung gầm." }
    ]
  },
  ve_sinh_trong: {
    title: "Vệ sinh trong",
    items: [
      { id: "interior_super", name: "Vệ sinh nội thất Super Clean", price: 1400000, duration: "Linh hoạt", detail: "Gói dọn nội thất chuyên sâu cơ bản. Bao gồm: Giặt ghế da/nỉ, vệ sinh trần, vệ sinh mặt taplo, vệ sinh tapi cửa, vệ sinh khe kẽ nội thất/cửa, vệ sinh cửa gió máy lạnh, khử mùi bằng máy ozone, dưỡng ghế da và chi tiết nhựa." },
      { id: "interior_ultimate", name: "Vệ sinh nội thất Ultimate Clean", price: 1900000, duration: "Linh hoạt", detail: "Gói dọn nội thất cao cấp. Thực hiện tháo toàn bộ ghế xe để làm sạch sâu, giặt trần sàn, vệ sinh taplo, khe kẽ, khe điều hòa, khử mùi máy ozone và dưỡng chi tiết nhựa/da." },
      { id: "interior_plus", name: "Vệ sinh nội thất Ultimate Clean Plus", price: 2300000, duration: "Linh hoạt", detail: "Phiên bản nâng cấp tối đa. Tháo rời toàn bộ ghế và tháo toàn bộ thảm sàn xe để giặt sàn và khử mùi sàn chuyên biệt, xử lý triệt để xe bị ngập nước, ẩm mốc hoặc đổ thức ăn nước uống." },
      { id: "ghe_le", name: "Xử lý vị trí ngồi trên nội thất (1 vị trí)", price: 350000, duration: "Linh hoạt", detail: "Xử lý vết bẩn cục bộ trên từng vị trí ghế." },
      { id: "noi_soi_1", name: "Vệ sinh nội soi / dàn lạnh", price: 1200000, duration: "Linh hoạt", detail: "Làm sạch dàn lạnh bằng công nghệ nội soi camera." }
    ]
  },
  ve_sinh_ngoai: {
    title: "Vệ sinh ngoài",
    items: [
      { id: "khoang_may", name: "Vệ sinh khoang máy", price: 800000, duration: "Linh hoạt", detail: "Dọn dẹp bụi bẩn, dầu mỡ khoang động cơ bằng hơi nước nóng." },
      { id: "tay_nhua_duong", name: "Tẩy nhựa đường", price: 400000, duration: "Linh hoạt", detail: "Tẩy sạch các vết nhựa đường bám quanh sườn xe." }
    ]
  },
  xu_ly_be_mat: {
    title: "Xử lý bề mặt",
    items: [
      { id: "polish_basic", name: "Đánh bóng sơn xe Basic", price: 1500000, duration: "Linh hoạt", detail: "Đánh bóng hiệu năng 1 bước, clay bề mặt và tẩy keo nhựa đường. Xóa xước quầng xoáy nhẹ 60-70%." },
      { id: "polish_hieu_chinh", name: "Đánh bóng sơn xe hiệu chỉnh", price: 2200000, duration: "Linh hoạt", detail: "Hiệu chỉnh khuyết tật sơn chuyên sâu 3 bước tiêu chuẩn 3M. Xóa xước dăm và quầng xoáy nặng từ 90-98%." }
    ]
  },
  bao_ve: {
    title: "Bảo vệ",
    items: [
      { id: "ceramic_2", name: "Pro Coating (Ceramic 2 lớp)", price: 8500000, duration: "Linh hoạt", detail: "Phủ ceramic bảo vệ sơn độ bền cao." },
      { id: "ppf_dopon", name: "PPF Dopon Save Protection 7.5 mil", price: 21000000, duration: "7.5 mil", detail: "Dán phim bảo vệ chống trầy xước đá văng." },
      { id: "film_3m", name: "Phim cách nhiệt 3M Crystalline", price: 15600000, duration: "Linh hoạt", detail: "Dán phim cách nhiệt quang học cao cấp nhất của 3M." }
    ]
  }
};

export const StepServices: React.FC = () => {
  const { state, updateState, multiplier } = useBooking();
  const [openedCategories, setOpenedCategories] = useState<Record<string, boolean>>({ rua_xe_and_combo: true });
  const [openedDetails, setOpenedDetails] = useState<Record<string, boolean>>({});

  const toggleCategory = (catKey: string) => {
    setOpenedCategories(prev => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const toggleDetails = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenedDetails(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleServiceToggle = (itemId: string) => {
    updateState(prev => {
      const isSelected = prev.selectedServices.includes(itemId);
      const selectedServices = isSelected
        ? prev.selectedServices.filter(id => id !== itemId)
        : [...prev.selectedServices, itemId];
      return { selectedServices };
    });
  };

  // Calculate details for Cart
  const allItems = Object.values(vinawashMenu).flatMap(cat => cat.items);
  const selectedItemsDetails = allItems.filter(item => state.selectedServices.includes(item.id));
  const totalTime = selectedItemsDetails.reduce((sum, item) => {
    const minutes = parseInt(item.duration) || 0;
    return sum + minutes;
  }, 0);
  const totalPrice = selectedItemsDetails.reduce((sum, item) => sum + (item.price * multiplier), 0);

  return (
    <div className="flex flex-col md:flex-row gap-8 py-4">
      {/* Left: Service Selection Accordions */}
      <div className="flex-1 space-y-4">
        <h2 className="text-2xl font-bold mb-2">Select Care Services</h2>
        <p className="text-slate-555 mb-6">Service prices are automatically multiplier-adjusted based on selected Car Size.</p>

        {Object.entries(vinawashMenu).map(([catKey, cat]) => {
          const isCatOpen = !!openedCategories[catKey];
          return (
            <div key={catKey} className="glass-card overflow-hidden">
              {/* Accordion Header */}
              <div 
                onClick={() => toggleCategory(catKey)}
                className="flex justify-between items-center px-6 py-4 cursor-pointer bg-slate-100/30 dark:bg-slate-900/30 border-b border-slate-200/50 dark:border-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">{cat.title}</span>
                  <span className="text-xs bg-brand-orange/10 text-brand-orange border border-brand-orange/20 px-2 py-0.5 rounded-full font-semibold">
                    {cat.items.length} items
                  </span>
                </div>
                {isCatOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>

              {/* Accordion Body */}
              {isCatOpen && (
                <div className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                  {cat.items.map((item) => {
                    const isSelected = state.selectedServices.includes(item.id);
                    const isDetailOpen = !!openedDetails[item.id];
                    const adjustedPrice = item.price * multiplier;

                    return (
                      <div key={item.id} className="p-4 transition-colors hover:bg-slate-50/20 dark:hover:bg-slate-900/10">
                        <div className="flex justify-between items-center gap-4">
                          {/* Checkbox + Details label */}
                          <div className="flex items-start gap-3 cursor-pointer flex-1" onClick={() => handleServiceToggle(item.id)}>
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-5 h-5 rounded text-brand-orange focus:ring-brand-orange border-slate-300 dark:border-slate-800 accent-orange-500 mt-1 cursor-pointer"
                            />
                            <div>
                              <span className={`font-semibold text-base ${isSelected ? 'text-brand-orange' : ''}`}>{item.name}</span>
                              <div className="text-xs text-slate-400 dark:text-slate-500 flex gap-2 items-center mt-1">
                                <span>{item.duration}</span>
                                <span>•</span>
                                <span>{cat.title}</span>
                              </div>
                            </div>
                          </div>

                          {/* Price & Action */}
                          <div className="text-right flex items-center gap-3">
                            <span className="font-bold text-brand-orange">{adjustedPrice.toLocaleString('vi-VN')} VND</span>
                            <button 
                              onClick={(e) => toggleDetails(item.id, e)}
                              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-800 flex items-center gap-1"
                            >
                              {isDetailOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Details Panel */}
                        {isDetailOpen && (
                          <div className="mt-3 p-4 bg-amber-500/5 text-amber-950 dark:text-amber-100/90 text-sm border border-amber-500/10 rounded-xl leading-relaxed">
                            {item.detail}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right: Sticky Cart Sidebar */}
      <div className="w-full md:w-80 shrink-0">
        <div className="glass-card p-6 sticky top-24">
          <h3 className="font-bold text-lg border-b border-slate-200/50 dark:border-slate-800/50 pb-3 mb-4 flex items-center gap-2">
            <CheckCircle2 className="text-brand-orange w-5 h-5" /> Booking Summary
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Size multiplier:</span>
              <span className="font-semibold uppercase text-brand-orange">{state.vehicleSize} (x{multiplier})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Duration:</span>
              <span className="font-semibold flex items-center gap-1"><Clock className="w-4 h-4 text-slate-400" /> {totalTime} mins</span>
            </div>
            <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Selected Packages</span>
              {selectedItemsDetails.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No services selected yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                  {selectedItemsDetails.map(item => (
                    <span key={item.id} className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 py-1 px-2.5 rounded-full block border border-slate-200 dark:border-slate-700">
                      {item.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-3 mt-4 flex justify-between items-end">
              <span className="font-bold text-slate-500">Total Price:</span>
              <span className="font-extrabold text-xl text-brand-orange">{totalPrice.toLocaleString('vi-VN')} VND</span>
            </div>
          </div>

          <button 
            disabled={selectedItemsDetails.length === 0}
            onClick={() => updateState({ currentStep: 4 })}
            className="w-full btn-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Details
          </button>
          <button onClick={() => updateState({ currentStep: 2 })} className="w-full btn-secondary mt-2 text-sm py-2">
            Back to Date & Time
          </button>
        </div>
      </div>
    </div>
  );
};
