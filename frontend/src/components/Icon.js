import React from 'react';
import { Ionicons, MaterialIcons, Feather, FontAwesome, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { colors } from '../theme';

export const iconFamilies = {
  ionicons: Ionicons,
  material: MaterialIcons,
  materialCommunity: MaterialCommunityIcons,
  feather: Feather,
  fontAwesome: FontAwesome,
  ant: AntDesign,
};

export default function Icon({
  name,
  family = 'ionicons',
  size = 20,
  color = colors.text,
  style,
  ...rest
}) {
  const IconSet = iconFamilies[family] || Ionicons;
  return <IconSet name={name} size={size} color={color} style={style} {...rest} />;
}
