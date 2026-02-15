'use client';

import React from 'react';
import { CheckCircle, Users, Award, Clock } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative py-32 bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-8">
            About <span className="text-yellow-500">Our Story</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto">
            We transform businesses with professional branding solutions.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-black mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                To help businesses establish strong visual presence through quality printing, 
                creative design, and professional installation services.
              </p>
              <div className="space-y-4">
                {["Quality materials", "Creative design", "Professional installation", "Affordable pricing"].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-yellow-500" />
                    <span className="text-lg font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-yellow-100 p-8 rounded-2xl">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <Users className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                  <h3 className="text-3xl font-bold">500+</h3>
                  <p className="text-gray-600">Happy Clients</p>
                </div>
                <div>
                  <Award className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                  <h3 className="text-3xl font-bold">5+</h3>
                  <p className="text-gray-600">Years Experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black mb-6">Ready to Transform Your Business?</h2>
          <a href="/#contact" className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 rounded-full text-xl font-bold transition-all">
            Get Started Today
          </a>
        </div>
      </section>
    </div>
  );
}