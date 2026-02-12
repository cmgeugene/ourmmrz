import React, { useState, useRef, useMemo } from 'react';
import { View, Text, PanResponder, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StarRatingInputProps {
    rating: number;
    onRatingChange: (rating: number) => void;
    size?: number;
    color?: string;
    disabled?: boolean;
}

export const StarRatingInput: React.FC<StarRatingInputProps> = ({
    rating,
    onRatingChange,
    size = 32,
    color = "#FFD700",
    disabled = false
}) => {
    const [viewLayout, setViewLayout] = useState<{ x: number, width: number } | null>(null);
    const viewRef = useRef<View>(null);

    const handleLayout = () => {
        viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
            setViewLayout({ x: pageX, width });
        });
    };

    const handleTouch = (pageX: number) => {
        if (!viewLayout || disabled) return;

        const relativeX = pageX - viewLayout.x;
        const starWidth = viewLayout.width / 5;

        // Calculate raw rating (0 to 5)
        let rawRating = relativeX / starWidth;

        // Clamp between 0 and 5
        rawRating = Math.max(0, Math.min(5, rawRating));

        // Round to nearest 0.5
        const rounded = Math.ceil(rawRating * 2) / 2;

        const newRating = Math.max(0.5, Math.min(5, rounded));

        if (newRating !== rating) {
            onRatingChange(newRating);
        }
    };

    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onStartShouldSetPanResponderCapture: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponderCapture: () => !disabled,

        onPanResponderGrant: (evt) => {
            handleTouch(evt.nativeEvent.pageX);
        },
        onPanResponderMove: (evt) => {
            handleTouch(evt.nativeEvent.pageX);
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: () => {
            // Optional: snap to final value? already handling in move
        }
    }), [viewLayout, rating, disabled]); // Re-create if layout changes (rare) or disabled changes

    return (
        <View
            ref={viewRef}
            className="flex-row items-center justify-center p-2"
            onLayout={handleLayout}
            {...panResponder.panHandlers}
        >
            {[1, 2, 3, 4, 5].map((star) => {
                let iconName: any = "star";

                if (rating >= star) {
                    iconName = "star";
                } else if (rating >= star - 0.5) {
                    iconName = "star-half";
                } else {
                    iconName = "star-outline";
                }

                return (
                    <Ionicons
                        key={star}
                        name={iconName}
                        size={size}
                        color={color}
                        style={{ marginHorizontal: 4 }}
                    />
                );
            })}
        </View>
    );
};

interface StarRatingDisplayProps {
    rating: number | null | undefined;
    size?: number;
    color?: string;
}

export const StarRatingDisplay: React.FC<StarRatingDisplayProps> = ({
    rating,
    size = 14,
    color = "#FFD700"
}) => {
    // If rating is missing or 0, don't display anything
    if (rating === undefined || rating === null || rating === 0) {
        return null;
    }

    return (
        <View className="flex-row items-center mr-2">
            {[1, 2, 3, 4, 5].map((star) => {
                let iconName: any = "star";
                if (rating >= star) {
                    iconName = "star";
                } else if (rating >= star - 0.5) {
                    iconName = "star-half";
                } else {
                    iconName = "star-outline";
                }

                return (
                    <Ionicons
                        key={star}
                        name={iconName}
                        size={size}
                        color={color}
                        style={{ marginRight: 1 }}
                    />
                );
            })}
        </View>
    );
};

export const CompactStarRatingDisplay: React.FC<StarRatingDisplayProps> = ({
    rating,
    size = 14,
    color = "#FFD700"
}) => {
    // If rating is missing or 0, don't display anything
    if (rating === undefined || rating === null || rating === 0) {
        return null;
    }

    return (
        <View className="flex-row items-center mr-1 bg-yellow-50 px-1.5 py-0.5 rounded-md border border-yellow-100">
            <Ionicons name="star" size={size} color={color} style={{ marginRight: 2 }} />
            <Text className="text-yellow-700 text-[10px] font-bold font-sans">
                {rating.toFixed(1)}
            </Text>
        </View>
    );
};
