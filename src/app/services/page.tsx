'use client';

import React from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';

export default function Services() {
  const services = [
    {
      title: "Banner Printing",
      description: "High-quality vinyl banners, flex printing, and outdoor signage",
      features: ["Weather resistant", "HD printing", "Custom sizes", "Fast delivery"],
      price: "Starting ₹500"
    },
    {
      title: "Brand Design",
      description: "Logo design, brand identity, and marketing materials",
      features: ["Custom logos", "Brand guidelines", "Business cards", "Brochures"],
      price: "Starting ₹2000"
    },
    {
      title: "Installation Service",
      description: "Professional on-site installation and setup",
      features: ["Expert team", "All locations", "Safety assured", "Quick setup"],
      price: "Starting ₹1000"
    },
    {
      title: "Complete Package",
      description: "End-to-end branding solution for your business",
      features: ["Design + Print + Install", "Project management", "Quality guarantee", "Support"],
      price: "Starting ₹5000"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <section className="relative py-32 bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-8">
            Our <span className="text-yellow-500">Services</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto">
            Complete branding solutions from design to installation
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
                <h3 className="text-2xl font-bold text-yellow-500 mb-4">{service.title}</h3>
                <p className="text-gray-600 mb-6">{service.description}</p>
                <div className="space-y-3 mb-6">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-yellow-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-yellow-500">{service.price}</span>
                  <a href="/#contact" className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 transition-all">
                    Get Quote <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black mb-6">Need Custom Solution?</h2>
          <p className="text-xl text-gray-600 mb-8">
            We create tailored branding packages for your specific needs.
          </p>
          <a href="/#contact" className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 rounded-full text-xl font-bold transition-all">
            Discuss Your Project
          </a>
        </div>
      </section>
    </div>
  );
}