import { useState, useEffect } from "react";
import { Check, Star, Zap, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { publicApi } from "../api/client";
import { navigate } from "../lib/router";

export default function PackagesSection() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi.packages()
      .then((data) => {
        if (data?.packages) {
          setPackages(data.packages);
        }
      })
      .catch((err) => console.error("Error fetching packages:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-line border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (packages.length === 0) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 15 } }
  };

  return (
    <section className="section bg-bg-soft relative py-20" id="packages">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 right-10 w-96 h-96 bg-primary-glow blur-[100px] rounded-full opacity-60" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-gold-glow blur-[120px] rounded-full opacity-40" />
      </div>

      <div className="container relative z-10">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 bg-highlight-bg text-highlight-text px-4 py-1.5 rounded-full text-sm font-bold mb-4 shadow-sm">
            <Star className="w-4 h-4" />
            باقات المتابعة
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-text mb-6">
            اختر الباقة <strong className="text-gradient-gold">المناسبة لك</strong>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto leading-relaxed">
            نوفر لك باقات متنوعة تناسب احتياجاتك وأهدافك، مع متابعة دورية ومستمرة لضمان تحقيق أفضل النتائج الممكنة.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center"
        >
          {packages.map((pkg, index) => {
            // Highlight the middle package (usually Gold)
            const isHighlighted = index === 1;

            return (
              <motion.div 
                variants={cardVariants}
                key={pkg.id} 
                className={`glass-card rounded-[2.5rem] relative overflow-hidden flex flex-col ${
                  isHighlighted ? "md:-translate-y-4 shadow-2xl border-primary-soft/50 ring-2 ring-primary/20" : ""
                }`}
              >
                {isHighlighted && (
                  <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary-soft via-primary to-primary-soft" />
                )}
                
                {isHighlighted && (
                  <div className="absolute top-4 right-4 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-primary/20">
                    <Activity className="w-3 h-3" />
                    الأكثر طلباً
                  </div>
                )}

                <div className="p-8 pb-6 border-b border-line/50">
                  <h3 className="text-2xl font-black text-text mb-2">{pkg.name}</h3>
                  <p className="text-sm text-text-muted font-medium mb-6 min-h-[40px]">
                    {pkg.description}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-primary-deep">{pkg.price}</span>
                    <span className="text-text-muted font-bold">
                      {pkg.currency} / {pkg.durationValue} {pkg.durationUnit === "month" ? "شهر" : "مرة واحدة"}
                    </span>
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <ul className="space-y-4 mb-8 flex-1">
                    {pkg.features?.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isHighlighted ? "bg-primary/20 text-primary" : "bg-green-100 text-green-600"}`}>
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="text-text font-medium text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                    {(!pkg.features || pkg.features.length === 0) && (
                      <li className="text-text-muted italic text-sm">تفاصيل الباقة</li>
                    )}
                  </ul>

                  <a
                    href="/assessment"
                    onClick={e => { e.preventDefault(); navigate('/assessment'); }}
                    className={`btn w-full justify-center ${isHighlighted ? 'btn-primary' : 'bg-tint-2 hover:bg-line text-text border border-line'}`}
                  >
                    {isHighlighted ? <Zap className="w-4 h-4 mr-2" /> : null}
                    اشترك الآن
                  </a>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
