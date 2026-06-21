import React from 'react';

const defaultStyle = {
  display: 'inline-block',
  verticalAlign: 'middle',
  flexShrink: 0,
};

// ─── Sushi: Colorful maki rolls on a plate ───
export function SushiIcon({ size = 64, color, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={{ ...defaultStyle, ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Plate */}
      <ellipse cx="32" cy="48" rx="26" ry="8" fill="#E8DDD3" stroke="#C4B5A5" strokeWidth="1.5" />
      {/* Maki roll 1 - left */}
      <circle cx="20" cy="36" r="10" fill="#1A1A1A" stroke="#111" strokeWidth="1" />
      <circle cx="20" cy="36" r="7.5" fill="#FAFAF5" />
      <circle cx="20" cy="36" r="4.5" fill="#F06040" />
      <circle cx="20" cy="36" r="2" fill="#FF8A6A" opacity="0.6" />
      {/* Maki roll 2 - right */}
      <circle cx="38" cy="36" r="10" fill="#1A1A1A" stroke="#111" strokeWidth="1" />
      <circle cx="38" cy="36" r="7.5" fill="#FAFAF5" />
      <circle cx="38" cy="36" r="4.5" fill="#F06040" />
      <circle cx="38" cy="36" r="2" fill="#FF8A6A" opacity="0.6" />
      {/* Maki roll 3 - top center */}
      <circle cx="29" cy="22" r="10" fill="#1A1A1A" stroke="#111" strokeWidth="1" />
      <circle cx="29" cy="22" r="7.5" fill="#FAFAF5" />
      <circle cx="29" cy="22" r="4.5" fill="#5AB552" />
      <circle cx="29" cy="22" r="2" fill="#7ED674" opacity="0.6" />
      {/* Small rice grains on top */}
      <circle cx="15" cy="28" r="1" fill="#FAFAF5" opacity="0.7" />
      <circle cx="43" cy="28" r="1" fill="#FAFAF5" opacity="0.7" />
    </svg>
  );
}

// ─── Rice Bowl: Warm donburi with steam ───
export function RiceIcon({ size = 64, color, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={{ ...defaultStyle, ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Steam */}
      <path
        d="M24 14 Q24 10, 26 7"
        stroke="#C8C0B0"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M32 12 Q32 8, 34 5"
        stroke="#C8C0B0"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M40 14 Q40 10, 42 7"
        stroke="#C8C0B0"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Bowl */}
      <path
        d="M8 30 Q8 52, 32 54 Q56 52, 56 30"
        fill="#E85D3A"
        stroke="#CC4A2A"
        strokeWidth="1.5"
      />
      {/* Bowl rim */}
      <ellipse cx="32" cy="30" rx="24" ry="7" fill="#F07050" stroke="#CC4A2A" strokeWidth="1.5" />
      {/* Rice mound */}
      <path
        d="M12 30 Q18 16, 32 14 Q46 16, 52 30"
        fill="#FAFAF5"
        stroke="#E8E0D0"
        strokeWidth="1"
      />
      {/* Rice texture dots */}
      <circle cx="24" cy="24" r="1.5" fill="#F0E8D8" />
      <circle cx="32" cy="20" r="1.5" fill="#F0E8D8" />
      <circle cx="38" cy="24" r="1.5" fill="#F0E8D8" />
      <circle cx="28" cy="26" r="1.2" fill="#F0E8D8" />
      <circle cx="36" cy="27" r="1.2" fill="#F0E8D8" />
      {/* Topping - egg yolk */}
      <circle cx="32" cy="22" r="4" fill="#FFD036" stroke="#F0B020" strokeWidth="1" />
      <circle cx="31" cy="21" r="1.5" fill="#FFE06A" opacity="0.7" />
      {/* Bowl base */}
      <ellipse cx="32" cy="55" rx="8" ry="2.5" fill="#CC4A2A" />
    </svg>
  );
}

// ─── Salad Bowl: Fresh greens with veggies ───
export function SaladIcon({ size = 64, color, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={{ ...defaultStyle, ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bowl */}
      <path
        d="M6 32 Q6 52, 32 54 Q58 52, 58 32"
        fill="#8B6E50"
        stroke="#6B5040"
        strokeWidth="1.5"
      />
      <ellipse cx="32" cy="32" rx="26" ry="7" fill="#A08060" stroke="#6B5040" strokeWidth="1.5" />
      {/* Salad base - lettuce */}
      <path
        d="M12 30 Q16 16, 32 14 Q48 16, 52 30"
        fill="#6ABF4B"
        stroke="#4FA035"
        strokeWidth="1"
      />
      {/* Lettuce leaves */}
      <path
        d="M18 28 Q14 18, 24 14 Q22 22, 24 28"
        fill="#7ED45E"
        stroke="#5AB842"
        strokeWidth="0.8"
      />
      <path
        d="M34 26 Q38 14, 46 16 Q40 22, 36 28"
        fill="#7ED45E"
        stroke="#5AB842"
        strokeWidth="0.8"
      />
      <path
        d="M26 27 Q28 17, 34 18 Q32 23, 30 28"
        fill="#8BE06C"
        stroke="#5AB842"
        strokeWidth="0.8"
      />
      {/* Carrot shreds */}
      <line
        x1="20"
        y1="22"
        x2="26"
        y2="18"
        stroke="#FF8C32"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="24"
        x2="30"
        y2="20"
        stroke="#FF8C32"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="36"
        y1="22"
        x2="42"
        y2="18"
        stroke="#FF8C32"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Tomato slices */}
      <circle cx="22" cy="26" r="3" fill="#E84040" stroke="#C83030" strokeWidth="0.8" />
      <circle cx="40" cy="24" r="3" fill="#E84040" stroke="#C83030" strokeWidth="0.8" />
      {/* Sesame seeds */}
      <ellipse cx="30" cy="22" rx="1" ry="0.6" fill="#F5E6C8" transform="rotate(-20 30 22)" />
      <ellipse cx="36" cy="26" rx="1" ry="0.6" fill="#111" transform="rotate(15 36 26)" />
      <ellipse cx="26" cy="20" rx="1" ry="0.6" fill="#111" transform="rotate(-10 26 20)" />
    </svg>
  );
}

// ─── Takoyaki: Golden balls with sauce and bonito ───
export function TakoyakiIcon({ size = 64, color, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={{ ...defaultStyle, ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Boat/tray */}
      <path
        d="M6 38 L10 54 Q32 58, 54 54 L58 38"
        fill="#DBC49A"
        stroke="#C4A870"
        strokeWidth="1.5"
      />
      <ellipse cx="32" cy="38" rx="26" ry="7" fill="#E8D4AA" stroke="#C4A870" strokeWidth="1.5" />
      {/* Takoyaki ball 1 */}
      <circle cx="18" cy="32" r="9" fill="#D4960A" stroke="#B87808" strokeWidth="1" />
      <circle cx="15" cy="29" r="3" fill="#E8AC30" opacity="0.6" />
      {/* Takoyaki ball 2 */}
      <circle cx="32" cy="30" r="9" fill="#D4960A" stroke="#B87808" strokeWidth="1" />
      <circle cx="29" cy="27" r="3" fill="#E8AC30" opacity="0.6" />
      {/* Takoyaki ball 3 */}
      <circle cx="46" cy="32" r="9" fill="#D4960A" stroke="#B87808" strokeWidth="1" />
      <circle cx="43" cy="29" r="3" fill="#E8AC30" opacity="0.6" />
      {/* Sauce drizzle */}
      <path
        d="M12 28 Q18 24, 24 28 Q30 24, 36 28 Q42 24, 50 28"
        stroke="#5C2D0A"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Mayo drizzle */}
      <path
        d="M14 34 Q22 30, 30 34 Q38 30, 48 34"
        stroke="#FFF8E8"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Bonito flakes */}
      <path
        d="M16 26 Q18 22, 22 24"
        stroke="#D4A080"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M34 24 Q36 20, 40 22"
        stroke="#D4A080"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Green onion bits */}
      <circle cx="20" cy="30" r="1.2" fill="#5AB552" />
      <circle cx="35" cy="28" r="1.2" fill="#5AB552" />
      <circle cx="48" cy="30" r="1.2" fill="#5AB552" />
    </svg>
  );
}

