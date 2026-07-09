import React from "react";
import {
  Zap, Wrench, Hammer, Snowflake, Paintbrush, Key, Bug, Sparkles, Trees,
  Settings, Car, Truck, Droplet, Disc, Smartphone, Laptop, Tv, Camera,
  Wifi, Package, Bike, GraduationCap, HeartPulse, Scissors, Shirt,
  PartyPopper, Utensils, Briefcase
} from "lucide-react";

interface ServiceIconProps {
  id: string;
  className?: string;
}

export const ServiceIcon: React.FC<ServiceIconProps> = ({ id, className = "w-6 h-6" }) => {
  switch (id) {
    case "ELECTRICIAN": return <img src="/icons/electrical.png" className={className.replace(/text-[a-z0-9\-]+/g, "").trim()} alt="Electrician" />;
    case "PLUMBER": return <Wrench className={`${className} text-primary`} />;
    case "CARPENTER": return <img src="/icons/carpentry.png" className={className.replace(/text-[a-z0-9\-]+/g, "").trim()} alt="Carpenter" />;
    case "AC_REPAIR": return <Snowflake className={`${className} text-cyan-400`} />;
    case "PAINTER": return <Paintbrush className={`${className} text-purple-500`} />;
    case "HANDYMAN": return <Wrench className={`${className} text-slate-400`} />;
    case "LOCKSMITH": return <Key className={`${className} text-yellow-500`} />;
    case "PEST_CONTROL": return <Bug className={`${className} text-emerald-600`} />;
    case "CLEANER": return <Sparkles className={`${className} text-sky-400 fill-sky-400/20`} />;
    case "GARDENER": return <Trees className={`${className} text-green-500`} />;
    case "MECHANIC": return <Settings className={`${className} text-red-500`} />;
    case "TAXI": return <Car className={`${className} text-yellow-500`} />;
    case "TOW_TRUCK": return <Truck className={`${className} text-indigo-500`} />;
    case "CAR_WASH": return <Droplet className={`${className} text-primary fill-blue-400/20`} />;
    case "TIRE_SERVICE": return <Disc className={`${className} text-stone-400`} />;
    case "PHONE_REPAIR": return <Smartphone className={`${className} text-pink-500`} />;
    case "LAPTOP_REPAIR": return <Laptop className={`${className} text-blue-600`} />;
    case "TV_REPAIR": return <Tv className={`${className} text-purple-600`} />;
    case "CCTV": return <Camera className={`${className} text-teal-500`} />;
    case "NETWORK": return <Wifi className={`${className} text-emerald-500`} />;
    case "MOVERS": return <Package className={`${className} text-orange-500`} />;
    case "DELIVERY": return <Bike className={`${className} text-amber-500`} />;
    case "TUTOR": return <GraduationCap className={`${className} text-blue-700`} />;
    case "PHYSIOTHERAPY": return <HeartPulse className={`${className} text-rose-500`} />;
    case "BARBER": return <Scissors className={`${className} text-cyan-600`} />;
    case "TAILORING": return <Shirt className={`${className} text-indigo-400`} />;
    case "PHOTOGRAPHY": return <Camera className={`${className} text-violet-500`} />;
    case "WEDDING_PLAN": return <PartyPopper className={`${className} text-pink-400`} />;
    case "COOK": return <Utensils className={`${className} text-red-400`} />;
    default: return <Briefcase className={`${className} text-primary`} />;
  }
};
