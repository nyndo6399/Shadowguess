/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Classroom, GameItem } from '../types/game';
import { SHADOW_COLORS } from './imageProcessing';

// Helper to convert SVG markup to base64 Data URL
function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// 1. Duck in swim ring: "go for a swim"
const DUCK_SWIM_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- Water splashes -->
  <path d="M20 150 Q40 140 60 150 T100 150 T140 150 T180 150" fill="none" stroke="#38bdf8" stroke-width="8" stroke-linecap="round"/>
  <ellipse cx="40" cy="165" rx="15" ry="6" fill="#7dd3fc" opacity="0.7"/>
  <ellipse cx="160" cy="165" rx="15" ry="6" fill="#7dd3fc" opacity="0.7"/>
  <!-- Swim Ring -->
  <ellipse cx="100" cy="135" rx="65" ry="32" fill="#38bdf8" stroke="#0284c7" stroke-width="5"/>
  <ellipse cx="100" cy="135" rx="42" ry="18" fill="#bae6fd"/>
  <!-- Duck Body -->
  <ellipse cx="100" cy="110" rx="42" ry="36" fill="#fde047" stroke="#eab308" stroke-width="4"/>
  <!-- Duck Head -->
  <circle cx="100" cy="72" r="32" fill="#fef08a" stroke="#eab308" stroke-width="4"/>
  <!-- Goggles -->
  <rect x="72" y="55" width="24" height="18" rx="8" fill="#60a5fa" stroke="#2563eb" stroke-width="3"/>
  <rect x="104" y="55" width="24" height="18" rx="8" fill="#60a5fa" stroke="#2563eb" stroke-width="3"/>
  <line x1="96" y1="64" x2="104" y2="64" stroke="#2563eb" stroke-width="4"/>
  <path d="M68 64 Q50 64 54 75" fill="none" stroke="#2563eb" stroke-width="3"/>
  <path d="M132 64 Q150 64 146 75" fill="none" stroke="#2563eb" stroke-width="3"/>
  <!-- Duck Eyes behind goggles -->
  <circle cx="84" cy="64" r="3.5" fill="#1e293b"/>
  <circle cx="116" cy="64" r="3.5" fill="#1e293b"/>
  <!-- Cheeks -->
  <circle cx="76" cy="82" r="6" fill="#fca5a5" opacity="0.8"/>
  <circle cx="124" cy="82" r="6" fill="#fca5a5" opacity="0.8"/>
  <!-- Beak -->
  <ellipse cx="100" cy="80" rx="13" ry="8" fill="#fb923c" stroke="#ea580c" stroke-width="2.5"/>
  <!-- Wings -->
  <ellipse cx="62" cy="115" rx="12" ry="20" fill="#facc15" transform="rotate(-25 62 115)"/>
  <ellipse cx="138" cy="115" rx="12" ry="20" fill="#facc15" transform="rotate(25 138 115)"/>
</svg>
`);

// 2. Fox on pink bike: "go for a ride"
const FOX_BIKE_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- Bicycle Wheels -->
  <circle cx="50" cy="155" r="28" fill="none" stroke="#f472b6" stroke-width="6"/>
  <circle cx="50" cy="155" r="5" fill="#db2777"/>
  <line x1="50" y1="127" x2="50" y2="183" stroke="#fbcfe8" stroke-width="2"/>
  <line x1="22" y1="155" x2="78" y2="155" stroke="#fbcfe8" stroke-width="2"/>
  
  <circle cx="145" cy="155" r="28" fill="none" stroke="#f472b6" stroke-width="6"/>
  <circle cx="145" cy="155" r="5" fill="#db2777"/>
  <line x1="145" y1="127" x2="145" y2="183" stroke="#fbcfe8" stroke-width="2"/>
  <line x1="117" y1="155" x2="173" y2="155" stroke="#fbcfe8" stroke-width="2"/>

  <!-- Bike Frame -->
  <path d="M50 155 L90 155 L130 115 L85 115 Z" fill="none" stroke="#ec4899" stroke-width="6" stroke-linejoin="round"/>
  <path d="M90 155 L85 115 L85 102" fill="none" stroke="#ec4899" stroke-width="6"/>
  <path d="M145 155 L130 115 L125 90" fill="none" stroke="#ec4899" stroke-width="6"/>
  <!-- Handlebars -->
  <path d="M115 90 L135 90" stroke="#9d174d" stroke-width="5" stroke-linecap="round"/>
  <!-- Basket with flowers -->
  <rect x="135" y="85" width="22" height="18" rx="4" fill="#fed7aa" stroke="#c2410c" stroke-width="2"/>
  <circle cx="142" cy="85" r="5" fill="#fbbf24"/>
  <circle cx="150" cy="83" r="5" fill="#f43f5e"/>

  <!-- Fox Big Tail -->
  <path d="M35 110 C10 100 5 70 25 60 C40 50 55 80 45 110 Z" fill="#ea580c"/>
  <path d="M12 68 C8 62 18 56 25 60 C20 70 15 72 12 68 Z" fill="#ffffff"/>

  <!-- Fox Body & Sweater -->
  <ellipse cx="88" cy="100" rx="20" ry="25" fill="#38bdf8"/>
  <circle cx="80" cy="98" r="8" fill="#fbbf24"/> <!-- bag strap -->

  <!-- Fox Head -->
  <polygon points="70,55 60,30 85,42" fill="#ea580c"/>
  <polygon points="68,50 63,35 78,43" fill="#fee2e2"/>
  <polygon points="110,55 125,30 95,42" fill="#ea580c"/>
  <polygon points="108,50 118,35 102,43" fill="#fee2e2"/>
  <circle cx="90" cy="62" r="26" fill="#f97316"/>
  <!-- White muzzle -->
  <ellipse cx="90" cy="72" rx="18" ry="12" fill="#ffffff"/>
  <!-- Eyes & Nose -->
  <circle cx="80" cy="60" r="3.5" fill="#1e293b"/>
  <circle cx="100" cy="60" r="3.5" fill="#1e293b"/>
  <ellipse cx="90" cy="68" rx="4" ry="3" fill="#0f172a"/>
  <!-- Cheeks -->
  <circle cx="73" cy="68" r="5" fill="#fca5a5"/>
  <circle cx="107" cy="68" r="5" fill="#fca5a5"/>
</svg>
`);

