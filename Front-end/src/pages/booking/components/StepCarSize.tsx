import React from 'react';
import { useBooking, VehicleSize } from '../../../context/BookingContext';
import { Car, Truck, Check } from 'lucide-react';

export const StepCarSize: React.FC = () => {
  const { state, updateState } = useBooking();

  const options: { id: VehicleSize; title: string; multiplier: number; sizeDesc: string; examples: string; icon: any }[] = [
    {
      id: 'hatchback',
      title: 'Hatchback',
      multiplier: 0.9,
      sizeDesc: 'Small',
      examples: 'Kia Morning, Hyundai i10, VinFast VF5, Mazda 2 Hatchback',
      icon: Car,
    },
    {
      id: 'sedan',
      title: 'Sedan',
      multiplier: 1.0,
      sizeDesc: 'Medium',
      examples: 'Toyota Vios, Honda City, Mazda 3, Toyota Camry, Mercedes C/E Class',
      icon: Car,
    },
    {
      id: 'suv',
      title: 'SUV / Crossover',
      multiplier: 1.2,
      sizeDesc: 'Large',
      examples: 'Mazda CX-5, Honda CR-V, Hyundai SantaFe, Toyota Fortuner',
      icon: Car,
    },
    {
      id: 'pickup',
      title: 'Pickup Truck',
      multiplier: 1.4,
      sizeDesc: 'Extra Large',
      examples: 'Ford Ranger, Toyota Hilux, Mitsubishi Triton, RAM 1500',
      icon: Truck,
    },
  ];

  const handleSelect = (size: VehicleSize) => {
    updateState({
      vehicleSize: size,
      currentStep: 2, // Proceed to step 2: Select Branch
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Select Your Vehicle Size
        </h2>
        <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
          Please select your vehicle type. Service prices are adjusted dynamically based on your vehicle size category.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = state.vehicleSize === option.id;

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`text-left relative rounded-2xl p-6 transition-all duration-300 border backdrop-blur-md flex gap-5 ${
                isSelected
                  ? 'bg-blue-600/25 border-blue-500 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-850/50'
              }`}
            >
              <div className={`p-4 rounded-xl shrink-0 flex items-center justify-center ${
                isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {option.id === 'hatchback' ? (
                  <Icon className="w-8 h-8 scale-90" />
                ) : option.id === 'sedan' ? (
                  <Icon className="w-8 h-8" />
                ) : option.id === 'suv' ? (
                  <Icon className="w-9 h-9" />
                ) : (
                  <Icon className="w-8 h-8" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-xl font-bold text-white">{option.title}</h3>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {option.sizeDesc} ({option.multiplier}x)
                  </span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed mt-2">
                  <span className="font-semibold block text-slate-300 mb-0.5">Suitable for:</span>
                  {option.examples}
                </p>
              </div>

              {isSelected && (
                <div className="absolute top-4 right-4 bg-blue-500 text-white rounded-full p-1 border border-blue-400">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
