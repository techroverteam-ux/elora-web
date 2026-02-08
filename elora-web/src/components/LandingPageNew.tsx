'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowRight, CheckCircle, MapPin, Phone, Mail, MessageCircle, Sun, Moon } from 'lucide-react';

const LandingPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-black text-white' 
        : 'bg-white text-gray-900'
    }`}>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full backdrop-blur-sm z-50 border-b transition-colors duration-300 ${
        darkMode 
          ? 'bg-black/90 border-purple-900/30' 
          : 'bg-white/90 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={180}
                height={90}
                className=""
              />
            </div>
            <div className="hidden md:flex space-x-8 items-center">
              <a href="#services" className="hover:text-yellow-500 transition-colors">Services</a>
              <a href="#process" className="hover:text-yellow-500 transition-colors">Process</a>
              <a href="#gallery" className="hover:text-yellow-500 transition-colors">Gallery</a>
              <a href="#contact" className="hover:text-yellow-500 transition-colors">Contact</a>
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-full transition-colors ${
                  darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <a href="#contact" className="hidden sm:block bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-full font-semibold transition-all hover:shadow-lg text-sm">
                Get Quote
              </a>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg"
              >
                <div className="w-6 h-6 flex flex-col justify-center items-center">
                  <span className={`block w-5 h-0.5 bg-current transition-all ${
                    mobileMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'
                  }`}></span>
                  <span className={`block w-5 h-0.5 bg-current transition-all ${
                    mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}></span>
                  <span className={`block w-5 h-0.5 bg-current transition-all ${
                    mobileMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'
                  }`}></span>
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className={`px-4 py-4 border-t ${
            darkMode ? 'border-purple-900/30 bg-black/95' : 'border-gray-200 bg-white/95'
          }`}>
            <div className="flex flex-col space-y-4">
              <a 
                href="#services" 
                className="hover:text-yellow-500 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Services
              </a>
              <a 
                href="#process" 
                className="hover:text-yellow-500 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Process
              </a>
              <a 
                href="#gallery" 
                className="hover:text-yellow-500 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Gallery
              </a>
              <a 
                href="#contact" 
                className="hover:text-yellow-500 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </a>
              <div className="flex items-center justify-between pt-2">
                <a 
                  href="#contact" 
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2.5 rounded-full font-semibold transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Quote
                </a>
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-full transition-colors ${
                    darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className={`absolute inset-0 z-10 ${
          darkMode 
            ? 'bg-gradient-to-br from-purple-900/50 to-black/80' 
            : 'bg-gradient-to-br from-orange-100/80 to-white/90'
        }`}></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center"></div>
        
        <div className="relative z-20 text-center max-w-6xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-8 leading-tight">
            WE DON'T JUST PRINT.
            <span className="block text-yellow-500">WE INSTALL YOUR BRAND</span>
            <span className="block">INTO THE REAL WORLD.</span>
          </h1>
          
          <p className={`text-lg sm:text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            We help businesses stand out with custom branding, 
            high-quality banner printing, and professional on-site installation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <a href="#contact" className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg lg:text-xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
              Get My Shop Branded
              <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#gallery" className={`border-2 px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg lg:text-xl font-bold transition-all hover:shadow-lg text-center ${
              darkMode 
                ? 'border-white hover:bg-white hover:text-black' 
                : 'border-gray-900 hover:bg-gray-900 hover:text-white'
            }`}>
              View Our Work
            </a>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section id="services" className={`py-20 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gradient-to-b from-black to-purple-900/20' 
          : 'bg-gradient-to-b from-gray-50 to-orange-50/20'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-8 leading-tight">
              From Design to Installation —
              <span className="block text-yellow-500">We Handle Everything</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Custom Brand Banner Printing",
                description: "High-resolution printing on durable materials."
              },
              {
                title: "Creative Branding Design",
                description: "We turn your logo and message into eye-catching visuals."
              },
              {
                title: "On-Site Store Visit",
                description: "Our team visits your shop or stall location."
              },
              {
                title: "Professional Banner Installation",
                description: "We securely install branding that lasts in all weather."
              }
            ].map((service, index) => (
              <div key={index} className={`p-8 rounded-2xl border transition-all transform hover:scale-105 hover:border-yellow-500/50 ${
                darkMode 
                  ? 'bg-purple-900/30 border-purple-700/50' 
                  : 'bg-white border-gray-200 shadow-lg'
              }`}>
                <h3 className="text-lg sm:text-xl font-bold mb-3 text-yellow-500">{service.title}</h3>
                <p className={`text-sm sm:text-base leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className={`py-20 transition-colors duration-300 ${
        darkMode ? 'bg-black' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-8 leading-tight">
              How We Bring Your
              <span className="block text-yellow-500">Brand to Life</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Share Your Brand Idea",
                description: "Tell us your business name, colors, and message."
              },
              {
                step: "02",
                title: "We Design & Print",
                description: "Our team prepares bold, high-impact banners."
              },
              {
                step: "03",
                title: "We Visit Your Location",
                description: "We travel to your store, stall, or event space."
              },
              {
                step: "04",
                title: "We Install Your Branding",
                description: "Your shop transforms into a powerful branded presence."
              }
            ].map((process, index) => (
              <div key={index} className="text-center relative">
                <div className="bg-yellow-500 text-black text-2xl font-black w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  {process.step}
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-3">{process.title}</h3>
                <p className={`text-sm sm:text-base leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{process.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className={`py-20 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gradient-to-b from-purple-900/20 to-black' 
          : 'bg-gradient-to-b from-orange-50/20 to-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Real Work,
              <span className="block text-yellow-500">Real Stores</span>
            </h2>
            <p className={`text-lg sm:text-xl font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>See How We Transform Shops</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="group relative overflow-hidden rounded-2xl aspect-square">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                <img 
                  src={`https://images.unsplash.com/photo-${1541888946425 + item}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`}
                  alt={`Project ${item}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute bottom-4 left-4 z-20">
                  <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                    Before & After
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className={`py-20 transition-colors duration-300 ${
        darkMode ? 'bg-black' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-8 leading-tight">
              Why Choose
              <span className="block text-yellow-500">Us</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              "High-quality durable materials",
              "Weather-resistant printing",
              "Fast turnaround time",
              "On-site installation experts",
              "Affordable packages for small & large businesses",
              "Professional design consultation"
            ].map((benefit, index) => (
              <div key={index} className={`flex items-center gap-4 p-6 rounded-xl border transition-colors ${
                darkMode 
                  ? 'bg-purple-900/30 border-purple-700/50' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <CheckCircle className="w-8 h-8 text-yellow-500 flex-shrink-0" />
                <span className="text-base sm:text-lg font-semibold">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Service Section */}
      <section className={`py-20 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gradient-to-b from-purple-900/20 to-black' 
          : 'bg-gradient-to-b from-orange-50/20 to-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-8 leading-tight">
            We Come to Your Store —
            <span className="block text-yellow-500">Anywhere You Need Us</span>
          </h2>
          
          <p className={`text-lg sm:text-xl max-w-3xl mx-auto mb-12 leading-relaxed font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Whether your shop is in a busy market, mall, roadside stall, or commercial complex — 
            our team travels to your location for professional installation.
          </p>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <MapPin className="w-16 h-16 text-yellow-500" />
            </div>
            <div className={`rounded-2xl overflow-hidden border ${
              darkMode ? 'border-purple-700/50' : 'border-gray-200'
            }`}>
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.123456789!2d77.1234567!3d28.1234567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDA3JzI0LjQiTiA3N8KwMDcnMjQuNCJF!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin"
                width="100%" 
                height="300" 
                style={{border:0}} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Service Areas Map"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className={`absolute inset-0 z-10 ${
          darkMode 
            ? 'bg-gradient-to-br from-orange-500/20 to-purple-900/50' 
            : 'bg-gradient-to-br from-orange-200/60 to-purple-200/40'
        }`}></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center"></div>
        
        <div className="relative z-20 text-center max-w-6xl mx-auto px-4">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-12 leading-tight">
            READY TO TURN YOUR SHOP
            <span className="block text-yellow-500">INTO A BRAND?</span>
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <a href="#contact" className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-full text-lg sm:text-xl lg:text-2xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
              Book Branding Service
              <ArrowRight className="w-6 h-6" />
            </a>
            <a href="#contact" className={`border-2 px-8 sm:px-10 py-4 sm:py-5 rounded-full text-lg sm:text-xl lg:text-2xl font-bold transition-all hover:shadow-lg text-center ${
              darkMode 
                ? 'border-white hover:bg-white hover:text-black' 
                : 'border-gray-900 hover:bg-gray-900 hover:text-white'
            }`}>
              Talk to Our Team
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className={`border-t py-16 transition-colors duration-300 ${
        darkMode 
          ? 'bg-black border-purple-900/30' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
              Get Your <span className="text-yellow-500">Free Quote</span>
            </h2>
            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Ready to transform your business? Contact us today!
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            {/* Contact Form */}
            <div className={`p-8 rounded-2xl border ${
              darkMode 
                ? 'bg-purple-900/30 border-purple-700/50' 
                : 'bg-white border-gray-200 shadow-lg'
            }`}>
              <h3 className="text-2xl font-bold text-yellow-500 mb-6">Send Message</h3>
              <form className="space-y-4">
                <div>
                  <input 
                    type="text" 
                    placeholder="Your Name" 
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <input 
                    type="email" 
                    placeholder="Your Email" 
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <input 
                    type="tel" 
                    placeholder="Your Phone" 
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <select className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}>
                    <option>Select Service</option>
                    <option>Banner Printing</option>
                    <option>Brand Design</option>
                    <option>Installation Service</option>
                    <option>Complete Package</option>
                  </select>
                </div>
                <div>
                  <textarea 
                    rows={4} 
                    placeholder="Tell us about your project..." 
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg"
                >
                  Send Message
                </button>
              </form>
            </div>
            
            {/* Contact Info */}
            <div>
              <h3 className="text-2xl font-bold text-yellow-500 mb-6">Contact Info</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-yellow-500 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Call Us</h4>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>+91 98765 43210</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Mon-Sat 9AM-7PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MessageCircle className="w-6 h-6 text-yellow-500 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">WhatsApp</h4>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>+91 98765 43210</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Quick Response</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-yellow-500 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Email</h4>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>info@eloracraftingarts.com</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>24/7 Support</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-yellow-500 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Service Areas</h4>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Pan India Coverage</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>We come to your location</p>
                  </div>
                </div>
              </div>
              
              {/* Quick Action Buttons */}
              <div className="mt-8 space-y-3">
                <a 
                  href="tel:+919876543210" 
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center justify-center gap-3"
                >
                  <Phone className="w-5 h-5" />
                  Call Now
                </a>
                <a 
                  href="https://wa.me/919876543210" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center justify-center gap-3"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
          
          {/* Bottom Footer */}
          <div className="grid md:grid-cols-3 gap-8 pt-8 border-t border-gray-200">
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className={`space-y-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li>Banner Printing</li>
                <li>Brand Design</li>
                <li>Installation Services</li>
                <li>Consultation</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Service Areas</h4>
              <ul className={`space-y-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li>Commercial Markets</li>
                <li>Shopping Malls</li>
                <li>Roadside Stalls</li>
                <li>Business Districts</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className={`space-y-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li><a href="#services" className="hover:text-yellow-500 transition-colors">Our Services</a></li>
                <li><a href="#gallery" className="hover:text-yellow-500 transition-colors">Portfolio</a></li>
                <li><a href="#process" className="hover:text-yellow-500 transition-colors">Our Process</a></li>
                <li><a href="#contact" className="hover:text-yellow-500 transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          
          <div className={`border-t mt-12 pt-8 text-center transition-colors duration-300 ${
            darkMode 
              ? 'border-purple-900/30 text-gray-400' 
              : 'border-gray-200 text-gray-600'
          }`}>
            <p>&copy; 2024 All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;