// ─── Drinks: Matcha latte with boba vibes ───
export function DrinksIcon({ size = 64, color, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={{ ...defaultStyle, ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cup body */}
      <path
        d="M18 20 L22 54 Q32 58, 42 54 L46 20"
        fill="#FAFAF5"
        stroke="#D0C8B8"
        strokeWidth="1.5"
      />
      {/* Cup rim */}
      <ellipse cx="32" cy="20" rx="14" ry="4" fill="#FAFAF5" stroke="#D0C8B8" strokeWidth="1.5" />
      {/* Matcha liquid */}
      <path d="M20 26 L22 50 Q32 54, 42 50 L44 26" fill="#6DAA4F" />
      <ellipse cx="32" cy="26" rx="12" ry="3.5" fill="#7EC45A" />
      {/* Foam art */}
      <circle cx="32" cy="25" r="3" fill="#FAFAF5" opacity="0.5" />
      <circle cx="28" cy="24" r="2" fill="#FAFAF5" opacity="0.3" />
      <circle cx="36" cy="24" r="2" fill="#FAFAF5" opacity="0.3" />
      {/* Straw */}
      <rect
        x="36"
        y="6"
        width="3"
        height="22"
        rx="1.5"
        fill="#E85D3A"
        stroke="#CC4A2A"
        strokeWidth="0.8"
      />
      {/* Straw stripe */}
      <line x1="36" y1="10" x2="39" y2="10" stroke="#FAFAF5" strokeWidth="1.5" />
      <line x1="36" y1="14" x2="39" y2="14" stroke="#FAFAF5" strokeWidth="1.5" />
      <line x1="36" y1="18" x2="39" y2="18" stroke="#FAFAF5" strokeWidth="1.5" />
      {/* Cup sleeve */}
      <path d="M21 34 L23 44 Q32 47, 41 44 L43 34" fill="#C4A870" opacity="0.4" />
    </svg>
  );
}

// ─── Dessert: Colorful mochi on a plate ───
export function DessertIcon({ size = 64, color, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={{ ...defaultStyle, ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Plate */}
      <ellipse cx="32" cy="50" rx="26" ry="7" fill="#E8DDD3" stroke="#C4B5A5" strokeWidth="1.5" />
      <ellipse cx="32" cy="48" rx="22" ry="5" fill="#F5EDE3" stroke="#D8CFC0" strokeWidth="0.8" />
      {/* Mochi 1 - pink (strawberry) */}
      <ellipse cx="18" cy="40" rx="10" ry="8" fill="#F5A0B8" stroke="#E0809A" strokeWidth="1" />
      <ellipse cx="16" cy="37" rx="4" ry="2.5" fill="#FFBAD0" opacity="0.5" />
      {/* Mochi dusting */}
      <circle cx="14" cy="42" r="0.8" fill="#FAFAF5" opacity="0.5" />
      <circle cx="22" cy="38" r="0.8" fill="#FAFAF5" opacity="0.5" />
      {/* Mochi 2 - green (matcha) */}
      <ellipse cx="36" cy="38" rx="10" ry="8" fill="#8BC46A" stroke="#6BA04A" strokeWidth="1" />
      <ellipse cx="34" cy="35" rx="4" ry="2.5" fill="#A8E088" opacity="0.5" />
      {/* Mochi dusting */}
      <circle cx="40" cy="40" r="0.8" fill="#FAFAF5" opacity="0.5" />
      <circle cx="32" cy="36" r="0.8" fill="#FAFAF5" opacity="0.5" />
      {/* Mochi 3 - yellow (mango) on top */}
      <ellipse cx="26" cy="28" rx="9" ry="7" fill="#FFD060" stroke="#E0B040" strokeWidth="1" />
      <ellipse cx="24" cy="25" rx="3.5" ry="2" fill="#FFE490" opacity="0.5" />
      {/* Cherry blossom decoration */}
      <circle cx="48" cy="30" r="3" fill="#FFBAD0" opacity="0.6" />
      <circle cx="45" cy="28" r="2" fill="#F5A0B8" opacity="0.4" />
      <circle cx="51" cy="28" r="2" fill="#F5A0B8" opacity="0.4" />
      <circle cx="48" cy="26" r="1.5" fill="#FFD0E0" opacity="0.5" />
    </svg>
  );
}

// ─── All Categories: Colorful bento box ───
export function AllIcon({ size = 64, color, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={{ ...defaultStyle, ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bento box */}
      <rect
        x="6"
        y="14"
        width="52"
        height="38"
        rx="4"
        fill="#8B6E50"
        stroke="#6B5040"
        strokeWidth="1.5"
      />
      {/* Box lid line */}
      <line x1="6" y1="24" x2="58" y2="24" stroke="#6B5040" strokeWidth="1.5" />
      {/* Dividers */}
      <line x1="32" y1="24" x2="32" y2="52" stroke="#6B5040" strokeWidth="1" />
      <line x1="32" y1="38" x2="58" y2="38" stroke="#6B5040" strokeWidth="1" />
      {/* Top section - lid with label */}
      <rect x="7" y="15" width="50" height="8" rx="3" fill="#CC4A2A" />
      <text
        x="32"
        y="22"
        textAnchor="middle"
        fontSize="7"
        fill="#FAFAF5"
        fontFamily="sans-serif"
        fontWeight="bold"
      >
        BENTO
      </text>
      {/* Left section - rice */}
      <ellipse cx="19" cy="38" rx="10" ry="10" fill="#FAFAF5" />
      <circle cx="16" cy="36" r="1" fill="#F0E8D8" />
      <circle cx="20" cy="34" r="1" fill="#F0E8D8" />
      <circle cx="18" cy="40" r="1" fill="#F0E8D8" />
      <circle cx="22" cy="38" r="1" fill="#F0E8D8" />
      {/* Umeboshi (pickled plum) on rice */}
      <circle cx="19" cy="37" r="3" fill="#E84040" stroke="#C83030" strokeWidth="0.8" />
      {/* Top-right section - sushi */}
      <circle cx="40" cy="30" r="4" fill="#1A1A1A" />
      <circle cx="40" cy="30" r="3" fill="#FAFAF5" />
      <circle cx="40" cy="30" r="1.5" fill="#F06040" />
      <circle cx="50" cy="30" r="4" fill="#1A1A1A" />
      <circle cx="50" cy="30" r="3" fill="#FAFAF5" />
      <circle cx="50" cy="30" r="1.5" fill="#5AB552" />
      {/* Bottom-right section - takoyaki */}
      <circle cx="40" cy="44" r="4" fill="#D4960A" />
      <circle cx="38" cy="42" r="1.5" fill="#E8AC30" opacity="0.5" />
      <circle cx="50" cy="44" r="4" fill="#D4960A" />
      <circle cx="48" cy="42" r="1.5" fill="#E8AC30" opacity="0.5" />
    </svg>
  );
}

// ─── Add-ons: Sauce bottles / condiments ───
export function AddOnsIcon({ size = 64, color, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={{ ...defaultStyle, ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Mayo bottle */}
      <rect
        x="8"
        y="24"
        width="14"
        height="28"
        rx="4"
        fill="#FFF8E8"
        stroke="#D0C8B0"
        strokeWidth="1.2"
      />
      <rect
        x="11"
        y="18"
        width="8"
        height="8"
        rx="2"
        fill="#E8E0D0"
        stroke="#D0C8B0"
        strokeWidth="1"
      />
      <rect x="13" y="14" width="4" height="5" rx="2" fill="#D0C8B0" />
      <text
        x="15"
        y="42"
        textAnchor="middle"
        fontSize="7"
        fill="#C4A870"
        fontFamily="sans-serif"
        fontWeight="bold"
      >
        M
      </text>
      {/* Spicy sauce bottle */}
      <rect
        x="26"
        y="22"
        width="14"
        height="30"
        rx="4"
        fill="#E85D3A"
        stroke="#CC4A2A"
        strokeWidth="1.2"
      />
      <rect
        x="29"
        y="16"
        width="8"
        height="8"
        rx="2"
        fill="#CC4A2A"
        stroke="#B03820"
        strokeWidth="1"
      />
      <rect x="31" y="12" width="4" height="5" rx="2" fill="#B03820" />
      <text
        x="33"
        y="40"
        textAnchor="middle"
        fontSize="7"
        fill="#FFF8E8"
        fontFamily="sans-serif"
        fontWeight="bold"
      >
        S
      </text>
      {/* Fire icon on spicy */}
      <path d="M33 44 Q31 40, 33 38 Q35 40, 33 44Z" fill="#FFD060" opacity="0.8" />
      {/* Cheese sauce bottle */}
      <rect
        x="44"
        y="26"
        width="14"
        height="26"
        rx="4"
        fill="#FFD060"
        stroke="#E0B040"
        strokeWidth="1.2"
      />
      <rect
        x="47"
        y="20"
        width="8"
        height="8"
        rx="2"
        fill="#E0B040"
        stroke="#C89830"
        strokeWidth="1"
      />
      <rect x="49" y="16" width="4" height="5" rx="2" fill="#C89830" />
      <text
        x="51"
        y="42"
        textAnchor="middle"
        fontSize="7"
        fill="#8B6E50"
        fontFamily="sans-serif"
        fontWeight="bold"
      >
        C
      </text>
      {/* Drip from cheese bottle */}
      <circle cx="51" cy="54" r="2" fill="#FFD060" />
    </svg>
  );
}

// Small icon wrappers
export function SushiIconSmall({ size = 20, color, style = {} }) {
  return <SushiIcon size={size} color={color} style={style} />;
}

export function RiceIconSmall({ size = 20, color, style = {} }) {
  return <RiceIcon size={size} color={color} style={style} />;
}

export function SaladIconSmall({ size = 20, color, style = {} }) {
  return <SaladIcon size={size} color={color} style={style} />;
}

export function TakoyakiIconSmall({ size = 20, color, style = {} }) {
  return <TakoyakiIcon size={size} color={color} style={style} />;
}

export function DrinksIconSmall({ size = 20, color, style = {} }) {
  return <DrinksIcon size={size} color={color} style={style} />;
}

export function DessertIconSmall({ size = 20, color, style = {} }) {
  return <DessertIcon size={size} color={color} style={style} />;
}

export function AllIconSmall({ size = 20, color, style = {} }) {
  return <AllIcon size={size} color={color} style={style} />;
}

export function AddOnsIconSmall({ size = 20, color, style = {} }) {
  return <AddOnsIcon size={size} color={color} style={style} />;
}

// Utility: get category icon component
export function getCategoryIcon(category, size = 64, color = 'currentColor', style = {}) {
  const cat = (category || '').toLowerCase();
  if (cat.startsWith('sushi')) return <SushiIcon size={size} color={color} style={style} />;
  if (cat === 'rice') return <RiceIcon size={size} color={color} style={style} />;
  if (cat === 'salad') return <SaladIcon size={size} color={color} style={style} />;
  if (cat.startsWith('takoyaki')) return <TakoyakiIcon size={size} color={color} style={style} />;
  if (cat === 'drinks') return <DrinksIcon size={size} color={color} style={style} />;
  if (cat === 'dessert') return <DessertIcon size={size} color={color} style={style} />;
  if (cat === 'add-ons') return <AddOnsIcon size={size} color={color} style={style} />;
  return <AllIcon size={size} color={color} style={style} />;
}

// Utility: get small category icon component
export function getCategoryIconSmall(category, size = 20, color = 'currentColor', style = {}) {
  return getCategoryIcon(category, size, color, style);
}

// Map icon keys to components for use in MenuModal selector
export const categoryIconMap = {
  sushi: { component: SushiIcon, label: 'Sushi' },
  rice: { component: RiceIcon, label: 'Rice Bowl' },
  salad: { component: SaladIcon, label: 'Salad' },
  takoyaki: { component: TakoyakiIcon, label: 'Takoyaki' },
};

export default {
  SushiIcon,
  RiceIcon,
  SaladIcon,
  TakoyakiIcon,
  DrinksIcon,
  DessertIcon,
  AllIcon,
  AddOnsIcon,
  getCategoryIcon,
  getCategoryIconSmall,
  categoryIconMap,
};