// 3. Puppy dog with laptop: "watch a film / movie"
const DOG_LAPTOP_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- Table surface -->
  <rect x="20" y="160" width="160" height="15" rx="4" fill="#d97706"/>
  <!-- Dog Body -->
  <ellipse cx="130" cy="125" rx="35" ry="30" fill="#fef08a"/>
  <!-- Dog Tail wagging -->
  <path d="M165 125 Q185 110 178 95" fill="none" stroke="#ca8a04" stroke-width="8" stroke-linecap="round"/>

  <!-- Dog Head -->
  <circle cx="110" cy="80" r="32" fill="#fef9c3"/>
  <!-- Floppy Brown Ears -->
  <path d="M82 65 C70 65 65 95 80 110 C88 115 95 90 85 70 Z" fill="#b45309"/>
  <path d="M138 65 C150 65 155 95 140 110 C132 115 125 90 135 70 Z" fill="#b45309"/>
  
  <!-- Eyes -->
  <circle cx="100" cy="78" r="4" fill="#0284c7"/>
  <circle cx="120" cy="78" r="4" fill="#0284c7"/>
  <circle cx="98" cy="76" r="1.5" fill="#ffffff"/>
  <circle cx="118" cy="76" r="1.5" fill="#ffffff"/>
  <!-- Nose & Mouth -->
  <ellipse cx="110" cy="88" rx="6" ry="4" fill="#0f172a"/>
  <path d="M106 93 Q110 98 114 93" fill="none" stroke="#0f172a" stroke-width="2"/>
  <!-- Cheeks -->
  <circle cx="92" cy="88" r="5" fill="#fca5a5"/>
  <circle cx="128" cy="88" r="5" fill="#fca5a5"/>

  <!-- Dog Paws on laptop -->
  <ellipse cx="78" cy="125" rx="9" ry="6" fill="#fef08a"/>

  <!-- Laptop Screen & Base -->
  <rect x="35" y="110" width="48" height="34" rx="4" fill="#38bdf8" stroke="#0284c7" stroke-width="3"/>
  <path d="M48 122 Q54 116 60 122 Q66 128 72 122" fill="none" stroke="#ffffff" stroke-width="3"/>
  <polygon points="25,150 85,150 78,144 32,144" fill="#94a3b8" stroke="#64748b" stroke-width="2"/>
</svg>
`);

// 4. Pink pig with backpack: "walk to school"
const PIG_SCHOOL_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- Backpack -->
  <rect x="45" y="85" width="28" height="42" rx="8" fill="#38bdf8" stroke="#0284c7" stroke-width="3"/>
  <path d="M52 85 C52 70 70 70 70 85" fill="none" stroke="#0284c7" stroke-width="4"/>
  <circle cx="58" cy="110" r="5" fill="#fef08a"/>

  <!-- Feet walking -->
  <ellipse cx="85" cy="165" rx="12" ry="8" fill="#f472b6"/>
  <ellipse cx="120" cy="160" rx="12" ry="8" fill="#f472b6"/>

  <!-- Pig Body -->
  <circle cx="105" cy="118" r="42" fill="#fce7f3" stroke="#f472b6" stroke-width="4"/>

  <!-- Pig Ears -->
  <polygon points="75,55 85,32 100,50" fill="#f472b6"/>
  <polygon points="120,50 135,32 145,55" fill="#f472b6"/>

  <!-- Pig Head -->
  <circle cx="110" cy="72" r="34" fill="#fdf2f8" stroke="#f472b6" stroke-width="4"/>
  
  <!-- Eyes -->
  <circle cx="98" cy="68" r="4" fill="#1e293b"/>
  <circle cx="124" cy="68" r="4" fill="#1e293b"/>

  <!-- Pig Snout -->
  <rect x="100" y="74" width="22" height="16" rx="8" fill="#f472b6"/>
  <circle cx="106" cy="82" r="2.5" fill="#831843"/>
  <circle cx="116" cy="82" r="2.5" fill="#831843"/>

  <!-- Cheeks -->
  <circle cx="86" cy="80" r="6" fill="#fbcfe8"/>
  <circle cx="134" cy="80" r="6" fill="#fbcfe8"/>

  <!-- Arm waving -->
  <path d="M142 105 Q162 90 155 75" fill="none" stroke="#f472b6" stroke-width="9" stroke-linecap="round"/>
</svg>
`);

