import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { navigate } from "../lib/router";
import { publicApi } from "../api/client";

// Generic fallback image just in case
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80";

export default function ServicesSection() {
  const { t, i18n } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lang = i18n.language?.startsWith("en") ? "en" : "ar";
    publicApi.services(lang)
      .then((data) => {
        const _groups = data?.groups || [];
        if (_groups.length > 0) setGroups(_groups);
      })
      .catch((e) => console.error("Error fetching services:", e))
      .finally(() => setLoading(false));
  }, [i18n.language]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60, damping: 15 } }
  };

  return (
    <section className="section bg-bg relative py-20" id="services">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-primary-glow to-transparent rounded-full opacity-40 translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-gold-glow to-transparent rounded-full opacity-30 -translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="container relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 bg-highlight-bg text-highlight-text px-4 py-1.5 rounded-full text-sm font-bold mb-4 shadow-sm">
            <Sparkles className="w-4 h-4" />
            مجالات التخصص
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-text mb-6">
            {t("services.title")} <strong className="text-gradient">المتكاملة</strong>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto leading-relaxed">
            حلول غذائية شاملة ومخصصة لمساعدتك في الوصول إلى هدفك بأفضل طريقة صحية ومستدامة.
          </p>
        </motion.div>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-10 h-10 border-4 border-line border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {groups.map((group, gi) => (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            key={gi}
            className="mb-16"
          >
            <h3 className="text-2xl md:text-3xl font-black text-primary-deep mb-8 flex items-center gap-4">
              {group.title}
              <div className="h-px bg-gradient-to-l from-primary-soft to-transparent flex-1 opacity-50" />
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {group.items.map((item, i) => {
                const imgSrc = item.coverImageUrl || FALLBACK_IMAGE;
                
                return (
                  <motion.article 
                    variants={cardVariants}
                    whileHover={{ y: -10 }}
                    key={i} 
                    className="glass-card rounded-[2rem] overflow-hidden flex flex-col group cursor-pointer h-full"
                  >
                    <div className="w-full h-56 relative overflow-hidden">
                      <img 
                        src={imgSrc} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-deep/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    
                    <div className="p-8 flex-1 flex flex-col relative bg-card-bg">
                      <h4 className="text-2xl font-black text-text mb-4 transition-colors group-hover:text-primary">
                        {item.title}
                      </h4>
                      <p className="text-text-muted leading-relaxed flex-1 font-medium mb-6">
                        {item.body}
                      </p>
                      <div className="inline-flex items-center gap-2 text-primary font-bold text-sm">
                        اكتشف المزيد
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-2" />
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </motion.div>
        ))}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <a
            href="/assessment"
            onClick={e => { e.preventDefault(); navigate('/assessment'); }}
            className="btn btn-primary"
            style={{ borderRadius: "100px", padding: "18px 40px", fontSize: "18px" }}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {t("services.cta")}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
