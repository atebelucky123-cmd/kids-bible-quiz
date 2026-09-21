import { Image } from 'react-native';

// Client-supplied Age Error Smiley (assets/emoji.svg). Rasterized to PNG
// rather than rendered via react-native-svg's SvgXml: the source art is a
// ~1,160-path richly-shaded illustration (gradient shading traced into
// many small vector shapes), and SvgXml parses that whole XML string at
// runtime on every mount — measured multiple seconds of main-thread block
// on this screen, which is the age-rejection screen a child hits right
// after signing up, so it's the last place to make them wait. This is a
// fixed-size icon with no need for vector scaling, so a PNG (generated at
// 480x480 for a crisp render up to that size) avoids the cost entirely.
const smiley = require('../../../assets/images/age-error-smiley.png');

export function AgeErrorIcon({ size = 120 }: { size?: number }) {
  return <Image source={smiley} style={{ width: size, height: size }} resizeMode="contain" />;
}