// 5. Rabbit in pink car: "drive a car"
const RABBIT_CAR_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- Rabbit Ears -->
  <ellipse cx="82" cy="40" rx="10" ry="32" fill="#ffffff" stroke="#e2e8f0" stroke-width="3"/>
  <ellipse cx="82" cy="42" rx="5" ry="20" fill="#fbcfe8"/>
  <ellipse cx="112" cy="40" rx="10" ry="32" fill="#ffffff" stroke="#e2e8f0" stroke-width="3"/>
  <ellipse cx="112" cy="42" rx="5" ry="20" fill="#fbcfe8"/>

  <!-- Rabbit Head -->
  <circle cx="98" cy="78" r="30" fill="#ffffff" stroke="#e2e8f0" stroke-width="3"/>
  <!-- Eyes -->
  <circle cx="88" cy="76" r="4" fill="#1e293b"/>
  <circle cx="108" cy="76" r="4" fill="#1e293b"/>
  <!-- Nose & Mouth -->
  <polygon points="98,82 95,86 101,86" fill="#f43f5e"/>
  <!-- Cheeks -->
  <circle cx="80" cy="84" r="5" fill="#fca5a5"/>
  <circle cx="116" cy="84" r="5" fill="#fca5a5"/>

  <!-- Pink Toy Car Body -->
  <path d="M30 145 C30 115 50 110 80 110 L125 110 C155 110 175 120 175 145 L175 155 L30 155 Z" fill="#f472b6" stroke="#db2777" stroke-width="4"/>
  <!-- Windshield -->
  <path d="M75 110 L95 90 L125 90 L135 110 Z" fill="#bae6fd" opacity="0.8"/>
  <!-- Headlight -->
  <circle cx="168" cy="135" r="7" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
  <!-- Wheels -->
  <circle cx="58" cy="160" r="18" fill="#334155" stroke="#0f172a" stroke-width="4"/>
  <circle cx="58" cy="160" r="7" fill="#f8fafc"/>
  <circle cx="148" cy="160" r="18" fill="#334155" stroke="#0f172a" stroke-width="4"/>
  <circle cx="148" cy="160" r="7" fill="#f8fafc"/>
</svg>
`);

// 6. Cat with headphones: "listen to music"
const CAT_MUSIC_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- Cat Body -->
  <ellipse cx="100" cy="140" rx="36" ry="32" fill="#fed7aa" stroke="#ea580c" stroke-width="3"/>
  <!-- Tail -->
  <path d="M135 140 Q165 130 155 105" fill="none" stroke="#ea580c" stroke-width="8" stroke-linecap="round"/>

  <!-- Cat Ears -->
  <polygon points="70,70 65,40 92,58" fill="#f97316"/>
  <polygon points="130,70 135,40 108,58" fill="#f97316"/>
  <!-- Head -->
  <circle cx="100" cy="85" r="35" fill="#ffedd5" stroke="#ea580c" stroke-width="4"/>
  <!-- Face -->
  <circle cx="88" cy="82" r="4" fill="#0f172a"/>
  <circle cx="112" cy="82" r="4" fill="#0f172a"/>
  <polygon points="100,90 96,94 104,94" fill="#f43f5e"/>
  <path d="M95 98 Q100 102 105 98" fill="none" stroke="#0f172a" stroke-width="2"/>
  <!-- Whiskers -->
  <line x1="68" y1="90" x2="84" y2="92" stroke="#ea580c" stroke-width="2"/>
  <line x1="68" y1="98" x2="84" y2="96" stroke="#ea580c" stroke-width="2"/>
  <line x1="132" y1="90" x2="116" y2="92" stroke="#ea580c" stroke-width="2"/>
  <line x1="132" y1="98" x2="116" y2="96" stroke="#ea580c" stroke-width="2"/>

  <!-- Headphones -->
  <path d="M65 85 C65 45 135 45 135 85" fill="none" stroke="#8b5cf6" stroke-width="6"/>
  <rect x="60" y="75" width="12" height="25" rx="5" fill="#a855f7" stroke="#6b21a8" stroke-width="2"/>
  <rect x="128" y="75" width="12" height="25" rx="5" fill="#a855f7" stroke="#6b21a8" stroke-width="2"/>
  <!-- Music Notes floating -->
  <text x="145" y="60" font-size="22" fill="#8b5cf6">♪</text>
  <text x="160" y="45" font-size="28" fill="#ec4899">♫</text>
</svg>
`);

// 7. Bear reading book: "read a book"
const BEAR_BOOK_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- Bear Ears -->
  <circle cx="70" cy="55" r="14" fill="#92400e" stroke="#78350f" stroke-width="3"/>
  <circle cx="70" cy="55" r="7" fill="#fde68a"/>
  <circle cx="130" cy="55" r="14" fill="#92400e" stroke="#78350f" stroke-width="3"/>
  <circle cx="130" cy="55" r="7" fill="#fde68a"/>

  <!-- Bear Head -->
  <circle cx="100" cy="80" r="38" fill="#b45309" stroke="#78350f" stroke-width="4"/>
  <!-- Snout -->
  <ellipse cx="100" cy="92" rx="18" ry="14" fill="#fde68a"/>
  <ellipse cx="100" cy="88" rx="7" ry="5" fill="#1e293b"/>
  <!-- Glasses -->
  <circle cx="85" cy="78" r="12" fill="none" stroke="#dc2626" stroke-width="3"/>
  <circle cx="115" cy="78" r="12" fill="none" stroke="#dc2626" stroke-width="3"/>
  <line x1="97" y1="78" x2="103" y2="78" stroke="#dc2626" stroke-width="3"/>
  <!-- Eyes behind glasses -->
  <circle cx="85" cy="78" r="3.5" fill="#1e293b"/>
  <circle cx="115" cy="78" r="3.5" fill="#1e293b"/>

  <!-- Body -->
  <ellipse cx="100" cy="140" rx="42" ry="32" fill="#92400e"/>
  
  <!-- Open Book -->
  <path d="M55 125 L98 135 L98 175 L55 165 Z" fill="#f8fafc" stroke="#3b82f6" stroke-width="3"/>
  <path d="M145 125 L102 135 L102 175 L145 165 Z" fill="#f8fafc" stroke="#3b82f6" stroke-width="3"/>
  <line x1="62" y1="138" x2="90" y2="144" stroke="#94a3b8" stroke-width="2"/>
  <line x1="62" y1="148" x2="90" y2="154" stroke="#94a3b8" stroke-width="2"/>
  <line x1="110" y1="144" x2="138" y2="138" stroke="#94a3b8" stroke-width="2"/>
  <line x1="110" y1="154" x2="138" y2="148" stroke="#94a3b8" stroke-width="2"/>
