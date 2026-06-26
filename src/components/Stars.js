import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Stars({ rating = 0, size = 16, onChange, color = '#ffa502' }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity
          key={i}
          onPress={() => onChange?.(i)}
          disabled={!onChange}
          activeOpacity={0.7}
        >
          <Ionicons
            name={i <= Math.round(rating) ? 'star' : 'star-outline'}
            size={size}
            color={i <= Math.round(rating) ? color : '#ddd'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}
