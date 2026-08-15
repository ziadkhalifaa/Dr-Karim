import { useTranslation } from "react-i18next";
import { ChevronLeft, Star, Sparkles, ShieldCheck, HeartPulse } from "lucide-react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';
import { motion } from 'framer-motion';
import { navigate } from '../lib/router';

import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

const SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop",
    title: "صحتك هي استثمارك الحقيقي",
    badge: "تغذية علاجية"
  },
  {
    image: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?q=80&w=1974&auto=format&fit=crop",
    title: "توازن غذائي لحياة أفضل",
    badge: "إدارة الوزن"
  },
  {
    image: "https://images.unsplash.com/photo-1498837167339-54df3c2557ff?q=80&w=2070&auto=format&fit=crop",
    title: "خطط مخصصة تناسب أهدافك",
    badge: "تغذية رياضيين"
  }
];

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="hero">
      <div className="container">
        {/* Text Content */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hero__inner"
        >
          <div className="hero__kicker">
            <Sparkles className="w-4 h-4" />
            <span>نظام حياة صحي، يبدأ من هنا</span>
          </div>

          <h1 className="hero__title">
            استعد صحتك وحيويتك مع
            <strong className="text-gradient">د. كريم الليثي</strong>
          </h1>
          
          <p className="hero__subtitle">
            رحلتك نحو الوزن المثالي والصحة المستدامة تبدأ الآن. نقدم لك برامج تغذية علاجية، وخطط رياضية متكاملة مصممة خصيصاً لتناسب طبيعة جسمك وتحقيق أهدافك بأفضل الطرق العلمية.
          </p>

          <div className="hero__cta-row">
            <a href="/assessment" onClick={e => { e.preventDefault(); navigate('/assessment'); }} className="btn btn-primary">
              ابدأ التقييم المجاني
              <ChevronLeft className="w-5 h-5" />
            </a>
            <a href="#services" className="btn btn-outline">
              اكتشف خدماتنا
            </a>
          </div>

          <div className="hero__trust">
            <div className="flex -space-x-4 space-x-reverse mr-4">
              <img src="https://i.pravatar.cc/100?img=33" alt="User" className="w-10 h-10 rounded-full border-2 border-white" />
              <img src="https://i.pravatar.cc/100?img=47" alt="User" className="w-10 h-10 rounded-full border-2 border-white" />
              <img src="https://i.pravatar.cc/100?img=12" alt="User" className="w-10 h-10 rounded-full border-2 border-white" />
              <div className="w-10 h-10 rounded-full border-2 border-white bg-secondary flex items-center justify-center text-xs font-bold text-white">
                +2k
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-gold">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <span className="text-sm font-medium">قصة نجاح وتقييم 5 نجوم</span>
            </div>
          </div>
        </motion.div>

        {/* Art / Slider */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="hero__wrap"
        >
          <div className="relative w-full aspect-[4/5] md:aspect-square max-w-[500px] rounded-[40px] overflow-hidden shadow-2xl ring-4 ring-white/10">
            <Swiper
              modules={[Autoplay, EffectFade, Pagination]}
              effect="fade"
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              className="w-full h-full"
            >
              {SLIDES.map((slide, i) => (
                <SwiperSlide key={i}>
                  <div className="relative w-full h-full group">
                    <img src={slide.image} alt={slide.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-deep/90 via-deep/20 to-transparent flex flex-col justify-end p-8">
                      <span className="inline-block px-4 py-1.5 bg-primary/90 backdrop-blur-md rounded-full text-white text-sm font-bold w-max mb-3">
                        {slide.badge}
                      </span>
                      <h3 className="text-2xl font-bold text-white drop-shadow-lg">{slide.title}</h3>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            
            {/* Floating Elements (Glassmorphism chips) */}
            <motion.div 
              animate={{ y: [-10, 10, -10] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute top-10 -right-6 z-10 glass px-5 py-3 rounded-2xl flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-primary flex items-center justify-center text-white shadow-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-text-muted font-bold">معتمد</div>
                <div className="text-sm font-bold text-primary">تغذية علاجية</div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [10, -10, 10] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-20 -left-6 z-10 glass px-5 py-3 rounded-2xl flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-secondary flex items-center justify-center text-white shadow-lg">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-text-muted font-bold">متابعة</div>
                <div className="text-sm font-bold text-primary">مستمرة ويومية</div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