</svg>
`);

// 8. Panda playing soccer: "play football"
const PANDA_BALL_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- Panda Ears -->
  <circle cx="65" cy="50" r="16" fill="#1e293b"/>
  <circle cx="135" cy="50" r="16" fill="#1e293b"/>

  <!-- Panda Head -->
  <circle cx="100" cy="80" r="38" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
  <!-- Black Eye Patches -->
  <ellipse cx="80" cy="78" rx="12" ry="16" fill="#1e293b" transform="rotate(-15 80 78)"/>
  <ellipse cx="120" cy="78" rx="12" ry="16" fill="#1e293b" transform="rotate(15 120 78)"/>
  <circle cx="82" cy="78" r="4" fill="#ffffff"/>
  <circle cx="118" cy="78" r="4" fill="#ffffff"/>
  <!-- Nose & Mouth -->
  <ellipse cx="100" cy="92" rx="6" ry="4" fill="#1e293b"/>
  <path d="M96 98 Q100 102 104 98" fill="none" stroke="#1e293b" stroke-width="2"/>

  <!-- Panda Body -->
  <ellipse cx="100" cy="138" rx="36" ry="30" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
  <path d="M68 120 C68 110 132 110 132 120 C132 135 68 135 68 120 Z" fill="#1e293b"/>

  <!-- Soccer Ball -->
  <circle cx="145" cy="155" r="22" fill="#ffffff" stroke="#0f172a" stroke-width="3"/>
  <polygon points="145,145 152,150 149,158 141,158 138,150" fill="#0f172a"/>
  <line x1="145" y1="145" x2="145" y2="135" stroke="#0f172a" stroke-width="2"/>
  <line x1="152" y1="150" x2="162" y2="146" stroke="#0f172a" stroke-width="2"/>
  <line x1="149" y1="158" x2="158" y2="168" stroke="#0f172a" stroke-width="2"/>
  <line x1="141" y1="158" x2="132" y2="168" stroke="#0f172a" stroke-width="2"/>
  <line x1="138" y1="150" x2="128" y2="146" stroke="#0f172a" stroke-width="2"/>
</svg>
`);

// 9. Hamster watering flowers: "water the flowers"
const HAMSTER_WATER_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- Hamster Ears -->
  <circle cx="75" cy="55" r="12" fill="#fdba74"/>
  <circle cx="125" cy="55" r="12" fill="#fdba74"/>

  <!-- Hamster Body & Head -->
  <circle cx="100" cy="100" r="42" fill="#fb923c" stroke="#ea580c" stroke-width="3"/>
  <ellipse cx="100" cy="115" rx="28" ry="22" fill="#ffedd5"/>
  
  <!-- Eyes -->
  <circle cx="88" cy="90" r="4.5" fill="#1e293b"/>
  <circle cx="112" cy="90" r="4.5" fill="#1e293b"/>
  <circle cx="86" cy="88" r="1.5" fill="#ffffff"/>
  <circle cx="110" cy="88" r="1.5" fill="#ffffff"/>

  <!-- Chubby Cheeks -->
  <circle cx="74" cy="102" r="8" fill="#fca5a5"/>
  <circle cx="126" cy="102" r="8" fill="#fca5a5"/>

  <!-- Watering Can -->
  <path d="M125 110 L155 110 L150 145 L130 145 Z" fill="#22c55e" stroke="#15803d" stroke-width="3"/>
  <path d="M150 120 L170 105" stroke="#15803d" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="172" cy="103" rx="5" ry="3" fill="#15803d"/>
  <!-- Handle -->
  <path d="M125 118 C115 118 115 138 125 138" fill="none" stroke="#15803d" stroke-width="4"/>
  <!-- Water drops -->
  <circle cx="178" cy="115" r="2.5" fill="#38bdf8"/>
  <circle cx="182" cy="125" r="2.5" fill="#38bdf8"/>
  <circle cx="184" cy="138" r="2.5" fill="#38bdf8"/>
