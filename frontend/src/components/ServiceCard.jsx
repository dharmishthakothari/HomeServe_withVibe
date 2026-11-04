import React from 'react';
import { Clock, Star, Users, ArrowRight, Check } from 'lucide-react';

export default function ServiceCard({ service, onBook }) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col group border border-slate-800 hover:border-teal-500/40 transition-all duration-300">
      {/* Image Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-900">
        <img
          src={service.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'}
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

        {/* Category Badge */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-950/80 backdrop-blur-md text-teal-300 border border-teal-500/30">
          {service.category_name}
        </span>

        {/* Duration Badge */}
        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-700 flex items-center gap-1">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>{service.duration_minutes}m</span>
        </span>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="font-bold text-white text-base group-hover:text-teal-300 transition-colors line-clamp-1">
              {service.name}
            </h3>
          </div>

          <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mb-4">
            {service.description}
          </p>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Starts From</div>
            <div className="text-lg font-black text-white">
              ₹{service.base_price.toFixed(0)}
              <span className="text-xs text-slate-400 font-normal ml-1">all inclusive</span>
            </div>
          </div>

          <button
            onClick={() => onBook(service)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all transform active:scale-95"
          >
            <span>Book Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
