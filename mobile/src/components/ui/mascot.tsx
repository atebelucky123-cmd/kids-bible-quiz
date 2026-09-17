import { SvgXml } from 'react-native-svg';

// Client-supplied mascot (3 poses), sourced from assets/mascot-*.svg at the
// project root. Embedded here as strings rather than loaded as files, since
// this Expo project doesn't have an SVG-as-component Metro transformer set
// up (that's more setup than three static poses need).
const POSES = {
  wave: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <g stroke="#14172e" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M89 144h9v24h-9z" fill="#e8b98e"/>
    <path d="M102 144h9v24h-9z" fill="#e8b98e"/>
    <ellipse cx="91" cy="171" rx="10.5" ry="6" fill="#f8981d"/>
    <ellipse cx="109" cy="171" rx="10.5" ry="6" fill="#f8981d"/>
    <path d="M100 88c12 0 20 5 22 14l7 34c1 5-2 8-7 8H78c-5 0-8-3-7-8l7-34c2-9 10-14 22-14z" fill="#3a4ca0"/>
    <path d="M80 122h40" fill="none" stroke="#c6f24e" stroke-width="6"/>
    <path d="M82 96 56 122" fill="none" stroke="#e8b98e" stroke-width="11"/>
    <path d="M118 96l30-26" fill="none" stroke="#e8b98e" stroke-width="11"/>
    <circle cx="53" cy="125" r="7.5" fill="#e8b98e"/>
    <circle cx="151" cy="67" r="7.5" fill="#e8b98e"/>
    <circle cx="100" cy="62" r="26" fill="#e8b98e"/>
    <path d="M100 34c17 0 26 10 26 21 0 3.5-2 5-4.5 5-4 0-5-5-10-5-3.5 0-5 2.5-11.5 2.5S88.5 55 85 55c-5 0-6 5-10 5-2.5 0-4.5-1.5-4.5-5 0-11 9-21 26-21z" fill="#33231a"/>
    <circle cx="72" cy="46" r="11" fill="#33231a"/>
    <circle cx="128" cy="46" r="11" fill="#33231a"/>
    <path d="M91 72c3 3.5 15 3.5 18 0" fill="none" stroke-width="3.6"/>
  </g>
  <circle cx="90" cy="62" r="3.6" fill="#14172e"/>
  <circle cx="110" cy="62" r="3.6" fill="#14172e"/>
  <circle cx="91.2" cy="60.8" r="1.2" fill="#fff"/>
  <circle cx="111.2" cy="60.8" r="1.2" fill="#fff"/>
  <ellipse cx="79" cy="71" rx="4.8" ry="3.1" fill="#f0917f" opacity=".7"/>
  <ellipse cx="121" cy="71" rx="4.8" ry="3.1" fill="#f0917f" opacity=".7"/>
</svg>`,
  shrug: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <g stroke="#14172e" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M89 144h9v24h-9z" fill="#e8b98e"/>
    <path d="M102 144h9v24h-9z" fill="#e8b98e"/>
    <ellipse cx="91" cy="171" rx="10.5" ry="6" fill="#f8981d"/>
    <ellipse cx="109" cy="171" rx="10.5" ry="6" fill="#f8981d"/>
    <path d="M100 88c12 0 20 5 22 14l7 34c1 5-2 8-7 8H78c-5 0-8-3-7-8l7-34c2-9 10-14 22-14z" fill="#3a4ca0"/>
    <path d="M80 122h40" fill="none" stroke="#c6f24e" stroke-width="6"/>
    <path d="M82 96 52 106" fill="none" stroke="#e8b98e" stroke-width="11"/>
    <path d="M118 96l30 10" fill="none" stroke="#e8b98e" stroke-width="11"/>
    <circle cx="48" cy="109" r="7.5" fill="#e8b98e"/>
    <circle cx="152" cy="109" r="7.5" fill="#e8b98e"/>
    <circle cx="100" cy="62" r="26" fill="#e8b98e"/>
    <path d="M100 34c17 0 26 10 26 21 0 3.5-2 5-4.5 5-4 0-5-5-10-5-3.5 0-5 2.5-11.5 2.5S88.5 55 85 55c-5 0-6 5-10 5-2.5 0-4.5-1.5-4.5-5 0-11 9-21 26-21z" fill="#33231a"/>
    <circle cx="72" cy="46" r="11" fill="#33231a"/>
    <circle cx="128" cy="46" r="11" fill="#33231a"/>
    <ellipse cx="100" cy="76" rx="5" ry="4.2" fill="#a24a3e"/>
    <path d="M84 52c3.5-2.5 7.5-2.5 11 0" fill="none" stroke-width="3"/>
    <path d="M105 52c3.5-2.5 7.5-2.5 11 0" fill="none" stroke-width="3"/>
  </g>
  <circle cx="90" cy="64" r="3.6" fill="#14172e"/>
  <circle cx="110" cy="64" r="3.6" fill="#14172e"/>
  <circle cx="91.2" cy="62.8" r="1.2" fill="#fff"/>
  <circle cx="111.2" cy="62.8" r="1.2" fill="#fff"/>
  <ellipse cx="79" cy="73" rx="4.8" ry="3.1" fill="#f0917f" opacity=".7"/>
  <ellipse cx="121" cy="73" rx="4.8" ry="3.1" fill="#f0917f" opacity=".7"/>
</svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <g stroke="#14172e" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M89 144h9v24h-9z" fill="#e8b98e"/>
    <path d="M102 144h9v24h-9z" fill="#e8b98e"/>
    <ellipse cx="91" cy="171" rx="10.5" ry="6" fill="#f8981d"/>
    <ellipse cx="109" cy="171" rx="10.5" ry="6" fill="#f8981d"/>
    <path d="M100 88c12 0 20 5 22 14l7 34c1 5-2 8-7 8H78c-5 0-8-3-7-8l7-34c2-9 10-14 22-14z" fill="#3a4ca0"/>
    <path d="M80 122h40" fill="none" stroke="#c6f24e" stroke-width="6"/>
    <path d="M82 96 56 122" fill="none" stroke="#e8b98e" stroke-width="11"/>
    <path d="M118 96l26-28" fill="none" stroke="#e8b98e" stroke-width="11"/>
    <circle cx="53" cy="125" r="7.5" fill="#e8b98e"/>
    <circle cx="100" cy="62" r="26" fill="#e8b98e"/>
    <path d="M100 34c17 0 26 10 26 21 0 3.5-2 5-4.5 5-4 0-5-5-10-5-3.5 0-5 2.5-11.5 2.5S88.5 55 85 55c-5 0-6 5-10 5-2.5 0-4.5-1.5-4.5-5 0-11 9-21 26-21z" fill="#33231a"/>
    <circle cx="72" cy="46" r="11" fill="#33231a"/>
    <circle cx="128" cy="46" r="11" fill="#33231a"/>
    <path d="M91 72c3 3.5 15 3.5 18 0" fill="none" stroke-width="3.6"/>
    <g transform="translate(152 56)"><path d="M0-16 3.9-5.4 15.2-4.9 6.3 2.1 9.4 12.9 0 6.7-9.4 12.9-6.3 2.1-15.2-4.9-3.9-5.4z" fill="#ffc713"/></g>
    <circle cx="146" cy="66" r="7.5" fill="#e8b98e"/>
  </g>
  <circle cx="90" cy="62" r="3.6" fill="#14172e"/>
  <circle cx="110" cy="62" r="3.6" fill="#14172e"/>
  <circle cx="91.2" cy="60.8" r="1.2" fill="#fff"/>
  <circle cx="111.2" cy="60.8" r="1.2" fill="#fff"/>
  <ellipse cx="79" cy="71" rx="4.8" ry="3.1" fill="#f0917f" opacity=".7"/>
  <ellipse cx="121" cy="71" rx="4.8" ry="3.1" fill="#f0917f" opacity=".7"/>
</svg>`,
} as const;

export function Mascot({ pose, size = 140 }: { pose: keyof typeof POSES; size?: number }) {
  return <SvgXml xml={POSES[pose]} width={size} height={size} />;
}