</svg>
`);

// 10. Squirrel eating apple: "eat an apple"
const SQUIRREL_APPLE_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- Giant Bushy Tail -->
  <path d="M120 150 C180 140 190 70 140 40 C110 25 130 90 90 120 Z" fill="#c2410c" stroke="#9a3412" stroke-width="3"/>

  <!-- Body -->
  <ellipse cx="90" cy="130" rx="30" ry="34" fill="#ea580c"/>
  <ellipse cx="80" cy="135" rx="18" ry="24" fill="#ffedd5"/>

  <!-- Head -->
  <circle cx="85" cy="80" r="26" fill="#ea580c"/>
  <polygon points="75,58 70,40 85,52" fill="#c2410c"/>
  <polygon points="95,58 100,40 88,52" fill="#c2410c"/>
  <!-- Eye -->
  <circle cx="78" cy="78" r="4" fill="#0f172a"/>
  <!-- Cheek -->
  <circle cx="70" cy="85" r="5" fill="#fca5a5"/>

  <!-- Red Apple held in paws -->
  <circle cx="55" cy="120" r="16" fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>
  <path d="M55 104 Q58 98 62 96" stroke="#15803d" stroke-width="3" fill="none"/>
  <ellipse cx="64" cy="98" rx="4" ry="2" fill="#22c55e" transform="rotate(-30 64 98)"/>
</svg>
`);

// 11. Sleeping cat in bed: "sleep in bed"
const SLEEPING_CAT_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- Bed frame -->
  <rect x="25" y="120" width="150" height="40" rx="8" fill="#fed7aa" stroke="#ca8a04" stroke-width="3"/>
  <rect x="20" y="95" width="20" height="65" rx="4" fill="#d97706"/>
  <!-- Pillow -->
  <rect x="35" y="105" width="45" height="30" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <!-- Sleeping Cat Head -->
  <circle cx="65" cy="115" r="18" fill="#f97316"/>
  <polygon points="52,102 48,90 60,98" fill="#ea580c"/>
  <polygon points="72,100 78,90 76,102" fill="#ea580c"/>
  <!-- Closed happy eyes ^ ^ -->
  <path d="M58 116 Q61 112 64 116" fill="none" stroke="#1e293b" stroke-width="2"/>
  <path d="M68 116 Q71 112 74 116" fill="none" stroke="#1e293b" stroke-width="2"/>
  <!-- Blanket -->
  <path d="M60 120 L165 120 Q170 145 165 150 L60 150 Z" fill="#93c5fd" stroke="#3b82f6" stroke-width="3"/>
  <!-- Zzz floating -->
  <text x="100" y="80" font-size="20" font-weight="bold" fill="#3b82f6">Z</text>
  <text x="118" y="65" font-size="16" font-weight="bold" fill="#60a5fa">z</text>
  <text x="132" y="52" font-size="12" font-weight="bold" fill="#93c5fd">z</text>
</svg>
`);

// 12. Koala drinking juice: "drink fruit juice"
const KOALA_JUICE_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- Fluffy Ears -->
  <circle cx="60" cy="65" r="22" fill="#94a3b8" stroke="#64748b" stroke-width="3"/>
  <circle cx="60" cy="65" r="12" fill="#f1f5f9"/>
  <circle cx="140" cy="65" r="22" fill="#94a3b8" stroke="#64748b" stroke-width="3"/>
  <circle cx="140" cy="65" r="12" fill="#f1f5f9"/>

  <!-- Head -->
  <circle cx="100" cy="88" r="36" fill="#cbd5e1" stroke="#64748b" stroke-width="3"/>
  <!-- Big Koala Nose -->
  <ellipse cx="100" cy="92" rx="14" ry="18" fill="#1e293b"/>
  <!-- Eyes -->
  <circle cx="82" cy="80" r="4" fill="#0f172a"/>
  <circle cx="118" cy="80" r="4" fill="#0f172a"/>

  <!-- Body -->
  <ellipse cx="100" cy="145" rx="38" ry="32" fill="#94a3b8"/>
  <ellipse cx="100" cy="148" rx="22" ry="22" fill="#f1f5f9"/>

  <!-- Juice Cup with Straw -->
  <polygon points="85,135 115,135 110,170 90,170" fill="#fb923c" stroke="#ea580c" stroke-width="3"/>
  <line x1="102" y1="135" x2="115" y2="105" stroke="#f43f5e" stroke-width="5" stroke-linecap="round"/>
  <circle cx="100" cy="150" r="6" fill="#fed7aa"/>
</svg>
`);

// 13. Cute bear sitting on grass (matches user image 13): "sit on the grass"
const BEAR_SIT_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- Ears -->
  <circle cx="56" cy="55" r="22" fill="#38bdf8" stroke="#0284c7" stroke-width="4"/>
  <circle cx="56" cy="55" r="12" fill="#bae6fd"/>
  <circle cx="144" cy="55" r="22" fill="#38bdf8" stroke="#0284c7" stroke-width="4"/>
  <circle cx="144" cy="55" r="12" fill="#bae6fd"/>

  <!-- Body -->
  <ellipse cx="100" cy="142" rx="48" ry="38" fill="#7dd3fc" stroke="#0284c7" stroke-width="4"/>
  <ellipse cx="100" cy="144" rx="28" ry="24" fill="#ffffff"/>

  <!-- Cute Sitting Feet / Paws -->
  <ellipse cx="60" cy="165" rx="18" ry="14" fill="#38bdf8" stroke="#0284c7" stroke-width="3"/>
  <circle cx="60" cy="165" r="7" fill="#fbcfe8"/>
  <ellipse cx="140" cy="165" rx="18" ry="14" fill="#38bdf8" stroke="#0284c7" stroke-width="3"/>
  <circle cx="140" cy="165" r="7" fill="#fbcfe8"/>

  <!-- Head -->
  <circle cx="100" cy="85" r="42" fill="#7dd3fc" stroke="#0284c7" stroke-width="4"/>

  <!-- Cheeks -->
  <circle cx="68" cy="92" r="7" fill="#f472b6" opacity="0.8"/>
  <circle cx="132" cy="92" r="7" fill="#f472b6" opacity="0.8"/>

  <!-- Muzzle -->
  <ellipse cx="100" cy="92" rx="16" ry="12" fill="#ffffff"/>
  <ellipse cx="100" cy="88" rx="5" ry="4" fill="#0f172a"/>
  <path d="M96 93 Q100 97 104 93" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>

  <!-- Eyes -->
  <circle cx="82" cy="80" r="4.5" fill="#0f172a"/>
  <circle cx="80.5" cy="78" r="1.5" fill="#ffffff"/>
  <circle cx="118" cy="80" r="4.5" fill="#0f172a"/>
  <circle cx="116.5" cy="78" r="1.5" fill="#ffffff"/>

  <!-- Front Paws resting on belly -->
  <ellipse cx="80" cy="125" rx="12" ry="10" fill="#38bdf8" stroke="#0284c7" stroke-width="3"/>
  <ellipse cx="120" cy="125" rx="12" ry="10" fill="#38bdf8" stroke="#0284c7" stroke-width="3"/>
