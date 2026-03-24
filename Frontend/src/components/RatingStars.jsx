import React from 'react';
import { Star } from 'lucide-react';

const RatingStars = ({ rating = 0, size = 16, showCount = false, count = 0 }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} size={size} className="fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star size={size} className="text-yellow-400" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star size={size} className="fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={i} size={size} className="text-gray-300" />
        ))}
      </div>
      {showCount && count > 0 && (
        <span className="text-xs text-gray-500 ml-1">({count})</span>
      )}
    </div>
  );
};

export default RatingStars;