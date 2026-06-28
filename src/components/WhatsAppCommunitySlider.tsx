import React from 'react';
import { motion } from 'motion/react';

export default function WhatsAppCommunitySlider() {
  const whatsappLink = 'https://chat.whatsapp.com/CoNzUZBmDsDC8bV8nB7uIH?s=cl&p=i&ilr=4';

  return (
    <div className="relative select-none flex justify-end">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes custom-whatsapp-glow {
          0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.5); }
          70% { box-shadow: 0 0 0 12px rgba(37, 211, 102, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
        }
      `}} />

      {/* Realistic 3D WhatsApp Button pointing directly to the Group */}
      <motion.a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          y: [0, -4, 0]
        }}
        transition={{
          opacity: { duration: 0.3 },
          scale: { duration: 0.3 },
          y: {
            duration: 4,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center cursor-pointer relative shadow-[0_8px_24px_rgba(37,211,102,0.35),inset_0_2px_4px_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.2)] border border-[#128C7E]/40"
        style={{
          background: 'radial-gradient(circle at 35% 25%, #4ae380 0%, #25d366 50%, #128c7e 100%)',
          animation: 'custom-whatsapp-glow 2.5s infinite ease-in-out',
        }}
        title="Join Our WhatsApp Community"
      >
        {/* Glossy top reflection layer for realistic 3D appearance */}
        <div 
          className="absolute top-0.5 left-0.5 right-0.5 h-[40%] rounded-t-full pointer-events-none opacity-35"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)',
          }}
        />

        {/* Clean crisp white WhatsApp logo */}
        <svg 
          className="w-6 h-6 md:w-7 md:h-7 text-white filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.35)]" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.1 1.45 4.6 1.45 5.517 0 10.005-4.487 10.008-10.004.002-2.673-1.04-5.185-2.936-7.083-1.895-1.897-4.41-2.94-7.083-2.94-5.522 0-10.01 4.488-10.013 10.007-.001 1.83.483 3.62 1.4 5.21l-.995 3.63 3.733-.98c1.568.855 3.137 1.3 4.29 1.3zm10.742-7.41c-.29-.145-1.713-.846-1.978-.942-.265-.096-.458-.145-.65.145-.193.29-.747.942-.916 1.133-.169.191-.338.216-.628.072-.29-.145-1.226-.452-2.335-1.442-.863-.77-1.446-1.72-1.615-2.01-.17-.29-.018-.447.127-.59.13-.13.29-.338.434-.507.145-.17.193-.29.29-.483.097-.193.048-.361-.024-.507-.072-.145-.65-1.566-.89-2.145-.236-.57-.474-.492-.65-.5-.169-.008-.362-.01-.555-.01-.193 0-.506.072-.77.362-.265.29-1.012.99-1.012 2.417 0 1.425 1.036 2.802 1.18 2.995.145.193 2.036 3.11 4.933 4.364.688.298 1.225.476 1.644.609.693.22 1.324.19 1.823.115.556-.084 1.713-.699 1.954-1.374.24-.675.24-1.253.169-1.374-.07-.12-.264-.191-.555-.337z"/>
        </svg>
      </motion.a>
    </div>
  );
}