</svg>
`);

// Preset High-Resolution Backgrounds
export const PRESET_BACKGROUNDS = [
  {
    id: 'garden-crystal-clear',
    name: 'Khu vườn trong vắt (Ultra-Clear Garden)',
    url: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
        <defs>
          <linearGradient id="skyVivid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#7dd3fc"/>
            <stop offset="50%" stop-color="#bae6fd"/>
            <stop offset="100%" stop-color="#fef9c3"/>
          </linearGradient>
          <linearGradient id="grassVivid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#86efac"/>
            <stop offset="50%" stop-color="#4ade80"/>
            <stop offset="100%" stop-color="#16a34a"/>
          </linearGradient>
          <linearGradient id="waterVivid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="100%" stop-color="#0284c7"/>
          </linearGradient>
          <linearGradient id="woodTable" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#b45309"/>
          </linearGradient>
        </defs>
        <!-- Sky & Sun -->
        <rect width="1600" height="900" fill="url(#skyVivid)"/>
        <circle cx="1380" cy="140" r="75" fill="#fef08a" opacity="0.95"/>
        <circle cx="1380" cy="140" r="95" fill="#fde047" opacity="0.4"/>
        
        <!-- Fluffy crisp clouds -->
        <g fill="#ffffff" opacity="0.9">
          <ellipse cx="280" cy="130" rx="90" ry="45"/>
          <circle cx="230" cy="120" r="50"/>
          <circle cx="330" cy="125" r="45"/>
          
          <ellipse cx="850" cy="110" rx="110" ry="50"/>
          <circle cx="790" cy="100" r="55"/>
          <circle cx="910" cy="105" r="50"/>
        </g>

        <!-- Distant cartoon cozy house & fence -->
        <rect x="520" y="160" width="480" height="260" rx="12" fill="#fffbeb" stroke="#fcd34d" stroke-width="4"/>
        <polygon points="500,170 760,70 1020,170" fill="#f87171" stroke="#dc2626" stroke-width="5"/>
        <rect x="620" y="210" width="100" height="110" rx="8" fill="#e0f2fe" stroke="#38bdf8" stroke-width="6"/>
        <rect x="800" y="210" width="100" height="110" rx="8" fill="#e0f2fe" stroke="#38bdf8" stroke-width="6"/>
        <rect x="710" y="300" width="90" height="120" rx="6" fill="#fde68a" stroke="#d97706" stroke-width="4"/>

        <!-- Rolling Green Lawn Hills -->
        <path d="M0 450 Q400 360 850 430 Q1250 460 1600 390 L1600 900 L0 900 Z" fill="url(#grassVivid)"/>

        <!-- Wooden garden fence -->
        <g fill="#fed7aa" stroke="#c2410c" stroke-width="3">
          <rect x="60" y="440" width="18" height="90" rx="4"/>
          <rect x="130" y="440" width="18" height="90" rx="4"/>
          <rect x="200" y="440" width="18" height="90" rx="4"/>
          <rect x="270" y="440" width="18" height="90" rx="4"/>
          <rect x="340" y="440" width="18" height="90" rx="4"/>
          <rect x="40" y="470" width="340" height="16" rx="4"/>
          <rect x="40" y="500" width="340" height="16" rx="4"/>
        </g>

        <!-- Crystal Clear Swimming Pool -->
        <ellipse cx="320" cy="690" rx="250" ry="110" fill="#bae6fd" stroke="#0284c7" stroke-width="10"/>
        <ellipse cx="310" cy="700" rx="220" ry="85" fill="url(#waterVivid)"/>
        <!-- Water ripples -->
        <path d="M180 690 Q240 670 300 690 T420 690" fill="none" stroke="#e0f2fe" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
        <path d="M220 720 Q280 705 340 720 T460 720" fill="none" stroke="#e0f2fe" stroke-width="5" stroke-linecap="round" opacity="0.8"/>

        <!-- Picnic / Study Table on Patio -->
        <g stroke="#78350f" stroke-width="5">
          <ellipse cx="1150" cy="700" rx="260" ry="75" fill="url(#woodTable)"/>
          <rect x="960" y="720" width="28" height="140" fill="#92400e"/>
          <rect x="1310" y="720" width="28" height="140" fill="#92400e"/>
          <!-- Wooden bench -->
          <ellipse cx="1150" cy="810" rx="300" ry="35" fill="#d97706"/>
        </g>

        <!-- Fresh flowers and shrubs -->
        <g>
          <circle cx="680" cy="680" r="14" fill="#fb7185"/>
          <circle cx="720" cy="670" r="16" fill="#f43f5e"/>
          <circle cx="760" cy="685" r="15" fill="#fbbf24"/>
          <circle cx="800" cy="670" r="18" fill="#ec4899"/>
          <circle cx="840" cy="680" r="15" fill="#f43f5e"/>

          <circle cx="1480" cy="620" r="18" fill="#fbbf24"/>
          <circle cx="1520" cy="610" r="16" fill="#ec4899"/>
          <circle cx="1550" cy="625" r="15" fill="#38bdf8"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'garden-cafe',
    name: 'Khu vườn gốc (Garden Original)',
    url: '/assets/aistudio/image_cca75b44.png',
  },
  {
    id: 'cartoon-park',
    name: 'Công viên xanh (Sunny Park)',
    url: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#bae6fd"/>
            <stop offset="60%" stop-color="#e0f2fe"/>
            <stop offset="100%" stop-color="#fef9c3"/>
          </linearGradient>
          <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#86efac"/>
            <stop offset="40%" stop-color="#4ade80"/>
            <stop offset="100%" stop-color="#22c55e"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="675" fill="url(#skyGrad)"/>
        <!-- Soft clouds -->
        <circle cx="200" cy="120" r="60" fill="#ffffff" opacity="0.8"/>
        <circle cx="260" cy="100" r="70" fill="#ffffff" opacity="0.8"/>
        <circle cx="320" cy="120" r="50" fill="#ffffff" opacity="0.8"/>
        <circle cx="850" cy="150" r="50" fill="#ffffff" opacity="0.8"/>
        <circle cx="910" cy="130" r="65" fill="#ffffff" opacity="0.8"/>
        <!-- Sun -->
        <circle cx="1080" cy="100" r="55" fill="#fde047" opacity="0.9"/>
        <!-- Distant Hills -->
        <path d="M0 380 Q300 280 600 360 T1200 340 L1200 675 L0 675 Z" fill="#bbf7d0"/>
        <!-- Main Lawn -->
        <path d="M0 430 Q450 350 900 420 Q1050 440 1200 400 L1200 675 L0 675 Z" fill="url(#grassGrad)"/>
        <!-- Cute pond -->
        <ellipse cx="280" cy="530" rx="180" ry="70" fill="#38bdf8" stroke="#7dd3fc" stroke-width="8"/>
        <ellipse cx="260" cy="540" rx="140" ry="45" fill="#0ea5e9"/>
        <!-- Flower bed -->
        <circle cx="750" cy="560" r="10" fill="#f43f5e"/>
        <circle cx="780" cy="570" r="12" fill="#fbbf24"/>
        <circle cx="810" cy="555" r="9" fill="#ec4899"/>
        <circle cx="840" cy="565" r="11" fill="#f43f5e"/>
        <!-- Wooden picnic table -->
        <rect x="880" y="470" width="180" height="24" rx="6" fill="#b45309"/>
        <rect x="910" y="494" width="16" height="60" fill="#78350f"/>
        <rect x="1010" y="494" width="16" height="60" fill="#78350f"/>
        <rect x="860" y="530" width="220" height="14" rx="4" fill="#92400e"/>
      </svg>
    `),
  },
  {
    id: 'classroom-interior',
    name: 'Phòng học vui vẻ (Classroom)',
    url: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
        <rect width="1200" height="420" fill="#fef3c7"/>
        <rect y="420" width="1200" height="255" fill="#fde68a"/>
        <!-- Floor wooden planks -->
        <line x1="0" y1="480" x2="1200" y2="480" stroke="#f59e0b" stroke-width="3"/>
        <line x1="0" y1="540" x2="1200" y2="540" stroke="#f59e0b" stroke-width="3"/>
        <line x1="0" y1="600" x2="1200" y2="600" stroke="#f59e0b" stroke-width="3"/>
        <!-- Blackboard -->
        <rect x="250" y="70" width="700" height="300" rx="16" fill="#15803d" stroke="#b45309" stroke-width="14"/>
        <rect x="270" y="90" width="660" height="260" rx="8" fill="#14532d"/>
        <!-- Window -->
        <rect x="40" y="80" width="150" height="220" rx="12" fill="#e0f2fe" stroke="#ffffff" stroke-width="8"/>
        <line x1="115" y1="80" x2="115" y2="300" stroke="#ffffff" stroke-width="6"/>
        <line x1="40" y1="190" x2="190" y2="190" stroke="#ffffff" stroke-width="6"/>
      </svg>
    `),
  },
  {
    id: 'cozy-room',
    name: 'Căn phòng ấm cúng (Cozy Room)',
    url: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
        <rect width="1200" height="450" fill="#fce7f3"/>
        <rect y="450" width="1200" height="225" fill="#fed7aa"/>
        <!-- Bookshelf -->
        <rect x="80" y="60" width="220" height="360" rx="8" fill="#b45309"/>
        <rect x="95" y="80" width="190" height="70" fill="#fef08a"/>
        <rect x="95" y="170" width="190" height="70" fill="#bae6fd"/>
        <rect x="95" y="260" width="190" height="70" fill="#bbf7d0"/>
        <!-- Carpet -->
        <ellipse cx="600" cy="550" rx="350" ry="85" fill="#f472b6" stroke="#db2777" stroke-width="4"/>
        <ellipse cx="600" cy="550" rx="300" ry="65" fill="#fbcfe8"/>
      </svg>
    `),
  },
];

// Default Initial Classes
export const DEFAULT_CLASSROOMS: Classroom[] = [
  {
    id: 'class-daily-activities',
    name: 'Lớp 3A - Hoạt động hàng ngày (Daily Activities)',
    description: 'Bộ thẻ từ vựng các hành động thú vị: bơi lội, đạp xe, xem phim, đi học...',
    backgroundImageUrl: '/assets/aistudio/image_cca75b44.png',
    maxMistakes: 3,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now(),
    items: [
      {
        id: 'act-1',
        word: 'go for a swim',
        imageUrl: DUCK_SWIM_SVG,
        silhouetteColor: '#000000',
        x: 12,
        y: 67,
        scale: 1.15,
        numberLabel: 1,
      },
      {
        id: 'act-2',
        word: 'go for a ride',
        imageUrl: FOX_BIKE_SVG,
        silhouetteColor: '#000000',
        x: 23,
        y: 86,
        scale: 1.2,
        numberLabel: 2,
      },
      {
        id: 'act-3',
        word: 'read a comic book',
        imageUrl: BEAR_BOOK_SVG,
        silhouetteColor: '#000000',
        x: 5,
        y: 30,
        scale: 1.15,
        numberLabel: 3,
      },
      {
        id: 'act-4',
        word: 'drive a car',
        imageUrl: RABBIT_CAR_SVG,
        silhouetteColor: '#000000',
        x: 40,
        y: 90,
        scale: 1.2,
        numberLabel: 4,
      },
      {
        id: 'act-5',
        word: 'watch 3D movie',
        imageUrl: CAT_MUSIC_SVG,
        silhouetteColor: '#000000',
        x: 90,
        y: 26,
        scale: 1.25,
        numberLabel: 5,
      },
      {
        id: 'act-6',
        word: 'work on laptop',
        imageUrl: DOG_LAPTOP_SVG,
        silhouetteColor: '#000000',
        x: 72,
        y: 22,
        scale: 1.2,
        numberLabel: 6,
      },
      {
        id: 'act-7',
        word: 'water the flowers',
        imageUrl: HAMSTER_WATER_SVG,
        silhouetteColor: '#000000',
        x: 21,
        y: 30,
        scale: 1.25,
        numberLabel: 7,
      },
      {
        id: 'act-8',
        word: 'play football',
        imageUrl: PANDA_BALL_SVG,
        silhouetteColor: '#000000',
        x: 80,
        y: 67,
        scale: 1.35,
        numberLabel: 8,
      },
      {
        id: 'act-9',
        word: 'drink fruit juice',
        imageUrl: KOALA_JUICE_SVG,
        silhouetteColor: '#000000',
        x: 44,
        y: 15,
        scale: 1.2,
        numberLabel: 9,
      },
      {
        id: 'act-10',
        word: 'walk to school',
        imageUrl: PIG_SCHOOL_SVG,
        silhouetteColor: '#000000',
        x: 59,
        y: 16,
        scale: 1.15,
        numberLabel: 10,
      },
      {
        id: 'act-11',
        word: 'eat an apple',
        imageUrl: SQUIRREL_APPLE_SVG,
        silhouetteColor: '#000000',
        x: 60,
        y: 48,
        scale: 1.2,
        numberLabel: 11,
      },
      {
        id: 'act-12',
        word: 'sleep in bed',
        imageUrl: SLEEPING_CAT_SVG,
        silhouetteColor: '#000000',
        x: 47,
        y: 47,
        scale: 1.2,
        numberLabel: 12,
      },
      {
        id: 'act-13',
        word: 'sit on the grass',
        imageUrl: BEAR_SIT_SVG,
        silhouetteColor: '#000000',
        x: 54,
        y: 76,
        scale: 1.2,
        numberLabel: 13,
      },
    ],
  },
  {
    id: 'class-animals',
    name: 'Lớp 4B - Động vật đáng yêu (Cute Animals)',
    description: 'Từ vựng các con vật dễ thương dành cho học sinh tiểu học',
    backgroundImageUrl: PRESET_BACKGROUNDS[1].url,
    maxMistakes: 3,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now(),
    items: [
      {
        id: 'ani-1',
        word: 'yellow duckling',
        imageUrl: DUCK_SWIM_SVG,
        silhouetteColor: '#000000',
        x: 22,
        y: 72,
        scale: 1.1,
        numberLabel: 1,
      },
      {
        id: 'ani-2',
        word: 'clever fox',
        imageUrl: FOX_BIKE_SVG,
        silhouetteColor: '#000000',
        x: 48,
        y: 68,
        scale: 1.1,
        numberLabel: 2,
      },
      {
        id: 'ani-3',
        word: 'smart puppy dog',
        imageUrl: DOG_LAPTOP_SVG,
        silhouetteColor: '#000000',
        x: 78,
        y: 65,
        scale: 1.1,
        numberLabel: 3,
      },
      {
        id: 'ani-4',
        word: 'cheerful piggy',
        imageUrl: PIG_SCHOOL_SVG,
        silhouetteColor: '#000000',
        x: 35,
        y: 35,
        scale: 1.05,
        numberLabel: 4,
      },
      {
        id: 'ani-5',
        word: 'white bunny rabbit',
        imageUrl: RABBIT_CAR_SVG,
        silhouetteColor: '#000000',
        x: 65,
        y: 35,
        scale: 1.05,
        numberLabel: 5,
      },
    ],
  },
];
